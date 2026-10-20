import React, { useState, useRef, useEffect } from 'react';
import {
  AssessmentResult,
  CalendarScenario,
  WeaknessItem,
  TaskVoiceAssessment,
} from '../types';
import {
  Sparkles,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  X,
  CheckCircle2,
  Award,
  AlertCircle,
  Volume2,
  Activity,
  ChevronLeft,
  Compass,
  Edit3,
} from 'lucide-react';
import {
  playAudioText,
  playChimeSound,
  stopAudioPlayback,
  startAudioRecording,
  createSpeechRecognizer,
  transcribeAudioBase64,
} from '../utils/audio';
import { matchWeaknessToC2ChecklistItem } from '../data/c2Checklist';
import { apiFetch } from '../utils/userApiKeys';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** True when opening after finishing a 10-lesson cohort */
  isCycleReassessment?: boolean;
  onAssessmentCompleted: (
    result: AssessmentResult,
    calendar: CalendarScenario[],
    weaknesses: WeaknessItem[]
  ) => void;
}

const ASSESSMENT_PROMPTS = [
  {
    id: 1,
    titleFa: 'بخش ۱: معرفی خود و سبک زندگی (پایه تا متوسط - A2/B1)',
    taskName: 'Task 1: Self-Introduction, Passions & Daily Flow',
    promptEn: "Tell me a little about yourself, what you do on a typical day, and what topics or hobbies you are deeply interested in. What makes a good day for you?",
    promptFa: 'کمی از خودتان، کارهایی که در یک روز معمولی انجام می‌دهید و موضوعات یا تفریحاتی که قلباً به آنها علاقه‌مندید بگویید.',
    expectedPointsFa: 'سنجش ساختارهای زمان حال، حروف اضافه همنشین (interested in)، افعال حالتی (agree)، روانی کلام و حذف ترجمه مستقیم از فارسی.',
  },
  {
    id: 2,
    titleFa: 'بخش ۲: داستان‌سرایی و روایت گذشته (متوسط رو به بالا - B1/B2)',
    taskName: 'Task 2: Narrative & Past Incident Storytelling',
    promptEn: "Describe a memorable trip you took or an unexpected challenge that happened to you in the past. How did you react, and what was the outcome?",
    promptFa: 'یک سفر به‌یادماندنی یا یک اتفاق غیرمنتظره که در گذشته برایتان رخ داد را تعریف کنید. واکنش شما چه بود و ماجرا چطور تمام شد؟',
    expectedPointsFa: 'سنجش تفکیک زمان‌های گذشته (Past Simple, Continuous, Perfect)، افعال تفریحی go، تلفظ صدای R و Flap T امریکن.',
  },
  {
    id: 3,
    titleFa: 'بخش ۳: فرضیات، استدلال و بده‌بستان‌ها (پیشرفته - B2/C1)',
    taskName: 'Task 3: Hypothetical Dilemma & Complex Trade-offs',
    promptEn: "If you had the chance to completely reinvent your career or relocate anywhere in the world, what would you choose? Explain the trade-offs and what you might miss.",
    promptFa: 'اگر این فرصت را داشتید که مسیر شغلی‌تان را از نو بسازید یا به هر جای دنیا مهاجرت کنید، چه می‌کردید؟ بده‌بستان‌ها و معایب/مزایا را تحلیل کنید.',
    expectedPointsFa: 'سنجش شرطی نوع دوم و سوم (If I were you, I would have)، افعال وجهی، ظرافت‌های لحن (hedging) و اتصال واکه‌ها (connected speech).',
  },
  {
    id: 4,
    titleFa: 'بخش ۴: تحلیل انتزاعی و بحث مفهومی (سطح استادی - C1/C2)',
    taskName: 'Task 4: Abstract Debate, Cultural Nuance & Perspective',
    promptEn: "Some believe artificial intelligence will replace human creativity, while others view it merely as a double-edged tool. What is your perspective on this, and how should society adapt?",
    promptFa: 'برخی معتقدند هوش مصنوعی خلاقیت انسانی را منسوخ می‌کند و برخی آن را صرفاً ابزاری دو لبه می‌دانند. دیدگاه تحلیلی شما چیست و جامعه چگونه باید سازگار شود؟',
    expectedPointsFa: 'سنجش استدلال سه‌گانه، اصطلاحات عمیق نیتیو، کاهش واکه‌ها (Schwa)، گلوتال استاپ و کنترل بلاغی کلام در سطح C2.',
  },
];

