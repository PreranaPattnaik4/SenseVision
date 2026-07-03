export enum AppMode {
  OBJECT_RECOGNITION = 'object_recognition',
  SCENE_DESCRIPTION = 'scene_description',
  TEXT_READER = 'text_reader',
  NAVIGATION = 'navigation',
  ASSISTANT = 'assistant'
}

export enum AssistanceStyle {
  ASK = 'ask',
  SMART_AUTO = 'smart_auto',
  HYBRID = 'hybrid'
}

export interface PresetEnvironment {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  hotspots: Array<{
    label: string;
    x: number; // percentage from left
    y: number; // percentage from top
    distance: string;
  }>;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface VisionLog {
  id: string;
  mode: AppMode;
  imageUrl: string;
  timestamp: string;
  summary: string;
  details: string;
  voiceUrl?: string; // Optional TTS audio source
  extraData?: {
    objects?: Array<{ name: string; confidence: number; location: string; distance: string }>;
    textLines?: string[];
    obstacles?: string[];
    safeRoute?: string;
  };
}

export interface AnalysisResponse {
  summary: string;
  details: string;
  extraData?: {
    objects?: Array<{ name: string; confidence: number; location: string; distance: string }>;
    textLines?: string[];
    obstacles?: string[];
    safeRoute?: string;
  };
}
