# ASPIRO AI - Career Development Platform

ASPIRO AI is a full-stack web application designed to assist users in their career development journey. It leverages AI to provide resume analysis, role suggestions, and career path exploration, along with tools to save and manage these career paths.

## Tech Stack

**Backend:**
*   Python
*   Flask (with Flask-SQLAlchemy, Flask-Migrate, Flask-Bcrypt, Flask-JWT-Extended, Flask-CORS)
*   Google Generative AI (Gemini Pro)
*   SQLite (default, configurable via `DATABASE_URL`)

**Frontend (`aspiro-ai-frontend/` directory):**
*   React 19
*   Vite
*   TypeScript
*   Axios (for API calls)
*   Tailwind CSS
*   Context API (for state management like Auth)

## Prerequisites

*   **Python:** Version 3.10 or higher. (Check with `python --version`)
*   **Node.js:** Version 18.x or higher (for the frontend). (Check with `node --version`)
*   **npm or bun:** npm version 8.x or higher, or bun. (Check with `npm --version` or `bun --version`)
*   **Git:** For cloning the repository.

## Project Structure

```
.
├── aspiro-ai-frontend/   # React/Vite frontend application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Flask backend application
│   ├── instance/           # Default location for SQLite DB, created automatically
│   ├── migrations/         # Flask-Migrate migration scripts
│   ├── routes/             # API route blueprints
│   ├── app.py              # Main Flask application factory
│   ├── models.py           # SQLAlchemy database models
│   ├── requirements.txt    # Backend Python dependencies
│   └── .env.example        # Example environment variables for backend
├── tests/                  # Backend Pytest tests
│   └── backend/
└── README.md               # This file
```

## Setup and Running Instructions

### 1. Backend Setup (`server/`)

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Navigate to the backend directory:**
    ```bash
    cd server
    ```

3.  **Create a Python virtual environment:**
    ```bash
    python -m venv venv
    ```
    Activate it:
    *   Windows: `venv\\Scripts\\activate`
    *   macOS/Linux: `source venv/bin/activate`

4.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Set up Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file with your actual values. Key variables:
        *   `SECRET_KEY`: A strong random string for Flask session security.
        *   `JWT_SECRET_KEY`: A strong random string for signing JWTs.
        *   `DATABASE_URL`: Connection string for your database. Defaults to SQLite in the `server/instance/` folder. For PostgreSQL, it might look like `postgresql://user:password@host:port/dbname`.
        *   `GEMINI_API_KEY`: Your API key for Google Generative AI.

6.  **Run Database Migrations:**
    (Ensure your virtual environment is active and you are in the `server/` directory)
    The Flask app is defined in `app.py`. To run migrations, Flask needs to know about your app.
    If you are in the `server/` directory:
    ```bash
    # If FLASK_APP is not set, you might need to set it or use -A/--app
    # export FLASK_APP=app.py # For Linux/macOS
    # set FLASK_APP=app.py    # For Windows CMD
    # $env:FLASK_APP="app.py" # For PowerShell

    # Or, more robustly, run from the project root directory:
    # python -m flask --app server.app db upgrade --directory server/migrations

    # Assuming you are in the server/ directory and FLASK_APP=app.py is understood:
    flask db upgrade
    ```
    If `flask db upgrade` doesn't work directly due to app discovery, run it from the project root:
    ```bash
    # From project root directory:
    python -m flask --app server.app db upgrade --directory server/migrations
    ```


7.  **Run the Backend Server:**
    (Ensure your virtual environment is active and you are in the `server/` directory)
    ```bash
    flask run
    ```
    The backend will typically start on `http://localhost:5000`.

### 2. Frontend Setup (`aspiro-ai-frontend/`)

1.  **Navigate to the frontend directory:**
    (From the project root)
    ```bash
    cd aspiro-ai-frontend
    ```

2.  **Install Node.js dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using bun:
    ```bash
    bun install
    ```

3.  **Environment Variables (Frontend):**
    The frontend `src/api.ts` is configured to connect to `http://localhost:5000/api`. If your backend runs on a different URL, you'll need to update this base URL in `aspiro-ai-frontend/src/api.ts`.
    For Vite projects, environment variables are typically managed via `.env` files in the frontend directory (e.g., `aspiro-ai-frontend/.env`). Example:
    ```env
    VITE_API_BASE_URL=http://localhost:5000/api
    ```
    And then use `import.meta.env.VITE_API_BASE_URL` in `api.ts`. (This change has not been implemented in the current code but is standard practice).

4.  **Run the Frontend Development Server:**
    Using npm:
    ```bash
    npm run dev
    ```
    Or using bun:
    ```bash
    bun run dev
    ```
    The frontend will typically start on a port like `http://localhost:5173` (Vite's default).

## Running Backend Tests

1.  **Navigate to the project root directory.**
2.  **Ensure backend virtual environment is active and dependencies (including `pytest`) are installed.**
3.  **Run tests:**
    ```bash
    python -m pytest tests/backend/
    ```

---

This README provides a comprehensive guide to getting the ASPIRO AI application up and running for development.
