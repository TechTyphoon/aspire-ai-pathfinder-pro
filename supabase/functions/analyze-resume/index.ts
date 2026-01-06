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

// Helper function to extract text from different file types
export async function extractTextFromFile(fileData: Blob, fileName: string): Promise<string> {
  const fileBuffer = await fileData.arrayBuffer()
  const extension = fileName.split('.').pop()?.toLowerCase()
  const uint8Array = new Uint8Array(fileBuffer)

  if (extension === 'txt' || extension === 'md') {
    return new TextDecoder().decode(fileBuffer)
  }

  if (extension === 'pdf') {
    // Simple PDF text extraction - look for text streams
    const rawText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
    
    // Check if it's actually a PDF
    if (!rawText.startsWith('%PDF')) {
      throw new Error('Invalid PDF file format')
    }

    // Extract text between stream markers and parentheses (common PDF text patterns)
    let extractedText = ''
    
    // Method 1: Extract text from BT/ET blocks (text objects)
    const textBlocks = rawText.match(/BT[\s\S]*?ET/g) || []
    for (const block of textBlocks) {
      // Extract text in parentheses (literal strings)
      const parenthesesMatches = block.match(/\(([^)]*)\)/g) || []
      for (const match of parenthesesMatches) {
        extractedText += match.slice(1, -1) + ' '
      }
      // Extract text in angle brackets (hex strings)
      const hexMatches = block.match(/<([0-9A-Fa-f]+)>/g) || []
      for (const hex of hexMatches) {
        const hexStr = hex.slice(1, -1)
        let decoded = ''
        for (let i = 0; i < hexStr.length; i += 2) {
          const charCode = parseInt(hexStr.substr(i, 2), 16)
          if (charCode >= 32 && charCode < 127) {
            decoded += String.fromCharCode(charCode)
          }
        }
        if (decoded) extractedText += decoded + ' '
      }
    }

    // Method 2: Also look for plain readable text sequences
    const plainTextMatches = rawText.match(/[A-Za-z][A-Za-z0-9\s.,!?@#$%&*()-]{10,}/g) || []
    for (const match of plainTextMatches) {
      if (!match.includes('stream') && !match.includes('endstream') && !match.includes('obj')) {
        extractedText += match + ' '
      }
    }

    // Clean up the text
    extractedText = extractedText
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\s+/g, ' ')
      .trim()

    if (extractedText.length < 50) {
      throw new Error('Could not extract readable text from PDF. The PDF may be scanned or image-based. Please try uploading a text-based PDF or a TXT file.')
    }

    console.log('PDF text extracted, length:', extractedText.length)
    return extractedText
  }

  if (extension === 'docx') {
    // DOCX is a ZIP archive - try to read as text and look for XML content
    const rawText = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array)
    
    // Look for document.xml content within the binary
    const xmlStart = rawText.indexOf('<w:document')
    const xmlEnd = rawText.lastIndexOf('</w:document>')
    
    if (xmlStart === -1 || xmlEnd === -1) {
      // Fallback: extract any readable text
      const readableText = rawText.match(/[A-Za-z][A-Za-z0-9\s.,!?@#$%&*()-]{5,}/g) || []
      const filtered = readableText.filter(t => 
        !t.includes('Content') && 
        !t.includes('xml') && 
        !t.includes('rels') &&
        !t.includes('docProps') &&
        t.length > 10
      )
      if (filtered.length > 0) {
        return filtered.join(' ').trim()
      }
      throw new Error('Could not parse DOCX file. Please try uploading as PDF or TXT.')
    }

    const xmlContent = rawText.substring(xmlStart, xmlEnd + '</w:document>'.length)
    // Strip XML tags and get text
    const text = xmlContent
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    console.log('DOCX text extracted, length:', text.length)
    return text
  }

  // Fallback: try to read as plain text
  const text = new TextDecoder('utf-8', { fatal: false }).decode(fileBuffer)
  
  // Check if it looks like binary
  const nonPrintable = text.split('').filter(c => {
    const code = c.charCodeAt(0)
    return code < 32 && code !== 10 && code !== 13 && code !== 9
  }).length
  
  if (nonPrintable > text.length * 0.1) {
    throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT file with readable text.')
  }

  return text
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('Authentication failed:', userError?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('Authenticated user:', user.id)

    const { filePath, analysisType, targetRole }: RequestBody = await req.json()

    // Validate inputs
    if (!filePath || typeof filePath !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid filePath' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!['target-role', 'best-fit'].includes(analysisType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid analysisType' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify the file belongs to the authenticated user
    const pathParts = filePath.split('/')
    if (pathParts.length < 2 || pathParts[0] !== user.id) {
      console.error('Unauthorized file access attempt:', { filePath, userId: user.id })
      return new Response(
        JSON.stringify({ error: 'Access denied to this file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const fileName = pathParts[pathParts.length - 1]
    console.log('Analyzing resume:', { filePath, fileName, analysisType, targetRole })

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('resumes')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      return new Response(
        JSON.stringify({ error: 'Failed to download file. Please ensure the file exists.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Extract text from file
    let resumeText: string
    try {
      resumeText = await extractTextFromFile(fileData, fileName)
    } catch (extractError) {
      console.error('Text extraction error:', extractError)
      const errorMessage = extractError instanceof Error ? extractError.message : 'Failed to extract text from file'
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!resumeText || resumeText.trim().length < 50) {
      console.error('Extracted text too short:', resumeText?.length)
      return new Response(
        JSON.stringify({ error: 'Could not extract sufficient text from the resume. Please ensure your file contains readable text.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Resume text extracted, length:', resumeText.length)

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let prompt = ''
    if (analysisType === 'target-role') {
      const sanitizedRole = (targetRole || '').slice(0, 100).replace(/[<>]/g, '')
      prompt = `Analyze this resume for a ${sanitizedRole} role.

Provide the analysis in plain text only. No markdown, no headings with symbols, no bullet points, no asterisks. Use short paragraphs separated by blank lines.

First give an ATS Score from 0 to 100 as a number. Then discuss the candidate's strengths for this role. Then discuss areas needing improvement. Finally give actionable next steps.

Resume text:
${resumeText}`
    } else {
      prompt = `Analyze this resume and suggest the top 3 most suitable job roles.

Provide the analysis in plain text only. No markdown, no headings with symbols, no bullet points, no asterisks. Use short paragraphs separated by blank lines.

For each role, explain why it fits and what skills to highlight or develop. Then give overall resume strengths and improvements to consider.

Resume text:
${resumeText}`
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      })
    })

    const aiResponse = await response.json()
    console.log('AI response received')
    
    if (!response.ok) {
      console.error('AI error:', aiResponse)
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!aiResponse.choices?.[0]?.message?.content) {
      console.error('Invalid AI response structure:', aiResponse)
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const analysis = aiResponse.choices[0].message.content

    // Extract ATS score if it's a target-role analysis
    let atsScore = null
    if (analysisType === 'target-role') {
      const scoreMatch = analysis.match(/ATS Score.*?(\d+)/i) || analysis.match(/(\d+)\s*(?:\/\s*100|out of 100)?/i)
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
    console.error('Resume analysis error:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
