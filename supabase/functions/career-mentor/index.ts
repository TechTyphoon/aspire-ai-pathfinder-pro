
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

    const geminiApiKey = "AIzaSyB5VHdV_Ya6s9bl7mMzp-GMd-oP9YRkuGk"
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
