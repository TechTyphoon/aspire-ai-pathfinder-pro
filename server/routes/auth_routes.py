# server/routes/auth_routes.py
"""
Authentication routes for user registration and login.
Handles creating new user accounts and issuing JWTs for authentication.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import SQLAlchemyError # For more specific DB error handling

from ..models import User, db
from ..utils import make_error_response, is_valid_email, MAX_INPUT_STRING_LENGTH

# Blueprint for authentication routes, prefixed with /api
auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api')

@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Registers a new user.
    Expects 'email' and 'password' in JSON request body.
    Validates input, checks for existing users, hashes password, and stores user.
    Returns:
        JSON response with success message and user_id, or error message.
    """
    # Retrieve Bcrypt instance from current_app extensions, initialized in app.py
    bcrypt_instance = current_app.extensions.get('bcrypt')
    if not bcrypt_instance:
        current_app.logger.error("Bcrypt not initialized on Flask app.")
        return make_error_response("Server configuration error for hashing.", 500)

    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return make_error_response("Email and password are required", 400)

        if not is_valid_email(email):
            return make_error_response("Invalid email format", 400)

        if len(email) > MAX_INPUT_STRING_LENGTH:
            return make_error_response(f"Email exceeds maximum length of {MAX_INPUT_STRING_LENGTH} characters", 400)

        if len(password) < 6:
            return make_error_response("Password must be at least 6 characters long", 400)
        if len(password) > MAX_INPUT_STRING_LENGTH:
            return make_error_response(f"Password exceeds maximum length of {MAX_INPUT_STRING_LENGTH} characters", 400)

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return make_error_response("Email already registered", 409)

        hashed_password = bcrypt_instance.generate_password_hash(password).decode('utf-8')
        new_user = User(email=email, password_hash=hashed_password)

        db.session.add(new_user)
        db.session.commit()
        current_app.logger.info(f"User registered successfully: {email} (ID: {new_user.id})")
        return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error during registration for {email}: {e}", exc_info=True)
        return make_error_response("Registration failed due to a database error.", 500)
    except Exception as e:
        db.session.rollback() # Ensure rollback for any other unexpected errors
        current_app.logger.error(f"Unexpected error during registration for {email}: {e}", exc_info=True)
        return make_error_response("Registration failed. Please try again.", 500)

@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Logs in an existing user.
    Expects 'email' and 'password' in JSON request body.
    Validates credentials and returns a JWT access token upon success.
    Returns:
        JSON response with success message, user_id, access_token, or error message.
    """
    bcrypt_instance = current_app.extensions.get('bcrypt')
    if not bcrypt_instance:
        current_app.logger.error("Bcrypt not initialized on Flask app for login.")
        return make_error_response("Server configuration error for hashing.", 500)

    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return make_error_response("Email and password are required", 400)

        if not is_valid_email(email):
            return make_error_response("Invalid email format provided for login", 400)

        if len(email) > MAX_INPUT_STRING_LENGTH:
             return make_error_response(f"Email exceeds maximum length of {MAX_INPUT_STRING_LENGTH} characters", 400)

        user = User.query.filter_by(email=email).first()

        if user and bcrypt_instance.check_password_hash(user.password_hash, password):
            # Create JWT token
            access_token = create_access_token(identity=str(user.id)) # Use stringified user.id as the identity
            current_app.logger.info(f"User login successful for email: {email} (ID: {user.id})")
            return jsonify({
                "message": "Login successful",
                "user_id": user.id, # Keep user_id as int in response for convenience if clients expect it
                "access_token": access_token
            }), 200
        else:
            current_app.logger.warning(f"Login attempt failed for email: {email}")
            return make_error_response("Invalid email or password", 401)

    except Exception as e:
        current_app.logger.error(f"Unexpected error during login for email {data.get('email', 'N/A')}: {e}", exc_info=True)
        return make_error_response("An unexpected server error occurred during login.", 500)
