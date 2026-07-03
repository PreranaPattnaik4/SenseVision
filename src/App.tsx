import React, { useState, useEffect } from 'react';
import logoImage from './assets/images/logo.png';
import { 
  Camera, 
  Sparkles, 
  BookOpen, 
  Navigation as NavigationIcon, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Settings, 
  Layers, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  RotateCcw, 
  Activity, 
  Accessibility,
  Eye,
  Info,
  ChevronRight,
  Clipboard,
  Play,
  Lock,
  Mic
} from 'lucide-react';

import { AppMode, VisionLog, AssistantMessage, AnalysisResponse, AssistanceStyle, PresetEnvironment } from './types';
import CameraScreen from './components/CameraScreen';
import SimulatorScreen from './components/SimulatorScreen';
import AssistantScreen from './components/AssistantScreen';
import HistoryLogs from './components/HistoryLogs';
import Preferences from './components/Preferences';
import GlobalVoiceTrigger from './components/GlobalVoiceTrigger';
import VoiceIdentityCard from './components/VoiceIdentityCard';
import ChooseCompanionCard, { COMPANIONS } from './components/ChooseCompanionCard';
import { PRESET_ENVIRONMENTS } from './utils/presets';
import { speakText, cancelSpeech, playChime } from './utils/audio';

