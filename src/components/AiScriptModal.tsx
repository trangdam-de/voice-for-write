import React, { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  FileText, 
  Wand2, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Character, DialogueLine } from '../types/story';

interface AiScriptModalProps {
  onApplyScript: (data: { characters: Character[]; lines: DialogueLine[]; title?: string }) => void;
  onClose: () => void;
}

const SAMPLE_RAW_SCRIPT = `Người dẫn chuyện: Đêm đông lạnh giá, chàng thư sinh bước vào cổ miếu trú mưa.
Thư sinh: Trời mưa to quá, may sao có ngôi miếu này che chở.
Tiểu hồ ly: Ai đó? Sao chàng lại vào cấm địa của thiếp lúc đêm hôm khuya khoắt thế này?
Thư sinh: Tiểu thư chớ sợ hãi, ta chỉ là kẻ lữ hành đi thi ghé qua nghỉ chân thôi!
Tiểu hồ ly: Thi thư đèn sách sao? Vậy chàng có thể đối cùng thiếp một vế câu được chăng?`;

export const AiScriptModal: React.FC<AiScriptModalProps> = ({
  onApplyScript,
  onClose,
}) => {
  const [scriptText, setScriptText] = useState(SAMPLE_RAW_SCRIPT);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParse = async () => {
    if (!scriptText.trim()) {
      setErrorMsg('Vui lòng dán nội dung kịch bản cần phân tích.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/story/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: scriptText.trim() }),
      });

      const json = await res.json();
      setIsLoading(false);

      if (json.success && json.data) {
        const { characters, lines, title } = json.data;
        if (Array.isArray(characters) && Array.isArray(lines) && characters.length > 0) {
          onApplyScript({ characters, lines, title });
          onClose();
        } else {
          setErrorMsg('AI không thể nhận diện được cấu trúc nhân vật và câu thoại. Vui lòng kiểm tra lại văn bản.');
        }
      } else {
        setErrorMsg(json.error || 'Có lỗi xảy ra khi phân tích kịch bản.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg('Lỗi kết nối máy chủ: ' + (err?.message || 'Vui lòng thử lại.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Biên Kịch AI: Tự Động Phân Vai & Tách Câu
              </h3>
              <p className="text-xs text-slate-400">
                Dán bất kỳ câu chuyện hoặc kịch bản thô nào, AI sẽ tự động tạo nhân vật, gán giọng và sắp xếp thứ tự thoại
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

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Nội dung kịch bản hoặc mẩu truyện thô:</span>
              </label>
              <button
                type="button"
                onClick={() => setScriptText(SAMPLE_RAW_SCRIPT)}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] underline"
              >
                Dán mẫu thử
              </button>
            </div>

            <textarea
              rows={10}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Ví dụ:&#10;Người dẫn chuyện: Đêm đông lạnh giá...&#10;Minh: Chào em Lan!&#10;Lan: Chào anh Minh..."
              className="w-full bg-slate-950 text-slate-100 p-3.5 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all leading-relaxed font-mono text-xs resize-y"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 flex items-start gap-2 text-[11px]">
            <Wand2 className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              Mẹo: Bạn có thể viết theo cú pháp <code>Tên nhân vật: Lời thoại</code> hoặc dán cả đoạn văn xuôi có lời thoại, AI sẽ tự động trích xuất nhân vật và lời thoại chính xác.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors text-xs"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-60 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang phân tích kịch bản...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Phân tích & Áp dụng vào Story</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
