# server/routes/path_routes.py
"""
Routes for managing saved career paths.
Allows authenticated users to save, retrieve, and delete their career paths.
All routes are protected and require JWT authentication.
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError # For specific database error handling

from ..models import User, SavedPath, db
from ..utils import make_error_response, MAX_PATH_NAME_LENGTH

# Blueprint for path management routes, prefixed with /api
path_bp = Blueprint('path_bp', __name__, url_prefix='/api')

@path_bp.route('/save-path', methods=['POST'])
@jwt_required()
def save_career_path_route():
    """
    Saves a new career path for the authenticated user.
    Expects 'path_name' (string) and 'path_details_json' (JSON serializable object)
    in the JSON request body.
    User ID is derived from the JWT token.
    Returns:
        JSON response with success message and new path_id, or an error message.
    """
    current_user_id = get_jwt_identity() # String user ID from JWT
    current_app.logger.info(f"User {current_user_id} attempting to save a new path via /api/save-path.")
    try:
        data = request.get_json()
        if data is None: # Changed from `if not data:`
            current_app.logger.warning(f"Invalid or no JSON data received for /save-path from user {current_user_id}.")
            return make_error_response("Invalid or missing JSON request body.", 400)

        path_name = data.get('path_name')
        path_details_json = data.get('path_details_json')

        # User ID is derived from JWT, no need to validate from request.
        if not path_name:
            return make_error_response("path_name is required", 400)
        if len(path_name) > MAX_PATH_NAME_LENGTH:
            return make_error_response(f"Path name exceeds maximum length of {MAX_PATH_NAME_LENGTH} characters", 400)

        user = db.session.get(User, current_user_id) # Fetch user based on JWT identity
        if not user:
            # This case should ideally not happen if JWT is valid and user exists
            current_app.logger.error(f"User with ID {current_user_id} from JWT not found in database.")
            return make_error_response("Authenticated user not found in database", 404)

        new_path = SavedPath(
            user_id=current_user_id, # Use user_id from JWT
            path_name=path_name,
            path_details_json=path_details_json
        )

        db.session.add(new_path)
        db.session.commit()
        current_app.logger.info(f"Career path '{path_name}' saved for user {current_user_id}, path ID: {new_path.id}")
        return jsonify({"message": "Career path saved successfully", "path_id": new_path.id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error saving path for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("Failed to save career path due to a database error.", 500)
    except Exception as e: # Catch any other unexpected errors
        db.session.rollback()
        current_app.logger.error(f"Unexpected error saving path for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("Failed to save career path. Please try again.", 500)

@path_bp.route('/user/paths', methods=['GET'])
@jwt_required()
def get_user_paths_route():
    """
    Retrieves all saved career paths for the currently authenticated user.
    User ID is derived from the JWT token.
    Returns:
        JSON list of saved paths or an error message.
    """
    current_user_id = get_jwt_identity() # String user ID from JWT
    current_app.logger.info(f"User {current_user_id} requesting their saved paths from /api/user/paths.")
    try:
        user = db.session.get(User, current_user_id) # Check if user exists
        if not user:
            current_app.logger.error(f"User with ID {current_user_id} from JWT not found in database.")
            return make_error_response("Authenticated user not found in database", 404)

        paths = SavedPath.query.filter_by(user_id=current_user_id).all() # Keep filter_by for non-primary key query
        paths_data = [path.to_dict() for path in paths]
        current_app.logger.info(f"Retrieved {len(paths_data)} saved paths for user {current_user_id}")
        return jsonify(paths_data), 200

    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error fetching paths for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("Failed to retrieve saved paths due to a database error.", 500)
    except Exception as e: # Catch any other unexpected errors
        current_app.logger.error(f"Unexpected error fetching paths for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("Failed to retrieve saved paths.", 500)

@path_bp.route('/delete-path/<int:path_id>', methods=['DELETE'])
@jwt_required()
def delete_career_path_route(path_id: int):
    """
    Deletes a specific saved career path for the authenticated user.
    The `path_id` is taken from the URL.
    User ID is derived from the JWT, and ownership is checked.
    Args:
        path_id (int): The ID of the career path to delete.
    Returns:
        JSON response with success or error message.
    """
    current_user_id = get_jwt_identity() # String user ID from JWT
    current_app.logger.info(f"User {current_user_id} attempting to delete path ID {path_id} via /api/delete-path.")
    try:
        path_to_delete = db.session.get(SavedPath, path_id)

        if not path_to_delete:
            current_app.logger.warning(f"Path ID {path_id} not found for deletion attempt by user {current_user_id}.")
            return make_error_response("Path not found", 404)

        # Enforce ownership: User can only delete their own paths
        # path_to_delete.user_id is an Integer. current_user_id (from JWT) is a String. Convert for comparison.
        if path_to_delete.user_id != int(current_user_id):
            current_app.logger.warning(f"User {current_user_id} (str) attempted to delete path {path_id} owned by user {path_to_delete.user_id} (int). Ownership check failed.")
            return make_error_response("Forbidden: You do not own this path", 403)

        db.session.delete(path_to_delete)
        db.session.commit()
        current_app.logger.info(f"Career path {path_id} deleted successfully by user {current_user_id}")
        return jsonify({"message": "Career path deleted successfully"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error deleting path {path_id} for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("Failed to delete career path due to a database error.", 500)
    except Exception as e: # Catch any other unexpected errors
        db.session.rollback()
        current_app.logger.error(f"Unexpected error deleting path {path_id} for user {current_user_id}: {e}", exc_info=True)
        return make_error_response("Failed to delete career path. Please try again.", 500)
