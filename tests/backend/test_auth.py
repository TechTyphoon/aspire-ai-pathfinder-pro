import pytest
from server.models import User

def test_register_user_success(client, new_user_data, init_database):
    """Test successful user registration."""
    response = client.post('/api/register', json=new_user_data)
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data["message"] == "User registered successfully"
    assert "user_id" in json_data

    # Verify user in database (optional, but good for completeness)
    user = User.query.filter_by(email=new_user_data["email"]).first()
    assert user is not None
    assert user.id == json_data["user_id"]

def test_register_user_duplicate_email(client, registered_user):
    """Test registration with an already registered email."""
    # The `registered_user` fixture already created a user.
    # Now try to register again with the same email.
    new_user_data_dup = {
        "email": registered_user["data"]["email"],
        "password": "anotherpassword"
    }
    response = client.post('/api/register', json=new_user_data_dup)
    assert response.status_code == 409
    json_data = response.get_json()
    assert json_data["error"] == "Email already registered"

def test_register_user_missing_fields(client, init_database):
    """Test registration with missing email or password."""
    # Missing password
    response_missing_pw = client.post('/api/register', json={"email": "test@example.com"})
    assert response_missing_pw.status_code == 400
    assert response_missing_pw.get_json()["error"] == "Email and password are required"

    # Missing email
    response_missing_email = client.post('/api/register', json={"password": "password123"})
    assert response_missing_email.status_code == 400
    assert response_missing_email.get_json()["error"] == "Email and password are required"

def test_register_user_invalid_email_format(client, init_database):
    """Test registration with an invalid email format."""
    response = client.post('/api/register', json={"email": "invalid-email", "password": "password123"})
    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid email format"

def test_register_user_short_password(client, init_database):
    """Test registration with a password that is too short."""
    response = client.post('/api/register', json={"email": "shortpass@example.com", "password": "123"})
    assert response.status_code == 400
    assert response.get_json()["error"] == "Password must be at least 6 characters long"

def test_login_user_success(client, registered_user):
    """Test successful user login."""
    user_data = registered_user["data"]
    response = client.post('/api/login', json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data["message"] == "Login successful"
    assert "access_token" in json_data
    assert json_data["user_id"] == registered_user["response"]["user_id"]

def test_login_user_incorrect_password(client, registered_user):
    """Test login with an incorrect password."""
    user_data = registered_user["data"]
    response = client.post('/api/login', json={
        "email": user_data["email"],
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data["error"] == "Invalid email or password"

def test_login_user_nonexistent_email(client, init_database):
    """Test login with an email that does not exist."""
    response = client.post('/api/login', json={
        "email": "nonexistent@example.com",
        "password": "password123"
    })
    assert response.status_code == 401 # Or 404 depending on how you want to handle it, 401 is common
    json_data = response.get_json()
    assert json_data["error"] == "Invalid email or password"

def test_login_user_missing_fields(client, init_database):
    """Test login with missing email or password."""
    response_missing_pw = client.post('/api/login', json={"email": "test@example.com"})
    assert response_missing_pw.status_code == 400
    assert response_missing_pw.get_json()["error"] == "Email and password are required"

    response_missing_email = client.post('/api/login', json={"password": "password123"})
    assert response_missing_email.status_code == 400
    assert response_missing_email.get_json()["error"] == "Email and password are required"

def test_login_invalid_email_format(client, init_database):
    """Test login with an invalid email format."""
    response = client.post('/api/login', json={"email": "invalid-email", "password": "password123"})
    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid email format provided for login"
