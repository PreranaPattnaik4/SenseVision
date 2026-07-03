import React, { useState } from 'react';
import { Sparkles, Play, Check, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { playChime, speakText } from '../utils/audio';

export interface Companion {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  quote: string;
  isRegional?: boolean;
}

export const COMPANIONS: Companion[] = [
  {
    id: 'Emma',
    name: 'Emma',
    emoji: '👩',
    role: 'Sense Companion',
    description: 'Warm • Friendly • Patient • Reassuring',
    quote: "Hello! I'm Emma, your Sense Companion. I'm here to help you understand the world around you."
  },
  {
    id: 'Alex',
    name: 'Alex',
    emoji: '👨',
    role: 'Sense Companion',
    description: 'Calm • Professional • Confident • Informative',
    quote: "Hello! I'm Alex, your Sense Companion. I'll guide you with clear and reliable assistance wherever you go."
  },
  {
    id: 'Maya',
    name: 'Maya',
    emoji: '👩',
    role: 'Indian English - Female',
    description: 'Graceful • Expressive • Clear regional pronunciation',
    quote: "Namaste! I'm Maya. Let me guide you with warm Indian English assistance.",
    isRegional: true
  },
  {
    id: 'Arjun',
    name: 'Arjun',
    emoji: '👨',
    role: 'Arjun',
    description: 'Polite • Clear-toned • Professional regional speech',
    quote: "Hello there, I'm Arjun. I am ready to help you navigate your environments safely.",
    isRegional: true
  },
  {
    id: 'Sophia',
    name: 'Sophia',
    emoji: '👩',
    role: 'Spanish Translation Assistant',
    description: 'Bilingual • Fluent • Clear Spanish voice synthesis',
    quote: "Hola, soy Sophia. Te ayudaré a entender tu entorno de manera clara.",
    isRegional: true
  },
  {
    id: 'Kenji',
    name: 'Kenji',
    emoji: '👨',
    role: 'Japanese Translation Assistant',
    description: 'Bilingual • Fluent • Clear Japanese voice synthesis',
    quote: "こんにちは、ケンジです。あなたの視覚情報を日本語でサポートします。",
    isRegional: true
  }
];

interface ChooseCompanionCardProps {
  useCloudVoice: boolean;
  currentlySelectedId: string;
  onSelectCompanion: (companionId: string, remember: boolean) => void;
}

export default function ChooseCompanionCard({
  useCloudVoice,
  currentlySelectedId,
  onSelectCompanion
}: ChooseCompanionCardProps) {
  const [selectedId, setSelectedId] = useState(currentlySelectedId || 'Emma');
  const [rememberChoice, setRememberChoice] = useState(false);
  const [showRegional, setShowRegional] = useState(false);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);

  const playSample = async (companion: Companion, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingId) return;
    playChime('click');
    setIsPlayingId(companion.id);
    await speakText(companion.quote, useCloudVoice, undefined, companion.id);
    setIsPlayingId(null);
  };

  const handleSelect = (companionId: string) => {
    setSelectedId(companionId);
    playChime('click');
    const comp = COMPANIONS.find(c => c.id === companionId);
    if (comp) {
      speakText(`Selected companion ${comp.name}.`, useCloudVoice, undefined, companionId);
    }
  };

  const handleConfirm = () => {
    playChime('success');
    onSelectCompanion(selectedId, rememberChoice);
  };

  const primaryCompanions = COMPANIONS.filter(c => !c.isRegional);
  const regionalCompanions = COMPANIONS.filter(c => c.isRegional);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg animate-fade-in" id="choose-companion-panel-container">
      
      {/* Dynamic Header Badge */}
      <div className="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span>Active Session Configuration</span>
        </span>
        <span className="bg-blue-600 text-white font-mono text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wide">
          STEP 2 OF 2
        </span>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Heading & Intro Text */}
        <div className="space-y-1.5 text-left">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Who would you like as your Sense Companion today?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Your Sense Companion will be your trusted voice throughout your journey—helping you understand your surroundings, explore available choices, answer your questions, and guide you with confidence.
          </p>
        </div>

        {/* Primary Companions grid (Emma, Alex) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {primaryCompanions.map((comp) => {
            const isSelected = selectedId === comp.id;
            return (
              <div 
                key={comp.id}
                onClick={() => handleSelect(comp.id)}
                className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isSelected 
                    ? 'bg-blue-50/40 border-blue-600 shadow-sm' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
                id={`companion-card-${comp.id.toLowerCase()}`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(comp.id); }}
              >
                <div className="space-y-3">
                  {/* Companion visual header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl" role="img" aria-label={comp.name}>
                        {comp.emoji}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-slate-900 block tracking-wide">
                          {comp.name}
                        </span>
                        <span className="text-[10px] text-blue-600 font-mono uppercase tracking-wider block font-bold">
                          {comp.role}
                        </span>
                      </div>
                    </div>
                    
                    {/* Material-inspired Radio / Check Indicator */}
                    <div className="flex items-center justify-center">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                    {comp.description}
                  </p>

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                    <p className="text-[11px] text-slate-600 leading-relaxed italic">
                      "{comp.quote}"
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={(e) => playSample(comp, e)}
                    className={`px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-colors inline-flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      isPlayingId === companionPlaying(comp.id)
                        ? 'bg-blue-100 border-blue-300 text-blue-700 animate-pulse'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    aria-label={`Play voice sample for ${comp.name}`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play Sample</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(comp.id);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    aria-label={`Choose ${comp.name}`}
                  >
                    <span>✓ {isSelected ? 'Chosen' : `Choose ${comp.name}`}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Regional Companions section */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50" id="regional-companions-box">
          <button
            onClick={() => {
              playChime('click');
              setShowRegional(!showRegional);
            }}
            className="w-full flex items-center justify-between p-4 text-xs font-bold uppercase text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            aria-expanded={showRegional}
          >
            <span className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span>More Voices & Languages ({regionalCompanions.length})</span>
            </span>
            {showRegional ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showRegional && (
            <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              {regionalCompanions.map((comp) => {
                const isSelected = selectedId === comp.id;
                return (
                  <div
                    key={comp.id}
                    onClick={() => handleSelect(comp.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {comp.emoji} {comp.name}
                        </span>
                        <span className="text-[9px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-semibold">
                          {comp.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                        {comp.description}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={(e) => playSample(comp, e)}
                        className="p-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold uppercase tracking-wider border border-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                        aria-label={`Play sample of ${comp.name}`}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Sample</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(comp.id);
                        }}
                        className={`p-1.5 px-3.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Choose'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions, Checklist, Confirm Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-4">
          
          {/* Remember Choice Checkbox */}
          <label className="flex items-center space-x-3 cursor-pointer group" htmlFor="remember-companion-checkbox">
            <div className="relative flex items-center">
              <input
                id="remember-companion-checkbox"
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => {
                  playChime('click');
                  setRememberChoice(e.target.checked);
                }}
                className="rounded-md bg-white border-slate-300 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5 cursor-pointer accent-blue-600"
              />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">
                ☑ Remember my Sense Companion
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5 max-w-xs font-medium">
                Your selected companion will become the default voice across all SenseVision experiences.
              </span>
            </div>
          </label>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600 flex items-center justify-center space-x-1.5"
            aria-label={`Continue with ${selectedId}`}
          >
            <span>Continue with {selectedId}</span>
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

      </div>

    </div>
  );

  function companionPlaying(id: string) {
    return isPlayingId === id ? id : null;
  }
}
