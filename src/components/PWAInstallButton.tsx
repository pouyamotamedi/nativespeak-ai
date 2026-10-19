import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition"
        title="نصب اپلیکیشن اندروید روی گوشی"
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>نصب اپلیکیشن</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium hover:bg-slate-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>نصب در iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 font-fa">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  نصب روی آیفون / آیپد
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                ۱. دکمه <strong>Share</strong> (مربع با فلش رو به بالا) را در نوار پایین مرورگر سافاری لمس کنید.<br />
                ۲. به پایین اسکرول کرده و گزینه <strong>Add to Home Screen</strong> را انتخاب کنید.<br />
                ۳. دکمه <strong>Add</strong> را در گوشه بالا بزنید تا آیکون اپ روی صفحه شما قرار گیرد.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 active:scale-98 transition"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
