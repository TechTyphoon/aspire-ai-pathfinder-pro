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
load_dotenv()

def create_app(config_overrides=None):
    app = Flask(__name__, instance_relative_config=True) # Enable instance folder

    # --- Default Configuration ---
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

    # Create instance folder if it doesn't exist
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        app.logger.error(f"Could not create instance path at {app.instance_path}")
        pass # Or handle error more gracefully

    # Apply overrides if provided (e.g., for testing)
    if config_overrides:
        app.config.from_mapping(config_overrides)

    # Gemini API Key Configuration & Model Initialization
    # Use app.config.get as it might be overridden by test config to None
    GEMINI_API_KEY = app.config.get('GEMINI_API_KEY')
    gemini_model_instance = None # Initialize to None
    if not GEMINI_API_KEY:
        app.logger.warning("GEMINI_API_KEY not found in .env file. AI features will be disabled.")
    else:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            gemini_model_instance = genai.GenerativeModel('gemini-pro')
            app.logger.info("Gemini AI client configured successfully.")
        except Exception as e:
            app.logger.error(f"Error configuring Gemini AI client: {e}")

    # Store the model instance in app.config so blueprints can access it
    app.config['GEMINI_MODEL_INSTANCE'] = gemini_model_instance

    # --- Initialize Extensions ---
    db.init_app(app)
    Migrate(app, db) # Initialize Flask-Migrate

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
    app.register_blueprint(auth_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(path_bp)

    # --- Database Creation (Handled by Flask-Migrate now) ---
    # # This ensures tables are created within the app context, useful for dev or first run.
    # # In production, migrations (e.g., Flask-Migrate) are preferred.
    # with app.app_context():
    #     db.create_all()
    #     app.logger.info('Database tables checked/created.')

    # --- Root Route for Health Check ---
    @app.route('/')
    def index():
        return jsonify({"message": "Welcome to ASPIRO AI Backend! Server is running."}), 200

    return app

# This setup is for running with `flask run` or a WSGI server like Gunicorn.
# If you want to run `python app.py` directly, you'd do:
# if __name__ == '__main__':
#     app = create_app()
#     app.run(debug=True)

app = create_app() # Create the app instance for WSGI servers or `flask run`