export const InitialAssessmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isCycleReassessment = false,
  onAssessmentCompleted,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Array<{
      question: string;
      promptFa: string;
      responseText: string;
      audioBase64?: string;
      audioMimeType?: string;
      audioUrl?: string;
      taskAssessment?: TaskVoiceAssessment;
    }>
  >([]);

  const [currentInput, setCurrentInput] = useState('');
  const [currentAudio, setCurrentAudio] = useState<{
    base64: string;
    mimeType: string;
    audioUrl: string;
    durationSec?: number;
  } | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  // Task-level voice assessment state
  const [taskAssessments, setTaskAssessments] = useState<Record<number, TaskVoiceAssessment>>({});
  const [isTaskAnalyzing, setIsTaskAnalyzing] = useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  // Final diagnostic state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [generatedCalendar, setGeneratedCalendar] = useState<CalendarScenario[]>([]);
  const [generatedWeaknesses, setGeneratedWeaknesses] = useState<WeaknessItem[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<'all' | 'phase1' | 'phase2' | 'phase3' | 'phase4'>('all');

  const audioRecorderRef = useRef<any>(null);
  const speechRecognizerRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const volumeIntervalRef = useRef<any>(null);
  const previewAudioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      if (previewAudioElementRef.current) {
        previewAudioElementRef.current.pause();
        previewAudioElementRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const currentPrompt = ASSESSMENT_PROMPTS[stepIndex];

  // Deep Acoustic & Phonetic Task Voice Assessment — real STT + Gemini only (no fake placeholder)
  const triggerTaskVoiceAssessment = async (
    base64?: string,
    mimeType?: string,
    text?: string,
    targetStepIndex?: number
  ) => {
    const idx = targetStepIndex !== undefined ? targetStepIndex : stepIndex;
    const prompt = ASSESSMENT_PROMPTS[idx];
    const audioB64 = base64 || currentAudio?.base64;
    const audioMime = mimeType || currentAudio?.mimeType || 'audio/webm';
    setIsTaskAnalyzing(true);
    setMicError(null);

    try {
      // 1) Dedicated STT first (Whisper → Gemini) so we never claim "received" without a transcript
      let transcript = (text || currentInput || '').trim();
      if (audioB64) {
        const stt = await transcribeAudioBase64(audioB64, audioMime, 'en');
        if (stt.text) {
          transcript = stt.text;
          setCurrentInput(stt.text);
        }
      }

      if (!transcript && !audioB64) {
        throw new Error('هیچ ویس یا متنی برای تحلیل وجود ندارد.');
      }

      if (audioB64 && !transcript) {
        throw new Error(
          'نتوانستیم ویس را به متن تبدیل کنیم. دوباره با صدای واضح‌تر (حداقل ۱۰ ثانیه) ضبط کنید. کلید OpenAI دقت Whisper را بالا می‌برد.'
        );
      }

      // 2) Deep phonetic / CEFR task analysis with audio + verified transcript
      const res = await apiFetch('/api/assess-task-voice', {
        method: 'POST',
        body: JSON.stringify({
          taskIndex: idx + 1,
          question: prompt.promptEn,
          promptFa: prompt.promptFa,
          audioBase64: audioB64,
          audioMimeType: audioMime,
          userText: transcript,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (payload.transcription) {
          setCurrentInput(payload.transcription);
        }
        throw new Error(
          payload.details || payload.error || `خطا در تحلیل ویس (کد ${res.status})`
        );
      }

      const data: TaskVoiceAssessment = payload;
      const fakeMarkers = /صوت ضبط‌شده دریافت شد|پاسخ صوتی ضبط‌شده/;
      if (!data.transcription || fakeMarkers.test(data.transcription)) {
        throw new Error('تحلیل واقعی ویس انجام نشد. لطفاً دوباره امتحان کنید.');
      }
      // Reject known generic server fallback scores when we sent real audio
      const scores = data.scores || ({} as any);
      const looksLikeFakeFallback =
        Boolean(audioB64) &&
        scores.grammar === 76 &&
        scores.pronunciation === 73 &&
        scores.fluency === 74 &&
        scores.accent === 71;
      if (looksLikeFakeFallback) {
        throw new Error(
          'سرور تحلیل واقعی ویس را برنگرداند (پاسخ عمومی). کلید Gemini را چک کنید و دوباره تلاش کنید.'
        );
      }

      setTaskAssessments((prev) => ({ ...prev, [idx]: data }));
      setCurrentInput(data.transcription.trim());
      playChimeSound('success');
    } catch (err: any) {
      console.warn('Task voice assessment error:', err);
      setMicError(err?.message || 'خطا در تحلیل ویس. لطفاً دوباره ضبط و تحلیل کنید.');
      // Clear any previous fake diagnosis for this step
      setTaskAssessments((prev) => {
        const updated = { ...prev };
        delete updated[idx];
        return updated;
      });
    } finally {
      setIsTaskAnalyzing(false);
    }
  };

  // Start or Stop Voice Recording
  const toggleRecording = async () => {
    setMicError(null);

    if (isRecording) {
      // STOP recording
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      setAudioVolume(0);

      try {
        if (speechRecognizerRef.current) {
          try {
            speechRecognizerRef.current.stop();
          } catch (e) {}
        }

        if (audioRecorderRef.current) {
          const audioResult = await audioRecorderRef.current.stop();
          audioRecorderRef.current = null;
          setCurrentAudio({
            base64: audioResult.base64,
            mimeType: audioResult.mimeType,
            audioUrl: audioResult.audioUrl,
            durationSec: recordingSeconds,
          });
          playChimeSound('ding');

          // Immediately analyze the user's real voice recording
          triggerTaskVoiceAssessment(audioResult.base64, audioResult.mimeType, currentInput, stepIndex);
        }
      } catch (err: any) {
        console.warn('Error stopping voice recorder:', err);
      }
    } else {
      // START recording
      stopAudioPlayback();
      if (previewAudioElementRef.current) {
        previewAudioElementRef.current.pause();
        setIsPlayingRecorded(false);
      }
      setRecordingSeconds(0);
      setAudioVolume(0);

      try {
        const session = await startAudioRecording();
        audioRecorderRef.current = session;
        setIsRecording(true);

        // Volume monitoring for live equalizer
        volumeIntervalRef.current = setInterval(() => {
          if (session.getVolumeLevel) {
            setAudioVolume(session.getVolumeLevel());
          }
        }, 80);

        // Timer
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        // Optional speech recognition for instantaneous feedback
        try {
          const recognizer = createSpeechRecognizer({
            lang: 'en-US',
            onResult: (text) => setCurrentInput(text),
            onError: (err) => console.warn('Recognition notice:', err),
          });
          recognizer.start();
          speechRecognizerRef.current = recognizer;
        } catch (recErr) {
          console.warn('SpeechRecognizer unavailable, using direct audio processing:', recErr);
        }
      } catch (err: any) {
        console.error('Microphone error:', err);
        setIsRecording(false);
        setMicError(err.message || 'دسترسی به میکروفون مسدود است. لطفاً اجازه دسترسی را تأیید کنید.');
      }
    }
  };

  // Playback the recorded voice
  const togglePlayRecordedAudio = () => {
    if (!currentAudio?.audioUrl) return;

    if (isPlayingRecorded && previewAudioElementRef.current) {
      previewAudioElementRef.current.pause();
      setIsPlayingRecorded(false);
      return;
    }

    if (!previewAudioElementRef.current) {
      previewAudioElementRef.current = new Audio(currentAudio.audioUrl);
      previewAudioElementRef.current.onended = () => setIsPlayingRecorded(false);
      previewAudioElementRef.current.onerror = () => setIsPlayingRecorded(false);
    } else {
      previewAudioElementRef.current.src = currentAudio.audioUrl;
    }

    previewAudioElementRef.current
      .play()
      .then(() => {
        setIsPlayingRecorded(true);
      })
      .catch((e) => {
        console.warn('Playback error:', e);
        setIsPlayingRecorded(false);
      });
  };

  // Reset current recorded audio
  const handleResetCurrentRecording = () => {
    if (previewAudioElementRef.current) {
      previewAudioElementRef.current.pause();
      setIsPlayingRecorded(false);
    }
    setCurrentAudio(null);
    setCurrentInput('');
    setRecordingSeconds(0);
    setTaskAssessments((prev) => {
      const updated = { ...prev };
      delete updated[stepIndex];
      return updated;
    });
  };

  // Next step or submit assessment
  const handleNextStep = async () => {
    if (!currentInput.trim() && !currentAudio) return;
    if (isTaskAnalyzing) {
      setMicError('لطفاً صبر کنید تا تحلیل ویس این بخش تمام شود.');
      return;
    }

    if (isRecording) {
      await toggleRecording();
    }

    // Voice answers must have real AI analysis (no skipping with placeholder)
    if (currentAudio && !taskAssessments[stepIndex]) {
      setMicError('ویس ضبط شده هنوز تحلیل نشده. صبر کنید یا دوباره ضبط کنید.');
      await triggerTaskVoiceAssessment(
        currentAudio.base64,
        currentAudio.mimeType,
        currentInput,
        stepIndex
      );
      return;
    }

    const diagnosis = taskAssessments[stepIndex];
    const responseText = (diagnosis?.transcription || currentInput).trim();
    if (!responseText && !currentAudio) return;

    const currentAnswer = {
      question: currentPrompt.promptEn,
      promptFa: currentPrompt.promptFa,
      responseText,
      audioBase64: currentAudio?.base64,
      audioMimeType: currentAudio?.mimeType,
      audioUrl: currentAudio?.audioUrl,
      taskAssessment: diagnosis,
      sttEngine: (diagnosis as any)?.sttEngine,
    };

    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);

    // Reset current step inputs
    setCurrentInput('');
    setCurrentAudio(null);
    setRecordingSeconds(0);
    setMicError(null);
    setIsEditingTranscript(false);
    if (previewAudioElementRef.current) {
      previewAudioElementRef.current.pause();
      setIsPlayingRecorded(false);
    }

    if (stepIndex + 1 < ASSESSMENT_PROMPTS.length) {
      setStepIndex(stepIndex + 1);
      playChimeSound('ding');
    } else {
      // Analyze all tasks with deep multimodal voice & linguistic analysis
      setIsAnalyzing(true);
      setMicError(null);
      try {
        const res = await apiFetch('/api/initial-assessment', {
          method: 'POST',
          body: JSON.stringify({ answers: newAnswers }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.details || data.error || 'خطا در محاسبه تعیین سطح');
        }
        if (data.usedFallback && newAnswers.some((a) => a.audioBase64)) {
          throw new Error(
            'آنالیز واقعی ویس انجام نشد و نتیجه عمومی برنگشت. لطفاً دوباره امتحان کنید و کلید Gemini را بررسی کنید.'
          );
        }

        // Strictly extract CEFR level from evaluator response without erroneous substring matches
        let detectedLevel = String(data.cefrLevel || data.level || data.cefr || '').toUpperCase().trim();
        const match = detectedLevel.match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
        detectedLevel = match ? match[1].toUpperCase() : 'B1';

        // Scientific CEFR Calibration Guardrail:
        // If the learner gave short/elementary answers (e.g. 1 short sentence per task), calibrate realistically
        const totalUserWords = newAnswers.reduce((sum, a) => {
          const txt = String(a.responseText || '').trim();
          return sum + (txt ? txt.split(/\s+/).filter(Boolean).length : 0);
        }, 0);
        const avgWords = newAnswers.length > 0 ? totalUserWords / newAnswers.length : 0;

        if (totalUserWords < 25 || avgWords < 7) {
          detectedLevel = 'A1';
        } else if (totalUserWords < 50 || avgWords < 13) {
          // Elementary 1-sentence answers cannot be B2, C1, or C2
          if (['B2', 'C1', 'C2'].includes(detectedLevel)) {
            detectedLevel = 'A2';
          }
        } else if (totalUserWords < 95 || avgWords < 24) {
          // Cannot be C1 or C2 with under 95 words total
          if (['C1', 'C2'].includes(detectedLevel)) {
            detectedLevel = totalUserWords > 70 ? 'B1' : 'A2';
          }
        } else if (totalUserWords < 150) {
          // C2 requires deep extended discourse (at least 150+ words across the 4 tasks)
          if (detectedLevel === 'C2') {
            detectedLevel = 'B2';
          }
        }

        const result: AssessmentResult = {
          completed: true,
          cefrLevel: detectedLevel as any,
          levelDescriptionFa:
            data.levelDescriptionFa ||
            `سطح ارزیابی شده (${detectedLevel}): توانایی خوب در انتقال مفاهیم؛ اولویت اصلی ارتقا، درونی‌سازی کلیشه‌های نیتیو آمریکایی، تلفظ Flap T و افزایش پیوستگی کلام برای صعود به C1 و C2 است.`,
          grammarScore: data.grammarScore || 78,
          fluencyScore: data.fluencyScore || 75,
          pronunciationScore: data.pronunciationScore || 74,
          vocabularyScore: data.vocabularyScore || 76,
          accentScore: data.accentScore || 72,
          wpm: data.wpm || 120,
          acousticFeedback: data.acousticFeedback,
          identifiedWeaknesses: (data.initialWeaknesses || []).map((w: any) => w.titleFa),
          totalRoadmapScenarios: data.totalRoadmapScenarios || 1000,
          targetMasteryLevel: data.targetMasteryLevel || 'C2 Mastery',
          assessedAt: new Date().toISOString(),
        };

        const weaknessesList: WeaknessItem[] = (data.initialWeaknesses || []).map(
          (w: any, idx: number) => {
            const matchedChecklist = matchWeaknessToC2ChecklistItem(w.titleFa, w.category, w.descriptionFa);
            return {
              id: `weak-init-${idx}`,
              category: w.category || matchedChecklist?.category || 'grammar',
              titleFa: w.titleFa,
              descriptionFa: w.descriptionFa,
              examples: w.examples || [],
              severity: w.severity || 'medium',
              frequency: 3,
              firstObserved: new Date().toISOString().split('T')[0],
              lastObserved: new Date().toISOString().split('T')[0],
              status: 'active',
              successStreak: 0,
              checklistItemId: w.checklistItemId || matchedChecklist?.id,
            };
          }
        );

        const scenarios: CalendarScenario[] = (data.calendarScenarios || [])
          .filter(
            (sc: any) =>
              sc &&
              sc.id !== 'airport-customs' &&
              !sc.titleFa?.includes('گیت بازرسی') &&
              !sc.titleFa?.includes('کنترل گذرنامه')
          )
          .map((sc: any, idx: number) => ({
            ...sc,
            dayIndex: sc.dayIndex || idx + 1,
            targetLevel: sc.targetLevel || detectedLevel || 'B2',
          }));

        setAssessmentResult(result);
        setGeneratedCalendar(scenarios);
        setGeneratedWeaknesses(weaknessesList);
        // Immediately sync parent state, localStorage, and header badge with real evaluated level
        onAssessmentCompleted(result, scenarios, weaknessesList);
        playChimeSound('levelUp');
      } catch (e) {
        console.error(e);
        setMicError('خطا در تحلیل ویس. لطفاً مجدداً امتحان کنید.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleFinishAndStart = () => {
    if (assessmentResult) {
      onAssessmentCompleted(assessmentResult, generatedCalendar, generatedWeaknesses);
    }
    onClose();
  };

  const activeTaskDiagnosis = taskAssessments[stepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md font-fa animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isCycleReassessment
                    ? 'تعیین سطح مجدد: شروع ترم جدید'
                    : 'تعیین سطح و عارضه‌یابی هوشمند ویس و اسپیکینگ'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold font-en">
                  {isCycleReassessment ? 'Cycle Re-Assessment' : 'Multimodal Diagnostic'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isCycleReassessment
                  ? '۱۰ درس قبلی تمام شد. الان دوباره نقاط ضعف اولویت‌دار شما از چک‌لیست مرجع استخراج می‌شود تا ۱۰ سناریوی جدید طراحی گردد.'
                  : 'آنالیز آکوستیک ویس، لهجه امریکن، و تدوین نقشه راه ۱۰ سناریو بر اساس چک‌لیست C2'}
              </p>
            </div>
          </div>
          {!isCycleReassessment || assessmentResult ? (
            <button
              onClick={() => {
                if (assessmentResult) {
                  onAssessmentCompleted(assessmentResult, generatedCalendar, generatedWeaknesses);
                }
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP PROGRESS */}
          {!assessmentResult && !isAnalyzing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold font-en">
                    {stepIndex + 1}
                  </span>
                  <span className="font-bold text-slate-200">{currentPrompt.titleFa}</span>
                </div>
                <span className="font-en text-indigo-400 font-bold text-xs">
                  Step {stepIndex + 1} of {ASSESSMENT_PROMPTS.length}
                </span>
              </div>

              {/* Prompt Box */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-indigo-300 font-bold font-en tracking-wider uppercase">
                    {currentPrompt.taskName}
                  </span>
                  <button
                    onClick={() => playAudioText(currentPrompt.promptEn)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-[11px] transition"
                    title="شنیدن تلفظ سوال با صدای نیتیو"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>پخش صوتی سوال</span>
                  </button>
                </div>
                <p className="font-en text-sm sm:text-base text-white font-semibold leading-relaxed">
                  "{currentPrompt.promptEn}"
                </p>
                <p className="text-xs text-slate-300 font-fa leading-relaxed">
                  {currentPrompt.promptFa}
                </p>
                <div className="pt-1.5 border-t border-slate-700/50 text-[10px] text-indigo-300/90 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{currentPrompt.expectedPointsFa}</span>
                </div>
              </div>

              {/* Live Voice Recorder Area */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    ضبط پاسخ صوتی شما (تحلیل تخصصی ویس و آکوستیک):
                  </label>
                  {isRecording && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40 flex items-center gap-1.5 animate-pulse font-en font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      RECORDING 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                    </span>
                  )}
                </div>

                {/* Recorder Control Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={toggleRecording}
                    className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 transition shadow-lg active:scale-95 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                        : currentAudio
                        ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 fill-white" />
                        <span>توقف ضبط ویس ({recordingSeconds}s)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>{currentAudio ? 'ضبط مجدد پاسخ صوتی' : 'شروع ضبط پاسخ صوتی'}</span>
                      </>
                    )}
                  </button>

                  {/* Volume Visualizer Bar when recording */}
                  {isRecording && (
                    <div className="flex-1 w-full flex items-center gap-1 h-6 bg-slate-900 rounded-xl px-3 border border-red-500/30">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                        const threshold = bar * 0.1;
                        const active = audioVolume >= threshold;
                        return (
                          <div
                            key={bar}
                            className={`flex-1 rounded-full transition-all duration-75 ${
                              active
                                ? bar > 7
                                  ? 'bg-red-500 h-4'
                                  : bar > 4
                                  ? 'bg-amber-400 h-3.5'
                                  : 'bg-cyan-400 h-3'
                                : 'bg-slate-800 h-1.5'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Audio preview when recording finished */}
                  {currentAudio && !isRecording && (
                    <div className="flex-1 w-full flex items-center justify-between bg-slate-800/90 rounded-2xl px-3.5 py-2 border border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePlayRecordedAudio}
                          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
                          title={isPlayingRecorded ? 'توقف پخش' : 'پخش ویس ضبط‌شده'}
                        >
                          {isPlayingRecorded ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 fill-white" />
                          )}
                        </button>
                        <div className="text-right">
                          <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {taskAssessments[stepIndex]
                              ? 'ویس ذخیره و تحلیل واقعی شد'
                              : isTaskAnalyzing
                              ? 'در حال تحلیل عمیق ویس…'
                              : 'ویس ذخیره شد — منتظر تحلیل'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-en">
                            {taskAssessments[stepIndex]
                              ? 'Real STT + Phonetic Analysis'
                              : 'Pending AI analysis'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleResetCurrentRecording}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition"
                        title="حذف و ضبط دوباره"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* TASK LIVE VOICE DIAGNOSIS DISPLAY */}
                {isTaskAnalyzing && (
                  <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-center space-y-2 animate-pulse">
                    <div className="flex items-center justify-center gap-2 text-cyan-300 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>در حال گوش دادن به ویس و تحلیل Flap T، ریتم و لهجه امریکن توسط هوش مصنوعی...</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      فایل صوتی ضبط‌شده شما مستقیماً توسط پردازشگر آکوستیک در حال ارزیابی است.
                    </p>
                  </div>
                )}

                {activeTaskDiagnosis && !isTaskAnalyzing && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">
                          نتایج تحلیل آکوستیک و لهجه صدای شما در این تسک:
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-en font-bold">
                        {activeTaskDiagnosis.scores.accent}% American Accent
                      </span>
                    </div>

                    {/* Transcribed speech text */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <span>متن استخراج‌شده از صدای شما:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-en text-cyan-400 text-[10px]">
                            {activeTaskDiagnosis.wpm} WPM
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                            className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                            title="ویرایش یا بازبینی دستی متن"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>ویرایش دستی</span>
                          </button>
                        </div>
                      </div>
                      {isEditingTranscript ? (
                        <textarea
                          rows={2}
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-indigo-500 text-xs font-en text-white focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs text-white font-en font-medium leading-relaxed">
                          "{activeTaskDiagnosis.transcription}"
                        </p>
                      )}
                    </div>

                    {/* Acoustic Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                        <span className="text-indigo-300 font-bold block mb-0.5">
                          تلفظ Flap T امریکن:
                        </span>
                        <span className="text-[10.5px] leading-relaxed">
                          {activeTaskDiagnosis.acousticFeedback.flapT}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200">
                        <span className="text-cyan-300 font-bold block mb-0.5">
                          صدای R امریکن (Rhotic R):
                        </span>
                        <span className="text-[10.5px] leading-relaxed">
                          {activeTaskDiagnosis.acousticFeedback.rhoticR}
                        </span>
                      </div>
                    </div>

                    {/* Persian Transfer Pitfall if detected */}
                    {activeTaskDiagnosis.persianTransferFound && (
                      <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">هشدار تداخل گرامر فارسی: </span>
                          {activeTaskDiagnosis.persianTransferFound}
                        </div>
                      </div>
                    )}

                    {/* Native American Alternative Model */}
                    {activeTaskDiagnosis.nativeAlternative && (
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            اگر یک امریکن نیتیو این مفهوم را می‌گفت:
                          </span>
                          <button
                            onClick={() => playAudioText(activeTaskDiagnosis.nativeAlternative)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="شنیدن تلفظ نیتیو"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        </div>
                        <p className="text-xs text-emerald-300 font-en font-medium">
                          "{activeTaskDiagnosis.nativeAlternative}"
                        </p>
                        <p className="text-[10px] text-slate-400 font-fa">
                          {activeTaskDiagnosis.nativeAlternativeFa}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual text backup if audio recording not supported or desired */}
                {!activeTaskDiagnosis && !isTaskAnalyzing && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>متن پیاده‌شده یا تایپ دستی (اختیاری):</span>
                      {currentInput && (
                        <span className="font-en text-[10px]">
                          {currentInput.split(/\s+/).filter(Boolean).length} words
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="صدای خود را ضبط کنید، یا می‌توانید پاسختان را به انگلیسی بنویسید..."
                      className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-en text-slate-100 placeholder:font-fa placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                )}

                {micError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <div>
                        <span className="font-bold">خطا: </span>
                        {micError}
                      </div>
                      {currentAudio && (
                        <button
                          type="button"
                          onClick={() =>
                            triggerTaskVoiceAssessment(
                              currentAudio.base64,
                              currentAudio.mimeType,
                              currentInput,
                              stepIndex
                            )
                          }
                          disabled={isTaskAnalyzing}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] font-bold disabled:opacity-50"
                        >
                          تلاش مجدد برای تحلیل ویس
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleNextStep}
                  disabled={
                    isTaskAnalyzing ||
                    (!currentInput.trim() && !currentAudio) ||
                    Boolean(currentAudio && !taskAssessments[stepIndex])
                  }
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:opacity-95 text-white text-xs sm:text-sm font-bold transition shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <span>
                    {isTaskAnalyzing
                      ? 'در حال تحلیل ویس…'
                      : stepIndex + 1 === ASSESSMENT_PROMPTS.length
                      ? 'ثبت و تحلیل عمیق نتایج تعیین سطح و طراحی نقشه راه C2'
                      : 'تأیید و رفتن به بخش بعدی آزمون'}
                  </span>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {!isCycleReassessment && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 text-[11px] font-medium transition text-center"
                  >
                    بعداً تعیین سطح می‌کنم
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ANALYZING STATE */}
          {isAnalyzing && (
            <div className="p-8 text-center text-slate-300 text-xs rounded-3xl bg-slate-950/80 border border-indigo-500/30 space-y-4 my-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <Sparkles className="w-7 h-7 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="font-black text-base text-white">
                  در حال آنالیز عمیق آکوستیک، گرامر و طراحی سناریوها تا سطح C2...
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  هوش مصنوعی در حال تحلیل رزونانس صدا، سنجش Flap T، اتصال حروف (Linking)، تداخلات زبان مادری و تدوین تقویم ۱۰۰۰ سناریوی اختصاصی تا تسلط کامل است.
                </p>
              </div>

              <div className="space-y-2 pt-2 max-w-xs mx-auto text-[11px] text-slate-300 text-right">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>تحلیل آکوستیک ویس و درصد لهجه امریکن</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>ردیابی الگوهای گرامری و ترجمه تحت‌اللفظی</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>تدوین سناریوهای هدفمند و تقویم آموزشی تا سطح C2</span>
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSTIC RESULTS SCREEN */}
          {assessmentResult && (
            <div className="space-y-4">
              {/* Level banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-400" />
                    <div>
                      <div className="text-xs text-slate-400">سطح تعیین‌شده شما بر اساس تحلیل ویس:</div>
                      <div className="text-xl font-black text-white font-en">
                        Level {assessmentResult.cefrLevel}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                      هدف نهایی: سطح C2 Native
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      نقشه راه چندفازه تا تسلط ۱۰۰٪
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {assessmentResult.levelDescriptionFa}
                </p>
              </div>

              {/* Score Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="text-[10px] text-slate-400">لهجه و آکوستیک</div>
                  <div className="text-base font-black text-indigo-400 font-en mt-1">
                    {assessmentResult.accentScore || assessmentResult.pronunciationScore}%
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="text-[10px] text-slate-400">گرامر و ساختار</div>
                  <div className="text-base font-black text-cyan-400 font-en mt-1">
                    {assessmentResult.grammarScore}%
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="text-[10px] text-slate-400">روانی کلام و ریتم</div>
                  <div className="text-base font-black text-emerald-400 font-en mt-1">
                    {assessmentResult.fluencyScore}%
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <div className="text-[10px] text-slate-400">اصطلاحات نیتیو</div>
                  <div className="text-base font-black text-amber-400 font-en mt-1">
                    {assessmentResult.vocabularyScore}%
                  </div>
                </div>
              </div>

              {/* Acoustic & Accent Diagnostics */}
              {assessmentResult.acousticFeedback && (
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>بررسی تخصصی تلفظ و ویژگی‌های صوتی امریکن:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    {assessmentResult.acousticFeedback.flapT && (
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                        <span className="font-bold text-indigo-300">تلفظ Flap T: </span>
                        {assessmentResult.acousticFeedback.flapT}
                      </div>
                    )}
                    {assessmentResult.acousticFeedback.rhoticR && (
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                        <span className="font-bold text-cyan-300">صدای R امریکن: </span>
                        {assessmentResult.acousticFeedback.rhoticR}
                      </div>
                    )}
                    {assessmentResult.acousticFeedback.vowelReduction && (
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                        <span className="font-bold text-amber-300">کاهش واکه‌ها (Schwa): </span>
                        {assessmentResult.acousticFeedback.vowelReduction}
                      </div>
                    )}
                    {assessmentResult.acousticFeedback.rhythm && (
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                        <span className="font-bold text-emerald-300">ریتم تکیه‌ای: </span>
                        {assessmentResult.acousticFeedback.rhythm}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weaknesses List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>نقاط ضعف کلیدی شناسایی‌شده برای درمان در سناریوها:</span>
                  <span className="text-[10px] text-amber-400 font-en font-bold">
                    {generatedWeaknesses.length} Weaknesses Injected
                  </span>
                </div>
                <div className="space-y-1.5">
                  {generatedWeaknesses.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-right space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          {w.titleFa}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            w.severity === 'high'
                              ? 'bg-red-950 text-red-300 border border-red-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {w.severity === 'high' ? 'اولویت بالا' : 'اولویت متوسط'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {w.descriptionFa}
                      </p>
                      {w.examples && w.examples.length > 0 && (
                        <div className="text-[10px] font-en text-cyan-300/90 pt-0.5">
                          Ex: {w.examples[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progressive Scenario Curriculum to C2 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950/60 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    طرح درس دوره جاری: ۱۰ سناریوی هدفمند برای ۱۰ نقطه ضعف اولویت‌دار
                  </span>
                  <span className="text-[10px] text-cyan-300 font-bold">
                    چرخه یادگیری تا C2
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  بر اساس چک‌لیست علمی استادی C2، ۱۰ نقطه ضعف کلیدی شما اولویت‌بندی شده و دقیقاً ۱۰ سناریوی تعاملی اختصاصی برای درمان آنها تدوین شد. پس از اتمام این ۱۰ سناریو با تسلط حداقل ۸۰ درصدی، مجدداً یک تعیین سطح جامع مستقل برگزار شده و ۱۰ درس جدید برای ۱۰ مورد اولویت‌دار بعدی طراحی می‌گردد (حتی اگر قبلاً تمرین شده باشند و هنوز ضعف باقی باشد) تا به سطح C2 برسید.
                </p>

                {/* Scenario Preview List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {generatedCalendar.slice(0, 8).map((sc) => (
                    <div
                      key={sc.id}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-right space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{sc.icon}</span>
                          <span className="font-bold text-white">{sc.titleFa}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-en font-bold">
                          Day {sc.dayIndex} • Level {sc.targetLevel || assessmentResult?.cefrLevel || 'B2'}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 flex items-center gap-2">
                        <span>🎯 گرامر: {sc.targetGrammarFa || sc.targetGrammar}</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-en flex items-center gap-2">
                        <span>✨ Clichés: {(sc.targetCliches || []).join(' • ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Confirm Button */}
              <button
                onClick={handleFinishAndStart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white text-xs sm:text-sm font-black transition shadow-xl flex items-center justify-center gap-2"
              >
                <span>شروع برنامه یادگیری و ورود به سناریوی روز اول</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
