import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Sliders, 
  Download, 
  FileText, 
  Music, 
  Sparkles,
  Loader2,
  CheckCircle,
  Radio,
  Clock
} from 'lucide-react';
import { Character, DialogueLine, BackgroundMusic } from '../types/story';
import { 
  calculateTimeline, 
  getAudioContext, 
  base64ToArrayBuffer, 
  renderFullStoryAudio,
  decodeAudioData 
} from '../utils/audioEngine';
import { generateProceduralBGMBuffer } from '../utils/bgmPresets';

interface StudioPlayerDeckProps {
  lines: DialogueLine[];
  characters: Character[];
  bgm: BackgroundMusic;
  defaultPause: number;
  projectTitle: string;
  onOpenSrtModal: () => void;
  onOpenBgmModal: () => void;
}

export const StudioPlayerDeck: React.FC<StudioPlayerDeckProps> = ({
  lines,
  characters,
  bgm,
  defaultPause,
  projectTitle,
  onOpenSrtModal,
  onOpenBgmModal,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);
  const [isExportingAudio, setIsExportingAudio] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const { linesWithTimeline, totalDuration } = calculateTimeline(lines, characters, defaultPause);
  const charMap = new Map<string, Character>(characters.map(c => [c.id, c]));

  // Playback nodes refs
  const playbackTimeoutRef = useRef<number[]>([]);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);
  const startTimeStampRef = useRef<number>(0);
  const playbackTimerRef = useRef<number | null>(null);

  // Stop playback cleanly
  const stopPlayback = () => {
    playbackTimeoutRef.current.forEach(t => clearTimeout(t));
    playbackTimeoutRef.current = [];

    activeSourcesRef.current.forEach(src => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];

    if (bgmSourceRef.current) {
      try {
        bgmSourceRef.current.stop();
        bgmSourceRef.current.disconnect();
      } catch {}
      bgmSourceRef.current = null;
    }

    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    setIsPlaying(false);
    setCurrentLineIndex(null);
  };

  // Start story playback from a specific timestamp
  const startPlayback = async (seekTime: number = 0) => {
    stopPlayback();
    if (totalDuration <= 0) return;

    const ctx = getAudioContext();
    setIsPlaying(true);
    setCurrentTime(seekTime);
    startTimeStampRef.current = Date.now() - (seekTime * 1000);

    // Track playback time
    playbackTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeStampRef.current) / 1000;
      if (elapsed >= totalDuration) {
        stopPlayback();
        setCurrentTime(totalDuration);
      } else {
        setCurrentTime(elapsed);
        // Find which line is active
        const activeIdx = linesWithTimeline.findIndex(
          l => l.startTime !== undefined && l.endTime !== undefined && elapsed >= l.startTime && elapsed < l.endTime
        );
        setCurrentLineIndex(activeIdx !== -1 ? activeIdx : null);
      }
    }, 100);

    // Start BGM if enabled
    if (bgm.enabled && bgm.volume > 0) {
      let bgmBuffer: AudioBuffer | null = null;
      if (bgm.type === 'preset' && bgm.presetKey) {
        bgmBuffer = generateProceduralBGMBuffer(ctx, bgm.presetKey);
      } else if (bgm.type === 'custom' && bgm.audioUrl) {
        try {
          const resp = await fetch(bgm.audioUrl);
          const buf = await resp.arrayBuffer();
          bgmBuffer = await ctx.decodeAudioData(buf);
        } catch {}
      }

      if (bgmBuffer) {
        const bgmSource = ctx.createBufferSource();
        bgmSource.buffer = bgmBuffer;
        bgmSource.loop = true;

        const bgmGain = ctx.createGain();
        bgmGain.gain.value = bgm.volume;

        bgmSource.connect(bgmGain);
        bgmGain.connect(ctx.destination);

        bgmSourceRef.current = bgmSource;
        bgmGainRef.current = bgmGain;

        bgmSource.start(0, seekTime % bgmBuffer.duration);
      }
    }

    // Schedule each dialogue line whose start is in the future relative to seekTime
    for (let i = 0; i < linesWithTimeline.length; i++) {
      const line = linesWithTimeline[i];
      if (!line.audioBase64 || line.startTime === undefined) continue;

      const delaySeconds = line.startTime - seekTime;
      if (delaySeconds >= 0) {
        const timeoutId = window.setTimeout(async () => {
          if (!line.audioBase64) return;
          try {
            const char = charMap.get(line.characterId);
            const speed = line.speedOverride ?? char?.speed ?? 1.0;
            const pitch = line.pitchOverride ?? char?.pitch ?? 0;

            const lineBuffer = await decodeAudioData(line.audioBase64);
            const source = ctx.createBufferSource();
            source.buffer = lineBuffer;
            source.playbackRate.value = speed;
            source.detune.value = pitch * 100;

            // Ducking during line speech
            if (bgm.ducking && bgmGainRef.current) {
              const duckVol = Math.max(0.02, bgm.volume * 0.3);
              bgmGainRef.current.gain.linearRampToValueAtTime(duckVol, ctx.currentTime + 0.1);
            }

            source.onended = () => {
              if (bgm.ducking && bgmGainRef.current) {
                bgmGainRef.current.gain.linearRampToValueAtTime(bgm.volume, ctx.currentTime + 0.3);
              }
            };

            source.connect(ctx.destination);
            activeSourcesRef.current.push(source);
            source.start(0);
          } catch (e) {
            console.error('Line playback error:', e);
          }
        }, delaySeconds * 1000);

        playbackTimeoutRef.current.push(timeoutId);
      }
    }
  };

  // Export full story audio mix as WAV file
  const handleExportFullAudio = async () => {
    // Check if any lines have audio
    const linesWithAudio = lines.filter(l => Boolean(l.audioBase64));
    if (linesWithAudio.length === 0) {
      alert('Chưa có câu thoại nào được tạo giọng đọc. Vui lòng nhấn "Tạo audio tất cả câu" trước khi xuất file.');
      return;
    }

    setIsExportingAudio(true);
    setExportProgress(10);

    try {
      const result = await renderFullStoryAudio(
        lines,
        characters,
        bgm,
        defaultPause,
        (percent) => setExportProgress(percent)
      );

      const url = URL.createObjectURL(result.wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.trim() || 'story-full-audio'}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExportingAudio(false);
      setExportProgress(0);
    } catch (err: any) {
      setIsExportingAudio(false);
      alert('Lỗi xuất file âm thanh: ' + (err?.message || 'Vui lòng thử lại.'));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const formatMmSs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeLine = currentLineIndex !== null ? linesWithTimeline[currentLineIndex] : null;
  const activeChar = activeLine ? charMap.get(activeLine.characterId) : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl shadow-2xl">
      {/* Live Karaoke / Subtitle Preview Banner (when playing) */}
      {isPlaying && activeLine && (
        <div className="bg-indigo-950/90 border-b border-indigo-700/50 px-4 py-2 flex items-center justify-center gap-3 text-xs animate-in slide-in-from-bottom duration-200">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ backgroundColor: `${activeChar?.color || '#6366f1'}40` }}
          >
            {activeChar?.avatarEmoji || '👤'}
          </div>
          <span style={{ color: activeChar?.color }} className="font-bold shrink-0">
            {activeChar?.name}:
          </span>
          <span className="text-slate-100 font-medium truncate max-w-2xl text-sm italic">
            "{activeLine.text}"
          </span>
        </div>
      )}

      {/* Main Deck Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Player Controls & Timeline Seek */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Play/Pause Button */}
          <button
            onClick={() => {
              if (isPlaying) {
                stopPlayback();
              } else {
                startPlayback(currentTime >= totalDuration ? 0 : currentTime);
              }
            }}
            title={isPlaying ? 'Tạm dừng' : 'Phát toàn bộ kịch bản'}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Stop / Reset Button */}
          <button
            onClick={() => {
              stopPlayback();
              setCurrentTime(0);
            }}
            title="Dừng và quay về đầu"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 shrink-0 transition-colors"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Scrubber & Time */}
          <div className="flex-1 md:w-64 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-indigo-400 font-bold">{formatMmSs(currentTime)}</span>
              <span>/</span>
              <span>{formatMmSs(totalDuration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={totalDuration || 1}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const newT = parseFloat(e.target.value);
                setCurrentTime(newT);
                if (isPlaying) {
                  startPlayback(newT);
                }
              }}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Center: BGM Quick Widget */}
        <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Music className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline font-medium">Nhạc nền (BGM):</span>
          </div>

          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            bgm.enabled ? 'bg-violet-950/80 text-violet-300 border border-violet-800/60' : 'bg-slate-800 text-slate-400'
          }`}>
            {bgm.enabled ? `${Math.round(bgm.volume * 100)}%` : 'Tắt'}
          </span>

          <button
            onClick={onOpenBgmModal}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Cài đặt BGM
          </button>
        </div>

        {/* Right: Export Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Export SRT Subtitles */}
          <button
            onClick={onOpenSrtModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>Xuất Phụ Đề (.SRT)</span>
          </button>

          {/* Export Full Audio Mix */}
          <button
            onClick={handleExportFullAudio}
            disabled={isExportingAudio}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-60 transition-all"
          >
            {isExportingAudio ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang render ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Audio (.WAV)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
