export interface Character {
  id: string;
  name: string;
  gender: 'male' | 'female';
  voiceName: string; // 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Aoede'
  speed: number; // 0.5 to 2.0, default 1.0
  pitch: number; // -12 to +12 semitones, default 0
  emotion: string; // e.g. "Truyền cảm", "Hào hứng", "Kịch tính", "Thì thầm"
  color: string; // Hex color code
  avatarEmoji?: string;
  roleDescription?: string;
}

export interface DialogueLine {
  id: string;
  characterId: string;
  text: string;
  speedOverride?: number; // Optional per-line speed override
  pitchOverride?: number; // Optional per-line pitch override
  emotionOverride?: string;
  pauseAfter: number; // Seconds of silence after this line (default 0.6s)
  audioBase64?: string; // Generated WAV audio in base64
  duration?: number; // Audio duration in seconds
  startTime?: number; // Timeline start in seconds
  endTime?: number; // Timeline end in seconds
  isGenerating?: boolean;
}

export interface BackgroundMusic {
  enabled: boolean;
  name: string;
  type: 'preset' | 'custom';
  presetKey?: string;
  audioUrl?: string;
  audioBuffer?: AudioBuffer | null;
  volume: number; // 0.0 to 1.0 (default 0.15 = 15%)
  loop: boolean;
  ducking: boolean; // Auto duck volume while speaking
}

export interface StoryProject {
  id: string;
  title: string;
  description?: string;
  characters: Character[];
  lines: DialogueLine[];
  bgm: BackgroundMusic;
  defaultPause: number; // Default pause between lines in seconds
  createdAt: string;
  updatedAt: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  region: string;
  style: string;
  description: string;
  tags: string[];
}
