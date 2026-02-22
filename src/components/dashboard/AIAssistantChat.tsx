import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, FileText, Upload, AlertTriangle, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useStreamingAI } from '@/hooks/useStreamingAI'
import { useResumeStore } from '@/stores/resumeStore'
import { ChatMessageSkeleton } from '@/components/ui/loading-skeletons'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  isError?: boolean
}

// Memoized Message Bubble
const MessageBubble = memo(({
  message
}: {
  message: Message
}) => {
  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex items-start gap-3 max-w-[85%] ${
        message.sender === 'user' ? 'flex-row-reverse' : ''
      }`}>
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
          message.sender === 'user' 
            ? 'bg-gradient-to-br from-primary to-secondary' 
            : message.isError 
              ? 'bg-destructive/20'
              : 'bg-muted'
        }`}>
          {message.sender === 'user' ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : message.isError ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : (
            <Bot className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className={`${
          message.sender === 'user'
            ? 'message-bubble-user'
            : message.isError 
              ? 'message-bubble-ai bg-destructive/10 border border-destructive/20'
              : 'message-bubble-ai'
        }`}>
          <div className="text-sm">
            {message.sender === 'ai' ? (
              <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
            ) : (
              <p>{message.text}</p>
            )}
          </div>
          <p className={`text-xs mt-2 ${
            message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
})

MessageBubble.displayName = 'MessageBubble'

// Memoized Quick Question Button
const QuickQuestionButton = memo(({
  question,
  onClick,
  disabled
}: {
  question: string
  onClick: () => void
  disabled: boolean
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/50 text-muted-foreground border border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
    >
      {question}
    </button>
  )
})

QuickQuestionButton.displayName = 'QuickQuestionButton'

export const AIAssistantChat = () => {
  // Global store
  const {
    resumeFileName,
    resumeFile,
    analysisResult,
    suggestionsResult,
  } = useResumeStore()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [chatError, setChatError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { stream, isStreaming: isTyping } = useStreamingAI()

  const hasResume = resumeFile !== null || resumeFileName !== null
  const hasAnalysis = analysisResult !== null || suggestionsResult !== null

  // Initial greeting based on context
  useEffect(() => {
    let greeting = "Hello! I'm your AI career assistant. I can help you with career advice, interview preparation, skill development, and job search strategies."
    
    if (hasResume && hasAnalysis) {
      greeting += ` I see you've uploaded your resume and received an analysis. Feel free to ask me questions about your results or any career-related topics!`
    } else if (hasResume) {
      greeting += ` I see you've uploaded your resume. You can ask me about your career options or run an analysis in the Resume Analyzer tab.`
    } else {
      greeting += ` Upload your resume in the Resume Analyzer tab for personalized insights, or ask me any career question!`
    }

    setMessages([{
      id: '1',
      text: greeting,
      sender: 'ai',
      timestamp: new Date()
    }])
  }, [hasResume, hasAnalysis])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = useCallback(async (messageOverride?: string) => {
    const messageText = messageOverride ?? inputValue
    if (!messageText.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = messageText
    setInputValue('')
    setChatError(null)

    // Create placeholder AI message for streaming
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, aiMessage])

    // Build context-aware prompt
    let contextPrompt = currentInput
    if (hasResume && analysisResult?.analysis) {
      contextPrompt = `Context: The user has uploaded a resume. Their resume analysis shows: ${analysisResult.analysis.substring(0, 500)}...\n\nUser Question: ${currentInput}`
    }

    try {
      await stream({
        endpoint: 'career-mentor',
        body: { question: contextPrompt },
        onChunk: (_, accumulated) => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: accumulated }
              : msg
          ))
        },
        onError: () => {
          setChatError('Unable to get response')
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  text: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
                  isError: true
                }
              : msg
          ))
          toast({
            title: "Assistant unavailable",
            description: "Unable to get response from AI assistant",
            variant: "destructive"
          })
        }
      })
    } catch {
      // Error already handled in onError callback
    }
  }, [inputValue, isTyping, hasResume, analysisResult, toast, stream])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleQuickQuestion = useCallback((question: string) => {
    if (isTyping) return
    handleSendMessage(question)
  }, [isTyping, handleSendMessage])

  const handleRetry = useCallback(() => {
    setChatError(null)
    // Find the last user message and resend it
    setMessages(prev => {
      const filtered = prev.filter(msg => !msg.isError)
      const lastUserMsg = [...filtered].reverse().find(msg => msg.sender === 'user')
      if (lastUserMsg) {
        // Remove the error AI message, then resend
        setTimeout(() => handleSendMessage(lastUserMsg.text), 0)
      }
      return filtered
    })
  }, [handleSendMessage])

  // Button state explanations
  const sendButtonDisabled = !inputValue.trim() || isTyping
  const sendButtonHint = isTyping 
    ? 'Waiting for response...'
    : !inputValue.trim()
      ? 'Type a message to send'
      : null

  const quickQuestions = [
    "How do I prepare for interviews?",
    "What skills should I learn for data science?",
    "How to negotiate salary?",
    "Best practices for remote work?",
    "How to switch careers?",
    "Building a professional network"
  ]

  return (
    <article className="flex flex-col h-[600px] rounded-2xl overflow-hidden" aria-labelledby="chat-heading">
      {/* Header */}
      <header className="flex items-center gap-4 p-5 border-b border-border/50 bg-card/50">
        <div className="relative" aria-hidden="true">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-card" />
        </div>
        <div className="flex-1">
          <h2 id="chat-heading" className="font-semibold text-foreground">AI Career Assistant</h2>
          <p className="text-xs text-muted-foreground">Ask questions about careers, interviews, and skill development.</p>
        </div>
        {hasResume && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <FileText className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-xs text-primary">Resume context active</span>
          </div>
        )}
      </header>

      {/* Context Banner */}
      {!hasResume && (
        <div className="flex items-center justify-center gap-2 px-5 py-2 bg-muted/30 border-b border-border/50">
          <Upload className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">
            Upload your resume in the Resume Analyzer tab for personalized advice
          </span>
        </div>
      )}

      {/* Error Banner */}
      {chatError && (
        <div 
          className="flex items-center justify-between px-5 py-2 bg-destructive/10 border-b border-destructive/20"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" aria-hidden="true" />
            <span className="text-xs text-destructive">Connection issue. The AI couldn't respond to your message.</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
          >
            <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-card/30 to-transparent"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Ask me anything about career planning, job searching, interview prep, or professional development.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        
        {isTyping && messages[messages.length - 1]?.text === '' && (
          <div className="flex justify-start animate-fade-in" role="status" aria-label="AI is typing">
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center" aria-hidden="true">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="message-bubble-ai">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-5 py-4 border-t border-border/50 bg-card/30">
        <nav aria-label="Suggested questions">
          <div className="flex flex-wrap gap-2 mb-4">
            {quickQuestions.map((question) => (
              <QuickQuestionButton
                key={question}
                question={question}
                onClick={() => handleQuickQuestion(question)}
                disabled={isTyping}
              />
            ))}
          </div>
        </nav>

        {/* Input */}
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <label htmlFor="chat-input" className="sr-only">Ask a career question</label>
              <Input
                id="chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your career..."
                className="input-modern pr-12"
                disabled={isTyping}
                aria-describedby={sendButtonHint ? "chat-input-hint" : undefined}
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={sendButtonDisabled}
              className="btn-primary px-4"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
          {sendButtonHint && (
            <p id="chat-input-hint" className="text-xs text-muted-foreground text-center">{sendButtonHint}</p>
          )}
        </div>
      </div>
    </article>
  )
}
