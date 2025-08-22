import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, BarChart3, TrendingUp, PieChart, Activity, Loader, Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import voiceService from '../services/VoiceService'

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello Boss! I\'m Jamal, your friendly Malaysian nature expert for DrafTeam. I can help you analyze project data, create charts, and share knowledge about Malaysian wildlife and conservation projects lah! What would you like to know, Boss?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chartData, setChartData] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [voiceQuality, setVoiceQuality] = useState('premium')
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize voice service
  useEffect(() => {
    const initializeVoiceService = async () => {
      try {
        await voiceService.initialize()
        
        // Set up callbacks
        voiceService.onListeningStart = () => setIsListening(true)
        voiceService.onListeningEnd = () => setIsListening(false)
        voiceService.onTranscript = (transcript, isFinal) => {
          if (isFinal) {
            setInputMessage(transcript)
          }
        }
        voiceService.onError = (error) => {
          console.error('Voice service error:', error)
          setIsListening(false)
          setIsSpeaking(false)
        }
        voiceService.onSpeakingStart = () => setIsSpeaking(true)
        voiceService.onSpeakingEnd = () => setIsSpeaking(false)
        
        console.log('Voice Service Status:', voiceService.status)
      } catch (error) {
        console.error('Failed to initialize voice service:', error)
      }
    }
    
    initializeVoiceService()
  }, [])

  // Voice control functions
  const startListening = async () => {
    if (!isListening) {
      try {
        await voiceService.startListening()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
      }
    }
  }

  const stopListening = () => {
    if (isListening) {
      voiceService.stopListening()
    }
  }

  const speakText = async (text) => {
    if (speechEnabled) {
      try {
        const options = voiceQuality === 'premium' ? {
          voiceSettings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.4
          }
        } : {
          rate: 1.1,
          pitch: 1,
          volume: 0.9
        }
        
        await voiceService.speak(text, options)
      } catch (error) {
        console.error('Error with text-to-speech:', error)
      }
    }
  }

  const stopSpeaking = () => {
    voiceService.stopSpeaking()
  }

  const toggleSpeech = () => {
    const newSpeechEnabled = voiceService.toggleSpeech()
    setSpeechEnabled(newSpeechEnabled)
  }

  const updateVoiceQuality = (quality) => {
    setVoiceQuality(quality)
    if (quality === 'premium') {
      voiceService.updateVoiceSettings({
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.4,
        use_speaker_boost: true
      })
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Get project context for AI
      const projectsResponse = await fetch('http://localhost:3001/api/projects')
      const projects = await projectsResponse.json()
      
      const dashboardResponse = await fetch('http://localhost:3001/api/dashboard/stats')
      const dashboardStats = await dashboardResponse.json()

      const context = {
        projects: projects,
        stats: dashboardStats
      }

      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          context: context
        })
      })

      const data = await response.json()

      if (response.ok) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        
        // Speak the AI response if speech is enabled
        if (speechEnabled) {
          speakText(data.response)
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Speak error message if speech is enabled
      if (speechEnabled) {
        speakText('Sorry, I encountered an error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateChart = async (analysisType) => {
    setIsLoading(true)
    try {
      const projectsResponse = await fetch('http://localhost:3001/api/projects')
      const projects = await projectsResponse.json()
      
      const dashboardResponse = await fetch('http://localhost:3001/api/dashboard/stats')
      const dashboardStats = await dashboardResponse.json()

      const response = await fetch('http://localhost:3001/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: { projects, stats: dashboardStats },
          analysisType: analysisType
        })
      })

      const analysisResult = await response.json()

      if (response.ok) {
        setChartData(analysisResult)
        const chartMessage = {
          id: Date.now(),
          type: 'ai',
          content: `I've generated a ${analysisType} analysis chart for you. Here are the insights:\n\n${analysisResult.insights}`,
          timestamp: new Date(),
          hasChart: true
        }
        setMessages(prev => [...prev, chartMessage])
      } else {
        throw new Error(analysisResult.error || 'Failed to generate analysis')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      const errorMessage = {
        id: Date.now(),
        type: 'ai',
        content: 'Sorry, I couldn\'t generate the analysis chart. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderChart = () => {
    if (!chartData || !chartData.data || chartData.data.length === 0) return null

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

    switch (chartData.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        )
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Bot className="w-8 h-8 mr-3 text-primary-600" />
              Jamal - Malaysian Nature AI
            </h1>
            <p className="text-gray-600 mt-1">Your expert guide to Malaysian flora, fauna, and natural heritage</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="btn btn-outline flex items-center"
              title="Voice Settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
            
            <button
              onClick={toggleSpeech}
              className={`btn ${speechEnabled ? 'btn-primary' : 'btn-outline'} flex items-center`}
              title={speechEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              {speechEnabled ? 'Voice On' : 'Voice Off'}
            </button>
            
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="btn btn-outline flex items-center text-red-600 border-red-600 hover:bg-red-50"
              >
                <VolumeX className="w-4 h-4 mr-2" />
                Stop Speaking
              </button>
            )}
            <button
              onClick={() => generateChart('project status')}
              className="btn btn-outline flex items-center"
              disabled={isLoading}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Status Chart
            </button>
            <button
              onClick={() => generateChart('progress trends')}
              className="btn btn-outline flex items-center"
              disabled={isLoading}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress Trends
            </button>
            <button
              onClick={() => generateChart('team performance')}
              className="btn btn-outline flex items-center"
              disabled={isLoading}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Team Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Voice Settings Panel */}
      {showVoiceSettings && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice Settings</h3>
            
            {/* API Status */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">API Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    voiceService.status?.hasElevenLabs ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-700">ElevenLabs TTS</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    voiceService.status?.hasElevenLabs 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {voiceService.status?.hasElevenLabs ? 'Connected' : 'Not Available'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    voiceService.status?.hasDeepgram ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-700">Deepgram STT</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    voiceService.status?.hasDeepgram 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {voiceService.status?.hasDeepgram ? 'Connected' : 'Not Available'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Web Speech API</span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                    Fallback Active
                  </span>
                </div>
              </div>
            </div>
            
            {/* Voice Quality Selection */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Voice Quality</h4>
              <div className="flex gap-3">
                <button
                  onClick={() => updateVoiceQuality('premium')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    voiceQuality === 'premium'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Premium (ElevenLabs)
                </button>
                <button
                  onClick={() => updateVoiceQuality('standard')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    voiceQuality === 'standard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Standard (Web Speech)
                </button>
              </div>
            </div>
            
            {/* Setup Instructions */}
            {(!voiceService.status?.hasElevenLabs || !voiceService.status?.hasDeepgram) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">Setup Premium Voice APIs</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  For the best voice quality, add your API keys to the environment variables:
                </p>
                <ul className="text-xs text-yellow-600 space-y-1">
                  <li>• VITE_ELEVENLABS_API_KEY for premium text-to-speech</li>
                  <li>• VITE_DEEPGRAM_API_KEY for premium speech recognition</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' ? 'bg-primary-600 ml-3' : 'bg-gray-200 mr-3'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className={`rounded-lg px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.hasChart && chartData && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Analysis Chart</h4>
                    {renderChart()}
                  </div>
                )}
                <div className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-primary-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-3xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-gray-600" />
                  <span className="text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Jamal about Malaysian nature, wildlife, conservation projects, or request data analysis..."
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                  isListening ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                rows={2}
                disabled={isLoading}
              />
              {isListening && (
                <div className="absolute right-3 top-3 flex items-center text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs font-medium">Listening...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`btn flex items-center px-4 ${
                isListening 
                  ? 'btn-outline border-red-500 text-red-600 hover:bg-red-50' 
                  : 'btn-outline'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="btn btn-primary flex items-center px-6"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line • Click microphone for voice input
        </div>
      </div>
    </div>
  )
}

export default AIChat