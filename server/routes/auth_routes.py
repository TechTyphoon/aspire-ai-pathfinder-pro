# server/routes/auth_routes.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token # Import create_access_token
from ..models import User, db # Assuming models.py is one level up
from ..utils import make_error_response, is_valid_email, MAX_INPUT_STRING_LENGTH
# To get bcrypt, we'll import it from the main app instance when blueprint is registered, or pass it.
# For now, let's assume we can import it if app.py initializes it globally.
# A better way is to get it from current_app.extensions['bcrypt'] or similar.
# For simplicity, if app.py defines `bcrypt = Bcrypt(app)`, we might need to pass it or import from app.
# Let's try importing from the main app module.

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api')

@auth_bp.route('/register', methods=['POST'])
def register_user():
    # bcrypt instance will be available via current_app after app initialization
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
        return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201

    except Exception as e: # Catch generic Exception for now, can be more specific
        db.session.rollback()
        current_app.logger.error(f"Error during registration: {e}")
        return make_error_response("Registration failed. Please try again.", 500, details=str(e))

@auth_bp.route('/login', methods=['POST'])
def login_user():
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
            return make_error_response("Invalid email format provided for login", 400)

        if len(email) > MAX_INPUT_STRING_LENGTH:
             return make_error_response(f"Email exceeds maximum length of {MAX_INPUT_STRING_LENGTH} characters", 400)

        user = User.query.filter_by(email=email).first()

        if user and bcrypt_instance.check_password_hash(user.password_hash, password):
            # Create JWT token
            access_token = create_access_token(identity=str(user.id)) # Use stringified user.id as the identity
            return jsonify({
                "message": "Login successful",
                "user_id": user.id, # Keep user_id as int in response for convenience if clients expect it
                "access_token": access_token
            }), 200
        else:
            return make_error_response("Invalid email or password", 401)

    except Exception as e:
        current_app.logger.error(f"Unexpected error during login: {e}")
        return make_error_response("An unexpected server error occurred during login.", 500, details=str(e))