export default function App() {
  // Authentication & Security Locks
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [voiceAuthActive, setVoiceAuthActive] = useState(false);
  const [authTriggerType, setAuthTriggerType] = useState<'normal' | 'disconnect' | null>(null);

  const handleLockSession = (type?: 'normal' | 'disconnect') => {
    setIsAuthenticated(false);
    if (type === 'disconnect') {
      setVoiceAuthActive(true);
      setAuthTriggerType('disconnect');
    } else {
      setVoiceAuthActive(false);
      setAuthTriggerType(null);
    }
  };

  // Navigation & Screen Modes
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.OBJECT_RECOGNITION);
  const [inputType, setInputType] = useState<'camera' | 'simulator'>('simulator');
  const [activeTab, setActiveTab] = useState<'scan' | 'logs' | 'preferences'>('scan');

  // Continuous voice companion state
  const [voiceCompanionActive, setVoiceCompanionActive] = useState(false);

  // Selected preset environment in simulator
  const [selectedEnv, setSelectedEnv] = useState<PresetEnvironment>(PRESET_ENVIRONMENTS[0]);

  // Scanning & Response State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AnalysisResponse | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Assistant Chat Stream State
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [isAssistantResponding, setIsAssistantResponding] = useState(false);

  // Logs & Auditory History State
  const [logs, setLogs] = useState<VisionLog[]>([]);

  // Sound & Speech Synthesis Preferences
  const [useCloudVoice, setUseCloudVoice] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Companion Voice settings
  const [selectedCompanion, setSelectedCompanion] = useState('Emma');
  const [rememberCompanionChoice, setRememberCompanionChoice] = useState(false);
  const [showCompanionSelector, setShowCompanionSelector] = useState(false);

  // Layout Zoom Scale Preference
  const [largeTouchTargets, setLargeTouchTargets] = useState(false);

  // Assistance Style Preference
  const [assistanceStyle, setAssistanceStyle] = useState<AssistanceStyle>(AssistanceStyle.HYBRID);

  // Initialize and load historical logs from LocalStorage
  useEffect(() => {
    // Ensure the page always starts at the top of the application upon mount or refresh
    window.scrollTo(0, 0);

    const savedLogs = localStorage.getItem('sensevision_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (err) {
        console.error("Failed to parse logs from local storage:", err);
      }
    }

    const savedPrefs = localStorage.getItem('sensevision_prefs');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.useCloudVoice !== undefined) setUseCloudVoice(parsed.useCloudVoice);
        if (parsed.selectedVoice !== undefined) setSelectedVoice(parsed.selectedVoice);
        if (parsed.largeTouchTargets !== undefined) setLargeTouchTargets(parsed.largeTouchTargets);
        if (parsed.assistanceStyle !== undefined) setAssistanceStyle(parsed.assistanceStyle);
        if (parsed.selectedCompanion !== undefined) setSelectedCompanion(parsed.selectedCompanion);
        if (parsed.rememberCompanionChoice !== undefined) setRememberCompanionChoice(parsed.rememberCompanionChoice);
      } catch (err) {
        console.error("Failed to parse preferences:", err);
      }
    }

    // Welcoming spoken guide is suppressed until successful voice identity authentication
  }, []);

  // Save logs and preferences
  useEffect(() => {
    localStorage.setItem('sensevision_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('sensevision_prefs', JSON.stringify({
      useCloudVoice,
      selectedVoice,
      largeTouchTargets,
      assistanceStyle,
      selectedCompanion,
      rememberCompanionChoice
    }));
  }, [useCloudVoice, selectedVoice, largeTouchTargets, assistanceStyle, selectedCompanion, rememberCompanionChoice]);

  // Monitor SpeechSynthesis state
  useEffect(() => {
    const checkSpeechState = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setIsSpeaking(window.speechSynthesis.speaking);
      }
    }, 200);
    return () => clearInterval(checkSpeechState);
  }, []);

  // Mode Selection Helper
  const handleModeChange = (mode: AppMode) => {
    setActiveMode(mode);
    setLastResponse(null);
    playChime('click');
    
    // Announce mode choice to user
    let descriptionText = "";
    switch (mode) {
      case AppMode.OBJECT_RECOGNITION:
        descriptionText = "Object recognition active. Point camera at items to determine name and distance.";
        break;
      case AppMode.SCENE_DESCRIPTION:
        descriptionText = "Scene narration active. Captures and maps spatial surroundings.";
        break;
      case AppMode.TEXT_READER:
        descriptionText = "Text Reader active. Scans labels, books, and signboards aloud.";
        break;
      case AppMode.NAVIGATION:
        descriptionText = "Navigation assistance active. Scanning path for obstacles and hazards.";
        break;
      case AppMode.ASSISTANT:
        descriptionText = "Companion assistant active. Type or speak a question to begin.";
        break;
    }
    speakText(descriptionText, false);
  };

  // Speaks the primary response card aloud
  const handleSpeakReport = () => {
    if (!lastResponse) return;
    setIsSpeaking(true);
    playChime('click');
    const fullText = `${lastResponse.summary}. Details: ${lastResponse.details}. ${
      lastResponse.extraData?.safeRoute ? `Route advice: ${lastResponse.extraData.safeRoute}` : ''
    }`;
    speakText(fullText, useCloudVoice, selectedVoice);
  };

  // Stop active narration
  const handleMuteSpeech = () => {
    cancelSpeech();
    setIsSpeaking(false);
    playChime('alert');
  };

  // Perform Gemini Visual Analysis
  const performVisualAnalysis = async (base64Image: string, customPrompt?: string) => {
    setIsAnalyzing(true);
    setCapturedImage(base64Image);
    setLastResponse(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image,
          mode: activeMode,
          prompt: customPrompt,
          assistanceStyle: assistanceStyle
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Server error status ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();
      setLastResponse(data);
      playChime('success');

      // Announce summary immediately
      speakText(data.summary, useCloudVoice, selectedVoice);

      // Add to historical logs
      const newLog: VisionLog = {
        id: `log_${Date.now()}`,
        mode: activeMode,
        imageUrl: base64Image,
        timestamp: new Date().toLocaleTimeString() + " - " + new Date().toLocaleDateString(),
        summary: data.summary,
        details: data.details,
        extraData: data.extraData
      };
      setLogs(prev => [newLog, ...prev]);

    } catch (error: any) {
      console.error("Scan Error:", error);
      playChime('alert');
      const errorMsg = "Visual scan analysis failed. " + (error.message || "Please check your server settings.");
      speakText(errorMsg, false);
      setLastResponse({
        summary: "Visual scan failed.",
        details: "There was an error communicating with the Gemini Vision models. Please verify that process.env.GEMINI_API_KEY is configured."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Voice Assistant question submitted
  const handleSendAssistantMessage = async (text: string) => {
    const userMsg: AssistantMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };
    setAssistantMessages(prev => [...prev, userMsg]);
    setIsAssistantResponding(true);

    try {
      // Determine what image we should send as contextual sight
      let imageToSend = capturedImage;

      // If no photo was captured yet, fetch the active selected preset image from simulator
      if (!imageToSend) {
        const preset = selectedEnv || PRESET_ENVIRONMENTS[0];
        const res = await fetch(preset.imageUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        
        imageToSend = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageToSend,
          mode: AppMode.ASSISTANT,
          prompt: text,
          assistanceStyle: assistanceStyle
        })
      });

      if (!response.ok) {
        throw new Error("Failed to consult vision companion");
      }

      const data: AnalysisResponse = await response.json();
      
      const assistantMsg: AssistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: data.details || data.summary,
        timestamp: new Date().toLocaleTimeString()
      };

      setAssistantMessages(prev => [...prev, assistantMsg]);
      playChime('success');
      
      // Auto-speak reply
      speakText(assistantMsg.content, useCloudVoice, selectedVoice);

      // Add as visual log as well
      const newLog: VisionLog = {
        id: `log_${Date.now()}`,
        mode: AppMode.ASSISTANT,
        imageUrl: imageToSend || "",
        timestamp: new Date().toLocaleTimeString() + " - " + new Date().toLocaleDateString(),
        summary: `Question: "${text.substring(0, 30)}..."`,
        details: assistantMsg.content
      };
      setLogs(prev => [newLog, ...prev]);

    } catch (err: any) {
      console.error(err);
      playChime('alert');
      const errorMsg = "I couldn't process your question at this moment. Please try again.";
      speakText(errorMsg, false);
      
      const systemErrorMsg: AssistantMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: "My connection is currently interrupted. Please ensure the Gemini API Key is entered in the Secrets panel.",
        timestamp: new Date().toLocaleTimeString()
      };
      setAssistantMessages(prev => [...prev, systemErrorMsg]);
    } finally {
      setIsAssistantResponding(false);
    }
  };

  const getModeIcon = (mode: AppMode) => {
    switch (mode) {
      case AppMode.OBJECT_RECOGNITION: return <Camera className="w-4 h-4" />;
      case AppMode.SCENE_DESCRIPTION: return <Sparkles className="w-4 h-4" />;
      case AppMode.TEXT_READER: return <BookOpen className="w-4 h-4" />;
      case AppMode.NAVIGATION: return <NavigationIcon className="w-4 h-4" />;
      case AppMode.ASSISTANT: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getModeLabelText = (mode: AppMode) => {
    switch (mode) {
      case AppMode.OBJECT_RECOGNITION: return "Object Detection";
      case AppMode.SCENE_DESCRIPTION: return "Scene Description";
      case AppMode.TEXT_READER: return "Text Reader (OCR)";
      case AppMode.NAVIGATION: return "Navigation Assist";
      case AppMode.ASSISTANT: return "Companion Assistant";
    }
  };

  const triggerGlobalVoiceScan = async () => {
    if (isAnalyzing) return;
    if (inputType === 'simulator') {
      try {
        const response = await fetch(selectedEnv.imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            performVisualAnalysis(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to load preset simulator image for voice scan", err);
        speakText("Failed to retrieve environment image for visual analysis. Please try again.", false);
      }
    } else {
      const video = document.getElementById('camera-video-stream') as HTMLVideoElement | null;
      if (video) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          performVisualAnalysis(dataUrl);
        }
      } else if (capturedImage) {
        performVisualAnalysis(capturedImage);
      } else {
        speakText("No camera feed active. Scanning simulated environment instead.", false);
        try {
          const response = await fetch(selectedEnv.imageUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              performVisualAnalysis(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const clearAllLogs = () => {
    setLogs([]);
    localStorage.removeItem('sensevision_logs');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Dynamic flow-wave animated background lines underlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden bg-white">
        <div className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] bg-radial-gradient animate-[flowWave_25s_infinite_linear]"></div>
      </div>

      {/* Top Accessible Header bar */}
      <header className="bg-white border-b border-slate-200 z-30 shadow-xs relative" id="main-navigation-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28 sm:h-36">
            
            {/* Logo/Identity */}
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="SenseVision - See Smarter, Live Freely" 
                className="h-20 sm:h-28 w-auto object-contain" 
                id="sensevision-brand-logo"
              />
            </div>

            {/* Quick Speech Mute Buttons */}
            <div className="flex items-center space-x-3.5">
              {!isAuthenticated ? (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 bg-amber-50 px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-700 border border-amber-200 font-bold">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>👁️ AI SIGHT SERVICE: STANDBY</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 bg-red-50 px-2.5 py-1 rounded-full text-[10px] font-mono text-red-600 border border-red-200 font-bold">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <span>🔒 PERSONAL COMPANION LOCKED</span>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-600 border border-emerald-200 font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>👁️ AI SIGHT SERVICE: ONLINE</span>
                  </span>
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-600 border border-emerald-200 font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>🟢 PERSONAL COMPANION ACTIVE</span>
                  </span>
                </div>
              )}

              {isSpeaking ? (
                <button
                  id="mute-speech-btn"
                  onClick={handleMuteSpeech}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 transition-colors border border-red-600 shadow-sm cursor-pointer"
                  aria-label="Stop audio reader narration"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>STOP AUDIO</span>
                </button>
              ) : (
                <span className="text-slate-500 text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 inline-flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-mono font-extrabold text-slate-600">READY</span>
                </span>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Tab Navigation Header */}
      <div className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-40" id="sub-tabs-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            <button
              id="tab-scan-selector"
              onClick={() => {
                if (!isAuthenticated) return;
                setActiveTab('scan');
                playChime('click');
                speakText("Switched to Scan and Companion mode.", false);
              }}
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                !isAuthenticated ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } ${
                activeTab === 'scan' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              disabled={!isAuthenticated}
            >
              Scan & Sight
            </button>
            <button
              id="tab-logs-selector"
              onClick={() => {
                if (!isAuthenticated) return;
                setActiveTab('logs');
                playChime('click');
                speakText(`Auditory history logs. You have ${logs.length} previous scans saved.`, false);
              }}
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                !isAuthenticated ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } ${
                activeTab === 'logs' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              disabled={!isAuthenticated}
            >
              Auditory Logs ({logs.length})
            </button>
            <button
              id="tab-prefs-selector"
              onClick={() => {
                if (!isAuthenticated) return;
                setActiveTab('preferences');
                playChime('click');
                speakText("Accessibility options. Modify cloud speech engines and visual touch settings.", false);
              }}
              className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                !isAuthenticated ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } ${
                activeTab === 'preferences' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              disabled={!isAuthenticated}
            >
              A11y Preferences
            </button>
          </div>
        </div>
      </div>

      {/* Primary Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 z-10" id="primary-content-wrapper">
        
        {isAuthenticated ? (
          <>
            {/* TAB 1: SCAN AND COMPANION */}
            {activeTab === 'scan' && (
              <div className="space-y-6">
                
                {/* Voice Identity Secure Card */}
                <VoiceIdentityCard
                  isAuthenticated={isAuthenticated}
                  onVerificationSuccess={(active) => {
                    setVoiceCompanionActive(active);
                    if (active) {
                      setActiveMode(AppMode.ASSISTANT);
                    }
                  }}
                  onAuthSuccess={() => {
                    setIsAuthenticated(true);
                  }}
                  onLockSession={(type) => {
                    handleLockSession(type);
                  }}
                  onSendAssistantMessage={handleSendAssistantMessage}
                  isAnalyzing={isAnalyzing || isAssistantResponding}
                  isSpeaking={isSpeaking}
                  assistantMessages={assistantMessages}
                  onMuteSpeech={handleMuteSpeech}
                  selectedCompanion={selectedCompanion}
                  rememberCompanionChoice={rememberCompanionChoice}
                  useCloudVoice={useCloudVoice}
                  onShowCompanionSelection={(show) => {
                    setShowCompanionSelector(show);
                  }}
                />

            {/* Choose Your AI Companion Panel */}
            {showCompanionSelector && (
              <ChooseCompanionCard
                useCloudVoice={useCloudVoice}
                currentlySelectedId={selectedCompanion}
                onSelectCompanion={(companionId, remember) => {
                  setSelectedCompanion(companionId);
                  setRememberCompanionChoice(remember);
                  setShowCompanionSelector(false);
                  setVoiceCompanionActive(true);
                  setActiveMode(AppMode.ASSISTANT);

                  // Speak custom welcome message based on selected companion voice
                  let companionGreeting = `Hello! I'm ${companionId}, your Sense Companion. How may I help you today?`;
                  if (companionId === 'Alex') {
                    companionGreeting = `Hello! I'm ${companionId}, your Sense Companion. What would you like to explore today?`;
                  } else if (companionId === 'Maya') {
                    companionGreeting = "Namaste! I'm Maya, your Sense Companion. Let me guide you with warm Indian English assistance.";
                  } else if (companionId === 'Arjun') {
                    companionGreeting = "Hello there, I'm Arjun, your Sense Companion. I am ready to help you navigate your environments safely.";
                  } else if (companionId === 'Sophia') {
                    companionGreeting = "Hola, soy Sophia, tu compañera de Sense Companion. Te ayudaré a entender tu entorno de manera clara.";
                  } else if (companionId === 'Kenji') {
                    companionGreeting = "こんにちは、ケンジです。あなたの視覚情報を日本語でサポートします。";
                  }

                  speakText(
                    companionGreeting,
                    useCloudVoice,
                    undefined,
                    companionId
                  );
                }}
              />
            )}
            
            {/* Assistive Scanning Modes Row */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 shadow-sm text-left animate-fade-in" id="scanning-modes-control-panel">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-bold block mb-3">
                STEP 1: SELECT SENSE SIGHT MODULE
              </span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(Object.keys(AppMode) as Array<keyof typeof AppMode>).map((key) => {
                  const mode = AppMode[key];
                  const isSelected = activeMode === mode;
                  return (
                    <button
                      key={mode}
                      id={`mode-selector-${mode}`}
                      onClick={() => handleModeChange(mode)}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        largeTouchTargets ? 'min-h-[86px] py-5' : 'min-h-[72px]'
                      } ${
                        isSelected 
                          ? 'bg-blue-50/50 border-blue-600 text-blue-600 shadow-xs font-bold' 
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                      aria-label={`Switch to ${getModeLabelText(mode)} scanning mode`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-xs leading-none">{getModeLabelText(mode)}</span>
                        {getModeIcon(mode)}
                      </div>
                      <span className={`text-[9px] font-mono mt-2 uppercase ${isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                        {isSelected ? "Active" : "Select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Selection Stage (Live Web Cam vs Simulator) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white p-5 lg:p-6 border border-slate-200 rounded-2xl shadow-sm text-left animate-fade-in" id="input-source-toggle-panel">
              <div className="md:col-span-4">
                <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-bold block mb-1">
                  STEP 2: CHOOSE CAMERA SOURCE
                </span>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Select between your live web-camera feed or our high-quality simulated indoor/outdoor preset environments.
                </p>
              </div>
              <div className="md:col-span-8 flex justify-end gap-3 w-full">
                <button
                  id="source-selector-simulator"
                  onClick={() => {
                    setInputType('simulator');
                    playChime('click');
                    speakText("Environment simulator selected.", false);
                  }}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center justify-center space-x-2 cursor-pointer ${
                    inputType === 'simulator'
                      ? 'bg-blue-600 border-blue-600 text-white font-black shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Preset Simulator</span>
                </button>
                <button
                  id="source-selector-camera"
                  onClick={() => {
                    setInputType('camera');
                    playChime('click');
                    speakText("Real camera feed and photo uploader selected.", false);
                  }}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center justify-center space-x-2 cursor-pointer ${
                    inputType === 'camera'
                      ? 'bg-blue-600 border-blue-600 text-white font-black shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Real Camera & Upload</span>
                </button>
              </div>
            </div>

            {/* Main Stage Grid (Left: Active Feed, Right: Smart Response Screen) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start" id="main-interactive-grid">
              
              {/* Active Input Container */}
              <div className="xl:col-span-7">
                {inputType === 'camera' ? (
                  <CameraScreen 
                    onCapture={performVisualAnalysis} 
                    isAnalyzing={isAnalyzing}
                    activeModeLabel={getModeLabelText(activeMode)}
                  />
                ) : (
                  <SimulatorScreen 
                    onScanPreset={performVisualAnalysis}
                    isAnalyzing={isAnalyzing}
                    activeModeLabel={getModeLabelText(activeMode)}
                    assistanceStyle={assistanceStyle}
                    selectedEnv={selectedEnv}
                    onSelectEnv={setSelectedEnv}
                  />
                )}
              </div>

              {/* Smart Response Output Display */}
              <div className="xl:col-span-5 h-full">
                
                {/* Mode is Voice Assistant */}
                {activeMode === AppMode.ASSISTANT ? (
                  <AssistantScreen 
                    messages={assistantMessages}
                    onSendMessage={handleSendAssistantMessage}
                    isResponding={isAssistantResponding}
                    activeImagePreview={capturedImage}
                    useCloudVoice={useCloudVoice}
                    selectedVoice={selectedVoice}
                  />
                ) : (
                  
                  /* Regular scanning responses */
                  <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[550px] shadow-sm text-left" id="visual-report-panel">
                    
                    {/* Visual Report Header */}
                    <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-mono font-bold tracking-wider text-slate-800 uppercase">
                          SENSE VOICE NARRATION REPORT
                        </span>
                      </div>
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold">
                        {lastResponse ? "ANALYSIS COMPLETED" : "AWAITING ACTION"}
                      </span>
                    </div>

                    {/* Report Card Body */}
                    <div className="flex-1 p-6 space-y-6">
                      
                      {!lastResponse && !isAnalyzing && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-24 px-4">
                          <Eye className="w-12 h-12 text-slate-300 mb-3.5 animate-pulse" />
                          <h4 className="text-sm font-bold text-slate-800 mb-1">Visual Information Hub</h4>
                          <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans">
                            Once you trigger the visual scan, the multimodal Gemini models will compile spatial maps, speech guides, and reading transcriptions here.
                          </p>
                        </div>
                      )}

                      {isAnalyzing && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-24 px-4 space-y-4">
                          <div className="relative">
                            <span className="flex h-12 w-12 items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30"></span>
                              <span className="relative inline-flex rounded-full h-8 w-8 bg-blue-600 flex items-center justify-center text-white font-bold">
                                <RotateCcw className="w-4 h-4 animate-spin text-white" />
                              </span>
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Consulting Sight Engine...</h4>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed font-sans">
                              Gemini is currently constructing visual summaries, mapping safe pathways, and running OCR transcription on your target scene.
                            </p>
                          </div>
                        </div>
                      )}

                      {lastResponse && !isAnalyzing && (
                        <div className="space-y-6 animate-fade-in">
                          
                          {/* Auditory Summary */}
                          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-2 relative overflow-hidden">
                            <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-mono text-blue-600 uppercase tracking-wider block font-extrabold">
                              Audio Guidance Summary
                            </span>
                            <p className="text-sm text-slate-900 font-bold leading-relaxed font-sans">
                              "{lastResponse.summary}"
                            </p>
                          </div>

                          {/* Speech Trigger Tactile Button */}
                          <button
                            id="speak-narrative-report-btn"
                            onClick={handleSpeakReport}
                            className={`w-full min-h-[50px] rounded-xl bg-blue-600 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 border border-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm ${
                              largeTouchTargets ? 'py-4 text-sm' : ''
                            }`}
                            aria-label="Speak detailed report aloud"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>SPEAK REPORT ALOUD</span>
                          </button>

                          {/* Detailed Spatial Description */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                              Detailed Visual Report
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-xl font-normal">
                              {lastResponse.details}
                            </p>
                          </div>

                          {/* Mode specific widgets */}
                          {/* OBJECTS LIST */}
                          {activeMode === AppMode.OBJECT_RECOGNITION && lastResponse.extraData?.objects && (
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                                Detected Objects Detail
                              </span>
                              <div className="space-y-2">
                                {lastResponse.extraData.objects.map((obj, index) => (
                                  <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                                    <div>
                                      <div className="font-bold text-slate-900 uppercase">{obj.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-semibold">Location: {obj.location}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-blue-600">{obj.distance}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-semibold">Conf: {Math.round(obj.confidence * 100)}%</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* OCR TRANSCRIBER LINES */}
                          {activeMode === AppMode.TEXT_READER && lastResponse.extraData?.textLines && (
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                                OCR Text Lines Read
                              </span>
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                                {lastResponse.extraData.textLines.map((line, index) => (
                                  <div key={index} className="p-3.5 flex justify-between items-center text-xs">
                                    <span className="font-mono text-slate-800 font-medium">{line}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(line);
                                        playChime('click');
                                        speakText("Text line copied to clipboard", false);
                                      }}
                                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                                      aria-label={`Copy transcribed line: ${line}`}
                                    >
                                      <Clipboard className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* OBSTACLE AVOIDANCE AND ROAD PATHWAYS */}
                          {activeMode === AppMode.NAVIGATION && (
                            <div className="space-y-4">
                              {/* Hazards list */}
                              {lastResponse.extraData?.obstacles && lastResponse.extraData.obstacles.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-mono text-red-600 uppercase tracking-wider block font-bold">
                                    Potential Path Hazards
                                  </span>
                                  <div className="bg-red-50 border border-red-150 p-4 rounded-xl text-xs space-y-2 text-red-700">
                                    {lastResponse.extraData.obstacles.map((obs, idx) => (
                                      <div key={idx} className="flex items-start space-x-2.5">
                                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                                        <span className="font-semibold leading-relaxed">{obs}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recommended safe route */}
                              {lastResponse.extraData?.safeRoute && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider block font-bold">
                                    Safe Walk Path Advice
                                  </span>
                                  <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs flex items-start space-x-2.5 text-emerald-700">
                                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span className="font-bold leading-relaxed">{lastResponse.extraData.safeRoute}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* TAB 2: AUDITORY LOGS */}
        {activeTab === 'logs' && (
          <HistoryLogs 
            logs={logs} 
            onClearLogs={clearAllLogs}
            useCloudVoice={useCloudVoice}
            selectedVoice={selectedVoice}
          />
        )}

        {/* TAB 3: ACCESSIBILITY PREFERENCES */}
        {activeTab === 'preferences' && (
          <Preferences 
            useCloudVoice={useCloudVoice}
            onToggleCloudVoice={setUseCloudVoice}
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
            largeTouchTargets={largeTouchTargets}
            onToggleTouchTargets={setLargeTouchTargets}
            assistanceStyle={assistanceStyle}
            onSelectAssistanceStyle={setAssistanceStyle}
            selectedCompanion={selectedCompanion}
            onSelectCompanion={setSelectedCompanion}
          />
        )}

          </>
        ) : (
          /* Render the Voice Identity & Security section inline as the primary focus */
          <div className="max-w-4xl w-full mx-auto bg-white border border-slate-200 rounded-2xl shadow-md p-5 sm:p-6 relative animate-fade-in" id="secure-lock-content-wrapper">
            {/* Decorative Top Bar */}
            <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-red-500 to-red-400 h-1.5 rounded-t-2xl"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch text-left" id="secure-lock-grid-layout">
              {/* Left Column: Branding (5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-4 pt-1 border-b md:border-b-0 md:border-r border-slate-150 pb-5 md:pb-0 md:pr-6 lg:pr-8">
                <div className="space-y-4">
                  <div 
                    className="bg-slate-50 p-2 rounded-xl shadow-xs hover:scale-105 transition-all duration-300 inline-flex items-center justify-center cursor-pointer active:scale-95"
                    title="Click to Reload App"
                    onClick={() => window.location.reload()}
                  >
                    <img 
                      src={logoImage} 
                      alt="SenseVision Logo" 
                      className="h-10 w-auto object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.includes('?r=')) {
                          img.src = `${logoImage}?r=${Date.now()}`;
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">SenseVision</h1>
                    <p className="text-xs text-blue-600 font-extrabold tracking-wide">See Smarter. Live Freely.</p>
                    <p className="text-[9px] text-slate-400 font-mono font-bold tracking-widest uppercase">
                      INTELLIGENT VISUAL UNDERSTANDING
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                    Welcome to SenseVision. Your personal AI companion is protected by Voice Identity Authentication. Please verify your identity to activate your Sense Companion.
                  </p>
                  <div className="pt-1">
                    <span className="text-[8px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-bold inline-block">
                      Powered by Google AI Technologies
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions / Voice Auth Card (7 cols) */}
              <div className="md:col-span-7 flex flex-col justify-center pl-0 md:pl-2">
                {!voiceAuthActive ? (
                  <div className="space-y-4 py-2 text-center md:text-left">
                    <div className="inline-flex items-center space-x-1 bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider">
                      <Lock className="w-3 h-3 mr-1 shrink-0 animate-pulse text-red-500" />
                      <span>SECURE ACCESS REQUIRED</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                        Authentication Required
                      </h2>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        To access SenseVision's real-time multimodal assistance and live simulator environments, activate your Voice Identity now.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        id="activate-voice-id-btn"
                        onClick={() => {
                          setAuthTriggerType('normal');
                          setVoiceAuthActive(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Activate Voice Identity</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-left animate-fade-in" id="voice-auth-container">
                    <VoiceIdentityCard
                      autoStartTrigger={authTriggerType || true}
                      onVerificationSuccess={(active) => {
                        setVoiceCompanionActive(active);
                        if (active) {
                          setActiveMode(AppMode.ASSISTANT);
                        }
                      }}
                      onAuthSuccess={() => {
                        setIsAuthenticated(true);
                      }}
                      onLockSession={(type) => {
                        handleLockSession(type);
                      }}
                      onSendAssistantMessage={handleSendAssistantMessage}
                      isAnalyzing={isAnalyzing || isAssistantResponding}
                      isSpeaking={isSpeaking}
                      assistantMessages={assistantMessages}
                      onMuteSpeech={handleMuteSpeech}
                      selectedCompanion={selectedCompanion}
                      rememberCompanionChoice={rememberCompanionChoice}
                      useCloudVoice={useCloudVoice}
                      onShowCompanionSelection={(show) => {
                        setShowCompanionSelector(show);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Page Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 mt-12 shrink-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-slate-450 font-sans gap-4">
          <p className="font-medium text-slate-500">© 2026 SenseVision • AI Assistive Companion Technologies for Independent Living</p>
          <div className="flex space-x-6 text-slate-400 font-mono font-bold">
            <span>Gemini v3.5 Multimodal Sight</span>
          </div>
        </div>
      </footer>

      {/* Global Accessibility Voice Command Trigger */}
      {isAuthenticated && (
        <GlobalVoiceTrigger
          activeMode={activeMode}
          onModeChange={handleModeChange}
          onTriggerScan={triggerGlobalVoiceScan}
          onSendAssistantMessage={handleSendAssistantMessage}
          inputType={inputType}
          onInputTypeChange={setInputType}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isAnalyzing={isAnalyzing}
          isSpeaking={isSpeaking}
          onMuteSpeech={handleMuteSpeech}
          onLockSession={(type) => {
            handleLockSession(type);
          }}
        />
      )}

    </div>
  );
}
