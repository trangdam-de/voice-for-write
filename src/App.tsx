/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StoryProject, Character, DialogueLine, BackgroundMusic } from './types/story';
import { SAMPLE_PROJECTS } from './utils/sampleProjects';
import { calculateTimeline } from './utils/audioEngine';
import { Header } from './components/Header';
import { CharactersPanel } from './components/CharactersPanel';
import { StoryScriptEditor } from './components/StoryScriptEditor';
import { BgmControlModal } from './components/BgmControlModal';
import { SrtExportModal } from './components/SrtExportModal';
import { AiScriptModal } from './components/AiScriptModal';
import { StudioPlayerDeck } from './components/StudioPlayerDeck';
import { 
  Sliders, 
  HelpCircle, 
  Sparkles, 
  Youtube, 
  Music, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

const STORAGE_KEY = 'v_story_tts_saved_project_v1';

export default function App() {
  // Initialize project from LocalStorage or default sample
  const [project, setProject] = useState<StoryProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.characters && Array.isArray(parsed.lines)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not restore saved project from localStorage:', e);
    }
    return SAMPLE_PROJECTS[0];
  });

  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [isSrtModalOpen, setIsSrtModalOpen] = useState(false);
  const [isBgmModalOpen, setIsBgmModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Auto-save to LocalStorage periodically or on key changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }, [project]);

  // Manual save trigger
  const handleManualSave = () => {
    setIsSavingDraft(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setTimeout(() => {
        setIsSavingDraft(false);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 2500);
      }, 300);
    } catch {
      setIsSavingDraft(false);
    }
  };

  // Timeline calculation
  const { totalDuration } = calculateTimeline(
    project.lines,
    project.characters,
    project.defaultPause
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-32 selection:bg-indigo-500 selection:text-white">
      {/* Top Studio Header */}
      <Header
        project={project}
        setProject={setProject}
        totalDuration={totalDuration}
        onSaveDraft={handleManualSave}
        isSaving={isSavingDraft}
      />

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã lưu bản nháp thành công vào trình duyệt!</span>
        </div>
      )}

      {/* Main Studio Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full flex-1">
        {/* Banner introduction & Feature highlights */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <span>Studio Hội Thoại & Kể Chuyện AI</span>
              <span className="text-[11px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                Vbee-Style TTS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Phân vai nhiều nhân vật • Chỉnh tốc độ & tông giọng riêng từng câu • Trộn nhạc nền BGM • Xuất phụ đề SRT chuẩn YouTube
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/40 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Biên kịch AI</span>
            </button>
            <button
              onClick={() => setIsBgmModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Music className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mix Nhạc Nền ({Math.round(project.bgm.volume * 100)}%)</span>
            </button>
            <button
              onClick={() => setIsSrtModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/50 text-red-300 border border-red-800/60 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              <span>Xem Timeline SRT</span>
            </button>
          </div>
        </div>

        {/* Studio Grid: Left Sidebar (Characters) + Right Main (Script & Dialogue lines) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Characters Panel & Project Settings (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <CharactersPanel
              characters={project.characters}
              onUpdateCharacters={(chars) => setProject(prev => ({ ...prev, characters: chars }))}
              selectedCharId={selectedCharId}
              onSelectChar={(id) => setSelectedCharId(id)}
            />

            {/* Quick Timing & Global Story Settings */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wide pb-2 border-b border-slate-800">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Cài Đặt Nhịp Điệu Kịch Bản</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-medium">Khoảng nghỉ mặc định giữa các câu:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {project.defaultPause.toFixed(1)} giây
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={project.defaultPause}
                  onChange={(e) => setProject(prev => ({ ...prev, defaultPause: parseFloat(e.target.value) }))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Thời gian im lặng (ngắt nghỉ) tự nhiên giữa 2 câu nói liên tiếp.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Chuẩn RIFF WAV 44.1kHz 16-bit
                </span>
                <span className="text-indigo-400">Tự động lưu nháp</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dialogue Script Workspace (8 cols on lg) */}
          <div className="lg:col-span-8">
            <StoryScriptEditor
              lines={project.lines}
              characters={project.characters}
              onUpdateLines={(newLines) => setProject(prev => ({ ...prev, lines: newLines }))}
              onOpenAiModal={() => setIsAiModalOpen(true)}
              defaultPause={project.defaultPause}
            />
          </div>
        </div>
      </main>

      {/* Bottom Fixed Workstation Deck */}
      <StudioPlayerDeck
        lines={project.lines}
        characters={project.characters}
        bgm={project.bgm}
        defaultPause={project.defaultPause}
        projectTitle={project.title}
        onOpenSrtModal={() => setIsSrtModalOpen(true)}
        onOpenBgmModal={() => setIsBgmModalOpen(true)}
      />

      {/* Modal: BGM Mixer Settings */}
      {isBgmModalOpen && (
        <BgmControlModal
          bgm={project.bgm}
          onUpdateBgm={(newBgm) => setProject(prev => ({ ...prev, bgm: newBgm }))}
          onClose={() => setIsBgmModalOpen(false)}
        />
      )}

      {/* Modal: SRT YouTube Subtitles Export */}
      {isSrtModalOpen && (
        <SrtExportModal
          lines={project.lines}
          characters={project.characters}
          defaultPause={project.defaultPause}
          projectTitle={project.title}
          onClose={() => setIsSrtModalOpen(false)}
        />
      )}

      {/* Modal: AI Screenplay Assistant */}
      {isAiModalOpen && (
        <AiScriptModal
          onApplyScript={({ characters, lines, title }) => {
            setProject(prev => ({
              ...prev,
              title: title || prev.title,
              characters: characters.length > 0 ? characters : prev.characters,
              lines: lines.length > 0 ? lines : prev.lines,
              updatedAt: new Date().toISOString(),
            }));
          }}
          onClose={() => setIsAiModalOpen(false)}
        />
      )}
    </div>
  );
}
