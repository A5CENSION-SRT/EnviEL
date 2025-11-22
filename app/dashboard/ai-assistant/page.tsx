"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Send, Bot, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: number
  role: 'user' | 'ai'
  content: string
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'ai',
      content: "Hello Ranger. I am your EcoGuard AI Assistant. I have access to all sensor data in Bandipur National Park. How can I help you today?"
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue
    }

    setMessages([...messages, newMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        role: 'ai',
        content: "I've received your query. Analyzing recent alerts from the Moyar River sector..."
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // In a real app, this would trigger the Web Speech API
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-[calc(100vh-4rem)]">
      <Card className="flex-1 flex flex-col border-border shadow-sm bg-card">
        <CardHeader className="border-b border-border py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium">Forest Command AI</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`shrink-0 ${isListening ? 'text-destructive border-destructive animate-pulse' : ''}`}
                onClick={toggleListening}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type your message or use voice command..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
