import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, HelpCircle, X, ShieldAlert, Navigation, Eye, BookOpen, MessageSquare } from 'lucide-react';
import { playChime, speakText, cancelSpeech } from '../utils/audio';
import { AppMode } from '../types';

interface GlobalVoiceTriggerProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onTriggerScan: () => void;
  onSendAssistantMessage: (text: string) => void;
  inputType: 'camera' | 'simulator';
  onInputTypeChange: (type: 'camera' | 'simulator') => void;
  activeTab: 'scan' | 'logs' | 'preferences';
  onTabChange: (tab: 'scan' | 'logs' | 'preferences') => void;
  isAnalyzing: boolean;
  isSpeaking: boolean;
  onMuteSpeech: () => void;
}

export default function GlobalVoiceTrigger({
  activeMode,
  onModeChange,
  onTriggerScan,
  onSendAssistantMessage,
  inputType,
  onInputTypeChange,
  activeTab,
  onTabChange,
  isAnalyzing,
  isSpeaking,
  onMuteSpeech
}: GlobalVoiceTriggerProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any | null>(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Setup global speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          setTranscriptText("");
          setCommandFeedback(null);
          playChime('click');
        };

        rec.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          if (text) {
            setTranscriptText(text);
            handleVoiceCommand(text);
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Global Speech recognition error:", e);
          setIsListening(false);
          playChime('alert');
          speakText("Voice command canceled or not heard. Please tap again to speak.", false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, [activeMode, inputType, activeTab]);

  const toggleListening = () => {
    if (!recognition) {
      speakText("Global Speech Recognition is not supported in this browser.", false);
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      cancelSpeech(); // stop any current speak first so it doesn't feed back
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.error(e);
        }
      }, 150);
    }
  };

  const handleVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    console.log("Parsed Global Voice Command: ", text);

    // Help command
    if (text.includes("help") || text.includes("what can i say") || text.includes("commands")) {
      playChime('success');
      setCommandFeedback("Opening voice help instructions.");
      speakText("Voice guide. You can say navigation, read text, describe surroundings, or ask direct questions.", false);
      setShowHelpModal(true);
      return;
    }

    // Stop / Mute Command
    if (text === "stop" || text === "mute" || text === "quiet" || text.includes("stop talking") || text.includes("shut up")) {
      playChime('alert');
      setCommandFeedback("Muted voice feedback.");
      onMuteSpeech();
      return;
    }

    // Capture / Scan Command
    if (text === "scan" || text === "trigger" || text === "capture" || text === "analyze" || text === "scan surroundings" || text === "go") {
      playChime('scan');
      setCommandFeedback("Triggering live scan!");
      speakText("Triggering scene scan now...", false);
      onTabChange('scan');
      setTimeout(() => {
        onTriggerScan();
      }, 800);
      return;
    }

    // App Mode commands
    if (text.includes("navigation") || text.includes("obstacle") || text.includes("path") || text.includes("hazard")) {
      playChime('success');
      setCommandFeedback("Switching to Navigation Mode.");
      onTabChange('scan');
      onModeChange(AppMode.NAVIGATION);
      speakText("Switching to Navigation Assistance. Scanning for hazards. Speak 'Scan' to trigger.", false);
      return;
    }

    if (text.includes("read") || text.includes("ocr") || text.includes("text") || text.includes("sign") || text.includes("book") || text.includes("document")) {
      playChime('success');
      setCommandFeedback("Switching to Text Reader Mode.");
      onTabChange('scan');
      onModeChange(AppMode.TEXT_READER);
      speakText("Switching to Text Reader OCR mode. Point at letters. Speak 'Scan' to read.", false);
      return;
    }

    if (text.includes("object") || text.includes("detect") || text.includes("item") || text.includes("recognize")) {
      playChime('success');
      setCommandFeedback("Switching to Object Detection.");
      onTabChange('scan');
      onModeChange(AppMode.OBJECT_RECOGNITION);
      speakText("Switching to Object Detection mode. Speak 'Scan' to identify objects.", false);
      return;
    }

    if (text.includes("describe") || text.includes("scene") || text.includes("surroundings") || text.includes("room") || text.includes("where am i")) {
      playChime('success');
      setCommandFeedback("Switching to Scene Description.");
      onTabChange('scan');
      onModeChange(AppMode.SCENE_DESCRIPTION);
      speakText("Switching to complete Scene Description. Speak 'Scan' to describe surroundings.", false);
      return;
    }

    if (text.includes("assistant") || text.includes("companion") || text.includes("chat") || text.includes("talk to")) {
      playChime('success');
      setCommandFeedback("Switching to Companion Assistant.");
      onTabChange('scan');
      onModeChange(AppMode.ASSISTANT);
      speakText("Switching to Companion Assistant. Speak your question directly to ask.", false);
      return;
    }

    // Tab changes
    if (text.includes("history") || text.includes("log") || text.includes("logs")) {
      playChime('success');
      setCommandFeedback("Navigating to Auditory Logs.");
      onTabChange('logs');
      speakText("Opening historical visual logs.", false);
      return;
    }

    if (text.includes("settings") || text.includes("preference") || text.includes("preferences") || text.includes("a11y")) {
      playChime('success');
      setCommandFeedback("Navigating to A11y Preferences.");
      onTabChange('preferences');
      speakText("Opening accessibility preferences.", false);
      return;
    }

    // Input type triggers
    if (text.includes("simulator") || text.includes("preset") || text.includes("demo")) {
      playChime('success');
      setCommandFeedback("Switching to Environment Simulator.");
      onInputTypeChange('simulator');
      speakText("Switched to Preset Environment Simulator.", false);
      return;
    }

    if (text.includes("camera") || text.includes("live") || text.includes("uploader") || text.includes("video")) {
      playChime('success');
      setCommandFeedback("Switching to Live Camera.");
      onInputTypeChange('camera');
      speakText("Switched to Live Camera Feed and Photo Uploader.", false);
      return;
    }

    // Fallback: If it's a general statement or question, automatically switch to Companion Assistant mode and query Gemini!
    playChime('success');
    setCommandFeedback(`Asking AI: "${rawText}"`);
    onTabChange('scan');
    onModeChange(AppMode.ASSISTANT);
    speakText(`Asking companion assistant: ${rawText}`, false);
    
    // Trigger message dispatch to assistant stream
    setTimeout(() => {
      onSendAssistantMessage(rawText);
    }, 1200);
  };

  return (
    <>
      {/* Floating Tactical Voice Input Trigger */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
        
        {/* Pulsating Label to guide visually impaired users */}
        {!isListening && (
          <span className="bg-slate-900/90 text-amber-400 border border-amber-400/30 text-[10px] px-3 py-1 rounded-full font-mono font-bold tracking-wider shadow-lg animate-pulse hidden md:inline">
            SAY "HELP" OR ASK A QUESTION
          </span>
        )}

        <div className="flex items-center space-x-2">
          {/* Quick Voice Help trigger */}
          <button
            onClick={() => {
              playChime('click');
              setShowHelpModal(true);
              speakText("Voice Commands Guide is open. Explore the available instructions on screen.", false);
            }}
            className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            title="Spoken Commands Guide"
            aria-label="Open voice command guide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Primary Voice Action Button */}
          <button
            id="global-voice-input-btn"
            onClick={toggleListening}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all shadow-2xl relative group focus:outline-none focus:ring-4 focus:ring-amber-500/50 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_24px_rgba(239,68,68,0.5)] scale-110'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105'
            }`}
            title="Trigger Voice Command"
            aria-label="Universal Voice Input Command Button. Click to speak commands or ask questions."
          >
            {/* Pulsing ring indicator */}
            {isListening ? (
              <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></span>
            ) : (
              <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-pulse opacity-40 group-hover:scale-110 transition-transform"></span>
            )}
            
            {isListening ? (
              <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : (
              <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </button>
        </div>
      </div>

      {/* Speech Capturing Active Fullscreen / Bottom overlay */}
      {isListening && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6 shadow-2xl">
            
            {/* Visual Waveform Animation */}
            <div className="flex items-center justify-center space-x-2.5 h-16">
              <span className="w-1.5 h-6 bg-red-500 rounded animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1.5 h-10 bg-amber-400 rounded animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-14 bg-red-500 rounded animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              <span className="w-1.5 h-10 bg-amber-400 rounded animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              <span className="w-1.5 h-6 bg-red-500 rounded animate-bounce" style={{ animationDelay: '0.5s' }}></span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Listening Aloud...</h3>
              <p className="text-xs text-amber-400 font-mono font-bold uppercase animate-pulse">
                SENSEVVISION ACTIVE VOICE INPUT
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto mt-2">
                Say commands like <span className="text-slate-200 font-semibold">"Describe Room"</span>, <span className="text-slate-200 font-semibold">"Navigation"</span>, <span className="text-slate-200 font-semibold">"Read Text"</span>, or simply ask a question like <span className="text-slate-200 font-semibold">"Is there a table nearby?"</span>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850">
              <button
                onClick={() => {
                  if (recognition) recognition.stop();
                  playChime('click');
                }}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white px-5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
              >
                Cancel Voice Input
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Command executed flash banner feedback */}
      {commandFeedback && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-400 text-slate-950 px-6 py-3 rounded-full font-bold text-xs tracking-wider uppercase shadow-xl flex items-center space-x-2 border border-amber-500 animate-bounce">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>{commandFeedback}</span>
        </div>
      )}

      {/* Spoken Help & Instructions Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => {
                setShowHelpModal(false);
                playChime('click');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close guide modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center sm:justify-start space-x-2">
                <Mic className="w-5 h-5 text-amber-400" />
                <span>SenseVision Universal Voice Guide</span>
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Speak commands to control SenseVision hands-free. Simply tap the large floating mic on the bottom right of any screen to begin speaking.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-850">
              <div>
                <h4 className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Module Navigation Controls</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                    <span className="font-bold text-slate-200">"Describe surroundings"</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Switch to Scene Narration mode</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                    <span className="font-bold text-slate-200">"Navigation"</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Switch to Obstacle Avoidance mode</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                    <span className="font-bold text-slate-200">"Read Text"</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Switch to Text Reading OCR mode</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                    <span className="font-bold text-slate-200">"Object detection"</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Switch to Object recognition mode</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Scan Commands</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                    <span className="font-bold text-slate-200">"Scan" / "Capture"</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Triggers scan of active camera or simulator</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-xs">
                    <span className="font-bold text-slate-200">"Stop" / "Mute"</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Stops ongoing speech narration immediately</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct Natural AI Queries</span>
                </h4>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs space-y-1.5">
                  <p className="text-slate-300 font-medium">
                    You can speak any direct question about your surroundings. SenseVision will immediately route your question to the Multimodal Gemini Assistant:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono text-[10px]">
                    <li>"What is on the desk in front of me?"</li>
                    <li>"Is there any hazard or wet floor?"</li>
                    <li>"Read the medicine label on the bottle."</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 text-center">
              <button
                onClick={() => {
                  setShowHelpModal(false);
                  playChime('click');
                }}
                className="w-full bg-amber-400 text-slate-950 font-bold uppercase tracking-wider text-xs py-3 rounded-xl hover:bg-amber-300 transition-colors border border-amber-500"
              >
                Close Voice Assistant Guide
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
