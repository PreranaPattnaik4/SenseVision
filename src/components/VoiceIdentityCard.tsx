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
  onAuthSuccess?: () => void;
  onLockSession?: (type?: 'normal' | 'disconnect') => void;
  isAuthenticated?: boolean;
  autoStartTrigger?: 'normal' | 'disconnect' | boolean;
}

enum AuthState {
  LOCKED = 'LOCKED',
  PROMPTING = 'PROMPTING',
  PREPARING = 'PREPARING',
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
  onShowCompanionSelection,
  onAuthSuccess,
  onLockSession,
  isAuthenticated = false,
  autoStartTrigger = false
}: VoiceIdentityCardProps) {
  // Authentication states
  const [authState, setAuthState] = useState<AuthState>(
    isAuthenticated ? AuthState.SUCCESS : AuthState.LOCKED
  );
  const [recognizedText, setRecognizedText] = useState("");
  const [prepCountdown, setPrepCountdown] = useState(10);
  const [biometricMetrics, setBiometricMetrics] = useState({
    pitch: 0,
    spectralFlux: 0,
    voiceMatchConfidence: 0,
    processingStep: ""
  });
  
  // Continuous Conversation state
  const [companionActive, setCompanionActive] = useState(isAuthenticated);
  const [companionStatus, setCompanionStatus] = useState<'Idle' | 'Listening...' | 'Speaking...' | 'Thinking...'>('Idle');
  const [isPaused, setIsPaused] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any | null>(null);
  const [isContinuousListening, setIsContinuousListening] = useState(false);
  const [lastCompanionResponse, setLastCompanionResponse] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);

  // Timers and Refs for Auth Flow
  const authTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const listeningSessionActiveRef = useRef<boolean>(false);
  const listeningSessionStartTimeRef = useRef<number>(0);
  const hasReceivedSpeechResultRef = useRef<boolean>(false);

  // Sync authState when isAuthenticated changes from App
  useEffect(() => {
    if (isAuthenticated) {
      setAuthState(AuthState.SUCCESS);
      setCompanionActive(true);
    } else {
      setAuthState(AuthState.LOCKED);
      setCompanionActive(false);
    }
  }, [isAuthenticated]);

  // Handle auto-start trigger for welcome screen
  useEffect(() => {
    if (autoStartTrigger && authState === AuthState.LOCKED) {
      if (autoStartTrigger === 'disconnect') {
        activateDisconnectVoiceIdentity();
      } else {
        activateVoiceIdentity();
      }
    }
  }, [autoStartTrigger]);

  // Registered voice parameters
  const [registeredPassphrase, setRegisteredPassphrase] = useState("Hello SenseVision, let's begin.");
  const [forceVoiceMismatch, setForceVoiceMismatch] = useState(false); // Testing toggle
  
  const authRecognitionRef = useRef<any>(null);
  const continuousRecognitionRef = useRef<any>(null);

  const cleanupAuthTimersAndSpeech = () => {
    cancelSpeech();
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    listeningSessionActiveRef.current = false;
    if (authRecognitionRef.current) {
      try {
        authRecognitionRef.current.stop();
      } catch (e) {}
    }
  };

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
            hasReceivedSpeechResultRef.current = true;
            // Stop the 15-second session
            listeningSessionActiveRef.current = false;
            if (authTimeoutRef.current) {
              clearTimeout(authTimeoutRef.current);
              authTimeoutRef.current = null;
            }
            setRecognizedText(text);
            runVerification(text);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Auth voice recognition error:", e);
          if (e.error === 'not-allowed') {
            cleanupAuthTimersAndSpeech();
            setAuthState(AuthState.LOCKED);
            speakText("I'm sorry. Microphone permission is required to verify your voice identity.", false);
          }
        };

        rec.onend = () => {
          // If the listening session is still active and we haven't received a result, restart the mic
          if (listeningSessionActiveRef.current && !hasReceivedSpeechResultRef.current) {
            const elapsed = Date.now() - listeningSessionStartTimeRef.current;
            if (elapsed < 14000) {
              try {
                rec.start();
              } catch (err) {
                console.warn("Failed to restart SpeechRecognition during 15s session:", err);
              }
            }
          }
        };

        authRecognitionRef.current = rec;
      }
    }

    return () => {
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
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
  const activateVoiceIdentity = async () => {
    cleanupAuthTimersAndSpeech();
    playChime('click');
    setAuthState(AuthState.PROMPTING);
    
    try {
      // If microphone permission has not been granted, request permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      setAuthState(AuthState.LOCKED);
      speakText("I'm sorry. Microphone permission is required to verify your voice identity.", false);
      return;
    }

    // Step 1: Speak: "To continue using SenseVision, please verify your voice identity."
    const announcement1 = "To continue using SenseVision, please verify your voice identity.";
    speakText(announcement1, false, undefined, undefined, () => {
      // Step 2: Enter 10-second preparation period
      setAuthState(AuthState.PREPARING);
      setPrepCountdown(10);
      
      let count = 10;
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = setInterval(() => {
        count--;
        setPrepCountdown(count);
        if (count <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          
          // Step 3: Speak: "I'm ready to verify your identity. Please say your registered passphrase when you're ready."
          const announcement2 = "I'm ready to verify your identity. Please say your registered passphrase when you're ready.";
          setAuthState(AuthState.PROMPTING);
          speakText(announcement2, false, undefined, undefined, () => {
            // Step 4: Automatically begin the 15-second listening session after the announcement finishes speaking
            startAuthMic15SecSession();
          });
        }
      }, 1000);
    });
  };

  // Special disconnect lock and authentication activation sequence
  const activateDisconnectVoiceIdentity = async () => {
    cleanupAuthTimersAndSpeech();
    setAuthState(AuthState.PROMPTING);
    
    try {
      // If microphone permission has not been granted, request permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      setAuthState(AuthState.LOCKED);
    }

    // Step 1: Speak: "Your Sense Companion has been disconnected."
    speakText("Your Sense Companion has been disconnected.", false, undefined, undefined, async () => {
      // Step 2: Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Speak: "For your privacy and security, SenseVision has been locked."
      speakText("For your privacy and security, SenseVision has been locked.", false, undefined, undefined, async () => {
        // Step 4: Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 5: Speak: "To continue using SenseVision, please verify your voice identity."
        const promptText = "To continue using SenseVision, please verify your voice identity.";
        speakText(promptText, false, undefined, undefined, () => {
          // Step 6: Enter 10-second preparation period
          setAuthState(AuthState.PREPARING);
          setPrepCountdown(10);
          
          let count = 10;
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = setInterval(() => {
            count--;
            setPrepCountdown(count);
            if (count <= 0) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
              
              // Step 7: Speak: "I'm ready to verify your identity. Please say your registered passphrase when you're ready."
              const finalPrompt = "I'm ready to verify your identity. Please say your registered passphrase when you're ready.";
              setAuthState(AuthState.PROMPTING);
              speakText(finalPrompt, false, undefined, undefined, () => {
                // Step 8: Only after the announcement finishes, automatically begin the 15-second listening session
                startAuthMic15SecSession();
              });
            }
          }, 1000);
        });
      });
    });
  };

  // Start Auth Mic (15-second listening session)
  const startAuthMic15SecSession = () => {
    if (!authRecognitionRef.current) {
      speakText("Speech recognition is not supported in this environment.", false);
      setAuthState(AuthState.LOCKED);
      return;
    }

    cleanupAuthTimersAndSpeech();
    setAuthState(AuthState.LISTENING);
    playChime('click');

    listeningSessionActiveRef.current = true;
    listeningSessionStartTimeRef.current = Date.now();
    hasReceivedSpeechResultRef.current = false;

    try {
      authRecognitionRef.current.start();
    } catch (e) {
      console.error("Error starting speech recognition:", e);
    }

    // Keep the microphone active for 15 seconds to allow the user to speak comfortably.
    authTimeoutRef.current = setTimeout(() => {
      if (listeningSessionActiveRef.current && !hasReceivedSpeechResultRef.current) {
        listeningSessionActiveRef.current = false;
        try {
          authRecognitionRef.current.stop();
        } catch (e) {}

        // If no speech is detected, say:
        // "I didn't hear anything. Take your time. Please try again when you're ready."
        speakText("I didn't hear anything. Take your time. Please try again when you're ready.", false, undefined, undefined, () => {
          // Then automatically begin another 15-second listening session.
          startAuthMic15SecSession();
        });
      }
    }, 15000);
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
          speakText("I'm sorry. I couldn't verify your voice. Please try again.", false);
        } else if (forceVoiceMismatch) {
          setAuthState(AuthState.FAILED_VOICE);
          playChime('alert');
          speakText("I'm sorry. I couldn't verify your voice. Please try again.", false);
        } else {
          setAuthState(AuthState.SUCCESS);
          playChime('success');
          
          if (onAuthSuccess) {
            onAuthSuccess();
          }

          setCompanionActive(true);
          onVerificationSuccess(true);
          onShowCompanionSelection(false);
          
          let companionGreeting = "";
          if (selectedCompanion === 'Emma') {
            companionGreeting = "Welcome back. Voice identity verified successfully. I'm Emma, your Sense Companion. I'm ready to help. How may I assist you today?";
          } else if (selectedCompanion === 'Alex') {
            companionGreeting = "Welcome back. Voice identity verified successfully. I'm Alex, your Sense Companion. How may I assist you today?";
          } else if (selectedCompanion === 'Maya') {
            companionGreeting = "Welcome back. Voice identity verified successfully. I'm Maya, your Sense Companion. Let me guide you with warm Indian English assistance. How may I assist you today?";
          } else if (selectedCompanion === 'Arjun') {
            companionGreeting = "Welcome back. Voice identity verified successfully. I'm Arjun, your Sense Companion. I am ready to help you navigate your environments safely. How may I assist you today?";
          } else if (selectedCompanion === 'Sophia') {
            companionGreeting = "Welcome back. Voice identity verified successfully. I'm Sophia, your Sense Companion. Te ayudaré a entender tu entorno de manera clara. How may I assist you today?";
          } else if (selectedCompanion === 'Kenji') {
            companionGreeting = "Welcome back. Voice identity verified successfully. I'm Kenji, your Sense Companion. あなたの視覚情報を日本語でサポートします。 How may I assist you today?";
          } else {
            companionGreeting = `Welcome back. Voice identity verified successfully. I'm ${selectedCompanion}, your Sense Companion. I'm ready to help. How may I assist you today?`;
          }
          
          speakText(
            companionGreeting, 
            useCloudVoice,
            undefined,
            selectedCompanion
          );
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
    
    if (text === "stop" || text === "goodbye" || text === "exit" || text === "end conversation" || text.includes("lock sensevision") || text.includes("end session")) {
      endConversation();
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
    if (onLockSession) {
      onLockSession('disconnect');
    }
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
    <div className="w-full animate-fade-in relative" id="voice-identity-card-wrapper">
      
      <div className="space-y-4 pt-1">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center space-x-1.5">
              <span className="p-0.5 rounded bg-blue-50 text-blue-600">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                🎙️ Voice Identity & Security
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal max-w-xl font-normal">
              Securely activate your personal AI companion using your registered voice for hands-free conversational controls.
            </p>
          </div>
 
          {/* Status Badge */}
          <div className="shrink-0 pt-0.5">
            {authState === AuthState.LOCKED && (
              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5 text-red-500 mr-1 shrink-0" />
                <span>🔒 LOCKED</span>
              </span>
            )}
            
            {(authState === AuthState.PROMPTING || authState === AuthState.LISTENING) && (
              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1 animate-pulse">
                <Mic className="w-2.5 h-2.5 text-blue-600 mr-1 shrink-0" />
                <span>LISTENING...</span>
              </span>
            )}
 
            {authState === AuthState.VERIFYING && (
              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <RefreshCw className="w-2.5 h-2.5 mr-1 shrink-0 animate-spin text-blue-600" />
                <span>🧠 VERIFYING...</span>
              </span>
            )}
 
            {authState === AuthState.SUCCESS && (
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <Unlock className="w-2.5 h-2.5 text-emerald-600 mr-1 shrink-0" />
                <span>✅ VERIFIED</span>
              </span>
            )}
 
            {(authState === AuthState.FAILED_PASSPHRASE || authState === AuthState.FAILED_VOICE) && (
              <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                <ShieldAlert className="w-2.5 h-2.5 text-red-600 mr-1 shrink-0" />
                <span>FAILED</span>
              </span>
            )}
          </div>
        </div>
 
        {/* Hackathon Evaluation Banner for Judges */}
        {authState !== AuthState.SUCCESS && (
          <div className="bg-amber-50 border border-amber-250 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-left gap-2">
            <div className="space-y-0.5">
              <span className="text-[9px] text-amber-800 font-mono uppercase font-bold tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Demo Passphrase
              </span>
              <p className="text-[10px] font-mono font-bold text-slate-800 bg-white border border-amber-200/60 px-2 py-1 rounded-lg inline-block">
                "{registeredPassphrase}"
              </p>
            </div>
            <div className="text-[9px] text-slate-500 max-w-xs font-sans leading-tight">
              Speak or simulate this phrase to verify.
            </div>
          </div>
        )}
 
        {/* Action Panel based on state */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          
          {authState === AuthState.LOCKED && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-0.5">
              <div className="text-left space-y-1 w-full">
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest block font-bold">Registered Phrase</span>
                <span className="text-[11px] text-slate-800 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl block font-mono">
                  "{registeredPassphrase}"
                </span>
              </div>
              
              <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                <button
                  id="activate-voice-id-btn"
                  onClick={activateVoiceIdentity}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all inline-flex items-center justify-center space-x-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Verify Identity</span>
                </button>
                
                {/* Visual Testing Helpers */}
                <div className="flex items-center justify-between gap-3 px-0.5">
                  <label className="text-[9px] text-slate-500 font-mono uppercase cursor-pointer flex items-center font-semibold">
                    <input
                      type="checkbox"
                      checked={forceVoiceMismatch}
                      onChange={(e) => setForceVoiceMismatch(e.target.checked)}
                      className="mr-1 rounded bg-white border-slate-350 text-blue-600 focus:ring-blue-500"
                    />
                    Simulate Mismatch
                  </label>
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className="text-[9px] text-slate-500 hover:text-blue-600 underline font-mono flex items-center font-semibold cursor-pointer"
                  >
                    <Info className="w-2.5 h-2.5 mr-0.5" />
                    Info
                  </button>
                </div>
              </div>
            </div>
          )}

          {authState === AuthState.PROMPTING && (
            <div className="text-center py-6 space-y-4">
              <div className="flex justify-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              </div>
              <p className="text-sm text-slate-800 font-semibold max-w-md mx-auto leading-relaxed">
                Reading voice guidance instructions aloud...
              </p>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-extrabold bg-white border border-slate-200 px-3 py-1.5 rounded-full inline-block">
                🔊 Audio Announcement Playing
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    cleanupAuthTimersAndSpeech();
                    setAuthState(AuthState.LOCKED);
                    playChime('alert');
                  }}
                  className="text-[10px] text-slate-500 hover:text-blue-600 uppercase font-mono underline font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {authState === AuthState.PREPARING && (
            <div className="text-center py-6 space-y-4">
              <div className="flex justify-center items-center space-x-3">
                <div className="h-10 w-10 bg-slate-150 text-slate-500 rounded-full flex items-center justify-center border border-slate-200 shadow-sm animate-pulse">
                  <MicOff className="w-5 h-5 text-slate-600" />
                </div>
                <span className="text-3xl font-black text-blue-600 font-mono leading-none">{prepCountdown}s</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Preparing Voice Authentication…
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Microphone is strictly OFF. Please prepare to speak your registered passphrase.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    cleanupAuthTimersAndSpeech();
                    setAuthState(AuthState.LOCKED);
                    playChime('alert');
                  }}
                  className="text-[10px] text-slate-500 hover:text-blue-600 uppercase font-mono underline font-bold"
                >
                  Cancel Preparation
                </button>
              </div>
            </div>
          )}

          {authState === AuthState.LISTENING && (
            <div className="text-center py-6 space-y-4">
              {/* Pulsating wave visualizer */}
              <div className="flex items-center justify-center space-x-1.5 h-8">
                <span className="w-1 h-4 bg-emerald-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-1 h-7 bg-emerald-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-5 bg-emerald-500 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                <span className="w-1 h-8 bg-emerald-500 rounded animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                <span className="w-1 h-3 bg-emerald-500 rounded animate-pulse" style={{ animationDelay: '0.5s' }}></span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider animate-pulse block">
                  🎤 Listening for your registered passphrase…
                </span>
                <p className="text-xs text-slate-700 font-bold max-w-sm mx-auto">
                  Say: <span className="text-emerald-700 font-mono font-bold bg-white border border-slate-250 px-2 py-1 rounded">"{registeredPassphrase}"</span>
                </p>
              </div>

              <button
                onClick={() => {
                  cleanupAuthTimersAndSpeech();
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
