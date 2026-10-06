import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Shared Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Available prebuilt voices in Gemini TTS
export const PREBUILT_VOICES = [
  { id: 'Kore', name: 'Kore (Nữ - Truyền cảm & Ấm áp)', gender: 'female', style: 'Warm, expressive, natural storyteller' },
  { id: 'Puck', name: 'Puck (Nam - Trẻ trung & Năng động)', gender: 'male', style: 'Energetic, youthful, clear' },
  { id: 'Charon', name: 'Charon (Nam - Trầm ấm & Uy nghiêm)', gender: 'male', style: 'Deep, resonant, authoritative' },
  { id: 'Fenrir', name: 'Fenrir (Nam - Hùng hồn & Kịch tính)', gender: 'male', style: 'Strong, intense, dramatic' },
  { id: 'Zephyr', name: 'Zephyr (Nữ - Nhẹ nhàng & Trong trẻo)', gender: 'female', style: 'Gentle, bright, melodic' },
  { id: 'Aoede', name: 'Aoede (Nữ - Sang trọng & Tinh tế)', gender: 'female', style: 'Sophisticated, elegant narrator' },
];

// Endpoint: Generate Speech for a line of dialogue
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', style = 'Natural, clear speech' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Nội dung văn bản (text) không được để trống.' });
    }

    const ai = getGeminiClient();

    // Call gemini-3.8-flash-lite-tts for high efficiency TTS
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.trim(),
              speechMetadata: {
                style: style || 'Natural, clear speech with proper emotion',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.[0];
    const base64Audio = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      return res.status(502).json({
        error: 'Không nhận được dữ liệu âm thanh từ mô hình AI.',
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType,
    });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi tạo giọng đọc.',
    });
  }
});

// Endpoint: AI Script Assistant - Parse raw script into Characters and Dialogue lines
app.post('/api/story/ai-parse', async (req, res) => {
  try {
    const { scriptText } = req.body;
    if (!scriptText || typeof scriptText !== 'string' || !scriptText.trim()) {
      return res.status(400).json({ error: 'Nội dung kịch bản không được để trống.' });
    }

    const ai = getGeminiClient();

    const prompt = `Bạn là biên kịch và đạo diễn âm thanh chuyên nghiệp.
Hãy phân tích đoạn kịch bản hoặc mẩu truyện sau đây thành danh sách các nhân vật và các câu thoại tuần tự.
Mỗi nhân vật cần có:
- id: chuỗi id duy nhất (ví dụ "char_1", "char_narrator")
- name: tên nhân vật (ví dụ "Người dẫn chuyện", "Minh", "Lan", v.v.)
- gender: "male" hoặc "female"
- voiceName: một trong các giọng ("Kore", "Puck", "Charon", "Fenrir", "Zephyr", "Aoede")
- defaultSpeed: số từ 0.8 đến 1.2 (mặc định 1.0)
- defaultPitch: số từ -4 đến 4 (mặc định 0)
- color: mã màu hex hài hòa (ví dụ "#3b82f6", "#ec4899", "#8b5cf6", "#10b981", "#f59e0b")
- roleDescription: vai trò ngắn gọn (ví dụ: "Người dẫn chuyện trầm tĩnh", "Chàng trai hào sảng", "Cô gái dịu dàng")

Mỗi câu thoại (lines) cần có:
- id: chuỗi id ngẫu nhiên duy nhất (ví dụ "line_1", "line_2")
- characterId: id của nhân vật nói câu này
- text: câu thoại chính xác của nhân vật (loại bỏ tiền tố tên nhân vật)
- emotion: cảm xúc hoặc phong cách đọc (ví dụ: "vui vẻ", "trầm tư", "kịch tính", "thì thầm", "nghiêm nghị")

Đoạn kịch bản đầu vào:
"""
${scriptText}
"""

Hãy trả về định dạng JSON thuần túy theo schema:
{
  "title": "Tiêu đề kịch bản",
  "characters": [ ... ],
  "lines": [ ... ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedJson = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('AI Script parsing error:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi phân tích kịch bản bằng AI.',
    });
  }
});

// Start Express server and mount Vite in development
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
