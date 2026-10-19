export interface UserApiKeys {
  geminiApiKey: string;
  openaiApiKey: string;
  updatedAt: string;
}

const STORAGE_KEY = 'nativespeak_user_api_keys_v1';

export function getStoredUserApiKeys(): UserApiKeys {
  if (typeof window === 'undefined') {
    return { geminiApiKey: '', openaiApiKey: '', updatedAt: '' };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { geminiApiKey: '', openaiApiKey: '', updatedAt: '' };
    const parsed = JSON.parse(raw);
    return {
      geminiApiKey: String(parsed.geminiApiKey || '').trim(),
      openaiApiKey: String(parsed.openaiApiKey || '').trim(),
      updatedAt: String(parsed.updatedAt || ''),
    };
  } catch {
    return { geminiApiKey: '', openaiApiKey: '', updatedAt: '' };
  }
}

export function saveStoredUserApiKeys(keys: { geminiApiKey: string; openaiApiKey?: string }) {
  if (typeof window === 'undefined') return;
  const payload: UserApiKeys = {
    geminiApiKey: String(keys.geminiApiKey || '').trim(),
    openaiApiKey: String(keys.openaiApiKey || '').trim(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredUserApiKeys() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Gemini is required for coaching / assessment; OpenAI is optional (Whisper + TTS). */
export function hasRequiredApiKeys(keys?: UserApiKeys): boolean {
  const k = keys || getStoredUserApiKeys();
  return k.geminiApiKey.length >= 20;
}

export function buildApiAuthHeaders(extra?: HeadersInit): Headers {
  const keys = getStoredUserApiKeys();
  const headers = new Headers(extra || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (keys.geminiApiKey) {
    headers.set('x-gemini-api-key', keys.geminiApiKey);
  }
  if (keys.openaiApiKey) {
    headers.set('x-openai-api-key', keys.openaiApiKey);
  }
  return headers;
}

/**
 * When the Android WebView loads file:///android_asset/www, relative /api/*
 * calls fail — point them at the hosted backend instead.
 */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const isFile =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || window.location.href.startsWith('file:'));
  if (isFile) {
    const base =
      (import.meta as any).env?.VITE_API_BASE_URL ||
      'https://ais-dev-w2binvk2xubv33mu5zckcv-719483441136.us-west2.run.app';
    return `${String(base).replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return path;
}

/** Drop-in fetch that attaches the user's Gemini / OpenAI keys. */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = buildApiAuthHeaders(init?.headers);
  const resolved =
    typeof input === 'string' ? resolveApiUrl(input) : input instanceof URL ? resolveApiUrl(input.toString()) : input;
  return fetch(resolved, { ...init, headers });
}

export type KeyVerifyStatus = {
  ok: boolean;
  skipped?: boolean;
  model?: string;
  error?: string;
};

export type VerifyKeysResult = {
  ok: boolean;
  gemini: KeyVerifyStatus;
  openai: KeyVerifyStatus;
  source: 'server' | 'direct';
};

/** Direct browser check for Gemini (fallback if /api/verify-keys is unavailable). */
async function verifyGeminiDirect(apiKey: string): Promise<KeyVerifyStatus> {
  const models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-1.5-flash'];
  let lastErr = '';
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
          generationConfig: { temperature: 0 },
        }),
      });
      if (res.ok) {
        return { ok: true, model };
      }
      const body = await res.text().catch(() => '');
      lastErr = body.slice(0, 200) || `HTTP ${res.status}`;
      if (res.status === 400 || res.status === 403 || res.status === 401) {
        break;
      }
    } catch (e: any) {
      lastErr = e?.message || String(e);
    }
  }
  const msg = lastErr.toLowerCase();
  if (msg.includes('api key') || msg.includes('invalid') || msg.includes('permission')) {
    return { ok: false, error: 'کلید Gemini نامعتبر است یا دسترسی ندارد.' };
  }
  return { ok: false, error: lastErr || 'اتصال مستقیم به Gemini برقرار نشد.' };
}

async function verifyOpenAiDirect(apiKey: string): Promise<KeyVerifyStatus> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'کلید OpenAI نامعتبر است.' };
    }
    if (res.status === 429) {
      return { ok: false, error: 'سهمیه OpenAI محدود شده. کمی بعد دوباره امتحان کنید.' };
    }
    // CORS often blocks browser→OpenAI; treat opaque network errors below
    const body = await res.text().catch(() => '');
    return { ok: false, error: body.slice(0, 160) || `OpenAI HTTP ${res.status}` };
  } catch (e: any) {
    return {
      ok: false,
      error:
        'مرورگر اجازه تماس مستقیم با OpenAI را نداد. سرور تأیید کلید در دسترس نیست — بعداً دوباره تلاش کنید یا از نسخه آنلاین استفاده کنید.',
    };
  }
}

/**
 * Probe live connectivity for Gemini (required) and OpenAI (if provided).
 * Prefers backend /api/verify-keys; falls back to direct calls when needed.
 */
export async function verifyApiKeys(keys: {
  geminiApiKey: string;
  openaiApiKey?: string;
}): Promise<VerifyKeysResult> {
  const geminiApiKey = String(keys.geminiApiKey || '').trim();
  const openaiApiKey = String(keys.openaiApiKey || '').trim();

  if (geminiApiKey.length < 20) {
    return {
      ok: false,
      source: 'direct',
      gemini: { ok: false, error: 'کلید Gemini خیلی کوتاه است.' },
      openai: openaiApiKey ? { ok: false, skipped: false } : { ok: true, skipped: true },
    };
  }

  try {
    const res = await fetch(resolveApiUrl('/api/verify-keys'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': geminiApiKey,
        ...(openaiApiKey ? { 'x-openai-api-key': openaiApiKey } : {}),
      },
      body: JSON.stringify({ geminiApiKey, openaiApiKey }),
    });

    // Older hosted backends may not have this route yet
    if (res.status !== 404 && res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      if (data && data.gemini) {
        return {
          ok: Boolean(data.ok),
          source: 'server',
          gemini: data.gemini,
          openai: data.openai || { ok: !openaiApiKey, skipped: !openaiApiKey },
        };
      }
    }
  } catch (e) {
    console.warn('verify-keys via server failed, trying direct:', e);
  }

  const gemini = await verifyGeminiDirect(geminiApiKey);
  const openai = openaiApiKey
    ? await verifyOpenAiDirect(openaiApiKey)
    : { ok: true, skipped: true };

  return {
    ok: gemini.ok && openai.ok,
    source: 'direct',
    gemini,
    openai,
  };
}
