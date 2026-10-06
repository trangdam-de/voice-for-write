import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Clock, 
  Youtube, 
  Settings2,
  Sparkles
} from 'lucide-react';
import { Character, DialogueLine } from '../types/story';
import { generateSRTContent, downloadFile, formatSRTTime } from '../utils/srtExport';
import { calculateTimeline } from '../utils/audioEngine';

interface SrtExportModalProps {
  lines: DialogueLine[];
  characters: Character[];
  defaultPause: number;
  projectTitle: string;
  onClose: () => void;
}

export const SrtExportModal: React.FC<SrtExportModalProps> = ({
  lines,
  characters,
  defaultPause,
  projectTitle,
  onClose,
}) => {
  const [includeCharacterName, setIncludeCharacterName] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'timeline'>('timeline');

  const { linesWithTimeline, totalDuration } = calculateTimeline(lines, characters, defaultPause);
  const srtText = generateSRTContent(lines, characters, defaultPause, includeCharacterName);
  const charMap = new Map<string, Character>(characters.map(c => [c.id, c]));

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(srtText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download SRT file
  const handleDownloadSRT = () => {
    const filename = `${projectTitle.trim() || 'story-subtitles'}.srt`;
    downloadFile(srtText, filename, 'text/plain');
  };

  // Download VTT file
  const handleDownloadVTT = () => {
    const vttContent = `WEBVTT\n\n${srtText.replace(/,/g, '.')}`;
    const filename = `${projectTitle.trim() || 'story-subtitles'}.vtt`;
    downloadFile(vttContent, filename, 'text/vtt');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <span>Xuất Phụ Đề SRT Chuẩn YouTube</span>
                <span className="text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Timeline chính xác
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Phụ đề đồng bộ từng mili-giây khớp hoàn toàn với file âm thanh xuất ra
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Danh sách Timeline ({linesWithTimeline.length})
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mã nguồn SRT thô
            </button>
          </div>

          {/* Toggle Speaker Tag */}
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeCharacterName}
              onChange={(e) => setIncludeCharacterName(e.target.checked)}
              className="accent-indigo-500 rounded h-4 w-4"
            />
            <span>Kèm tên nhân vật: <strong className="text-indigo-400">[Tên] Lời thoại</strong></span>
          </label>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'timeline' ? (
            <div className="space-y-2.5">
              {linesWithTimeline.map((line, idx) => {
                const char = charMap.get(line.characterId);
                const startTimeStr = formatSRTTime(line.startTime ?? 0);
                const endTimeStr = formatSRTTime(line.endTime ?? 0);

                return (
                  <div
                    key={line.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="text-slate-400 font-mono text-[11px] font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: `${char?.color || '#6366f1'}30` }}
                      >
                        {char?.avatarEmoji || '👤'}
                      </div>
                      <div className="min-w-0">
                        {includeCharacterName && (
                          <span
                            style={{ color: char?.color }}
                            className="font-bold text-[11px] mr-1.5"
                          >
                            [{char?.name || 'Nhân vật'}]
                          </span>
                        )}
                        <span className="text-slate-200 text-xs">
                          {line.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-emerald-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{startTimeStr}</span>
                      <span className="text-slate-400">➔</span>
                      <span>{endTimeStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative">
              <textarea
                readOnly
                rows={16}
                value={srtText}
                className="w-full bg-slate-950 font-mono text-xs text-indigo-300 p-4 rounded-2xl border border-slate-800 focus:outline-none select-all leading-relaxed resize-none"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép SRT</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadVTT}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
            >
              Tải .VTT (Web)
            </button>
          </div>

          <button
            onClick={handleDownloadSRT}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Tải Tệp Phụ Đề (.SRT) Cho YouTube</span>
          </button>
        </div>
      </div>
    </div>
  );
};
