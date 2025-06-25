
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Send } from 'lucide-react'

export const AIAssistantChat = () => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI career mentor. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ])

  const sendMessage = () => {
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      text: message,
      isBot: false,
      timestamp: new Date()
    }

    setMessages([...messages, newMessage])
    setMessage('')

    // Simulate AI response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Thanks for your message! I'm here to help with your career questions.",
        isBot: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">AI Career Mentor</h2>
        <p className="text-gray-400 mb-6">
          Get personalized career advice and guidance
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.isBot
                  ? 'bg-purple-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything about your career..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <Button
          onClick={sendMessage}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
