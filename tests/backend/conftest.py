import pytest
import tempfile
import os
import shutil # For removing temporary instance path
from flask_bcrypt import Bcrypt # Import Bcrypt
from flask import jsonify # Import jsonify for test route
from server.app import create_app
from server.models import db, User # Import User if needed for setup, or other models

@pytest.fixture(scope='session')
def app():
    """
    Session-wide test `Flask` application.
    Ensures the app is created once per test session.
    """
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    # Create a temporary directory for the instance path
    temp_instance_path = tempfile.mkdtemp()

    test_config = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}",
        "JWT_SECRET_KEY": "test_jwt_secret_key",
        "SECRET_KEY": "test_secret_key",
        "GEMINI_API_KEY": None,
        "GEMINI_MODEL_INSTANCE": None, # Ensure AI model is None or a mock for tests
        "BCRYPT_LOG_ROUNDS": 4,  # Speed up bcrypt hashing for tests
        "SERVER_NAME": "localhost.test", # Optional: for URL building if needed
        # Flask will automatically use temp_instance_path due to instance_relative_config=True
        # and if app.instance_path is set, or by default it creates an 'instance' folder.
        # We override the default DB path to be outside instance for this temp file.
    }

    # Create app with test config passed directly
    # The create_app function should be modified to accept instance_path or set it
    app = create_app(config_overrides=test_config)

    # If create_app doesn't handle instance_path setting for testing, set it explicitly:
    # app.instance_path = temp_instance_path
    # However, Flask(..., instance_relative_config=True) and os.path.join(app.instance_path,...)
    # in create_app should handle this if the default instance dir is acceptable for non-db things.
    # The DB is explicitly outside instance_path here.

    # Ensure Bcrypt is registered on the test app instance
    # This check helps diagnose if create_app's Bcrypt initialization isn't effective
    # under the test configuration or context.
    if 'bcrypt' not in app.extensions:
        # This would indicate an issue with how create_app initializes extensions
        # when config_overrides are passed, or a context issue.
        # Forcing it here for the tests to proceed.
        app.logger.warning("Bcrypt extension not found from create_app, re-initializing for test app.")
        Bcrypt(app)
    elif not app.extensions['bcrypt']:
        # It's in extensions but it's None or Falsy
        app.logger.warning("Bcrypt extension was found but was Falsy, re-initializing for test app.")
        Bcrypt(app)


    with app.app_context():
        db.create_all() # Create all tables for the test database

    # --- Test routes for debugging status codes ---
    @app.route('/_test/error400')
    def test_error_route_400():
        from server.utils import make_error_response
        return make_error_response("Test error", 400)

    @app.route('/_test/success201')
    def test_success_route_201():
        return jsonify({"message": "Test success"}), 201
    # --- End Test routes ---

    yield app # Provide the app instance to tests

    # Teardown: close and remove the temporary database and instance path
    with app.app_context():
        db.session.remove()
        # db.drop_all() # Not strictly necessary with temp file that gets deleted
    os.close(db_fd)
    os.unlink(db_path)
    shutil.rmtree(temp_instance_path) # Clean up the temporary instance directory


@pytest.fixture()
def client(app):
    """
    A test client for the app.
    This fixture depends on the `app` fixture.
    """
    return app.test_client()


@pytest.fixture()
def runner(app):
    """
    A test CLI runner for the app.
    """
    return app.test_cli_runner()


@pytest.fixture(scope="function")
def init_database(app):
    """
    Function-scoped fixture to ensure a clean database for each test.
    It depends on the session-scoped `app` fixture.
    """
    with app.app_context():
        db.drop_all() # Drop all tables
        db.create_all() # Recreate all tables
        yield db # Provide the db instance, if needed by tests
        # db.session.remove()
        # db.drop_all() # Clean up after test, already handled by next test's drop/create

@pytest.fixture
def new_user_data():
    """Provides default data for a new user."""
    return {
        "email": "testuser@example.com",
        "password": "password123"
    }

@pytest.fixture
def registered_user(client, new_user_data, init_database):
    """Registers a new user and returns the response and user data."""
    response = client.post('/api/register', json=new_user_data)
    assert response.status_code == 201 # Ensure registration was successful
    return {"response": response.get_json(), "data": new_user_data}

@pytest.fixture
def authenticated_client(client, registered_user):
    """Provides an authenticated test client and the user_id."""
    login_data = {
        "email": registered_user["data"]["email"],
        "password": registered_user["data"]["password"]
    }
    response = client.post('/api/login', json=login_data)
    assert response.status_code == 200
    token = response.get_json().get("access_token")
    user_id = response.get_json().get("user_id")

    # Set the authorization header for subsequent requests
    client.environ_base['HTTP_AUTHORIZATION'] = f'Bearer {token}'

    # Return client and user_id (which is the JWT identity)
    return client, user_id
