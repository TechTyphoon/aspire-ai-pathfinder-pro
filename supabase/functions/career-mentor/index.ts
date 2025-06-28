
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  question: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { question }: RequestBody = await req.json()

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    console.log('Processing question:', question)

    const prompt = `Act as an expert AI Career Mentor and a seasoned career coach from the tech industry with deep knowledge of both hardware and software roles. A user is asking about a career path. Your task is to provide a comprehensive, structured, and encouraging roadmap.

**User's Question:** "${question}"

**Your Response Structure:**
1. ✅ 1. Understand the Role: A clear summary of what the job entails.
2. 🎓 2. Educational Background: Specific degrees and crucial subjects.
3. 🧠 3. Core Skills: A detailed table of essential skills and the tools/topics for each.
4. 🧪 4. Hands-on with Tools: A list of key software and hardware to get practical experience with.
5. 📚 5. Projects or Internships: Concrete ideas for building a portfolio.
6. 🔍 6. How to Apply: Common job titles and target companies.
7. 🧭 Bonus Tips: Actionable advice for networking and continuous learning.

Provide a direct, helpful, and expert answer based on this structure.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    const geminiResponse = await response.json()
    console.log('Gemini API response:', JSON.stringify(geminiResponse, null, 2))
    
    if (!response.ok) {
      console.error('Gemini API error:', geminiResponse)
      throw new Error(`Gemini API error: ${geminiResponse.error?.message || 'Unknown error'}`)
    }

    if (!geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response structure:', geminiResponse)
      throw new Error('Invalid response from Gemini API - no text content found')
    }

    const analysis = geminiResponse.candidates[0].content.parts[0].text

    return new Response(
      JSON.stringify({ response: analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Career mentor error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Please check the function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
