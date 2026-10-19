import React, { useState } from 'react';
import {
  CalendarScenario,
  WeaknessItem,
  UserProgress,
  PracticeGoals,
  AssessmentResult,
  Scenario,
} from '../types';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Volume2,
  Bell,
  Sliders,
  Sparkles,
  Flame,
  Award,
  Play,
  Clock,
  Layers,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { playChimeSound } from '../utils/audio';
import {
  requestNotificationPermission,
  sendBrowserNotification,
} from '../utils/notifications';

interface Props {
  calendar: CalendarScenario[];
  weaknesses: WeaknessItem[];
  progress: UserProgress;
  goals: PracticeGoals;
  assessment: AssessmentResult;
  onUpdateGoals: (goals: PracticeGoals) => void;
  onLaunchScenario: (scenario: Scenario) => void;
  onRetakeAssessment: () => void;
}

export const ProgressScreen: React.FC<Props> = ({
  calendar,
  weaknesses,
  progress,
  goals,
  assessment,
  onUpdateGoals,
  onLaunchScenario,
  onRetakeAssessment,
}) => {
  const [activeSection, setActiveSection] = useState<'calendar' | 'weaknesses' | 'analytics' | 'reminders'>('calendar');
  const [weaknessFilter, setWeaknessFilter] = useState<'active' | 'mastered'>('active');
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [editedGoals, setEditedGoals] = useState<PracticeGoals>(goals);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Filter weaknesses
  const displayedWeaknesses = weaknesses.filter((w) =>
    weaknessFilter === 'active' ? w.status !== 'mastered' : w.status === 'mastered'
  );

  const handleSaveGoals = () => {
    onUpdateGoals(editedGoals);
    setIsEditingGoals(false);
    playChimeSound('success');
  };

  const handleTestReminder = async () => {
    await requestNotificationPermission();
    playChimeSound('levelUp');
    sendBrowserNotification('🎙️ یادآور تمرین NativeSpeak AI', {
      body: `سلام! وقت تمرین ${goals.dailySpeakingMinutesTarget} دقیقه‌ای امروزت فرا رسیده. بیا با هم گپ بزنیم!`,
    });
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-fa p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            پیشرفت، تقویم سناریوها و دیتابیس نقاط ضعف
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            برنامه یادگیری تطبیقی، ردیابی ضعف‌ها و تحلیل تلفظ امریکن
          </p>
        </div>

        {/* CEFR Level Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold font-en">
            CEFR: {assessment?.cefrLevel || progress.cefrLevel || 'B1'}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-en">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{progress.streakDays}d</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation bar */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
        <button
          onClick={() => setActiveSection('calendar')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'calendar'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📅 تقویم سناریوها
        </button>
        <button
          onClick={() => setActiveSection('weaknesses')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'weaknesses'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🔍 دیتابیس ضعف‌ها
        </button>
        <button
          onClick={() => setActiveSection('analytics')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 آمار و اکسنت
        </button>
        <button
          onClick={() => setActiveSection('reminders')}
          className={`py-2 rounded-xl transition ${
            activeSection === 'reminders'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ⏰ اهداف و یادآور
        </button>
      </div>

      {/* 1. SCENARIO CALENDAR SECTION */}
      {activeSection === 'calendar' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>برنامه تطبیقی سناریوها (Scenario Calendar)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                موضوعات هر روز مشخص است، اما هوش مصنوعی مکالمات هر سناریو را هوشمندانه طوری شخصی‌سازی می‌کند که نقاط ضعف فعال شما را به چالش بکشد.
              </p>
            </div>
            <button
              onClick={onRetakeAssessment}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium shrink-0 border border-slate-700"
            >
              تعیین سطح مجدد
            </button>
          </div>

          {/* Calendar Scenario List */}
          <div className="space-y-3">
            {calendar.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3 my-auto">
                <div className="text-3xl">🗓️</div>
                <h4 className="text-sm font-bold text-white">هنوز سناریویی ثبت نشده است</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  سناریوهای نیتیو اسپیک بر اساس تعیین سطح صوتی اولیه و نقاط ضعف واقعی صدای شما تا سطح C2 طراحی خواهند شد.
                </p>
                <button
                  onClick={onRetakeAssessment}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs shadow-md transition"
                >
                  شروع تعیین سطح صوتی و طراحی تقویم 🎙️
                </button>
              </div>
            ) : (
              calendar.map((item) => {
                const isCurrent = item.status === 'current';
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.id}
                  className={`p-4 rounded-3xl border transition space-y-3 ${
                    isCurrent
                      ? 'bg-indigo-950/50 border-indigo-500 shadow-xl shadow-indigo-500/10'
                      : isCompleted
                      ? 'bg-slate-900/90 border-slate-800'
                      : 'bg-slate-900/50 border-slate-800/80 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-2xl bg-slate-800 border border-slate-700/60 shadow-inner">
                        {item.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.titleFa}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              سناریوی امروز
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                              انجام شده ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-en mt-0.5">{item.title}</div>
                      </div>
                    </div>

                    <span className="text-xs font-black text-indigo-400 font-en">
                      Day {item.dayIndex}
                    </span>
                  </div>

                  {/* Context & Relationship metadata */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50">
                    <div>
                      <span className="text-slate-400">موقعیت: </span>
                      <span className="text-slate-200 font-medium">{item.context}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">نوع رابطه: </span>
                      <span className="text-cyan-300 font-medium">{item.relationship}</span>
                    </div>
                  </div>

                  {/* Weaknesses Injected */}
                  {item.activeWeaknessesInjected && item.activeWeaknessesInjected.length > 0 && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">تمرکز ویژه روی نقاط ضعف شما: </span>
                        <span>{item.activeWeaknessesInjected.join('، ')}</span>
                      </div>
                    </div>
                  )}

                  {/* Target details */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700">
                      گرامر: {item.targetGrammar}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                      تلفظ: {item.targetPronunciation}
                    </span>
                  </div>

                  {/* Launch Button */}
                  <button
                    onClick={() => {
                      const scenarioObj: Scenario = {
                        id: item.id,
                        title: item.title,
                        titleFa: item.titleFa,
                        category: item.category as any,
                        userRole: item.userRole,
                        aiRole: item.aiRole,
                        relationship: item.relationship,
                        icon: item.icon,
                        starter: item.starter,
                        starterFa: item.starterFa,
                        descriptionFa: item.context,
                        clicheTag: item.targetCliches.join(' / '),
                        recommendedRegister: item.relationship.includes('Formal') ? 'formal' : 'casual',
                        activeWeaknessesInjected: item.activeWeaknessesInjected,
                      };
                      onLaunchScenario(scenarioObj);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>شروع تمرین این سناریو در اسپیکینگ</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    )}

      {/* 2. WEAKNESS DATABASE SECTION */}
      {activeSection === 'weaknesses' && (
        <div className="space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex gap-2">
              <button
                onClick={() => setWeaknessFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  weaknessFilter === 'active'
                    ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                🔴 نقاط ضعف فعال ({weaknesses.filter((w) => w.status !== 'mastered').length})
              </button>
              <button
                onClick={() => setWeaknessFilter('mastered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  weaknessFilter === 'mastered'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                🟢 نقاط ضعف حل‌شده و تثبیت‌شده ({weaknesses.filter((w) => w.status === 'mastered').length})
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            این دیتابیس پس از هر مکالمه آپدیت می‌شود. هر ضعفی که شناسایی شود در سناریوهای بعدی تمرین داده می‌شود و پس از چندین عملکرد موفق متوالی، به بخش «حل‌شده» منتقل می‌گردد.
          </p>

          {/* Weakness List */}
          <div className="space-y-3">
            {displayedWeaknesses.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{w.titleFa}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 font-en">
                        {w.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {w.descriptionFa}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      w.severity === 'high'
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : w.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    اولویت {w.severity === 'high' ? 'بالا' : 'متوسط'}
                  </span>
                </div>

                {/* Examples from user speech */}
                {w.examples && w.examples.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">
                      نمونه ثبت‌شده از صدای شما:
                    </span>
                    {w.examples.map((ex, i) => (
                      <div key={i} className="text-xs text-red-300/90 font-en">
                        "{ex}"
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-500">
                  <span>مشاهده‌شده: {w.frequency} بار</span>
                  <span className="text-emerald-400 font-medium">
                    پاسخ‌های صحیح پیاپی: {w.successStreak} / 3 برای تثبیت
                  </span>
                  <span>آخرین رویت: {w.lastObserved}</span>
                </div>
              </div>
            ))}

            {displayedWeaknesses.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs rounded-2xl border border-dashed border-slate-800">
                موردی در این دسته وجود ندارد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ANALYTICS & ACCENT SECTION */}
      {activeSection === 'analytics' && (
        <div className="space-y-4">
          {/* Fluency Trend Curve */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">روند رشد روانی کلام (Fluency Trend)</h3>
              </div>
              <span className="text-xs font-en font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                میانگین: {progress.averageFluencyScore}%
              </span>
            </div>

            {/* SVG Curve Chart */}
            <div className="h-40 w-full pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 350 120">
                <defs>
                  <linearGradient id="progFluencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="20" x2="350" y2="20" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1="60" x2="350" y2="60" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1="100" x2="350" y2="100" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />

                {(() => {
                  const history = progress.fluencyHistory || [];
                  if (history.length === 0) {
                    return (
                      <text x="175" y="60" fill="#64748b" fontSize="11" textAnchor="middle">
                        هنوز داده‌ای ثبت نشده — بعد از تمرین اسپیکینگ اینجا پر می‌شود
                      </text>
                    );
                  }

                  const span = Math.max(1, history.length - 1);
                  const points = history.map((item, idx) => {
                    const x = 20 + (idx / span) * 310;
                    const y = 110 - (Math.min(100, Math.max(0, item.score)) / 100) * 90;
                    return { x, y, score: item.score, date: item.date };
                  });

                  const pathD = points.reduce((acc, curr, idx) => {
                    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
                  }, '');

                  const areaD = `${pathD} L ${points[points.length - 1].x} 115 L ${points[0].x} 115 Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#progFluencyGrad)" />
                      <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" />
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
                          <text x={p.x} y={p.y - 8} fill="#94a3b8" fontSize="8" textAnchor="middle">
                            {p.score}%
                          </text>
                          <text x={p.x} y={118} fill="#64748b" fontSize="8" textAnchor="middle">
                            {p.date}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Sound-by-sound accent accuracy bars */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              دقت تلفظ بر اساس آواهای کلیدی امریکن
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">American Flap T (Water, City):</span>
                  <span className="font-en font-bold text-emerald-400">
                    {progress.phoneticsBreakdown.flapT}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress.phoneticsBreakdown.flapT}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Retroflex R (Car, Bird - نرم بدون لرزش):</span>
                  <span className="font-en font-bold text-cyan-400">
                    {progress.phoneticsBreakdown.retroflexR}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${progress.phoneticsBreakdown.retroflexR}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">تفکیک W و V (تمایز Went و Vent):</span>
                  <span className="font-en font-bold text-indigo-400">
                    {progress.phoneticsBreakdown.wVsV}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${progress.phoneticsBreakdown.wVsV}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Glottal Stop (Mountain, Button):</span>
                  <span className="font-en font-bold text-amber-400">
                    {progress.phoneticsBreakdown.glottalStop}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${progress.phoneticsBreakdown.glottalStop}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Connected Speech & Reductions (gonna, wanna):</span>
                  <span className="font-en font-bold text-purple-400">
                    {progress.phoneticsBreakdown.connectedSpeech}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${progress.phoneticsBreakdown.connectedSpeech}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. GOALS & REMINDERS SECTION */}
      {activeSection === 'reminders' && (
        <div className="space-y-4">
          {/* Daily Goals Card */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                اهداف روزانه من (Daily Goals)
              </h3>
              <button
                onClick={() => {
                  setEditedGoals(goals);
                  setIsEditingGoals(!isEditingGoals);
                }}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isEditingGoals ? 'انصراف' : 'تغییر اهداف'}</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">دقیقه اسپیکینگ روزانه:</span>
                <span className="font-en font-bold text-cyan-300">
                  {progress.todayMinutesSpoken} / {goals.dailySpeakingMinutesTarget} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">لغات و کلیشه‌های جدید:</span>
                <span className="font-en font-bold text-indigo-300">
                  {progress.todayWordsLearned} / {goals.dailyWordsTarget} words
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">سناریوهای کامل‌شده:</span>
                <span className="font-en font-bold text-emerald-300">
                  {progress.todayScenariosCompleted} / {goals.dailyScenariosTarget} scenarios
                </span>
              </div>
            </div>

            {isEditingGoals && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">دقیقه اسپیکینگ:</label>
                    <input
                      type="number"
                      value={editedGoals.dailySpeakingMinutesTarget}
                      onChange={(e) =>
                        setEditedGoals({ ...editedGoals, dailySpeakingMinutesTarget: Number(e.target.value) })
                      }
                      className="w-full py-1.5 px-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-en text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">تعداد لغت:</label>
                    <input
                      type="number"
                      value={editedGoals.dailyWordsTarget}
                      onChange={(e) =>
                        setEditedGoals({ ...editedGoals, dailyWordsTarget: Number(e.target.value) })
                      }
                      className="w-full py-1.5 px-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-en text-center text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">تعداد سناریو:</label>
                    <input
                      type="number"
                      value={editedGoals.dailyScenariosTarget}
                      onChange={(e) =>
                        setEditedGoals({ ...editedGoals, dailyScenariosTarget: Number(e.target.value) })
                      }
                      className="w-full py-1.5 px-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-en text-center text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveGoals}
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  ذخیره تغییرات
                </button>
              </div>
            )}
          </div>

          {/* Daily Reminder Setting */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">یادآور روزانه تمرین (Daily Reminder)</h3>
                  <p className="text-[11px] text-slate-400">
                    ارسال اعلان در ساعت معین برای تداوم تمرین
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={goals.reminderEnabled}
                  onChange={(e) =>
                    onUpdateGoals({ ...goals, reminderEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {goals.reminderEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">ساعت یادآوری:</span>
                  <input
                    type="time"
                    value={goals.reminderTime}
                    onChange={(e) =>
                      onUpdateGoals({ ...goals, reminderTime: e.target.value })
                    }
                    className="py-1 px-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-en text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleTestReminder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 text-xs font-medium transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تست نوتیفیکیشن</span>
                </button>
              </div>
            )}

            {testNotificationSent && (
              <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                ✓ اعلان آزمایشی با موفقیت به مرورگر / دستگاه شما ارسال شد!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
