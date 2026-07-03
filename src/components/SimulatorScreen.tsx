import React, { useState } from 'react';
import { HelpCircle, Sparkles, MapPin, Layers, Info, Volume2 } from 'lucide-react';
import { PRESET_ENVIRONMENTS } from '../utils/presets';
import { PresetEnvironment, AssistanceStyle } from '../types';
import { playChime, speakText } from '../utils/audio';

interface SimulatorScreenProps {
  onScanPreset: (base64Data: string) => void;
  isAnalyzing: boolean;
  activeModeLabel: string;
  assistanceStyle: AssistanceStyle;
  selectedEnv: PresetEnvironment;
  onSelectEnv: (env: PresetEnvironment) => void;
}

export default function SimulatorScreen({ 
  onScanPreset, 
  isAnalyzing, 
  activeModeLabel, 
  assistanceStyle,
  selectedEnv,
  onSelectEnv
}: SimulatorScreenProps) {
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  // Convert image URL to Base64 to send to server
  const handleFullAIAnalysis = async (envToAnalyze = selectedEnv, silent = false) => {
    if (isAnalyzing) return;
    
    if (!silent) {
      playChime('scan');
      speakText(`Sending ${envToAnalyze.name} scene to Gemini AI for complete spatial and audio analysis...`, false);
    }
    
    try {
      // Load image from imported path and convert to base64
      const response = await fetch(envToAnalyze.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onScanPreset(reader.result);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to convert image to base64:", err);
      if (!silent) {
        speakText("Error converting simulator image. Please try again.", false);
      }
    }
  };

  // When user selects a preset
  const selectPreset = (env: PresetEnvironment) => {
    onSelectEnv(env);
    playChime('click');
    
    if (assistanceStyle === AssistanceStyle.ASK) {
      speakText(`Switched to ${env.name}. On-demand mode active. Tap Gemini AI Scan to analyze.`, false);
    } else if (assistanceStyle === AssistanceStyle.SMART_AUTO) {
      speakText(`Entering ${env.name}. Smart Auto active, analyzing room layout...`, false);
      setTimeout(() => {
        handleFullAIAnalysis(env, true);
      }, 1000);
    } else { // HYBRID Mode (Default)
      speakText(`Entering ${env.name}. Hybrid safety check active, checking walking path...`, false);
      setTimeout(() => {
        handleFullAIAnalysis(env, true);
      }, 1000);
    }
  };

  // When user clicks a hotspot
  const handleHotspotClick = (hotspot: any) => {
    playChime('success');
    speakText(`${hotspot.label}. Estimated distance is ${hotspot.distance}.`, false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="simulator-grid-layout">
      {/* Interactive Environment Viewport (8 Columns) */}
      <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm" id="simulator-viewport-card">
        {/* Viewport Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-mono font-bold tracking-widest text-slate-800 uppercase">
              INTERACTIVE ACCESSIBILITY SIMULATOR
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              {selectedEnv.category}
            </span>
            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold">
              {activeModeLabel}
            </span>
          </div>
        </div>

        {/* Viewport Image Frame with Hotspots */}
        <div className="relative flex-1 bg-slate-50 aspect-[4/3] max-h-[500px] flex items-center justify-center overflow-hidden group">
          <img 
            src={selectedEnv.imageUrl} 
            alt={selectedEnv.name}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />

          {/* Dark overlay for accessibility help */}
          <div className="absolute inset-0 bg-slate-950/5 pointer-events-none group-hover:bg-slate-950/0 transition-colors"></div>

          {/* Interactive Pulse Hotspots */}
          {selectedEnv.hotspots.map((hotspot, idx) => (
            <button
              key={idx}
              onClick={() => handleHotspotClick(hotspot)}
              onMouseEnter={() => {
                setHoveredHotspot(hotspot.label);
                speakText(hotspot.label, false);
              }}
              onMouseLeave={() => setHoveredHotspot(null)}
              style={{ top: `${hotspot.y}%`, left: `${hotspot.x}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group/item z-20 focus:outline-none animate-fade-in"
              aria-label={`Interactive hotspot: ${hotspot.label}. Double tap or click to hear distance.`}
            >
              <span className="flex h-6 w-6 relative items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white hover:bg-amber-300 transition-colors"></span>
              </span>

              {/* Hotspot tooltip label */}
              <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white border border-slate-850 text-xs py-1 px-2.5 rounded-lg whitespace-nowrap shadow-xl transition-all pointer-events-none ${
                hoveredHotspot === hotspot.label ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'
              }`}>
                <div className="font-bold text-amber-400">{hotspot.label}</div>
                <div className="text-[10px] font-mono text-slate-300">{hotspot.distance}</div>
              </div>
            </button>
          ))}

          {/* Prompt banner inside viewport */}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur border border-slate-200 p-2.5 rounded-xl flex items-center space-x-2.5 shadow-md">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-xs text-slate-750 leading-normal">
              <span className="font-bold text-slate-900">Auditory Exploration:</span> Hover or tap on the pulsing yellow markers to announce objects and estimated distances.
            </p>
          </div>
        </div>

        {/* Viewport Description & Triggers */}
        <div className="bg-slate-50 p-4 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">{selectedEnv.name}</h3>
              <p className="text-xs text-slate-600 max-w-lg leading-relaxed">{selectedEnv.description}</p>
            </div>

            <button
              disabled={isAnalyzing}
              onClick={handleFullAIAnalysis}
              className={`w-full md:w-auto min-h-[44px] px-6 rounded-xl font-bold uppercase tracking-wider text-xs inline-flex items-center justify-center space-x-2.5 transition-all transform active:scale-95 cursor-pointer ${
                isAnalyzing 
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-xs'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Gemini AI Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selectors Pane (4 Columns) */}
      <div className="lg:col-span-4 flex flex-col space-y-4" id="simulator-selectors-panel">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>Select Scenario</span>
          </h3>
          <div className="space-y-3">
            {PRESET_ENVIRONMENTS.map((env) => {
              const isSelected = selectedEnv.id === env.id;
              return (
                <button
                  key={env.id}
                  onClick={() => selectPreset(env)}
                  className={`w-full text-left p-3 rounded-xl transition-all border flex gap-3 cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm font-bold' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label={`Select environment: ${env.name}`}
                >
                  {/* Miniature Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <img src={env.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>

                  {/* Context Text */}
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate">{env.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{env.category}</div>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{env.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessibility Note Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Independent Living Aid</span>
          </h4>
          <p className="text-[11px] text-slate-650 leading-relaxed">
            Visually challenged individuals rely on continuous verbal narration. The Preset Simulator mimics this loop perfectly by demonstrating how spatial object distance estimates are narrated out loud.
          </p>
        </div>
      </div>
    </div>
  );
}
