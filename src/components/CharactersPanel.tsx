import React, { useState } from 'react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Volume2, 
  UserPlus, 
  Sparkles, 
  Check, 
  Sliders, 
  Gauge, 
  Music
} from 'lucide-react';
import { Character } from '../types/story';
import { VOICE_CATALOG, EMOTION_PRESETS, CHARACTER_COLORS } from '../utils/voiceConstants';
import { playLinePreview, stopLinePreview } from '../utils/audioEngine';

interface CharactersPanelProps {
  characters: Character[];
  onUpdateCharacters: (chars: Character[]) => void;
  selectedCharId: string | null;
  onSelectChar: (id: string) => void;
}

const DEFAULT_AVATARS = ['🎙️', '👨‍💼', '👩‍🦰', '🧙‍♂️', '🧚‍♀️', '👴', '👧', '👑', '🤖', '🕵️'];

export const CharactersPanel: React.FC<CharactersPanelProps> = ({
  characters,
  onUpdateCharacters,
  selectedCharId,
  onSelectChar,
}) => {
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [isPlayingDemoVoice, setIsPlayingDemoVoice] = useState<string | null>(null);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  // Play voice sample
  const handlePreviewVoice = async (voiceId: string) => {
    if (isPlayingDemoVoice === voiceId) {
      stopLinePreview();
      setIsPlayingDemoVoice(null);
      return;
    }

    setIsPlayingDemoVoice(voiceId);
    setIsGeneratingDemo(true);

    try {
      const sampleText = `Xin chào! Tôi là giọng đọc ${voiceId}. Tôi rất sẵn lòng đồng hành cùng kịch bản của bạn.`;
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceName: voiceId,
          style: 'Natural and expressive',
        }),
      });

      const data = await res.json();
      setIsGeneratingDemo(false);

      if (data.success && data.audioBase64) {
        await playLinePreview(data.audioBase64, 1.0, 0, () => {
          setIsPlayingDemoVoice(null);
        });
      } else {
        setIsPlayingDemoVoice(null);
        alert(data.error || 'Không thể tạo âm thanh mẫu.');
      }
    } catch (err: any) {
      setIsGeneratingDemo(false);
      setIsPlayingDemoVoice(null);
      alert('Lỗi kết nối khi thử giọng: ' + (err?.message || 'Vui lòng thử lại.'));
    }
  };

  // Add new character
  const handleAddCharacter = () => {
    const newId = `char-${Date.now()}`;
    const nextColor = CHARACTER_COLORS[characters.length % CHARACTER_COLORS.length];
    const newChar: Character = {
      id: newId,
      name: `Nhân vật ${characters.length + 1}`,
      gender: 'male',
      voiceName: 'Puck',
      speed: 1.0,
      pitch: 0,
      emotion: 'Tự nhiên, rõ ràng',
      color: nextColor,
      avatarEmoji: DEFAULT_AVATARS[characters.length % DEFAULT_AVATARS.length],
      roleDescription: 'Nhân vật tham gia câu chuyện',
    };
    onUpdateCharacters([...characters, newChar]);
    setEditingChar(newChar);
  };

  // Save edited character
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChar) return;
    onUpdateCharacters(characters.map(c => c.id === editingChar.id ? editingChar : c));
    setEditingChar(null);
  };

  // Delete character
  const handleDeleteCharacter = (id: string, name: string) => {
    if (characters.length <= 1) {
      alert('Kịch bản cần có ít nhất 1 nhân vật.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân vật "${name}"?`)) {
      onUpdateCharacters(characters.filter(c => c.id !== id));
      if (editingChar?.id === id) setEditingChar(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
      {/* Panel Title */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <UserPlus className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
            Nhân Vật ({characters.length})
          </h2>
        </div>
        <button
          onClick={handleAddCharacter}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm vai</span>
        </button>
      </div>

      {/* Characters List */}
      <div className="space-y-2 overflow-y-auto max-h-[380px] lg:max-h-none pr-1">
        {characters.map((char) => {
          const isSelected = selectedCharId === char.id;
          return (
            <div
              key={char.id}
              onClick={() => onSelectChar(char.id)}
              style={{ borderLeftColor: char.color }}
              className={`p-3 rounded-xl border border-slate-800 border-l-4 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/90 ring-1 ring-indigo-500/50 shadow-md'
                  : 'bg-slate-950/40 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner"
                    style={{ backgroundColor: `${char.color}25` }}
                  >
                    {char.avatarEmoji || '👤'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {char.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-medium text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-1.5 py-0.2 rounded">
                        {char.voiceName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {char.speed}x • {char.pitch > 0 ? `+${char.pitch}` : char.pitch}st
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Delete actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingChar(char)}
                    title="Chỉnh sửa nhân vật (Giọng, Tốc độ, Tông giọng)"
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(char.id, char.name)}
                    title="Xóa nhân vật"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Emotion / Role description */}
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate italic">"{char.emotion}"</span>
                <span className="shrink-0 text-slate-400 text-[10px]">
                  {char.gender === 'female' ? 'Nữ' : 'Nam'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Character Modal */}
      {editingChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Cài Đặt Nhân Vật & Giọng Đọc
                </h3>
              </div>
              <button
                onClick={() => setEditingChar(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Name & Avatar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1.5">
                  <label className="text-slate-300 font-medium">Tên nhân vật:</label>
                  <input
                    type="text"
                    required
                    value={editingChar.name}
                    onChange={(e) => setEditingChar({ ...editingChar, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Ví dụ: Người dẫn chuyện, Minh, Lan..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Biểu tượng:</label>
                  <select
                    value={editingChar.avatarEmoji}
                    onChange={(e) => setEditingChar({ ...editingChar, avatarEmoji: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-lg text-center text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {DEFAULT_AVATARS.map((emoji) => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Voice Catalog Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Chọn giọng đọc AI (Phong cách Vbee):</span>
                  </label>
                  <span className="text-[11px] text-indigo-400 font-mono">
                    Mô hình: Gemini Studio TTS
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {VOICE_CATALOG.map((voice) => {
                    const isSelected = editingChar.voiceName === voice.id;
                    const isPlaying = isPlayingDemoVoice === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() => setEditingChar({ ...editingChar, voiceName: voice.id, gender: voice.gender })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/50'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <p className="font-semibold text-slate-200">{voice.name}</p>
                            <p className="text-[10px] text-slate-400">{voice.region} • {voice.gender === 'female' ? 'Nữ' : 'Nam'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewVoice(voice.id);
                            }}
                            title="Nghe thử giọng mẫu này"
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isPlaying
                                ? 'bg-indigo-600 text-white border-indigo-500 animate-pulse'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600'
                            }`}
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                          {voice.style}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Speed & Pitch Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                {/* Speed Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 font-medium">
                      <Gauge className="w-3 h-3 text-amber-400" /> Tốc độ đọc (Speed):
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {editingChar.speed.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={editingChar.speed}
                    onChange={(e) => setEditingChar({ ...editingChar, speed: parseFloat(e.target.value) })}
                    className="w-full accent-amber-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.5x (Chậm)</span>
                    <span>1.0x (Chuẩn)</span>
                    <span>2.0x (Nhanh)</span>
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 font-medium">
                      <Music className="w-3 h-3 text-emerald-400" /> Tông giọng (Pitch):
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {editingChar.pitch > 0 ? `+${editingChar.pitch}` : editingChar.pitch} st
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={editingChar.pitch}
                    onChange={(e) => setEditingChar({ ...editingChar, pitch: parseInt(e.target.value) })}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>-12 (Trầm)</span>
                    <span>0 (Tự nhiên)</span>
                    <span>+12 (Thanh cao)</span>
                  </div>
                </div>
              </div>

              {/* Emotion / Style & Color Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Cảm xúc / Sắc thái mặc định:</label>
                  <select
                    value={editingChar.emotion}
                    onChange={(e) => setEditingChar({ ...editingChar, emotion: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {EMOTION_PRESETS.map((emo) => (
                      <option key={emo} value={emo}>{emo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium">Màu đại diện:</label>
                  <div className="flex items-center gap-1.5 py-1">
                    {CHARACTER_COLORS.map((col) => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setEditingChar({ ...editingChar, color: col })}
                        style={{ backgroundColor: col }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          editingChar.color === col ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingChar(null)}
                  className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
