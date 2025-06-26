# server/app.py
import os
from flask import Flask, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Import db instance from models to initialize it
from .models import db
# Import blueprints
from .routes.auth_routes import auth_bp
from .routes.ai_routes import ai_bp
from .routes.path_routes import path_bp
# Utils are used within blueprints, no direct import needed here unless for app-level setup

# Load environment variables from .env file
load_dotenv()

def create_app():
    app = Flask(__name__)

    # --- Configuration ---
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a_very_default_secret_key_123')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///aspiro.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # File Upload Configuration (can be accessed by blueprints via current_app.config)
    app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'txt'}
    app.config['MAX_FILE_SIZE_MB'] = 10
    app.config['MAX_FILE_SIZE_BYTES'] = app.config['MAX_FILE_SIZE_MB'] * 1024 * 1024

    # Gemini API Key Configuration & Model Initialization
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
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
    Bcrypt(app) # Initializes bcrypt and stores it in app.extensions['bcrypt']
    CORS(app)

    # --- Register Blueprints ---
    app.register_blueprint(auth_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(path_bp)

    # --- Database Creation ---
    # This ensures tables are created within the app context, useful for dev or first run.
    # In production, migrations (e.g., Flask-Migrate) are preferred.
    with app.app_context():
        db.create_all()
        app.logger.info('Database tables checked/created.')

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
