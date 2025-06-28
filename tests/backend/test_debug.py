import pytest

def test_debug_error_route(client):
    """Test the debug error route returns 400."""
    response = client.get('/_test/error400')
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data["error"] == "Test error"

def test_debug_success_route(client):
    """Test the debug success route returns 201."""
    response = client.get('/_test/success201')
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data["message"] == "Test success"
