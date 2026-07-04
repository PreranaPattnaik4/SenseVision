// Audio feedback utility for SensevVision

let currentAudio: HTMLAudioElement | null = null;

/**
 * Triggers Text-to-Speech (TTS) for assistive reading
 * @param text The text message to speak
 * @param useCloudVoice Whether to request server-side Gemini TTS
 * @param voiceName The voice character to use for Gemini (Kore, Fenrir, Zephyr, Puck, Charon)
 * @param companionOverride Optional companion name override
 * @returns Promise that resolves when audio starts playing
 */
export async function speakText(
  text: string, 
  useCloudVoice: boolean = false, 
  voiceName: string = 'Kore',
  companionOverride?: string
): Promise<void> {
  // Cancel any ongoing speech first
  cancelSpeech();

  // Clean the text to avoid spelling out brackets or code structures
  const cleanText = text
    .replace(/[*#`_\-]/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();

  if (!cleanText) return;

  // Determine active companion preference
  let activeCompanion = companionOverride;
  if (!activeCompanion && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('sensevvision_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedCompanion) {
          activeCompanion = parsed.selectedCompanion;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  if (!activeCompanion) activeCompanion = 'Emma';

  // Map companion names to suitable Cloud Voices if useCloudVoice is true
  let cloudVoice = voiceName;
  if (useCloudVoice) {
    if (activeCompanion === 'Emma') {
      cloudVoice = 'Zephyr'; // Bright, welcoming, perfect for Emma
    } else if (activeCompanion === 'Alex') {
      cloudVoice = 'Kore'; // Calm, professional, perfect for Alex
    } else if (activeCompanion === 'Maya') {
      cloudVoice = 'Puck'; // Cheerful, expressive
    } else if (activeCompanion === 'Arjun') {
      cloudVoice = 'Fenrir'; // Deep, authoritative
    } else if (activeCompanion === 'Sophia' || activeCompanion === 'Kenji') {
      cloudVoice = 'Charon'; // Neutral
    }
  }

  if (useCloudVoice) {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voice: cloudVoice }),
      });

      if (!response.ok) {
        throw new Error(`Cloud TTS responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.audio) {
        const audioUri = `data:audio/mp3;base64,${data.audio}`;
        currentAudio = new Audio(audioUri);
        await currentAudio.play();
        return;
      } else {
        throw new Error("No audio payload received from server");
      }
    } catch (error) {
      console.warn("Cloud TTS failed, falling back to Native speech synthesis:", error);
      // Fallback to native voice
      speakNative(cleanText, activeCompanion);
    }
  } else {
    speakNative(cleanText, activeCompanion);
  }
}

/**
 * Native Speech Synthesis fallback
 */
function speakNative(text: string, companion: string = 'Emma'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.error("Speech synthesis is not supported in this browser.");
    return;
  }

  // Cancel any active native speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a pleasant English voice matching gender/style
  const voices = window.speechSynthesis.getVoices();
  let selectedVoiceObj = null;
  let pitch = 1.0;

  const compLower = companion.toLowerCase();
  
  if (compLower === 'emma') {
    // Female english
    selectedVoiceObj = voices.find(v => v.lang.startsWith('en') && (
      v.name.toLowerCase().includes('samantha') || 
      v.name.toLowerCase().includes('zira') || 
      v.name.toLowerCase().includes('hazel') || 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('karen') ||
      v.name.toLowerCase().includes('moira')
    )) || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
    pitch = 1.2; // Slightly higher pitch
  } else if (compLower === 'alex') {
    // Male english
    selectedVoiceObj = voices.find(v => v.lang.startsWith('en') && (
      v.name.toLowerCase().includes('david') || 
      v.name.toLowerCase().includes('male') || 
      v.name.toLowerCase().includes('george') || 
      v.name.toLowerCase().includes('mark') ||
      v.name.toLowerCase().includes('daniel')
    )) || voices.find(v => v.lang.startsWith('en'));
    pitch = 0.85; // Slightly lower pitch
  } else if (compLower === 'maya') {
    // Indian female
    selectedVoiceObj = voices.find(v => v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('veena') || v.name.toLowerCase().includes('heera')) ||
                       voices.find(v => v.lang.startsWith('en'));
    pitch = 1.15;
  } else if (compLower === 'arjun') {
    // Indian male
    selectedVoiceObj = voices.find(v => v.lang.startsWith('en-IN') && v.name.toLowerCase().includes('male')) ||
                       voices.find(v => v.lang.startsWith('en'));
    pitch = 0.85;
  } else if (compLower === 'sophia') {
    // Spanish
    selectedVoiceObj = voices.find(v => v.lang.toLowerCase().startsWith('es')) || 
                       voices.find(v => v.lang.startsWith('en'));
    pitch = 1.05;
  } else if (compLower === 'kenji') {
    // Japanese
    selectedVoiceObj = voices.find(v => v.lang.toLowerCase().startsWith('ja')) || 
                       voices.find(v => v.lang.startsWith('en'));
    pitch = 0.95;
  } else {
    selectedVoiceObj = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Google')) ||
                      voices.find(v => v.lang.startsWith('en')) ||
                      voices[0];
  }

  if (selectedVoiceObj) {
    utterance.voice = selectedVoiceObj;
  }
  
  utterance.rate = 1.0;
  utterance.pitch = pitch;
  
  window.speechSynthesis.speak(utterance);
}

/**
 * Stops all playing speech audio
 */
export function cancelSpeech(): void {
  // Stop Gemini TTS audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Stop browser synthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Simulates a standard screen reader chime / notification sound using browser AudioContext synthesis
 */
export function playChime(type: 'success' | 'alert' | 'scan' | 'click' = 'click'): void {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'scan') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.15);
      osc.frequency.setValueAtTime(659, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.warn("Failed to play synthesis chime:", err);
  }
}
