# Software Requirements Specification (SRS)
## ASPIRE AI PATHFINDER

**Project Type:** Web Application  
**Level:** Undergraduate  
**Version:** 1.0  
**Date:** February 2026

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for ASPIRE AI PATHFINDER, a web-based career guidance platform that uses artificial intelligence to help users analyze resumes, explore career paths, and get personalized career advice.

### 1.2 Scope

ASPIRE AI PATHFINDER is a full-stack web application that combines:
- User authentication and profile management
- Resume analysis using AI (PDF, DOCX, TXT support)
- AI-powered role suggestions based on resume content
- Career path exploration with detailed roadmaps
- Interactive AI chat assistant for career questions
- Ability to save and revisit career paths

The system is designed for students and early-career professionals looking for guidance on career decisions.

### 1.3 Overview

The application consists of a React-based frontend, a Flask backend API, a PostgreSQL database (via Supabase), and integration with Google's Gemini AI API for intelligent content generation.

---

## 2. Overall Description

### 2.1 Product Perspective

ASPIRE AI PATHFINDER is a standalone web application with the following major components:

- **Frontend**: React SPA with TypeScript, using shadcn/ui components
- **Backend**: Flask REST API with JWT authentication
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI Service**: Google Gemini API for content generation
- **File Processing**: Support for PDF, DOCX, and TXT resume formats

### 2.2 Product Functions

Main functionalities:

1. **User Management**
   - User registration and login
   - JWT-based session management
   - Profile information storage

2. **Resume Analysis**
   - File upload (PDF/DOCX/TXT)
   - Text extraction from uploaded files
   - AI-powered resume feedback for specific target roles
   - Structured analysis (strengths, weaknesses, recommendations)

3. **Role Suggestions**
   - AI generates potential career roles based on resume
   - Multiple role options provided
   - Detailed explanations for each suggestion

4. **Career Path Exploration**
   - Detailed career roadmaps for specific fields
   - Skills required, certifications, salary expectations
   - Typical career progression timelines

5. **AI Chat Assistant**
   - Context-aware conversation about career topics
   - Streaming responses for better UX
   - Can reference user's uploaded resume in conversation

6. **Saved Paths**
   - Users can save career paths for later reference
   - View and manage saved paths
   - Delete unwanted paths

### 2.3 User Characteristics

Primary users:
- College students exploring career options
- Recent graduates looking for career direction
- Early-career professionals considering career changes

Expected technical knowledge: Basic web browsing skills. No technical expertise required.

### 2.4 Constraints

- Requires internet connection
- AI responses depend on external API availability (Gemini API)
- File size limit: 10MB per resume upload
- Supported file formats limited to PDF, DOCX, TXT
- Browser compatibility: Modern browsers (Chrome, Firefox, Safari, Edge)

### 2.5 Assumptions and Dependencies

- Google Gemini API remains accessible and maintains current pricing
- Users have valid email addresses for registration
- Resume files are in readable format (not scanned images without OCR)
- Database hosting (Supabase/PostgreSQL) remains available

---

## 3. Functional Requirements

### 3.1 User Authentication

**FR-1.1**: System shall allow new users to register with email and password  
**FR-1.2**: System shall validate email format and password strength  
**FR-1.3**: System shall hash passwords before storing in database  
**FR-1.4**: System shall allow registered users to login with credentials  
**FR-1.5**: System shall issue JWT tokens for authenticated sessions  
**FR-1.6**: System shall protect API endpoints requiring authentication  

### 3.2 Resume Upload and Analysis

**FR-2.1**: System shall accept resume files in PDF, DOCX, or TXT format  
**FR-2.2**: System shall validate file size (max 10MB)  
**FR-2.3**: System shall extract text content from uploaded files  
**FR-2.4**: System shall reject files that cannot be parsed  
**FR-2.5**: System shall require target role input for analysis  
**FR-2.6**: System shall send resume text and target role to AI service  
**FR-2.7**: System shall display AI-generated analysis in structured format  
**FR-2.8**: System shall show loading states during analysis  
**FR-2.9**: System shall handle AI service errors gracefully  

### 3.3 Role Suggestions

**FR-3.1**: System shall generate role suggestions based on resume content  
**FR-3.2**: System shall provide multiple role options (typically 3-5)  
**FR-3.3**: System shall include brief explanations for each suggested role  
**FR-3.4**: System shall allow users to explore any suggested role further  

### 3.4 Career Path Exploration

**FR-4.1**: System shall accept career field as input  
**FR-4.2**: System shall generate comprehensive career roadmap  
**FR-4.3**: Career roadmap shall include:
   - Required skills and competencies
   - Recommended certifications
   - Expected salary ranges
   - Career progression timeline
   - Industry trends
**FR-4.4**: System shall display career paths in readable, structured format  
**FR-4.5**: System shall allow users to save career paths  

### 3.5 AI Chat Assistant

**FR-5.1**: System shall provide chat interface for career questions  
**FR-5.2**: System shall maintain conversation context within session  
**FR-5.3**: System shall stream AI responses in real-time  
**FR-5.4**: System shall display message history  
**FR-5.5**: System shall indicate when AI is processing  
**FR-5.6**: System shall handle message send via Enter key or button click  

### 3.6 Saved Paths Management

**FR-6.1**: System shall allow users to save career exploration results  
**FR-6.2**: System shall store saved paths in database linked to user account  
**FR-6.3**: System shall allow users to view list of saved paths  
**FR-6.4**: System shall allow users to delete saved paths  
**FR-6.5**: System shall display creation timestamp for each saved path  

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-1.1**: Page load time shall not exceed 3 seconds on standard broadband  
**NFR-1.2**: Resume analysis shall complete within 30 seconds under normal conditions  
**NFR-1.3**: System shall support at least 50 concurrent users  
**NFR-1.4**: Database queries shall return results within 2 seconds  

