import pytest
import io

# Sample PDF content (minimal valid PDF)
# This is a very basic PDF. For more robust testing, you might need a more complex one.
# Or, mock the extract_text_from_file and generate_ai_content functions.
SAMPLE_PDF_CONTENT = b"%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000058 00000 n\n0000000111 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n130\n%%EOF"

def test_analyze_resume_unauthenticated(client, init_database):
    """Test /api/analyze-resume without authentication."""
    response = client.post('/api/analyze-resume', data={
        'resume_file': (io.BytesIO(SAMPLE_PDF_CONTENT), 'test.pdf'),
        'target_role': 'Software Engineer'
    }, content_type='multipart/form-data') # Specify content_type
    assert response.status_code == 401 # Expecting Unauthorized

def test_analyze_resume_authenticated_no_file(authenticated_client):
    """Test /api/analyze-resume with authentication but no file."""
    authed_client, _ = authenticated_client
    response = authed_client.post('/api/analyze-resume', data={
        'target_role': 'Software Engineer'
    }, content_type='multipart/form-data') # Specify content_type
    if response.status_code == 422:
        print("DEBUG: Received 422 response body:", response.get_json())
    assert response.status_code == 400
    assert response.get_json()["error"] == "No resume file provided ('resume_file' field missing)"

def test_analyze_resume_authenticated_empty_filename(authenticated_client):
    """Test /api/analyze-resume with authentication but empty filename."""
    authed_client, _ = authenticated_client
    response = authed_client.post('/api/analyze-resume', data={
        'resume_file': (io.BytesIO(SAMPLE_PDF_CONTENT), ''),
        'target_role': 'Software Engineer'
    }, content_type='multipart/form-data') # Specify content_type
    assert response.status_code == 400
    assert response.get_json()["error"] == "No file selected for upload"

def test_analyze_resume_authenticated_no_target_role(authenticated_client):
    """Test /api/analyze-resume with authentication but no target role."""
    authed_client, _ = authenticated_client
    response = authed_client.post('/api/analyze-resume', data={
        'resume_file': (io.BytesIO(SAMPLE_PDF_CONTENT), 'test.pdf')
    }, content_type='multipart/form-data') # Specify content_type
    assert response.status_code == 400
    assert response.get_json()["error"] == "Target role is required"


# Similar tests for /api/suggest-roles
def test_suggest_roles_unauthenticated(client, init_database):
    """Test /api/suggest-roles without authentication."""
    response = client.post('/api/suggest-roles', data={
        'resume_file': (io.BytesIO(SAMPLE_PDF_CONTENT), 'test.pdf')
    }, content_type='multipart/form-data') # Specify content_type
    assert response.status_code == 401

def test_suggest_roles_authenticated_no_file(authenticated_client):
    authed_client, _ = authenticated_client
    response = authed_client.post('/api/suggest-roles', data={}, content_type='multipart/form-data') # Specify content_type
    assert response.status_code == 400
    assert response.get_json()["error"] == "No resume file provided ('resume_file' field missing)"


# Test for /api/explore-path
def test_explore_path_unauthenticated(client, init_database):
    """Test /api/explore-path without authentication."""
    response = client.post('/api/explore-path', json={'career_field': 'Data Science'})
    assert response.status_code == 401

def test_explore_path_authenticated_no_field(authenticated_client):
    authed_client, _ = authenticated_client
    response = authed_client.post('/api/explore-path', json={})
    assert response.status_code == 400
    assert response.get_json()["error"] == "career_field is required"

# To fully test the AI routes' success cases (200 OK), you would typically:
# 1. Mock the `generate_ai_content` function from `server.utils` (or `server.routes.ai_routes`)
#    to return a predefined response without calling the actual Gemini API.
# 2. Mock `extract_text_from_file` if file processing is complex or to avoid disk I/O.
# Example (conceptual, would need monkeypatch fixture from pytest):
# def test_analyze_resume_authenticated_success_mocked(authenticated_client, monkeypatch):
#     authed_client, _ = authenticated_client
#
#     def mock_extract_text(file_storage):
#         return "This is mock resume text."
#
#     def mock_generate_content(model_instance, prompt_parts):
#         return "This is mock AI analysis."
#
#     monkeypatch.setattr("server.routes.ai_routes.extract_text_from_file", mock_extract_text)
#     monkeypatch.setattr("server.routes.ai_routes.generate_ai_content", mock_generate_content)
#
#     response = authed_client.post('/api/analyze-resume', data={
#         'resume_file': (io.BytesIO(SAMPLE_PDF_CONTENT), 'test.pdf'),
#         'target_role': 'Software Engineer'
#     }, content_type='multipart/form-data')
#
#     assert response.status_code == 200
#     assert response.get_json()["analysis"] == "This is mock AI analysis."
