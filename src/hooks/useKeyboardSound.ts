import { useCallback, useEffect, useRef } from "react";
import {
  DEFAULT_SOUND_TUNING,
  type KeyboardSoundProfile,
  type KeyboardSoundTuning,
  type SoundBaseProfile,
} from "@/components/PreferencesProvider";

interface NoiseLayer {
  cutoff: number;
  q: number;
  decay: number;
  gain: number;
}

interface ProfileConfig {
  /** Broadband thud of the stem bottoming out on the plate. */
  impact: NoiseLayer;
  /** High-frequency switch tick riding on top of the impact. */
  click: NoiseLayer;
  /** Resonance of the case, struck by the impact and left to ring. */
  body: { freq: number; decay: number; gain: number; partial: number; partialGain: number; partialDecay: number };
  /** Upstroke — quieter, brighter, and a few milliseconds behind the press. */
  release: { gain: number; delay: number; pitch: number };
}

const PROFILE = {
  linear: {
    impact: { cutoff: 1700, q: 0.7, decay: 0.009, gain: 0.26 },
    click: { cutoff: 2500, q: 1.2, decay: 0.005, gain: 0.075 },
    body: { freq: 165, decay: 0.055, gain: 0.145, partial: 2.9, partialGain: 0.03, partialDecay: 0.022 },
    release: { gain: 0.36, delay: 0.05, pitch: 1.42 },
  },
  tactile: {
    impact: { cutoff: 1350, q: 0.8, decay: 0.012, gain: 0.29 },
    click: { cutoff: 2050, q: 1.5, decay: 0.009, gain: 0.11 },
    body: { freq: 140, decay: 0.066, gain: 0.165, partial: 2.75, partialGain: 0.033, partialDecay: 0.026 },
    release: { gain: 0.42, delay: 0.054, pitch: 1.36 },
  },
  clicky: {
    impact: { cutoff: 2400, q: 0.7, decay: 0.008, gain: 0.22 },
    click: { cutoff: 3250, q: 2, decay: 0.011, gain: 0.2 },
    body: { freq: 188, decay: 0.042, gain: 0.11, partial: 3.1, partialGain: 0.028, partialDecay: 0.018 },
    release: { gain: 0.55, delay: 0.046, pitch: 1.5 },
  },
  thock: {
    impact: { cutoff: 780, q: 0.7, decay: 0.013, gain: 0.3 },
    click: { cutoff: 1450, q: 1, decay: 0.007, gain: 0.055 },
    body: { freq: 112, decay: 0.09, gain: 0.2, partial: 2.62, partialGain: 0.035, partialDecay: 0.03 },
    release: { gain: 0.4, delay: 0.06, pitch: 1.3 },
  },
} satisfies Record<SoundBaseProfile, ProfileConfig>;

/** Maps a 0-100 knob onto [min, max] with 50 landing exactly on the base value. */
function knob(value: number, base: number, min: number, max: number): number {
  const t = Math.min(100, Math.max(0, value)) / 100;
  return t <= 0.5 ? min + (base - min) * (t / 0.5) : base + (max - base) * ((t - 0.5) / 0.5);
}

/**
 * Applies the macro knobs to a base preset. Each knob deliberately moves several
 * parameters at once along ranges that stay inside "sounds like a keyboard" —
 * the point is that no knob position can produce a doorbell.
 */
function applyTuning(base: ProfileConfig, tuning: KeyboardSoundTuning): ProfileConfig {
  // Tone shifts the whole spectrum: case resonance and both noise layers move
  // together, otherwise a bright body over a dull click sounds disconnected.
  const tone = knob(tuning.tone, 1, 0.66, 1.5);
  const damping = knob(tuning.damping, 1, 0.55, 1.85);
  const click = knob(tuning.click, 1, 0, 2.4);
  const upstroke = knob(tuning.upstroke, 1, 0, 1.9);

  return {
    impact: {
      ...base.impact,
      cutoff: base.impact.cutoff * tone,
      // Tighter damping also shortens the thud, or it lags behind the body.
      decay: base.impact.decay * (0.75 + damping * 0.25),
    },
    click: {
      ...base.click,
      cutoff: base.click.cutoff * tone,
      gain: base.click.gain * click,
      // A louder click reads as sharper only if the band narrows with it.
      q: base.click.q * (0.85 + click * 0.2),
    },
    body: {
      ...base.body,
      freq: base.body.freq * tone,
      decay: base.body.decay * damping,
      partialDecay: base.body.partialDecay * damping,
    },
    release: {
      ...base.release,
      gain: base.release.gain * upstroke,
      // A heavier upstroke implies a slower spring, so it arrives later.
      delay: base.release.delay * (0.88 + upstroke * 0.14),
    },
  };
}

