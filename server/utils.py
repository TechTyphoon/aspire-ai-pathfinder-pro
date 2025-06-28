# server/utils.py
import re
from pypdf import PdfReader # Changed from PyPDF2
import docx # python-docx
from io import BytesIO
from flask import jsonify, current_app # current_app for logger

# --- Custom Exceptions ---
class AIServiceError(Exception):
    """Base class for AI service related errors."""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.status_code = status_code

class AIServiceUnavailable(AIServiceError):
    """Custom exception for when the AI service is unavailable."""
    def __init__(self, message="AI service is not configured or unavailable."):
        super().__init__(message, status_code=503)

class AIContentGenerationError(AIServiceError):
    """Custom exception for errors during AI content generation."""
    def __init__(self, message="AI content generation failed."):
        super().__init__(message, status_code=500)

# --- Input Validation Helpers ---
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def is_valid_email(email):
    if email and EMAIL_REGEX.match(email):
        return True
    return False

MAX_FILENAME_LENGTH = 255
MAX_INPUT_STRING_LENGTH = 255
MAX_TARGET_ROLE_LENGTH = 150
MAX_CAREER_FIELD_LENGTH = 150
MAX_PATH_NAME_LENGTH = 200
# ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES are now primarily managed in app.config
# These constants can serve as defaults if not found in config, or be removed if config is always expected.
# For now, let's remove them here to enforce usage from app.config.
# ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'} # Will get from current_app.config
# MAX_FILE_SIZE_MB = 10 # Will get from current_app.config
# MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024 # Will get from current_app.config

def allowed_file(filename, allowed_extensions_config):
    """
    Checks if a filename has an allowed extension.
    :param filename: The name of the file.
    :param allowed_extensions_config: A set of allowed extensions from app config.
    :return: True if allowed, False otherwise.
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions_config

# --- Response Helpers ---
def make_error_response(message, status_code, details=None):
    response_data = {"error": message}
    if details:
        response_data["details"] = str(details)
    return jsonify(response_data), status_code

# --- File Processing Helper ---
def extract_text_from_file(file_storage):
    filename = file_storage.filename
    text = ""
    try:
        # Ensure stream is at the beginning before reading
        file_storage.seek(0)
        if filename.endswith('.pdf'):
            reader = PdfReader(BytesIO(file_storage.read()))
            for page in reader.pages:
                text += page.extract_text() or "" # Ensure None is handled
        elif filename.endswith('.docx'):
            doc = docx.Document(BytesIO(file_storage.read()))
            for para in doc.paragraphs:
                text += para.text + "\n"
        elif filename.endswith('.txt'): # Added basic txt support
            text = file_storage.read().decode('utf-8', errors='ignore')
        else:
            return None
    except Exception as e:
        current_app.logger.error(f"Error extracting text from {filename}: {e}")
        return None
    return text

# --- AI Content Generation Helper ---
# Note: This function relies on 'gemini_model' being available in its execution context.
# When using blueprints, 'gemini_model' will be imported from the main app module.
def generate_ai_content(gemini_model_instance, prompt_parts): # Pass gemini_model explicitly
    if not gemini_model_instance:
        raise AIServiceUnavailable("AI service is not configured or unavailable.")
    try:
        response = gemini_model_instance.generate_content(prompt_parts)
        # Robust response parsing
        if response.parts:
            return "".join(part.text for part in response.parts if hasattr(part, 'text'))
        elif hasattr(response, 'text') and response.text: # Fallback for simpler text responses
             return response.text
        else:
            # Check for finish_reason if no parts/text (e.g. safety block)
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                current_app.logger.warning(f"Gemini content generation blocked. Reason: {response.prompt_feedback.block_reason_message or response.prompt_feedback.block_reason}")
                raise AIContentGenerationError(f"Content generation blocked by AI safety filters: {response.prompt_feedback.block_reason_message or response.prompt_feedback.block_reason}")
            current_app.logger.error("Gemini response format not recognized or empty.")
            raise AIContentGenerationError("AI response format not recognized or empty.")
    except Exception as e:
        current_app.logger.error(f"Gemini API call failed: {e}")
        raise AIContentGenerationError(f"AI content generation failed: {type(e).__name__}")
