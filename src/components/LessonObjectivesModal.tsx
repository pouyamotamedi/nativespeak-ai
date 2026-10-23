import React, { useState } from 'react';
import { Scenario, CalendarScenario } from '../types';
import {
  X,
  Target,
  Sparkles,
  Volume2,
  CheckCircle2,
  Plus,
  Check,
  ShieldAlert,
  MessageSquare,
  Play,
  Layers,
  BookOpen,
  CheckCheck,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { playAudioText, playChimeSound } from '../utils/audio';
import { C2_SCIENTIFIC_CHECKLIST } from '../data/c2Checklist';
import { SCENARIO_BLUEPRINTS } from '../utils/c2ScenarioEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario | CalendarScenario | null;
  lessonIndex?: number;
  totalLessons?: number;
  onSelectAndStart?: (scenario: Scenario | CalendarScenario) => void;
  onAddClicheToPractice?: (cliche: string, meaningFa: string) => void;
  isCurrentlyActive?: boolean;
}

export const LessonObjectivesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  scenario,
  lessonIndex = 1,
  totalLessons = 10,
  onSelectAndStart,
  onAddClicheToPractice,
  isCurrentlyActive = false,
}) => {
  const [addedCliches, setAddedCliches] = useState<Record<string, boolean>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen || !scenario) return null;

  // 1. Locate authentic C2 Scientific Checklist item
  const checklistId = (scenario as any).targetChecklistItemId;
  const checklistItem = C2_SCIENTIFIC_CHECKLIST.find(
    (c) =>
      c.id === checklistId ||
      (scenario.id && scenario.id.includes(c.id)) ||
      c.titleEn.toLowerCase() === scenario.targetGrammar?.toLowerCase() ||
      c.titleFa === scenario.targetGrammarFa ||
      (scenario.titleFa && scenario.titleFa.includes(c.titleFa))
  );

  // 2. Locate authentic blueprint details
  const blueprintKey = checklistId || checklistItem?.id || (scenario.id && SCENARIO_BLUEPRINTS[scenario.id] ? scenario.id : null);
  const blueprint = blueprintKey ? SCENARIO_BLUEPRINTS[blueprintKey] : null;

  // 3. Resolve dynamic & authentic objectives
  const effectiveGrammarTitle =
    scenario.targetGrammar ||
    checklistItem?.titleEn ||
    blueprint?.title ||
    'Spoken Fluency & Accuracy';

  const effectiveGrammarFa =
    scenario.targetGrammarFa ||
    checklistItem?.descriptionFa ||
    blueprint?.titleFa ||
    'تسلط بر ساختارهای محاوره‌ای و حذف خطاهای ترجمه‌ای زبان مادری';

  // Resolve target clichés
  let resolvedCliches: string[] = [];
  if (Array.isArray(scenario.targetCliches) && scenario.targetCliches.length > 0) {
    resolvedCliches = scenario.targetCliches;
  } else if (blueprint?.targetCliches && blueprint.targetCliches.length > 0) {
    resolvedCliches = blueprint.targetCliches;
  } else if (checklistItem?.exampleGood) {
    resolvedCliches = [
      `${checklistItem.titleEn} (ساختار استاندارد نیتیو)`,
      'on the same page (هم‌نظر و هماهنگ)',
    ];
  }

  // Resolve target vocabulary
  const resolvedVocabulary: string[] =
    (scenario as any).targetVocabulary || blueprint?.targetVocabulary || [];

  // Resolve pronunciation target
  const effectivePronunciation =
    scenario.targetPronunciation ||
    blueprint?.targetPronunciation ||
    checklistItem?.criteriaForMasteryFa ||
    'لهجه استاندارد جنرال امریکن: Flap-T، کاهش مصوت‌ها (Schwa) و پیوستگی کلام';

  // Resolve opening line / starter
  const effectiveStarter = scenario.starter || blueprint?.starter || '';
  const effectiveStarterFa = scenario.starterFa || blueprint?.starterFa || '';

  const targetWeaknesses = scenario.activeWeaknessesInjected || [];
  const dayIndex = (scenario as CalendarScenario).dayIndex || lessonIndex;
  const isMastered = (scenario as CalendarScenario).status === 'completed';

  const handleAddCliche = (cliche: string) => {
    if (addedCliches[cliche]) return;
    if (onAddClicheToPractice) {
      let cleanCliche = cliche;
      let meaning = 'کلیشه کلیدی سناریو';
      const parenMatch = cliche.match(/^(.*?)\((.*?)\)/);
      if (parenMatch) {
        cleanCliche = parenMatch[1].trim();
        meaning = parenMatch[2].trim();
      }
      onAddClicheToPractice(cleanCliche, meaning);
    }
    setAddedCliches((prev) => ({ ...prev, [cliche]: true }));
    playChimeSound('success');
  };

  const handlePlayStarter = () => {
    if (!effectiveStarter) return;
    setIsPlayingAudio(true);
    playAudioText(effectiveStarter, {
      lang: 'en-US',
      rate: 0.95,
      onEnd: () => setIsPlayingAudio(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md font-fa animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl p-2.5 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 text-cyan-400 shrink-0">
              {scenario.icon || blueprint?.icon || '🎯'}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-cyan-400 font-en">
                  Lesson #{dayIndex} of {totalLessons}
                </span>
                {(scenario.targetLevel || checklistItem?.cefrLevel) && (
                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-en font-bold">
                    Target: {scenario.targetLevel || checklistItem?.cefrLevel}
                  </span>
                )}
                {isMastered && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>تکمیل‌شده (۸۰٪+ تسلط)</span>
                  </span>
                )}
                {isCurrentlyActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    درس جاری ⚡
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-white mt-1 truncate">
                {scenario.titleFa || blueprint?.titleFa}
              </h3>
              <p className="text-xs text-slate-400 font-en truncate mt-0.5">
                {scenario.title || blueprint?.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Section: Comprehensive Educational Objectives Overview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <span>اهداف آموزشی جامع این سناریو (Comprehensive Learning Objectives)</span>
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11.5px]">
                این درس با هدف پیشبرد روان‌گویی طبیعی آمریکایی، حذف ساختارهای ترجمه‌ای فارسی و تمرین موقعیت‌های واقعی زندگی طراحی شده است. مربی هوش مصنوعی در طول این درس شما را ملزم به استفاده از ساختارها و اصطلاحات زیر خواهد کرد:
              </p>
            </div>
          </div>

          {/* Objective 1: Target Grammar & Structural Patterns */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>۱. هدف گرامری و ساختار جمله‌سازی (Grammar & Sentence Patterns):</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
                محور اصلی درس
              </span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/90 space-y-2">
              <div className="text-xs font-bold text-white">
                {effectiveGrammarFa}
              </div>
              <div className="text-xs font-en text-cyan-200 bg-slate-950/70 p-2 rounded-lg border border-cyan-500/20 font-bold">
                {effectiveGrammarTitle}
              </div>

              {/* Real Correct vs Incorrect Examples from C2 Checklist */}
              {checklistItem && (checklistItem.exampleGood || checklistItem.exampleBad) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {checklistItem.exampleGood && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>فرم صحیح و نیتیو (Correct American Form):</span>
                      </span>
                      <p className="text-xs font-en text-emerald-100 font-medium">
                        "{checklistItem.exampleGood}"
                      </p>
                    </div>
                  )}
                  {checklistItem.exampleBad && (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>اشتباه تداخل زبان مادری (Persian L1 Mistake to Avoid):</span>
                      </span>
                      <p className="text-xs font-en text-rose-200 font-medium line-through decoration-rose-400">
                        "{checklistItem.exampleBad}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {checklistItem?.criteriaForMasteryFa && (
                <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-start gap-1.5 mt-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>معیار سنجش تسلط: {checklistItem.criteriaForMasteryFa}</span>
                </div>
              )}
            </div>
          </div>

          {/* Objective 2: Native American Clichés & Idioms */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>۲. کلیشه‌ها و اصطلاحات اصیل آمریکایی این درس (Native Clichés to Master):</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-bold">
                {resolvedCliches.length} عبارت کلیدی
              </span>
            </div>
            {resolvedCliches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resolvedCliches.map((cliche, idx) => {
                  const isAdded = addedCliches[cliche];
                  const parenMatch = cliche.match(/^(.*?)\((.*?)\)/);
                  const displayCliche = parenMatch ? parenMatch[1].trim() : cliche;
                  const displayMeaning = parenMatch ? parenMatch[2].trim() : 'اصطلاح پرکاربرد مکالمه آمریکایی';

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-en font-bold text-amber-200 block truncate text-xs">
                          {displayCliche}
                        </span>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5 truncate font-fa">
                          {displayMeaning}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCliche(cliche)}
                        disabled={isAdded}
                        className={`p-1.5 rounded-lg border transition shrink-0 flex items-center gap-1 text-[10px] font-bold ${
                          isAdded
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300 hover:border-amber-400/50'
                        }`}
                        title={isAdded ? 'به تمرینات افزوده شد' : 'افزودن به بخش تمرین کلیشه‌ها'}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                            <span>ثبت شد</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 text-amber-400" />
                            <span>+ تمرین</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 p-2 bg-slate-900 rounded-xl">
                کلیشه‌های اصیل آمریکایی متناسب با مکالمه شما در جریان چت تدریس خواهد شد.
              </div>
            )}
          </div>

          {/* Objective 3: Key Collocations & Target Vocabulary */}
          {resolvedVocabulary.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>۳. واژگان همنشین و کالوکیشن‌های هدف (Target Collocations):</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {resolvedVocabulary.map((vocab, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 font-en font-medium"
                  >
                    {vocab}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Objective 4: Acoustic Phonetics & Accent Focus */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>۴. تمرکز آوایی و لهجه آمریکایی (Acoustic Phonetics & Accent):</span>
            </span>
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/90 space-y-1">
              <div className="text-xs font-bold text-slate-200">
                {effectivePronunciation}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                سیستم تحلیل صوت در صورت ضبط ویس، تلفظ شما را روی این شاخص‌ها و کاهش مصوت‌ها (Schwa) ارزیابی کرده و خطاهای انتقال زبان مادری را گوشزد می‌کند.
              </p>
            </div>
          </div>

          {/* Objective 5: Injected Personalized Weaknesses (if any) */}
          {targetWeaknesses.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>۵. ترمیم نقاط ضعف اختصاصی ثبت‌شده شما:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {targetWeaknesses.map((w, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200"
                  >
                    🎯 {w}
                  </span>
                ))}
              </div>
              <p className="text-[10.5px] text-amber-300/80 leading-relaxed">
                مربی هوش مصنوعی موظف است در لابلای مکالمه شما را در موقعیتی قرار دهد که این نقاط ضعف را با موفقیت اصلاح کنید.
              </p>
            </div>
          )}

          {/* Objective 6: Real-world Context & Social Dynamics */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>۶. بافت موقعیت و نقش‌های مکالمه:</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">نقش شما:</span>
                <span className="font-bold text-white block mt-0.5 truncate">{scenario.userRole || blueprint?.userRole || 'Learner'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">نقش مربی:</span>
                <span className="font-bold text-white block mt-0.5 truncate">{scenario.aiRole || blueprint?.aiRole || 'Partner'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">رابطه:</span>
                <span className="font-bold text-white block mt-0.5 truncate">{scenario.relationship || blueprint?.relationship || 'Friend'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">سطح رسمیت:</span>
                <span className="font-bold text-cyan-300 block mt-0.5 font-en uppercase text-[11px]">
                  {(scenario as any).recommendedRegister || 'casual'}
                </span>
              </div>
            </div>
            {(blueprint?.context || (scenario as any).descriptionFa || (scenario as any).context) && (
              <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                {blueprint?.context || (scenario as any).descriptionFa || (scenario as any).context}
              </p>
            )}
          </div>

          {/* Section: Starter Prompt */}
          {effectiveStarter && (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>آغازگر مکالمه این سناریو (Opening Line):</span>
                </span>
                <button
                  type="button"
                  onClick={handlePlayStarter}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10.5px] font-bold transition active:scale-95 shadow-sm"
                  title="پخش صوتی آغازگر"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-cyan-400' : ''}`} />
                  <span>{isPlayingAudio ? 'در حال پخش...' : 'پخش صدا'}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-en text-xs text-slate-100 leading-relaxed font-medium">
                "{effectiveStarter}"
              </div>
              {effectiveStarterFa && (
                <div className="text-[11px] text-slate-400 font-fa px-1 leading-relaxed">
                  ترجمه: «{effectiveStarterFa}»
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            بستن
          </button>

          {!isCurrentlyActive && onSelectAndStart ? (
            <button
              type="button"
              onClick={() => {
                onSelectAndStart(scenario);
                playChimeSound('ding');
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs transition shadow-lg shadow-cyan-600/25 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>انتخاب و شروع این درس</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>این درس در حال حاضر فعال است</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
