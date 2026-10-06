import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  SlidersHorizontal, 
  Clock, 
  Volume2, 
  CheckCircle2, 
  AlertCircle,
  Gauge,
  Music
} from 'lucide-react';
import { Character, DialogueLine } from '../types/story';
import { EMOTION_PRESETS } from '../utils/voiceConstants';
import { playLinePreview, stopLinePreview } from '../utils/audioEngine';

interface DialogueLineCardProps {
  line: DialogueLine;
  index: number;
  totalLines: number;
  characters: Character[];
  onUpdateLine: (updated: DialogueLine) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isPlayingPreview: boolean;
  onSetPlayingPreview: (lineId: string | null) => void;
}

export const DialogueLineCard: React.FC<DialogueLineCardProps> = ({
  line,
  index,
  totalLines,
  characters,
  onUpdateLine,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  isPlayingPreview,
  onSetPlayingPreview,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const character = characters.find(c => c.id === line.characterId) || characters[0];
  const effectiveSpeed = line.speedOverride ?? character?.speed ?? 1.0;
  const effectivePitch = line.pitchOverride ?? character?.pitch ?? 0;
  const effectiveEmotion = line.emotionOverride || character?.emotion || 'Tự nhiên, rõ ràng';

  // Generate audio for this line
  const handleGenerateAudio = async (): Promise<string | null> => {
    if (!line.text.trim()) {
      alert('Vui lòng nhập lời thoại trước khi tạo giọng đọc.');
      return null;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: line.text.trim(),
          voiceName: character?.voiceName || 'Kore',
          style: effectiveEmotion,
          speed: effectiveSpeed,
        }),
      });

      const data = await res.json();
      setIsGenerating(false);

      if (data.success && data.audioBase64) {
        // Measure duration by decoding
        const estimatedDuration = Math.max(0.8, line.text.trim().split(/\s+/).length * 0.35);
        onUpdateLine({
          ...line,
          audioBase64: data.audioBase64,
          duration: estimatedDuration,
        });
        return data.audioBase64;
      } else {
        alert(data.error || 'Không thể tạo âm thanh cho câu này.');
        return null;
      }
    } catch (err: any) {
      setIsGenerating(false);
      alert('Lỗi tạo giọng đọc: ' + (err?.message || 'Vui lòng thử lại.'));
      return null;
    }
  };

  // Preview this line: if audio is cached, play directly; if not, generate first!
  const handlePreview = async () => {
    if (isPlayingPreview) {
      stopLinePreview();
      onSetPlayingPreview(null);
      return;
    }

    let audioData = line.audioBase64;
    if (!audioData) {
      audioData = await handleGenerateAudio() ?? undefined;
    }

    if (audioData) {
      onSetPlayingPreview(line.id);
      await playLinePreview(
        audioData,
        effectiveSpeed,
        effectivePitch,
        () => {
          onSetPlayingPreview(null);
        }
      );
    }
  };

  return (
    <div 
      style={{ borderLeftColor: character?.color || '#6366f1' }}
      className={`bg-slate-900/90 border border-slate-800 border-l-4 rounded-2xl p-4 transition-all shadow-md hover:shadow-lg ${
        isPlayingPreview ? 'ring-2 ring-indigo-500/80 bg-slate-800/80' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        {/* Character Selector & Speaker Badge */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg">
            #{index + 1}
          </span>

          <div className="relative">
            <select
              value={line.characterId}
              onChange={(e) => {
                const newCharId = e.target.value;
                onUpdateLine({
                  ...line,
                  characterId: newCharId,
                  // Invalidate audio cache if character voice changes
                  audioBase64: undefined,
                  duration: undefined,
                });
              }}
              style={{ color: character?.color }}
              className="bg-slate-800/90 border border-slate-700 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.avatarEmoji || '👤'} {c.name} ({c.voiceName})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Quick Voice & Emotion tags */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono">
              {character?.voiceName}
            </span>
            <span>•</span>
            <span className="italic truncate max-w-[140px] text-slate-400">
              {effectiveEmotion}
            </span>
          </div>
        </div>

        {/* Audio Status & Preview Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Cache Indicator */}
          {line.audioBase64 ? (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Đã có audio</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-amber-400/80 bg-amber-950/30 border border-amber-800/30 px-2 py-1 rounded-lg">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>Chưa tạo voice</span>
            </div>
          )}

          {/* Preview Button */}
          <button
            onClick={handlePreview}
            disabled={isGenerating}
            title={isPlayingPreview ? 'Dừng phát' : 'Nghe thử câu thoại này (Preview)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isPlayingPreview
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isPlayingPreview ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Dừng</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isGenerating ? 'Đang tạo...' : 'Nghe thử'}</span>
              </>
            )}
          </button>

          {/* Re-generate Button */}
          <button
            onClick={handleGenerateAudio}
            disabled={isGenerating}
            title="Tạo lại âm thanh AI cho câu này"
            className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Tinh chỉnh tốc độ, cao độ và khoảng nghỉ riêng cho câu này"
            className={`p-1.5 rounded-xl border transition-colors ${
              showSettings 
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dialogue Text Input */}
      <div className="mt-3">
        <textarea
          rows={2}
          value={line.text}
          onChange={(e) => {
            onUpdateLine({
              ...line,
              text: e.target.value,
              // Invalidate audio cache on text change
              audioBase64: undefined,
              duration: undefined,
            });
          }}
          placeholder="Nhập lời thoại của nhân vật..."
          className="w-full bg-slate-950/60 hover:bg-slate-950/80 focus:bg-slate-950 text-slate-100 text-sm rounded-xl p-3 border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all resize-y leading-relaxed"
        />
      </div>

      {/* Expandable Per-Line Settings (Speed, Pitch, Emotion, Pause) */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-medium pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Tinh chỉnh riêng cho câu này (Ghi đè mặc định của nhân vật)
            </span>
            <button
              onClick={() => {
                onUpdateLine({
                  ...line,
                  speedOverride: undefined,
                  pitchOverride: undefined,
                  emotionOverride: undefined,
                });
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Khôi phục mặc định
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Speed Override */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" /> Tốc độ:
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {effectiveSpeed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={effectiveSpeed}
                onChange={(e) => {
                  onUpdateLine({
                    ...line,
                    speedOverride: parseFloat(e.target.value),
                  });
                }}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Pitch Override */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <Music className="w-3 h-3 text-emerald-400" /> Tông giọng:
                </span>
                <span className="font-mono text-emerald-300 font-bold">
                  {effectivePitch > 0 ? `+${effectivePitch}` : effectivePitch} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={effectivePitch}
                onChange={(e) => {
                  onUpdateLine({
                    ...line,
                    pitchOverride: parseInt(e.target.value),
                  });
                }}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Pause After Line */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" /> Nghỉ sau câu:
                </span>
                <span className="font-mono text-sky-300 font-bold">
                  {(line.pauseAfter ?? 0.6).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={line.pauseAfter ?? 0.6}
                onChange={(e) => {
                  onUpdateLine({
                    ...line,
                    pauseAfter: parseFloat(e.target.value),
                  });
                }}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Emotion Override */}
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Cảm xúc riêng cho câu này:</label>
            <select
              value={line.emotionOverride || ''}
              onChange={(e) => {
                onUpdateLine({
                  ...line,
                  emotionOverride: e.target.value || undefined,
                  audioBase64: undefined,
                });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Theo nhân vật ({character?.emotion})</option>
              {EMOTION_PRESETS.map((emo) => (
                <option key={emo} value={emo}>{emo}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Bottom Re-order & Action Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {line.startTime !== undefined && (
            <span className="font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded text-indigo-300">
              Timeline: {line.startTime}s ➔ {line.endTime}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="Di chuyển lên trên"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalLines - 1}
            title="Di chuyển xuống dưới"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            title="Nhân bản câu này"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Xóa câu này"
            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