function resolveProfile(profile: KeyboardSoundProfile, tuning: KeyboardSoundTuning): ProfileConfig {
  if (profile !== "custom") return PROFILE[profile];
  return applyTuning(PROFILE[tuning.base] ?? PROFILE[DEFAULT_SOUND_TUNING.base], tuning);
}

// One context and one master bus for the whole app — a second AudioContext would
// double the CPU cost and make the two mixes fight each other.
let audio: {
  context: AudioContext;
  bus: GainNode;
  noise: AudioBuffer;
  idleTimer: number | null;
} | null = null;

const NOISE_SECONDS = 0.4;

function softClipCurve(amount: number): Float32Array<ArrayBuffer> {
  const length = 1024;
  const curve = new Float32Array(new ArrayBuffer(length * 4));
  // tanh(x * a) / a is unity for small signals and flattens near the ceiling, so
  // overlapping keystrokes saturate gently instead of clipping.
  for (let index = 0; index < length; index += 1) {
    const x = (index / (length - 1)) * 2 - 1;
    curve[index] = Math.tanh(x * amount) / amount;
  }
  return curve;
}

function ensureAudio() {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;

  if (!audio) {
    const context = new AudioContext({ latencyHint: "interactive" });
    const bus = context.createGain();
    bus.gain.value = 1;

    const rumble = context.createBiquadFilter();
    rumble.type = "highpass";
    rumble.frequency.value = 42;

    const shaper = context.createWaveShaper();
    shaper.curve = softClipCurve(1.5);
    shaper.oversample = "2x";

    bus.connect(rumble).connect(shaper).connect(context.destination);

    const frameCount = Math.ceil(context.sampleRate * NOISE_SECONDS);
    const noise = context.createBuffer(1, frameCount, context.sampleRate);
    const channel = noise.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) channel[index] = Math.random() * 2 - 1;

    audio = { context, bus, noise, idleTimer: null };
  }

  if (audio.context.state === "suspended") void audio.context.resume();

  if (audio.idleTimer !== null) window.clearTimeout(audio.idleTimer);
  audio.idleTimer = window.setTimeout(() => {
    void audio?.context.suspend();
  }, 15000);

  return audio;
}

const ROWS = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"];

/** Pitch, loudness, and stereo position derived from where the key sits on the board. */
function keyCharacter(key: string): { pitch: number; weight: number; pan: number } {
  if (key === " ") return { pitch: 0.8, weight: 1.22, pan: 0 };
  if (key === "Enter") return { pitch: 0.87, weight: 1.14, pan: 0.42 };
  if (key === "Backspace") return { pitch: 0.93, weight: 1.08, pan: 0.5 };
  if (key === "Tab") return { pitch: 0.9, weight: 1.06, pan: -0.5 };

  const lower = key.toLowerCase();
  for (let row = 0; row < ROWS.length; row += 1) {
    const column = ROWS[row].indexOf(lower);
    if (column === -1) continue;
    const spread = (column / (ROWS[row].length - 1)) * 2 - 1;
    // Upper rows sit further from the case floor, so they read a touch brighter.
    return { pitch: 1.06 - row * 0.03, weight: 1, pan: spread * 0.3 };
  }

  return { pitch: 1, weight: 1, pan: 0 };
}

