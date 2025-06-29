# server/utils.py
"""
Utility functions and classes for the Aspiro AI backend.

This module includes:
- Custom exception classes for AI service errors.
- Input validation helpers (e.g., email format, file type).
- Response formatting helpers (e.g., standardized error responses).
- File processing utilities (e.g., text extraction from PDFs, DOCX).
- AI content generation wrappers for interacting with the Google Gemini API.
"""
import re
from pypdf import PdfReader # For PDF text extraction
import docx # python-docx
from io import BytesIO
from flask import jsonify, current_app, Response # Added Response for type hinting

# --- Custom Exceptions ---
class AIServiceError(Exception):
    """
    Base class for AI service related errors.
    Allows associating a status code with the error.
    """
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code

class AIServiceUnavailable(AIServiceError):
    """Custom exception for when the AI service is unavailable (e.g., not configured)."""
    def __init__(self, message: str = "AI service is not configured or unavailable."):
        super().__init__(message, status_code=503) # 503 Service Unavailable

class AIContentGenerationError(AIServiceError):
    """Custom exception for errors occurring during AI content generation by the external service."""
    def __init__(self, message: str = "AI content generation failed."):
        super().__init__(message, status_code=500) # 500 Internal Server Error

# --- Input Validation Helpers ---
# Regular expression for basic email validation.
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def is_valid_email(email: str) -> bool:
    """
    Validates an email address against a basic regex pattern.

    Args:
        email (str): The email address to validate.

    Returns:
        bool: True if the email format is considered valid, False otherwise.
    """
    if email and EMAIL_REGEX.match(email):
        return True
    return False

# Constants for input length validation.
# These help prevent overly long inputs that could lead to performance issues or abuse.
MAX_FILENAME_LENGTH: int = 255
MAX_INPUT_STRING_LENGTH: int = 255 # General purpose string length limit
MAX_TARGET_ROLE_LENGTH: int = 150
MAX_CAREER_FIELD_LENGTH: int = 150
MAX_PATH_NAME_LENGTH: int = 200

# File upload configurations like ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES
# are now primarily managed in `app.config` (see `server/app.py`).
# `allowed_file` function now takes these from config.

def allowed_file(filename: str, allowed_extensions_config: set) -> bool:
    """
    Checks if a filename has an allowed extension based on the provided configuration.

    Args:
        filename (str): The name of the file (e.g., "resume.pdf").
        allowed_extensions_config (set): A set of allowed file extensions (e.g., {'pdf', 'docx'}).

    Returns:
        bool: True if the file extension is in the allowed set, False otherwise.
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions_config

# --- Response Helpers ---
def make_error_response(message: str, status_code: int, details: str | None = None) -> tuple[Response, int]:
    """
    Creates a standardized JSON error response.

    Args:
        message (str): The main error message.
        status_code (int): The HTTP status code for the response.
        details (str, optional): Additional details about the error. Defaults to None.

    Returns:
        tuple[Response, int]: A Flask JSON response object and the status code.
    """
    response_data = {"error": message}
    if details:
        response_data["details"] = str(details)
    return jsonify(response_data), status_code

# --- File Processing Helper ---
def extract_text_from_file(file_storage) -> str | None:
    """
    Extracts text content from an uploaded file (PDF, DOCX, or TXT).

    Args:
        file_storage (FileStorage): A Flask FileStorage object representing the uploaded file.

    Returns:
        str | None: The extracted text content as a string, or None if extraction fails
                    or the file type is unsupported by this function.
    """
    filename = file_storage.filename
    text = ""
    try:
        # Ensure stream is at the beginning before reading, as it might have been read before (e.g., for size check)
        file_storage.seek(0)

        if filename.endswith('.pdf'):
            reader = PdfReader(BytesIO(file_storage.read()))
            for page in reader.pages:
                text += page.extract_text() or "" # Ensure None from extract_text is handled
        elif filename.endswith('.docx'):
            doc = docx.Document(BytesIO(file_storage.read()))
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif filename.endswith('.txt'):
            # Decode as UTF-8, ignore errors for broader compatibility with text files.
            text = file_storage.read().decode('utf-8', errors='ignore')
        else:
            # Unsupported file type by this function
            current_app.logger.warning(f"Attempted to extract text from unsupported file type: {filename}")
            return None
    except Exception as e:
        current_app.logger.error(f"Error extracting text from {filename}: {e}", exc_info=True)
        return None
    return text

# --- AI Content Generation Helper ---
def generate_ai_content(gemini_model_instance, prompt_parts: list) -> str:
    """
    Generates content using the provided Google Gemini model instance and prompt parts.

    Args:
        gemini_model_instance: An initialized instance of `genai.GenerativeModel`.
        prompt_parts (list): A list of parts forming the prompt for the AI model.

    Raises:
        AIServiceUnavailable: If the `gemini_model_instance` is None (not configured).
        AIContentGenerationError: If the AI service call fails, content is blocked,
                                  or the response format is unrecognized.

    Returns:
        str: The generated text content from the AI.
    """
    if not gemini_model_instance:
        raise AIServiceUnavailable("AI service (Gemini model instance) is not configured or unavailable.")
    try:
        response = gemini_model_instance.generate_content(prompt_parts)
        # Robust response parsing: attempt to join text from all parts.
        # Handles cases where response might be structured with multiple parts.
        generated_text = ""
        if response.parts:
            generated_text = "".join(part.text for part in response.parts if hasattr(part, 'text'))

        # Fallback if no text in parts but response itself has text (older SDK versions or simpler responses)
        if not generated_text and hasattr(response, 'text') and response.text:
             generated_text = response.text

        if generated_text:
            return generated_text
        else:
            # If no text parts found, check for safety blocks or other issues.
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                block_reason_msg = response.prompt_feedback.block_reason_message or str(response.prompt_feedback.block_reason)
                current_app.logger.warning(f"Gemini content generation blocked. Reason: {block_reason_msg}")
                raise AIContentGenerationError(f"Content generation blocked by AI safety filters: {block_reason_msg}")

            current_app.logger.error(f"Gemini response format not recognized or empty. Full response: {response}")
            raise AIContentGenerationError("AI response format not recognized or empty.")

    except Exception as e:
        # Catch any other exception during the API call or response processing.
        current_app.logger.error(f"Gemini API call failed: {e}", exc_info=True)
        # Raise a generic AIContentGenerationError, including the type of the original exception for context.
        raise AIContentGenerationError(f"AI content generation encountered an error: {type(e).__name__}")
