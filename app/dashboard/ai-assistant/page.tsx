"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Mic, Send, Bot, User, Volume2, VolumeX, Loader2, AlertTriangle, CheckCircle, Radio, Square, MicOff } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: number
  role: 'user' | 'ai'
  content: string
  commandExecuted?: boolean
  commandResult?: any
  timestamp: Date
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'ai',
      content: "SentinelSound AI online. I'm connected to the Bandipur acoustic sensor network. I can help you:\n\n• Review detection events (\"What's event #1?\")\n• Verify classifications (\"Mark event 3 as verified poaching\")\n• Get network status (\"Check sensor nodes\")\n• View summaries (\"Give me today's summary\")\n• List events by type (\"Show all gunshot events\")\n\nSpeak or type your command.",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [continuousMode, setContinuousMode] = useState(false)
  const [voiceActivity, setVoiceActivity] = useState(false)
  
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const audioChunksRef    = useRef<Blob[]>([])
  const scrollAreaRef     = useRef<HTMLDivElement>(null)
  const speechSynthRef    = useRef<SpeechSynthesisUtterance | null>(null)
  const streamRef         = useRef<MediaStream | null>(null)
  // Ref mirror of isListening — safe to read inside requestAnimationFrame callbacks
  // where the state closure would be stale.
  const isListeningRef    = useRef(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    
    return () => {
      if (speechSynthRef.current) {
        window.speechSynthesis.cancel()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const speakText = useCallback((text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Clean the text for better speech
    const cleanText = text
      .replace(/[#*_`]/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ', ')
      .substring(0, 500) // Limit length for TTS
    
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.rate = 1.1
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Try to use a clear voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Daniel') ||
      v.lang.startsWith('en')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      // In continuous mode, start listening again after AI finishes speaking
      if (continuousMode && !isLoading) {
        startRecording()
      }
    }
    utterance.onerror = () => setIsSpeaking(false)
    
    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [ttsEnabled, continuousMode, isLoading])

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const aiMessage: Message = {
        id: messages.length + 2,
        role: 'ai',
        content: data.reply,
        commandExecuted: data.command_executed,
        commandResult: data.command_result,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Speak the response
      speakText(data.reply)

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: messages.length + 2,
        role: 'ai',
        content: `Communication error: ${error instanceof Error ? error.message : 'Unknown error'}. Please retry.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = () => {
    sendMessage(inputValue)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Voice activity detection
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const checkVoice = () => {
        if (!isListeningRef.current) return   // ref is always current, no stale closure
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setVoiceActivity(average > 30)
        requestAnimationFrame(checkVoice)
      }
      checkVoice()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        audioContext.close()
        
        // Only transcribe if we have meaningful audio
        if (audioBlob.size > 1000) {
          await transcribeAudio(audioBlob)
        }
      }

      mediaRecorder.start()
      isListeningRef.current = true
      setIsListening(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListeningRef.current) {
      isListeningRef.current = false
      setIsListening(false)
      setVoiceActivity(false)
      mediaRecorderRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopRecording()
    } else {
      if (isSpeaking) stopSpeaking()
      startRecording()
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed')
      }

      if (data.transcription && data.transcription.trim()) {
        await sendMessage(data.transcription)
      } else {
        setIsLoading(false)
        if (continuousMode) {
          startRecording()
        }
      }
    } catch (error) {
      console.error('Transcription error:', error)
      const errorMessage: Message = {
        id: messages.length + 1,
        role: 'ai',
        content: `Audio processing failed. Please try again or type your command.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const toggleContinuousMode = () => {
    if (continuousMode) {
      setContinuousMode(false)
      if (isListening) stopRecording()
      if (isSpeaking) stopSpeaking()
    } else {
      setContinuousMode(true)
      if (!isListening && !isLoading && !isSpeaking) {
        startRecording()
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-[calc(100vh-4rem)]">
      <Card className="flex-1 flex flex-col border-border shadow-sm bg-card">
        <CardHeader className="border-b border-border py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle className="text-lg font-medium">SentinelSound AI</CardTitle>
              <Badge variant="outline" className="text-xs">
                Bandipur Network
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Continuous</span>
                <Switch 
                  checked={continuousMode} 
                  onCheckedChange={toggleContinuousMode}
                  disabled={isLoading}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setTtsEnabled(!ttsEnabled)
                  if (isSpeaking) stopSpeaking()
                }}
                title={ttsEnabled ? "Disable voice responses" : "Enable voice responses"}
              >
                {ttsEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <CardDescription>
            Voice-enabled command interface for acoustic sensor network
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
                  <div className={`flex flex-col gap-1 max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.commandResult && (
                      <div className="rounded-lg border border-border bg-background/50 p-3 text-xs max-w-full overflow-x-auto">
                        <div className="font-semibold text-muted-foreground mb-1">Command Result:</div>
                        <pre className="text-foreground/80 whitespace-pre-wrap">
                          {JSON.stringify(message.commandResult, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span suppressHydrationWarning>{formatTime(message.timestamp)}</span>
                      {message.commandExecuted && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Command executed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border bg-muted/20">
            {/* Voice Activity Indicator */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1 rounded-full transition-all duration-100 ${
                        voiceActivity ? 'bg-destructive' : 'bg-muted-foreground/30'
                      }`}
                      style={{ 
                        height: voiceActivity ? `${12 + Math.random() * 16}px` : '8px',
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-destructive font-medium">Listening...</span>
                <Button variant="ghost" size="sm" onClick={stopRecording}>
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </div>
            )}
            
            {isSpeaking && (
              <div className="flex items-center justify-center gap-2 mb-3 text-sm text-primary">
                <Volume2 className="h-4 w-4 animate-pulse" />
                <span>AI Speaking...</span>
                <Button variant="ghost" size="sm" onClick={stopSpeaking}>
                  Stop
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={`shrink-0 ${isListening ? 'animate-pulse' : ''}`}
                onClick={toggleListening}
                disabled={isLoading || isSpeaking}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                placeholder={isListening ? "Listening..." : "Type command or speak..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="flex-1"
                disabled={isLoading || isListening}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                className="shrink-0"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              <span>Try: &quot;Show pending events&quot; or &quot;Verify event 2 as poaching&quot;</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
