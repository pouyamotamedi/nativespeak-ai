import React, { useState } from 'react';
import { LeitnerWord, LeitnerBoxNumber } from '../types';
import { Plus, Search, Sparkles, Volume2, CheckCircle2, RotateCcw, ArrowRight, ArrowLeft, Brain, BookOpen, AlertCircle, ChevronRight, X } from 'lucide-react';
import { playAudioText, playChimeSound } from '../utils/audio';
import { apiFetch } from '../utils/userApiKeys';

interface Props {
  words: LeitnerWord[];
  onUpdateWords: (words: LeitnerWord[]) => void;
  onWordMastered: () => void;
}

export const LeitnerScreen: React.FC<Props> = ({ words, onUpdateWords, onWordMastered }) => {
  const [selectedBox, setSelectedBox] = useState<number | 'all'>('all');
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWordInput, setNewWordInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Review Flashcard Mode
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // AI Dialogue & Scenario Practice Mode
  const [isAiPracticeMode, setIsAiPracticeMode] = useState(false);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [aiPracticeData, setAiPracticeData] = useState<any>(null);
  const [userPracticeAnswers, setUserPracticeAnswers] = useState<Record<string, string>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({});

  // Filter words
  const filteredWords = selectedBox === 'all' ? words : words.filter((w) => w.box === selectedBox);

  // Box counts
  const boxCounts = [1, 2, 3, 4, 5].map((boxNum) => ({
    box: boxNum,
    count: words.filter((w) => w.box === boxNum).length,
  }));

  const handleLookupAndAddWord = async () => {
    const term = newWordInput.trim();
    if (!term) return;

    setIsLookingUp(true);
    setLookupError(null);

    try {
      const res = await apiFetch('/api/lookup-word', {
        method: 'POST',
        body: JSON.stringify({ word: term }),
      });

      if (!res.ok) throw new Error('خطا در دریافت اطلاعات لغت');
      const data = await res.json();

      const newLeitnerWord: LeitnerWord = {
        id: `word-${Date.now()}`,
        word: data.word || term.toLowerCase(),
        phonetic: data.phonetic || '',
        partOfSpeech: data.partOfSpeech || 'noun',
        persianMeaning: data.persianMeaning || 'معنی ثبت شد',
        persianNuance: data.persianNuance,
        americanUsageNote: data.americanUsageNote,
        collocations: data.collocations || [],
        sampleSentences: data.sampleSentences || [
          { english: `I frequently use ${term} in conversations.`, persian: 'من اغلب از این لغت استفاده می‌کنم.' },
        ],
        pronunciationTipFa: data.pronunciationTipFa,
        box: 1,
        nextReviewDue: new Date().toISOString(),
        timesReviewed: 0,
        correctCount: 0,
      };

      onUpdateWords([newLeitnerWord, ...words]);
      setNewWordInput('');
      setIsAddingWord(false);
      playChimeSound('success');
    } catch (err: any) {
      setLookupError('متأسفانه دریافت لغت ناموفق بود. لطفاً مجدد امتحان کنید.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCardResult = (correct: boolean) => {
    const currentWord = filteredWords[reviewIndex];
    if (!currentWord) return;

    let nextBox = currentWord.box;
    if (correct) {
      nextBox = Math.min(5, currentWord.box + 1) as LeitnerBoxNumber;
      playChimeSound('success');
      if (nextBox === 5 && currentWord.box !== 5) {
        onWordMastered();
      }
    } else {
      nextBox = 1; // back to box 1 per Leitner rules
      playChimeSound('ding');
    }

    const updated = words.map((w) =>
      w.id === currentWord.id
        ? {
            ...w,
            box: nextBox,
            timesReviewed: w.timesReviewed + 1,
            correctCount: correct ? w.correctCount + 1 : w.correctCount,
            lastReviewedAt: new Date().toISOString(),
          }
        : w
    );

    onUpdateWords(updated);
    setIsFlipped(false);

    if (reviewIndex + 1 < filteredWords.length) {
      setReviewIndex(reviewIndex + 1);
    } else {
      setIsReviewMode(false);
      setReviewIndex(0);
    }
  };

  const handleGenerateAiPractice = async () => {
    const targetList = words.slice(0, 5).map((w) => w.word);
    if (targetList.length === 0) return;

    setIsGeneratingPractice(true);
    setIsAiPracticeMode(true);
    setAiPracticeData(null);

    try {
      const res = await apiFetch('/api/generate-leitner-practice', {
        method: 'POST',
        body: JSON.stringify({ dueWords: targetList }),
      });

      if (!res.ok) throw new Error('خطا در تولید تمرین هوش مصنوعی');
      const data = await res.json();
      setAiPracticeData(data);
      playChimeSound('levelUp');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const handleDeleteWord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateWords(words.filter((w) => w.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-fa p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            جعبه لایتنر هوشمند (Leitner Box)
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            تکرار با فواصل زمانی منظم + سناریوسازی با هوش مصنوعی
          </p>
        </div>
        <button
          onClick={() => setIsAddingWord(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>افزودن لغت</span>
        </button>
      </div>

      {/* 5-Box Leitner Visualizer */}
      <div className="grid grid-cols-5 gap-1.5 my-3">
        {boxCounts.map(({ box, count }) => {
          const isSelected = selectedBox === box;
          const boxLabels = ['روزانه', '۳ روز', '۱ هفته', '۲ هفته', 'تثبیت 🌟'];
          return (
            <button
              key={box}
              onClick={() => setSelectedBox(isSelected ? 'all' : box)}
              className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-between min-h-[72px] ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[10px] font-bold opacity-80">خانه {box}</div>
              <div className="text-lg font-black my-0.5">{count}</div>
              <div className="text-[9px] opacity-75 truncate max-w-full">{boxLabels[box - 1]}</div>
            </button>
          );
        })}
      </div>

      {/* AI Interactive Dialogue Practice Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900 border border-indigo-500/30 my-2 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>تمرین سناریو و دیالوگ با لغات لایتنر</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            هوش مصنوعی لغات سررسیدشده را در یک سناریوی واقعی مکالمه پیاده‌سازی می‌کند.
          </p>
        </div>
        <button
          onClick={handleGenerateAiPractice}
          disabled={words.length === 0 || isGeneratingPractice}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white text-xs font-bold shrink-0 shadow-md transition disabled:opacity-50"
        >
          {isGeneratingPractice ? 'در حال تولید...' : 'شروع تمرین'}
        </button>
      </div>

      {/* Review Flashcards Button if words available */}
      {filteredWords.length > 0 && !isReviewMode && !isAiPracticeMode && (
        <div className="flex items-center justify-between my-2">
          <span className="text-xs text-slate-400">
            تعداد لغات این بخش: <strong className="text-white">{filteredWords.length}</strong>
          </span>
          <button
            onClick={() => {
              setReviewIndex(0);
              setIsFlipped(false);
              setIsReviewMode(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>مرور فلش‌کارتی</span>
          </button>
        </div>
      )}

      {/* Review Mode Modal / View */}
      {isReviewMode && filteredWords.length > 0 && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 my-2 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>کارت {reviewIndex + 1} از {filteredWords.length}</span>
            <button
              onClick={() => setIsReviewMode(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕ خروج از مرور
            </button>
          </div>

          {/* Flashcard container */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[180px] p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 cursor-pointer flex flex-col justify-between text-center select-none shadow-inner"
          >
            <div>
              <div className="text-[11px] text-indigo-400 uppercase font-en tracking-wider mb-1">
                {filteredWords[reviewIndex].partOfSpeech}
              </div>
              <h3 className="text-2xl font-black text-white font-en tracking-wide">
                {filteredWords[reviewIndex].word}
              </h3>
              <p className="text-xs text-slate-400 font-en mt-1">
                {filteredWords[reviewIndex].phonetic}
              </p>
            </div>

            {/* Revealed back of card */}
            {isFlipped ? (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-2 text-right">
                <div className="text-sm font-bold text-cyan-300">
                  {filteredWords[reviewIndex].persianMeaning}
                </div>
                {filteredWords[reviewIndex].persianNuance && (
                  <p className="text-[11px] text-slate-300">
                    💡 نکته: {filteredWords[reviewIndex].persianNuance}
                  </p>
                )}
                {filteredWords[reviewIndex].sampleSentences?.[0] && (
                  <div className="p-2 rounded-xl bg-slate-900 text-left font-en text-xs text-slate-200">
                    "{filteredWords[reviewIndex].sampleSentences[0].english}"
                    <div className="text-right font-fa text-[10px] text-slate-400 mt-1">
                      {filteredWords[reviewIndex].sampleSentences[0].persian}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 opacity-60">
                (برای مشاهده معنی و مثال لمس کنید)
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playAudioText(filteredWords[reviewIndex].word);
              }}
              className="self-center mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>تلفظ صوتی</span>
            </button>
          </div>

          {/* Answer grading buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCardResult(false)}
              className="py-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/50 text-xs font-bold transition"
            >
              بلد نبودم (برگشت به خانه ۱)
            </button>
            <button
              onClick={() => handleCardResult(true)}
              className="py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 text-xs font-bold transition"
            >
              بلد بودم (ارتقا به خانه بعد)
            </button>
          </div>
        </div>
      )}

      {/* AI Dialogue Practice Modal */}
      {isAiPracticeMode && aiPracticeData && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-indigo-500/40 my-3 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">
                {aiPracticeData.scenarioTitle}
              </h3>
            </div>
            <button
              onClick={() => setIsAiPracticeMode(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕ بستن
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {aiPracticeData.scenarioContextFa}
          </p>

          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 font-en">Conversational Partner:</span>
              <button
                onClick={() => playAudioText(aiPracticeData.dialogueStarter)}
                className="text-slate-400 hover:text-white"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-white font-en">"{aiPracticeData.dialogueStarter}"</div>
            <div className="text-[11px] text-slate-400 font-fa">{aiPracticeData.dialogueStarterFa}</div>
          </div>

          {/* Challenges with Leitner words */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-amber-300">چالش‌های جمله‌سازی شما با لغات لایتنر:</div>
            {aiPracticeData.challenges?.map((c: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-en font-bold text-cyan-300 text-xs px-2 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-500/30">
                    {c.targetWord}
                  </span>
                  <span className="text-[10px] text-slate-400">چالش {idx + 1}</span>
                </div>
                <p className="text-xs text-slate-200">{c.instructionFa}</p>
                <input
                  type="text"
                  placeholder="جمله خود را اینجا بنویسید یا تمرین کنید..."
                  value={userPracticeAnswers[c.targetWord] || ''}
                  onChange={(e) =>
                    setUserPracticeAnswers({ ...userPracticeAnswers, [c.targetWord]: e.target.value })
                  }
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-en focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() =>
                      setCheckedAnswers({ ...checkedAnswers, [c.targetWord]: !checkedAnswers[c.targetWord] })
                    }
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    {checkedAnswers[c.targetWord] ? 'پنهان کردن پاسخ پیشنهادی' : 'مشاهده پاسخ پیشنهادی نیتیو'}
                  </button>
                  {userPracticeAnswers[c.targetWord] && (
                    <span className="text-[10px] text-emerald-400 font-bold">✓ ثبت شد</span>
                  )}
                </div>
                {checkedAnswers[c.targetWord] && (
                  <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] space-y-1">
                    <div className="font-en text-slate-200">"{c.suggestedResponse}"</div>
                    <div className="text-slate-400 font-fa">{c.suggestedResponseFa}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Word List */}
      {!isReviewMode && (
        <div className="space-y-2.5 my-2">
          {filteredWords.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white font-en">{item.word}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 font-en">
                      {item.partOfSpeech}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      خانه {item.box}
                    </span>
                  </div>
                  <p className="text-xs text-cyan-300 font-fa mt-1 font-medium">
                    {item.persianMeaning}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playAudioText(item.word)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteWord(item.id, e)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {item.sampleSentences?.[0] && (
                <div className="mt-2.5 p-2 rounded-xl bg-slate-800/60 text-[11px] font-en text-slate-300">
                  "{item.sampleSentences[0].english}"
                </div>
              )}
            </div>
          ))}

          {words.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-slate-900/80 border border-dashed border-slate-800 space-y-3.5 my-auto">
              <div className="w-14 h-14 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Brain className="w-7 h-7 text-indigo-400" />
              </div>
              <h4 className="text-sm font-bold text-white">جعبه لایتنر شما در حال حاضر خالی است</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                در طول مکالمه در بخش اسپیکینگ با کلیک روی هر کلمه جدید یا از طریق دکمه «افزودن لغت»، واژگان دلخواهتان را برای مرور منظم و سناریوسازی به لایتنر اضافه کنید.
              </p>
              <button
                onClick={() => setIsAddingWord(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                افزودن اولین لغت ✍️
              </button>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs rounded-2xl border border-dashed border-slate-800">
              هیچ لغتی در این خانه وجود ندارد. از دکمه «افزودن لغت» استفاده کنید.
            </div>
          ) : null}
        </div>
      )}

      {/* Add Word Modal */}
      {isAddingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" />
                افزودن لغت به لایتنر با هوش مصنوعی
              </h3>
              <button
                onClick={() => setIsAddingWord(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              لغت یا اصطلاح انگلیسی را وارد کنید تا هوش مصنوعی معنی دقیق، تلفظ فونتیک، کاربرد امریکن و مثال‌ها را به جعبه لایتنر شما اضافه کند.
            </p>

            <input
              type="text"
              placeholder="مثال: hit the nail on the head یا reluctant"
              value={newWordInput}
              onChange={(e) => setNewWordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookupAndAddWord()}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-white font-en text-xs focus:outline-none focus:border-indigo-500"
            />

            {lookupError && (
              <div className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{lookupError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddingWord(false)}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleLookupAndAddWord}
                disabled={!newWordInput.trim() || isLookingUp}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isLookingUp ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال بررسی با هوش مصنوعی...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>جستجو و ذخیره</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
