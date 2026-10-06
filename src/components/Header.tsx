import React, { useRef } from 'react';
import { 
  Sparkles, 
  FolderDown, 
  Upload, 
  BookOpen, 
  Save, 
  Clock, 
  Users, 
  MessageSquare, 
  Radio
} from 'lucide-react';
import { StoryProject } from '../types/story';
import { SAMPLE_PROJECTS } from '../utils/sampleProjects';
import { downloadFile } from '../utils/srtExport';

interface HeaderProps {
  project: StoryProject;
  setProject: React.Dispatch<React.SetStateAction<StoryProject>>;
  totalDuration: number;
  onSaveDraft: () => void;
  isSaving: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  setProject,
  totalDuration,
  onSaveDraft,
  isSaving,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Export project as JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(project, null, 2);
    downloadFile(dataStr, `${project.title || 'story-script'}.json`, 'application/json');
  };

  // Import project JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.characters && Array.isArray(json.lines)) {
          setProject({
            ...json,
            id: json.id || `proj-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          });
        } else {
          alert('Tệp JSON không đúng định dạng kịch bản Story.');
        }
      } catch (err) {
        alert('Không thể đọc tệp JSON. Vui lòng kiểm tra lại file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Project Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded">
                VBEE STUDIO
              </span>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject(prev => ({ ...prev, title: e.target.value }))}
                className="font-bold text-slate-100 text-sm sm:text-base bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                placeholder="Nhập tiêu đề kịch bản..."
              />
            </div>
            <p className="text-xs text-slate-400 truncate hidden sm:block">
              Studio Giọng Đọc & Hội Thoại Đa Nhân Vật Chuẩn YouTube
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span><strong>{project.characters.length}</strong> nhân vật</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span><strong>{project.lines.length}</strong> câu thoại</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Ước tính: <strong className="text-amber-300">{formatTime(totalDuration)}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sample Templates Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Kịch bản mẫu</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 hidden group-hover:block group-focus-within:block z-40">
              <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase">Chọn kịch bản mẫu:</p>
              {SAMPLE_PROJECTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc muốn nạp kịch bản mẫu "${sample.title}"? Dữ liệu hiện tại chưa lưu có thể bị thay thế.`)) {
                      setProject(sample);
                    }
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <p className="font-semibold text-indigo-300">{sample.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{sample.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Mở file kịch bản JSON đã lưu"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Mở file JSON</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            title="Tải kịch bản về máy dưới dạng JSON"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FolderDown className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Tải JSON</span>
          </button>

          {/* Save Draft in LocalStorage */}
          <button
            onClick={onSaveDraft}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu nháp'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
