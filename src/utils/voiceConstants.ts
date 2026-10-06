import { VoiceOption } from '../types/story';

export const VOICE_CATALOG: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore - Ngọc Mai',
    gender: 'female',
    region: 'Miền Bắc',
    style: 'Truyền cảm, ấm áp, kể chuyện sâu lắng',
    description: 'Giọng nữ chuẩn Hà Nội, ấm áp, tự nhiên, thích hợp cho người dẫn chuyện, truyện tâm lý tình cảm, sách nói.',
    tags: ['Kể chuyện', 'Audiobook', 'Nữ chính', 'Tâm lý'],
  },
  {
    id: 'Puck',
    name: 'Puck - Tuấn Kiệt',
    gender: 'male',
    region: 'Miền Nam',
    style: 'Trẻ trung, năng động, tươi sáng',
    description: 'Giọng nam thanh niên hiện đại, phóng khoáng, thích hợp cho nhân vật nam chính, hoạt hình, podcast đối thoại.',
    tags: ['Nam trẻ', 'Năng động', 'Hoạt hình', 'Podcast'],
  },
  {
    id: 'Charon',
    name: 'Charon - Hoàng Dũng',
    gender: 'male',
    region: 'Miền Bắc',
    style: 'Trầm ấm, chững chạc, uy quyền',
    description: 'Giọng nam trung niên dày và vang, mang phong thái học giả hoặc lãnh đạo, thích hợp làm người dẫn truyện lịch sử, phim tài liệu.',
    tags: ['Trầm ấm', 'Lịch sử', 'Uy quyền', 'Tài liệu'],
  },
  {
    id: 'Fenrir',
    name: 'Fenrir - Mạnh Hùng',
    gender: 'male',
    region: 'Miền Trung',
    style: 'Hùng hồn, kịch tính, nội lực',
    description: 'Giọng nam trầm vang, có sức công phá, thích hợp cho truyện kiếm hiệp, hành động, nhân vật phản diện, cao trào.',
    tags: ['Hành động', 'Kịch tính', 'Phản diện', 'Kiếm hiệp'],
  },
  {
    id: 'Zephyr',
    name: 'Zephyr - Thảo Nhi',
    gender: 'female',
    region: 'Miền Nam',
    style: 'Trong trẻo, ngọt ngào, dịu dàng',
    description: 'Giọng nữ trẻ trung như pha lê, ngọt ngào và êm ái, rất phù hợp cho truyện cổ tích, bé gái, nhân vật dễ thương.',
    tags: ['Cổ tích', 'Dịu dàng', 'Thiếu nhi', 'Ngọt ngào'],
  },
  {
    id: 'Aoede',
    name: 'Aoede - Phương Linh',
    gender: 'female',
    region: 'Miền Bắc',
    style: 'Sang trọng, quý phái, chuẩn mực',
    description: 'Giọng nữ phát thanh viên đài truyền hình, chuẩn xác từng câu chữ, thích hợp đọc tin tức, tiểu thuyết hiện đại, thương gia.',
    tags: ['Phát thanh', 'Sang trọng', 'Thuyết minh', 'Hiện đại'],
  },
];

export const EMOTION_PRESETS = [
  'Tự nhiên, rõ ràng',
  'Truyền cảm, sâu lắng',
  'Hào hứng, vui tươi',
  'Kịch tính, hồi hộp',
  'Trầm buồn, da diết',
  'Thì thầm, bí ẩn',
  'Nghiêm nghị, dứt khoát',
  'Tức giận, gay gắt',
  'Ngạc nhiên, hốt hoảng',
];

export const CHARACTER_COLORS = [
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#a855f7', // Purple
  '#f97316', // Orange
];
