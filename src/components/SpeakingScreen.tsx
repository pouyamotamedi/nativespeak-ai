import React, { useState, useEffect, useRef } from 'react';
import {
  AIPersona,
  Scenario,
  SpeakingMessage,
  LeitnerWord,
  SpeakingAnalysis,
  PracticeItem,
  ScenarioSummary,
  CalendarScenario,
  WeaknessItem,
} from '../types';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Info,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  Check,
  Flag,
  Calendar,
  Target,
  Repeat,
  Layers,
  Compass,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import {
  playAudioText,
  stopAudioPlayback,
  startAudioRecording,
  createSpeechRecognizer,
  playChimeSound,
  transcribeAudioBase64,
} from '../utils/audio';
import { evaluateSpeakingTextLocally, convertCalendarToScenario } from '../utils/linguisticEngine';
import {
  getStoredScenarioDraft,
  saveStoredScenarioDraft,
  clearStoredScenarioDraft,
} from '../utils/storage';
import {
  EMPTY_MASTERY_EVIDENCE,
  MasteryEvidence,
  MASTERY_MIN_STRONG_TURNS,
  MASTERY_MIN_PHONETICS_STRONG_TURNS,
  evaluateQuantitativeMastery,
  mergeMasteryEvidence,
} from '../utils/masteryCriteria';
import {
  phoneticsHintsFromAnalysis,
  PHONETICS_MIN_SCORE_WITH_AUDIO,
} from '../utils/phoneticsStrictness';
import { apiFetch } from '../utils/userApiKeys';
import { ScenarioSummaryModal } from './ScenarioSummaryModal';
import { ScenarioCalendarModal } from './ScenarioCalendarModal';

interface Props {
  persona: AIPersona;
  activeScenario: Scenario;
  calendar?: CalendarScenario[];
  onSelectCalendarScenario?: (scenario: CalendarScenario) => void;
  leitnerWords: LeitnerWord[];
  practiceItems: PracticeItem[];
  onAddWordToLeitner: (word: string) => void;
  onAddClicheToPractice: (cliche: string, meaningFa: string) => void;
  onAddWordToBoth: (word: string) => void;
  onSessionMinuteLogged: (minutes: number) => void;
  onScenarioCompleted: () => void;
  onUpdateMetrics: (
    grammarScore: number,
    fluencyScore: number,
    phoneticsHints?: Partial<import('../types').UserProgress['phoneticsBreakdown']>
  ) => void;
  activeWeaknesses: string[];
  onWeaknessUpdated: (newWeaknesses: string[], improvedWeaknesses: string[]) => void;
  onGenerateAdaptiveScenario?: () => void;
  weaknessesItems?: WeaknessItem[];
  cefrLevel?: string;
  isAssessmentCompleted?: boolean;
  onOpenCalendar?: () => void;
  onOpenAssessment?: () => void;
}

