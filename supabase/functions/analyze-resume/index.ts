// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { extractText } from "npm:unpdf@0.12.1"

const FUNCTION_VERSION = "2026-01-27T05:00:00Z"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

const MAX_TEXT_CHARS = 12000

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS)
}

function isTextFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase()
  return ext === "txt" || ext === "md"
}

function isPDFFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase()
  return ext === "pdf"
}

function isSupportedFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase()
  return ext === "pdf" || ext === "txt" || ext === "md"
}

// Extract text from PDF using unpdf library
async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  try {
    const { text } = await extractText(buffer, { mergePages: true })
    console.log("Extracted PDF text length:", text.length)
    return text
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error(`Failed to extract PDF text: ${error.message}`)
  }
}

function buildPrompt(analysisType: "target-role" | "best-fit", targetRole?: string) {
  if (analysisType === "target-role" && targetRole) {
    const sanitizedRole = targetRole.slice(0, 100).replace(/[<>]/g, "")
    return `You are an expert career counselor. Analyze this resume for the role of "${sanitizedRole}".

Be specific, cite actual content from the resume. Reference specific technologies, projects, and achievements.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "analysis": "Comprehensive paragraph analyzing match for target role. Be honest about gaps.",
  "suggestions": [
    {
      "role": "${sanitizedRole}",
      "match": 85,
      "whyItFits": "Detailed explanation with specific evidence from resume",
      "skillsToHighlight": ["Skill 1", "Skill 2", "Skill 3"],
      "skillsToDevelop": ["Gap 1", "Gap 2", "Gap 3"],
      "description": "Brief summary"
    }
  ],
  "overallStrengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvementsToConsider": ["Improvement 1", "Improvement 2", "Improvement 3"]
}`
  }

  return `You are an expert career counselor. Analyze this resume and suggest top 3 suitable job roles.

Be SPECIFIC - cite actual technologies, projects, achievements from the resume.
Be HONEST - mention gaps clearly.
Provide ACTIONABLE feedback.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "analysis": "3-4 sentence analysis. Mention core strengths, experience level, standout qualities.",
  "suggestions": [
    {
      "role": "Best Role Title",
      "match": 95,
      "whyItFits": "3-4 sentences citing specific evidence from resume",
      "skillsToHighlight": ["Skill with context", "Skill 2", "Skill 3"],
      "skillsToDevelop": ["Gap 1", "Gap 2", "Gap 3"],
      "description": "One sentence summary"
    },
    {
      "role": "Second Best Role",
      "match": 87,
      "whyItFits": "Detailed explanation",
      "skillsToHighlight": ["skill1", "skill2", "skill3"],
      "skillsToDevelop": ["gap1", "gap2", "gap3"],
      "description": "Summary"
    },
    {
      "role": "Third Best Role",
      "match": 82,
      "whyItFits": "Detailed explanation",
      "skillsToHighlight": ["skill1", "skill2", "skill3"],
      "skillsToDevelop": ["gap1", "gap2", "gap3"],
      "description": "Summary"
    }
  ],
  "overallStrengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4"],
  "improvementsToConsider": ["Improvement 1", "Improvement 2", "Improvement 3"]
}`
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      })
    }

    const { filePath: rawFilePath, analysisType, targetRole } = await req.json()

    if (!rawFilePath || !analysisType) {
      return new Response(JSON.stringify({ error: "Missing filePath or analysisType" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Sanitize filePath to prevent path traversal
    const filePath = rawFilePath.replace(/\.\./g, '').replace(/^\/+/, '')

    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY")
    if (!openrouterApiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    const fileName = filePath.split("/").pop() || "resume"
    
    if (!isSupportedFile(fileName)) {
      return new Response(JSON.stringify({ error: "Unsupported file type. Please upload PDF or TXT." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }
    
    const objectUrl = `${supabaseUrl}/storage/v1/object/resumes/${filePath}`
    const storageResponse = await fetch(objectUrl, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    })

    if (!storageResponse.ok) {
      const errorText = await storageResponse.text()
      return new Response(
        JSON.stringify({ error: "Failed to download resume file", details: errorText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      )
    }

    const fileData = await storageResponse.arrayBuffer()
    const prompt = buildPrompt(analysisType, targetRole)
    
    let resumeText: string
    
    if (isTextFile(fileName)) {
      resumeText = normalizeText(new TextDecoder().decode(fileData))
    } else if (isPDFFile(fileName)) {
      const rawText = await extractPDFText(fileData)
      resumeText = normalizeText(rawText)
    } else {
      return new Response(JSON.stringify({ error: "Unsupported file format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    if (!resumeText || resumeText.length < 50) {
      return new Response(JSON.stringify({ 
        error: "Could not extract sufficient text from PDF. Please try uploading a text-based PDF or .txt file.",
        extractedLength: resumeText?.length || 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Model fallback chain - will try in order if rate limited
    const MODEL_FALLBACK_CHAIN = [
      "anthropic/claude-3-haiku", // Best quality but paid (cheap)
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "liquid/lfm-2.5-1.2b-instruct:free",
      "arcee-ai/trinity-large-preview:free",
      "upstage/solar-pro-3:free",
    ]

    // Optional backup API key for failover
    const backupApiKey = Deno.env.get("OPENROUTER_API_KEY_BACKUP")
    
    // Helper: Exponential backoff delay
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    let response: Response | null = null
    let lastError = ""
    let successfulModel = ""
    const failedModels: string[] = []
    const REQUEST_TIMEOUT = 30000 // 30 seconds per model
    
    // Try each model in the fallback list with production-grade error handling
    for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
      const model = MODEL_FALLBACK_CHAIN[i]
      const apiKey = (i === MODEL_FALLBACK_CHAIN.length - 1 && backupApiKey) ? backupApiKey : openrouterApiKey
      
      console.log(`[Attempt ${i + 1}/${MODEL_FALLBACK_CHAIN.length}] Trying model: ${model}`)
      
      // Exponential backoff: wait before retry (except first attempt)
      if (i > 0) {
        const delayMs = Math.min(1000 * Math.pow(2, i - 1), 8000) // Cap at 8s
        console.log(`Waiting ${delayMs}ms before retry...`)
        await sleep(delayMs)
      }
      
      try {
        // Create AbortController for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
        
        const fetchPromise = fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aspiro-career.app",
            "X-Title": "ASPIRO Career Assistant"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: "You are an expert career counselor. Always respond with valid JSON only."
              },
              {
                role: "user",
                content: `${prompt}\n\n--- RESUME ---\n${resumeText}\n--- END ---`
              }
            ],
            temperature: 0.3,
            max_tokens: 3000,
            stream: true
          }),
          signal: controller.signal
        })

        response = await fetchPromise
        clearTimeout(timeoutId)

        if (response.ok) {
          console.log(`✅ Success with model: ${model}`)
          successfulModel = model
          break // Success! Exit the loop
        }

        // Check if it's a rate limit error
        const errorText = await response.text()
        lastError = errorText
        
        const isRateLimit = response.status === 429 || 
                           errorText.includes("rate-limit") || 
                           errorText.includes("rate limit") ||
                           errorText.includes("quota")
        
        if (isRateLimit) {
          console.log(`🔄 Model ${model} is rate-limited (${response.status}), trying next...`)
          failedModels.push(`${model}:rate_limited`)
          response = null
          continue
        } else {
          // Other error, might work with different model
          const statusCode = response.status
          console.log(`❌ Model ${model} failed with ${statusCode}: ${errorText.slice(0, 200)}`)
          failedModels.push(`${model}:${statusCode}`)
          response = null
          continue
        }
      } catch (error) {
        const isTimeout = error.name === "AbortError"
        const errorType = isTimeout ? "timeout" : "network_error"
        console.error(`❌ Request ${errorType} for ${model}:`, error.message)
        lastError = `${errorType}: ${error.message}`
        failedModels.push(`${model}:${errorType}`)
        response = null
        continue
      }
    }

    if (!response || !response.ok) {
      console.error("❌ All models exhausted. Failed models:", failedModels.join(", "))
      console.error("Last error:", lastError)
      
      // Provide detailed error message to user
      const hasRateLimits = failedModels.some(m => m.includes("rate_limited"))
      const hasTimeouts = failedModels.some(m => m.includes("timeout"))
      
      let userMessage = "AI service temporarily unavailable. "
      if (hasRateLimits) {
        userMessage += "All models are currently rate-limited. Please try again in a few minutes."
      } else if (hasTimeouts) {
        userMessage += "Request timeout. Please check your connection and try again."
      } else {
        userMessage += "All AI models failed to respond. Please try again later."
      }
      
      return new Response(
        JSON.stringify({ 
          error: userMessage,
          technical_details: failedModels.join(", "),
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      )
    }
    
    console.log(`✅ Streaming response from: ${successfulModel}`)

    // Return streaming response (Server-Sent Events)
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  
                  if (content) {
                    // Send each chunk as SSE
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON chunks
                  continue
                }
              }
            }
          }
          
          // Send final [DONE] marker
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      status: 200
    })
  } catch (error) {
    console.error("Function error:", error)
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
