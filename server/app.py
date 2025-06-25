# server/app.py
import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask App
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a_default_fallback_secret_key_if_not_set')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///aspiro.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Extensions
# Note: We import 'db' from models.py where it's declared, then initialize it here.
# This avoids circular imports if models need 'app' context for some reason,
# though for simple model definitions, it's often fine to init db before model imports.
# However, current models.py declares db = SQLAlchemy() which is a common pattern.
# We will use that instance and initialize it with our app.
from models import db, User, SavedPath # User, SavedPath will be used in subsequent steps
db.init_app(app) # Initialize the db instance from models.py with the Flask app

bcrypt = Bcrypt(app)
CORS(app) # Enable CORS for all routes and origins by default

# Database creation
# This function can be called via a CLI command or before the first request in a dev environment.
# For simplicity here, we'll use @app.before_request during development.
# In production, you'd typically use Flask-Migrate or a dedicated CLI command.
# A flag to ensure create_all is called only once.
_db_created = False

@app.before_request
def create_tables_dev():
    global _db_created
    if app.debug and not _db_created: # Only run in debug mode and once
        with app.app_context():
            db.create_all()
        _db_created = True
        app.logger.info('Database tables created (development mode).')

# --- API Endpoints ---

# User Registration
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400

    email = data.get('email')
    password = data.get('password')

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 409 # 409 Conflict

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password_hash=hashed_password)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully", "user_id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error registering user: {e}")
        return jsonify({"error": "Registration failed. Please try again."}), 500

# User Login
@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        # In a real app, you'd generate a JWT token here
        return jsonify({"message": "Login successful", "user_id": user.id}), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

# --- Career Path Endpoints ---

# Save a new career path
@app.route('/api/save-path', methods=['POST'])
def save_career_path():
    data = request.get_json()
    user_id = data.get('user_id')
    path_name = data.get('path_name')
    path_details_json = data.get('path_details_json') # This should be a dict/object from frontend

    if not all([user_id, path_name]): # path_details_json can be optional
        return jsonify({"error": "user_id and path_name are required"}), 400

    # Optional: Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    new_path = SavedPath(
        user_id=user_id,
        path_name=path_name,
        path_details_json=path_details_json # The setter in model handles json.dumps
    )

    try:
        db.session.add(new_path)
        db.session.commit()
        return jsonify({"message": "Career path saved successfully", "path_id": new_path.id}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error saving path: {e}")
        return jsonify({"error": "Failed to save career path. Please try again."}), 500

# Get all saved paths for a user
@app.route('/api/user/<int:user_id>/paths', methods=['GET'])
def get_user_paths(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    paths = SavedPath.query.filter_by(user_id=user_id).all()

    # Using the to_dict() method from the SavedPath model for serialization
    paths_data = [path.to_dict() for path in paths]

    return jsonify(paths_data), 200

# Delete a saved path
@app.route('/api/delete-path/<int:path_id>', methods=['DELETE'])
def delete_career_path(path_id):
    path_to_delete = SavedPath.query.get(path_id)

    if not path_to_delete:
        return jsonify({"error": "Path not found"}), 404

    # Optional: Add ownership check here if needed, e.g., ensure the user deleting
    # is the owner of the path. For now, any authenticated user (if we had auth tokens)
    # or any request can delete any path if they know its ID.
    # This would typically involve getting user_id from a JWT token.

    try:
        db.session.delete(path_to_delete)
        db.session.commit()
        return jsonify({"message": "Career path deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting path: {e}")
        return jsonify({"error": "Failed to delete career path. Please try again."}), 500


# Example Root Route (for testing if the server is up)
@app.route('/')
def index():
    return jsonify({"message": "Welcome to ASPIRO AI Backend!"}), 200

if __name__ == '__main__':
    # In a typical Flask setup, you might run `flask run` via CLI.
    # The `db.create_all()` would ideally be part of a `flask init-db` command.
    # For simplicity of running `python app.py` directly:
    with app.app_context():
        # db.create_all() # Ensure tables are created when running directly
        # The before_request handler is better for dev if using flask run
        pass
    app.run(debug=True) # debug=True is fine for development
