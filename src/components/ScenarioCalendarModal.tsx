import React, { useState } from 'react';
import { CalendarScenario, WeaknessItem, Scenario } from '../types';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Lock,
  Play,
  X,
  AlertCircle,
  Award,
  ChevronRight,
  Flame,
  Layers,
  Compass,
  Filter,
  Volume2,
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  calendar: CalendarScenario[];
  activeScenario: Scenario;
  onSelectCalendarScenario: (scenario: CalendarScenario) => void;
  activeWeaknesses: WeaknessItem[];
  onGenerateAdaptiveScenario: () => void;
  cefrLevel?: string;
  onOpenAssessment?: () => void;
}

const CEFR_STAGES = [
  { level: 'A1-A2', titleFa: 'مقدماتی تا پیش‌متوسط', focusFa: 'الگوهای پایه و رفع ترس از صحبت' },
  { level: 'B1', titleFa: 'متوسط کاربردی', focusFa: 'روانی روزمره و حذف ترجمه مستقیم فارسی' },
  { level: 'B2', titleFa: 'متوسط رو به بالا', focusFa: 'مکالمات کاری، حل تعارض و استدلال' },
  { level: 'C1', titleFa: 'پیشرفته نیتیو', focusFa: 'کلیشه‌های عمیق فرهنگی و لهجه امریکن' },
  { level: 'C2', titleFa: 'استادی کامل (C2 Mastery)', focusFa: 'ظرافت‌های کنایی، شوخ‌طبعی و مذاکرات کلان' },
];

