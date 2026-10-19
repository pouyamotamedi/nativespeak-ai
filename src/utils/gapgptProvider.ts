/**
 * GapGPT (https://gapgpt.app) — Iranian OpenAI-compatible gateway.
 * Useful for Rial top-ups without VPN. Not a drop-in for every Gemini multimodal path.
 */

export const GAPGPT_BASE_URL = (process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '');
export const GAPGPT_TTS_URL = process.env.GAPGPT_TTS_URL || 'https://gapgpt.app/api/v1/tts';

/** Models we may map onto GapGPT Chat Completions */
export const GAPGPT_CHAT_MODELS = [
  process.env.GAPGPT_CHAT_MODEL || 'gpt-4o',
  'gemini-2.0-flash',
  'gemini',
  'gpt-4o-mini',
  'gpt-5.6-luna',
];

export function getGapgptApiKey(): string {
  return (process.env.GAPGPT_API_KEY || '').trim();
}

export function isGapgptConfigured(): boolean {
  return Boolean(getGapgptApiKey());
}

/**
 * OpenAI-compatible chat completion via GapGPT.
 * Returns assistant text content or null on failure.
 */
export async function gapgptChatCompletion(opts: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string | any[] }>;
  model?: string;
  temperature?: number;
  responseFormatJson?: boolean;
}): Promise<{ text: string; model: string } | null> {
  const key = getGapgptApiKey();
  if (!key) return null;

  const models = opts.model ? [opts.model, ...GAPGPT_CHAT_MODELS] : GAPGPT_CHAT_MODELS;
  const unique = Array.from(new Set(models.filter(Boolean)));

  for (const model of unique) {
    try {
      const body: any = {
        model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.5,
      };
      if (opts.responseFormatJson) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(`${GAPGPT_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`GapGPT chat ${model} failed:`, res.status, errText.slice(0, 180));
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text === 'string' && text.trim()) {
        return { text: text.trim(), model: `gapgpt:${model}` };
      }
    } catch (e) {
      console.warn(`GapGPT chat ${model} exception:`, e);
    }
  }

  return null;
}

/** GapGPT TTS — returns audio buffer + mime, or null */
export async function gapgptSynthesizeSpeech(
  text: string,
  voice = 'en-male-1'
): Promise<{ buffer: Buffer; mimeType: string; engine: string } | null> {
  const key = getGapgptApiKey();
  if (!key) return null;
  const clean = String(text || '').trim().slice(0, 4000);
  if (!clean) return null;

  try {
    const res = await fetch(GAPGPT_TTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: clean, voice }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('GapGPT TTS failed:', res.status, errText.slice(0, 180));
      return null;
    }
    const contentType = res.headers.get('content-type') || 'audio/mpeg';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.audioBase64) {
        return {
          buffer: Buffer.from(data.audioBase64, 'base64'),
          mimeType: data.mimeType || 'audio/mpeg',
          engine: 'gapgpt-tts',
        };
      }
      // Some gateways return a URL
      if (data?.url) {
        const audioRes = await fetch(data.url);
        if (audioRes.ok) {
          return {
            buffer: Buffer.from(await audioRes.arrayBuffer()),
            mimeType: audioRes.headers.get('content-type') || 'audio/mpeg',
            engine: 'gapgpt-tts-url',
          };
        }
      }
      return null;
    }
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      mimeType: contentType.split(';')[0] || 'audio/mpeg',
      engine: 'gapgpt-tts',
    };
  } catch (e) {
    console.warn('GapGPT TTS exception:', e);
    return null;
  }
}

/**
 * Compatibility notes for NativeSpeak:
 * - Chat Completions (coach text, practice prompts, summaries): YES via GapGPT
 * - Gemini multimodal audio (speaking analysis with inline audio): NOT reliably documented on GapGPT;
 *   keep Google GenAI SDK / direct Gemini for voice turns unless GapGPT confirms audio input.
 * - Whisper STT: GapGPT does not clearly expose /v1/audio/transcriptions — keep OpenAI Whisper or Gemini STT.
 * - TTS: GapGPT documents /api/v1/tts with en-* voices — usable for American coach voice after testing voice IDs.
 * - Billing: Rial top-up on gapgpt.app/platform-v2 is the main operational win for Iran.
 */
export const GAPGPT_COMPATIBILITY = {
  chatCompletions: true,
  geminiMultimodalAudio: 'unverified',
  whisperStt: 'unverified',
  tts: true,
  rialBilling: true,
  docsUrl: 'https://gapgpt.app/platform-v2',
  apiBase: GAPGPT_BASE_URL,
} as const;
