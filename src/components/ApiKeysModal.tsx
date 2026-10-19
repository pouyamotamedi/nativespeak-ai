import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wifi,
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';
import {
  getStoredUserApiKeys,
  hasRequiredApiKeys,
  saveStoredUserApiKeys,
  verifyApiKeys,
  type KeyVerifyStatus,
} from '../utils/userApiKeys';

interface Props {
  isOpen: boolean;
  canDismiss?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type ProbeState = 'idle' | 'checking' | 'ok' | 'fail' | 'skip';

function StatusBadge({ state, label }: { state: ProbeState; label?: string }) {
  if (state === 'idle') return null;
  if (state === 'checking') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300">
        <Loader2 className="w-3 h-3 animate-spin" />
        در حال تست اتصال…
      </span>
    );
  }
  if (state === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        {label || 'متصل شد'}
      </span>
    );
  }
  if (state === 'skip') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
        رد شد (اختیاری)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300">
      <AlertCircle className="w-3 h-3" />
      اتصال ناموفق
    </span>
  );
}

function statusFromResult(s?: KeyVerifyStatus, provided?: boolean): ProbeState {
  if (!provided) return 'skip';
  if (!s) return 'fail';
  if (s.skipped) return 'skip';
  return s.ok ? 'ok' : 'fail';
}

export const ApiKeysModal: React.FC<Props> = ({
  isOpen,
  canDismiss = false,
  onClose,
  onSaved,
}) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<ProbeState>('idle');
  const [openaiStatus, setOpenaiStatus] = useState<ProbeState>('idle');
  const [geminiDetail, setGeminiDetail] = useState<string | null>(null);
  const [openaiDetail, setOpenaiDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const stored = getStoredUserApiKeys();
    setGeminiKey(stored.geminiApiKey);
    setOpenaiKey(stored.openaiApiKey);
    setErrorMsg(null);
    setSuccessMsg(null);
    setGeminiStatus('idle');
    setOpenaiStatus('idle');
    setGeminiDetail(null);
    setOpenaiDetail(null);
    setIsChecking(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyAndSave = async () => {
    const gemini = geminiKey.trim();
    const openai = openaiKey.trim();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (gemini.length < 20) {
      setErrorMsg('کلید Gemini الزامی است. آن را از Google AI Studio بسازید و اینجا وارد کنید.');
      setGeminiStatus('fail');
      return;
    }

    setIsChecking(true);
    setGeminiStatus('checking');
    setOpenaiStatus(openai ? 'checking' : 'skip');
    setGeminiDetail(null);
    setOpenaiDetail(null);

    try {
      const result = await verifyApiKeys({ geminiApiKey: gemini, openaiApiKey: openai });

      setGeminiStatus(statusFromResult(result.gemini, true));
      setOpenaiStatus(statusFromResult(result.openai, Boolean(openai)));
      setGeminiDetail(result.gemini.ok ? result.gemini.model || null : result.gemini.error || null);
      setOpenaiDetail(
        result.openai.ok || result.openai.skipped ? null : result.openai.error || null
      );

      if (!result.gemini.ok) {
        setErrorMsg(
          result.gemini.error ||
            'کلید Gemini به API وصل نشد. کلید را دوباره از AI Studio کپی کنید.'
        );
        return;
      }

      if (openai && !result.openai.ok) {
        setErrorMsg(
          result.openai.error ||
            'کلید OpenAI / ChatGPT به API وصل نشد. کلید را بررسی کنید یا فیلد را خالی بگذارید.'
        );
        return;
      }

      saveStoredUserApiKeys({ geminiApiKey: gemini, openaiApiKey: openai });
      const parts = [
        `Gemini وصل شد${result.gemini.model ? ` (${result.gemini.model})` : ''}`,
      ];
      if (openai) parts.push('OpenAI / Whisper وصل شد');
      setSuccessMsg(parts.join(' · '));
      playChimeSound('success');
      // Brief success flash then continue
      setTimeout(() => onSaved(), 450);
    } catch (err: any) {
      setGeminiStatus('fail');
      if (openai) setOpenaiStatus('fail');
      setErrorMsg(err?.message || 'خطا در بررسی اتصال. اینترنت را چک کنید و دوباره تلاش کنید.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-fa">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-cyan-500/40 p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">کلیدهای API شما</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مرحله ۲ از ۳ — اتصال واقعی به API قبل از تعیین سطح بررسی می‌شود
              </p>
            </div>
          </div>
          {canDismiss || hasRequiredApiKeys() ? (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>کلیدها فقط روی همین دستگاه ذخیره می‌شوند</span>
          </div>
          <p>
            با زدن دکمه پایین، یک درخواست تست واقعی به Gemini و (در صورت وارد کردن) OpenAI
            فرستاده می‌شود. فقط اگر اتصال موفق باشد اجازه ادامه دارید.
          </p>
        </div>

        {/* Gemini */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-white">
              ۱) کلید Gemini <span className="text-rose-400">(الزامی)</span>
            </label>
            <div className="flex items-center gap-2">
              <StatusBadge
                state={geminiStatus}
                label={geminiDetail && geminiStatus === 'ok' ? `OK · ${geminiDetail}` : undefined}
              />
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-200"
              >
                ساخت کلید
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="relative">
            <input
              type={showGemini ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                setGeminiStatus('idle');
                setSuccessMsg(null);
              }}
              placeholder="AIza..."
              disabled={isChecking}
              className={`w-full py-2.5 px-3 pr-10 rounded-xl bg-slate-800 border text-slate-100 text-xs font-en focus:outline-none focus:border-cyan-500 disabled:opacity-60 ${
                geminiStatus === 'ok'
                  ? 'border-emerald-500/50'
                  : geminiStatus === 'fail'
                  ? 'border-rose-500/50'
                  : 'border-slate-700'
              }`}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowGemini((v) => !v)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {geminiStatus === 'fail' && geminiDetail && (
            <p className="text-[10px] text-rose-300 leading-relaxed">{geminiDetail}</p>
          )}
        </div>

        {/* OpenAI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-white">
              ۲) کلید OpenAI / ChatGPT <span className="text-amber-300/90">(برای Whisper)</span>
            </label>
            <div className="flex items-center gap-2">
              <StatusBadge state={openaiStatus} />
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-cyan-200"
              >
                ساخت کلید
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="relative">
            <input
              type={showOpenai ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => {
                setOpenaiKey(e.target.value);
                setOpenaiStatus('idle');
                setSuccessMsg(null);
              }}
              placeholder="sk-..."
              disabled={isChecking}
              className={`w-full py-2.5 px-3 pr-10 rounded-xl bg-slate-800 border text-slate-100 text-xs font-en focus:outline-none focus:border-cyan-500 disabled:opacity-60 ${
                openaiStatus === 'ok'
                  ? 'border-emerald-500/50'
                  : openaiStatus === 'fail'
                  ? 'border-rose-500/50'
                  : 'border-slate-700'
              }`}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowOpenai((v) => !v)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {openaiStatus === 'fail' && openaiDetail && (
            <p className="text-[10px] text-rose-300 leading-relaxed">{openaiDetail}</p>
          )}
          <p className="text-[10px] text-slate-500">
            اگر وارد کنید، حتماً باید تست اتصال موفق شود. خالی بگذارید تا فقط با Gemini ادامه دهید.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-[11px] text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleVerifyAndSave}
          disabled={isChecking}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال تست اتصال به API…
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              بررسی اتصال و ادامه به تعیین سطح
            </>
          )}
        </button>
      </div>
    </div>
  );
};