### 4.2 Security

**NFR-2.1**: All passwords shall be hashed using bcrypt  
**NFR-2.2**: JWT tokens shall expire after 24 hours  
**NFR-2.3**: API endpoints shall validate JWT tokens  
**NFR-2.4**: File uploads shall be scanned for malicious content  
**NFR-2.5**: Database credentials shall not be hardcoded  
**NFR-2.6**: HTTPS shall be used for all client-server communication  

### 4.3 Usability

**NFR-3.1**: UI shall be responsive and work on desktop and tablet devices  
**NFR-3.2**: Error messages shall be clear and actionable  
**NFR-3.3**: Loading states shall be visible to users  
**NFR-3.4**: System shall provide visual feedback for all user actions  
**NFR-3.5**: Navigation shall be intuitive with clear labels  

### 4.4 Reliability

**NFR-4.1**: System shall handle AI API failures without crashing  
**NFR-4.2**: Database connection failures shall be logged and retried  
**NFR-4.3**: File parsing errors shall not affect other system functions  
**NFR-4.4**: System shall maintain 95% uptime during operating hours  

### 4.5 Maintainability

**NFR-5.1**: Code shall follow consistent style guidelines (ESLint for frontend, PEP8 for backend)  
**NFR-5.2**: Functions shall be documented with docstrings  
**NFR-5.3**: Database schema changes shall use migration scripts  
**NFR-5.4**: API endpoints shall be versioned (/api/v1/...)  
**NFR-5.5**: Error logs shall include sufficient context for debugging  

### 4.6 Scalability

**NFR-6.1**: Database design shall support growth to 10,000 users  
**NFR-6.2**: File storage shall be manageable at scale  
**NFR-6.3**: API rate limiting shall be implemented for AI calls  

---

## 5. System Features (Detailed)

### 5.1 Resume Analyzer Component

**Description**: Core feature allowing users to upload resumes and receive AI analysis.

**Inputs**:
- Resume file (PDF/DOCX/TXT, max 10MB)
- Target role (text, max 100 characters)

**Processing**:
1. File validation
2. Text extraction using python-docx (DOCX), PyPDF2 (PDF), or direct read (TXT)
3. Prompt construction with resume text and target role
4. API call to Gemini AI
5. Response parsing and formatting

**Outputs**:
- Structured analysis with sections: Overview, Strengths, Weaknesses, Recommendations, Match Score

**Error Handling**:
- Invalid file type → User-friendly error message
- File too large → Size limit warning
- Text extraction failure → Format error message
- AI API failure → Retry option and error notification

### 5.2 Career Explorer Component

**Description**: Generates detailed career roadmaps for specific fields.

**Inputs**:
- Career field name (text, max 100 characters)

**Processing**:
1. Input validation
2. Prompt construction for career exploration
3. AI API call
4. Parse AI response into structured roadmap

**Outputs**:
- Career overview
- Skills and certifications needed
- Salary expectations
- Career progression path
- Industry trends

**Storage**:
- Option to save to database with user_id reference

### 5.3 AI Chat Assistant

**Description**: Interactive chat interface for career-related questions with streaming responses.

**Inputs**:
- User messages (text)
- Optional: Resume context from previous uploads

**Processing**:
1. Message validation
2. Conversation history maintained in frontend state
3. API call with conversation context
4. Streaming response handling

**Outputs**:
- Real-time AI responses displayed progressively
- Chat history with timestamps

---

## 6. Database Schema

### 6.1 Users Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| email | VARCHAR(120) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(128) | NOT NULL |

### 6.2 Saved Paths Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| user_id | INTEGER | FOREIGN KEY → users.id |
| path_name | VARCHAR(200) | NOT NULL |
| path_details_json | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 7. API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login

### AI Features (All require JWT)
- POST /api/analyze-resume - Resume analysis
- POST /api/suggest-roles - Role suggestions
- POST /api/explore-career - Career path exploration
- POST /api/chat-stream - Streaming chat responses

### Path Management
- POST /api/paths/save - Save career path
- GET /api/paths - Get user's saved paths
- DELETE /api/paths/:id - Delete saved path

---

## 8. External Interfaces

### 8.1 User Interface
- Web-based responsive UI
- Modern, clean design with dark mode support
- Accessible via standard web browsers

### 8.2 API Interface
- RESTful API design
- JSON request/response format
- JWT authentication headers

### 8.3 External API
- Google Gemini API (gemini-pro model)
- API key authentication
- Rate limits subject to Google's policies

---

## 9. Constraints and Limitations

1. **AI Dependency**: System heavily relies on external AI API. If Gemini API is down, core features are unavailable.

2. **File Processing**: Only text-extractable files work. Scanned PDFs without OCR layer will fail.

3. **Context Limitations**: AI has token limits. Very long resumes may need truncation.

4. **Language**: Currently optimized for English content only.

5. **Storage**: File content stored temporarily during processing, not permanently saved.

6. **Cost**: AI API calls incur costs. High usage requires budget consideration.

---

## 10. Future Enhancements (Out of Current Scope)

- Support for scanned documents with OCR
- Multiple language support
- Resume builder/editor
- Job market data integration
- Skills gap analysis
- Interview preparation modules
- LinkedIn profile analysis
- Mobile app versions

---

**End of SRS Document**
