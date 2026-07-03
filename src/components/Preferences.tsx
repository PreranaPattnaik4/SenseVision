import React from 'react';
import { Settings, Volume2, HelpCircle, Eye, Sliders, Check, Play } from 'lucide-react';
import { playChime, speakText } from '../utils/audio';
import { AssistanceStyle } from '../types';
import { COMPANIONS } from './ChooseCompanionCard';

interface PreferencesProps {
  useCloudVoice: boolean;
  onToggleCloudVoice: (val: boolean) => void;
  selectedVoice: string;
  onSelectVoice: (val: string) => void;
  largeTouchTargets: boolean;
  onToggleTouchTargets: (val: boolean) => void;
  assistanceStyle: AssistanceStyle;
  onSelectAssistanceStyle: (val: AssistanceStyle) => void;
  selectedCompanion: string;
  onSelectCompanion: (val: string) => void;
}

export default function Preferences({
  useCloudVoice,
  onToggleCloudVoice,
  selectedVoice,
  onSelectVoice,
  largeTouchTargets,
  onToggleTouchTargets,
  assistanceStyle,
  onSelectAssistanceStyle,
  selectedCompanion,
  onSelectCompanion
}: PreferencesProps) {

  const handleSelectCompanionLocal = (companionId: string) => {
    onSelectCompanion(companionId);
    playChime('click');
    const comp = COMPANIONS.find(c => c.id === companionId);
    if (comp) {
      speakText(`Companion voice set to ${comp.name}.`, useCloudVoice, undefined, companionId);
    }
  };

  const handleSelectStyle = (style: AssistanceStyle) => {
    onSelectAssistanceStyle(style);
    playChime('click');
    if (style === AssistanceStyle.ASK) {
      speakText("On-demand Ask mode enabled. I will only answer your explicit questions.", false);
    } else if (style === AssistanceStyle.SMART_AUTO) {
      speakText("Smart Auto mode enabled. I will automatically provide complete narration of your surroundings.", false);
    } else {
      speakText("Hybrid safety-first mode activated. I will announce important safety alerts automatically, and other descriptions remain on-demand.", false);
    }
  };

  const handleToggleVoice = (checked: boolean) => {
    onToggleCloudVoice(checked);
    playChime('click');
    if (checked) {
      speakText("Advanced Cloud voice engine activated.", true, selectedVoice);
    } else {
      speakText("Native voice synthesis activated.", false);
    }
  };

  const handleSelectVoice = (voice: string) => {
    onSelectVoice(voice);
    playChime('click');
    speakText(`Voice changed to ${voice}.`, true, voice);
  };

  const handleToggleTargets = (checked: boolean) => {
    onToggleTouchTargets(checked);
    playChime('click');
    if (checked) {
      speakText("Large touch targets activated. Spacing and controls magnified.", false);
    } else {
      speakText("Standard touch layouts restored.", false);
    }
  };

  const cloudVoices = [
    { id: 'Kore', label: 'Kore (Calm, Professional)' },
    { id: 'Zephyr', label: 'Zephyr (Bright, Welcoming)' },
    { id: 'Fenrir', label: 'Fenrir (Deep, Authoritative)' },
    { id: 'Puck', label: 'Puck (Cheerful, Expressive)' },
    { id: 'Charon', label: 'Charon (Balanced, Neutral)' }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-8 shadow-sm" id="preferences-panel">
      
      {/* Title Header */}
      <div className="flex items-center space-x-3.5 pb-5 border-b border-slate-100 text-left">
        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
          <Settings className="w-5 h-5 shrink-0" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Accessibility & Speech Settings</h3>
          <p className="text-xs text-slate-500 font-medium">Configure auditory prompts, voice engine persona, and visual target scaling</p>
        </div>
      </div>

      {/* Assistance Style Selector */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-5 text-left" id="assistance-style-section">
        <div className="flex items-start space-x-3">
          <Sliders className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">AI Assistance Style</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal mt-0.5">
              Choose how proactively SenseVision provides continuous narration and safety alerts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ask Mode */}
          <button
            id="assistance-style-ask"
            onClick={() => handleSelectStyle(AssistanceStyle.ASK)}
            className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-full bg-white hover:shadow-sm ${
              assistanceStyle === AssistanceStyle.ASK
                ? 'border-blue-600 shadow-sm'
                : 'border-slate-250 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950">Ask Mode</span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">ASK ONLY</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                SenseVision stays quiet and only speaks when you explicitly ask a question or tap "Full Gemini AI Scan".
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between w-full pt-3 border-t border-slate-100">
              <span className={`text-[10px] font-mono font-bold uppercase ${
                assistanceStyle === AssistanceStyle.ASK ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {assistanceStyle === AssistanceStyle.ASK ? 'Selected' : 'Select'}
              </span>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                assistanceStyle === AssistanceStyle.ASK ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
              }`}>
                {assistanceStyle === AssistanceStyle.ASK && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
          </button>

          {/* Hybrid Mode */}
          <button
            id="assistance-style-hybrid"
            onClick={() => handleSelectStyle(AssistanceStyle.HYBRID)}
            className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-full bg-white hover:shadow-sm ${
              assistanceStyle === AssistanceStyle.HYBRID
                ? 'border-blue-600 shadow-sm'
                : 'border-slate-250 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950">Hybrid Mode</span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">RECOMMENDED</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Proactive alerts for path hazards and stairs. General room narration and deep details remain on-demand.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between w-full pt-3 border-t border-slate-100">
              <span className={`text-[10px] font-mono font-bold uppercase ${
                assistanceStyle === AssistanceStyle.HYBRID ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {assistanceStyle === AssistanceStyle.HYBRID ? 'Selected' : 'Select'}
              </span>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                assistanceStyle === AssistanceStyle.HYBRID ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
              }`}>
                {assistanceStyle === AssistanceStyle.HYBRID && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
          </button>

          {/* Smart Auto Mode */}
          <button
            id="assistance-style-smartauto"
            onClick={() => handleSelectStyle(AssistanceStyle.SMART_AUTO)}
            className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-full bg-white hover:shadow-sm ${
              assistanceStyle === AssistanceStyle.SMART_AUTO
                ? 'border-blue-600 shadow-sm'
                : 'border-slate-250 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950">Smart Auto Mode</span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">FULL NARRATION</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Continuous assistance. SenseVision automatically provides full descriptions of environments as you move.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-between w-full pt-3 border-t border-slate-100">
              <span className={`text-[10px] font-mono font-bold uppercase ${
                assistanceStyle === AssistanceStyle.SMART_AUTO ? 'text-blue-600' : 'text-slate-400'
              }`}>
                {assistanceStyle === AssistanceStyle.SMART_AUTO ? 'Selected' : 'Select'}
              </span>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                assistanceStyle === AssistanceStyle.SMART_AUTO ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
              }`}>
                {assistanceStyle === AssistanceStyle.SMART_AUTO && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* AI Companion Voice Card */}
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-5 text-left" id="pref-companion-settings-card">
        <div className="flex items-start space-x-3">
          <Volume2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">AI Companion Voice</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal mt-0.5">
              Select your default AI companion voice. Your companion will speak all narrations, alerts, and conversational answers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMPANIONS.map((comp) => {
            const isSelected = selectedCompanion === comp.id;
            return (
              <div
                key={comp.id}
                onClick={() => handleSelectCompanionLocal(comp.id)}
                className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between cursor-pointer bg-white transition-all hover:shadow-sm ${
                  isSelected
                    ? 'border-blue-600 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
                id={`pref-companion-${comp.id.toLowerCase()}`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectCompanionLocal(comp.id); }}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block text-slate-900">
                      {comp.emoji} {comp.name}
                    </span>
                    <input
                      type="radio"
                      name="pref-companion-radio"
                      checked={isSelected}
                      onChange={() => handleSelectCompanionLocal(comp.id)}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4 bg-white border-slate-300 rounded-full cursor-pointer accent-blue-600"
                      aria-label={`Select ${comp.name} as companion`}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-600 tracking-wide block">
                    {comp.role}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1">
                    {comp.description}
                  </p>
                </div>
                
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playChime('click');
                      speakText(comp.quote, useCloudVoice, undefined, comp.id);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-600"
                    aria-label={`Play sample of ${comp.name}`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current text-slate-600" />
                    <span>Play Sample</span>
                  </button>
                  {isSelected && (
                    <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">
                      Selected
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        
        {/* Voice and Speech Options */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <span>Voice Audio Engine</span>
          </h4>

          {/* Toggle Engine */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <label className="text-xs font-bold text-slate-900 block cursor-pointer" htmlFor="cloud-voice-toggle">
                Advanced Cloud Voice (Gemini TTS)
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                Synthesizes premium, highly expressive human-like speech. Requires a configured server-side API Key.
              </p>
            </div>
            <button
              id="cloud-voice-toggle"
              onClick={() => handleToggleVoice(!useCloudVoice)}
              className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 relative ${
                useCloudVoice ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              aria-checked={useCloudVoice}
              role="switch"
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                useCloudVoice ? 'translate-x-6' : 'translate-x-0'
              }`}></span>
            </button>
          </div>

          {/* Voice Selectors if Cloud Active */}
          {useCloudVoice && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Select Speech Persona</span>
              <div className="space-y-2">
                {cloudVoices.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleSelectVoice(voice.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs flex justify-between items-center border bg-white transition-all ${
                      selectedVoice === voice.id 
                        ? 'border-blue-600 text-blue-600 font-bold' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{voice.label}</span>
                    {selectedVoice === voice.id && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Visual Target Scaling Options */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase flex items-center space-x-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Visual Accessibility</span>
          </h4>

          {/* Toggle Target Size */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-start justify-between">
            <div className="space-y-1 pr-4">
              <label className="text-xs font-bold text-slate-900 block cursor-pointer" htmlFor="magnify-touch-toggle">
                Magnify Touch Targets
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                Enlarges primary navigation buttons and increases click target paddings for physically challenged or low-vision individuals.
              </p>
            </div>
            <button
              id="magnify-touch-toggle"
              onClick={() => handleToggleTargets(!largeTouchTargets)}
              className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 relative ${
                largeTouchTargets ? 'bg-blue-600' : 'bg-slate-300'
              }`}
              aria-checked={largeTouchTargets}
              role="switch"
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                largeTouchTargets ? 'translate-x-6' : 'translate-x-0'
              }`}></span>
            </button>
          </div>

          {/* Short-cuts Help Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Keyboard Shortcuts</span>
            </h5>
            <ul className="text-[11px] text-slate-500 space-y-2 leading-relaxed font-mono font-medium">
              <li className="flex items-start">
                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-md border border-slate-200 mr-2 font-bold shadow-xs shrink-0">SPACEBAR</span>
                <span>Triggers the visual scan button when focused.</span>
              </li>
              <li className="flex items-start">
                <span className="bg-white text-blue-600 px-2 py-0.5 rounded-md border border-slate-200 mr-2 font-bold shadow-xs shrink-0">DOUBLE CLICK</span>
                <span>Speak current description card on any active item.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
