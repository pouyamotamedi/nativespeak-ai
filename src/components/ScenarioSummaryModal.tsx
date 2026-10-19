import React from 'react';
import { ScenarioSummary } from '../types';
import {
  CheckCircle2,
  Award,
  Sparkles,
  Volume2,
  AlertCircle,
  Plus,
  X,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { playAudioText, playChimeSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete?: () => void;
  summary: ScenarioSummary | null;
  onAddClicheToPractice: (cliche: string, meaningFa: string) => void;
  onGenerateAdaptiveScenario?: () => void;
}

export const ScenarioSummaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirmComplete,
  summary,
  onAddClicheToPractice,
  onGenerateAdaptiveScenario,
}) => {
  if (!isOpen || !summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-fa animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-indigo-500/40 p-5 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                کارنامه مربی‌گری و گزارش پایان سناریو
              </h3>
              <p className="text-[10px] text-slate-400">{summary.scenarioTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/60 border border-indigo-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">نمره تسلط و روانی کلام در این سناریو:</span>
            <span className="text-[10px] text-slate-400">سنجش گرامر، لهجه امریکن و استفاده از کلیشه‌های نیتیو</span>
          </div>
          <span className="text-xl font-black font-en text-cyan-300">{summary.overallScore}%</span>
        </div>

        {/* Strengths */}
        {summary.strengths && summary.strengths.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              نقاط قوت مشاهده‌شده در مکالمه:
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-1 text-xs text-slate-200">
              {summary.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Errors & Native Corrections */}
        {summary.keyErrors && summary.keyErrors.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              اشتباهات کلیدی و نحوه بیان نیتیو آمریکایی:
            </div>
            <div className="space-y-2">
              {summary.keyErrors.map((err, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs space-y-1">
                  <div className="font-en text-red-400 line-through">"{err.original}"</div>
                  <div className="font-en text-emerald-400 font-semibold flex items-center justify-between">
                    <span>➔ "{err.corrected}"</span>
                    <button
                      onClick={() => playAudioText(err.corrected)}
                      className="text-slate-400 hover:text-white p-1"
                      title="شنیدن تلفظ صحیح"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 font-fa">{err.explanationFa}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cliches Learned */}
        {summary.clichesLearned && summary.clichesLearned.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              کلیشه‌ها و اصطلاحات کلیدی این درس:
            </div>
            <div className="space-y-1.5">
              {summary.clichesLearned.map((cliche, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between"
                >
                  <div>
                    <span className="font-en font-bold text-white text-xs mr-2">{cliche.english}</span>
                    <span className="text-slate-400 text-[11px]">{cliche.persian}</span>
                  </div>
                  <button
                    onClick={() => {
                      onAddClicheToPractice(cliche.english, cliche.persian);
                      playChimeSound('success');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition shadow"
                  >
                    <Plus className="w-3 h-3" />
                    <span>افزودن به تمرینات</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pronunciation & Acoustic Takeaways */}
        {summary.pronunciationNotes && summary.pronunciationNotes.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs">
            <span className="text-[11px] font-bold text-cyan-300 block">🎙️ یادآوری‌های تلفظ و لهجه امریکن:</span>
            {summary.pronunciationNotes.map((note, idx) => (
              <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                <span className="text-cyan-400">•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}

        {/* Weakness Database Impact & Systematic Cross-Scenario Remediation */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 space-y-2 text-xs">
          <div className="font-bold text-cyan-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>به‌روزرسانی خودکار دیتابیس نقاط ضعف و درس‌های آینده:</span>
          </div>

          {summary.weaknessesImproved && summary.weaknessesImproved.length > 0 && (
            <div className="text-emerald-300 text-[11px] flex items-start gap-1">
              <span className="font-bold">✓ بهبود ثبت شد:</span>
              <span>{summary.weaknessesImproved.join('، ')} (افزایش امتیاز تسلط)</span>
            </div>
          )}

          {summary.newWeaknessesAdded && summary.newWeaknessesAdded.length > 0 && (
            <div className="text-amber-300 text-[11px] flex items-start gap-1">
              <span className="font-bold">⚠️ ثبت نقطه ضعف جدید:</span>
              <span>{summary.newWeaknessesAdded.join('، ')} (به تقویم سناریوهای آینده اضافه شد)</span>
            </div>
          )}

          {summary.futureRemediationPlanFa && (
            <div className="text-slate-300 text-[11px] pt-1 border-t border-indigo-500/20">
              <span className="font-bold text-indigo-300">طرح درس برای سناریوی بعد: </span>
              {summary.futureRemediationPlanFa}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="space-y-2 pt-1">
          {onGenerateAdaptiveScenario && (
            <button
              onClick={() => {
                onGenerateAdaptiveScenario();
                playChimeSound('levelUp');
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-slate-950" />
              <span>تولید سناریوی تقویم اختصاصی برای تمرین مجدد این ضعف‌ها</span>
            </button>
          )}

          {onConfirmComplete ? (
            <button
              onClick={onConfirmComplete}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition border border-emerald-400/40"
            >
              تأیید اتمام درس و رفتن به سناریوی بعدی
            </button>
          ) : null}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
          >
            {onConfirmComplete ? 'بازگشت به مکالمه و ادامه تمرین' : 'ذخیره کارنامه و بازگشت به مکالمه'}
          </button>
        </div>
      </div>
    </div>
  );
};
