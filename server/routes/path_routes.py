# server/routes/path_routes.py
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.exc import SQLAlchemyError
from ..models import User, SavedPath, db # Assuming models.py is one level up
from ..utils import make_error_response, MAX_PATH_NAME_LENGTH

path_bp = Blueprint('path_bp', __name__, url_prefix='/api')

@path_bp.route('/save-path', methods=['POST'])
def save_career_path_route():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        path_name = data.get('path_name')
        path_details_json = data.get('path_details_json')

        if not user_id or not isinstance(user_id, int):
            return make_error_response("Valid user_id is required", 400)
        if not path_name:
            return make_error_response("path_name is required", 400)
        if len(path_name) > MAX_PATH_NAME_LENGTH:
            return make_error_response(f"Path name exceeds maximum length of {MAX_PATH_NAME_LENGTH} characters", 400)

        user = User.query.get(user_id)
        if not user:
            return make_error_response("User not found", 404)

        new_path = SavedPath(
            user_id=user_id,
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

@path_bp.route('/user/<int:user_id>/paths', methods=['GET'])
def get_user_paths_route(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return make_error_response("User not found", 404)

        paths = SavedPath.query.filter_by(user_id=user_id).all()
        paths_data = [path.to_dict() for path in paths]
        return jsonify(paths_data), 200

    except SQLAlchemyError as e:
        current_app.logger.error(f"Database error fetching paths for user {user_id}: {e}")
        return make_error_response("Failed to retrieve saved paths due to a database error.", 500, details=str(e))
    except Exception as e:
        current_app.logger.error(f"Unexpected error fetching paths for user {user_id}: {e}")
        return make_error_response("Failed to retrieve saved paths.", 500, details=str(e))

@path_bp.route('/delete-path/<int:path_id>', methods=['DELETE'])
def delete_career_path_route(path_id):
    try:
        path_to_delete = SavedPath.query.get(path_id)

        if not path_to_delete:
            return make_error_response("Path not found", 404)

        # Optional: Add ownership check here
        # For example, if using JWTs, get current_user.id and compare:
        # from flask_jwt_extended import jwt_required, get_jwt_identity
        # @jwt_required()
        # ...
        # current_user_id = get_jwt_identity()
        # if path_to_delete.user_id != current_user_id:
        #     return make_error_response("Forbidden: You do not own this path", 403)


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
