import React from 'react';
import { User } from 'firebase/auth';
import {
  X,
  User as UserIcon,
  LogOut,
  Award,
  Sparkles,
  Brain,
  Mic,
  Flame,
  ShieldCheck,
  Download,
  KeyRound,
  TrendingUp,
  Globe,
  ChevronLeft,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { AIPersona, AssessmentResult, UserProgress, TabType } from '../types';
import { playChimeSound } from '../utils/audio';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  assessment: AssessmentResult;
  progress: UserProgress;
  onOpenAssessment: () => void;
  persona: AIPersona;
  onOpenPersona: () => void;
  onOpenApiKeys: () => void;
  onOpenPWA: () => void;
  isOnline: boolean;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const MobileMenuDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onLogout,
  assessment,
  progress,
  onOpenAssessment,
  persona,
  onOpenPersona,
  onOpenApiKeys,
  onOpenPWA,
  isOnline,
  activeTab,
  onSelectTab,
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] font-fa animate-in fade-in duration-200">
      {/* Dark backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content sliding from right (RTL start) */}
      <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-en font-black text-white text-base tracking-tight">NativeSpeak</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-en">
                  AI Coach
                </span>
              </div>
              <p className="text-[10px] text-slate-400">تقویت مکالمه و لهجه امریکن</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
            title="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">

          {/* 1. Account Section */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
              <span>حساب کاربری و همگام‌سازی ابری</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  currentUser ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>

            {currentUser ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-xs truncate">
                      {currentUser.displayName || 'کاربر گرامی'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-en truncate">
                      {currentUser.email}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 shrink-0" />
                      <span>متصل به سرور ابری گوگل</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج از حساب</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  اکنون در <strong className="text-amber-300">حالت مهمان</strong> هستید و داده‌ها روی همین گوشی ذخیره می‌شوند. برای بک‌آپ ابری و استفاده در کامپیوتر وارد شوید:
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-98"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>ورود با گوگل یا ایمیل</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. CEFR Level & Placement Diagnostic */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>سطح مکالمه شما (CEFR)</span>
              </span>
              <span className="font-en font-black px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-white text-xs">
                {assessment.completed
                  ? `Level ${assessment.cefrLevel}`
                  : progress.cefrLevel && progress.cefrLevel !== 'B1'
                  ? `Level ${progress.cefrLevel}`
                  : 'تعیین سطح نشده'}
              </span>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              {assessment.completed
                ? 'سناریوهای روزانه شما بر اساس نقاط ضعف تعیین سطح شخصی‌سازی شده‌اند.'
                : 'با آزمون صوتی ۳ دقیقه‌ای، لهجه و گرامر خود را بسنجید تا برنامه اختصاصی دریافت کنید.'}
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenAssessment();
              }}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Mic className="w-3.5 h-3.5 text-amber-300" />
              <span>{assessment.completed ? 'تکرار آزمون تعیین سطح 🎙️' : 'شروع آزمون تعیین سطح 🎙️'}</span>
            </button>
          </div>

          {/* 3. AI Persona & Coach */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0 p-1 rounded-xl bg-slate-700/50">{persona.avatar}</span>
              <div className="min-w-0">
                <div className="font-bold text-white text-xs truncate">
                  مربی: {persona.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {persona.titleFa || persona.taglineFa || 'مربی اختصاصی شما'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenPersona();
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold shrink-0 transition"
            >
              تغییر مربی
            </button>
          </div>

          {/* 4. Daily Streak & Practice Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-xs">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>زنجیره تمرین</span>
              </div>
              <div className="font-en font-black text-xl text-white">
                {progress.streakDays} <span className="text-[10px] font-normal text-slate-400">روز</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-cyan-400 font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>مکالمه امروز</span>
              </div>
              <div className="font-en font-black text-xl text-white">
                {progress.todayMinutesSpoken || 0} <span className="text-[10px] font-normal text-slate-400">دقیقه</span>
              </div>
            </div>
          </div>

          {/* 5. PWA Install & Mobile App */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>نصب نسخه موبایل (PWA)</span>
              </span>
              {isInstalled ? (
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/20">
                  نصب شده ✓
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {isInstalled
                ? 'اپلیکیشن روی این دستگاه نصب است و مانند یک برنامه بومی کار می‌کند.'
                : 'برای دسترسی سریع بدون نوار مرورگر، این اپلیکیشن را به صفحه اصلی گوشی اضافه کنید.'}
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenPWA();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>{isInstalled ? 'مشاهده راهنمای PWA' : 'نصب و افزودن به صفحه اصلی'}</span>
            </button>
          </div>

          {/* 6. Advanced API Keys (Optional) */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-slate-200 text-[11px]">تنظیمات API (پیشرفته)</div>
                <div className="text-[9px] text-slate-500 truncate">هوش مصنوعی سرور فعال است</div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenApiKeys();
              }}
              className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition"
            >
              تنظیمات
            </button>
          </div>

          {/* 7. Quick Navigation Links */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 px-1 mb-1">بخش‌های اصلی برنامه:</div>
            
            <button
              onClick={() => {
                onSelectTab('speaking');
                onClose();
                playChimeSound('ding');
              }}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                activeTab === 'speaking'
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-400" />
                <span>۱. مکالمه صوتی و سناریوها</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => {
                onSelectTab('leitner');
                onClose();
                playChimeSound('ding');
              }}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                activeTab === 'leitner'
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>۲. جعبه لایتنر هوشمند کلمات</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => {
                onSelectTab('practice');
                onClose();
                playChimeSound('ding');
              }}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                activeTab === 'practice'
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>۳. تمرین‌های هدفمند و نقاط ضعف</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => {
                onSelectTab('progress');
                onClose();
                playChimeSound('ding');
              }}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition ${
                activeTab === 'progress'
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>۴. تقویم پیشرفت و چک‌لیست C2</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center text-[10px] text-slate-500 shrink-0">
          NativeSpeak AI · مربی هوشمند لهجه و مکالمه امریکن
        </div>
      </div>
    </div>
  );
};
