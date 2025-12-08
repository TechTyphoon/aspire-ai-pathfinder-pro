import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export const AIAssistantChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI career assistant. I can help you with career advice, interview preparation, skill development, and job search strategies. What would you like to know?",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      const { data, error } = await supabase.functions.invoke('career-mentor', {
        body: {
          question: currentInput
        }
      })

      if (error) throw error

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI Assistant error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      toast({
        title: "Assistant unavailable",
        description: "Unable to get response from AI assistant",
        variant: "destructive"
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickQuestion = (question: string) => {
    if (isTyping) return
    setInputValue(question)
    setTimeout(() => handleSendMessage(), 100)
  }

  const quickQuestions = [
    "How do I prepare for interviews?",
    "What skills should I learn for data science?",
    "How to negotiate salary?",
    "Best practices for remote work?",
    "How to switch careers?",
    "Building a professional network"
  ]

  return (
    <div className="flex flex-col h-[600px] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-border/50 bg-card/50">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-card" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">AI Career Assistant</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-emerald-400">Online</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">Ready to help</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-card/30 to-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div className={`flex items-start gap-3 max-w-[85%] ${
              message.sender === 'user' ? 'flex-row-reverse' : ''
            }`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                message.sender === 'user' 
                  ? 'bg-gradient-to-br from-primary to-secondary' 
                  : 'bg-muted'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className={`${
                message.sender === 'user'
                  ? 'message-bubble-user'
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
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="message-bubble-ai">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-5 py-4 border-t border-border/50 bg-card/30">
        <div className="flex flex-wrap gap-2 mb-4">
          {quickQuestions.map((question) => (
            <button
              key={question}
              onClick={() => handleQuickQuestion(question)}
              disabled={isTyping}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/50 text-muted-foreground border border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {question}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your career..."
              className="input-modern pr-12"
              disabled={isTyping}
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="btn-primary px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
