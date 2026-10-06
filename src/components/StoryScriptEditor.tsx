import React, { useState } from 'react';
import { 
  Plus, 
  Sparkles, 
  Volume2, 
  RotateCcw, 
  MessageSquarePlus, 
  CheckCircle, 
  Loader2, 
  FileText
} from 'lucide-react';
import { Character, DialogueLine } from '../types/story';
import { DialogueLineCard } from './DialogueLineCard';

interface StoryScriptEditorProps {
  lines: DialogueLine[];
  characters: Character[];
  onUpdateLines: (newLines: DialogueLine[]) => void;
  onOpenAiModal: () => void;
  defaultPause: number;
}

export const StoryScriptEditor: React.FC<StoryScriptEditorProps> = ({
  lines,
  characters,
  onUpdateLines,
  onOpenAiModal,
  defaultPause,
}) => {
  const [playingPreviewLineId, setPlayingPreviewLineId] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Add line
  const handleAddLine = (afterIndex?: number) => {
    const newLineId = `line-${Date.now()}`;
    const defaultCharId = characters[0]?.id || 'char-1';
    const newLine: DialogueLine = {
      id: newLineId,
      characterId: defaultCharId,
      text: '',
      pauseAfter: defaultPause,
    };

    if (afterIndex !== undefined) {
      const updated = [...lines];
      updated.splice(afterIndex + 1, 0, newLine);
      onUpdateLines(updated);
    } else {
      onUpdateLines([...lines, newLine]);
    }
  };

  // Move line up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...lines];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onUpdateLines(updated);
  };

  // Move line down
  const handleMoveDown = (index: number) => {
    if (index === lines.length - 1) return;
    const updated = [...lines];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onUpdateLines(updated);
  };

  // Duplicate line
  const handleDuplicate = (index: number) => {
    const target = lines[index];
    const duplicated: DialogueLine = {
      ...target,
      id: `line-${Date.now()}`,
      audioBase64: target.audioBase64,
    };
    const updated = [...lines];
    updated.splice(index + 1, 0, duplicated);
    onUpdateLines(updated);
  };

  // Delete line
  const handleDelete = (index: number) => {
    if (lines.length <= 1) {
      alert('Kịch bản cần có ít nhất 1 câu thoại.');
      return;
    }
    const updated = lines.filter((_, idx) => idx !== index);
    onUpdateLines(updated);
  };

  // Batch generate audio for all un-generated lines
  const handleBatchGenerate = async () => {
    const ungeneratedIndices = lines
      .map((l, idx) => (!l.audioBase64 && l.text.trim() ? idx : -1))
      .filter(idx => idx !== -1);

    if (ungeneratedIndices.length === 0) {
      alert('Tất cả các câu thoại đều đã có file audio!');
      return;
    }

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: ungeneratedIndices.length });

    const updatedLines = [...lines];
    const charMap = new Map<string, Character>(characters.map(c => [c.id, c]));

    for (let i = 0; i < ungeneratedIndices.length; i++) {
      const lineIdx = ungeneratedIndices[i];
      const line = updatedLines[lineIdx];
      const char = charMap.get(line.characterId) || characters[0];
      const speed = line.speedOverride ?? char?.speed ?? 1.0;
      const emotion = line.emotionOverride || char?.emotion || 'Tự nhiên, rõ ràng';

      setBatchProgress({ current: i + 1, total: ungeneratedIndices.length });

      try {
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: line.text.trim(),
            voiceName: char?.voiceName || 'Kore',
            style: emotion,
            speed,
          }),
        });
        const data = await res.json();
        if (data.success && data.audioBase64) {
          const estimatedDuration = Math.max(0.8, line.text.trim().split(/\s+/).length * 0.35);
          updatedLines[lineIdx] = {
            ...line,
            audioBase64: data.audioBase64,
            duration: estimatedDuration,
          };
          onUpdateLines([...updatedLines]);
        }
      } catch (err) {
        console.error('Batch generation error on line', lineIdx, err);
      }
    }

    setIsBatchGenerating(false);
    setBatchProgress(null);
  };

  // Reset audio cache
  const handleClearAllAudio = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ bộ nhớ đệm âm thanh của các câu thoại? Bạn sẽ cần tạo lại.')) {
      onUpdateLines(lines.map(l => ({ ...l, audioBase64: undefined, duration: undefined })));
    }
  };

  const totalGeneratedCount = lines.filter(l => Boolean(l.audioBase64)).length;

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Kịch Bản Hội Thoại ({lines.length} câu)
            </h2>
            <p className="text-xs text-slate-400">
              Đã tạo giọng đọc: <strong className="text-emerald-400">{totalGeneratedCount}/{lines.length}</strong> câu
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Script Assistant */}
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Phân tích kịch bản bằng AI</span>
          </button>

          {/* Batch Generate Audio */}
          <button
            onClick={handleBatchGenerate}
            disabled={isBatchGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-60 transition-all"
          >
            {isBatchGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tạo ({batchProgress?.current}/{batchProgress?.total})...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tạo audio tất cả câu</span>
              </>
            )}
          </button>

          {/* Clear Cache */}
          {totalGeneratedCount > 0 && (
            <button
              onClick={handleClearAllAudio}
              title="Xóa cache âm thanh đã tạo để tạo mới"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add Line button */}
          <button
            onClick={() => handleAddLine()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm câu thoại</span>
          </button>
        </div>
      </div>

      {/* Batch Progress Banner if generating */}
      {isBatchGenerating && batchProgress && (
        <div className="bg-indigo-950/80 border border-indigo-700/60 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-xs text-indigo-200 font-medium mb-1.5">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Đang tạo giọng đọc tự động theo từng câu...
            </span>
            <span className="font-mono">{batchProgress.current} / {batchProgress.total}</span>
          </div>
          <div className="w-full bg-indigo-900/60 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Dialogue Lines List */}
      <div className="space-y-3">
        {lines.map((line, index) => (
          <DialogueLineCard
            key={line.id}
            line={line}
            index={index}
            totalLines={lines.length}
            characters={characters}
            onUpdateLine={(updated) => {
              const newLines = [...lines];
              newLines[index] = updated;
              onUpdateLines(newLines);
            }}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onDuplicate={() => handleDuplicate(index)}
            onDelete={() => handleDelete(index)}
            isPlayingPreview={playingPreviewLineId === line.id}
            onSetPlayingPreview={(id) => setPlayingPreviewLineId(id)}
          />
        ))}
      </div>

      {/* Bottom Add Line Button */}
      <div className="pt-2">
        <button
          onClick={() => handleAddLine()}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/40 hover:bg-slate-800/40 text-slate-300 hover:text-indigo-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all group"
        >
          <MessageSquarePlus className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>+ Thêm câu thoại tiếp theo</span>
        </button>
      </div>
    </div>
  );
};
