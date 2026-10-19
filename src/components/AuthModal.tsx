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

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
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
        setErrorMsg('دامنه اپ در Firebase مجاز نیست. فعلاً با ایمیل و رمز عبور وارد شوید.');
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
        setErrorMsg('این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد شوید.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('ایمیل یا رمز عبور واردشده صحیح نمی‌باشد.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('فرمت ایمیل نامعتبر است.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('اتصال اینترنت برقرار نیست. VPN/شبکه را چک کنید و دوباره تلاش کنید.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('تعداد تلاش‌ها زیاد بوده. چند دقیقه صبر کنید و دوباره امتحان کنید.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('رمز عبور خیلی ضعیف است. حداقل ۶ کاراکتر قوی‌تر انتخاب کنید.');
      } else {
        setErrorMsg(
          `خطا در ورود${err.code ? ` (${err.code})` : ''}. لطفاً مجدداً امتحان کنید.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-fa animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl space-y-5 my-auto relative">
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
            ابتدا وارد شوید؛ بعد کلید API و سپس تعیین سطح صوتی انجام می‌شود.
          </p>
          {(typeof window !== 'undefined' &&
            (window.location.protocol === 'file:' || window.location.href.startsWith('file:'))) && (
            <p className="text-[11px] text-amber-300/90 leading-relaxed max-w-sm mx-auto bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2 mt-2">
              در نسخه APK، ورود با <span className="font-bold">ایمیل و رمز عبور</span> پایدارتر است. گوگل روی فایل محلی معمولاً کار نمی‌کند.
            </p>
          )}
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

        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <div className="flex-1 h-px bg-slate-800" />
          <span>یا با ایمیل و رمز عبور</span>
          <div className="flex-1 h-px bg-slate-800" />
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
        <div className="text-center pt-1 border-t border-slate-800 text-xs text-slate-400">
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
        </div>
      </div>
    </div>
  );
};
