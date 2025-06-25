# server/models.py
from flask_sqlalchemy import SQLAlchemy
import json # For handling JSON data in SavedPath

# Initialize SQLAlchemy instance.
# This will be properly initialized in app.py with the Flask app context.
# For the purpose of defining models, we can declare it here.
# Actual initialization (db.init_app(app)) will happen in app.py.
db = SQLAlchemy()

class User(db.Model):
    """
    User model for storing user accounts.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False) # Increased length for bcrypt hash

    # Relationship to SavedPath: A user can have many saved paths.
    # backref='author' creates a virtual 'author' attribute on SavedPath instances.
    # lazy='dynamic' means the query for paths is not run until explicitly requested.
    saved_paths = db.relationship('SavedPath', backref='author', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email}>"

class SavedPath(db.Model):
    """
    SavedPath model for storing career paths saved by users.
    """
    __tablename__ = 'saved_paths'

    id = db.Column(db.Integer, primary_key=True)
    path_name = db.Column(db.String(200), nullable=False)

    # Storing path_details as a JSON string in a Text field.
    # You could also use db.JSON if your SQLite version and SQLAlchemy setup support it well,
    # but Text is broadly compatible for storing JSON strings.
    _path_details_json = db.Column(db.Text, nullable=True, name='path_details_json')

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    @property
    def path_details_json(self):
        """
        Getter for path_details_json. Parses the JSON string to a Python dict.
        """
        if self._path_details_json is None:
            return None
        try:
            return json.loads(self._path_details_json)
        except json.JSONDecodeError:
            # Handle cases where the string is not valid JSON, though it should be.
            return None

    @path_details_json.setter
    def path_details_json(self, value):
        """
        Setter for path_details_json. Converts a Python dict to a JSON string.
        """
        if value is None:
            self._path_details_json = None
        else:
            self._path_details_json = json.dumps(value)

    def __repr__(self):
        return f"<SavedPath {self.path_name} (User ID: {self.user_id})>"

    def to_dict(self):
        """
        Helper method to convert SavedPath object to a dictionary,
        useful for JSON responses.
        """
        return {
            'id': self.id,
            'path_name': self.path_name,
            'path_details_json': self.path_details_json, # Uses the property to get parsed JSON
            'user_id': self.user_id
        }
