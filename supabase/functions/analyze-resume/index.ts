
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  filePath: string
  analysisType: 'target-role' | 'best-fit'
  targetRole?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { filePath, analysisType, targetRole }: RequestBody = await req.json()

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('resumes')
      .download(filePath)

    if (downloadError) throw downloadError

    // Extract text from file (simplified - in production, use proper PDF/DOCX parsers)
    const fileBuffer = await fileData.arrayBuffer()
    const fileContent = new TextDecoder().decode(fileBuffer)
    
    // This is a placeholder - in production, you'd use proper libraries like:
    // - PDF parsing: pdf-parse or pdf2pic
    // - DOCX parsing: mammoth.js or docx-parser
    const resumeText = fileContent // Simplified extraction

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    let prompt = ''
    if (analysisType === 'target-role') {
      prompt = `Act as an expert technical recruiter and ATS software. Your task is to analyze the following resume text for a candidate who is targeting a '${targetRole}' role. First, identify the candidate's name from the resume text.

**Analysis Steps:**
1. **ATS Score:** Provide an "ATS Score" on a scale of 0-100 based on a detailed analysis of keyword relevance for the target role, quantifiable achievements, formatting, and clarity. The score must be a number.
2. **Detailed Feedback:** After the score, provide a detailed analysis for the candidate (using their name). Structure this into three sections: "**Strengths**", "**Areas for Improvement**", and "**Actionable Next Steps**" for this specific role.

**Resume Text to Analyze:**
${resumeText}`
    } else {
      prompt = `Act as an expert career analyst specializing in both hardware (ECE/VLSI) and software roles. Your task is to perform a two-part analysis on the provided resume. First, identify the candidate's name from the resume text.

**Part 1: Top 3 Role Suggestions**
Strictly based on the skills, projects, and experience listed, identify the top 3 most suitable job roles. Suggestions should be diverse. For each role, provide a **Confidence Score**, a "**Why it's a good fit**" explanation, and a list of "**Key skills to add or highlight**".

**Part 2: General Resume Analysis**
After the role suggestions, provide a general analysis of the resume with two sections: "**Overall Strengths**" and "**Global Improvements to Consider**".

**Resume Text to Analyze:**
${resumeText}`
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    const geminiResponse = await response.json()
    
    if (!geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API')
    }

    const analysis = geminiResponse.candidates[0].content.parts[0].text

    // Extract ATS score if it's a target-role analysis
    let atsScore = null
    if (analysisType === 'target-role') {
      const scoreMatch = analysis.match(/ATS Score.*?(\d+)/i)
      if (scoreMatch) {
        atsScore = parseInt(scoreMatch[1])
      }
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        atsScore 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
