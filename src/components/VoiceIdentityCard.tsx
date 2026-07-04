import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  RefreshCw, 
  Activity, 
  Play, 
  Pause, 
  X, 
  Info,
  ChevronDown,
  Lock,
  Unlock,
  Radio
} from 'lucide-react';
import { playChime, speakText, cancelSpeech } from '../utils/audio';

interface VoiceIdentityCardProps {
  onVerificationSuccess: (active: boolean) => void;
  onSendAssistantMessage: (text: string) => void;
  isAnalyzing: boolean;
  isSpeaking: boolean;
  assistantMessages: any[];
  onMuteSpeech: () => void;
  selectedCompanion: string;
  rememberCompanionChoice: boolean;
  useCloudVoice: boolean;
  onShowCompanionSelection: (show: boolean) => void;
}

enum AuthState {
  LOCKED = 'LOCKED',
  PROMPTING = 'PROMPTING',
  LISTENING = 'LISTENING',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILED_PASSPHRASE = 'FAILED_PASSPHRASE',
  FAILED_VOICE = 'FAILED_VOICE'
}

export default function VoiceIdentityCard({
  onVerificationSuccess,
  onSendAssistantMessage,
  isAnalyzing: isGeminiAnalyzing,
  isSpeaking: isGeminiSpeaking,
  assistantMessages,
  onMuteSpeech,
  selectedCompanion,
  rememberCompanionChoice,
  useCloudVoice,
  onShowCompanionSelection
}: VoiceIdentityCardProps) {
  // Authentication states
  const [authState, setAuthState] = useState<AuthState>(AuthState.LOCKED);
  const [recognizedText, setRecognizedText] = useState("");
  const [biometricMetrics, setBiometricMetrics] = useState({
    pitch: 0,
    spectralFlux: 0,
    voiceMatchConfidence: 0,
    processingStep: ""
  });
  
  // Continuous Conversation state
  const [companionActive, setCompanionActive] = useState(false);
  const [companionStatus, setCompanionStatus] = useState<'Idle' | 'Listening...' | 'Speaking...' | 'Thinking...'>('Idle');
  const [isPaused, setIsPaused] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any | null>(null);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [lastCompanionResponse, setLastCompanionResponse] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  // Registered voice parameters
  const [registeredPassphrase, setRegisteredPassphrase] = useState("Hello SensevVision, let's begin.");
  const [forceVoiceMismatch, setForceVoiceMismatch] = useState(false); // Testing toggle
  
  const authRecognitionRef = useRef<any>(null);
  const continuousRecognitionRef = useRef<any>(null);

  // Initialize Speech Recognition for Authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setRecognizedText("");
        };

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (text) {
            setRecognizedText(text);
            runVerification(text);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Auth voice recognition error:", e);
          playChime('alert');
          setAuthState(AuthState.FAILED_PASSPHRASE);
          speakText("Speech not recognized or timed out. Please try again.", false);
        };

        authRecognitionRef.current = rec;
      }
    }
  }, [forceVoiceMismatch, registeredPassphrase]);

  // Handle continuous companion state updates based on App and speaking/thinking states
  useEffect(() => {
    if (!companionActive || isPaused) {
      setCompanionStatus('Idle');
      stopContinuousListening();
      return;
    }

    if (isGeminiAnalyzing) {
      setCompanionStatus('Thinking...');
      stopContinuousListening();
    } else if (isGeminiSpeaking) {
      setCompanionStatus('Speaking...');
      stopContinuousListening();
    } else {
      setCompanionStatus('Listening...');
      startContinuousListening();
    }
  }, [companionActive, isPaused, isGeminiAnalyzing, isGeminiSpeaking]);

  // Keep track of the last response from the assistant
  useEffect(() => {
    if (assistantMessages && assistantMessages.length > 0) {
      const lastMsg = assistantMessages[assistantMessages.length - 1];
      if (lastMsg.role === 'assistant') {
        setLastCompanionResponse(lastMsg.content);
      }
    }
  }, [assistantMessages]);

  // Handle Voice Identity activation press
  const activateVoiceIdentity = () => {
    cancelSpeech();
    playChime('click');
    setAuthState(AuthState.PROMPTING);
    
    // Speak welcome prompt
    const promptMessage = "Welcome to SensevVision. Please say your voice passphrase.";
    speakText(promptMessage, false);

    // Wait until the speech finishes before starting microphone (approx 3.8s)
    setTimeout(() => {
      startAuthMic();
    }, 3800);
  };

  // Start Auth Mic
  const startAuthMic = () => {
    if (!authRecognitionRef.current) {
      speakText("Speech recognition is not supported in this environment.", false);
      setAuthState(AuthState.LOCKED);
      return;
    }
    try {
      setAuthState(AuthState.LISTENING);
      playChime('click');
      authRecognitionRef.current.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
    }
  };

  // Run Biometric & Passphrase Verification Sim
  const runVerification = (spokenText: string) => {
    setAuthState(AuthState.VERIFYING);
    playChime('click');
    
    // Fuzzy matching
    const cleanSpoken = spokenText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isPassphraseMatch = cleanSpoken.includes('hello') && 
                              (cleanSpoken.includes('sensevision') || cleanSpoken.includes('vision') || cleanSpoken.includes('begin'));

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setBiometricMetrics({
          pitch: 110 + Math.random() * 40,
          spectralFlux: 0.82 + Math.random() * 0.1,
          voiceMatchConfidence: 0,
          processingStep: "Analyzing voice fundamental frequency (F0)..."
        });
      } else if (step === 2) {
        setBiometricMetrics(prev => ({
          ...prev,
          spectralFlux: 0.94 + Math.random() * 0.05,
          processingStep: "Mapping acoustic timbre vector against registered user profile..."
        }));
      } else if (step === 3) {
        setBiometricMetrics(prev => ({
          ...prev,
          voiceMatchConfidence: forceVoiceMismatch ? (30 + Math.random() * 15) : (94.8 + Math.random() * 4),
          processingStep: "Validating neural voiceprint characteristics..."
        }));
      } else if (step === 4) {
        clearInterval(interval);
        
        if (!isPassphraseMatch) {
          setAuthState(AuthState.FAILED_PASSPHRASE);
          playChime('alert');
          speakText("The passphrase did not match. Please try again.", false);
        } else if (forceVoiceMismatch) {
          setAuthState(AuthState.FAILED_VOICE);
          playChime('alert');
          speakText("Voice identity could not be verified. Please try again.", false);
        } else {
          setAuthState(AuthState.SUCCESS);
          playChime('success');
          
          if (rememberCompanionChoice && selectedCompanion) {
            setCompanionActive(true);
            onVerificationSuccess(true);
            onShowCompanionSelection(false);
            
            let companionGreeting = `Hello! I'm ${selectedCompanion}, your Sense Companion. How may I help you today?`;
            if (selectedCompanion === 'Alex') {
              companionGreeting = `Hello! I'm ${selectedCompanion}, your Sense Companion. What would you like to explore today?`;
            } else if (selectedCompanion === 'Maya') {
              companionGreeting = "Namaste! I'm Maya, your Sense Companion. Let me guide you with warm Indian English assistance.";
            } else if (selectedCompanion === 'Arjun') {
              companionGreeting = "Hello there, I'm Arjun, your Sense Companion. I am ready to help you navigate your environments safely.";
            } else if (selectedCompanion === 'Sophia') {
              companionGreeting = "Hola, soy Sophia, tu compañera de Sense Companion. Te ayudaré a entender tu entorno de manera clara.";
            } else if (selectedCompanion === 'Kenji') {
              companionGreeting = "こんにちは、ケンジです。あなたの視覚情報を日本語でサポートします。";
            }
            
            speakText(
              `Voice verified successfully. ${companionGreeting}`, 
              useCloudVoice,
              undefined,
              selectedCompanion
            );
          } else {
            setCompanionActive(false);
            onVerificationSuccess(false);
            onShowCompanionSelection(true);
            speakText("Voice verified successfully.", useCloudVoice, undefined, selectedCompanion);
          }
        }
      }
    }, 850);
  };

  // Start continuous voice listening loop
  const startContinuousListening = () => {
    if (isContinuousListening) return;

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition && !continuousRecognitionRef.current) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsContinuousListening(true);
        };

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (text) {
            handleContinuousInput(text);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Continuous voice loop error:", e);
          setIsContinuousListening(false);
          setTimeout(() => {
            if (companionActive && !isPaused && !isGeminiAnalyzing && !isGeminiSpeaking) {
              startContinuousListening();
            }
          }, 1000);
        };

        rec.onend = () => {
          setIsContinuousListening(false);
          setTimeout(() => {
            if (companionActive && !isPaused && !isGeminiAnalyzing && !isGeminiSpeaking) {
              startContinuousListening();
            }
          }, 300);
        };

        continuousRecognitionRef.current = rec;
      }
    }

    if (continuousRecognitionRef.current) {
      try {
        continuousRecognitionRef.current.start();
      } catch (err) {
        // Already started
      }
    }
  };

  // Stop continuous listening
  const stopContinuousListening = () => {
    if (continuousRecognitionRef.current && isContinuousListening) {
      try {
        continuousRecognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
      setIsContinuousListening(false);
    }
  };

  // Process voice recognized from continuous loop
  const handleContinuousInput = (rawText: string) => {
    const text = rawText.trim().toLowerCase();
    
    if (text === "stop" || text === "goodbye" || text === "exit" || text === "end conversation") {
      playChime('alert');
      endConversation();
      speakText("Ending continuous voice companion. Goodbye.", false);
      return;
    }

    playChime('click');
    onSendAssistantMessage(rawText);
  };

  // Pause conversation
  const togglePause = () => {
    playChime('click');
    if (isPaused) {
      setIsPaused(false);
      speakText("Resuming voice conversation.", false);
    } else {
      setIsPaused(true);
      cancelSpeech();
      stopContinuousListening();
      speakText("Voice conversation paused.", false);
    }
  };

  // End conversation and return to locked
  const endConversation = () => {
    playChime('alert');
    cancelSpeech();
    stopContinuousListening();
    setCompanionActive(false);
    onVerificationSuccess(false);
    setAuthState(AuthState.LOCKED);
    setIsPaused(false);
    setRecognizedText("");
  };

  // Replay last spoken response
  const replayLastResponse = () => {
    playChime('click');
    if (lastCompanionResponse) {
      speakText(lastCompanionResponse, false);
    } else {
      speakText("No previous response to replay.", false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" id="voice-identity-card-wrapper">
      
      {/* Decorative Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-1 w-full"></div>

      <div className="p-6 space-y-5">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded bg-blue-50 text-blue-600">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                🎙️ Voice Identity & Security
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-normal max-w-xl font-normal">
              Securely activate your personal AI companion using your registered voice. This ensures seamless visual guidance and hands-free conversational controls.
            </p>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {authState === AuthState.LOCKED && (
              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <Lock className="w-3 h-3 text-red-500 mr-1 shrink-0" />
                <span>🔒 LOCKED</span>
              </span>
            )}
            
            {(authState === AuthState.PROMPTING || authState === AuthState.LISTENING) && (
              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1 animate-pulse">
                <Mic className="w-3 h-3 text-blue-600 mr-1 shrink-0" />
                <span>LISTENING...</span>
              </span>
            )}

            {authState === AuthState.VERIFYING && (
              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 mr-1 shrink-0 animate-spin text-blue-600" />
                <span>🧠 VERIFYING...</span>
              </span>
            )}

            {authState === AuthState.SUCCESS && (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <Unlock className="w-3 h-3 text-emerald-600 mr-1 shrink-0" />
                <span>✅ VERIFIED</span>
              </span>
            )}

            {(authState === AuthState.FAILED_PASSPHRASE || authState === AuthState.FAILED_VOICE) && (
              <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3 text-red-600 mr-1 shrink-0" />
                <span>FAILED</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Panel based on state */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          
          {authState === AuthState.LOCKED && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-5 py-1">
              <div className="text-left space-y-1.5 w-full">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block font-bold">Registered Phrase</span>
                <span className="text-xs text-slate-800 font-bold bg-white border border-slate-200 px-3.5 py-2 rounded-xl block font-mono">
                  "{registeredPassphrase}"
                </span>
                <p className="text-[10px] text-slate-500 italic mt-1 font-medium">
                  💡 Tip: Speak this phrase exactly during the authentication test.
                </p>
              </div>
              
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                <button
                  id="activate-voice-id-btn"
                  onClick={activateVoiceIdentity}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center space-x-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <Mic className="w-4 h-4" />
                  <span>Activate Voice Identity</span>
                </button>
                
                {/* Visual Testing Helpers */}
                <div className="flex items-center justify-between px-1 mt-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase cursor-pointer flex items-center font-semibold">
                    <input
                      type="checkbox"
                      checked={forceVoiceMismatch}
                      onChange={(e) => setForceVoiceMismatch(e.target.checked)}
                      className="mr-1.5 rounded bg-white border-slate-350 text-blue-600 focus:ring-blue-500"
                    />
                    Simulate Voice Mismatch
                  </label>
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-[10px] text-slate-500 hover:text-blue-600 underline font-mono flex items-center font-semibold"
                  >
                    <Info className="w-3 h-3 mr-0.5" />
                    How it works
                  </button>
                </div>
              </div>
            </div>
          )}

          {authState === AuthState.PROMPTING && (
            <div className="text-center py-4 space-y-3">
              <div className="flex justify-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              </div>
              <p className="text-xs text-slate-700 italic font-mono font-semibold">
                "Welcome to SensevVision. Please say your voice passphrase."
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Preparing Accessible Microphone...
              </p>
            </div>
          )}

          {authState === AuthState.LISTENING && (
            <div className="text-center py-6 space-y-4">
              {/* Pulsating wave visualizer */}
              <div className="flex items-center justify-center space-x-1.5 h-8">
                <span className="w-1 h-4 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1 h-7 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-5 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                <span className="w-1 h-8 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                <span className="w-1 h-3 bg-blue-600 rounded animate-pulse" style={{ animationDelay: '0.5s' }}></span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider animate-pulse block">
                  🎤 Microphones Active - Speak Now
                </span>
                <p className="text-xs text-slate-700 font-bold max-w-sm mx-auto">
                  Say: <span className="text-blue-700 font-mono font-bold bg-white border border-slate-250 px-2 py-1 rounded">"{registeredPassphrase}"</span>
                </p>
              </div>

              <button
                onClick={() => {
                  if (authRecognitionRef.current) authRecognitionRef.current.stop();
                  setAuthState(AuthState.LOCKED);
                  playChime('alert');
                }}
                className="text-[10px] text-slate-500 hover:text-blue-600 uppercase font-mono underline font-bold"
              >
                Cancel Authentication
              </button>
            </div>
          )}

          {authState === AuthState.VERIFYING && (
            <div className="space-y-4 py-2 text-left">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-mono text-blue-600 animate-pulse uppercase tracking-wider font-bold">
                  🧠 Verifying Voice Identity...
                </span>
                <span className="font-mono text-[10px] text-slate-400">Acoustic Match Mode</span>
              </div>

              {/* Progress bar and metrics */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-sm">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase font-bold">
                    <span>Biometric Analysis Stage</span>
                    <span>Running</span>
                  </div>
                  <p className="text-xs text-slate-800 font-semibold font-mono">
                    ➡️ {biometricMetrics.processingStep || "Extracting vocal characteristics..."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-500 font-mono block">VOICE PITCH</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {biometricMetrics.pitch > 0 ? `${biometricMetrics.pitch.toFixed(1)} Hz` : "Evaluating..."}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-500 font-mono block">SPECTRAL FLUX</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {biometricMetrics.spectralFlux > 0 ? biometricMetrics.spectralFlux.toFixed(3) : "Evaluating..."}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-500 font-mono block">VOICEPRINT CONF</span>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {biometricMetrics.voiceMatchConfidence > 0 ? `${biometricMetrics.voiceMatchConfidence.toFixed(1)}%` : "Comparing..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {authState === AuthState.SUCCESS && (
            <div className="space-y-4">
              
              {/* Success Notification Banner */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start space-x-3 text-left">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    ✓ Voice Identity Verified Successfully
                  </h4>
                  <p className="text-xs text-slate-600 italic">
                    "Welcome back. I'm ready to help. How may I assist you today?"
                  </p>
                </div>
              </div>

              {/* Spoken Companion Status / Controls Container */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 shadow-sm text-left">
                
                {/* Voice Companion active banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block font-bold">Voice Companion Status</span>
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mt-0.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping mr-2"></span>
                      🟢 Voice Companion Active
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-500">
                    <span>Activity State:</span>
                    <span className={`font-bold ${
                      companionStatus === 'Listening...' ? 'text-blue-600 animate-pulse' :
                      companionStatus === 'Speaking...' ? 'text-emerald-600 font-extrabold' :
                      companionStatus === 'Thinking...' ? 'text-blue-500 animate-bounce' :
                      'text-slate-500'
                    }`}>
                      {companionStatus}
                    </span>
                  </div>
                </div>

                {/* Companion Action control buttons row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  
                  {/* Speak button - manual helper */}
                  <button
                    onClick={() => {
                      cancelSpeech();
                      playChime('click');
                      startContinuousListening();
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center space-y-1.5 ${
                      isContinuousListening
                        ? 'bg-red-50 border-red-200 text-red-600 font-extrabold animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    aria-label="Manually trigger voice input"
                  >
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span>🎤 Speak</span>
                  </button>

                  {/* Replay last response button */}
                  <button
                    onClick={replayLastResponse}
                    disabled={!lastCompanionResponse}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider text-slate-700 transition-all flex flex-col items-center justify-center space-y-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Replay last spoken assistant answer"
                  >
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span>🔊 Replay Last</span>
                  </button>

                  {/* Pause toggle button */}
                  <button
                    onClick={togglePause}
                    className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center space-y-1.5 ${
                      isPaused
                        ? 'bg-amber-50 border-amber-200 text-amber-700 font-extrabold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    aria-label={isPaused ? "Resume continuous voice loop" : "Pause continuous voice loop"}
                  >
                    {isPaused ? <Play className="w-4 h-4 text-amber-600" /> : <Pause className="w-4 h-4 text-slate-600" />}
                    <span>{isPaused ? "▶️ Resume Voice" : "⏸ Pause Voice"}</span>
                  </button>

                  {/* End Conversation button */}
                  <button
                    onClick={endConversation}
                    className="p-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-105 text-red-600 font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center justify-center space-y-1.5"
                    aria-label="End voice companion and lock session"
                  >
                    <X className="w-4 h-4" />
                    <span>⏹ End Companion</span>
                  </button>
                </div>

                {/* Auditory Loop helper label */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-[10px] text-slate-500 leading-normal">
                  💡 <span className="font-bold text-slate-700">Continuous Voice Active:</span> Talk freely! Your microphone automatically resumes listening when the companion stops speaking. Point to simulator scenes or speak queries. Say <span className="text-blue-600 font-semibold font-mono">"Goodbye"</span> or <span className="text-blue-600 font-semibold font-mono">"Stop"</span> to disconnect.
                </div>

              </div>

            </div>
          )}

          {(authState === AuthState.FAILED_PASSPHRASE || authState === AuthState.FAILED_VOICE) && (
            <div className="space-y-4 py-2 text-left">
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    ❌ Voice Authentication Failed
                  </h4>
                  <p className="text-xs text-slate-700 font-medium">
                    {authState === AuthState.FAILED_PASSPHRASE 
                      ? 'The spoken passphrase was incorrect. Please speak the registered passphrase.' 
                      : 'Voice characteristics match threshold was too low (Security Print mismatch).'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-2 bg-white p-2 border border-slate-200 rounded-md">
                    Spoken transcript captured: <span className="text-slate-800 font-bold">"{recognizedText || "(silence or unrecognized)"}"</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    playChime('click');
                    setAuthState(AuthState.LOCKED);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider transition-colors"
                >
                  Return
                </button>
                <button
                  onClick={activateVoiceIdentity}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs uppercase font-black tracking-wider transition-all inline-flex items-center space-x-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Explanation */}
        {showExplanation && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5 animate-fade-in text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-mono font-bold text-slate-700 uppercase">Voice biometrics & reuse logic</span>
              <button onClick={() => setShowExplanation(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-500 leading-relaxed font-normal">
              This module is designed for cross-platform integration to power:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 font-mono text-[10px]">
              <li><span className="text-slate-700 font-bold">SenseVision Mobile App:</span> Native microphones evaluate speech parameters in safe local sandboxes before releasing local app caches.</li>
              <li><span className="text-slate-700 font-bold">SenseVision Smart Glasses:</span> DSP voice processors run neural matches locally on the device's edge hardware for lightweight, instant, continuous secure login.</li>
              <li><span className="text-slate-700 font-bold">Wearable Audio Pods:</span> Seamless secure audio integration checks speaking credentials before initiating remote voice commands.</li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
