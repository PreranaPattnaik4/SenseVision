import React, { useState } from 'react';
import { History, Volume2, Search, Trash2, ChevronDown } from 'lucide-react';
import { VisionLog, AppMode } from '../types';
import { playChime, speakText } from '../utils/audio';

interface HistoryLogsProps {
  logs: VisionLog[];
  onClearLogs: () => void;
  useCloudVoice: boolean;
  selectedVoice: string;
}

export default function HistoryLogs({ logs, onClearLogs, useCloudVoice, selectedVoice }: HistoryLogsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");

  const handleSpeakLog = (log: VisionLog) => {
    playChime('click');
    const speechContent = `${log.summary}. Here are the details: ${log.details}.`;
    speakText(speechContent, useCloudVoice, selectedVoice);
  };

  const getModeLabel = (mode: AppMode) => {
    switch (mode) {
      case AppMode.OBJECT_RECOGNITION: return "Object Recognition";
      case AppMode.SCENE_DESCRIPTION: return "Scene Description";
      case AppMode.TEXT_READER: return "Text Reader (OCR)";
      case AppMode.NAVIGATION: return "Navigation Assist";
      case AppMode.ASSISTANT: return "Voice Assistant";
      default: return "Smart Scan";
    }
  };

  const getModeColor = (mode: AppMode) => {
    switch (mode) {
      case AppMode.OBJECT_RECOGNITION: return "bg-blue-50 text-blue-600 border-blue-100";
      case AppMode.SCENE_DESCRIPTION: return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case AppMode.TEXT_READER: return "bg-purple-50 text-purple-600 border-purple-100";
      case AppMode.NAVIGATION: return "bg-red-50 text-red-600 border-red-100";
      case AppMode.ASSISTANT: return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.summary.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = selectedMode === "all" || log.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear your local scanning history? This cannot be undone.")) {
      playChime('alert');
      onClearLogs();
      speakText("Scanning history has been cleared.", false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm text-left animate-fade-in" id="history-logs-panel">
      {/* Search and Filters bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <History className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Scanning & Interaction Logs</h3>
            <p className="text-xs text-slate-500 font-medium font-sans">Replay previous audio readouts and spatial feedback cards</p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            onClick={clearAllHistory}
            className="text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 text-xs font-bold px-3.5 py-2 rounded-xl transition-all inline-flex items-center space-x-1.5 self-end md:self-auto cursor-pointer"
            aria-label="Clear all visual scanning history logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-150">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-500 mb-3.5">
            <History className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">No Past Scans Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
            Your scanned environments and voice summaries will appear here. Replaying past scan descriptions assists with recall and study.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Filters controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4" id="log-filters-bar">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search summaries & details..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>

            {/* Mode Dropdown Filter */}
            <div className="relative">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer font-medium"
                aria-label="Filter visual logs by scan mode"
              >
                <option value="all">All Scanning Modes</option>
                <option value={AppMode.OBJECT_RECOGNITION}>Object Recognition</option>
                <option value={AppMode.SCENE_DESCRIPTION}>Scene Description</option>
                <option value={AppMode.TEXT_READER}>Text Reader (OCR)</option>
                <option value={AppMode.NAVIGATION}>Navigation Assist</option>
                <option value={AppMode.ASSISTANT}>Voice Assistant Messages</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Logs List cards */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400 font-mono">No matching logs found.</p>
            ) : (
              filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="bg-white hover:bg-slate-50/50 rounded-2xl border border-slate-200 p-4 lg:p-5 transition-all flex flex-col md:flex-row gap-4 items-start"
                  id={`log-card-${log.id}`}
                >
                  {/* Miniature frame snapshot preview */}
                  {log.imageUrl && (
                    <div className="w-full md:w-24 aspect-[4/3] rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                      <img src={log.imageUrl} alt="Scan preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border uppercase font-bold ${getModeColor(log.mode)}`}>
                        {getModeLabel(log.mode)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">{log.timestamp}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-1">{log.summary}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{log.details}</p>

                    {/* Rich objects list metadata representation */}
                    {log.extraData?.objects && log.extraData.objects.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {log.extraData.objects.map((obj, oIdx) => (
                          <span 
                            key={oIdx} 
                            className="bg-slate-50 text-[10px] text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 font-mono font-medium"
                          >
                            {obj.name} ({obj.distance})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Obstacles list representation */}
                    {log.extraData?.obstacles && log.extraData.obstacles.length > 0 && (
                      <div className="mt-3 bg-red-50 border border-red-100 p-3 rounded-xl text-[11px] text-red-700 font-sans flex items-start gap-1.5 leading-relaxed">
                        <span className="font-bold text-red-800 shrink-0 uppercase tracking-wider text-[9px] bg-red-100 px-1.5 py-0.5 rounded">HAZARDS:</span>
                        <span className="font-semibold">{log.extraData.obstacles.join(', ')}</span>
                      </div>
                    )}

                    {/* Read text representation */}
                    {log.extraData?.textLines && log.extraData.textLines.length > 0 && (
                      <div className="mt-3 bg-purple-50/40 border border-purple-100 p-3 rounded-xl text-xs text-slate-700 font-mono max-h-[80px] overflow-y-auto">
                        <div className="font-bold text-purple-700 text-[10px] uppercase mb-1.5 tracking-wider">[TRANSCRIBED TEXT]:</div>
                        {log.extraData.textLines.map((line, lIdx) => (
                          <div key={lIdx} className="leading-relaxed border-b border-purple-100/50 pb-1 mb-1 last:border-0">{line}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Replay voice readout button */}
                  <button
                    onClick={() => handleSpeakLog(log)}
                    className="w-full md:w-auto min-h-[44px] px-4 rounded-xl bg-white border border-slate-200 hover:border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center space-x-1.5 shrink-0 transition-colors cursor-pointer"
                    aria-label={`Replay audio guidance for log dated ${log.timestamp}`}
                  >
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    <span>Speak</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