export const ScenarioCalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  calendar,
  activeScenario,
  onSelectCalendarScenario,
  activeWeaknesses,
  onGenerateAdaptiveScenario,
  cefrLevel = 'B1',
  onOpenAssessment,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'B1' | 'B2' | 'C1' | 'C2'>('all');

  if (!isOpen) return null;

  const completedCount = calendar.filter((c) => c.status === 'completed').length;
  const filteredCalendar = calendar.filter((item) => {
    if (levelFilter === 'all') return true;
    return (item.targetLevel || cefrLevel || 'B2') === levelFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md font-fa animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  طرح درس و تقویم سناریوها تا سطح C2 Native
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold font-en">
                  Level {cefrLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                مسیر آموزشی سناریومحور از سطح فعلی تا تسلط کامل مانند یک شهروند آمریکایی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roadmap Milestones Stepper to C2 */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
            <span>نقشه راه پیشرفت تا سطح استادی C2:</span>
            <span className="text-cyan-300 font-en">Target: C2 American Fluency</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center">
            {CEFR_STAGES.map((stg) => {
              const isCurrentLevel = cefrLevel.includes(stg.level) || (stg.level === 'B1' && cefrLevel === 'B1');
              return (
                <div
                  key={stg.level}
                  className={`p-1.5 rounded-xl border text-[10px] transition ${
                    isCurrentLevel
                      ? 'bg-indigo-600/30 border-indigo-400 text-white font-bold ring-1 ring-indigo-400/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-en font-black text-xs">{stg.level}</div>
                  <div className="truncate text-[9px] mt-0.5">{stg.titleFa}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weakness & Adaptive Engine Banner */}
        <div className="p-3.5 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-amber-950/40 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                نقاط ضعف تمرکزی شما در سناریوها:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {activeWeaknesses.slice(0, 3).map((w) => (
                <span
                  key={w.id}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200"
                >
                  🎯 {w.titleFa}
                </span>
              ))}
              {activeWeaknesses.length === 0 && (
                <span className="text-[10px] text-slate-400">هنوز نقطه ضعفی ثبت نشده است.</span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              onGenerateAdaptiveScenario();
              playChimeSound('success');
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition shadow-lg active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>تولید سناریوی جدید متناسب با ضعف‌ها</span>
          </button>
        </div>

        {/* Level Filters & Progress Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3 text-cyan-400" />
              فیلتر فاز:
            </span>
            {(['all', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition font-en ${
                  levelFilter === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl === 'all' ? 'همه سناریوها' : `Level ${lvl}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>پیشرفت:</span>
            <span className="font-en font-bold text-emerald-400">{completedCount}</span>
            <span>از</span>
            <span className="font-en font-bold text-white">{calendar.length} سناریو</span>
          </div>
        </div>

        {/* Calendar Scenario Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {calendar.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                🎯
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-bold text-white text-sm">هیچ سناریوی پیش‌فرضی وجود ندارد!</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  در نیتیو اسپیک سناریوهای تکراری یا پیش‌فرض حذف شده‌اند. همه درس‌ها دقیقاً بر اساس سطح، ضعف‌های تلفظی و لهجه شما طراحی می‌شوند.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAssessment) onOpenAssessment();
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>شروع تعیین سطح صوتی و طراحی سناریوها 🎙️</span>
              </button>
            </div>
          ) : (
            filteredCalendar.map((item) => {
              const isSelected = activeScenario.id === item.id;
              const isCompleted = item.status === 'completed';
              const isCurrent = item.status === 'current';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : isCurrent
                      ? 'bg-slate-800/95 border-amber-500/60 shadow-md ring-1 ring-amber-500/20'
                      : isCompleted
                      ? 'bg-slate-900/60 border-slate-800 opacity-90'
                      : 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Top Title & Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl p-2.5 rounded-2xl bg-slate-800 border border-slate-700/60 shrink-0">
                        {item.icon}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-indigo-400 font-en">
                            Day {item.dayIndex}
                          </span>
                          {item.targetLevel && (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-en font-bold">
                              {item.targetLevel}
                            </span>
                          )}
                          {item.phaseTitleFa && (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-fa">
                              {item.phaseTitleFa}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                              سناریوی امروز 🎯
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تکمیل‌شده {item.userScore ? `(${item.userScore}%)` : ''}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{item.titleFa}</h4>
                        <p className="text-xs text-slate-400 font-en">{item.title}</p>
                      </div>
                    </div>

                    {/* Launch Scenario Button */}
                    <button
                      onClick={() => {
                        onSelectCalendarScenario(item);
                        playChimeSound('ding');
                        onClose();
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-amber-400/20 shadow-md'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSelected ? 'سناریوی جاری' : 'شروع تمرین سناریو'}</span>
                    </button>
                  </div>

                  {/* Educational Objectives: Grammar, Clichés & Pronunciation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {/* Grammar Goal */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 space-y-1">
                      <span className="text-cyan-300 font-bold block text-[10px]">🎯 هدف آموزشی گرامر:</span>
                      <span className="text-[11px] leading-relaxed block text-slate-200">
                        {item.targetGrammarFa || item.targetGrammar}
                      </span>
                      {item.targetGrammarFa && (
                        <span className="text-[10px] font-en text-slate-400 block">
                          {item.targetGrammar}
                        </span>
                      )}
                    </div>

                    {/* Pronunciation & Accent Goal */}
                    <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 space-y-1">
                      <span className="text-indigo-300 font-bold block text-[10px]">🎙️ تمرکز لهجه و تلفظ امریکن:</span>
                      <span className="text-[11px] leading-relaxed block text-slate-200">
                        {item.targetPronunciation}
                      </span>
                    </div>
                  </div>

                  {/* Target Native Clichés */}
                  {item.targetCliches && item.targetCliches.length > 0 && (
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300 block">💬 کلیشه‌ها و اصطلاحات کلیدی آمریکایی:</span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {item.targetCliches.map((cliche, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/20 font-medium"
                          >
                            {cliche}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Vocabulary */}
                  {item.targetVocabulary && item.targetVocabulary.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-300">لغات هدف:</span>
                      <span>{item.targetVocabulary.join(' • ')}</span>
                    </div>
                  )}

                  {/* Injected Weaknesses from database */}
                  {item.activeWeaknessesInjected && item.activeWeaknessesInjected.length > 0 && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-center gap-2">
                      <span className="font-bold shrink-0 text-[10px]">رفع نقطه ضعف اختصاصی شما:</span>
                      <span className="truncate text-[10px]">{item.activeWeaknessesInjected.join('، ')}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