export const SpeakingScreen: React.FC<Props> = ({
  persona,
  activeScenario,
  calendar = [],
  onSelectCalendarScenario,
  leitnerWords,
  practiceItems,
  onAddWordToLeitner,
  onAddClicheToPractice,
  onAddWordToBoth,
  onSessionMinuteLogged,
  onScenarioCompleted,
  onUpdateMetrics,
  activeWeaknesses,
  onWeaknessUpdated,
  onGenerateAdaptiveScenario,
  weaknessesItems = [],
  cefrLevel = 'B1',
  isAssessmentCompleted = true,
  onOpenCalendar,
  onOpenAssessment,
}) => {
  const [messages, setMessages] = useState<SpeakingMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Active Information (i) Tooltip/Sheet modal
  const [selectedInfoAnalysis, setSelectedInfoAnalysis] = useState<SpeakingAnalysis | null>(null);

  // Selected Text Toolbar
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [textToolbarFeedback, setTextToolbarFeedback] = useState<string | null>(null);

  // End of scenario summary
  const [scenarioSummary, setScenarioSummary] = useState<ScenarioSummary | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [pendingMasteryComplete, setPendingMasteryComplete] = useState(false);
  const [masteryEvidence, setMasteryEvidence] = useState<MasteryEvidence>(EMPTY_MASTERY_EVIDENCE);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Early Exit Warning Modal
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // Scenario Calendar Modal & Inline 10-Lesson Drawer
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isScenarioDrawerOpen, setIsScenarioDrawerOpen] = useState(false);

  // Added Clichés & Leitner Words feedback
  const [addedCliches, setAddedCliches] = useState<Record<string, boolean>>({});
  const [addedLeitnerPhrases, setAddedLeitnerPhrases] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRecorderRef = useRef<any>(null);
  const speechRecognizerRef = useRef<any>(null);
  const volumeIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Target Leitner words for this dialogue
  const targetWords = leitnerWords.slice(0, 4).map((w) => w.word);

  // Target cliches for this scenario
  const targetClichesList: string[] =
    activeScenario.targetCliches && activeScenario.targetCliches.length > 0
      ? activeScenario.targetCliches
      : activeScenario.clicheTag
      ? activeScenario.clicheTag.split('/').map((s) => s.trim()).filter(Boolean)
      : [];

  // Track which cliches have been uttered by user in current conversation
  const userMessagesTextCombined = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.text.toLowerCase())
    .join(' ');

  const clichesUsageStatus = targetClichesList.map((cliche) => {
    const cleanCliche = cliche.replace(/\(.*?\)/g, '').trim().toLowerCase();
    const isUsed = cleanCliche.length > 0 && userMessagesTextCombined.includes(cleanCliche);
    return { cliche, isUsed };
  });

  const usedClichesCount = clichesUsageStatus.filter((c) => c.isUsed).length;
  const unmetCliches = clichesUsageStatus.filter((c) => !c.isUsed).map((c) => c.cliche);

  // AI-evaluated lesson progress from /api/chat
  const [aiLessonProgress, setAiLessonProgress] = useState<{
    progressPercent: number;
    isGoalSatisfied: boolean;
    unmetGoalsFa?: string[];
    coachingFeedbackFa?: string;
  } | null>(null);

  const userTurnsCount = messages.filter((m) => m.role === 'user').length;
  const isPhoneticsLesson = /flap|rhotic|schwa|glottal|linking|stress|intonation|phonetic|تلفظ|فلپ|شوآ|آهنگ|لهجه/i.test(
    `${activeScenario.targetPronunciation || ''} ${activeScenario.targetGrammar || ''}`
  );
  const masteryEval = evaluateQuantitativeMastery({
    evidence: masteryEvidence,
    targetCliches: targetClichesList,
    aiProgressPercent: aiLessonProgress?.progressPercent,
    aiSaysSatisfied: aiLessonProgress?.isGoalSatisfied,
    requirePhoneticsGate: true, // voice-first app: always enforce phonetics strong turns
  });
  const progressPercentage = masteryEval.progressPercent;
  // Quantitative gate: ≥N strong turns + clichés + phonetics + ≥80% — AI alone cannot unlock
  const isGoalSatisfied = masteryEval.isGoalSatisfied;

  // Index of active scenario in the 10-lesson calendar cohort
  const currentCalendarIndex = calendar.findIndex(
    (c) => c.id === activeScenario.id || c.titleFa === activeScenario.titleFa
  );

  const chatStorageKey = `nativespeak_chat_${activeScenario.id}`;

  // Initialize or restore persistent dialogue for this scenario (UX Persistence)
  useEffect(() => {
    try {
      const draft = getStoredScenarioDraft(activeScenario.id);
      if (draft && Array.isArray(draft.messages) && draft.messages.length > 0) {
        setMessages(draft.messages);
        if (typeof draft.progressPercent === 'number') {
          setAiLessonProgress({
            progressPercent: draft.progressPercent,
            isGoalSatisfied: Boolean(draft.isGoalSatisfied),
          });
        }
        if (draft.masteryEvidence) {
          setMasteryEvidence({
            strongTurns: draft.masteryEvidence.strongTurns || 0,
            phoneticsStrongTurns: draft.masteryEvidence.phoneticsStrongTurns || 0,
            clichesHitCorrectly: draft.masteryEvidence.clichesHitCorrectly || [],
          });
        } else {
          setMasteryEvidence(EMPTY_MASTERY_EVIDENCE);
        }
        setSelectedInfoAnalysis(null);
        return;
      }

      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setMasteryEvidence(EMPTY_MASTERY_EVIDENCE);
          setSelectedInfoAnalysis(null);
          return;
        }
      }
    } catch (e) {}

    // Default starter if no previous messages exist for this scenario
    setMessages([
      {
        id: 'starter',
        role: 'model',
        text: activeScenario.starter,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persianTranslation: activeScenario.starterFa,
      },
    ]);
    setAiLessonProgress(null);
    setMasteryEvidence(EMPTY_MASTERY_EVIDENCE);
    setSelectedInfoAnalysis(null);
  }, [activeScenario.id, chatStorageKey]);

  // Persist conversation messages whenever messages state updates
  useEffect(() => {
    if (messages.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages, chatStorageKey]);

  // Handler to reset/restart current scenario conversation
  const handleResetCurrentScenario = () => {
    try {
      clearStoredScenarioDraft(activeScenario.id);
      localStorage.removeItem(chatStorageKey);
    } catch (e) {}
    setMessages([
      {
        id: 'starter',
        role: 'model',
        text: activeScenario.starter,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persianTranslation: activeScenario.starterFa,
      },
    ]);
    setAiLessonProgress(null);
    setMasteryEvidence(EMPTY_MASTERY_EVIDENCE);
    setSelectedInfoAnalysis(null);
    setShowResetConfirm(false);
    playChimeSound('ding');
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, isRecording]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Selection / Highlight listener
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }
      const text = selection.toString().trim();
      if (text.length > 1 && text.length < 80) {
        setSelectedText(text);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Voice recording toggle with actual audio capture for genuine acoustic evaluation
  const toggleRecording = async () => {
    setMicErrorMessage(null);

    if (isRecording) {
      // STOP recording
      setIsRecording(false);
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecordingSeconds(0);
      setAudioVolume(0);

      try {
        if (speechRecognizerRef.current) {
          speechRecognizerRef.current.stop();
        }

        if (audioRecorderRef.current) {
          const audioResult = await audioRecorderRef.current.stop();
          audioRecorderRef.current = null;
          handleSendMessage(inputVal, audioResult.base64, audioResult.mimeType, audioResult.audioUrl);
        } else {
          handleSendMessage(inputVal);
        }
      } catch (e: any) {
        console.warn('Error stopping recording:', e);
        handleSendMessage(inputVal);
      }
    } else {
      // START recording
      stopAudioPlayback();
      setInputVal('');
      setRecordingSeconds(0);

      try {
        const session = await startAudioRecording();
        audioRecorderRef.current = session;
        setIsRecording(true);

        volumeIntervalRef.current = setInterval(() => {
          if (session.getVolumeLevel) {
            setAudioVolume(session.getVolumeLevel());
          }
        }, 80);

        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        try {
          const recognizer = createSpeechRecognizer({
            lang: 'en-US',
            onResult: (text) => setInputVal(text),
            onError: (err) => console.warn('Live recognition notice:', err),
          });
          recognizer.start();
          speechRecognizerRef.current = recognizer;
        } catch (recErr) {
          console.warn('SpeechRecognition not available, will use direct audio transmission:', recErr);
        }
      } catch (err: any) {
        console.error('Microphone error:', err);
        setIsRecording(false);
        setMicErrorMessage(err.message || 'دسترسی به میکروفون مسدود است.');
      }
    }
  };

  const handleSendMessage = async (
    textToSend?: string,
    audioBase64?: string,
    audioMimeType?: string,
    userAudioUrl?: string
  ) => {
    let messageText = (textToSend || inputVal).trim();
    if (!messageText && !audioBase64) return;
    if (isProcessing) return;

    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch (e) {}
    }

    // Dedicated STT (Whisper → Gemini) when we have audio
    if (audioBase64) {
      try {
        const stt = await transcribeAudioBase64(audioBase64, audioMimeType || 'audio/webm', 'en');
        if (stt.text) {
          messageText = stt.text;
        }
      } catch (sttErr) {
        console.warn('Dedicated STT failed, continuing with live caption / audio:', sttErr);
      }
    }

    const userMsg: SpeakingMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageText || 'صدای ضبط‌شده شما',
      audioUrl: userAudioUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);

    try {
      const chatHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          scenarioId: activeScenario.id,
          scenarioTitle: activeScenario.title,
          context: activeScenario.descriptionFa,
          relationship: activeScenario.relationship,
          userRole: activeScenario.userRole,
          aiRole: activeScenario.aiRole,
          userMessage: messageText,
          userAudioBase64: audioBase64,
          userAudioMimeType: audioMimeType,
          chatHistory,
          targetWords,
          targetGrammar: activeScenario.targetGrammar,
          targetGrammarFa: activeScenario.targetGrammarFa,
          targetCliches: targetClichesList,
          targetPronunciation: activeScenario.targetPronunciation || '',
          activeWeaknesses,
          weaknessesItems,
          cefrLevel,
          targetLevel: activeScenario.targetLevel || cefrLevel,
          persona: {
            name: persona.name,
            accent: persona.accent,
            tone: persona.tone,
          },
        }),
      });

      let data: any = null;
      if (response.ok) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.warn('Could not parse response JSON:', jsonErr);
        }
      }

      if (!data || !data.analysis) {
        const local = evaluateSpeakingTextLocally(messageText, activeScenario, persona);
        data = {
          reply: data?.reply || local.reply,
          persianTranslation: data?.persianTranslation || local.persianTranslation,
          analysis: local.analysis,
          transcribedUserText: messageText,
        };
      }

      const finalUserText =
        data.transcribedUserText ||
        (messageText && messageText !== 'صدای ضبط‌شده شما'
          ? messageText
          : data.analysis?.userSpokenTranscript || userMsg.text);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id
            ? { ...m, text: finalUserText, analysis: data.analysis }
            : m
        )
      );

      const modelMsg: SpeakingMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || "That's great, let's keep going!",
        persianTranslation: data.persianTranslation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);

      if (data.analysis) {
        onUpdateMetrics(
          data.analysis.grammarScore || 85,
          data.analysis.fluencyScore || data.analysis.overallScore || 80,
          phoneticsHintsFromAnalysis(data.analysis)
        );
        if (data.analysis.newWeaknessIdentified || data.analysis.weaknessImprovementNoted) {
          onWeaknessUpdated(
            data.analysis.newWeaknessIdentified ? [data.analysis.newWeaknessIdentified] : [],
            data.analysis.weaknessImprovementNoted ? [data.analysis.weaknessImprovementNoted] : []
          );
        }
      }

      if (data?.analysis?.lessonProgress) {
        setAiLessonProgress(data.analysis.lessonProgress);
      }

      const nextEvidence = mergeMasteryEvidence(masteryEvidence, {
        overallScore: data.analysis?.overallScore || 0,
        userText: finalUserText,
        targetCliches: targetClichesList,
        usedTargetClichesFromAi:
          data.analysis?.usedTargetClichesCorrectly ||
          data.analysis?.usedTargetWords ||
          [],
        pronunciationScore: data.analysis?.pronunciationScore,
        hadAudio: Boolean(audioBase64),
        isPhoneticsLesson,
      });
      setMasteryEvidence(nextEvidence);

      const freshEval = evaluateQuantitativeMastery({
        evidence: nextEvidence,
        targetCliches: targetClichesList,
        aiProgressPercent: data?.analysis?.lessonProgress?.progressPercent,
        aiSaysSatisfied: data?.analysis?.lessonProgress?.isGoalSatisfied,
        requirePhoneticsGate: true,
      });
      setAiLessonProgress((prev) => ({
        progressPercent: freshEval.progressPercent,
        isGoalSatisfied: freshEval.isGoalSatisfied,
        unmetGoalsFa: freshEval.unmetGoalsFa,
        coachingFeedbackFa:
          data?.analysis?.lessonProgress?.coachingFeedbackFa || prev?.coachingFeedbackFa,
      }));

      void playAudioText(data.reply, {
        lang: 'en-US',
        rate: speechRate * persona.speechRate,
        pitch: persona.speechPitch,
      });

      onSessionMinuteLogged(1);

      const draftMessages = [
        ...messages.map((m) =>
          m.id === userMsg.id
            ? { ...m, text: finalUserText, analysis: data.analysis }
            : m
        ),
        modelMsg,
      ];
      saveStoredScenarioDraft(activeScenario.id, {
        messages: draftMessages,
        progressPercent: freshEval.progressPercent,
        isGoalSatisfied: freshEval.isGoalSatisfied,
        masteryEvidence: nextEvidence,
      });
    } catch (err: any) {
      console.warn('Network issue in chat, falling back to local engine:', err);
      const local = evaluateSpeakingTextLocally(messageText, activeScenario, persona);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsg.id ? { ...m, analysis: local.analysis } : m
        )
      );

      const fallbackMsg: SpeakingMessage = {
        id: `model-fb-${Date.now()}`,
        role: 'model',
        text: local.reply,
        persianTranslation: local.persianTranslation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);

      const nextEvidence = mergeMasteryEvidence(masteryEvidence, {
        overallScore: local.analysis?.overallScore || 0,
        userText: messageText,
        targetCliches: targetClichesList,
        pronunciationScore: local.analysis?.pronunciationScore,
        hadAudio: Boolean(audioBase64),
        isPhoneticsLesson,
      });
      setMasteryEvidence(nextEvidence);
      const freshEval = evaluateQuantitativeMastery({
        evidence: nextEvidence,
        targetCliches: targetClichesList,
        requirePhoneticsGate: true,
      });
      setAiLessonProgress({
        progressPercent: freshEval.progressPercent,
        isGoalSatisfied: freshEval.isGoalSatisfied,
        unmetGoalsFa: freshEval.unmetGoalsFa,
      });
      onUpdateMetrics(
        local.analysis?.grammarScore || 70,
        local.analysis?.overallScore || 70,
        phoneticsHintsFromAnalysis(local.analysis)
      );
      onSessionMinuteLogged(1);

      void playAudioText(local.reply, {
        lang: 'en-US',
        rate: speechRate * persona.speechRate,
        pitch: persona.speechPitch,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndScenario = async (markAsMastered = false) => {
    setIsSummarizing(true);
    try {
      const res = await apiFetch('/api/summarize-scenario', {
        method: 'POST',
        body: JSON.stringify({
          scenarioTitle: activeScenario.titleFa,
          context: activeScenario.descriptionFa,
          relationship: activeScenario.relationship,
          messages: messages.slice(1),
          activeWeaknesses,
        }),
      });

      if (!res.ok) throw new Error('خطا در جمع‌بندی سناریو');
      const data = await res.json();
      setScenarioSummary(data);
      setPendingMasteryComplete(markAsMastered && isGoalSatisfied);
      setIsSummaryModalOpen(true);
      playChimeSound('levelUp');

      if (data.newWeaknessesAdded || data.weaknessesImproved) {
        onWeaknessUpdated(data.newWeaknessesAdded || [], data.weaknessesImproved || []);
      }
    } catch (e) {
      console.error(e);
      // Even if summary fails, allow mastery completion when user explicitly finished at ≥80%
      if (markAsMastered && isGoalSatisfied) {
        clearStoredScenarioDraft(activeScenario.id);
        onScenarioCompleted();
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleConfirmScenarioComplete = () => {
    setIsSummaryModalOpen(false);
    if (pendingMasteryComplete) {
      clearStoredScenarioDraft(activeScenario.id);
      setPendingMasteryComplete(false);
      onScenarioCompleted();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-fa select-text">
      {/* FLOATING TOP TOOLBAR ON TEXT SELECTION */}
      {selectedText && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-indigo-900 to-slate-900 border-b border-indigo-500/50 p-2 shadow-2xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 truncate max-w-[160px] sm:max-w-[200px]">
            <span className="text-[10px] text-slate-400">متن:</span>
            <span className="font-en font-bold text-cyan-300 truncate">"{selectedText}"</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onAddWordToLeitner(selectedText);
                setTextToolbarFeedback('به لایتنر افزوده شد ✓');
                setTimeout(() => {
                  setSelectedText(null);
                  setTextToolbarFeedback(null);
                }, 1500);
              }}
              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition"
            >
              افزودن به لایتنر
            </button>
            <button
              onClick={() => {
                onAddClicheToPractice(selectedText, 'ذخیره شده از مکالمه');
                setTextToolbarFeedback('به تمرینات افزوده شد ✓');
                setTimeout(() => {
                  setSelectedText(null);
                  setTextToolbarFeedback(null);
                }, 1500);
              }}
              className="px-2 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] transition"
            >
              افزودن به تمرینات
            </button>
            <button
              onClick={() => setSelectedText(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EMPTY CALENDAR STATE: Prompt user to take initial voice assessment */}
      {!isAssessmentCompleted || calendar.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 font-fa max-w-md mx-auto my-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 text-2xl">
            🎙️
          </div>
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-white">
              طراحی سناریوهای اختصاصی شما تا سطح C2
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              در نیتیو اسپیک، هیچ سناریوی پیش‌فرضی وجود ندارد! همه درس‌ها و سناریوها بر اساس تعیین سطح صوتی اولیه و نقاط ضعف واقعی صدای شما از سطح فعلی تا C2 Native طراحی می‌شوند.
            </p>
          </div>
          <button
            onClick={() => {
              if (onOpenAssessment) onOpenAssessment();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-xl shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>شروع تعیین سطح صوتی ۳ دقیقه‌ای</span>
          </button>
        </div>
      ) : (
        <>
          {/* SCENARIO SELECTION STRUCTURE & 10-LESSON SELECTOR */}
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0 space-y-2">
            {/* Top row: Prev/Next buttons + Current Scenario Title + End Lesson/Progress */}
            <div className="flex items-center justify-between gap-2">
              {/* Prev / Next Quick Step Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={currentCalendarIndex <= 0}
                  onClick={() => {
                    if (currentCalendarIndex > 0 && onSelectCalendarScenario) {
                      onSelectCalendarScenario(calendar[currentCalendarIndex - 1]);
                      playChimeSound('ding');
                    }
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition border border-slate-700/80 active:scale-95"
                  title="سناریوی قبلی"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentCalendarIndex >= calendar.length - 1}
                  onClick={() => {
                    if (currentCalendarIndex < calendar.length - 1 && onSelectCalendarScenario) {
                      onSelectCalendarScenario(calendar[currentCalendarIndex + 1]);
                      playChimeSound('ding');
                    }
                  }}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition border border-slate-700/80 active:scale-95"
                  title="سناریوی بعدی"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Active Scenario Title & Selector */}
              <button
                type="button"
                onClick={() => setIsScenarioDrawerOpen(!isScenarioDrawerOpen)}
                className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-right min-w-0 flex-1 transition group active:scale-98"
                title="تغییر و انتخاب از میان ۱۰ درس طراحی‌شده"
              >
                <span className="text-base shrink-0">{activeScenario.icon || '🎯'}</span>
                <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="text-[10px] text-cyan-400 font-bold block">
                      درس {currentCalendarIndex >= 0 ? currentCalendarIndex + 1 : 1} از {calendar.length}:
                    </span>
                    <span className="font-bold text-xs text-white truncate block group-hover:text-indigo-300 transition">
                      {activeScenario.titleFa}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 shrink-0 transition-transform ${
                      isScenarioDrawerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Progress & 80% Mastery Action */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition active:scale-95"
                  title="ریست پیش‌نویس این سناریو و شروع مجدد مکالمه"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`px-2 py-1 rounded-xl text-[10.5px] font-bold font-en border ${
                    progressPercentage >= 80
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : progressPercentage >= 60
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={`تسلط کمّی: ${masteryEvidence.strongTurns}/${MASTERY_MIN_STRONG_TURNS} نوبت قوی · تلفظ ${masteryEvidence.phoneticsStrongTurns || 0}/${MASTERY_MIN_PHONETICS_STRONG_TURNS} (≥${PHONETICS_MIN_SCORE_WITH_AUDIO}) · کلیشه ${masteryEval.clichesHit}/${masteryEval.clichesNeeded}`}
                >
                  {progressPercentage}% · {masteryEvidence.strongTurns}/{MASTERY_MIN_STRONG_TURNS} · 🎙️{masteryEvidence.phoneticsStrongTurns || 0}/{MASTERY_MIN_PHONETICS_STRONG_TURNS}
                </span>

                {isGoalSatisfied ? (
                  <button
                    onClick={() => handleEndScenario(true)}
                    disabled={isSummarizing}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black transition shadow-md shadow-emerald-600/30 animate-pulse"
                    title="شما به تسلط ۸۰٪ رسیدید! هر زمان خواستید سناریو را تمام کنید — یا ادامه دهید."
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>{isSummarizing ? '...' : 'اتمام درس (۸۰٪+)'}</span>
                  </button>
                ) : messages.length >= 2 ? (
                  <button
                    onClick={() => {
                      if (!isGoalSatisfied && userTurnsCount < 4) {
                        setIsWarningModalOpen(true);
                      } else {
                        handleEndScenario(false);
                      }
                    }}
                    disabled={isSummarizing}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10.5px] font-bold transition"
                    title="پایان سناریو (تسلط هنوز زیر ۸۰٪ است — درس کامل نمی‌شود)"
                  >
                    <Flag className="w-3 h-3 text-slate-400" />
                    <span>{isSummarizing ? '...' : 'پایان'}</span>
                  </button>
                ) : null}

                <button
                  onClick={() => {
                    const nextRate = speechRate === 1.0 ? 0.85 : speechRate === 0.85 ? 1.15 : 1.0;
                    setSpeechRate(nextRate);
                  }}
                  className="px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-en font-bold hover:bg-slate-700"
                  title="تغییر سرعت پخش صدا"
                >
                  {speechRate}x
                </button>
              </div>
            </div>

            {/* HORIZONTAL 10-LESSON SELECTOR CHIPS CAROUSEL */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
              {calendar.map((sc, idx) => {
                const isActive = sc.id === activeScenario.id || sc.titleFa === activeScenario.titleFa;
                const isMastered = sc.status === 'completed';
                return (
                  <button
                    key={sc.id || idx}
                    type="button"
                    onClick={() => {
                      if (onSelectCalendarScenario) onSelectCalendarScenario(sc);
                      playChimeSound('ding');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-cyan-400'
                        : isMastered
                        ? 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                    }`}
                    title={sc.titleFa}
                  >
                    <span className="text-xs">{sc.icon || '🎯'}</span>
                    <span className="text-[11px] whitespace-nowrap">درس {idx + 1}</span>
                    {isMastered && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* EXPANDABLE 10-LESSON SELECTOR DRAWER */}
            {isScenarioDrawerOpen && (
              <div className="p-2.5 rounded-2xl bg-slate-950/95 border border-indigo-500/40 space-y-2 animate-in fade-in shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>انتخاب از بین ۱۰ درس اختصاصی این ترم:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScenarioDrawerOpen(false);
                      if (onOpenCalendar) onOpenCalendar();
                      else setIsCalendarModalOpen(true);
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <Compass className="w-3 h-3" />
                    <span>نقشه کامل C2</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {calendar.map((sc, idx) => {
                    const isActive = sc.id === activeScenario.id || sc.titleFa === activeScenario.titleFa;
                    const isDone = sc.status === 'completed';

                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          if (onSelectCalendarScenario) {
                            onSelectCalendarScenario(sc);
                          }
                          setIsScenarioDrawerOpen(false);
                          playChimeSound('ding');
                        }}
                        className={`p-2 rounded-xl border text-right transition flex items-center justify-between gap-2 active:scale-98 ${
                          isActive
                            ? 'bg-indigo-600/30 border-indigo-400 ring-1 ring-indigo-400 text-white'
                            : isDone
                            ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/60 text-slate-200'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{sc.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 font-en">
                                #{sc.dayIndex || idx + 1}
                              </span>
                              <span className="font-bold text-xs truncate block text-white">
                                {sc.titleFa}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-slate-400 truncate block">
                              هدف: {sc.activeWeaknessesInjected?.[0] || sc.targetGrammarFa || sc.targetGrammar}
                            </span>
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] font-bold">
                          {isActive ? (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500 text-white text-[9px]">فعال</span>
                          ) : isDone ? (
                            <span className="text-emerald-400 text-[10px]">✓ تسلط</span>
                          ) : (
                            <span className="text-slate-500 text-[9px]">انتخاب</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compact Educational Targets Info */}
            <div className="flex items-center justify-between text-[10.5px] text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80 gap-2">
              <div className="flex items-center gap-1 truncate min-w-0">
                <Target className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-slate-400 shrink-0">هدف گرامر:</span>
                <span className="text-cyan-300 font-medium truncate">
                  {activeScenario.targetGrammarFa || activeScenario.targetGrammar || 'مکالمه روان نیتیو'}
                </span>
              </div>
              {targetClichesList.length > 0 && (
                <div className="flex items-center gap-1 truncate shrink-0 max-w-[45%] text-[10px]">
                  <span className="text-amber-400 shrink-0">اصطلاح:</span>
                  <span className="text-amber-200 font-en truncate">
                    {targetClichesList[0]?.replace(/\(.*?\)/g, '').trim()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const analysis = msg.analysis;

              return (
                <div key={msg.id} className="space-y-1">
                  {/* Message Bubble */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-3 sm:p-3.5 shadow-md ${
                        isUser
                          ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-br-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                      }`}
                    >
                      {/* Bubble Header */}
                      <div className="flex items-center justify-between gap-2 mb-1 text-[10.5px] opacity-80">
                        <span className="font-semibold">
                          {isUser ? 'شما' : `${persona.name} (${persona.badge})`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="font-en text-[10px]">{msg.timestamp}</span>
                          {!isUser && (
                            <button
                              onClick={() =>
                                playAudioText(msg.text, {
                                  lang: persona.accentCode,
                                  rate: speechRate * persona.speechRate,
                                  pitch: persona.speechPitch,
                                })
                              }
                              className="p-1 rounded-full hover:bg-slate-800 text-cyan-300"
                              title="پخش صوت"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Text */}
                      <p className="font-en text-xs sm:text-sm leading-relaxed tracking-wide select-text">
                        {msg.text}
                      </p>

                      {/* User Audio Replay & Quick Analysis Trigger */}
                      {isUser && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/20 flex items-center justify-between gap-2 flex-wrap">
                          {msg.audioUrl ? (
                            <button
                              onClick={() => {
                                const audio = new Audio(msg.audioUrl);
                                audio.play().catch(() => {});
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold transition"
                            >
                              <Volume2 className="w-3 h-3 text-cyan-300" />
                              <span>شنیدن صدای ضبط‌شده</span>
                            </button>
                          ) : (
                            <span className="text-[10px] opacity-75">پیام متنی</span>
                          )}

                          {analysis && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-en text-[10px] font-black px-1.5 py-0.2 rounded bg-black/30 text-emerald-300">
                                Native: {analysis.nativeScore}%
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedInfoAnalysis(analysis)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition"
                                title="مشاهده تحلیل کامل عارضه‌یابی و آکوستیک"
                              >
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                <span>تحلیل تفصیلی</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Persian Translation for Model */}
                      {!isUser && msg.persianTranslation && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[11px] text-slate-400 font-fa leading-relaxed">
                          {msg.persianTranslation}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* =========================================================================
                      NATIVE AMERICAN CONCEPT & CLICHÉ REFORMULATION CARD (اگر یک آمریکایی بود...)
                     ========================================================================= */}
                  {isUser && analysis && (analysis.nativeAlternative || analysis.nativeCliche) && (
                    <div className="mr-1 max-w-[95%] sm:max-w-[92%] ml-auto my-2 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/40 shadow-xl p-3 sm:p-4 space-y-3 font-fa text-right animate-in fade-in">
                      {/* Card Header: Prominent Banner & Quick Action Buttons */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/90">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>اگه یه امریکن نیتیو بود دقیقاً چی می‌گفت؟ (بازنویسی مفهومی)</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Audio Play Button */}
                          <button
                            type="button"
                            onClick={() => playAudioText(analysis.nativeAlternative || analysis.nativeCliche || '')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10.5px] font-bold transition shadow-sm border border-slate-700 active:scale-95"
                            title="شنیدن تلفظ با لهجه استاندارد آمریکایی"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>تلفظ نیتیو 🔊</span>
                          </button>

                          {/* Add Cliché to Practice Button with prominent styling */}
                          {onAddClicheToPractice && (
                            <button
                              type="button"
                              onClick={() => {
                                const clicheToAdd = analysis.nativeCliche || analysis.nativeAlternative || '';
                                const meaningToAdd =
                                  analysis.nativeClicheMeaningFa ||
                                  analysis.nativeAlternativeFa ||
                                  'اصطلاح و فرمول کاربردی نیتیو';
                                onAddClicheToPractice(clicheToAdd, meaningToAdd);
                                setAddedCliches((prev) => ({ ...prev, [msg.id]: true }));
                                playChimeSound('success');
                              }}
                              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-black transition shadow-md active:scale-95 ${
                                addedCliches[msg.id]
                                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black shadow-amber-500/20'
                              }`}
                              title="افزودن این کلیشه به منوی تمرین جهت پرسش و پاسخ‌های مکرر تا تسلط کامل"
                            >
                              {addedCliches[msg.id] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>به منوی تمرین رفت ✓</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                                  <span>+ افزودن به منوی تمرین</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Add Phrase to Leitner Button */}
                          {onAddWordToLeitner && (
                            <button
                              type="button"
                              onClick={() => {
                                const phrase =
                                  analysis.nativeCliche ||
                                  analysis.nativeAlternative.split(' ').slice(0, 3).join(' ');
                                onAddWordToLeitner(phrase);
                                setAddedLeitnerPhrases((prev) => ({ ...prev, [msg.id]: true }));
                                playChimeSound('ding');
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition shadow-sm active:scale-95 ${
                                addedLeitnerPhrases[msg.id]
                                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30'
                              }`}
                              title="افزودن این عبارت به جعبه لایتنر ۵ مرحله‌ای"
                            >
                              {addedLeitnerPhrases[msg.id] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-purple-400" />
                                  <span>به لایتنر رفت ✓</span>
                                </>
                              ) : (
                                <>
                                  <span>🗃️ لایتنر</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Full Deep-Dive Analysis Info Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedInfoAnalysis(analysis)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title="مشاهده جزئیات ۶ بعد تحلیل و فونتیک"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main English Reformulation Sentence */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cyan-400 font-bold font-en uppercase tracking-wider">
                            Natural American Phrasing:
                          </span>
                          <span className="text-[10px] font-en font-black text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30">
                            Native Authenticity: {analysis.nativeScore}%
                          </span>
                        </div>
                        <p className="font-en text-xs sm:text-sm font-bold text-white tracking-wide dir-ltr text-left select-text leading-relaxed">
                          "{analysis.nativeAlternative}"
                        </p>
                        {analysis.nativeAlternativeFa && (
                          <p className="font-fa text-xs text-slate-200 pt-1 border-t border-slate-800/80 leading-relaxed font-medium">
                            <strong className="text-cyan-300">مفهوم دقیق: </strong>
                            {analysis.nativeAlternativeFa}
                          </p>
                        )}
                      </div>

                      {/* Target Cliché & Formula Breakdown */}
                      {analysis.nativeCliche && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-xs flex-wrap">
                          <span className="text-amber-400 font-bold text-[11px] shrink-0">اصطلاح و فرمول کلیدی نیتیو:</span>
                          <span className="font-en text-cyan-300 font-black px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700">
                            "{analysis.nativeCliche}"
                          </span>
                          {analysis.nativeClicheMeaningFa && (
                            <span className="text-slate-300 text-[11px] font-fa">
                              ({analysis.nativeClicheMeaningFa})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Interactive Native Repetition Challenge Action */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border border-indigo-500/40 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                            <Repeat className="w-3.5 h-3.5 text-amber-400" />
                            <span>چالش تکرار نیتیو (جهت باز شدن زبان):</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-fa">تکرار جمله برای ادامه روان گفتگو</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-fa">
                          {analysis.repetitionChallengePromptFa ||
                            'حالا یک بار با صدای خودت همین جمله یا کلیشه نیتیو را تکرار کن تا زبانت به الگوی طبیعی آمریکایی عادت کند و مکالمه ادامه یابد:'}
                        </p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setInputVal(analysis.nativeAlternative || analysis.nativeCliche || '');
                              if (inputRef.current) {
                                inputRef.current.focus();
                              }
                              playChimeSound('ding');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 active:scale-95"
                          >
                            <Mic className="w-3.5 h-3.5 text-slate-950" />
                            <span>تکرار این کلیشه با صدای من 🎙️</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => playAudioText(analysis.nativeAlternative || analysis.nativeCliche || '')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>شنیدن تلفظ مجدد 🔊</span>
                          </button>
                        </div>
                      </div>

                      {/* AI Coach Probing Next Question */}
                      {analysis.inCharacterChallenge && analysis.inCharacterChallenge.probingQuestionEn && (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                            <span>پرسش بعدی مربی برای ادامه گفتگو:</span>
                          </div>
                          <p className="font-en text-xs text-white font-medium dir-ltr text-left">
                            "{analysis.inCharacterChallenge.probingQuestionEn}"
                          </p>
                          {analysis.inCharacterChallenge.probingQuestionFa && (
                            <p className="font-fa text-[11px] text-slate-400">
                              {analysis.inCharacterChallenge.probingQuestionFa}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Stylistic Alternatives (Natural, Casual, High-Impact) if available */}
                      {analysis.nativeAlternativesList && analysis.nativeAlternativesList.length > 1 && (
                        <div className="space-y-1.5 pt-0.5">
                          <span className="text-[10.5px] font-bold text-slate-400 block">
                            سایر روش‌های بیان این مفهوم توسط نیتیوها:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {analysis.nativeAlternativesList.slice(1, 3).map((alt, altIdx) => (
                              <div key={altIdx} className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-0.5">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-indigo-300 font-bold">{alt.labelFa || 'لحن دیگر'}</span>
                                  <button
                                    type="button"
                                    onClick={() => playAudioText(alt.english)}
                                    className="text-slate-400 hover:text-cyan-300 p-0.5"
                                    title="پخش صوت"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="font-en text-[11px] text-white font-medium dir-ltr text-left select-text">
                                  "{alt.english}"
                                </p>
                                <p className="font-fa text-[10px] text-slate-400">
                                  {alt.persian}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Persian Transfer Pitfall Warning (if any) */}
                      {analysis.persianTransferPitfall && (
                        <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-300 block mb-0.5">تله تداخل ترجمه مستقیم فارسی:</strong>
                            <p className="text-[11px] text-amber-100/90 leading-relaxed font-fa">
                              {analysis.persianTransferPitfall}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Pedagogical Corrections Preview (if grammar issues identified) */}
                      {analysis.categorizedIssues && analysis.categorizedIssues.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-red-300">اصلاح نکات دستوری جمله شما:</span>
                            <button
                              type="button"
                              onClick={() => setSelectedInfoAnalysis(analysis)}
                              className="text-[10px] text-cyan-400 hover:underline"
                            >
                              مشاهده عارضه‌یابی کامل ➔
                            </button>
                          </div>
                          {analysis.categorizedIssues.slice(0, 2).map((iss, iIdx) => (
                            <div key={iIdx} className="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                              {iss.originalSnippet && (
                                <span className="font-en text-red-400 line-through">"{iss.originalSnippet}"</span>
                              )}
                              {iss.correctedSnippet && (
                                <span className="font-en text-emerald-400 font-bold">➔ "{iss.correctedSnippet}"</span>
                              )}
                              <span className="text-slate-400 text-[10.5px]">({iss.titleFa})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 w-fit animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>مربی در حال شنیدن و تحلیل مکالمه شما...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </>
      )}

      {/* DETAILED INFO MODAL */}
      {selectedInfoAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in font-fa overflow-y-auto">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-indigo-500/40 p-5 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  تحلیل موشکافانه مربی (گرامر، لهجه و اتیکت)
                </h3>
              </div>
              <button
                onClick={() => setSelectedInfoAnalysis(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">گرامر و ساختار</span>
                <span className="text-base font-black text-cyan-300 font-en">
                  {selectedInfoAnalysis.grammarScore}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">طبیعی بودن و واژگان</span>
                <span className="text-base font-black text-emerald-300 font-en">
                  {selectedInfoAnalysis.nativeScore}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">بافت و کاربردشناسی</span>
                <span className="text-base font-black text-violet-300 font-en">
                  {selectedInfoAnalysis.contextScore ?? '—'}
                  {selectedInfoAnalysis.contextScore != null ? '%' : ''}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">ارتباط و کامل بودن</span>
                <span className="text-base font-black text-sky-300 font-en">
                  {selectedInfoAnalysis.communicationScore ?? '—'}
                  {selectedInfoAnalysis.communicationScore != null ? '%' : ''}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">تلفظ و اکسنت</span>
                <span className="text-base font-black text-amber-300 font-en">
                  {selectedInfoAnalysis.pronunciationScore ?? 80}%
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">روانی و تحویل</span>
                <span className="text-base font-black text-rose-300 font-en">
                  {selectedInfoAnalysis.fluencyScore ?? '—'}
                  {selectedInfoAnalysis.fluencyScore != null ? '%' : ''}
                </span>
              </div>
            </div>

            {selectedInfoAnalysis.categorizedIssues && selectedInfoAnalysis.categorizedIssues.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-300 block">ایرادات زبانی مشخص و روش اصلاح:</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedInfoAnalysis.categorizedIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{issue.titleFa}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-700 text-indigo-300">
                          {issue.categoryFa}
                        </span>
                      </div>
                      {issue.originalSnippet && (
                        <div className="font-en text-[11px] text-red-400 line-through">
                          "{issue.originalSnippet}"
                        </div>
                      )}
                      {issue.correctedSnippet && (
                        <div className="font-en text-[11px] text-emerald-400 font-semibold">
                          ➔ "{issue.correctedSnippet}"
                        </div>
                      )}
                      <p className="text-[11px] text-slate-300 leading-relaxed font-fa pt-1">
                        {issue.explanationFa}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedInfoAnalysis(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
            >
              بستن و بازگشت به مکالمه
            </button>
          </div>
        </div>
      )}

      {/* RESET DRAFT CONFIRM */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-fa animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/40 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-300">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-sm text-white">ریست پیش‌نویس این سناریو؟</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              تمام پیام‌های ذخیره‌شده و پیشرفت کمّی این درس پاک می‌شود و مکالمه از ابتدا شروع می‌گردد. این کار قابل بازگشت نیست.
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={handleResetCurrentScenario}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                بله، ریست کن و از اول شروع کن
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition border border-slate-700"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EARLY EXIT WARNING MODAL */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md font-fa animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h4 className="font-bold text-sm text-white">اهداف آموزشی هنوز به حد نصاب نرسیده‌اند!</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              برای تسلط واقعی بر مکالمه، توصیه می‌شود حداقل ۸۰٪ اهداف پوشش داده شوند تا زبانتان با اصطلاحات هدف راه بیفتد.
            </p>

            {unmetCliches.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-amber-300 block">
                  اصطلاحات باقی‌مانده که هنوز نگفته‌اید:
                </span>
                {unmetCliches.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-white font-en font-medium">
                    <span className="text-amber-400">•</span>
                    <span>"{c}"</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setIsWarningModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white font-bold text-xs transition shadow-lg"
              >
                ادامه تمرین تا تسلط کامل (پیشنهادی)
              </button>
              <button
                onClick={() => {
                  setIsWarningModalOpen(false);
                  handleEndScenario(false);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition border border-slate-700"
              >
                پایان موقت و ذخیره مکالمه (بعداً ادامه می‌دهید)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAN & COMPACT BOTTOM CONTROLS (NO CLUTTER) */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0 space-y-2">
        {micErrorMessage && (
          <div className="p-2 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center justify-between text-xs text-red-200">
            <span>{micErrorMessage}</span>
            <button onClick={() => setMicErrorMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Audio Wave Bar when Recording */}
        {isRecording && (
          <div className="p-2.5 rounded-2xl bg-indigo-950/90 border border-indigo-500/50 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-white">
                در حال ضبط ({String(recordingSeconds)}s)
              </span>
            </div>

            <button
              onClick={toggleRecording}
              className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition"
            >
              ارسال ویس ⏹️
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Main Voice Mic Button */}
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
            title={isRecording ? 'توقف و ارسال' : 'شروع مکالمه صوتی'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="پاسخ خود را انگلیسی تایپ کنید یا صحبت کنید..."
              className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs font-en focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputVal.trim() || isProcessing}
            className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition disabled:opacity-40 disabled:pointer-events-none active:scale-95"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Scenario End Summary Modal */}
      <ScenarioSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => {
          setIsSummaryModalOpen(false);
          if (!pendingMasteryComplete) return;
          // Closing without confirm should not advance — clear pending
          setPendingMasteryComplete(false);
        }}
        onConfirmComplete={pendingMasteryComplete ? handleConfirmScenarioComplete : undefined}
        summary={scenarioSummary}
        onAddClicheToPractice={onAddClicheToPractice}
        onGenerateAdaptiveScenario={onGenerateAdaptiveScenario}
      />

      {/* Scenario Calendar Roadmap Modal */}
      <ScenarioCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        calendar={calendar}
        activeScenario={activeScenario}
        onSelectCalendarScenario={(cal) => {
          if (onSelectCalendarScenario) {
            onSelectCalendarScenario(cal);
          }
        }}
        activeWeaknesses={weaknessesItems}
        onGenerateAdaptiveScenario={() => {
          if (onGenerateAdaptiveScenario) {
            onGenerateAdaptiveScenario();
          }
        }}
        cefrLevel={cefrLevel}
      />
    </div>
  );
};
