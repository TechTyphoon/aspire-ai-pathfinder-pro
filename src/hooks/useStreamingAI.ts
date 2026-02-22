import { useState, useCallback, useRef } from 'react'
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client'

export interface StreamingOptions {
  endpoint: string
  body: Record<string, unknown>
  onChunk?: (chunk: string, accumulated: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

export interface StreamingState {
  isStreaming: boolean
  error: string | null
  accumulated: string
}

export function useStreamingAI() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accumulated, setAccumulated] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const stream = useCallback(async ({
    endpoint,
    body,
    onChunk,
    onComplete,
    onError
  }: StreamingOptions): Promise<string> => {
    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    
    setIsStreaming(true)
    setError(null)
    setAccumulated('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Not authenticated. Please log in and try again.')
      }
      
      const functionUrl = `${SUPABASE_URL}/functions/v1/${endpoint}`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let fullText = ''
      let lineBuffer = '' // Buffer for partial SSE lines split across chunks

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // Prepend any leftover from previous chunk
        const data = lineBuffer + chunk
        const lines = data.split('\n')
        
        // Last element may be incomplete — save it for next iteration
        lineBuffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          
          if (trimmed.startsWith('data: ')) {
            const payload = trimmed.slice(6)
            if (payload === '[DONE]') continue

            try {
              const parsed = JSON.parse(payload)
              if (parsed.content) {
                fullText += parsed.content
                setAccumulated(fullText)
                onChunk?.(parsed.content, fullText)
              }
            } catch {
              // Ignore malformed JSON chunks
              continue
            }
          }
        }
      }
      
      // Process any remaining buffered data
      if (lineBuffer.trim().startsWith('data: ')) {
        const payload = lineBuffer.trim().slice(6)
        if (payload !== '[DONE]') {
          try {
            const parsed = JSON.parse(payload)
            if (parsed.content) {
              fullText += parsed.content
              setAccumulated(fullText)
              onChunk?.(parsed.content, fullText)
            }
          } catch {
            // Ignore malformed final chunk
          }
        }
      }

      if (!fullText) {
        throw new Error('No content received')
      }

      onComplete?.(fullText)
      return fullText
    } catch (err) {
      // Don't treat abort as an error
      if (err instanceof Error && err.name === 'AbortError') {
        return ''
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Streaming failed'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setAccumulated('')
  }, [])

  return {
    stream,
    abort,
    reset,
    isStreaming,
    error,
    accumulated
  }
}
