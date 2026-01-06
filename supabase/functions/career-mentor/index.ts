
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  question: string
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

    const { question }: RequestBody = await req.json()

    // Validate input
    if (!question || typeof question !== 'string' || question.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Invalid question. Must be a string under 2000 characters.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Processing question for user:', user.id)

    const systemPrompt = `You are an expert career mentor with deep knowledge of both hardware and software roles.

You must follow these strict rules for your response format:
Do not use markdown in any form.
Do not use headings, titles, or sections with symbols.
Do not use bullet points, numbered lists, hyphens, or asterisks.
Do not add greetings, motivational lines, or closing remarks.
Do not explain what you are doing.
Do not use emojis or special formatting characters.

Answer in plain text paragraphs only. Be direct, factual, and neutral. Use short, clear paragraphs separated by blank lines.

Cover these topics in your answer: what the role involves, educational background needed, core skills and tools, hands-on experience suggestions, project or internship ideas, job titles and target companies, and tips for networking and learning.`

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
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
