import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Minus,
  ChevronDown,
  ChevronUp,
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
import { LessonObjectivesModal } from './LessonObjectivesModal';
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

/**
 * Strict sanitizer to make sure base64 binary chunks or audio data strings
 * never render inside user message speech bubbles as glitchy noise.
 */
export function sanitizeUserTranscript(raw: any, fallback = ''): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.includes('GkXfo') ||
    trimmed.includes('AAAA') ||
    trimmed.includes('base64') ||
    (trimmed.length > 50 && !trimmed.includes(' ')) ||
    /^[A-Za-z0-9+/=_\-\s]{60,}$/.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}

export interface TextToken {
  word: string;
  isPunctuation: boolean;
}

export function tokenizeSentence(text: string): TextToken[] {
  if (!text) return [];
  const regex = /([a-zA-Z0-9'-]+)|([^a-zA-Z0-9'-]+)/g;
  const tokens: TextToken[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({ word: match[1], isPunctuation: false });
    } else if (match[2]) {
      tokens.push({ word: match[2], isPunctuation: true });
    }
  }
  return tokens;
}

export const InteractiveEnglishText: React.FC<{
  text: string;
  selectedText: string | null;
  selectedTokensContext: {
    fullText: string;
    tokens: TextToken[];
    span: [number, number];
  } | null;
  onWordClick: (word: string, sentenceText: string, tokenIndex: number, tokens: TextToken[]) => void;
  className?: string;
}> = ({ text, selectedText, selectedTokensContext, onWordClick, className = '' }) => {
  const tokens = useMemo(() => tokenizeSentence(text), [text]);

  const isCurrentSentenceSelected = selectedTokensContext?.fullText === text;
  const activeSpan = isCurrentSentenceSelected ? selectedTokensContext?.span : null;

  return (
    <span className={`select-text ${className}`}>
      {tokens.map((token, idx) => {
        if (token.isPunctuation) {
          return <span key={idx}>{token.word}</span>;
        }

        const isTokenInSpan = activeSpan && idx >= activeSpan[0] && idx <= activeSpan[1];
        const isMatchedWord =
          !activeSpan &&
          selectedText &&
          selectedText.toLowerCase() === token.word.toLowerCase();
        const isHighlighted = isTokenInSpan || isMatchedWord;

        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              onWordClick(token.word, text, idx, tokens);
            }}
            className={`cursor-pointer transition-all duration-150 inline-block px-0.5 rounded ${
              isHighlighted
                ? 'bg-cyan-500/35 text-cyan-200 ring-1 ring-cyan-400 font-bold shadow-sm'
                : 'hover:bg-cyan-500/25 hover:text-cyan-200 active:scale-95'
            }`}
            title="ضربه برای انتخاب کلمه و افزودن به لایتنر یا تمرین"
          >
            {token.word}
          </span>
        );
      })}
    </span>
  );
};

interface Props {
  persona: AIPersona;
  activeScenario: Scenario;
  calendar?: CalendarScenario[];
  onSelectCalendarScenario?: (scenario: CalendarScenario) => void;
  leitnerWords: LeitnerWord[];
  practiceItems: PracticeItem[];
  onAddWordToLeitner: (word: string, contextSentence?: string, customMeaning?: string) => void;
  onAddClicheToPractice: (cliche: string, meaningFa: string, contextSentence?: string) => void;
  onAddWordToBoth: (word: string, contextSentence?: string, customMeaning?: string) => void;
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
  isHeaderCollapsed?: boolean;
  onSaveScenarioDraft?: (scenarioId: string, draft: any) => void;
  isCloudLoading?: boolean;
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
  isHeaderCollapsed = false,
  onSaveScenarioDraft,
  isCloudLoading = false,
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

