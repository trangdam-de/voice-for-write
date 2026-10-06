import { Character, DialogueLine } from '../types/story';
import { calculateTimeline } from './audioEngine';

// Format seconds into SRT timestamp: HH:MM:SS,mmm
export function formatSRTTime(seconds: number): string {
  const totalMs = Math.max(0, Math.floor(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hours = Math.floor(totalMin / 60);

  const pad = (num: number, size: number = 2) => String(num).padStart(size, '0');

  return `${pad(hours)}:${pad(min)}:${pad(sec)},${pad(ms, 3)}`;
}

// Format seconds into VTT timestamp: HH:MM:SS.mmm
export function formatVTTTime(seconds: number): string {
  return formatSRTTime(seconds).replace(',', '.');
}

// Generate SRT subtitle content
export function generateSRTContent(
  lines: DialogueLine[],
  characters: Character[],
  defaultPause: number = 0.6,
  includeCharacterName: boolean = true
): string {
  const { linesWithTimeline } = calculateTimeline(lines, characters, defaultPause);
  const charMap = new Map<string, Character>(characters.map(c => [c.id, c]));

  const srtBlocks: string[] = [];

  linesWithTimeline.forEach((line, index) => {
    if (!line.text.trim()) return;

    const start = formatSRTTime(line.startTime ?? 0);
    const end = formatSRTTime(line.endTime ?? (line.startTime ?? 0) + 2);
    const character = charMap.get(line.characterId);
    const charName = character?.name || 'Nhân vật';

    const textContent = includeCharacterName
      ? `[${charName}] ${line.text.trim()}`
      : line.text.trim();

    srtBlocks.push(`${index + 1}\n${start} --> ${end}\n${textContent}`);
  });

  return srtBlocks.join('\n\n');
}

// Download file utility
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
