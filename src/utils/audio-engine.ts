export type SoundPackId = 'holy-panda' | 'cherry-blue' | 'cherry-red' | 'ibm-model-m' | 'cyber-synth' | 'muted';

export interface SoundPackInfo {
  id: SoundPackId;
  name: string;
  description: string;
  icon: string;
}

export const SOUND_PACKS: SoundPackInfo[] = [
  { id: 'holy-panda', name: 'Holy Panda', description: 'Deep thocky tactile mechanical switch', icon: '🐼' },
  { id: 'cherry-blue', name: 'Cherry MX Blue', description: 'Crisp clicky tactile switch sound', icon: '🔵' },
  { id: 'cherry-red', name: 'Cherry MX Red', description: 'Smooth soft linear switch thud', icon: '🔴' },
  { id: 'ibm-model-m', name: 'IBM Model M', description: 'Heavy retro buckling spring & bell', icon: '🏛️' },
  { id: 'cyber-synth', name: 'Cyberpunk Synth', description: 'Futuristic sci-fi laser blip feedback', icon: '⚡' },
  { id: 'muted', name: 'Muted (Silent)', description: 'No keypress sound effects', icon: '🔇' },
];

const SOUND_PACK_STORAGE_KEY = 'codey_soundpack_id_v1';
const SOUND_VOLUME_STORAGE_KEY = 'codey_sound_volume_v1';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function getStoredSoundPack(): SoundPackId {
  try {
    const saved = localStorage.getItem(SOUND_PACK_STORAGE_KEY) as SoundPackId;
    if (saved && SOUND_PACKS.some((p) => p.id === saved)) return saved;
  } catch {
    // fallback
  }
  return 'holy-panda';
}

export function saveSoundPack(id: SoundPackId): void {
  try {
    localStorage.setItem(SOUND_PACK_STORAGE_KEY, id);
  } catch {
    // quota
  }
}

export function getStoredSoundVolume(): number {
  try {
    const saved = localStorage.getItem(SOUND_VOLUME_STORAGE_KEY);
    if (saved !== null) return Math.min(1, Math.max(0, parseFloat(saved)));
  } catch {
    // fallback
  }
  return 0.6; // Default 60% volume
}

export function saveSoundVolume(volume: number): void {
  try {
    localStorage.setItem(SOUND_VOLUME_STORAGE_KEY, volume.toString());
  } catch {
    // quota
  }
}

/**
 * Synthesizes realistic mechanical keypress audio based on selected SoundPack
 */
export function playKeypressSound(type: 'key' | 'space' | 'enter' | 'backspace' = 'key'): void {
  const soundPack = getStoredSoundPack();
  if (soundPack === 'muted') return;

  const volume = getStoredSoundVolume();
  if (volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(ctx.destination);

  // Pitch variation for natural typing sound (±4%)
  const randomPitch = 0.96 + Math.random() * 0.08;

  switch (soundPack) {
    case 'holy-panda': {
      // Deep thock + tactile click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = type === 'space' ? 110 : type === 'enter' ? 130 : 180;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * randomPitch, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.06);

      // Subtle noise snap
      createNoiseSnap(ctx, masterGain, now, 0.02, 0.15);
      break;
    }

    case 'cherry-blue': {
      // Crisp clicky snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = type === 'space' ? 800 : type === 'enter' ? 1200 : 1600;
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq * randomPitch, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.03);

      createNoiseSnap(ctx, masterGain, now, 0.015, 0.25);
      break;
    }

    case 'cherry-red': {
      // Smooth linear bottom-out
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = type === 'space' ? 90 : type === 'enter' ? 100 : 140;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * randomPitch, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.045);
      break;
    }

    case 'ibm-model-m': {
      // Heavy metallic buckling spring
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = type === 'space' ? 350 : type === 'enter' ? 450 : 650;
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq * randomPitch, now);
      osc2.frequency.setValueAtTime((baseFreq * 1.5) * randomPitch, now);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.07);
      osc2.stop(now + 0.07);

      createNoiseSnap(ctx, masterGain, now, 0.03, 0.2);
      break;
    }

    case 'cyber-synth': {
      // Futuristic laser synth blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = type === 'space' ? 600 : type === 'enter' ? 1200 : type === 'backspace' ? 400 : 900;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * randomPitch, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    }
  }
}

function createNoiseSnap(ctx: AudioContext, destination: AudioNode, startTime: number, duration: number, amount: number): void {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(amount, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  noise.connect(gain);
  gain.connect(destination);
  noise.start(startTime);
  noise.stop(startTime + duration);
}
