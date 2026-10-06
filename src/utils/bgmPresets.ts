// Procedural ambient BGM synthesis using Web Audio API

export interface BGMPresetInfo {
  key: string;
  name: string;
  genre: string;
  description: string;
  icon: string;
}

export const BGM_PRESETS: BGMPresetInfo[] = [
  {
    key: 'fantasy',
    name: 'Cổ tích & Kỳ ảo (Fantasy Tale)',
    genre: 'Acoustic / Harp Pad',
    description: 'Âm hưởng mơ mộng, thanh thoát, thích hợp truyện thiếu nhi và cổ tích.',
    icon: '✨',
  },
  {
    key: 'emotional',
    name: 'Trầm buồn & Xúc động (Emotional Melancholy)',
    genre: 'Sad Piano & Strings',
    description: 'Giai điệu chậm rãi, da diết cho các phân đoạn cảm xúc sâu lắng.',
    icon: '💧',
  },
  {
    key: 'mystery',
    name: 'Kịch tính & Ly kỳ (Cinematic Suspense)',
    genre: 'Cinematic Drone',
    description: 'Nhịp đập trầm huyền bí, hồi hộp cho truyện trinh thám, kinh dị, giật gân.',
    icon: '🕵️',
  },
  {
    key: 'peaceful',
    name: 'Thư thái & Bình yên (Peaceful Nature)',
    genre: 'Ambient Breeze',
    description: 'Không gian tĩnh lặng, êm dịu giúp người nghe tập trung vào cốt truyện.',
    icon: '🍃',
  },
];

// Generate an AudioBuffer for a preset (15-20 seconds seamlessly loopable)
export function generateProceduralBGMBuffer(
  audioCtx: AudioContext | OfflineAudioContext,
  presetKey: string
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const duration = 16; // 16 seconds loop
  const totalFrames = Math.floor(sampleRate * duration);
  const buffer = audioCtx.createBuffer(2, totalFrames, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Generate chords based on preset
  let chords: number[][] = [];
  if (presetKey === 'fantasy') {
    // Cmaj7 -> Am7 -> Fmaj7 -> Gsus4
    chords = [
      [261.63, 329.63, 392.00, 493.88], // C, E, G, B
      [220.00, 261.63, 329.63, 392.00], // A, C, E, G
      [174.61, 220.00, 261.63, 329.63], // F, A, C, E
      [196.00, 261.63, 293.66, 392.00], // G, C, D, G
    ];
  } else if (presetKey === 'emotional') {
    // Dm -> Bb -> F -> C
    chords = [
      [146.83, 220.00, 261.63, 349.23], // D, A, C, F
      [116.54, 174.61, 233.08, 293.66], // Bb, F, Bb, D
      [174.61, 220.00, 261.63, 329.63], // F, A, C, E
      [130.81, 196.00, 246.94, 329.63], // C, G, B, E
    ];
  } else if (presetKey === 'mystery') {
    // Low Drone suspense in C minor with tritone
    chords = [
      [65.41, 98.00, 130.81, 155.56], // C2, G2, C3, Eb3
      [65.41, 92.50, 130.81, 164.81], // C2, F#2 (tritone), C3, E3
      [58.27, 87.31, 116.54, 146.83], // Bb1, F2, Bb2, D3
      [61.74, 92.50, 123.47, 155.56], // B1, F#2, B2, Eb3
    ];
  } else {
    // Peaceful: Pentatonic ambient
    chords = [
      [196.00, 246.94, 293.66, 369.99], // G, B, D, F#
      [164.81, 220.00, 246.94, 329.63], // E, A, B, E
      [174.61, 220.00, 261.63, 329.63], // F, A, C, E
      [196.00, 246.94, 293.66, 440.00], // G, B, D, A
    ];
  }

  const chordDuration = duration / chords.length;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor((t % duration) / chordDuration) % chords.length;
    const chordTime = (t % chordDuration);
    const chord = chords[chordIndex];

    let sampleL = 0;
    let sampleR = 0;

    // Soft warm pad envelope
    const env = Math.sin((chordTime / chordDuration) * Math.PI);

    chord.forEach((freq, idx) => {
      // Sub-harmonic oscillator with slow chorus
      const detuneL = 1 + 0.0015 * Math.sin(t * 0.4 + idx);
      const detuneR = 1 - 0.0015 * Math.cos(t * 0.4 + idx);

      const oscL = Math.sin(2 * Math.PI * freq * detuneL * t);
      const oscR = Math.sin(2 * Math.PI * freq * detuneR * t);

      // Add warmth (2nd harmonic)
      const harmonicL = 0.25 * Math.sin(4 * Math.PI * freq * detuneL * t);
      const harmonicR = 0.25 * Math.sin(4 * Math.PI * freq * detuneR * t);

      sampleL += (oscL + harmonicL) * (0.15 / chord.length);
      sampleR += (oscR + harmonicR) * (0.15 / chord.length);
    });

    // Shimmer/Noise texture
    const texture = (Math.random() * 2 - 1) * 0.003;

    // Apply envelope and stereo panning
    left[i] = (sampleL * env + texture) * 0.6;
    right[i] = (sampleR * env - texture) * 0.6;
  }

  return buffer;
}
