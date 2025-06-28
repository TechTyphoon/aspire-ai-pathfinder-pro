# server/routes/path_routes.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity # Import jwt_required and get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from ..models import User, SavedPath, db # Assuming models.py is one level up
from ..utils import make_error_response, MAX_PATH_NAME_LENGTH

path_bp = Blueprint('path_bp', __name__, url_prefix='/api')

@path_bp.route('/save-path', methods=['POST'])
@jwt_required() # Protect this route
def save_career_path_route():
    current_user_id = get_jwt_identity() # Get user_id from JWT
    try:
        data = request.get_json()
        # user_id = data.get('user_id') # No longer get user_id from request body
        path_name = data.get('path_name')
        path_details_json = data.get('path_details_json')

        # user_id is now current_user_id from JWT, so direct validation of it from request is removed.
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
        return jsonify({"message": "Career path saved successfully", "path_id": new_path.id}), 201

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error saving path: {e}")
        return make_error_response("Failed to save career path due to a database error.", 500, details=str(e))
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error saving path: {e}")
        return make_error_response("Failed to save career path. Please try again.", 500, details=str(e))

# Changed route to /user/paths - it will get paths for the currently authenticated user
@path_bp.route('/user/paths', methods=['GET'])
@jwt_required()
def get_user_paths_route():
    current_user_id = get_jwt_identity()
    try:
        # user_id parameter is removed, current_user_id from JWT is used
        user = db.session.get(User, current_user_id)
        if not user:
            current_app.logger.error(f"User with ID {current_user_id} from JWT not found in database.")
            return make_error_response("Authenticated user not found in database", 404)

        paths = SavedPath.query.filter_by(user_id=current_user_id).all() # Keep filter_by for non-primary key query
        paths_data = [path.to_dict() for path in paths]
        return jsonify(paths_data), 200

    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error fetching paths for user {user_id}: {e}")
        return make_error_response("Failed to retrieve saved paths due to a database error.", 500, details=str(e))
    except Exception as e:
        current_app.logger.error(f"Unexpected error fetching paths for user {user_id}: {e}")
        return make_error_response("Failed to retrieve saved paths.", 500, details=str(e))

@path_bp.route('/delete-path/<int:path_id>', methods=['DELETE'])
@jwt_required() # Protect this route
def delete_career_path_route(path_id):
    current_user_id = get_jwt_identity() # Get current user's ID
    try:
        path_to_delete = db.session.get(SavedPath, path_id)

        if not path_to_delete:
            return make_error_response("Path not found", 404)

        # Enforce ownership: User can only delete their own paths
        # path_to_delete.user_id is an Integer. current_user_id (from JWT) is a String. Convert for comparison.
        if path_to_delete.user_id != int(current_user_id):
            current_app.logger.warning(f"User {current_user_id} (str) attempted to delete path {path_id} owned by user {path_to_delete.user_id} (int). Ownership check failed.")
            return make_error_response("Forbidden: You do not own this path", 403)

        db.session.delete(path_to_delete)
        db.session.commit()
        return jsonify({"message": "Career path deleted successfully"}), 200

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error deleting path {path_id}: {e}")
        return make_error_response("Failed to delete career path due to a database error.", 500, details=str(e))
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected error deleting path {path_id}: {e}")
        return make_error_response("Failed to delete career path. Please try again.", 500, details=str(e))
