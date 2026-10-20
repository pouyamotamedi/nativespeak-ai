import React, { useState } from 'react';
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
} from '../utils/firebase';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Copy,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  canDismiss = true,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setUnauthorizedDomain(null);
    try {
      const user = await signInWithGoogle();
      playChimeSound('levelUp');
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      if (err.code === 'auth/redirect-pending') {
        setErrorMsg('در حال انتقال به صفحه ورود گوگل… اگر صفحه عوض نشد، با ایمیل وارد شوید.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('پنجره ورود توسط شما بسته شد.');
      } else if (err.code === 'auth/operation-not-supported-in-this-environment') {
        setErrorMsg(
          err.message ||
            'ورود با گوگل در این محیط کار نمی‌کند. لطفاً با ایمیل و رمز عبور وارد / ثبت‌نام کنید.'
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(currentHost);
        setErrorMsg('دامنه این برنامه هنوز در کنسول فایربیس مجاز نشده است.');
      } else {
        setErrorMsg(
          `خطا در ورود با گوگل${err.code ? ` (${err.code})` : ''}. لطفاً با ایمیل و رمز عبور امتحان کنید.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('لطفاً ایمیل و رمز عبور را وارد کنید.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'register') {
        const user = await registerWithEmail(email, password, displayName);
        playChimeSound('levelUp');
        onSuccess(user);
        onClose();
      } else {
        const user = await signInWithEmail(email, password);
        playChimeSound('levelUp');
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.warn('Email auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('این ایمیل قبلاً ثبت‌نام شده است. لطفاً حالت «ورود» را انتخاب کنید.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg(
          mode === 'login'
            ? 'ایمیل یا رمز عبور اشتباه است. اگر هنوز حساب نساخته‌اید، تب «ثبت‌نام جدید» را انتخاب کنید.'
            : 'ایمیل یا رمز عبور نامعتبر است.'
        );
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('فرمت آدرس ایمیل نامعتبر است.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg(
          'روش ورود با ایمیل و رمز عبور در کنسول فایربیس فعال نیست. لطفاً در بخش Authentication > Sign-in method گزینه Email/Password را فعال کنید.'
        );
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('اتصال شبکه برقرار نشد. اینترنت یا VPN را بررسی کرده و مجدداً امتحان کنید.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('تعداد تلاش‌های ناموفق زیاد بوده است. لطفاً چند دقیقه صبر کنید.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('رمز عبور باید حداقل ۶ کاراکتر قوی‌تر باشد.');
      } else {
        setErrorMsg(
          `خطا در احراز هویت${err.code ? ` (${err.code})` : ''}. لطفاً دوباره امتحان کنید.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyDomainToClipboard = () => {
    if (!unauthorizedDomain) return;
    navigator.clipboard.writeText(unauthorizedDomain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-fa animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl space-y-4 my-auto relative">
        {canDismiss && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {mode === 'login' ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری جدید'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            برای همگام‌سازی ابری اطلاعات، نقاط ضعف و پیشرفت آموزشی وارد شوید.
          </p>
        </div>

        {/* Google One-Click Login */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-md active:scale-98 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>ورود سریع با اکانت گوگل (Google)</span>
        </button>

        {/* Helpful Guidance Card when Domain is not authorized */}
        {unauthorizedDomain && (
          <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">
                  دامنه پیش‌نمایش در فایربیس مجاز نشده است
                </p>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  گوگل برای امنیت، اجازه ورود از دامنه‌های ثبت‌نشده را نمی‌دهد. برای حل دائمی، دامنه زیر را در بخش Authorized Domains فایربیس اضافه کنید:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/30 rounded-xl p-2 font-en text-[11px] text-cyan-300">
              <span className="flex-1 truncate select-all">{unauthorizedDomain}</span>
              <button
                type="button"
                onClick={copyDomainToClipboard}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition"
              >
                {copiedDomain ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'کپی شد' : 'کپی'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <a
                href="https://console.firebase.google.com/project/crucial-firmament-sw2pc/authentication/settings"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
              >
                <span>باز کردن تنظیمات فایربیس</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setUnauthorizedDomain(null);
                }}
                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition shadow"
              >
                یا ثبت‌نام با ایمیل (فوری)
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <div className="flex-1 h-px bg-slate-800" />
          <span>یا با ایمیل و پسورد</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Clear Segmented Switch for Login vs Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/90 rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>ورود به حساب</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>ثبت‌نام جدید</span>
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">نام شما:</label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="مثال: علی یا Sara"
                  className="w-full py-2.5 px-3 pl-9 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">آدرس ایمیل:</label>
            <div className="relative">
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full py-2.5 px-3 pl-9 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-en"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">رمز عبور:</label>
            <div className="relative">
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                className="w-full py-2.5 px-3 pl-9 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-en"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-[11px] text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {isLoading ? (
              <span>در حال برقراری ارتباط...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'ورود به حساب' : 'ثبت‌نام و ایجاد حساب'}</span>
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-1 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          {mode === 'login' ? (
            <p>
              حساب کاربری ندارید؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className="text-cyan-400 hover:underline font-bold"
              >
                ثبت‌نام کنید
              </button>
            </p>
          ) : (
            <p>
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-cyan-400 hover:underline font-bold"
              >
                وارد شوید
              </button>
            </p>
          )}

          {/* Continue as Guest Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700/60"
          >
            <span>ادامه به عنوان مهمان (استفاده محلی)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
