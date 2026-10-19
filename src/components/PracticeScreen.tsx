import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PracticeItem, PracticeEvaluationResult } from '../types';
import {
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  BookOpen,
  X,
  Check,
  Search,
  ArrowRight,
  ArrowLeft,
  Filter,
  TrendingUp,
  Award,
  Lightbulb,
  Layers,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Flame,
  Clock,
  Compass,
} from 'lucide-react';
import {
  playAudioText,
  playChimeSound,
  createSpeechRecognizer,
  stopAudioPlayback,
  startAudioRecording,
  AudioRecordingSession,
  transcribeAudioBase64,
} from '../utils/audio';
import {
  generateSituationForCliche,
  evaluatePracticeResponseLocally,
  GeneratedSituation,
} from '../utils/linguisticEngine';
import { apiFetch } from '../utils/userApiKeys';

interface Props {
  practiceItems: PracticeItem[];
  onUpdatePracticeItems: (items: PracticeItem[]) => void;
  onSessionMinuteLogged: (minutes: number) => void;
  onAddClicheToPractice?: (cliche: string, meaningFa: string) => void;
  onAddWordToLeitner?: (word: string) => void;
}

const POPULAR_RECOMMENDED_CLICHES = [
  { cliche: 'call it a day', meaningFa: 'پایان دادن به کار امروز و دست کشیدن از کار', category: 'work' },
  { cliche: 'hit the nail on the head', meaningFa: 'دقیقاً زدن به خال و درست گفتن', category: 'daily' },
  { cliche: 'piece of cake', meaningFa: 'بسیار آسان، مثل آب خوردن', category: 'daily' },
  { cliche: 'get the hang of it', meaningFa: 'قلق کاری را یاد گرفتن', category: 'work' },
  { cliche: 'break the ice', meaningFa: 'شکستن یخ جمع در شروع مکالمه', category: 'casual' },
  { cliche: 'spill the beans', meaningFa: 'لو دادن راز یا خبر غیرمنتظره', category: 'casual' },
  { cliche: 'cut corners', meaningFa: 'سمبل کردن و از سر و ته کار زدن', category: 'work' },
  { cliche: 'back to square one', meaningFa: 'برگشتن به نقطه صفر و خانه اول', category: 'work' },
  { cliche: 'bite the bullet', meaningFa: 'دل به دریا زدن برای انجام کار سخت', category: 'daily' },
  { cliche: 'play it by ear', meaningFa: 'برنامه‌ریزی سفت‌وسخت نکردن و دیدن اوضاع', category: 'casual' },
  { cliche: 'under the weather', meaningFa: 'ناخوش‌احوال یا کسل بودن', category: 'daily' },
  { cliche: 'touch base', meaningFa: 'هماهنگ شدن سریع و مختصر', category: 'work' },
];

