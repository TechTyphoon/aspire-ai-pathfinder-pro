# server/routes/ai_routes.py
"""
AI-powered routes for resume analysis, role suggestions, and career path exploration.
All routes in this blueprint require JWT authentication.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..utils import (
    make_error_response, extract_text_from_file, generate_ai_content,
    allowed_file, MAX_TARGET_ROLE_LENGTH, MAX_CAREER_FIELD_LENGTH,
    AIServiceError, AIServiceUnavailable, AIContentGenerationError # Ensure all custom exceptions are available
)
from ..prompts import (
    get_resume_feedback_prompt,
    get_role_suggestion_prompt,
    get_career_exploration_prompt
)

# Blueprint for AI-related routes, prefixed with /api
ai_bp = Blueprint('ai_bp', __name__, url_prefix='/api')

@ai_bp.route('/analyze-resume', methods=['POST'])
@jwt_required()
def analyze_resume_route():
    """
    Analyzes an uploaded resume for a specific target role using an AI model.
    Requires 'resume_file' (file upload) and 'target_role' (form data) in the request.
    User must be authenticated.
    Returns:
        JSON response with AI-generated analysis or an error message.
    """
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"User {current_user_id} accessed /api/analyze-resume.")
    gemini_model_instance = current_app.config.get('GEMINI_MODEL_INSTANCE')
    try:
        if 'resume_file' not in request.files:
            current_app.logger.warning(f"No resume file provided by user {current_user_id} for /analyze-resume.")
            return make_error_response("No resume file provided ('resume_file' field missing)", 400)

        file = request.files['resume_file']
        target_role = request.form.get('target_role', '')

        current_app.logger.info(f"User {current_user_id} uploading file '{file.filename}' (type: {file.content_type}) for target role '{target_role}'.")

        if file.filename == '':
            current_app.logger.warning(f"Empty filename provided by user {current_user_id} for /analyze-resume.")
            return make_error_response("No file selected for upload", 400)

        # Use config for allowed extensions and file size limits
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'pdf', 'docx', 'txt'})
        max_file_bytes = current_app.config.get('MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024) # Default 10MB
        max_file_mb = current_app.config.get('MAX_FILE_SIZE_MB', 10)


        if not allowed_file(file.filename, allowed_extensions):
            return make_error_response(f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}", 400)

        file_bytes = file.read()
        file.seek(0) # Reset file pointer after reading for size check
        if len(file_bytes) > max_file_bytes:
            return make_error_response(f"File exceeds maximum size of {max_file_mb}MB", 413)

        if not target_role:
            return make_error_response("Target role is required", 400)
        if len(target_role) > MAX_TARGET_ROLE_LENGTH:
            return make_error_response(f"Target role exceeds maximum length of {MAX_TARGET_ROLE_LENGTH} characters", 400)

        resume_text = extract_text_from_file(file) # file has been seek(0)
        if resume_text is None:
            return make_error_response("Could not extract text from file. It might be corrupted or an unsupported format variant.", 400)

        prompt_parts = get_resume_feedback_prompt(target_role, resume_text)

        ai_response_text = generate_ai_content(gemini_model_instance, prompt_parts)
        current_app.logger.info(f"Resume analysis successful for user {current_user_id}, target role: {target_role}")
        return jsonify({"analysis": ai_response_text}), 200

    except AIServiceError as e: # Catches AIServiceUnavailable, AIContentGenerationError
        current_app.logger.error(f"AI Service Error in /analyze-resume for user {current_user_id}: {e}", exc_info=True)
        return make_error_response(str(e), e.status_code)
    except Exception as e: # Catch any other unexpected errors
        current_app.logger.error(f"Unexpected error in /api/analyze-resume for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("An unexpected server error occurred during resume analysis.", 500)

@ai_bp.route('/suggest-roles', methods=['POST'])
@jwt_required()
def suggest_roles_route():
    """
    Analyzes an uploaded resume and suggests suitable career roles using an AI model.
    Requires 'resume_file' (file upload) in the request.
    User must be authenticated.
    Returns:
        JSON response with AI-generated role suggestions or an error message.
    """
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"User {current_user_id} accessed /api/suggest-roles.")
    gemini_model_instance = current_app.config.get('GEMINI_MODEL_INSTANCE')
    try:
        if 'resume_file' not in request.files:
            current_app.logger.warning(f"No resume file provided by user {current_user_id} for /suggest-roles.")
            return make_error_response("No resume file provided ('resume_file' field missing)", 400)

        file = request.files['resume_file']
        current_app.logger.info(f"User {current_user_id} uploading file '{file.filename}' (type: {file.content_type}) for role suggestion.")

        if file.filename == '':
            current_app.logger.warning(f"Empty filename provided by user {current_user_id} for /suggest-roles.")
            return make_error_response("No file selected for upload", 400)

        # Use config for allowed extensions and file size limits
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'pdf', 'docx', 'txt'})
        max_file_bytes = current_app.config.get('MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024) # Default 10MB
        max_file_mb = current_app.config.get('MAX_FILE_SIZE_MB', 10)

        if not allowed_file(file.filename, allowed_extensions):
            return make_error_response(f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}", 400)

        file_bytes = file.read()
        file.seek(0) # Reset file pointer after reading for size check
        if len(file_bytes) > max_file_bytes:
            return make_error_response(f"File exceeds maximum size of {max_file_mb}MB", 413)

        resume_text = extract_text_from_file(file)
        if resume_text is None:
            return make_error_response("Could not extract text from file. It might be corrupted or an unsupported format variant.", 400)

        prompt_parts = get_role_suggestion_prompt(resume_text)

        ai_response_text = generate_ai_content(gemini_model_instance, prompt_parts)
        current_app.logger.info(f"Role suggestion successful for user {current_user_id}")
        return jsonify({"suggestions": ai_response_text}), 200

    except AIServiceError as e: # Catches AIServiceUnavailable, AIContentGenerationError
        current_app.logger.error(f"AI Service Error in /suggest-roles for user {current_user_id}: {e}", exc_info=True)
        return make_error_response(str(e), e.status_code)
    except Exception as e: # Catch any other unexpected errors
        current_app.logger.error(f"Unexpected error in /api/suggest-roles for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("An unexpected server error occurred while suggesting roles.", 500)

@ai_bp.route('/explore-path', methods=['POST'])
@jwt_required()
def explore_career_path_route():
    """
    Provides an AI-generated report for a specified career field.
    Expects 'career_field' (string) in JSON request body.
    User must be authenticated.
    Returns:
        JSON response with the career field and AI-generated report, or an error message.
    """
    current_user_id = get_jwt_identity()
    current_app.logger.info(f"User {current_user_id} accessed /api/explore-path.")
    gemini_model_instance = current_app.config.get('GEMINI_MODEL_INSTANCE')
    try:
        data = request.get_json()
        # request.get_json() returns None if parsing fails (with silent=True) or if mimetype isn't application/json.
        # By default (silent=False), it raises a BadRequest (400) if mimetype is wrong or JSON is malformed.
        # So, if 'data' is None here, it implies silent=True was used or an extension changed behavior.
        # However, an empty JSON object {} is valid. The original check `if not data:` would be true for `{}`.
        # We should check for `data is None` if we specifically want to see if get_json() failed to produce a dict.
        # For this route, if data is an empty dict {}, career_field will be None, handled below.
        if data is None: # More specific check than `if not data:`
            current_app.logger.warning(f"JSON data parsing failed or no JSON data received for /explore-path from user {current_user_id}.")
            return make_error_response("Invalid or missing JSON request body.", 400)

        career_field = data.get('career_field')
        current_app.logger.info(f"User {current_user_id} exploring career field: '{career_field}'.")

        if not career_field:
            return make_error_response("career_field is required", 400)

        if len(career_field) > MAX_CAREER_FIELD_LENGTH:
            return make_error_response(f"Career field name exceeds maximum length of {MAX_CAREER_FIELD_LENGTH} characters", 400)

        prompt_parts = get_career_exploration_prompt(career_field)

        ai_response_text = generate_ai_content(gemini_model_instance, prompt_parts)
        current_app.logger.info(f"Career path exploration successful for user {current_user_id}, field: {career_field}")
        return jsonify({"career_field": career_field, "report": ai_response_text}), 200

    except AIServiceError as e: # Catches AIServiceUnavailable, AIContentGenerationError
        current_app.logger.error(f"AI Service Error in /explore-path for user {current_user_id}: {e}", exc_info=True)
        return make_error_response(str(e), e.status_code)
    except Exception as e: # Catch any other unexpected errors
        current_app.logger.error(f"Unexpected error in /api/explore-path for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("An unexpected server error occurred during career path exploration.", 500)
