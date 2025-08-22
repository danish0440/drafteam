// Enhanced Voice Service using premium APIs
// Integrates ElevenLabs for TTS and Deepgram for STT

class VoiceService {
  constructor() {
    this.isInitialized = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.speechEnabled = false;
    
    // API configurations
    this.config = {
      elevenLabs: {
        apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - natural female voice
        baseUrl: 'https://api.elevenlabs.io/v1'
      },
      deepgram: {
        apiKey: import.meta.env.VITE_DEEPGRAM_API_KEY || '',
        baseUrl: 'https://api.deepgram.com/v1'
      },
      openai: {
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1'
      }
    };
    
    // Fallback to Web Speech API if premium APIs not available
    this.fallbackToWebSpeech = true;
    this.recognition = null;
    this.synthesis = null;
    
    // Voice settings
    this.voiceSettings = {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.3,
      use_speaker_boost: true
    };
    
    // Callbacks
    this.onListeningStart = null;
    this.onListeningEnd = null;
    this.onTranscript = null;
    this.onError = null;
    this.onSpeakingStart = null;
    this.onSpeakingEnd = null;
    
    // Current session references
    this.currentSocket = null;
    this.currentMediaRecorder = null;
    this.currentStream = null;
  }

  async initialize() {
    try {
      // Check if premium APIs are available
      const hasElevenLabs = !!this.config.elevenLabs.apiKey;
      const hasDeepgram = !!this.config.deepgram.apiKey;
      const hasOpenAI = !!this.config.openai.apiKey;
      
      console.log('Voice Service - API Status:', {
        elevenLabs: hasElevenLabs,
        deepgram: hasDeepgram,
        openai: hasOpenAI
      });
      
      // Initialize Web Speech API as fallback
      if (this.fallbackToWebSpeech) {
        await this.initializeWebSpeechAPI();
      }
      
      this.isInitialized = true;
      console.log('Voice Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Voice Service:', error);
      this.onError?.(error);
      return false;
    }
  }

  async initializeWebSpeechAPI() {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onstart = () => {
        this.isListening = true;
        this.onListeningStart?.();
      };
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        this.onTranscript?.(transcript, event.results[event.results.length - 1].isFinal);
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.onError?.(new Error(`Speech recognition error: ${event.error}`));
        this.isListening = false;
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        this.onListeningEnd?.();
      };
    }
    
    // Initialize Speech Synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  // Text-to-Speech using ElevenLabs (premium) or Web Speech API (fallback)
  async speak(text, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      this.isSpeaking = true;
      this.onSpeakingStart?.();
      
      // Try ElevenLabs first if API key is available
      if (this.config.elevenLabs.apiKey) {
        await this.speakWithElevenLabs(text, options);
      } else {
        // Fallback to Web Speech API
        await this.speakWithWebSpeechAPI(text, options);
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      this.onError?.(error);
      
      // Try fallback if premium API fails
      if (this.config.elevenLabs.apiKey) {
        try {
          await this.speakWithWebSpeechAPI(text, options);
        } catch (fallbackError) {
          console.error('Fallback TTS also failed:', fallbackError);
        }
      }
    } finally {
      this.isSpeaking = false;
      this.onSpeakingEnd?.();
    }
  }

  async speakWithElevenLabs(text, options = {}) {
    const response = await fetch(`${this.config.elevenLabs.baseUrl}/text-to-speech/${this.config.elevenLabs.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.config.elevenLabs.apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          ...this.voiceSettings,
          ...options.voiceSettings
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = reject;
      audio.play();
    });
  }

  async speakWithWebSpeechAPI(text, options = {}) {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      utterance.onend = resolve;
      utterance.onerror = reject;
      
      this.synthesis.speak(utterance);
    });
  }

  // Speech-to-Text using Deepgram (premium) or Web Speech API (fallback)
  async startListening() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (this.isListening) {
      return;
    }
    
    try {
      // Try Deepgram first if API key is available
      if (this.config.deepgram.apiKey) {
        await this.startListeningWithDeepgram();
      } else {
        // Fallback to Web Speech API
        await this.startListeningWithWebSpeechAPI();
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
      this.onError?.(error);
      
      // Try fallback if premium API fails
      if (this.config.deepgram.apiKey) {
        try {
          await this.startListeningWithWebSpeechAPI();
        } catch (fallbackError) {
          console.error('Fallback STT also failed:', fallbackError);
        }
      }
    }
  }

  async startListeningWithDeepgram() {
    try {
      // Check if we have microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create WebSocket connection to Deepgram
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&interim_results=true`;
      const socket = new WebSocket(wsUrl, ['token', this.config.deepgram.apiKey]);
      
      // Set up MediaRecorder to send audio data
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      socket.onopen = () => {
        console.log('Deepgram WebSocket connected');
        this.isListening = true;
        this.onListeningStart?.();
        
        mediaRecorder.start(100); // Send data every 100ms
      };
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.channel?.alternatives?.[0]?.transcript) {
          const transcript = data.channel.alternatives[0].transcript;
          const isFinal = data.is_final || false;
          this.onTranscript?.(transcript, isFinal);
        }
      };
      
      socket.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        this.onError?.(new Error('Deepgram connection failed'));
        this.cleanup(socket, mediaRecorder, stream);
      };
      
      socket.onclose = () => {
        console.log('Deepgram WebSocket closed');
        this.isListening = false;
        this.onListeningEnd?.();
        this.cleanup(socket, mediaRecorder, stream);
      };
      
      mediaRecorder.ondataavailable = (event) => {
        if (socket.readyState === WebSocket.OPEN && event.data.size > 0) {
          socket.send(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
      
      // Store references for cleanup
      this.currentSocket = socket;
      this.currentMediaRecorder = mediaRecorder;
      this.currentStream = stream;
      
    } catch (error) {
      console.error('Failed to start Deepgram listening:', error);
      // Fallback to Web Speech API
      await this.startListeningWithWebSpeechAPI();
    }
  }
  
  cleanup(socket, mediaRecorder, stream) {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async startListeningWithWebSpeechAPI() {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }
    
    this.recognition.start();
  }

  stopListening() {
    if (this.currentSocket || this.currentMediaRecorder || this.currentStream) {
      // Stop Deepgram session
      this.cleanup(this.currentSocket, this.currentMediaRecorder, this.currentStream);
      this.currentSocket = null;
      this.currentMediaRecorder = null;
      this.currentStream = null;
    } else if (this.recognition && this.isListening) {
      // Stop Web Speech API
      this.recognition.stop();
    }
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.onSpeakingEnd?.();
  }

  toggleSpeech() {
    this.speechEnabled = !this.speechEnabled;
    if (!this.speechEnabled) {
      this.stopSpeaking();
      this.stopListening();
    }
    return this.speechEnabled;
  }

  // Voice quality settings
  updateVoiceSettings(settings) {
    this.voiceSettings = { ...this.voiceSettings, ...settings };
  }

  // Get available voices (for Web Speech API)
  getAvailableVoices() {
    if (this.synthesis) {
      return this.synthesis.getVoices();
    }
    return [];
  }

  // Status getters
  get status() {
    return {
      isInitialized: this.isInitialized,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      speechEnabled: this.speechEnabled,
      hasElevenLabs: !!this.config.elevenLabs.apiKey,
      hasDeepgram: !!this.config.deepgram.apiKey,
      hasOpenAI: !!this.config.openai.apiKey
    };
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;