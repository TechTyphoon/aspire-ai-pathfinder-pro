
# ASPIRO AI - Setup Instructions

## Prerequisites
1. Node.js (v18 or higher)
2. Supabase CLI
3. A Supabase account
4. A Google Gemini API key

## Step 1: Frontend Setup
```bash
# Install dependencies (already done in Lovable)
npm install

# Create environment file
touch .env.local
```

Add to `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 2: Supabase Setup

### Initialize Supabase Project
```bash
# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref
```

### Database Setup
```bash
# Apply migrations
supabase db push
```

### Storage Setup
The migration will create the `resumes` bucket automatically.

### Edge Functions Setup
```bash
# Deploy the analyze-resume function
supabase functions deploy analyze-resume

# Deploy the career-mentor function
supabase functions deploy career-mentor
```

### Set Secrets
```bash
# Set the Gemini API key as a secret
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

## Step 3: Get API Keys

### Supabase Keys
1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

### Gemini API Key
1. Go to Google AI Studio (https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key for use in Supabase secrets

## Step 4: Test the Application

### Frontend
```bash
npm run dev
```

### Features to Test
1. **User Registration/Login** - Create account and sign in
2. **Resume Upload** - Test with PDF/DOCX files
3. **Resume Analysis** - Both target role and best fit options
4. **Career Explorer** - Enter career fields for analysis
5. **Save Paths** - Save career analyses to database
6. **AI Chat** - Ask career-related questions

## File Processing Setup (Production)

For production, you'll need to add proper file processing libraries to the Edge Functions:

### PDF Processing
Add to `supabase/functions/analyze-resume/index.ts`:
```typescript
import { getDocument } from 'https://esm.sh/pdfjs-dist@3.11.174'
```

### DOCX Processing
```typescript
import mammoth from 'https://esm.sh/mammoth@1.6.0'
```

## Security Notes
- API keys are stored securely in Supabase secrets
- Files are stored in private storage buckets
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data

## Production Deployment
The frontend can be deployed to any hosting service (Vercel, Netlify, etc.)
The Supabase backend handles all server-side functionality automatically.
