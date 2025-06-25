# server/app.py
import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv

import PyPDF2
import docx # python-docx
from io import BytesIO # To handle file streams

# Load environment variables from .env file
load_dotenv()

# Helper function to extract text from uploaded files
def extract_text_from_file(file_storage):
    """
    Extracts text from an uploaded file (PDF or DOCX).
    :param file_storage: Werkzeug FileStorage object from Flask request.
    :return: Extracted text as a string, or None if extraction fails or file type is unsupported.
    """
    filename = file_storage.filename
    text = ""
    try:
        if filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(BytesIO(file_storage.read()))
            for page_num in range(len(pdf_reader.pages)):
                text += pdf_reader.pages[page_num].extract_text()
        elif filename.endswith('.docx'):
            doc = docx.Document(BytesIO(file_storage.read()))
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            # Unsupported file type
            return None
    except Exception as e:
        app.logger.error(f"Error extracting text from {filename}: {e}")
        return None # Or raise an exception
    return text

import google.generativeai as genai

# Initialize Flask App
app = Flask(__name__)

# Configuration
# Gemini API Key Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    app.logger.warning("GEMINI_API_KEY not found in .env file. AI features will not work.")
    gemini_model = None
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-pro') # Or specific model needed
        app.logger.info("Gemini AI client configured successfully.")
    except Exception as e:
        app.logger.error(f"Error configuring Gemini AI client: {e}")
        gemini_model = None

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

# Helper to check Gemini model and make API call
def generate_gemini_content(prompt_parts):
    if not gemini_model:
        return jsonify({"error": "AI service is not configured or unavailable."}), 503
    try:
        # For gemini-pro, prompt_parts should be a list of strings or specific content parts
        response = gemini_model.generate_content(prompt_parts)
        # Assuming the response has a 'text' attribute or similar for simple text output.
        # For complex objects or streaming, this might need adjustment.
        # Refer to Gemini API documentation for exact response structure.
        # Example: response.text or response.parts[0].text
        # If the API returns markdown, it will be in response.text
        return response.text
    except Exception as e:
        app.logger.error(f"Gemini API call failed: {e}")
        # Provide a more generic error to the client for security
        return jsonify({"error": "AI content generation failed."}), 500


@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume():
    if 'resume_file' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    file = request.files['resume_file']
    target_role = request.form.get('target_role', '') # Get target_role from form data

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not target_role:
        return jsonify({"error": "Target role is required"}), 400

    if file:
        resume_text = extract_text_from_file(file)
        if resume_text is None:
            return jsonify({"error": "Could not extract text from file or file type unsupported."}), 400

        # Expert-level "Resume Feedback" prompt (conceptual)
        # This prompt would be carefully designed to guide Gemini.
        prompt_parts = [
            "You are an expert career advisor and resume reviewer.",
            "Analyze the following resume text for the target role of an ATS (Applicant Tracking System) and human recruiter:",
            f"Target Role: {target_role}\n\n",
            "Resume Text:\n",
            "```\n",
            resume_text,
            "\n```\n\n",
            "Provide detailed feedback covering these areas:\n"
            "1.  **ATS Compatibility Score (1-100):** Estimate how well this resume would pass through an ATS for the target role. Explain your reasoning briefly.",
            "2.  **Strengths:** What are the strongest parts of this resume for this role?",
            "3.  **Areas for Improvement:** What specific sections or points could be improved? Be actionable.",
            "4.  **Keyword Analysis:** Are relevant keywords for the target role present? Suggest missing keywords if any.",
            "5.  **Overall Impression & Suggestions:** Give a final summary and any other critical advice.",
            "\nFormat your response clearly, using markdown for headings and lists."
        ]

        ai_response_text = generate_gemini_content(prompt_parts)

        if isinstance(ai_response_text, tuple): # Error response from generate_gemini_content
            return ai_response_text

        return jsonify({"analysis": ai_response_text}), 200

    return jsonify({"error": "File processing error"}), 500


@app.route('/api/suggest-roles', methods=['POST'])
def suggest_roles():
    if 'resume_file' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    file = request.files['resume_file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        resume_text = extract_text_from_file(file)
        if resume_text is None:
            return jsonify({"error": "Could not extract text from file or file type unsupported."}), 400

        # Expert-level "Role Suggestion" prompt (conceptual)
        prompt_parts = [
            "You are an expert career counselor and talent acquisition specialist.",
            "Based on the following resume text, identify the top 3-5 most suitable career roles for this individual. ",
            "For each suggested role, provide:",
            "   a. Role Title",
            "   b. A brief explanation (2-3 sentences) why this role is a good fit based on the resume.",
            "   c. Key skills from the resume that align with this role.",
            "   d. Potential industries where this role is common.",
            "\nResume Text:\n",
            "```\n",
            resume_text,
            "\n```\n\n",
            "Consider a diverse range of roles, including those that might be a slight pivot but leverage existing strengths.",
            "Format your response as a list of suggestions, using markdown for clarity (e.g., headings for each role)."
        ]

        ai_response_text = generate_gemini_content(prompt_parts)

        if isinstance(ai_response_text, tuple): # Error response from generate_gemini_content
            return ai_response_text

        return jsonify({"suggestions": ai_response_text}), 200

    return jsonify({"error": "File processing error"}), 500


@app.route('/api/explore-path', methods=['POST'])
def explore_career_path():
    data = request.get_json()
    if not data or not data.get('career_field'):
        return jsonify({"error": "career_field is required"}), 400

    career_field = data.get('career_field')

    # Expert-level "Career Exploration" prompt (conceptual)
    prompt_parts = [
        f"You are an expert career analyst and industry researcher.",
        f"Generate a detailed report on the career field: '{career_field}'.",
        "The report should include the following sections:",
        "1.  **Overview:** A brief description of the field.",
        "2.  **Key Responsibilities:** Common tasks and duties.",
        "3.  **Required Skills:** Technical and soft skills needed.",
        "4.  **Educational Pathways:** Typical degrees or certifications.",
        "5.  **Salary Expectations:** General salary ranges (mention variability by location/experience).",
        "6.  **Career Outlook & Trends:** Future prospects and developments in the field.",
        "7.  **Pros & Cons:** Advantages and disadvantages of working in this field.",
        "8.  **Example Job Titles:** A few common job titles within this field.",
        "\nFormat the report clearly, using markdown for headings, lists, and emphasis."
    ]

    ai_response_text = generate_gemini_content(prompt_parts)

    if isinstance(ai_response_text, tuple): # Error response from generate_gemini_content
        return ai_response_text

    # The AI response (report) is expected to be a string, possibly markdown
    return jsonify({"career_field": career_field, "report": ai_response_text}), 200


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
