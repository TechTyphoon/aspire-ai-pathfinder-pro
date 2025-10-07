
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

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    console.log('Processing question:', question)

    const systemPrompt = `Act as an expert AI Career Mentor and a seasoned career coach from the tech industry with deep knowledge of both hardware and software roles. Your task is to provide a comprehensive, structured, and encouraging roadmap.

**Your Response Structure:**
1. ✅ 1. Understand the Role: A clear summary of what the job entails.
2. 🎓 2. Educational Background: Specific degrees and crucial subjects.
3. 🧠 3. Core Skills: A detailed table of essential skills and the tools/topics for each.
4. 🧪 4. Hands-on with Tools: A list of key software and hardware to get practical experience with.
5. 📚 5. Projects or Internships: Concrete ideas for building a portfolio.
6. 🔍 6. How to Apply: Common job titles and target companies.
7. 🧭 Bonus Tips: Actionable advice for networking and continuous learning.

Provide a direct, helpful, and expert answer based on this structure.`

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
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: question
          }
        ],
      })
    })

    const aiResponse = await response.json()
    console.log('Lovable AI response:', JSON.stringify(aiResponse, null, 2))
    
    if (!response.ok) {
      console.error('Lovable AI error:', aiResponse)
      throw new Error(`Lovable AI error: ${aiResponse.error?.message || 'Unknown error'}`)
    }

    if (!aiResponse.choices?.[0]?.message?.content) {
      console.error('Invalid AI response structure:', aiResponse)
      throw new Error('Invalid response from AI - no text content found')
    }

    const analysis = aiResponse.choices[0].message.content

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