function scheduleNoise(
  context: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  layer: NoiseLayer,
  start: number,
  peak: number,
  cutoff: number,
  bandpass: boolean,
) {
  if (peak <= 0.00002) return;

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = 0.9 + Math.random() * 0.2;

  const filter = context.createBiquadFilter();
  filter.type = bandpass ? "bandpass" : "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = layer.q;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.0008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + layer.decay);

  source.connect(filter).connect(gain).connect(destination);
  // Random offset into the shared buffer keeps repeated keys from sounding identical.
  source.start(start, Math.random() * (NOISE_SECONDS - layer.decay - 0.02));
  source.stop(start + layer.decay + 0.01);
}

function scheduleTone(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  decay: number,
  peak: number,
  start: number,
) {
  if (peak <= 0.00002) return;

  const osc = context.createOscillator();
  osc.type = "sine";
  // Tiny downward glide: a struck resonance starts stiff and settles. Anything
  // larger than this turns the thump into an audible pitch bend.
  osc.frequency.setValueAtTime(frequency * 1.06, start);
  osc.frequency.exponentialRampToValueAtTime(frequency, start + 0.012);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);

  osc.connect(gain).connect(destination);
  osc.start(start);
  osc.stop(start + decay + 0.01);
}

export function useKeyboardSound(
  enabled: boolean,
  profile: KeyboardSoundProfile = "thock",
  volume = 45,
  tuning: KeyboardSoundTuning = DEFAULT_SOUND_TUNING,
) {
  const lastPlayedRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    // Warm the context up on the first render that has sound on, so the very
    // first keystroke is not the one that pays for context creation.
    ensureAudio();
  }, [enabled]);

  return useCallback(
    (key: string, force = false) => {
      if (!enabled && !force) return;
      if (volume <= 0) return;

      const engine = ensureAudio();
      if (!engine) return;

      const { context, bus, noise } = engine;
      const now = context.currentTime;
      // Held-key auto-repeat can fire faster than a switch can physically reset;
      // collapsing those keeps fast typing from turning into a buzz.
      if (now - lastPlayedRef.current < 0.012) return;
      lastPlayedRef.current = now;

      const config = resolveProfile(profile, tuning);
      const character = keyCharacter(key);
      const level = Math.pow(Math.min(1, Math.max(0, volume / 100)), 1.4);
      const jitterPitch = 1 + (Math.random() - 0.5) * 0.05;
      const jitterGain = 1 + (Math.random() - 0.5) * 0.16;
      const strength = level * character.weight * jitterGain;
      const pitch = character.pitch * jitterPitch;

      const panner = context.createStereoPanner();
      panner.pan.value = character.pan;
      panner.connect(bus);

      scheduleNoise(context, panner, noise, config.impact, now, config.impact.gain * strength, config.impact.cutoff * pitch, false);
      scheduleNoise(context, panner, noise, config.click, now, config.click.gain * strength, config.click.cutoff * pitch, true);
      scheduleTone(context, panner, config.body.freq * pitch, config.body.decay, config.body.gain * strength, now);
      scheduleTone(
        context,
        panner,
        config.body.freq * config.body.partial * pitch,
        config.body.partialDecay,
        config.body.partialGain * strength,
        now,
      );

      // Upstroke: the spring returning the stem to the top housing.
      const releaseAt = now + config.release.delay * (2 - character.pitch);
      const releaseStrength = strength * config.release.gain;
      const releasePitch = pitch * config.release.pitch;
      scheduleNoise(
        context,
        panner,
        noise,
        { ...config.impact, decay: config.impact.decay * 0.7 },
        releaseAt,
        config.impact.gain * releaseStrength,
        config.impact.cutoff * releasePitch,
        false,
      );
      scheduleNoise(
        context,
        panner,
        noise,
        { ...config.click, decay: config.click.decay * 0.8 },
        releaseAt,
        config.click.gain * releaseStrength * 1.15,
        config.click.cutoff * releasePitch,
        true,
      );
      scheduleTone(
        context,
        panner,
        config.body.freq * releasePitch,
        config.body.decay * 0.45,
        config.body.gain * releaseStrength * 0.6,
        releaseAt,
      );
    },
    // Tuning is spread into primitives so a caller passing an inline object
    // literal does not rebuild this callback — and its consumers — every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, profile, volume, tuning.base, tuning.tone, tuning.click, tuning.damping, tuning.upstroke],
  );
}
