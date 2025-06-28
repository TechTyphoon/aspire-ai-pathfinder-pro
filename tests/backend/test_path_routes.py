import pytest
from server.models import SavedPath, User

def test_save_path_unauthenticated(client, init_database):
    """Test /api/save-path without authentication."""
    response = client.post('/api/save-path', json={
        "path_name": "My Test Path",
        "path_details_json": {"steps": ["Step 1", "Step 2"]}
    })
    assert response.status_code == 401 # Expecting Unauthorized

def test_save_path_authenticated_success(authenticated_client):
    """Test successful path saving with authentication."""
    authed_client, user_id = authenticated_client

    path_data = {
        "path_name": "My Awesome Career Path",
        "path_details_json": {"field": "AI Engineering", "steps": ["Learn Python", "Learn ML"]}
    }
    response = authed_client.post('/api/save-path', json=path_data)

    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data["message"] == "Career path saved successfully"
    assert "path_id" in json_data

    # Verify in database
    path = SavedPath.query.get(json_data["path_id"])
    assert path is not None
    assert path.user_id == user_id
    assert path.path_name == path_data["path_name"]
    assert path.path_details_json == path_data["path_details_json"]

def test_save_path_missing_path_name(authenticated_client):
    """Test saving path with missing path_name."""
    authed_client, _ = authenticated_client
    response = authed_client.post('/api/save-path', json={
        "path_details_json": {"steps": ["Step 1"]}
    })
    assert response.status_code == 400
    assert response.get_json()["error"] == "path_name is required"

def test_get_user_paths_unauthenticated(client, init_database):
    """Test /api/user/paths without authentication."""
    response = client.get('/api/user/paths')
    assert response.status_code == 401

def test_get_user_paths_authenticated_success(authenticated_client):
    """Test retrieving paths for the authenticated user."""
    authed_client, user_id = authenticated_client

    # First, save a path for this user
    path_data1 = {"path_name": "Path 1", "path_details_json": {"detail": "detail1"}}
    authed_client.post('/api/save-path', json=path_data1)
    path_data2 = {"path_name": "Path 2", "path_details_json": {"detail": "detail2"}}
    authed_client.post('/api/save-path', json=path_data2)

    # Retrieve paths
    response = authed_client.get('/api/user/paths')
    assert response.status_code == 200
    paths_data = response.get_json()
    assert isinstance(paths_data, list)
    assert len(paths_data) == 2

    path_names_retrieved = {p["path_name"] for p in paths_data}
    assert path_data1["path_name"] in path_names_retrieved
    assert path_data2["path_name"] in path_names_retrieved
    for p in paths_data:
        assert p["user_id"] == user_id

def test_get_user_paths_no_paths(authenticated_client):
    """Test retrieving paths when the user has none."""
    authed_client, _ = authenticated_client
    response = authed_client.get('/api/user/paths')
    assert response.status_code == 200
    paths_data = response.get_json()
    assert isinstance(paths_data, list)
    assert len(paths_data) == 0

def test_delete_path_unauthenticated(client, init_database):
    """Test /api/delete-path without authentication."""
    # Need a path_id, but this will fail at auth so ID doesn't strictly matter
    response = client.delete('/api/delete-path/1')
    assert response.status_code == 401

def test_delete_path_authenticated_success(authenticated_client):
    """Test successful deletion of an owned path."""
    authed_client, user_id = authenticated_client

    # Save a path
    path_data = {"path_name": "Path to Delete", "path_details_json": {}}
    save_response = authed_client.post('/api/save-path', json=path_data)
    path_id = save_response.get_json()["path_id"]

    # Delete the path
    delete_response = authed_client.delete(f'/api/delete-path/{path_id}')
    assert delete_response.status_code == 200
    assert delete_response.get_json()["message"] == "Career path deleted successfully"

    # Verify it's deleted
    assert SavedPath.query.get(path_id) is None

def test_delete_path_not_found(authenticated_client):
    """Test deleting a path that does not exist."""
    authed_client, _ = authenticated_client
    response = authed_client.delete('/api/delete-path/99999') # Non-existent ID
    assert response.status_code == 404
    assert response.get_json()["error"] == "Path not found"

def test_delete_path_not_owned(authenticated_client, client, new_user_data):
    """Test deleting a path not owned by the authenticated user."""
    authed_client_user1, user1_id = authenticated_client # This is user1

    # Create and register user2
    user2_email = "user2@example.com"
    user2_password = "password123"
    client.post('/api/register', json={"email": user2_email, "password": user2_password})

    # Login as user2 to get their token and save a path
    login_resp_user2 = client.post('/api/login', json={"email": user2_email, "password": user2_password})
    user2_token = login_resp_user2.get_json()["access_token"]

    path_data_user2 = {"path_name": "User2 Path", "path_details_json": {}}

    # Make request as user2
    response_save_user2 = client.post(
        '/api/save-path',
        json=path_data_user2,
        headers={'Authorization': f'Bearer {user2_token}'}
    )
    assert response_save_user2.status_code == 201
    user2_path_id = response_save_user2.get_json()["path_id"]

    # User1 (authed_client) tries to delete User2's path
    delete_response_user1 = authed_client_user1.delete(f'/api/delete-path/{user2_path_id}')
    assert delete_response_user1.status_code == 403 # Forbidden
    assert delete_response_user1.get_json()["error"] == "Forbidden: You do not own this path"

    # Verify path still exists
    assert SavedPath.query.get(user2_path_id) is not None
