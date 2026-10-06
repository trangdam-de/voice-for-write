import { Character, DialogueLine, BackgroundMusic } from '../types/story';
import { generateProceduralBGMBuffer } from './bgmPresets';

let globalAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    globalAudioCtx = new AudioContextClass();
  }
  if (globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
}

// Convert base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Decode base64 WAV into AudioBuffer and get duration
export async function decodeAudioData(base64: string): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = base64ToArrayBuffer(base64);
  return await ctx.decodeAudioData(arrayBuffer);
}

// Play a single line preview with custom speed and pitch
let currentPreviewSource: AudioBufferSourceNode | null = null;

export async function playLinePreview(
  audioBase64: string,
  speed: number = 1.0,
  pitchSemitones: number = 0,
  onEnded?: () => void
): Promise<() => void> {
  stopLinePreview();

  const ctx = getAudioContext();
  const audioBuffer = await decodeAudioData(audioBase64);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = Math.max(0.2, Math.min(3.0, speed));
  // detune is measured in cents (1 semitone = 100 cents)
  source.detune.value = pitchSemitones * 100;

  source.connect(ctx.destination);
  currentPreviewSource = source;

  source.onended = () => {
    if (currentPreviewSource === source) {
      currentPreviewSource = null;
    }
    if (onEnded) onEnded();
  };

  source.start(0);

  return () => {
    stopLinePreview();
  };
}

export function stopLinePreview() {
  if (currentPreviewSource) {
    try {
      currentPreviewSource.stop();
      currentPreviewSource.disconnect();
    } catch {
      // Ignore if already stopped
    }
    currentPreviewSource = null;
  }
}

// Recalculate timeline for all lines in the story
export function calculateTimeline(
  lines: DialogueLine[],
  characters: Character[],
  defaultPause: number = 0.6
): { linesWithTimeline: DialogueLine[]; totalDuration: number } {
  let currentTime = 0;
  const charMap = new Map<string, Character>(characters.map(c => [c.id, c]));

  const linesWithTimeline = lines.map(line => {
    const character = charMap.get(line.characterId);
    const speed = line.speedOverride ?? character?.speed ?? 1.0;
    const pause = line.pauseAfter ?? defaultPause;

    // Estimate duration if audio is not yet generated: ~0.085s per character of Vietnamese text
    let duration = line.duration;
    if (!duration || duration <= 0) {
      const estimatedWords = line.text.trim().split(/\s+/).length;
      duration = Math.max(1.2, (estimatedWords * 0.35));
    }

    const effectiveDuration = duration / Math.max(0.2, speed);
    const startTime = currentTime;
    const endTime = startTime + effectiveDuration;
    currentTime = endTime + pause;

    return {
      ...line,
      startTime: Number(startTime.toFixed(3)),
      endTime: Number(endTime.toFixed(3)),
      effectiveDuration: Number(effectiveDuration.toFixed(3)),
    };
  });

  return {
    linesWithTimeline,
    totalDuration: currentTime > 0 ? Number(currentTime.toFixed(3)) : 0,
  };
}

// Convert AudioBuffer to 16-bit PCM WAV Blob
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // audio format (1 is PCM)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

// Render complete story audio mix (dialogue + BGM) using OfflineAudioContext
export async function renderFullStoryAudio(
  lines: DialogueLine[],
  characters: Character[],
  bgm: BackgroundMusic,
  defaultPause: number = 0.6,
  onProgress?: (percent: number) => void
): Promise<{ wavBlob: Blob; totalDuration: number }> {
  const { linesWithTimeline, totalDuration } = calculateTimeline(lines, characters, defaultPause);

  if (totalDuration <= 0) {
    throw new Error('Không có nội dung câu thoại nào để xuất âm thanh.');
  }

  const sampleRate = 44100;
  const totalFrames = Math.ceil(totalDuration * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
  const charMap = new Map<string, Character>(characters.map(c => [c.id, c]));

  // Decode and schedule each line
  for (let i = 0; i < linesWithTimeline.length; i++) {
    const line = linesWithTimeline[i];
    const character = charMap.get(line.characterId);
    const speed = line.speedOverride ?? character?.speed ?? 1.0;
    const pitch = line.pitchOverride ?? character?.pitch ?? 0;

    if (line.audioBase64 && line.startTime !== undefined) {
      const lineArrayBuffer = base64ToArrayBuffer(line.audioBase64);
      const lineBuffer = await offlineCtx.decodeAudioData(lineArrayBuffer);

      const source = offlineCtx.createBufferSource();
      source.buffer = lineBuffer;
      source.playbackRate.value = Math.max(0.2, Math.min(3.0, speed));
      source.detune.value = pitch * 100;

      // Master line gain node
      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = 1.0;

      source.connect(gainNode);
      gainNode.connect(offlineCtx.destination);

      source.start(line.startTime);
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / (linesWithTimeline.length + 1)) * 50));
    }
  }

  // Handle Background Music (BGM)
  if (bgm.enabled && bgm.volume > 0) {
    let bgmBuffer: AudioBuffer | null = null;

    if (bgm.type === 'preset' && bgm.presetKey) {
      bgmBuffer = generateProceduralBGMBuffer(offlineCtx, bgm.presetKey);
    } else if (bgm.type === 'custom' && bgm.audioUrl) {
      try {
        const response = await fetch(bgm.audioUrl);
        const arrayBuf = await response.arrayBuffer();
        bgmBuffer = await offlineCtx.decodeAudioData(arrayBuf);
      } catch (err) {
        console.warn('Could not load custom BGM for rendering:', err);
      }
    }

    if (bgmBuffer) {
      const bgmSource = offlineCtx.createBufferSource();
      bgmSource.buffer = bgmBuffer;
      bgmSource.loop = true;

      const bgmGain = offlineCtx.createGain();
      const baseVolume = bgm.volume;
      bgmGain.gain.setValueAtTime(baseVolume, 0);

      // Ducking: lower BGM during spoken dialogue
      if (bgm.ducking) {
        linesWithTimeline.forEach(line => {
          if (line.startTime !== undefined && line.endTime !== undefined) {
            const duckVolume = Math.max(0.02, baseVolume * 0.3);
            bgmGain.gain.setValueAtTime(baseVolume, Math.max(0, line.startTime - 0.2));
            bgmGain.gain.linearRampToValueAtTime(duckVolume, line.startTime);
            bgmGain.gain.setValueAtTime(duckVolume, line.endTime);
            bgmGain.gain.linearRampToValueAtTime(baseVolume, line.endTime + 0.3);
          }
        });
      }

      bgmSource.connect(bgmGain);
      bgmGain.connect(offlineCtx.destination);
      bgmSource.start(0);
    }
  }

  if (onProgress) onProgress(75);

  const renderedBuffer = await offlineCtx.startRendering();
  if (onProgress) onProgress(90);

  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  if (onProgress) onProgress(100);

  return { wavBlob, totalDuration };
}
