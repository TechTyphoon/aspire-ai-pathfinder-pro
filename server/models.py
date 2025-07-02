# server/models.py
"""
SQLAlchemy database models for the Aspiro AI application.
Includes User and SavedPath models.
"""
from flask_sqlalchemy import SQLAlchemy
import json # For handling JSON data in SavedPath

# Initialize SQLAlchemy instance.
# This instance is configured and initialized with the Flask app in `app.py`.
db = SQLAlchemy()

class User(db.Model):
    """
    User model for storing user accounts and authentication information.

    Attributes:
        id (int): Primary key for the user.
        email (str): Unique email address for the user, used for login.
        password_hash (str): Hashed password for the user.
        saved_paths (relationship): One-to-many relationship with SavedPath model,
                                    representing paths saved by this user.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, comment="User's unique email address.")
    password_hash = db.Column(db.String(128), nullable=False, comment="Hashed password for user authentication.")

    saved_paths = db.relationship(
        'SavedPath',
        backref='author',
        lazy='dynamic',
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        """String representation of the User object, primarily for debugging."""
        return f"<User {self.id}: {self.email}>"

class SavedPath(db.Model):
    """
    SavedPath model for storing career paths or related information saved by users.

    Attributes:
        id (int): Primary key for the saved path.
        path_name (str): User-defined name for the saved path (e.g., "AI Engineer Path").
        _path_details_json (str): Internal storage for path details as a JSON string.
                                 Accessed via the `path_details_json` property.
        user_id (int): Foreign key linking to the `users.id` who saved this path.
        author (User): Relationship back to the User who owns this path (via backref).
    """
    __tablename__ = 'saved_paths'

    id = db.Column(db.Integer, primary_key=True)
    path_name = db.Column(db.String(200), nullable=False, comment="User-defined name for the saved path.")

    # Storing path_details as a JSON string in a Text field.
    # This approach is chosen for broad compatibility (especially with SQLite).
    # For databases with robust JSON type support (like PostgreSQL), db.JSON could be an alternative.
    _path_details_json = db.Column(db.Text, nullable=True, name='path_details_json', comment="Stores path details as a JSON string.")

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment="Foreign key to the user who saved this path.")

    @property
    def path_details_json(self):
        """
        Property getter for `path_details_json`.
        Deserializes the JSON string from `_path_details_json` into a Python dictionary.
        Returns None if the stored value is None or if JSON decoding fails.
        """
        if self._path_details_json is None:
            return None
        try:
            return json.loads(self._path_details_json)
        except json.JSONDecodeError:
            # Log error or handle more gracefully if malformed JSON is a concern
            # For now, returning None if decoding fails.
            return None

    @path_details_json.setter
    def path_details_json(self, value: dict | None):
        """
        Property setter for `path_details_json`.
        Serializes a Python dictionary `value` into a JSON string and stores it
        in `_path_details_json`. If `value` is None, `_path_details_json` is set to None.

        Args:
            value (dict | None): The dictionary to store, or None.
        """
        if value is None:
            self._path_details_json = None
        else:
            self._path_details_json = json.dumps(value)

    def __repr__(self):
        """String representation of the SavedPath object, primarily for debugging."""
        return f"<SavedPath {self.id}: '{self.path_name}' (User ID: {self.user_id})>"

    def to_dict(self) -> dict:
        """
        Serializes the SavedPath object to a dictionary.
        This is useful for preparing JSON responses in API routes.

        Returns:
            dict: A dictionary representation of the SavedPath instance.
        """
        return {
            'id': self.id,
            'path_name': self.path_name,
            'path_details_json': self.path_details_json, # Accesses the property getter
            'user_id': self.user_id
        }
