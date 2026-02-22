// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FUNCTION_VERSION = "2026-01-27T02:00:00Z"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

const SYSTEM_PROMPT = `You are ASPIRO, a warm and experienced career mentor with 20+ years helping professionals navigate their careers. You speak naturally like a real mentor would - conversational, encouraging, and practical.

CRITICAL FORMATTING RULES:
1. NEVER use asterisks (*) for emphasis or bullet points
2. NEVER use markdown formatting (no **, no ##, no -, no bullets)
3. Write in flowing paragraphs like natural speech
4. Use "First," "Second," "Also," "Another thing," for lists
5. Sound like a supportive friend giving advice over coffee

Your personality:
- Warm and encouraging but honest
- Share practical, actionable advice
- Use conversational phrases like "Here's the thing...", "What I've seen work...", "Let me be real with you..."
- Keep responses focused and helpful
- Celebrate their strengths while being honest about areas to develop`

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

    const { message, question, conversationHistory, careerContext } = await req.json()
    
    // Accept both 'message' and 'question' for compatibility
    const userMessage = message || question

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "Missing message or question" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY")
    if (!openrouterApiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      })
    }

    let contextualPrompt = SYSTEM_PROMPT

    if (careerContext) {
      contextualPrompt += `\n\nUser's career context:\n`
      if (careerContext.currentRole) contextualPrompt += `Current role: ${careerContext.currentRole}\n`
      if (careerContext.targetRole) contextualPrompt += `Target role: ${careerContext.targetRole}\n`
      if (careerContext.experience) contextualPrompt += `Experience: ${careerContext.experience}\n`
      if (careerContext.skills) contextualPrompt += `Skills: ${Array.isArray(careerContext.skills) ? careerContext.skills.join(", ") : careerContext.skills}\n`
    }

    // Build messages for OpenRouter (OpenAI-compatible format)
    const messages: any[] = [
      { role: "system", content: contextualPrompt }
    ]
    
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory.slice(-10)) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        })
      }
    }

    messages.push({ role: "user", content: userMessage })

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
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true // Enable streaming
          }),
          signal: controller.signal
        })

        response = await fetchPromise
        clearTimeout(timeoutId)

        if (response.ok) {
          console.log(`✅ Success with model: ${model} - streaming response`)
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
      
      let userMessage = "I'm having trouble connecting right now. "
      if (hasRateLimits) {
        userMessage += "All AI models are currently rate-limited. Please try again in a few minutes."
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
      }
    })
  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
