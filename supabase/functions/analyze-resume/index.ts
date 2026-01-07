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
  const bytes = new Uint8Array(fileBuffer)

  if (extension === 'txt' || extension === 'md') {
    return new TextDecoder().decode(fileBuffer)
  }

  if (extension === 'pdf') {
    return await extractTextFromPdf(bytes)
  }

  if (extension === 'docx') {
    // DOCX is a ZIP archive; in Edge runtime we keep a lightweight best-effort fallback.
    const rawText = new TextDecoder('utf-8', { fatal: false }).decode(bytes)

    const xmlStart = rawText.indexOf('<w:document')
    const xmlEnd = rawText.lastIndexOf('</w:document>')

    if (xmlStart === -1 || xmlEnd === -1) {
      const readableText = rawText.match(/[A-Za-z][A-Za-z0-9\s.,!?@#$%&*()-]{5,}/g) || []
      const filtered = readableText.filter((t) =>
        !t.includes('Content') &&
        !t.includes('xml') &&
        !t.includes('rels') &&
        !t.includes('docProps') &&
        t.length > 10
      )
      if (filtered.length > 0) {
        const joined = filtered.join(' ').replace(/\s+/g, ' ').trim()
        if (joined.length >= 50) return joined
      }
      throw new Error('Could not parse DOCX file. Please try uploading as PDF or TXT.')
    }

    const xmlContent = rawText.substring(xmlStart, xmlEnd + '</w:document>'.length)
    const text = xmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    console.log('DOCX text extracted, length:', text.length)

    if (text.length < 50) {
      throw new Error('Could not extract sufficient text from DOCX. Please try uploading as PDF or TXT.')
    }

    return text
  }

  // Fallback: try to read as plain text
  const text = new TextDecoder('utf-8', { fatal: false }).decode(fileBuffer)

  // Check if it looks like binary
  const nonPrintable = text.split('').filter((c) => {
    const code = c.charCodeAt(0)
    return code < 32 && code !== 10 && code !== 13 && code !== 9
  }).length

  if (nonPrintable > text.length * 0.1) {
    throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT file with readable text.')
  }

  return text
}

function isPdf(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 // %PDF
}

function indexOfAscii(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

function sliceToAscii(bytes: Uint8Array): string {
  // Decode as latin-1 style to avoid throwing on binary; good enough for PDF keywords.
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
  return out
}

async function inflateDeflate(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof (globalThis as any).DecompressionStream === 'undefined') {
    throw new Error('Could not extract readable text from PDF. This PDF uses compression that is not supported in this environment. Please upload a text-based PDF or a TXT file.')
  }

  try {
    const ds = new DecompressionStream('deflate')
    const stream = new Blob([bytes]).stream().pipeThrough(ds)
    const ab = await new Response(stream).arrayBuffer()
    return new Uint8Array(ab)
  } catch {
    throw new Error('Could not extract readable text from PDF. This PDF appears to be compressed in an unsupported way. Please upload a text-based PDF or a TXT file.')
  }
}

function extractStringsFromPdfTextObject(block: string): string[] {
  const results: string[] = []
  const len = block.length
  let i = 0

  while (i < len) {
    const ch = block[i]

    if (ch === '(') {
      let depth = 1
      let j = i + 1
      let buf = ''
      while (j < len && depth > 0) {
        const c = block[j]
        if (c === '\\') {
          const next = block[j + 1] ?? ''
          if (next === 'n') buf += '\n'
          else if (next === 'r') buf += '\r'
          else if (next === 't') buf += ' '
          else if (next === '(') buf += '('
          else if (next === ')') buf += ')'
          else if (next === '\\') buf += '\\'
          else buf += next
          j += 2
          continue
        }
        if (c === '(') depth++
        if (c === ')') depth--
        if (depth > 0) buf += c
        j++
      }
      const cleaned = buf.replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim()
      if (cleaned) results.push(cleaned)
      i = j
      continue
    }

    // Handle hex strings <...> - common for Unicode/Identity-H encoded PDFs
    if (ch === '<') {
      const end = block.indexOf('>', i + 1)
      if (end !== -1) {
        const hex = block.slice(i + 1, end).replace(/\s+/g, '')
        if (/^[0-9A-Fa-f]+$/.test(hex) && hex.length >= 2) {
          // Try UTF-16BE decoding first (common for Identity-H CMap)
          if (hex.length % 4 === 0) {
            let decoded = ''
            let isValidUnicode = true
            for (let k = 0; k < hex.length; k += 4) {
              const codePoint = parseInt(hex.slice(k, k + 4), 16)
              // Valid printable Unicode range
              if (codePoint >= 0x0020 && codePoint <= 0xFFFF) {
                decoded += String.fromCharCode(codePoint)
              } else if (codePoint === 0) {
                // Skip null chars
              } else {
                isValidUnicode = false
                break
              }
            }
            if (isValidUnicode && decoded.length > 0) {
              const cleaned = decoded.replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim()
              if (cleaned) results.push(cleaned)
              i = end + 1
              continue
            }
          }
          
          // Fallback to byte-level decoding
          const bytes = new Uint8Array(Math.floor(hex.length / 2))
          for (let k = 0; k < bytes.length; k++) {
            bytes[k] = parseInt(hex.slice(k * 2, k * 2 + 2), 16)
          }
          const decoded = new TextDecoder('utf-8', { fatal: false })
            .decode(bytes)
            .replace(/[\u0000-\u001f]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
          if (decoded) results.push(decoded)
        }
        i = end + 1
        continue
      }
    }

    i++
  }

  return results
}

function extractTextFromPdfPayloadString(payload: string): string {
  const textObjects = payload.match(/BT[\s\S]*?ET/g) || []
  const pieces: string[] = []

  for (const block of textObjects) {
    for (const s of extractStringsFromPdfTextObject(block)) {
      pieces.push(s)
    }
  }

  // Fallback: sometimes content isn't wrapped in BT/ET in a way our regex catches.
  if (pieces.length === 0) {
    for (const s of extractStringsFromPdfTextObject(payload)) {
      pieces.push(s)
    }
  }

  return pieces.join(' ')
}

function looksLikeRealResumeText(text: string): boolean {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 50) return false

  // Must contain some normal words.
  const words = cleaned.match(/[A-Za-z]{3,}/g) || []
  if (words.length < 20) return false

  // Reject if it still looks like PDF structure noise.
  const noiseHits = (cleaned.match(/\b(obj|endobj|xref|trailer|startxref|endstream|stream)\b/gi) || []).length
  if (noiseHits >= 3) return false

  return true
}

async function extractTextFromPdf(bytes: Uint8Array): Promise<string> {
  if (!isPdf(bytes)) {
    throw new Error('Invalid PDF file format')
  }

  const streamNeedle = new TextEncoder().encode('stream')
  const endStreamNeedle = new TextEncoder().encode('endstream')

  let cursor = 0
  const extractedParts: string[] = []

  while (cursor < bytes.length) {
    const streamIdx = indexOfAscii(bytes, streamNeedle, cursor)
    if (streamIdx === -1) break

    // Determine the stream payload start after EOL.
    let payloadStart = streamIdx + streamNeedle.length
    if (bytes[payloadStart] === 0x0d && bytes[payloadStart + 1] === 0x0a) payloadStart += 2
    else if (bytes[payloadStart] === 0x0a || bytes[payloadStart] === 0x0d) payloadStart += 1

    const endIdx = indexOfAscii(bytes, endStreamNeedle, payloadStart)
    if (endIdx === -1) break

    let payloadEnd = endIdx
    while (payloadEnd > payloadStart && (bytes[payloadEnd - 1] === 0x0a || bytes[payloadEnd - 1] === 0x0d)) {
      payloadEnd--
    }

    const dictWindowStart = Math.max(0, streamIdx - 600)
    const dictWindow = sliceToAscii(bytes.slice(dictWindowStart, streamIdx))
    const isFlate = /\/FlateDecode\b/.test(dictWindow)

    const payloadBytes = bytes.slice(payloadStart, payloadEnd)
    const maybeDecompressed = isFlate ? await inflateDeflate(payloadBytes) : payloadBytes

    const payloadStr = new TextDecoder('utf-8', { fatal: false }).decode(maybeDecompressed)
    const extracted = extractTextFromPdfPayloadString(payloadStr)
    if (extracted) extractedParts.push(extracted)

    cursor = endIdx + endStreamNeedle.length
  }

  const combined = extractedParts
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!looksLikeRealResumeText(combined)) {
    throw new Error('Could not extract readable text from PDF. The PDF may be scanned/image-based or heavily encoded. Please try exporting as a text-based PDF or uploading a TXT file.')
  }

  console.log('PDF text extracted, length:', combined.length)
  return combined
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
