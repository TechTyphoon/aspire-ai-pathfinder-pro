# server/routes/ai_routes.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity # Import jwt_required and get_jwt_identity
from ..utils import (
    make_error_response, extract_text_from_file, generate_ai_content,
    allowed_file, # MAX_FILE_SIZE_BYTES and MAX_FILE_SIZE_MB are removed from here
    MAX_TARGET_ROLE_LENGTH, MAX_CAREER_FIELD_LENGTH,
    AIServiceError # Import custom AI exceptions
)
from ..prompts import (
    get_resume_feedback_prompt,
    get_role_suggestion_prompt,
    get_career_exploration_prompt
)

ai_bp = Blueprint('ai_bp', __name__, url_prefix='/api')

@ai_bp.route('/analyze-resume', methods=['POST'])
@jwt_required() # Protect this route
def analyze_resume_route():
    # user_id = get_jwt_identity() # Get the ID of the current user
    # current_app.logger.info(f"User {user_id} accessing /analyze-resume") # Example of using user_id
    gemini_model_instance = current_app.config.get('GEMINI_MODEL_INSTANCE') # Get model from app config
    try:
        if 'resume_file' not in request.files:
            return make_error_response("No resume file provided ('resume_file' field missing)", 400)

        file = request.files['resume_file']
        target_role = request.form.get('target_role', '')

        if file.filename == '':
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
        return jsonify({"analysis": ai_response_text}), 200

    except AIServiceError as e:
        current_app.logger.error(f"AI Service Error in /analyze-resume: {str(e)}")
        return make_error_response(str(e), e.status_code)
    except Exception as e:
        current_app.logger.error(f"Unexpected error in /api/analyze-resume: {e}")
        return make_error_response("An unexpected server error occurred.", 500, details=str(e))

@ai_bp.route('/suggest-roles', methods=['POST'])
@jwt_required() # Protect this route
def suggest_roles_route():
    # user_id = get_jwt_identity() # Get the ID of the current user
    # current_app.logger.info(f"User {user_id} accessing /suggest-roles")
    gemini_model_instance = current_app.config.get('GEMINI_MODEL_INSTANCE')
    try:
        if 'resume_file' not in request.files:
            return make_error_response("No resume file provided ('resume_file' field missing)", 400)

        file = request.files['resume_file']
        if file.filename == '':
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
        return jsonify({"suggestions": ai_response_text}), 200

    except AIServiceError as e:
        current_app.logger.error(f"AI Service Error in /suggest-roles: {str(e)}")
        return make_error_response(str(e), e.status_code)
    except Exception as e:
        current_app.logger.error(f"Unexpected error in /api/suggest-roles: {e}")
        return make_error_response("An unexpected server error occurred.", 500, details=str(e))

@ai_bp.route('/explore-path', methods=['POST'])
@jwt_required() # Protect this route
def explore_career_path_route():
    # user_id = get_jwt_identity() # Get the ID of the current user
    # current_app.logger.info(f"User {user_id} accessing /explore-path")
    gemini_model_instance = current_app.config.get('GEMINI_MODEL_INSTANCE')
    try:
        data = request.get_json()
        career_field = data.get('career_field')

        if not career_field:
            return make_error_response("career_field is required", 400)

        if len(career_field) > MAX_CAREER_FIELD_LENGTH:
            return make_error_response(f"Career field name exceeds maximum length of {MAX_CAREER_FIELD_LENGTH} characters", 400)

        prompt_parts = get_career_exploration_prompt(career_field)

        ai_response_text = generate_ai_content(gemini_model_instance, prompt_parts)
        return jsonify({"career_field": career_field, "report": ai_response_text}), 200

    except AIServiceError as e:
        current_app.logger.error(f"AI Service Error in /explore-path: {str(e)}")
        return make_error_response(str(e), e.status_code)
    except Exception as e:
        current_app.logger.error(f"Unexpected error in /api/explore-path: {e}")
        return make_error_response("An unexpected server error occurred.", 500, details=str(e))
