import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share2, PlusSquare, Globe } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-fa">
        <CheckCircle className="w-3 h-3" />
        <span>نسخه نصبی</span>
      </span>
    );
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        data-pwa-button="true"
        onClick={handleButtonClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition"
        title="نصب اپلیکیشن روی گوشی (PWA)"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="font-fa font-bold">نصب روی گوشی</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 md:p-6 shadow-2xl text-slate-100 font-fa space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-white">
                    نصب NativeSpeak AI روی گوشی
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    استفاده بدون نیاز به دانلود از استور با آیکون اختصاصی
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Trigger Button if installable */}
            {isInstallable && (
              <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <div className="font-bold text-cyan-300">نصب خودکار آماده است!</div>
                  <div className="text-slate-300 text-[11px]">با یک کلیک اپلیکیشن به صفحه گوشی شما اضافه می‌شود.</div>
                </div>
                <button
                  onClick={async () => {
                    await install();
                    setShowModal(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90 text-white font-bold text-xs shrink-0 shadow-md active:scale-95 transition"
                >
                  نصب مستقیم
                </button>
              </div>
            )}

            {/* OS Tabs */}
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'android'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>اندروید (Chrome / Samsung)</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>آیفون و آیپد (Safari)</span>
              </button>
            </div>

            {/* Tab 1: Android Instructions */}
            {activeTab === 'android' && (
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ۱
                  </span>
                  <p className="leading-relaxed">
                    در مرورگر <strong>Google Chrome</strong> دکمه سه‌نقطه (<strong>⋮</strong>) در گوشه بالای صفحه را بزنید.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ۲
                  </span>
                  <p className="leading-relaxed">
                    گزینه <strong>«افزودن به صفحه اصلی»</strong> یا <strong>«Install app / Add to Home screen»</strong> را انتخاب نمایید.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ۳
                  </span>
                  <p className="leading-relaxed">
                    روی <strong>Install</strong> بزنید. اپ مانند یک برنامه بومی اندروید بدون نوار مرورگر اجرا خواهد شد.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ۱
                  </span>
                  <p className="leading-relaxed flex items-center gap-1.5 flex-wrap">
                    در مرورگر <strong>Safari</strong> دکمه اشتراک‌گذاری 
                    <Share2 className="w-3.5 h-3.5 text-indigo-400 inline" /> 
                    (Share) در نوار پایین را بزنید.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ۲
                  </span>
                  <p className="leading-relaxed flex items-center gap-1.5 flex-wrap">
                    به پایین اسکرول کرده و گزینه 
                    <PlusSquare className="w-3.5 h-3.5 text-indigo-400 inline" /> 
                    <strong>«Add to Home Screen»</strong> را انتخاب کنید.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ۳
                  </span>
                  <p className="leading-relaxed">
                    دکمه <strong>Add</strong> در گوشه بالا راست را بزنید تا برنامه با آیکون رسمی روی صفحه شما نصب شود.
                  </p>
                </div>
              </div>
            )}

            {/* Footer Benefit Note */}
            <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>پشتیبانی از صدای زنده، ذخیره لایتنر در ابری Firestore و کارکرد بدون نیاز به فیلترشکن.</span>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 active:scale-98 transition shadow-lg shadow-indigo-600/20"
            >
              بستن پنجره
            </button>
          </div>
        </div>
      )}
    </>
  );
};
