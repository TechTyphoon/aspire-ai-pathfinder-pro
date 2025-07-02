# server/app.py
import os
from flask import Flask, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager # Import JWTManager
from flask_migrate import Migrate # Import Migrate
from dotenv import load_dotenv
import google.generativeai as genai

# Import db instance from models to initialize it
from .models import db # db instance
from .models import User, SavedPath # Import models for Migrate
# Import blueprints
from .routes.auth_routes import auth_bp
from .routes.ai_routes import ai_bp
from .routes.path_routes import path_bp
# Utils are used within blueprints, no direct import needed here unless for app-level setup

# Load environment variables from .env file
load_dotenv() # Load environment variables from .env file at the module level

def create_app(config_overrides=None):
    """
    Application factory for the Flask app.
    Initializes and configures the Flask application, extensions, and blueprints.

    Args:
        config_overrides (dict, optional): A dictionary of configuration values
                                           to override default settings, primarily used for testing.
                                           Defaults to None.

    Returns:
        Flask: The configured Flask application instance.
    """
    app = Flask(__name__, instance_relative_config=True) # Enable instance folder for e.g. SQLite DB

    # --- Default Configuration ---
    # Load configurations from environment variables or provide defaults.
    # Instance folder is used for the default SQLite database path.
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY', 'a_very_default_secret_key_for_flask_session_etc'),
        JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY', 'a_very_default_jwt_secret_key_12345'),
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(app.instance_path, "aspiro.db")}'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        ALLOWED_EXTENSIONS={'pdf', 'docx', 'txt'},
        MAX_FILE_SIZE_MB=10,
        # GEMINI_API_KEY is loaded from .env by default, can be overridden by config_overrides
        GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')
    )
    app.config['MAX_FILE_SIZE_BYTES'] = app.config['MAX_FILE_SIZE_MB'] * 1024 * 1024

    # Create instance folder if it doesn't exist (e.g., for SQLite database)
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        # Log an error if instance path creation fails, though app might still run
        # if the instance path is not strictly needed for all configurations.
        app.logger.error(f"Could not create instance path at {app.instance_path}")
        pass

    # Apply configuration overrides, typically for testing environment
    if config_overrides:
        app.config.from_mapping(config_overrides)

    # --- Initialize Google Generative AI (Gemini) ---
    # The API key is loaded from app.config, which respects .env and overrides.
    GEMINI_API_KEY = app.config.get('GEMINI_API_KEY')
    gemini_model_instance = None
    if not GEMINI_API_KEY:
        app.logger.warning("GEMINI_API_KEY not found in environment or configuration. AI features will be disabled.")
    else:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            gemini_model_instance = genai.GenerativeModel('gemini-pro') # Or other desired model
            app.logger.info("Google Generative AI client configured successfully with 'gemini-pro' model.")
        except Exception as e:
            app.logger.error(f"Error configuring Google Generative AI client: {e}")

    # Store the Gemini model instance in app.config for access in blueprints
    app.config['GEMINI_MODEL_INSTANCE'] = gemini_model_instance

    # --- Initialize Flask Extensions ---
    db.init_app(app) # Initialize SQLAlchemy
    Migrate(app, db) # Initialize Flask-Migrate for database migrations

    # Initialize Bcrypt and ensure it's stored in extensions
    # Bcrypt() constructor can take app, or use init_app. Using constructor style.
    flask_bcrypt_instance = Bcrypt()
    flask_bcrypt_instance.init_app(app)
    # Flask-Bcrypt should store itself in app.extensions['bcrypt'].
    # If it's not, this is a fallback, but the primary issue would be elsewhere.
    if 'bcrypt' not in app.extensions or app.extensions['bcrypt'] is None:
        app.extensions['bcrypt'] = flask_bcrypt_instance
        app.logger.info("Manually set app.extensions['bcrypt'] in create_app.")


    CORS(app)
    JWTManager(app) # Initialize JWTManager

    # --- Register Blueprints ---
    # Blueprints organize routes into distinct modules.
    app.register_blueprint(auth_bp) # Authentication routes (e.g., /register, /login)
    app.register_blueprint(ai_bp)   # AI-powered routes (e.g., /analyze-resume)
    app.register_blueprint(path_bp) # Career path management routes (e.g., /save-path)


    # --- Root Route for Health Check ---
    @app.route('/')
    def index():
        """
        Health check endpoint for the backend.
        Returns a simple JSON message indicating the server is running.
        """
        return jsonify({"message": "Welcome to ASPIRO AI Backend! Server is running."}), 200

    return app

# Create the Flask app instance when this file is imported or run.
# This instance is used by WSGI servers like Gunicorn or when running with `flask run`.
app = create_app()