  // Selected Text Toolbar & Interactive Token Selection
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedTextContext, setSelectedTextContext] = useState<string>('');
  const [selectedTokensContext, setSelectedTokensContext] = useState<{
    fullText: string;
    tokens: TextToken[];
    span: [number, number];
  } | null>(null);
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
  const [infoModalScenario, setInfoModalScenario] = useState<Scenario | CalendarScenario | null>(null);

  // Added Clichés & Leitner Words feedback
  const [addedCliches, setAddedCliches] = useState<Record<string, boolean>>({});
  const [addedLeitnerPhrases, setAddedLeitnerPhrases] = useState<Record<string, boolean>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);

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
        const cleanDraftMessages = draft.messages.map((m: SpeakingMessage) => ({
          ...m,
          text: sanitizeUserTranscript(m.text, m.role === 'user' ? 'صدای ضبط‌شده شما' : m.text) || (m.role === 'user' ? 'صدای ضبط‌شده شما' : m.text),
        }));
        setMessages(cleanDraftMessages);
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
          const cleanSavedMessages = parsed.map((m: SpeakingMessage) => ({
            ...m,
            text: sanitizeUserTranscript(m.text, m.role === 'user' ? 'صدای ضبط‌شده شما' : m.text) || (m.role === 'user' ? 'صدای ضبط‌شده شما' : m.text),
          }));
          setMessages(cleanSavedMessages);
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
        // Keep scenario draft synchronized if user has messages
        if (messages.some((m) => m.role === 'user')) {
          const existingDraft = getStoredScenarioDraft(activeScenario.id);
          const draftPayload = {
            messages,
            progressPercent: existingDraft?.progressPercent ?? aiLessonProgress?.progressPercent ?? 0,
            isGoalSatisfied: existingDraft?.isGoalSatisfied ?? aiLessonProgress?.isGoalSatisfied ?? false,
            masteryEvidence: existingDraft?.masteryEvidence ?? masteryEvidence,
            lastUpdated: new Date().toISOString(),
          };
          saveStoredScenarioDraft(activeScenario.id, draftPayload);
          if (onSaveScenarioDraft) {
            onSaveScenarioDraft(activeScenario.id, draftPayload);
          }
        }
      } catch (e) {}
    }
  }, [messages, chatStorageKey, activeScenario.id, aiLessonProgress, masteryEvidence, onSaveScenarioDraft]);

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

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollBottom(distanceFromBottom > 160);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Selection / Highlight listener with enclosing sentence context capture
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        return;
      }
      const text = selection.toString().trim();
      if (text.length > 1 && text.length < 100) {
        let sentenceContext = '';
        try {
          const anchor = selection.anchorNode;
          if (anchor) {
            const container = anchor.parentElement?.closest('p, div, li') || anchor.parentElement;
            if (container && container.textContent) {
              sentenceContext = container.textContent.trim();
            }
          }
        } catch (e) {}

        if (!sentenceContext || !sentenceContext.includes(text)) {
          const matched = [...messages].reverse().find((m) => m.text && m.text.includes(text));
          if (matched) {
            sentenceContext = matched.text;
          }
        }

        setSelectedText(text);
        setSelectedTextContext(sentenceContext);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [messages]);

  // Click handler for 1-tap word token selection
  const handleWordTokenClick = (
    word: string,
    sentenceText: string,
    tokenIndex: number,
    tokens: TextToken[]
  ) => {
    setSelectedTokensContext({
      fullText: sentenceText,
      tokens,
      span: [tokenIndex, tokenIndex],
    });
    setSelectedText(word);
    setSelectedTextContext(sentenceText);
    setTextToolbarFeedback(null);
  };

  // Expand selection to include the next word (effortless multi-word idiom selection)
  const handleExpandSelection = () => {
    if (!selectedTokensContext) return;
    const { tokens, span } = selectedTokensContext;
    const currentEnd = span[1];
    let nextIdx = -1;
    for (let i = currentEnd + 1; i < tokens.length; i++) {
      if (!tokens[i].isPunctuation) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx !== -1) {
      const newSpan: [number, number] = [span[0], nextIdx];
      const sliceText = tokens.slice(newSpan[0], newSpan[1] + 1).map((t) => t.word).join('');
      setSelectedTokensContext({ ...selectedTokensContext, span: newSpan });
      setSelectedText(sliceText.trim());
      setTextToolbarFeedback(null);
    }
  };

  // Shrink selection by one word
  const handleShrinkSelection = () => {
    if (!selectedTokensContext) return;
    const { tokens, span } = selectedTokensContext;
    if (span[1] <= span[0]) return;
    let prevIdx = -1;
    for (let i = span[1] - 1; i >= span[0]; i--) {
      if (!tokens[i].isPunctuation) {
        prevIdx = i;
        break;
      }
    }
    if (prevIdx !== -1 && prevIdx >= span[0]) {
      const newSpan: [number, number] = [span[0], prevIdx];
      const sliceText = tokens.slice(newSpan[0], newSpan[1] + 1).map((t) => t.word).join('');
      setSelectedTokensContext({ ...selectedTokensContext, span: newSpan });
      setSelectedText(sliceText.trim());
      setTextToolbarFeedback(null);
    }
  };

  // Clear current active selection
  const handleClearSelection = () => {
    setSelectedText(null);
    setSelectedTextContext('');
    setSelectedTokensContext(null);
    setTextToolbarFeedback(null);
  };

  // Cancel voice recording and discard audio without sending
  const cancelRecording = () => {
    setIsRecording(false);
    if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setRecordingSeconds(0);
    setAudioVolume(0);
    setInputVal('');

    try {
      if (speechRecognizerRef.current) {
        if (typeof (speechRecognizerRef.current as any).abort === 'function') {
          (speechRecognizerRef.current as any).abort();
        } else {
          speechRecognizerRef.current.stop();
        }
      }
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        audioRecorderRef.current = null;
      }
    } catch (e: any) {
      console.warn('Error cancelling recording:', e);
    }
    playChimeSound('ding');
  };

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
          setIsProcessing(true);
          const audioResult = await audioRecorderRef.current.stop();
          audioRecorderRef.current = null;
          handleSendMessage(inputVal, audioResult.base64, audioResult.mimeType, audioResult.audioUrl);
        } else {
          setIsProcessing(true);
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

    // 1. INSTANTLY SET PROCESSING & SHOW USER MESSAGE BUBBLE ON SCREEN
    setIsProcessing(true);
    setInputVal('');

    const cleanInitialUserText =
      sanitizeUserTranscript(messageText) || (userAudioUrl || audioBase64 ? 'صدای ضبط‌شده شما 🎙️' : 'پیام متنی');

    const userMsgId = `user-${Date.now()}`;
    const userMsg: SpeakingMessage = {
      id: userMsgId,
      role: 'user',
      text: cleanInitialUserText,
      audioUrl: userAudioUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // 2. Dedicated STT (Whisper → Gemini) when we have audio
    if (audioBase64) {
      try {
        const stt = await transcribeAudioBase64(audioBase64, audioMimeType || 'audio/webm', 'en');
        const cleanStt = sanitizeUserTranscript(stt.text);
        if (cleanStt) {
          messageText = cleanStt;
          // Dynamically update the user bubble with the transcribed text
          setMessages((prev) =>
            prev.map((m) => (m.id === userMsgId ? { ...m, text: cleanStt } : m))
          );
        }
      } catch (sttErr) {
        console.warn('Dedicated STT failed, continuing with live caption / audio:', sttErr);
      }
    }

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
          turnNumber: messages.filter((m) => m.role === 'user').length + 1,
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

      const candidateUserText =
        sanitizeUserTranscript(data.transcribedUserText) ||
        (messageText && messageText !== 'صدای ضبط‌شده شما' ? sanitizeUserTranscript(messageText) : '') ||
        sanitizeUserTranscript(data.analysis?.userSpokenTranscript) ||
        (userAudioUrl ? 'صدای ضبط‌شده شما' : userMsg.text);

      const finalUserText =
        sanitizeUserTranscript(candidateUserText) || (userAudioUrl ? 'صدای ضبط‌شده شما' : 'پیام متنی');

      const updatedUserMsg: SpeakingMessage = {
        ...userMsg,
        text: finalUserText,
        analysis: data.analysis,
      };

      const modelMsg: SpeakingMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || "That's great, let's keep going!",
        persianTranslation: data.persianTranslation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Construct fresh, complete message list containing all prior messages + updated userMsg + modelMsg
      const previousMessages = messages.filter((m) => m.id !== userMsg.id);
      const fullMessages: SpeakingMessage[] = [
        ...previousMessages,
        updatedUserMsg,
        modelMsg,
      ];

      setMessages(fullMessages);

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

      // Persist full dialogue with user messages, analysis, and native formulations
      saveStoredScenarioDraft(activeScenario.id, {
        messages: fullMessages,
        progressPercent: freshEval.progressPercent,
        isGoalSatisfied: freshEval.isGoalSatisfied,
        masteryEvidence: nextEvidence,
      });

      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(fullMessages));
      } catch (e) {}
    } catch (err: any) {
      console.warn('Network issue in chat, falling back to local engine:', err);
      const local = evaluateSpeakingTextLocally(messageText, activeScenario, persona);

      const updatedUserMsg: SpeakingMessage = {
        ...userMsg,
        analysis: local.analysis,
      };

      const fallbackMsg: SpeakingMessage = {
        id: `model-fb-${Date.now()}`,
        role: 'model',
        text: local.reply,
        persianTranslation: local.persianTranslation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const previousMessages = messages.filter((m) => m.id !== userMsg.id);
      const fullFallbackMessages: SpeakingMessage[] = [
        ...previousMessages,
        updatedUserMsg,
        fallbackMsg,
      ];

      setMessages(fullFallbackMessages);

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

      // Persist fallback draft
      saveStoredScenarioDraft(activeScenario.id, {
        messages: fullFallbackMessages,
        progressPercent: freshEval.progressPercent,
        isGoalSatisfied: freshEval.isGoalSatisfied,
        masteryEvidence: nextEvidence,
      });

      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(fullFallbackMessages));
      } catch (e) {}

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
    <div className="relative flex flex-col h-full bg-slate-950 font-fa select-text overflow-hidden">
      {/* LOADING STATE WHILE CLOUD DATA IS SYNCING */}
      {isCloudLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 font-fa max-w-md mx-auto my-auto animate-in fade-in">
          <div className="w-14 h-14 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-spin" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">در حال همگام‌سازی اطلاعات ابری...</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سناریوها، پیام‌ها و کلمات لایتنر در حال بررسی و بارگذاری هستند.
            </p>
          </div>
        </div>
      ) : !isAssessmentCompleted || calendar.length === 0 ? (
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
          {/* SCENARIO SELECTION STRUCTURE & 10-LESSON SELECTOR (COLLAPSIBLE) */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${
              isHeaderCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[600px] opacity-100'
            }`}
          >
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 space-y-2">
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

              {/* Lesson Objectives Info "i" Button */}
              <button
                type="button"
                onClick={() => setInfoModalScenario(activeScenario)}
                className="p-2 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/30 text-cyan-400 hover:text-cyan-300 border border-cyan-500/40 transition active:scale-95 shrink-0 flex items-center justify-center shadow-sm"
                title="مشاهده اهداف جامع آموزشی این درس"
              >
                <Info className="w-4 h-4 stroke-[2.5]" />
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
                  <div
                    key={sc.id || idx}
                    className={`inline-flex items-center rounded-xl border text-xs font-bold transition shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-cyan-400 border-transparent'
                        : isMastered
                        ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectCalendarScenario) onSelectCalendarScenario(sc);
                        playChimeSound('ding');
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 active:scale-95 transition"
                      title={sc.titleFa}
                    >
                      <span className="text-xs">{sc.icon || '🎯'}</span>
                      <span className="text-[11px] whitespace-nowrap">درس {idx + 1}</span>
                      {isMastered && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoModalScenario(sc);
                      }}
                      className={`p-1 pl-1.5 pr-1.5 hover:bg-white/20 transition rounded-l-xl ${
                        isActive ? 'text-white/90 hover:text-white' : 'text-cyan-400 hover:text-cyan-300'
                      }`}
                      title="مشاهده اهداف جامع آموزشی این درس"
                    >
                      <Info className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
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

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoModalScenario(sc);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700/80 transition"
                            title="مشاهده اهداف آموزشی این درس"
                          >
                            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="text-[10px] font-bold">
                            {isActive ? (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500 text-white text-[9px]">فعال</span>
                            ) : isDone ? (
                              <span className="text-emerald-400 text-[10px]">✓ تسلط</span>
                            ) : (
                              <span className="text-slate-500 text-[9px]">انتخاب</span>
                            )}
                          </span>
                        </div>
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
              <div className="flex items-center gap-2 shrink-0">
                {targetClichesList.length > 0 && (
                  <div className="flex items-center gap-1 truncate max-w-[40%] text-[10px]">
                    <span className="text-amber-400 shrink-0">اصطلاح:</span>
                    <span className="text-amber-200 font-en truncate">
                      {targetClichesList[0]?.replace(/\(.*?\)/g, '').trim()}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setInfoModalScenario(activeScenario)}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                  title="مشاهده کامل اهداف آموزشی این درس"
                >
                  <Info className="w-3 h-3 stroke-[2.5]" />
                  <span>اهداف جامع</span>
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Messages Scroll Area */}
          <div
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto p-3 sm:p-4 pb-32 space-y-3.5 relative"
          >
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
                      <p className="font-en text-xs sm:text-sm leading-relaxed tracking-wide select-text break-words">
                        {(() => {
                          const cleanTranscript =
                            sanitizeUserTranscript(
                              msg.text,
                              isUser && msg.audioUrl ? 'صدای ضبط‌شده شما 🎙️' : msg.text
                            ) || (isUser ? 'صدای ضبط‌شده شما 🎙️' : msg.text);

                          if (cleanTranscript === 'صدای ضبط‌شده شما 🎙️') {
                            return <span>{cleanTranscript}</span>;
                          }

                          return (
                            <InteractiveEnglishText
                              text={cleanTranscript}
                              selectedText={selectedText}
                              selectedTokensContext={selectedTokensContext}
                              onWordClick={handleWordTokenClick}
                            />
                          );
                        })()}
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
                      NATIVE AMERICAN CONCEPT & CLICHÉ REFORMULATION CARD (اگه یه نیتیو بود...)
                     ========================================================================= */}
                  {isUser && analysis && (analysis.nativeAlternative || analysis.nativeCliche) && (
                    <div className="mr-1 max-w-[95%] sm:max-w-[92%] ml-auto my-2 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/40 shadow-xl p-3 sm:p-3.5 space-y-2.5 font-fa text-right animate-in fade-in">
                      {/* Card Header: Title, Sound button, and Action Buttons */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/90">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>اگه یه نیتیو بود:</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => playAudioText(analysis.nativeAlternative || analysis.nativeCliche || '')}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition shadow-sm border border-slate-700 active:scale-95"
                            title="شنیدن تلفظ با لهجه استاندارد آمریکایی"
                          >
                            <Volume2 className="w-4 h-4 text-cyan-400" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {onAddWordToLeitner && (
                            <button
                              type="button"
                              onClick={() => {
                                const phrase =
                                  analysis.nativeCliche ||
                                  analysis.nativeAlternative.split(' ').slice(0, 3).join(' ');
                                onAddWordToLeitner(
                                  phrase,
                                  analysis.nativeAlternative,
                                  analysis.nativeClicheMeaningFa || analysis.nativeAlternativeFa
                                );
                                setAddedLeitnerPhrases((prev) => ({ ...prev, [msg.id]: true }));
                                playChimeSound('ding');
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition shadow-sm active:scale-95 ${
                                addedLeitnerPhrases[msg.id]
                                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30'
                              }`}
                              title="افزودن به جعبه لایتنر با معنی و مثال هوشمند"
                            >
                              {addedLeitnerPhrases[msg.id] ? (
                                <>
                                  <Check className="w-3 h-3 text-purple-400" />
                                  <span>به لایتنر رفت ✓</span>
                                </>
                              ) : (
                                <span>🗃️ لایتنر</span>
                              )}
                            </button>
                          )}

                          {onAddClicheToPractice && (
                            <button
                              type="button"
                              onClick={() => {
                                const clicheToAdd = analysis.nativeCliche || analysis.nativeAlternative || '';
                                const meaningToAdd =
                                  analysis.nativeClicheMeaningFa ||
                                  analysis.nativeAlternativeFa ||
                                  'اصطلاح و فرمول کاربردی نیتیو';
                                onAddClicheToPractice(clicheToAdd, meaningToAdd, analysis.nativeAlternative);
                                setAddedCliches((prev) => ({ ...prev, [msg.id]: true }));
                                playChimeSound('success');
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition shadow-sm active:scale-95 ${
                                addedCliches[msg.id]
                                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                              }`}
                              title="افزودن به منوی تمرین"
                            >
                              {addedCliches[msg.id] ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>به تمرین رفت ✓</span>
                                </>
                              ) : (
                                <span>+ تمرین</span>
                              )}
                            </button>
                          )}

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
                        <p className="font-en text-xs sm:text-sm font-bold text-white tracking-wide dir-ltr text-left select-text leading-relaxed">
                          "
                          <InteractiveEnglishText
                            text={analysis.nativeAlternative}
                            selectedText={selectedText}
                            selectedTokensContext={selectedTokensContext}
                            onWordClick={handleWordTokenClick}
                          />
                          "
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
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
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

                          {/* Quick 1-tap Actions on Cliché Chip */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => playAudioText(analysis.nativeCliche)}
                              className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-300 transition"
                              title="شنیدن تلفظ نیتیو این اصطلاح"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddWordToLeitner(
                                  analysis.nativeCliche,
                                  analysis.nativeAlternative,
                                  analysis.nativeClicheMeaningFa
                                );
                                setAddedLeitnerPhrases((prev) => ({ ...prev, [`cliche-${msg.id}`]: true }));
                                playChimeSound('ding');
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                                addedLeitnerPhrases[`cliche-${msg.id}`]
                                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50'
                                  : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30'
                              }`}
                              title="افزودن این اصطلاح به لایتنر"
                            >
                              {addedLeitnerPhrases[`cliche-${msg.id}`] ? '✓ لایتنر' : '+ لایتنر'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAddClicheToPractice(
                                  analysis.nativeCliche,
                                  analysis.nativeClicheMeaningFa,
                                  analysis.nativeAlternative
                                );
                                setAddedCliches((prev) => ({ ...prev, [`cliche-${msg.id}`]: true }));
                                playChimeSound('success');
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                                addedCliches[`cliche-${msg.id}`]
                                  ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/50'
                                  : 'bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30'
                              }`}
                              title="افزودن این اصطلاح به منوی تمرین"
                            >
                              {addedCliches[`cliche-${msg.id}`] ? '✓ تمرین' : '+ تمرین'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sentence Patterns & Formulas (الگوها و فرمول‌های کاربردی جمله‌سازی نیتیو) */}
                      {analysis.sentencePatterns && analysis.sentencePatterns.length > 0 && (
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/95 border border-indigo-500/30 text-xs space-y-2">
                          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              <span>الگوها و فرمول‌های جمله‌سازی نیتیو (Sentence Patterns):</span>
                            </div>
                            <span className="text-[10px] text-slate-400">برای سناریوسازی در منوی تمرین</span>
                          </div>

                          <div className="space-y-1.5">
                            {analysis.sentencePatterns.map((pat, pIdx) => {
                              const patKey = `${msg.id}-pat-${pIdx}`;
                              return (
                                <div
                                  key={pIdx}
                                  className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                                >
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="font-en font-bold text-xs sm:text-sm text-cyan-300 break-words dir-ltr text-left">
                                      {pat.pattern}
                                    </div>
                                    <div className="text-[11px] text-slate-300 font-fa leading-relaxed">
                                      <span className="text-white font-medium">{pat.meaningFa}</span>
                                      {pat.slotExplanation && (
                                        <span className="text-[10px] text-slate-400 mr-1.5 font-fa">
                                          ({pat.slotExplanation})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => playAudioText(pat.pattern.replace(/[\[\]]/g, ''))}
                                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition"
                                      title="شنیدن تلفظ"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onAddClicheToPractice(
                                          pat.pattern,
                                          pat.meaningFa,
                                          analysis.nativeAlternative
                                        );
                                        setAddedCliches((prev) => ({ ...prev, [patKey]: true }));
                                        playChimeSound('success');
                                      }}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 active:scale-95 ${
                                        addedCliches[patKey]
                                          ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/50'
                                          : 'bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30'
                                      }`}
                                      title="افزودن این فرمول جمله‌سازی به منوی تمرین"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>{addedCliches[patKey] ? '✓ تمرین' : 'تمرین'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onAddWordToLeitner(
                                          pat.pattern,
                                          analysis.nativeAlternative,
                                          pat.meaningFa
                                        );
                                        setAddedLeitnerPhrases((prev) => ({ ...prev, [patKey]: true }));
                                        playChimeSound('ding');
                                      }}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 active:scale-95 ${
                                        addedLeitnerPhrases[patKey]
                                          ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50'
                                          : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30'
                                      }`}
                                      title="افزودن این فرمول به لایتنر"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>{addedLeitnerPhrases[patKey] ? '✓ لایتنر' : 'لایتنر'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
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
                              className="text-[10px] text-cyan-400 hover:underline font-bold"
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
              <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-3xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/50 text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-2 max-w-[92%] sm:max-w-[80%]">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shadow-md">
                      <Mic className="w-4 h-4 text-indigo-300 animate-pulse" />
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute -top-1 -right-1" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-xs sm:text-sm">ویس شما دریافت شد ✓</span>
                      <span className="text-[10px] text-cyan-300 font-en animate-pulse">● Analyzing...</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      مربی {persona.name} در حال تبدیل صدا به متن، سنجش گرامر، تلفظ و بازنویسی نیتیو است...
                    </p>
                  </div>
                </div>

                {/* Animated Voice Spectrum Bar */}
                <div className="flex items-center gap-1 h-3 pt-1 px-1">
                  {[40, 70, 95, 60, 85, 45, 90, 65, 100, 50, 80, 35, 75, 55, 90].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        height: `${h}%`,
                        animationDelay: `${i * 70}ms`,
                      }}
                      className="w-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full animate-pulse shrink-0"
                    />
                  ))}
                  <span className="text-[10px] text-indigo-300/80 mr-2 font-fa">لطفاً چند ثانیه صبر کنید</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* FLOATING SCROLL TO BOTTOM BUTTON */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="fixed bottom-24 right-4 sm:right-8 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600/95 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xl border border-indigo-400/50 backdrop-blur-md transition-all active:scale-95 animate-in fade-in slide-in-from-bottom-2 group"
              title="اسکرول به انتهای مکالمه"
            >
              <ChevronDown className="w-4 h-4 text-cyan-300 group-hover:translate-y-0.5 transition-transform" />
              <span>برو به پایین</span>
            </button>
          )}

          {/* FLOATING ERGONOMIC BOTTOM DOCK ON TEXT SELECTION */}
          {selectedText && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-40 bg-slate-900/98 border border-cyan-500/60 rounded-2xl shadow-2xl p-2.5 sm:p-3 backdrop-blur-md animate-in slide-in-from-bottom-3 space-y-2">
              {/* Top Row: Selected text preview + Audio + Close */}
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">متن انتخاب‌شده:</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-cyan-500/40 min-w-0 flex-1 shadow-inner">
                    <span className="font-en font-black text-cyan-300 text-xs sm:text-sm truncate block">
                      "{selectedText}"
                    </span>
                    <button
                      type="button"
                      onClick={() => playAudioText(selectedText)}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition shrink-0"
                      title="شنیدن تلفظ نیتیو"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                  title="بستن منوی انتخاب"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Row: Fixed thumb controls (coordinates NEVER jump when text expands!) */}
              <div className="flex items-center justify-between gap-2">
                {/* Target actions: Leitner and Practice */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {textToolbarFeedback ? (
                    <span className="text-emerald-300 font-bold text-xs px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 animate-in fade-in">
                      {textToolbarFeedback}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onAddWordToLeitner(selectedText, selectedTextContext);
                          setTextToolbarFeedback('به لایتنر افزوده شد ✓');
                          playChimeSound('ding');
                          setTimeout(() => {
                            handleClearSelection();
                          }, 1400);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10.5px] transition shadow-md shadow-purple-600/20 active:scale-95 flex items-center gap-1"
                        title="افزودن به جعبه لایتنر"
                      >
                        <span>🧠 + لایتنر</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onAddClicheToPractice(selectedText, '', selectedTextContext);
                          setTextToolbarFeedback('به تمرینات افزوده شد ✓');
                          playChimeSound('success');
                          setTimeout(() => {
                            handleClearSelection();
                          }, 1400);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10.5px] transition shadow-md shadow-cyan-600/20 active:scale-95 flex items-center gap-1"
                        title="افزودن به بانک تمرینات"
                      >
                        <span>🎯 + تمرین</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Expansion controls: FIXED on right side, right under thumb, coordinates never shift! */}
                {selectedTokensContext && (
                  <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 shrink-0">
                    {selectedTokensContext.span[1] > selectedTokensContext.span[0] && (
                      <button
                        type="button"
                        onClick={handleShrinkSelection}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
                        title="حذف آخرین کلمه"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExpandSelection}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
                      title="افزودن کلمه بعدی به انتخاب برای اصطلاحات چندکلمه‌ای"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>کلمه بعد</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* FLOATING VOICE CONTROLS — TEXT INPUT REMOVED, ALL SPACE MERGED INTO CONVERSATION */}
      <div className="absolute bottom-4 left-0 right-0 z-30 pointer-events-none flex flex-col items-center justify-end px-3">
        {micErrorMessage && (
          <div className="pointer-events-auto mb-2 p-2 rounded-xl bg-red-950/85 border border-red-500/50 flex items-center justify-between text-xs text-red-200 max-w-sm w-full shadow-xl">
            <span>{micErrorMessage}</span>
            <button onClick={() => setMicErrorMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Audio Wave Bar when Recording with CANCEL button */}
        {isRecording && (
          <div className="pointer-events-auto mb-3 max-w-sm w-full p-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white font-fa">
                  در حال ضبط ({String(recordingSeconds)} ثانیه)
                </span>
                <span className="text-[10px] text-cyan-300">
                  {audioVolume > 15 ? 'صدا دریافت می‌شود 🎙️' : 'صحبت کنید...'}
                </span>
              </div>
            </div>

            {/* Cancel Button (جایگزین دکمه ارسال ویس سابق) */}
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
              title="انصراف و لغو ضبط ویس"
            >
              <X className="w-3.5 h-3.5 text-red-400" />
              <span>انصراف</span>
            </button>
          </div>
        )}

        {/* Floating Mic Button — when recording, transforms into SEND button; when processing, displays loading pill */}
        <div className="pointer-events-auto">
          {isProcessing ? (
            <div className="px-5 py-3 rounded-full bg-slate-900/95 border border-indigo-500/50 text-white font-bold text-xs flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-pulse">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="font-fa text-slate-100">در حال تحلیل صدای شما...</span>
            </div>
          ) : isRecording ? (
            <button
              type="button"
              onClick={toggleRecording}
              className="px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs flex items-center gap-2 shadow-2xl shadow-emerald-500/50 ring-4 ring-emerald-500/30 animate-pulse active:scale-95 transition-all"
              title="پایان ضبط و ارسال ویس به مربی"
            >
              <Send className="w-5 h-5 -rotate-45" />
              <span>ارسال ویس 🚀</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleRecording}
              className="p-4 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 active:scale-90 transition-all flex items-center justify-center group"
              title="برای شروع صحبت با مربی لمس کنید"
              aria-label="شروع صحبت با مربی"
            >
              <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          )}
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

      {/* Lesson Comprehensive Objectives Modal */}
      <LessonObjectivesModal
        isOpen={Boolean(infoModalScenario)}
        onClose={() => setInfoModalScenario(null)}
        scenario={infoModalScenario}
        lessonIndex={
          infoModalScenario
            ? (infoModalScenario as CalendarScenario).dayIndex ||
              calendar.findIndex((c) => c.id === infoModalScenario.id) + 1 ||
              1
            : 1
        }
        totalLessons={calendar.length || 10}
        onSelectAndStart={(sc) => {
          if (onSelectCalendarScenario) {
            onSelectCalendarScenario(sc as CalendarScenario);
          }
          setInfoModalScenario(null);
        }}
        onAddClicheToPractice={(cliche, meaningFa) => {
          onAddClicheToPractice(cliche, meaningFa);
        }}
        isCurrentlyActive={infoModalScenario?.id === activeScenario.id}
      />
    </div>
  );
};
