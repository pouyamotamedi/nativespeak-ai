// Speech synthesis, server TTS/STT, audio recording, and recognition utility

import { apiFetch } from './userApiKeys';

let cachedAmericanVoice: SpeechSynthesisVoice | null = null;
let activeAudioEl: HTMLAudioElement | null = null;

function pickAmericanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return cachedAmericanVoice;

  const preferredNames = [
    'Google US English',
    'Microsoft Aria Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)',
    'Samantha',
    'Alex',
    'Karen',
  ];

  const byName = preferredNames
    .map((n) => voices.find((v) => v.name === n || v.name.includes(n)))
    .find(Boolean);

  const us =
    byName ||
    voices.find((v) => /en-US/i.test(v.lang) && /natural|neural|google|premium/i.test(v.name)) ||
    voices.find((v) => /en-US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang));

  cachedAmericanVoice = us || null;
  return cachedAmericanVoice;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    pickAmericanVoice();
  };
}

function playBrowserTts(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    lang?: string;
    onEnd?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;
  // Force American English for coach voice consistency
  utterance.lang = 'en-US';

  const voice = pickAmericanVoice();
  if (voice) utterance.voice = voice;

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Prefer server American TTS (OpenAI / Gemini); fall back to browser en-US voice.
 */
export async function playAudioText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    lang?: string;
    onEnd?: () => void;
    forceBrowser?: boolean;
  }
): Promise<void> {
  const clean = (text || '').trim();
  if (!clean) {
    options?.onEnd?.();
    return;
  }

  stopAudioPlayback();

  if (!options?.forceBrowser && typeof window !== 'undefined') {
    try {
      const res = await apiFetch('/api/tts', {
        method: 'POST',
        body: JSON.stringify({
          text: clean.slice(0, 4000),
          voice: 'nova',
          speed: options?.rate ?? 1.0,
        }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('audio')) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          activeAudioEl = audio;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            activeAudioEl = null;
            options?.onEnd?.();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            activeAudioEl = null;
            playBrowserTts(clean, options);
          };
          await audio.play();
          return;
        }
        // JSON fallback may include base64
        const data = await res.json().catch(() => null);
        if (data?.audioBase64) {
          const mime = data.mimeType || 'audio/mpeg';
          const url = `data:${mime};base64,${data.audioBase64}`;
          const audio = new Audio(url);
          activeAudioEl = audio;
          audio.onended = () => {
            activeAudioEl = null;
            options?.onEnd?.();
          };
          audio.onerror = () => {
            activeAudioEl = null;
            playBrowserTts(clean, options);
          };
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('Server TTS unavailable, using browser American voice:', e);
    }
  }

  playBrowserTts(clean, options);
}

export function stopAudioPlayback() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (activeAudioEl) {
    try {
      activeAudioEl.pause();
      activeAudioEl.src = '';
    } catch (e) {}
    activeAudioEl = null;
  }
}

/**
 * Dedicated STT: Whisper (OpenAI) → Gemini → empty string.
 */
export async function transcribeAudioBase64(
  base64: string,
  mimeType = 'audio/webm',
  language = 'en'
): Promise<{ text: string; engine: string }> {
  if (!base64) return { text: '', engine: 'none' };
  try {
    const res = await apiFetch('/api/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64: base64, mimeType, language }),
    });
    if (!res.ok) return { text: '', engine: 'error' };
    const data = await res.json();
    return {
      text: (data.text || data.transcript || '').trim(),
      engine: data.engine || 'unknown',
    };
  } catch (e) {
    console.warn('transcribeAudioBase64 failed:', e);
    return { text: '', engine: 'error' };
  }
}

// Synthesize pleasant chime using Web Audio API (zero external assets needed)
export function playChimeSound(type: 'success' | 'levelUp' | 'ding') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'levelUp') {
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

export interface AudioRecordingSession {
  stop: () => Promise<{ base64: string; mimeType: string; audioUrl: string }>;
  getVolumeLevel: () => number;
  stream: MediaStream;
}

export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  if (typeof navigator === 'undefined' || !navigator.permissions) return 'unknown';
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch (e) {
    return 'unknown';
  }
}

export async function startAudioRecording(): Promise<AudioRecordingSession> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('دستگاه شما از ضبط صدا در مرورگر پشتیبانی نمی‌کند.');
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error(
        'دسترسی به میکروفون رد شده است. لطفاً در تنظیمات مرورگر یا آیکون کنار آدرس سایت دسترسی میکروفون را فعال کنید.'
      );
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      throw new Error('هیچ میکروفونی در دستگاه شما شناسایی نشد.');
    }
    throw new Error('خطا در دسترسی به میکروفون: ' + (err.message || ''));
  }

  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let dataArray: Uint8Array | null = null;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
  } catch (e) {
    console.warn('AudioContext analyser could not be initialized:', e);
  }

  const getVolumeLevel = (): number => {
    if (!analyser || !dataArray) return 25;
    analyser.getByteFrequencyData(dataArray as any);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.min(100, Math.round((avg / 128) * 100));
  };

  let mimeType = 'audio/webm';
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg';
    }
  }

  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(250);

  return {
    stream,
    getVolumeLevel,
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onerror = (e) => reject(e);
        recorder.onstop = async () => {
          try {
            stream.getTracks().forEach((track) => track.stop());
            if (audioContext && audioContext.state !== 'closed') {
              try {
                audioContext.close();
              } catch (e) {}
            }
            const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
            const audioUrl = URL.createObjectURL(blob);
            const reader = new FileReader();
            reader.onloadend = () => {
              const resultStr = (reader.result as string) || '';
              const base64 = resultStr.split(',')[1] || '';
              resolve({
                base64,
                mimeType: (mimeType || 'audio/webm').split(';')[0],
                audioUrl,
              });
            };
            reader.readAsDataURL(blob);
          } catch (err) {
            reject(err);
          }
        };
        try {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        } catch (e) {
          reject(e);
        }
      }),
  };
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognizer(callbacks: {
  onResult: (transcript: string) => void;
  onError?: (error: any) => void;
  onStart?: () => void;
  onEnd?: () => void;
  lang?: string;
}): SpeechRecognitionController {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  let recognition: any;
  try {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = callbacks.lang || 'en-US';

    recognition.onstart = () => {
      callbacks.onStart?.();
    };

    recognition.onresult = (event: any) => {
      let combinedTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        combinedTranscript += event.results[i][0].transcript + ' ';
      }
      const trimmed = combinedTranscript.trim();
      if (trimmed) {
        callbacks.onResult(trimmed);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition notice:', event.error);
      callbacks.onError?.(event.error);
    };

    recognition.onend = () => {
      callbacks.onEnd?.();
    };
  } catch (e) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  let isStarted = false;
  return {
    start: () => {
      if (isStarted) return;
      try {
        isStarted = true;
        recognition.start();
      } catch (e) {
        isStarted = false;
      }
    },
    stop: () => {
      if (!isStarted) return;
      isStarted = false;
      try {
        recognition.stop();
      } catch (e) {}
    },
    isSupported: true,
  };
}
