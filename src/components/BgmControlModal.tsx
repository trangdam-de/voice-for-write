import React, { useState, useRef } from 'react';
import { 
  Music, 
  Upload, 
  Volume2, 
  Play, 
  Square, 
  VolumeX, 
  Sparkles, 
  Check, 
  Sliders, 
  Info,
  Repeat
} from 'lucide-react';
import { BackgroundMusic } from '../types/story';
import { BGM_PRESETS } from '../utils/bgmPresets';
import { getAudioContext } from '../utils/audioEngine';
import { generateProceduralBGMBuffer } from '../utils/bgmPresets';

interface BgmControlModalProps {
  bgm: BackgroundMusic;
  onUpdateBgm: (newBgm: BackgroundMusic) => void;
  onClose: () => void;
}

export const BgmControlModal: React.FC<BgmControlModalProps> = ({
  bgm,
  onUpdateBgm,
  onClose,
}) => {
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio source ref for live previewing BGM
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewGainRef = useRef<GainNode | null>(null);

  // Stop test playback
  const stopTestBgm = () => {
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
        previewSourceRef.current.disconnect();
      } catch {}
      previewSourceRef.current = null;
    }
    setIsPlayingTest(false);
  };

  // Start test playback
  const startTestBgm = async (targetPresetKey?: string, targetCustomUrl?: string) => {
    stopTestBgm();
    const ctx = getAudioContext();
    const key = targetPresetKey || bgm.presetKey || 'emotional';

    let buffer: AudioBuffer | null = null;
    if (bgm.type === 'custom' && (targetCustomUrl || bgm.audioUrl)) {
      try {
        const resp = await fetch(targetCustomUrl || bgm.audioUrl!);
        const arrBuf = await resp.arrayBuffer();
        buffer = await ctx.decodeAudioData(arrBuf);
      } catch (e) {
        alert('Không thể phát file nhạc tùy chỉnh.');
        return;
      }
    } else {
      buffer = generateProceduralBGMBuffer(ctx, key);
    }

    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = bgm.volume;

    source.connect(gain);
    gain.connect(ctx.destination);

    previewSourceRef.current = source;
    previewGainRef.current = gain;

    source.start(0);
    setIsPlayingTest(true);
  };

  // Handle volume slider change
  const handleVolumeChange = (newVol: number) => {
    onUpdateBgm({ ...bgm, volume: newVol });
    if (previewGainRef.current) {
      previewGainRef.current.gain.value = newVol;
    }
  };

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onUpdateBgm({
      ...bgm,
      enabled: true,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: 'custom',
      audioUrl: url,
    });

    if (isPlayingTest) {
      startTestBgm(undefined, url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Cài Đặt Nhạc Nền (Background Music)
              </h3>
              <p className="text-xs text-slate-400">
                Trộn nhạc nền nhẹ nhàng dưới giọng đọc để tăng cảm xúc cho câu chuyện
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopTestBgm();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Main Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${bgm.enabled ? 'bg-indigo-600/30 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                {bgm.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-slate-100 text-sm">Bật nhạc nền cho truyện</p>
                <p className="text-slate-400 text-xs">Tự động mix vào bản thu âm hoàn chỉnh</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={bgm.enabled}
                onChange={(e) => onUpdateBgm({ ...bgm, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Volume Slider & Quick Presets */}
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                Âm lượng nhạc nền (Khuyên dùng: 10% - 20%):
              </span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {Math.round(bgm.volume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0.0"
              max="0.8"
              step="0.01"
              value={bgm.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            {/* Quick volume buttons */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
              {[0.10, 0.15, 0.20, 0.30].map((vol) => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => handleVolumeChange(vol)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    Math.abs(bgm.volume - vol) < 0.01
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {Math.round(vol * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Ducking & Loop Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-200">Auto-Ducking</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tự động nhỏ nhạc nền khi nhân vật nói, to lên ở đoạn ngắt câu.
                </p>
              </div>
              <input
                type="checkbox"
                checked={bgm.ducking}
                onChange={(e) => onUpdateBgm({ ...bgm, ducking: e.target.checked })}
                className="mt-1 accent-indigo-500 h-4 w-4 rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-200">Lặp lại nhạc (Loop)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tự động phát lại liên tục cho đến khi hết câu chuyện.
                </p>
              </div>
              <input
                type="checkbox"
                checked={bgm.loop}
                onChange={(e) => onUpdateBgm({ ...bgm, loop: e.target.checked })}
                className="mt-1 accent-indigo-500 h-4 w-4 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Source Selection: Presets vs Custom Upload */}
          <div className="space-y-3">
            <label className="font-bold text-slate-200 block text-xs uppercase tracking-wider">
              Chọn Thư Viện Nhạc Nền:
            </label>

            {/* Preset Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BGM_PRESETS.map((preset) => {
                const isSelected = bgm.type === 'preset' && bgm.presetKey === preset.key;
                return (
                  <div
                    key={preset.key}
                    onClick={() => {
                      onUpdateBgm({
                        ...bgm,
                        enabled: true,
                        name: preset.name,
                        type: 'preset',
                        presetKey: preset.key,
                      });
                      if (isPlayingTest) {
                        startTestBgm(preset.key);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500/50'
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{preset.icon}</span>
                        <div>
                          <p className="font-semibold text-slate-200 text-xs">{preset.name}</p>
                          <p className="text-[10px] text-indigo-400">{preset.genre}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="p-1 rounded-full bg-indigo-500 text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Custom Audio File Upload */}
            <div className="mt-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="audio/*"
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  bgm.type === 'custom' 
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200' 
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs">
                      {bgm.type === 'custom' ? `Đã chọn: ${bgm.name}` : 'Tải lên file nhạc từ máy tính (.mp3, .wav...)'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Hỗ trợ MP3, WAV, AAC, M4A không giới hạn dung lượng
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 shrink-0"
                >
                  Chọn file
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Live Test Playback */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            type="button"
            onClick={() => {
              if (isPlayingTest) {
                stopTestBgm();
              } else {
                startTestBgm();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isPlayingTest
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isPlayingTest ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Dừng nghe thử BGM</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Nghe thử BGM tại âm lượng {Math.round(bgm.volume * 100)}%</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              stopTestBgm();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