export const PracticeScreen: React.FC<Props> = ({
  practiceItems,
  onUpdatePracticeItems,
  onSessionMinuteLogged,
  onAddClicheToPractice,
  onAddWordToLeitner,
}) => {
  // Navigation & View Mode: 'catalog' (Clichés Hub) or 'practice' (Active Studio)
  const [viewMode, setViewMode] = useState<'catalog' | 'practice'>('catalog');
  const [selectedItem, setSelectedItem] = useState<PracticeItem | null>(
    practiceItems.length > 0 ? practiceItems[0] : null
  );

  // Situation & Evaluation State
  const [situationData, setSituationData] = useState<GeneratedSituation | null>(null);
  const [isLoadingSituation, setIsLoadingSituation] = useState(false);
  const [scenarioCounter, setScenarioCounter] = useState(0);
  const [userResponseInput, setUserResponseInput] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PracticeEvaluationResult | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'native' | 'linguistic' | 'acoustic'>('native');
  const [addedCliches, setAddedCliches] = useState<Record<string, boolean>>({});

  // Search, Filter & Sort in Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'work' | 'casual' | 'needs_practice' | 'mastered'>('all');
  const [sortBy, setSortBy] = useState<'mastery' | 'practices' | 'alphabetical'>('mastery');

  // Voice Recording State (Matching SpeakingScreen Fidelity)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  const audioRecorderRef = useRef<AudioRecordingSession | null>(null);
  const speechRecognizerRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const volumeIntervalRef = useRef<any>(null);

  // Create New Practice Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClicheInput, setNewClicheInput] = useState('');
  const [newMeaningInput, setNewMeaningInput] = useState('');
  const [newContextInput, setNewContextInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState<'work' | 'casual' | 'daily' | 'social'>('daily');

  // Cleanup timers & audio on unmount
  useEffect(() => {
    return () => {
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (speechRecognizerRef.current) speechRecognizerRef.current.stop();
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Sync selected item if items list updates
  useEffect(() => {
    if (!selectedItem && practiceItems.length > 0) {
      setSelectedItem(practiceItems[0]);
    }
  }, [practiceItems, selectedItem]);

  // Current Cliché Index in list for seamless prev/next stepper
  const currentIndex = useMemo(() => {
    if (!selectedItem) return 0;
    const idx = practiceItems.findIndex((p) => p.id === selectedItem.id);
    return idx >= 0 ? idx : 0;
  }, [practiceItems, selectedItem]);

  // Filtered & Sorted Clichés for Catalog View
  const filteredItems = useMemo(() => {
    let result = [...practiceItems];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.cliche.toLowerCase().includes(q) ||
          item.persianMeaning.toLowerCase().includes(q) ||
          (item.context && item.context.toLowerCase().includes(q))
      );
    }

    // Category / Status Filter
    if (categoryFilter === 'work') {
      result = result.filter((item) => item.category === 'work' || item.context?.includes('کار') || item.context?.includes('جلسه'));
    } else if (categoryFilter === 'casual') {
      result = result.filter((item) => item.category === 'casual' || item.context?.includes('دوست') || item.context?.includes('روزمره'));
    } else if (categoryFilter === 'needs_practice') {
      result = result.filter((item) => item.masteryScore < 70);
    } else if (categoryFilter === 'mastered') {
      result = result.filter((item) => item.masteryScore >= 70);
    }

    // Sort
    if (sortBy === 'mastery') {
      result.sort((a, b) => b.masteryScore - a.masteryScore);
    } else if (sortBy === 'practices') {
      result.sort((a, b) => b.timesPracticed - a.timesPracticed);
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.cliche.localeCompare(b.cliche));
    }

    return result;
  }, [practiceItems, searchQuery, categoryFilter, sortBy]);

  // Generate Situation for the selected cliché with cycling and multi-scenario generator
  const handleGenerateSituation = async (itemToPractice?: PracticeItem | null, isRegenerating = false) => {
    const target = itemToPractice || selectedItem;
    if (!target) return;

    setIsLoadingSituation(true);
    setEvaluationResult(null);
    setUserResponseInput('');
    setRecordedAudioUrl(null);
    setShowGuidance(true);
    stopAudioPlayback();

    // Determine whether this is a regeneration/scenario change request
    const isNewRequest = isRegenerating || Boolean(situationData && target.id === selectedItem?.id);
    const nextCounter = isNewRequest ? scenarioCounter + 1 : scenarioCounter;
    if (isNewRequest) {
      setScenarioCounter(nextCounter);
    }

    try {
      const res = await apiFetch('/api/practice-generate-situation', {
        method: 'POST',
        body: JSON.stringify({
          cliche: target.cliche,
          meaningFa: target.persianMeaning,
          context: target.context,
          regenerate: isNewRequest,
          scenarioIndex: nextCounter,
          currentTitle: situationData?.situationTitleFa || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.situationTitleFa) {
          setSituationData(data);
          playChimeSound('ding');
          setIsLoadingSituation(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API situation generation error, using instant linguistic engine:', e);
    }

    // Instant zero-failure local situation generator with cycling scenarioIndex
    const local = generateSituationForCliche(target.cliche, target.persianMeaning, nextCounter);
    setSituationData(local);
    playChimeSound('ding');
    setIsLoadingSituation(false);
  };

  // Launch practice for a given item from catalog
  const handleStartPracticeItem = (item: PracticeItem) => {
    setSelectedItem(item);
    setViewMode('practice');
    handleGenerateSituation(item);
  };

  // Switch to next or previous cliché smoothly
  const handleNavigateCliché = (direction: 'next' | 'prev') => {
    if (practiceItems.length === 0) return;
    let nextIdx = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIdx >= practiceItems.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = practiceItems.length - 1;

    const nextItem = practiceItems[nextIdx];
    setSelectedItem(nextItem);
    handleGenerateSituation(nextItem);
  };

  // Voice recording toggle with actual audio capture and automatic evaluation
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
          try {
            speechRecognizerRef.current.stop();
          } catch (e) {}
        }

        if (audioRecorderRef.current) {
          const audioResult = await audioRecorderRef.current.stop();
          audioRecorderRef.current = null;
          if (audioResult) {
            setRecordedAudioUrl(audioResult.audioUrl);
            // AUTOMATICALLY EVALUATE WITH CAPTURED AUDIO
            handleEvaluateResponse(
              userResponseInput,
              audioResult.base64,
              audioResult.mimeType,
              audioResult.audioUrl
            );
            return;
          }
        }
        handleEvaluateResponse(userResponseInput);
      } catch (e: any) {
        console.warn('Error stopping recording:', e);
        handleEvaluateResponse(userResponseInput);
      }
    } else {
      // START recording
      stopAudioPlayback();
      setUserResponseInput('');
      setRecordedAudioUrl(null);
      setRecordingSeconds(0);

      try {
        const session = await startAudioRecording();
        audioRecorderRef.current = session;
        setIsRecording(true);

        // Real-time volume monitoring for waveform
        volumeIntervalRef.current = setInterval(() => {
          if (session.getVolumeLevel) {
            setAudioVolume(session.getVolumeLevel());
          }
        }, 80);

        // Timer
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        // Concurrent Web Speech Recognition for live text preview
        try {
          const recognizer = createSpeechRecognizer({
            lang: 'en-US',
            onResult: (text) => setUserResponseInput(text),
            onError: (err) => console.warn('Recognition notice:', err),
          });
          recognizer.start();
          speechRecognizerRef.current = recognizer;
        } catch (recErr) {
          console.warn('SpeechRecognition error:', recErr);
        }
      } catch (err: any) {
        console.error('Microphone error:', err);
        setIsRecording(false);
        setMicErrorMessage(err.message || 'دسترسی به میکروفون مسدود است.');
      }
    }
  };

  // Evaluate user response with multimodal audio analysis & American concept model
  const handleEvaluateResponse = async (
    textOverride?: string,
    audioBase64?: string,
    audioMimeType?: string,
    audioUrl?: string
  ) => {
    let textToEvaluate = (textOverride !== undefined ? textOverride : userResponseInput).trim();
    if (!textToEvaluate && !audioBase64) return;
    if (!situationData || !selectedItem) return;

    if (audioUrl) {
      setRecordedAudioUrl(audioUrl);
    }

    setIsEvaluating(true);
    setActiveAnalysisTab(audioBase64 || audioUrl || recordedAudioUrl ? 'acoustic' : 'linguistic');

    if (audioBase64) {
      try {
        const stt = await transcribeAudioBase64(audioBase64, audioMimeType || 'audio/webm', 'en');
        if (stt.text) {
          textToEvaluate = stt.text;
          setUserResponseInput(stt.text);
        }
      } catch (e) {
        console.warn('Practice STT failed:', e);
      }
    }

    try {
      const res = await apiFetch('/api/practice-evaluate', {
        method: 'POST',
        body: JSON.stringify({
          targetCliche: selectedItem.cliche,
          situationContextFa: situationData.situationContextFa,
          conversationalPrompt: situationData.conversationalPrompt,
          userResponse: textToEvaluate,
          userAudioBase64: audioBase64,
          userAudioMimeType: audioMimeType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update user input if transcribed by backend
        if (data.transcribedUserText && (!textToEvaluate || textToEvaluate.length < data.transcribedUserText.length)) {
          setUserResponseInput(data.transcribedUserText);
        }
        setEvaluationResult(data);
        handlePostEvaluation(data);
        setIsEvaluating(false);
        return;
      }
    } catch (e) {
      console.warn('API evaluate error, using local linguistic engine:', e);
    }

    // Instant local evaluation fallback with full structured analysis & native concept model
    const localEval = evaluatePracticeResponseLocally(
      selectedItem.cliche,
      textToEvaluate || selectedItem.cliche,
      situationData.situationContextFa,
      situationData.conversationalPrompt
    );
    setEvaluationResult(localEval);
    handlePostEvaluation(localEval);
    setIsEvaluating(false);
  };

  const handlePostEvaluation = (data: PracticeEvaluationResult) => {
    if (!selectedItem) return;

    if (data.usedTargetCliche && data.accuracyScore >= 70) {
      playChimeSound('success');
      const updated = practiceItems.map((p) =>
        p.id === selectedItem.id
          ? {
              ...p,
              timesPracticed: p.timesPracticed + 1,
              masteryScore: Math.min(100, p.masteryScore + 15),
              lastPracticedAt: new Date().toISOString(),
            }
          : p
      );
      onUpdatePracticeItems(updated);
      onSessionMinuteLogged(1);
    } else {
      playChimeSound('ding');
    }
  };

  // Add suggested cliché to practice list (Exact SpeakingScreen UX)
  const handleAddSuggestedCliche = (cliche: string, meaningFa?: string) => {
    if (onAddClicheToPractice) {
      onAddClicheToPractice(cliche, meaningFa || 'اصطلاح بومی آمریکایی');
    } else {
      const term = cliche.trim();
      const exists = practiceItems.some((p) => p.cliche.toLowerCase() === term.toLowerCase());
      if (!exists) {
        const newItem: PracticeItem = {
          id: `practice-${Date.now()}`,
          cliche: term,
          persianMeaning: meaningFa || 'اصطلاح بومی آمریکایی',
          exampleSentence:
            evaluationResult?.americanConceptModel?.expression || `Let's use "${term}" here.`,
          context: situationData?.situationTitleFa || 'تمرین کلیشه',
          addedAt: new Date().toISOString(),
          timesPracticed: 0,
          masteryScore: 40,
        };
        onUpdatePracticeItems([newItem, ...practiceItems]);
      }
    }
    setAddedCliches((prev) => ({ ...prev, [cliche]: true }));
    playChimeSound('success');
  };

  // Create new custom practice item
  const handleCreateNewPractice = () => {
    const cliche = newClicheInput.trim();
    if (!cliche) return;

    const meaning = newMeaningInput.trim() || 'کلیشه و اصطلاح کاربردی';
    const context = newContextInput.trim() || 'مکالمه روزمره آمریکایی';

    const newItem: PracticeItem = {
      id: `practice-${Date.now()}`,
      cliche,
      persianMeaning: meaning,
      context,
      exampleSentence: `I'll ${cliche} whenever necessary.`,
      addedAt: new Date().toISOString(),
      timesPracticed: 0,
      masteryScore: 30,
      category: newCategoryInput,
    };

    const updated = [newItem, ...practiceItems];
    onUpdatePracticeItems(updated);
    setIsCreateModalOpen(false);
    setNewClicheInput('');
    setNewMeaningInput('');
    setNewContextInput('');
    playChimeSound('success');

    // Select and start practice immediately
    handleStartPracticeItem(newItem);
  };

  // Quick Add from Recommended List
  const handleQuickAddCliche = (rec: { cliche: string; meaningFa: string; category?: string }) => {
    const alreadyExists = practiceItems.some((p) => p.cliche.toLowerCase() === rec.cliche.toLowerCase());
    if (alreadyExists) {
      const found = practiceItems.find((p) => p.cliche.toLowerCase() === rec.cliche.toLowerCase());
      if (found) handleStartPracticeItem(found);
      return;
    }

    const newItem: PracticeItem = {
      id: `practice-${Date.now()}`,
      cliche: rec.cliche,
      persianMeaning: rec.meaningFa,
      context: 'مکالمه کاربردی آمریکایی',
      exampleSentence: `Let's ${rec.cliche} and see what happens.`,
      addedAt: new Date().toISOString(),
      timesPracticed: 0,
      masteryScore: 35,
      category: (rec.category as any) || 'daily',
    };

    const updated = [newItem, ...practiceItems];
    onUpdatePracticeItems(updated);
    playChimeSound('success');
    handleStartPracticeItem(newItem);
  };

  // Statistics
  const avgMastery = useMemo(() => {
    if (practiceItems.length === 0) return 0;
    const sum = practiceItems.reduce((acc, curr) => acc + curr.masteryScore, 0);
    return Math.round(sum / practiceItems.length);
  }, [practiceItems]);

  const masteredCount = useMemo(() => {
    return practiceItems.filter((p) => p.masteryScore >= 70).length;
  }, [practiceItems]);

  return (
    <div className="flex flex-col h-full bg-slate-950 font-fa text-slate-100 overflow-hidden">
      {/* =========================================================================
          VIEW MODE 1: CLICHÉ CATALOG / BANK HUB (نمای بانک و کاتالوگ کلیشه‌ها)
         ========================================================================= */}
      {viewMode === 'catalog' ? (
        <div className="flex-1 flex flex-col p-3.5 md:p-5 overflow-y-auto overflow-x-hidden max-w-full space-y-4">
          {/* Header & Stats Banner */}
          <div className="space-y-3 pb-3 border-b border-slate-800/90">
            {/* Row 1: Title and Create Button */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-white truncate">
                    بانک و سناریوهای تمرین کلیشه‌ها
                  </h1>
                  <p className="text-[11px] text-slate-400 truncate">
                    انتخاب اصطلاح و ورود به سناریوی هوش مصنوعی
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>کلیشه جدید</span>
              </button>
            </div>

            {/* Row 2: 3-Column Stats Grid (Responsive & Zero Overflow) */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-sm">
              <div className="flex flex-col items-center justify-center p-1">
                <span className="text-[10px] text-slate-400 font-medium">کل کلیشه‌ها</span>
                <span className="font-en font-black text-sm text-white mt-0.5">{practiceItems.length}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1 border-r border-l border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-medium">میانگین تسلط</span>
                <span className="font-en font-black text-sm text-cyan-400 mt-0.5">{avgMastery}%</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1">
                <span className="text-[10px] text-slate-400 font-medium">مسلط شده</span>
                <span className="font-en font-black text-sm text-emerald-400 mt-0.5">{masteredCount}</span>
              </div>
            </div>
          </div>

          {/* Search Bar & Filter Controls */}
          <div className="space-y-2.5 max-w-full overflow-hidden">
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="flex-1 relative min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در نام کلیشه، معنی یا زمینه..."
                  className="w-full pr-10 pl-8 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="py-2 px-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="mastery">بیشترین تسلط</option>
                  <option value="practices">بیشترین تمرین</option>
                  <option value="alphabetical">الفبایی (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills (Internal Horizontal Scroll Without Page Overflow) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-medium max-w-full">
              {[
                { id: 'all', label: 'همه', icon: Sparkles },
                { id: 'work', label: 'کاری و جلسات', icon: BookOpen },
                { id: 'casual', label: 'دوستانه و روزمره', icon: Compass },
                { id: 'needs_practice', label: 'نیاز به تمرین (<۷۰٪)', icon: Flame },
                { id: 'mastered', label: 'مسلط شده (≥۷۰٪)', icon: Award },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition shrink-0 text-xs ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid of Clichés Cards */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => {
                const isMastered = item.masteryScore >= 70;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between group shadow-lg hover:shadow-indigo-500/10 space-y-3"
                  >
                    {/* Top Row: Category badge & Audio preview */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 font-fa">
                          {item.context || 'مکالمه کاربردی'}
                        </span>
                        <h3 className="text-base font-bold text-cyan-300 font-en mt-1.5 group-hover:text-cyan-200 transition">
                          "{item.cliche}"
                        </h3>
                      </div>
                      <button
                        onClick={() => playAudioText(item.cliche)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 transition shrink-0"
                        title="شنیدن تلفظ نیتیو"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Meaning & Example Snippet */}
                    <div>
                      <p className="text-xs text-slate-300 leading-relaxed font-fa font-medium">
                        {item.persianMeaning}
                      </p>
                      {item.exampleSentence && (
                        <p className="text-[11px] text-slate-500 font-en italic mt-1 line-clamp-1">
                          {item.exampleSentence}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar & Practice Stats */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">میزان تسلط:</span>
                        <span
                          className={`font-en font-bold ${
                            isMastered ? 'text-emerald-400' : item.masteryScore > 40 ? 'text-cyan-400' : 'text-amber-400'
                          }`}
                        >
                          {item.masteryScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${item.masteryScore}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMastered
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : item.masteryScore > 40
                              ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                              : 'bg-gradient-to-r from-amber-500 to-orange-400'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>{item.timesPracticed} بار تمرین شده</span>
                        {item.lastPracticedAt && <span>اخیراً تمرین شده</span>}
                      </div>
                    </div>

                    {/* Primary Action Button: Enter Practice */}
                    <button
                      onClick={() => handleStartPracticeItem(item)}
                      className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-md hover:shadow-indigo-600/30 active:scale-98 flex items-center justify-center gap-2 group-hover:gap-2.5"
                    >
                      <span>ورود به تمرین این کلیشه</span>
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center rounded-3xl bg-slate-900 border border-dashed border-slate-800 space-y-3">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                هیچ کلیشه‌ای با این فیلتر یا عبارت جستجو یافت نشد.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold transition"
              >
                پاک کردن فیلترها
              </button>
            </div>
          )}

          {/* Quick Recommendations Drawer / Strip */}
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-2.5 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                کلیشه‌های پرکاربرد پیشنهادی نیتیو (افزودن و تمرین با ۱ کلیک):
              </span>
              <span className="text-[10px] text-slate-500">انتخاب کنید تا بلافاصله به تمرین بروید</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_RECOMMENDED_CLICHES.map((rec) => (
                <button
                  key={rec.cliche}
                  onClick={() => handleQuickAddCliche(rec)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 text-slate-300 hover:text-cyan-300 text-xs transition flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3 h-3 text-indigo-400" />
                  <span className="font-en font-bold text-xs">{rec.cliche}</span>
                  <span className="text-[10px] text-slate-400">({rec.meaningFa})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW MODE 2: ACTIVE PRACTICE STUDIO (میزکار تمرین فعال و اختصاصی)
           ========================================================================= */
        <div className="flex-1 flex flex-col p-3.5 md:p-5 overflow-y-auto overflow-x-hidden max-w-full space-y-3.5">
          {/* =========================================================================
              ACTIVE PRACTICE STUDIO HEADER (هدر یکپارچه، پرارتفاع و برجسته تمرین کلیشه)
             ========================================================================= */}
          {(() => {
            const activeItem: PracticeItem = selectedItem || practiceItems[0] || {
              id: 'default-item',
              cliche: 'call it a day',
              persianMeaning: 'پایان دادن به کار امروز و دست کشیدن از کار',
              category: 'work' as const,
              context: 'محیط کار و پایان شیفت',
              exampleSentence: "We're all exhausted, so let's call it a day.",
              addedAt: new Date().toISOString(),
              timesPracticed: 0,
              masteryScore: 0,
            };

            const isMastered = activeItem.masteryScore >= 70;

            return (
              <header className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-indigo-950/40 border border-indigo-500/30 p-4 md:p-5 shadow-2xl space-y-3.5 shrink-0 relative overflow-hidden backdrop-blur-sm">
                {/* Background decorative glow */}
                <div className="absolute top-0 right-1/4 w-64 h-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-48 h-20 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Navigation & Stepper Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 relative z-10">
                  {/* Back to Catalog Button */}
                  <button
                    onClick={() => {
                      if (isRecording) toggleRecording();
                      setViewMode('catalog');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 shadow-sm border border-slate-700/60"
                  >
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                    <span>بازگشت به بانک کلیشه‌ها</span>
                  </button>

                  {/* Stepper Controls: Previous / Next with Badge */}
                  <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 shadow-inner">
                    <button
                      onClick={() => handleNavigateCliché('prev')}
                      disabled={practiceItems.length <= 1}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition"
                      title="کلیشه قبلی"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-300 px-1.5 select-none font-fa">
                      کلیشه <span className="font-en text-cyan-400 font-black">{currentIndex + 1}</span> از{' '}
                      <span className="font-en">{practiceItems.length}</span>
                    </span>
                    <button
                      onClick={() => handleNavigateCliché('next')}
                      disabled={practiceItems.length <= 1}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition"
                      title="کلیشه بعدی"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Regenerate Fresh Situation Button */}
                  <button
                    onClick={() => handleGenerateSituation(activeItem, true)}
                    disabled={isLoadingSituation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-600/20"
                    title="تولید سناریوی جدید برای این کلیشه"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSituation ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">سناریوی جدید</span>
                  </button>
                </div>

                {/* Hero Cliché Display Area (Spacious, High Visibility, No Truncation) */}
                <div className="space-y-3 relative z-10">
                  {/* Category, Context and Mastery badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>کلیشه و اصطلاح هدف تمرین</span>
                      </span>
                      {activeItem.context && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium border border-slate-700/50">
                          {activeItem.context}
                        </span>
                      )}
                    </div>

                    {/* Mastery Level Tag */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">میزان تسلط:</span>
                      <span
                        className={`font-en font-black text-xs px-2.5 py-0.5 rounded-md ${
                          isMastered
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : activeItem.masteryScore > 40
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {activeItem.masteryScore}%
                      </span>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        ({activeItem.timesPracticed} بار تمرین شده)
                      </span>
                    </div>
                  </div>

                  {/* Main Idiom Display Card with Large Typography and Native Voice */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-indigo-500/30 shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="text-[11px] text-indigo-400 font-bold font-en uppercase tracking-wider">
                        Target American Idiom / Cliché:
                      </div>
                      <h2 className="font-en font-black text-xl sm:text-2xl md:text-3xl text-cyan-300 tracking-tight leading-snug break-words">
                        "{activeItem.cliche}"
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed font-fa pt-0.5">
                        معنی و کاربرد فارسی: <span className="text-white font-bold">{activeItem.persianMeaning}</span>
                      </p>
                    </div>

                    {/* Audio Play Button */}
                    <button
                      onClick={() => playAudioText(activeItem.cliche)}
                      className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600/40 to-cyan-600/30 hover:from-indigo-600 hover:to-cyan-600 text-cyan-300 hover:text-white border border-indigo-500/40 transition active:scale-95 shadow-md flex items-center sm:flex-col justify-center gap-1.5 shrink-0 group"
                      title="شنیدن تلفظ نیتیو با لهجه استاندارد آمریکایی"
                    >
                      <Volume2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold font-fa whitespace-nowrap">تلفظ نیتیو 🎙️</span>
                    </button>
                  </div>

                  {/* Mastery Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${activeItem.masteryScore}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : activeItem.masteryScore > 40
                          ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                          : 'bg-gradient-to-r from-amber-500 to-orange-400'
                      }`}
                    />
                  </div>
                </div>
              </header>
            );
          })()}

          {/* Active Situation Workspace */}
          {isLoadingSituation ? (
            <div className="p-12 text-center text-slate-400 text-xs rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-sm font-bold text-white">در حال طراحی موقعیت مکالمه واقع‌گرایانه جدید...</span>
              <span className="text-xs text-slate-500">هوش مصنوعی یک پارتنر مکالمه و زمینه بومی برای این اصطلاح خلق می‌کند</span>
            </div>
          ) : situationData ? (
            <div className="space-y-4">
              {/* Situation Card */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-indigo-500/30 space-y-3.5 shadow-xl">
                {/* Title & Relationship */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-xs md:text-sm font-bold text-white">
                      {situationData.situationTitleFa}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 px-2.5 py-1 rounded-full bg-slate-800 font-medium">
                    رابطه طرفین: {situationData.relationship}
                  </span>
                </div>

                {/* Situation Context */}
                <p className="text-xs text-slate-300 leading-relaxed font-fa">
                  {situationData.situationContextFa}
                </p>

                {/* Partner Line */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 font-en uppercase tracking-wider">
                      Conversational Partner:
                    </span>
                    <button
                      onClick={() => playAudioText(situationData.conversationalPrompt)}
                      className="p-1 text-slate-400 hover:text-cyan-300 transition"
                      title="شنیدن صدای طرف مکالمه"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="font-en text-xs md:text-sm text-white font-medium">
                    "{situationData.conversationalPrompt}"
                  </p>
                  <p className="text-[11px] text-slate-400 font-fa">
                    {situationData.conversationalPromptFa}
                  </p>
                </div>

                {/* RICH STEP-BY-STEP GUIDANCE (راهنمای نحوه پاسخ‌دهی) */}
                <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-800/80 to-indigo-500/10 border border-amber-500/20 overflow-hidden">
                  <button
                    onClick={() => setShowGuidance(!showGuidance)}
                    className="w-full p-3 flex items-center justify-between text-right text-xs font-bold text-amber-300 hover:text-amber-200 transition"
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span>چگونه پاسخ دهیم؟ (راهنمای زاویه دید، ساختار جمله و کالوکیشن‌ها)</span>
                    </div>
                    {showGuidance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showGuidance && (
                    <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 text-xs text-slate-300 border-t border-amber-500/15">
                      {situationData.guidance ? (
                        <>
                          {/* Approach / Logic */}
                          <div className="space-y-1">
                            <span className="font-bold text-amber-200 text-[11px] flex items-center gap-1">
                              💡 زاویه و منطق پاسخ:
                            </span>
                            <p className="text-[11px] text-slate-300 leading-relaxed pr-2">
                              {situationData.guidance.approachFa}
                            </p>
                          </div>

                          {/* Suggested Blueprint */}
                          <div className="space-y-1">
                            <span className="font-bold text-cyan-300 text-[11px] flex items-center gap-1">
                              📐 ساختار پیشنهادی جمله (Blueprint):
                            </span>
                            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 font-en text-[11px] text-cyan-200 dir-ltr text-left">
                              {situationData.guidance.suggestedPattern}
                            </div>
                          </div>

                          {/* Key Collocations */}
                          {situationData.guidance.keyCollocations && situationData.guidance.keyCollocations.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-bold text-indigo-300 text-[11px] flex items-center gap-1">
                                🔤 واژگان و کالوکیشن‌های کلیدی همنشین:
                              </span>
                              <div className="flex flex-wrap gap-1.5 pr-2">
                                {situationData.guidance.keyCollocations.map((col, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-lg bg-indigo-950/70 border border-indigo-500/30 text-indigo-200 font-en text-[11px]"
                                  >
                                    {col}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cultural Tip */}
                          {situationData.guidance.culturalTipFa && (
                            <div className="space-y-0.5 pt-1 text-[11px] text-amber-200/90 leading-relaxed">
                              <span className="font-bold">🎭 اتیکت و لحن در زبان انگلیسی آمریکایی: </span>
                              {situationData.guidance.culturalTipFa}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-[11px] text-amber-200">
                          💡 {situationData.hint || 'سعی کنید از این اصطلاح در پاسخ استفاده کنید.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* HIGH-PRECISION VOICE RECORDER & INPUT ROW (Exact Speaking UX) */}
                <div className="space-y-2.5 pt-1">
                  {/* Mic Error Notice Banner */}
                  {micErrorMessage && (
                    <div className="p-2.5 rounded-2xl bg-red-950/70 border border-red-500/50 flex items-start justify-between gap-2 text-xs text-red-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">خطای میکروفون: </span>
                          {micErrorMessage}
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            لطفاً در نوار آدرس مرورگر دسترسی به میکروفون را مجاز کنید یا جمله را تایپ فرمایید.
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setMicErrorMessage(null)} className="text-slate-400 hover:text-white p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Dynamic Sound Wave & Active Recording Bar */}
                  {isRecording && (
                    <div className="p-3 rounded-2xl bg-indigo-950/90 border border-indigo-500/50 flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-bold text-white">
                          در حال ضبط پاسخ شما ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                          {String(recordingSeconds % 60).padStart(2, '0')})
                        </span>
                      </div>

                      {/* Real-time Dynamic Waveform visualizer */}
                      <div className="flex items-center gap-1 h-6">
                        {[40, 70, 100, 60, 85, 45, 90].map((h, i) => {
                          const heightPercent = Math.max(25, Math.min(100, audioVolume * (h / 70)));
                          return (
                            <span
                              key={i}
                              style={{ height: `${heightPercent}%` }}
                              className="w-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full transition-all duration-75"
                            />
                          );
                        })}
                      </div>

                      <button
                        onClick={toggleRecording}
                        className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition shadow-sm"
                      >
                        توقف ضبط ⏹️
                      </button>
                    </div>
                  )}

                  {/* Input Row: Mic Button + Text Input + Send Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleRecording}
                      className={`p-3 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                        isRecording
                          ? 'bg-red-500 text-white animate-pulse shadow-red-500/30 ring-4 ring-red-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      }`}
                      title={isRecording ? 'توقف ضبط' : 'شروع ضبط صوتی'}
                    >
                      {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={userResponseInput}
                        onChange={(e) => setUserResponseInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEvaluateResponse()}
                        placeholder="پاسخ خود را بگویید یا به انگلیسی اینجا بنویسید..."
                        className="w-full py-2.5 px-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-en text-white focus:outline-none focus:border-indigo-500 transition placeholder-slate-500"
                      />
                    </div>

                    <button
                      onClick={() => handleEvaluateResponse()}
                      disabled={!userResponseInput.trim() || isEvaluating}
                      className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 shadow-md active:scale-95 shrink-0"
                      title="تحلیل و ارزیابی پاسخ"
                    >
                      {isEvaluating ? (
                        <Sparkles className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <Send className="w-5 h-5 rotate-180" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* DYNAMIC IN-DEPTH EVALUATING BANNER */}
              {isEvaluating && (
                <div className="p-4 rounded-3xl bg-indigo-950/90 border border-indigo-500/50 space-y-3 shadow-2xl animate-in fade-in">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                      <div>
                        <span className="text-xs md:text-sm font-bold text-white block">
                          در حال ارزیابی تخصصی صوت، اکسنت آمریکایی و گرامر...
                        </span>
                        <span className="text-[11px] text-slate-300">
                          بررسی فونم‌های حساس (/t̬/ Flap T، /r/ آمریکایی)، استرس کلمات و درستی کاربرد اصطلاح
                        </span>
                      </div>
                    </div>
                    {recordedAudioUrl && (
                      <button
                        onClick={() => {
                          const a = new Audio(recordedAudioUrl);
                          a.play().catch(() => {});
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition active:scale-95 shadow-sm border border-cyan-500/30"
                        title="پخش صدای ضبط‌شده شما"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>شنیدن صدای ضبط‌شده 🎧</span>
                      </button>
                    )}
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-1.5 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {/* IN-DEPTH EVALUATION & NATIVE AMERICAN MODEL SECTION */}
              {evaluationResult && (
                <div className="p-4 md:p-5 rounded-3xl bg-slate-900 border border-indigo-500/40 space-y-4 shadow-2xl animate-in fade-in">
                  {/* Evaluation Verdict Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700">
                    <div className="flex items-center gap-2.5">
                      {evaluationResult.usedTargetCliche ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white">
                          {evaluationResult.usedTargetCliche
                            ? 'آفرین! اصطلاح با موفقیت و در جایگاه مناسب در جمله به کار گرفته شد.'
                            : 'اصطلاح هدف در جمله شما به کار نرفت یا ناقص ادا شد.'}
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {evaluationResult.verdictFa}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User's Spoken Response Card with Replay Button */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">پاسخ ثبت‌شده شما:</span>
                      </div>
                      {recordedAudioUrl && (
                        <button
                          onClick={() => {
                            const a = new Audio(recordedAudioUrl);
                            a.play().catch(() => {});
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition active:scale-95 shadow-sm"
                          title="پخش مجدد صدای ضبط‌شده شما برای مقایسه با تلفظ آمریکایی"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>شنیدن صدای ضبط‌شده شما 🎧</span>
                        </button>
                      )}
                    </div>
                    <p className="font-en text-xs md:text-sm text-cyan-100 font-medium dir-ltr text-left px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      "{evaluationResult.analysis?.userSpokenTranscript || userResponseInput || situationData.idealSampleResponse}"
                    </p>
                  </div>

                  {/* 4 Multi-Metric Pedagogical Score Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 font-bold mb-0.5">امتیاز کلی</div>
                      <div className="font-en font-black text-sm text-indigo-300">
                        {evaluationResult.analysis?.overallScore || evaluationResult.accuracyScore}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 font-bold mb-0.5">کاربرد اصطلاح</div>
                      <div className="font-en font-black text-sm text-emerald-400">
                        {evaluationResult.accuracyScore}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 font-bold mb-0.5">دقت گرامر</div>
                      <div className="font-en font-black text-sm text-cyan-400">
                        {evaluationResult.analysis?.grammarScore || 85}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400 font-bold mb-0.5">اکسنت و تلفظ</div>
                      <div className="font-en font-black text-sm text-amber-400">
                        {evaluationResult.analysis?.pronunciationScore || 88}%
                      </div>
                    </div>
                  </div>

                  {/* SPECIAL SECTION: NATIVE AMERICAN CONCEPT & CLICHÉ EQUIVALENT (WITH + ADD TO PRACTICE) */}
                  {evaluationResult.americanConceptModel && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/80 border border-cyan-500/40 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                            الگوی اصیل بومی آمریکایی
                          </span>
                          <span className="text-xs font-bold text-white">
                            اگر یک آمریکایی می‌خواست همین مفهوم را برساند:
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => playAudioText(evaluationResult.americanConceptModel!.expression)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition shadow-sm"
                            title="شنیدن صوت نیتیو"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>پخش تلفظ 🔊</span>
                          </button>

                          {/* (+) BUTTON TO ADD CLICHÉ TO PRACTICE LIST (EXACT SPEAKING UX) */}
                          {evaluationResult.americanConceptModel.clicheUsed && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddSuggestedCliche(
                                  evaluationResult.americanConceptModel!.clicheUsed,
                                  evaluationResult.americanConceptModel!.clicheMeaningFa ||
                                    evaluationResult.americanConceptModel!.expressionFa ||
                                    'اصطلاح کاربردی نیتیو'
                                )
                              }
                              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition shadow-md active:scale-95 ${
                                addedCliches[evaluationResult.americanConceptModel.clicheUsed]
                                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                              }`}
                              title="افزودن این عبارت یا کلیشه به لیست تمرینات"
                            >
                              {addedCliches[evaluationResult.americanConceptModel.clicheUsed] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>به تمرین رفت ✓</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ افزودن به تمرینات</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Native Expression Sentence */}
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                        <p className="font-en text-sm font-bold text-white tracking-wide">
                          "{evaluationResult.americanConceptModel.expression}"
                        </p>
                        <p className="font-fa text-xs text-cyan-200 mt-1 font-medium">
                          {evaluationResult.americanConceptModel.expressionFa}
                        </p>
                      </div>

                      {/* Why it is native & cliché breakdown */}
                      <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed pr-1">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold text-[11px] flex-wrap">
                          <span>اصطلاح و فرمول به کار رفته:</span>
                          <span className="font-en text-cyan-300 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                            {evaluationResult.americanConceptModel.clicheUsed}
                          </span>
                          {evaluationResult.americanConceptModel.clicheMeaningFa && (
                            <span className="text-slate-400 font-fa text-[11px]">
                              ({evaluationResult.americanConceptModel.clicheMeaningFa})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                          {evaluationResult.americanConceptModel.whyItIsNativeFa}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tabs for Detailed Pedagogical Analysis */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto">
                      <button
                        onClick={() => setActiveAnalysisTab('acoustic')}
                        className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                          activeAnalysisTab === 'acoustic'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        تحلیل صوتی و تلفظ آمریکایی 🎙️
                      </button>
                      <button
                        onClick={() => setActiveAnalysisTab('linguistic')}
                        className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                          activeAnalysisTab === 'linguistic'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        ایرادات زبانی و اصلاحات ({evaluationResult.analysis?.categorizedIssues?.length || 0}) ✍️
                      </button>
                      <button
                        onClick={() => setActiveAnalysisTab('native')}
                        className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                          activeAnalysisTab === 'native'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        نقاط قوت و اتیکت موقعیتی 🌟
                      </button>
                    </div>

                    {/* Tab 1: Strengths & Social Tone */}
                    {activeAnalysisTab === 'native' && (
                      <div className="space-y-3 text-xs">
                        {evaluationResult.analysis?.strengths && evaluationResult.analysis.strengths.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              نقاط قوت پاسخ ثبت‌شده شما:
                            </span>
                            <ul className="space-y-1 pr-2 list-disc list-inside text-slate-300 text-[11px] leading-relaxed">
                              {evaluationResult.analysis.strengths.map((str, i) => (
                                <li key={i}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {evaluationResult.analysis?.socialTone && (
                          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between font-bold text-indigo-300">
                              <span>🎭 لحن و اتیکت پاسخ:</span>
                              <span className="text-slate-400">
                                {evaluationResult.analysis.socialTone.registerFa} (ادب: {evaluationResult.analysis.socialTone.politenessLevel} از ۵)
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed pt-1">
                              {evaluationResult.analysis.socialTone.culturalEtiquetteTipFa}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Categorized Linguistic Issues */}
                    {activeAnalysisTab === 'linguistic' && (
                      <div className="space-y-2.5 text-xs">
                        {evaluationResult.analysis?.categorizedIssues && evaluationResult.analysis.categorizedIssues.length > 0 ? (
                          evaluationResult.analysis.categorizedIssues.map((issue, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl bg-slate-800/80 border border-amber-500/30 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-300">
                                  ایراد شماره {idx + 1}: {issue.titleFa}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400">
                                  {issue.categoryFa}
                                </span>
                              </div>

                              {issue.originalSnippet && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200">
                                    <span className="block text-[10px] text-red-400 font-bold mb-0.5">عبارت شما:</span>
                                    <span className="font-en">{issue.originalSnippet}</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-200">
                                    <span className="block text-[10px] text-emerald-400 font-bold mb-0.5">شکل طبیعی:</span>
                                    <span className="font-en">{issue.correctedSnippet}</span>
                                  </div>
                                </div>
                              )}

                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {issue.explanationFa}
                              </p>

                              {issue.howToFixFa && (
                                <div className="p-2 rounded-xl bg-slate-900/60 text-[11px] text-indigo-300">
                                  <span className="font-bold">روش اصلاح: </span>
                                  {issue.howToFixFa}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center rounded-2xl bg-slate-800/50 border border-slate-700/60 text-slate-400 text-xs">
                            هیچ ایراد ساختاری یا گرامری در جمله شما یافت نشد؛ ساختار عالی بود!
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Acoustic & Voice Analysis */}
                    {activeAnalysisTab === 'acoustic' && (
                      <div className="space-y-2.5 text-xs">
                        {evaluationResult.analysis?.voiceAnalysis ? (
                          <div className="space-y-2.5">
                            {/* Phonemes */}
                            {evaluationResult.analysis.voiceAnalysis.phonemeIssues &&
                              evaluationResult.analysis.voiceAnalysis.phonemeIssues.map((ph, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1 text-[11px]"
                                >
                                  <div className="flex items-center justify-between font-bold text-cyan-300">
                                    <span>صدای {ph.soundOrWord} ({ph.targetPhonetic}):</span>
                                    <span className="text-slate-400 font-normal">{ph.whatWasHeardFa}</span>
                                  </div>
                                  <p className="text-slate-300 leading-relaxed">{ph.whyItMattersFa}</p>
                                  <p className="text-indigo-300 font-medium">{ph.howToFixFa}</p>
                                </div>
                              ))}

                            {/* Word Stress */}
                            {evaluationResult.analysis.voiceAnalysis.wordStressIssues &&
                              evaluationResult.analysis.voiceAnalysis.wordStressIssues.map((ws, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1 text-[11px]"
                                >
                                  <div className="flex items-center justify-between font-bold text-amber-300">
                                    <span>استرس کلمه: {ws.word}</span>
                                    <span className="font-en text-cyan-300 font-bold">{ws.targetStress}</span>
                                  </div>
                                  <p className="text-slate-300 leading-relaxed">{ws.whyItMattersFa}</p>
                                  <p className="text-indigo-300 font-medium">{ws.howToFixFa}</p>
                                </div>
                              ))}

                            {/* Thought Groups */}
                            {evaluationResult.analysis.voiceAnalysis.thoughtGroups && (
                              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1 text-[11px]">
                                <span className="font-bold text-indigo-300">گروه‌بندی کلامی و مکث‌ها (Thought Groups):</span>
                                <div className="p-2 rounded-xl bg-slate-900 font-en text-cyan-300 dir-ltr text-left">
                                  {evaluationResult.analysis.voiceAnalysis.thoughtGroups.suggestedChunking}
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                  {evaluationResult.analysis.voiceAnalysis.thoughtGroups.howToFixFa}
                                </p>
                              </div>
                            )}

                            {/* Drill Sequence */}
                            {evaluationResult.analysis.voiceAnalysis.drillSequenceFa &&
                              evaluationResult.analysis.voiceAnalysis.drillSequenceFa.length > 0 && (
                                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-1 text-[11px]">
                                  <span className="font-bold text-indigo-300">🎯 اولویت تمرین مرحله‌به‌مرحله:</span>
                                  <ul className="space-y-0.5 pr-2 list-disc list-inside text-slate-300">
                                    {evaluationResult.analysis.voiceAnalysis.drillSequenceFa.map((d, i) => (
                                      <li key={i}>{d}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="p-6 text-center rounded-2xl bg-slate-800/50 border border-slate-700/60 text-slate-400 text-xs">
                            تحلیل صوتی و تلفظی برای این جمله ثبت شده است.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post-Practice Action Bar */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      onClick={() => handleGenerateSituation(selectedItem, true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 text-indigo-400" />
                      <span>تمرین دوباره همین کلیشه با سناریوی تازه</span>
                    </button>

                    <button
                      onClick={() => handleNavigateCliché('next')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 active:scale-95"
                    >
                      <span>رفتن به کلیشه بعدی</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-400">
                برای بارگذاری سناریوی مکالمه این کلیشه، کلیک فرمایید:
              </p>
              <button
                onClick={() => handleGenerateSituation()}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
              >
                تولید موقعیت تمرینی جدید
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CREATE NEW PRACTICE CLICHÉ MODAL
         ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm font-fa animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-indigo-500/40 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">ایجاد تمرین جدید (کلیشه آمریکایی)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Pick Recommendations */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">
                انتخاب سریع از پرکاربردترین کلیشه‌های نیتیو:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {POPULAR_RECOMMENDED_CLICHES.map((rec) => (
                  <button
                    key={rec.cliche}
                    type="button"
                    onClick={() => {
                      setNewClicheInput(rec.cliche);
                      setNewMeaningInput(rec.meaningFa);
                      setNewCategoryInput((rec.category as any) || 'daily');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 text-[11px] transition"
                  >
                    {rec.cliche}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  عبارت یا کلیشه انگلیسی (English Cliché):
                </label>
                <input
                  type="text"
                  value={newClicheInput}
                  onChange={(e) => setNewClicheInput(e.target.value)}
                  placeholder="مثال: cut corners, hit the road"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-en text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  معنی و کاربرد فارسی:
                </label>
                <input
                  type="text"
                  value={newMeaningInput}
                  onChange={(e) => setNewMeaningInput(e.target.value)}
                  placeholder="مثال: سمبل کردن کار، عازم سفر شدن"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    دسته‌بندی:
                  </label>
                  <select
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="daily">روزمره و عمومی</option>
                    <option value="work">کاری و شغلی</option>
                    <option value="casual">دوستانه و کافه</option>
                    <option value="social">مهمانی و اجتماعی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    زمینه (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={newContextInput}
                    onChange={(e) => setNewContextInput(e.target.value)}
                    placeholder="مثال: جلسه کاری"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreateNewPractice}
              disabled={!newClicheInput.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>ایجاد تمرین و شروع مکالمه</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
