import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, MessageSquare, RefreshCw, Volume2, HelpCircle } from 'lucide-react';
import { AssistantMessage } from '../types';
import { playChime, speakText } from '../utils/audio';

interface AssistantScreenProps {
  messages: AssistantMessage[];
  onSendMessage: (text: string) => void;
  isResponding: boolean;
  activeImagePreview: string | null;
  useCloudVoice: boolean;
  selectedVoice: string;
}

export default function AssistantScreen({ 
  messages, 
  onSendMessage, 
  isResponding, 
  activeImagePreview,
  useCloudVoice,
  selectedVoice
}: AssistantScreenProps) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any | null>(null);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat history
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isResponding]);

  // Setup browser speech recognition
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
          playChime('click');
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            setInputText(resultText);
            playChime('success');
            // Automatically send the message
            onSendMessage(resultText);
            setInputText("");
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsListening(false);
          playChime('alert');
          speakText("Voice capture interrupted. Please try again or type your command.", false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        setRecognition(rec);
      }
    }
  }, [onSendMessage]);

  const toggleListening = () => {
    if (!recognition) {
      speakText("Speech recognition is not supported in this browser. Please type your message.", false);
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      speakText("Listening now.", false);
      recognition.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isResponding) return;

    onSendMessage(inputText);
    setInputText("");
  };

  // Speaks assistant response again
  const handleReplayMessage = (content: string) => {
    speakText(content, useCloudVoice, selectedVoice);
  };

  return (
    <div className="flex flex-col h-[550px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" id="voice-assistant-card">
      {/* Visual Context Indicator */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-800 uppercase">
            INTELLIGENT SIGHT COMPANION
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-500 font-mono">VISUAL CONTEXT:</span>
          {activeImagePreview ? (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
              ACTIVE
            </span>
          ) : (
            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
              PRESET SCENE
            </span>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[100px] bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 animate-pulse">
              <Mic className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">SenseVision Voice Assistant</h4>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-4">
              Ask direct questions about the environment around you. For example: "What is in front of me?", "Are there any hazards?", "Read the text on the table".
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              <button 
                onClick={() => onSendMessage("What is in front of me?")}
                className="bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 text-[11px] px-3 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                "What is in front of me?"
              </button>
              <button 
                onClick={() => onSendMessage("Are there any obstacles or hazards?")}
                className="bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 text-[11px] px-3 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                "Are there any hazards?"
              </button>
              <button 
                onClick={() => onSendMessage("Read what is written in this scene.")}
                className="bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 border border-slate-200 text-[11px] px-3 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                "Read any visible text"
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-sm' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
              }`}>
                {msg.content}

                {/* Speech repeat helper for assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>ASSISTIVE AUDITORY FEEDBACK</span>
                    <button
                      onClick={() => handleReplayMessage(msg.content)}
                      className="text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1 underline hover:no-underline font-bold cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay Voice</span>
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))
        )}

        {/* Loading Bubble */}
        {isResponding && (
          <div className="flex flex-col items-gray-start animate-pulse">
            <div className="bg-white text-slate-650 border border-slate-200 rounded-2xl p-4 text-xs rounded-tl-none flex items-center space-x-2 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Analyzing the image context to answer your question...</span>
            </div>
          </div>
        )}

        {/* Anchor for auto scroll */}
        <div ref={chatBottomRef} />
      </div>

      {/* Accessibility Listening Animation Panel */}
      {isListening && (
        <div className="bg-blue-50 border-t border-blue-100 py-2.5 px-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs text-blue-600 font-bold font-mono">SENSEVISION IS LISTENING NOW...</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-1 h-3 bg-red-500 rounded animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-4 bg-red-500 rounded animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-2 bg-red-500 rounded animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      )}

      {/* Input Field Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-4 border-t border-slate-200 flex items-center gap-3 shrink-0">
        
        {/* Large Voice Microphone Trigger */}
        <button
          type="button"
          onClick={toggleListening}
          className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.3)]' 
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-blue-600 hover:border-slate-300'
          }`}
          title={isListening ? "Stop voice listening" : "Start Speech-To-Text Voice Command"}
          aria-label="Start voice recognition input"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isResponding || isListening}
          placeholder={isListening ? "Listening... Speak now." : "Type a custom question about your camera view..."}
          className="flex-1 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />

        {/* Submit Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isResponding || isListening}
          className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            !inputText.trim() || isResponding || isListening
              ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 shadow-sm'
          }`}
          aria-label="Send message to Visual Assistant"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
