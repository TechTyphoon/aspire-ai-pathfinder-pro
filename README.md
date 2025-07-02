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
    The frontend API base URL is configured in `aspiro-ai-frontend/src/api.ts` using an environment variable `VITE_API_BASE_URL`.
    *   Create a file named `.env.development` (or `.env.local`, `.env`) in the `aspiro-ai-frontend/` directory.
    *   Add the following line, adjusting the URL if your backend runs elsewhere:
        ```env
        VITE_API_BASE_URL=http://localhost:5000/api
        ```
    *   For production builds, you can set this environment variable during your build process or in a `.env.production` file.
    *   The `api.ts` file uses `import.meta.env.VITE_API_BASE_URL` and defaults to `http://localhost:5000/api` if the variable is not set.

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

## System Overview & Methodology Notes (for Research Context)

This section provides a high-level overview of the system's architecture and core AI interactions, which may be relevant when describing the methodology in a research context.

### Core User Flows & AI Interaction:

1.  **User Authentication:**
    *   Frontend (`LoginPage.tsx`, `RegisterPage.tsx`) handles user input.
    *   Backend (`auth_routes.py`) validates credentials, manages user data (`User` model), and issues JWTs upon successful login.
    *   JWTs are stored in frontend's `localStorage` (`AuthContext.tsx`) and automatically sent with subsequent API calls via an Axios interceptor (`api.ts`).

2.  **Resume Analysis (`ResumeAnalyzerView.tsx` -> `ai_routes.py`):**
    *   User uploads a resume file (PDF, DOCX, TXT) and specifies a target role.
    *   Frontend sends this as `multipart/form-data` to the `/api/analyze-resume` endpoint.
    *   Backend (`utils.extract_text_from_file`) extracts text content.
    *   A structured prompt (see `prompts.get_resume_feedback_prompt` in `server/prompts.py`) is constructed, combining the resume text and target role.
    *   This prompt is sent to the Google Gemini Pro model via `utils.generate_ai_content`.
    *   The AI's textual feedback is returned to the frontend and displayed.

3.  **Role Suggestion (`ResumeAnalyzerView.tsx` -> `ai_routes.py`):**
    *   User uploads a resume file.
    *   Frontend sends to `/api/suggest-roles`.
    *   Backend extracts text.
    *   A prompt (see `prompts.get_role_suggestion_prompt`) asks the AI to suggest roles based on the resume.
    *   AI's suggestions are returned and displayed.

4.  **Career Field Exploration (`CareerExplorerView.tsx` -> `ai_routes.py`):**
    *   User inputs a career field name.
    *   Frontend sends this as JSON to `/api/explore-path`.
    *   A prompt (see `prompts.get_career_exploration_prompt`) asks the AI to generate a detailed report on that field.
    *   AI's report is returned and displayed in a modal.

5.  **Saving and Managing Career Paths (`CareerExplorerView.tsx`, `SavedPathsView.tsx` -> `path_routes.py`):**
    *   Users can save explored career reports or other path-related data.
    *   Frontend sends path name and details (JSON) to `/api/save-path`.
    *   Backend (`path_routes.py`) stores this in the `SavedPath` model, linked to the authenticated user.
    *   Users can view their saved paths (`/api/user/paths`) and delete them (`/api/delete-path/:id`).

### AI Prompting Strategy:

*   The core of the AI interaction relies on carefully crafted prompts defined in `server/prompts.py`.
*   These prompts instruct the Gemini Pro model to act as a specific persona (e.g., "expert career advisor," "career counselor") and to structure its output in a particular way (e.g., specific sections for resume feedback or career reports).
*   The quality and relevance of the AI's output are highly dependent on this prompt engineering. This would be a key area to detail and evaluate in a research paper.

### Technology Choices (Methodology Relevance):

*   **Flask (Python Backend):** Chosen for its simplicity, flexibility, and rapid development capabilities for building RESTful APIs. Python's strong ecosystem for AI/ML was also a factor.
*   **React with TypeScript (Frontend):** Provides a robust framework for building interactive user interfaces with type safety. Vite offers a fast development experience.
*   **Google Gemini Pro:** A powerful general-purpose large language model used as the core AI engine. The methodology would focus on *how* this pre-trained model is leveraged through prompting rather than model training itself.
*   **JWT for Authentication:** Standard stateless authentication mechanism suitable for decoupled frontend/backend architectures.

This overview is intended as a starting point for a more detailed methodology section in a research paper. Further elaboration on prompt iteration, specific data handling, and user interface design choices would be necessary.

---


## Troubleshooting & Tips

### Frontend (React/Vite) Install/Build Issues

- **Node.js & npm version:** Ensure you are using Node.js 18+ and npm 8+ (`node --version`, `npm --version`).
- **Clean install:** If you encounter persistent `npm install` or build errors, try:
  ```bash
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
  ```
- **Nested lockfile issue:** If you see a nested `aspiro-ai-frontend/aspiro-ai-frontend/package-lock.json`, delete it:
  ```bash
  rm -f aspiro-ai-frontend/aspiro-ai-frontend/package-lock.json
  ```
- **Peer dependency conflicts:** Try `npm install --legacy-peer-deps` or `npm install --force` if you see peer dependency errors.
- **Missing dependencies:** Make sure `react`, `react-dom`, `@types/react`, `@types/react-dom`, and `@heroicons/react` are installed.

### Contributing & Pushing to GitHub

1. **Stage your changes:**
   ```bash
   git add .
   ```
2. **Commit your changes:**
   ```bash
   git commit -m "Refactor, cleanup, and update documentation"
   ```
3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

---

This README provides a comprehensive guide to getting the ASPIRO AI application up and running for development, plus troubleshooting and contribution tips.
