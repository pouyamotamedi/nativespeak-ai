import React, { useState, useEffect } from 'react';
import {
  AIPersona,
  Scenario,
  LeitnerWord,
  PracticeItem,
  WeaknessItem,
  CalendarScenario,
  AssessmentResult,
  PracticeGoals,
  UserProgress,
  UserC2ChecklistState,
} from './types';
import {
  getStoredActivePersona,
  saveStoredActivePersona,
  getStoredLeitnerWords,
  saveStoredLeitnerWords,
  getStoredPracticeItems,
  saveStoredPracticeItems,
  getStoredWeaknesses,
  saveStoredWeaknesses,
  getStoredCalendar,
  saveStoredCalendar,
  getStoredAssessment,
  saveStoredAssessment,
  getStoredGoals,
  saveStoredGoals,
  getStoredProgress,
  saveStoredProgress,
  getStoredC2ChecklistState,
  saveStoredC2ChecklistState,
  generateSmartExampleSentence,
  isDemoLeitnerWord,
  isDemoPracticeItem,
  getStoredActiveScenarioId,
  saveStoredActiveScenarioId,
} from './utils/storage';
import {
  getNextUntickedC2Cohort,
  generateTenScenariosForUntickedCohort,
  getC2CohortForWeaknesses,
  matchWeaknessToC2ChecklistItem,
} from './data/c2Checklist';
import {
  subscribeToAuth,
  logOut,
  loadUserCloudData,
  saveUserCloudData,
  completeGoogleRedirectIfAny,
  getCachedAuthUser,
  saveCachedAuthUser,
  clearCachedAuthUser,
} from './utils/firebase';
import { User } from 'firebase/auth';
import { checkDailyReminder } from './utils/notifications';
import { SpeakingScreen } from './components/SpeakingScreen';
import { LeitnerScreen } from './components/LeitnerScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { PersonaSelectorModal } from './components/PersonaSelectorModal';
import { InitialAssessmentModal } from './components/InitialAssessmentModal';
import { AuthModal } from './components/AuthModal';
import { ApiKeysModal } from './components/ApiKeysModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import {
  Mic,
  Brain,
  Sparkles,
  TrendingUp,
  Flame,
  Smartphone,
  Maximize2,
  WifiOff,
  Award,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Menu,
  X,
} from 'lucide-react';
import { apiFetch } from './utils/userApiKeys';
import { playChimeSound } from './utils/audio';
import { convertCalendarToScenario, generateAdaptiveScenarioFromWeaknesses } from './utils/linguisticEngine';
import { applyProgressActivity, reconcileProgressCalendar } from './utils/progressTracking';
import { hasRequiredApiKeys } from './utils/userApiKeys';

type TabType = 'speaking' | 'leitner' | 'practice' | 'progress';

const DEFAULT_ORIENTATION_SCENARIO: Scenario = {
  id: 'orientation-start',
  title: 'Orientation & Speaking Placement',
  titleFa: 'جلسه آشنایی: تعیین سطح صوتی و طراحی سناریوهای اختصاصی',
  category: 'daily',
  userRole: 'زبان‌آموز',
  aiRole: 'مربی هوش مصنوعی',
  icon: '🎙️',
  starter: "Welcome to NativeSpeak AI! Before we design your personalized curriculum to C2 American Mastery, let's take a quick 3-minute speaking diagnostic.",
  starterFa: "به نیتیو اسپیک خوش آمدید! قبل از طراحی سناریوهای اختصاصی شما تا سطح C2، ابتدا یک تعیین سطح صوتی ۳ دقیقه‌ای انجام می‌دهیم تا نقاط ضعفتان مشخص شوند.",
  descriptionFa: 'تعیین سطح صوتی جامع جهت استخراج نقاط ضعف و طراحی تقویم سناریوها',
  clicheTag: 'hit the ground running',
  relationship: 'مربی آموزشی',
  recommendedRegister: 'casual',
  targetGrammar: 'Present Simple & Daily Fluency',
  targetGrammarFa: 'معرفی اولیه و بیان علایق بدون ترجمه مستقیم فارسی',
  targetCliches: ['hit the ground running (شروع با انرژی و پرقدرت)'],
  targetPronunciation: 'لهجه عمومی امریکن و وضوح کلام',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('speaking');
  const [persona, setPersona] = useState<AIPersona>(getStoredActivePersona());
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  // Authentication State — initialized from local session cache so it never flashes logged out
  const [currentUser, setCurrentUser] = useState<User | any>(() => getCachedAuthUser());
  const [authReady, setAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Data States
  const [leitnerWords, setLeitnerWords] = useState<LeitnerWord[]>(getStoredLeitnerWords());
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>(getStoredPracticeItems());
  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>(getStoredWeaknesses());
  const [calendar, setCalendar] = useState<CalendarScenario[]>(getStoredCalendar());
  const [assessment, setAssessment] = useState<AssessmentResult>(getStoredAssessment());
  const [goals, setGoals] = useState<PracticeGoals>(getStoredGoals());
  const [progress, setProgress] = useState<UserProgress>(() => {
    const raw = getStoredProgress();
    const reconciled = reconcileProgressCalendar(raw);
    saveStoredProgress(reconciled);
    return reconciled;
  });
  const [c2ChecklistState, setC2ChecklistState] = useState<UserC2ChecklistState>(getStoredC2ChecklistState());

  // Active scenario is strictly derived from the user's generated calendar and persisted across app closes
  const [activeScenario, setActiveScenario] = useState<Scenario>(() => {
    const storedAssessment = getStoredAssessment();
    const storedCal = getStoredCalendar();
    const savedScenarioId = getStoredActiveScenarioId();
    if (storedAssessment.completed && storedCal && storedCal.length > 0) {
      if (savedScenarioId) {
        const found = storedCal.find((c) => c.id === savedScenarioId);
        if (found) return convertCalendarToScenario(found);
      }
      return convertCalendarToScenario(storedCal[0]);
    }
    return DEFAULT_ORIENTATION_SCENARIO;
  });

  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  /** After finishing 10 lessons, force a fresh placement before the next cohort */
  const [isCycleReassessment, setIsCycleReassessment] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

  /** Onboarding & sync: Close auth modal, and if placement isn't done yet, invite to placement. */
  const continueOnboardingAfterAuth = (user: User | null, assCompleted?: boolean) => {
    setIsAuthModalOpen(false);
    setIsApiKeysOpen(false);
    if (!user) return;
    const done = assCompleted ?? getStoredAssessment().completed;
    if (!done || isCycleReassessment) {
      setIsAssessmentOpen(true);
    }
  };

  const openAssessmentFlow = () => {
    setIsAssessmentOpen(true);
  };

  const handleApiKeysSaved = () => {
    setIsApiKeysOpen(false);
  };

  // Helper to sync to Firestore for current user
  const syncToCloud = (partial: any) => {
    if (currentUser?.uid) {
      saveUserCloudData(currentUser.uid, partial);
    }
  };

  // Firebase Auth: Login FIRST, then API keys, then placement — never skip login
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const redirectUser = await completeGoogleRedirectIfAny();
        if (redirectUser && !cancelled) {
          setCurrentUser(redirectUser);
        }
      } catch (e) {
        console.warn('Redirect check error:', e);
      }
    })();

    const unsubscribe = subscribeToAuth(async (user) => {
      if (cancelled) return;
      if (user) {
        setCurrentUser(user);
        saveCachedAuthUser(user);
      } else {
        setCurrentUser(null);
        clearCachedAuthUser();
      }
      setAuthReady(true);

      if (!user) {
        continueOnboardingAfterAuth(null);
        return;
      }

      try {
        const cloudData = await loadUserCloudData(user.uid);
        if (cancelled) return;

        if (cloudData) {
          const isAssCompleted = Boolean(cloudData.assessment && cloudData.assessment.completed);
          if (cloudData.assessment) {
            setAssessment(cloudData.assessment);
            saveStoredAssessment(cloudData.assessment);
          }
          if (isAssCompleted && cloudData.calendar && cloudData.calendar.length > 0) {
            const cleanedCalendar = cloudData.calendar.filter(
              (item: any) =>
                item &&
                item.id !== 'airport-customs' &&
                !item.titleFa?.includes('گیت بازرسی') &&
                !item.titleFa?.includes('کنترل گذرنامه') &&
                !item.title?.toLowerCase().includes('customs') &&
                !item.title?.toLowerCase().includes('airport')
            );
            setCalendar(cleanedCalendar);
            saveStoredCalendar(cleanedCalendar);
            if (cleanedCalendar.length > 0) {
              const savedScenarioId = getStoredActiveScenarioId();
              const matchedScenario = savedScenarioId
                ? cleanedCalendar.find((c: any) => c.id === savedScenarioId)
                : null;
              if (matchedScenario) {
                setActiveScenario(convertCalendarToScenario(matchedScenario));
              } else if (!savedScenarioId) {
                setActiveScenario(convertCalendarToScenario(cleanedCalendar[0]));
              }
            }
          } else if (!isAssCompleted) {
            setCalendar([]);
            saveStoredCalendar([]);
            setActiveScenario(DEFAULT_ORIENTATION_SCENARIO);
          }
          if (cloudData.weaknesses && cloudData.weaknesses.length > 0) {
            setWeaknesses(cloudData.weaknesses);
            saveStoredWeaknesses(cloudData.weaknesses);
          }
          if (cloudData.leitnerWords) {
            const filteredWords = (cloudData.leitnerWords as LeitnerWord[]).filter(
              (w) => !isDemoLeitnerWord(w)
            );
            setLeitnerWords(filteredWords);
            saveStoredLeitnerWords(filteredWords);
            if (filteredWords.length !== cloudData.leitnerWords.length) {
              saveUserCloudData(user.uid, { leitnerWords: filteredWords });
            }
          } else {
            setLeitnerWords([]);
            saveStoredLeitnerWords([]);
          }
          if (cloudData.practiceItems) {
            const filteredItems = (cloudData.practiceItems as PracticeItem[]).filter(
              (p) => !isDemoPracticeItem(p)
            );
            setPracticeItems(filteredItems);
            saveStoredPracticeItems(filteredItems);
            if (filteredItems.length !== cloudData.practiceItems.length) {
              saveUserCloudData(user.uid, { practiceItems: filteredItems });
            }
          } else {
            setPracticeItems([]);
            saveStoredPracticeItems([]);
          }
          if (cloudData.progress) {
            setProgress(cloudData.progress);
            saveStoredProgress(cloudData.progress);
          }
          if (cloudData.c2ChecklistState) {
            setC2ChecklistState(cloudData.c2ChecklistState);
            saveStoredC2ChecklistState(cloudData.c2ChecklistState);
          }

          continueOnboardingAfterAuth(user, isAssCompleted);
        } else {
          saveUserCloudData(user.uid, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            assessment,
            calendar,
            weaknesses,
            c2ChecklistState,
            leitnerWords: leitnerWords.filter((w) => !isDemoLeitnerWord(w)),
            practiceItems: practiceItems.filter((p) => !isDemoPracticeItem(p)),
            progress,
          });
          continueOnboardingAfterAuth(user, assessment.completed);
        }
      } catch (err) {
        console.warn('Cloud sync after login failed:', err);
        // Still continue onboarding locally even if Firestore hiccups
        continueOnboardingAfterAuth(user, getStoredAssessment().completed);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Monitor online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor daily practice reminder
  useEffect(() => {
    const interval = setInterval(() => {
      checkDailyReminder(goals.reminderTime, goals.reminderEnabled);
    }, 60000);
    return () => clearInterval(interval);
  }, [goals.reminderTime, goals.reminderEnabled]);

  // Persist active scenario ID locally and to cloud whenever user switches scenario
  useEffect(() => {
    if (activeScenario?.id) {
      saveStoredActiveScenarioId(activeScenario.id);
      syncToCloud({ activeScenarioId: activeScenario.id });
    }
  }, [activeScenario?.id]);

  // Handlers
  const handleSelectPersona = (selected: AIPersona) => {
    setPersona(selected);
    saveStoredActivePersona(selected.id);
    playChimeSound('ding');
  };

  const handleUpdateLeitnerWords = (updated: LeitnerWord[]) => {
    setLeitnerWords(updated);
    saveStoredLeitnerWords(updated);
    syncToCloud({ leitnerWords: updated });
  };

  const handleUpdatePracticeItems = (updated: PracticeItem[]) => {
    setPracticeItems(updated);
    saveStoredPracticeItems(updated);
    syncToCloud({ practiceItems: updated });
  };

  // Add word to Leitner with real Persian translation and authentic sample sentences
  const handleAddWordToLeitner = async (
    wordText: string,
    contextSentence?: string,
    customMeaning?: string
  ) => {
    const term = wordText.trim();
    if (!term) return;
    const termKey = term.toLowerCase();
    const exists = leitnerWords.some((w) => w.word.toLowerCase() === termKey);
    if (exists) return;

    const wordId = `word-${Date.now()}`;
    const initialSentences = contextSentence
      ? [{ english: contextSentence, persian: customMeaning || `مثال کاربردی برای ${term}` }]
      : [];

    const newWord: LeitnerWord = {
      id: wordId,
      word: term,
      phonetic: '',
      partOfSpeech: 'expression',
      persianMeaning: customMeaning || 'در حال دریافت معنی و مثال...',
      collocations: [],
      sampleSentences: initialSentences,
      box: 1,
      nextReviewDue: new Date().toISOString(),
      timesReviewed: 0,
      correctCount: 0,
    };
    const updated = [newWord, ...leitnerWords];
    setLeitnerWords(updated);
    saveStoredLeitnerWords(updated);

    const updatedProgress = {
      ...progress,
      todayWordsLearned: progress.todayWordsLearned + 1,
      totalWordsLearned: progress.totalWordsLearned + 1,
    };
    setProgress(updatedProgress);
    saveStoredProgress(updatedProgress);
    syncToCloud({ leitnerWords: updated, progress: updatedProgress });
    playChimeSound('success');

    // Asynchronously enrich with real dictionary / AI lookup
    try {
      const resp = await apiFetch('/api/lookup-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: term, context: contextSentence }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setLeitnerWords((prev) => {
          const mapped = prev.map((item) => {
            if (item.id === wordId) {
              return {
                ...item,
                word: data.word || item.word,
                phonetic: data.phonetic || item.phonetic,
                partOfSpeech: data.partOfSpeech || item.partOfSpeech,
                persianMeaning: data.persianMeaning || customMeaning || item.persianMeaning,
                persianNuance: data.persianNuance || item.persianNuance,
                americanUsageNote: data.americanUsageNote || item.americanUsageNote,
                collocations: Array.isArray(data.collocations) && data.collocations.length > 0 ? data.collocations : item.collocations,
                sampleSentences: Array.isArray(data.sampleSentences) && data.sampleSentences.length > 0
                  ? data.sampleSentences
                  : item.sampleSentences.length > 0
                  ? item.sampleSentences
                  : [{ english: contextSentence || `I use "${term}" in conversations.`, persian: `مثال کاربردی برای ${term}` }],
                pronunciationTipFa: data.pronunciationTipFa || item.pronunciationTipFa,
              };
            }
            return item;
          });
          saveStoredLeitnerWords(mapped);
          syncToCloud({ leitnerWords: mapped });
          return mapped;
        });
      }
    } catch (e) {
      console.warn('Lookup word failed:', e);
      setLeitnerWords((prev) => {
        const mapped = prev.map((item) => {
          if (item.id === wordId && item.persianMeaning === 'در حال دریافت معنی و مثال...') {
            return {
              ...item,
              persianMeaning: customMeaning || `اصطلاح کاربردی: ${term}`,
              sampleSentences: item.sampleSentences.length > 0 ? item.sampleSentences : [
                {
                  english: contextSentence || `I use "${term}" in conversations.`,
                  persian: `مثال کاربردی برای ${term}`,
                },
              ],
            };
          }
          return item;
        });
        saveStoredLeitnerWords(mapped);
        return mapped;
      });
    }
  };

  // Add cliché to Practice with authentic context sentence
  const handleAddClicheToPractice = (cliche: string, meaningFa: string, contextSentence?: string) => {
    const term = cliche.trim();
    const exists = practiceItems.some((p) => p.cliche.toLowerCase() === term.toLowerCase());
    if (exists) return;

    const newItem: PracticeItem = {
      id: `practice-${Date.now()}`,
      cliche: term,
      persianMeaning: meaningFa || 'کلیشه محاوره‌ای نیتیو',
      context: activeScenario.titleFa,
      exampleSentence: contextSentence || generateSmartExampleSentence(term, meaningFa),
      addedAt: new Date().toISOString(),
      timesPracticed: 0,
      masteryScore: 40,
    };
    const updated = [newItem, ...practiceItems];
    setPracticeItems(updated);
    saveStoredPracticeItems(updated);
    syncToCloud({ practiceItems: updated });
    playChimeSound('success');
  };

  const handleAddWordToBoth = (wordText: string, contextSentence?: string, customMeaning?: string) => {
    handleAddWordToLeitner(wordText, contextSentence, customMeaning);
    handleAddClicheToPractice(wordText, customMeaning || 'اصطلاح محاوره‌ای نیتیو', contextSentence);
  };

  const handleUpdateGoals = (newGoals: PracticeGoals) => {
    setGoals(newGoals);
    saveStoredGoals(newGoals);
    syncToCloud({ goals: newGoals });
  };

  const handleSessionMinuteLogged = (minutes: number) => {
    const updated = applyProgressActivity(progress, { minutesSpoken: minutes });
    setProgress(updated);
    saveStoredProgress(updated);
    syncToCloud({ progress: updated });
  };

  // Scenario completed with >= 80% mastery: Track specific C2 checklist item and advance cohort
  const handleScenarioCompleted = (completedScenario?: Scenario) => {
    const sc = completedScenario || activeScenario;
    const targetC2Id = sc.targetChecklistItemId || (sc as any).targetChecklistItemId;

    // 1. Mark this specific C2 checklist item as mastered
    const newMasteredIds = targetC2Id && !c2ChecklistState.masteredIds.includes(targetC2Id)
      ? [...c2ChecklistState.masteredIds, targetC2Id]
      : c2ChecklistState.masteredIds;

    // 2. Mark this scenario as completed in calendar
    const updatedCalendar = calendar.map((c) =>
      c.id === sc.id || c.titleFa === sc.titleFa
        ? { ...c, status: 'completed' as const }
        : c
    );
    setCalendar(updatedCalendar);
    saveStoredCalendar(updatedCalendar);

    // 3. Update user progress stats (real streak / today counters)
    const updatedProg = applyProgressActivity(progress, { scenarioCompleted: true, minutesSpoken: 1 });
    setProgress(updatedProg);
    saveStoredProgress(updatedProg);

    // 4. Update cycle scenario completion count
    const completedInCycle = updatedCalendar.filter((c) => c.status === 'completed').length;
    const isCycleComplete = completedInCycle >= 10 || (updatedCalendar.length > 0 && updatedCalendar.every((c) => c.status === 'completed'));

    const updatedChecklistState: UserC2ChecklistState = {
      ...c2ChecklistState,
      masteredIds: newMasteredIds,
      cycleScenariosCompleted: completedInCycle,
    };
    setC2ChecklistState(updatedChecklistState);
    saveStoredC2ChecklistState(updatedChecklistState);

    syncToCloud({
      progress: updatedProg,
      calendar: updatedCalendar,
      c2ChecklistState: updatedChecklistState,
    });

    playChimeSound('levelUp');

    // 5. IF CURRENT 10-LESSON COHORT IS FULLY MASTERED → fresh diagnostic (not silent local advance)
    if (isCycleComplete) {
      const remaining = getNextUntickedC2Cohort(updatedChecklistState.masteredIds, 10);
      if (remaining.length === 0) {
        const finalProg = { ...progress, cefrLevel: 'C2' as const };
        setProgress(finalProg);
        saveStoredProgress(finalProg);
        syncToCloud({ progress: finalProg });
        playChimeSound('levelUp');
        return;
      }
      setTimeout(() => {
        const bumped: UserC2ChecklistState = {
          ...updatedChecklistState,
          currentCycle: updatedChecklistState.currentCycle + 1,
          totalCyclesCompleted: updatedChecklistState.totalCyclesCompleted + 1,
          cycleScenariosCompleted: 0,
          currentCycleUntickedIds: [],
        };
        setC2ChecklistState(bumped);
        saveStoredC2ChecklistState(bumped);
        syncToCloud({ c2ChecklistState: bumped });
        setIsCycleReassessment(true);
        openAssessmentFlow();
        playChimeSound('levelUp');
      }, 800);
    } else {
      const nextUpcoming = updatedCalendar.find((c) => c.status !== 'completed');
      if (nextUpcoming) {
        setActiveScenario(convertCalendarToScenario(nextUpcoming));
      }
    }
  };

  const handleUpdateMetrics = (
    grammarScore: number,
    fluencyScore: number,
    phoneticsHints?: Partial<UserProgress['phoneticsBreakdown']>
  ) => {
    const updated = applyProgressActivity(progress, {
      grammarScore,
      fluencyScore,
      phoneticsHints,
    });
    setProgress(updated);
    saveStoredProgress(updated);
    syncToCloud({ progress: updated });
  };

  const handleWordMastered = () => {
    const updated = {
      ...applyProgressActivity(progress, { wordsLearned: 1 }),
      wordsMastered: progress.wordsMastered + 1,
    };
    setProgress(updated);
    saveStoredProgress(updated);
    syncToCloud({ progress: updated });
  };

  // Weakness updates from scenario completion or in-dialogue detection
  const handleWeaknessUpdated = (
    newWeaknessesInput: Array<string | Partial<WeaknessItem>>,
    improvedWeaknessesInput: Array<string | { id?: string; titleFa?: string }>
  ) => {
    let updated = [...weaknesses];

    const normalizeFa = (str: string) =>
      str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '').trim();

    improvedWeaknessesInput.forEach((item) => {
      const matchId = typeof item === 'object' && item.id ? item.id : null;
      const matchTitle = typeof item === 'string' ? item : item.titleFa || '';
      const cleanMatchTitle = normalizeFa(matchTitle);

      updated = updated.map((w) => {
        const idMatches = Boolean(matchId && w.id === matchId);
        const normW = normalizeFa(w.titleFa);
        const titleMatches =
          Boolean(cleanMatchTitle) &&
          (normW === cleanMatchTitle ||
            (cleanMatchTitle.length >= 8 && normW.includes(cleanMatchTitle)) ||
            (normW.length >= 8 && cleanMatchTitle.includes(normW)));

        if (idMatches || titleMatches) {
          const newStreak = w.successStreak + 1;
          return {
            ...w,
            successStreak: newStreak,
            status: newStreak >= 3 ? 'mastered' : 'in_remediation',
            lastObserved: new Date().toISOString().split('T')[0],
          };
        }
        return w;
      });
    });

    newWeaknessesInput.forEach((item) => {
      const title = (typeof item === 'string' ? item : item.titleFa || '').trim();
      if (!title) return;

      const itemObj = typeof item === 'object' ? item : {};
      const normTitle = normalizeFa(title);

      const matchIdx = updated.findIndex((w) => {
        if (itemObj.id && w.id === itemObj.id) return true;
        if (itemObj.checklistItemId && w.checklistItemId === itemObj.checklistItemId) return true;
        return normalizeFa(w.titleFa) === normTitle;
      });

      // Dynamic category inference if not explicitly provided
      const matchedC2 = matchWeaknessToC2ChecklistItem(title, itemObj.category, itemObj.descriptionFa);
      let inferredCategory: 'grammar' | 'phonetics' | 'idioms' | 'pragmatics' | 'discourse' | 'listening' =
        (itemObj.category as any) || matchedC2?.category || 'grammar';

      if (!itemObj.category && !matchedC2?.category) {
        const tLower = `${title} ${itemObj.descriptionFa || ''}`.toLowerCase();
        if (tLower.includes('تلفظ') || tLower.includes('صدا') || tLower.includes('آوا') || tLower.includes('flap') || tLower.includes('phonetic')) {
          inferredCategory = 'phonetics';
        } else if (tLower.includes('اصطلاح') || tLower.includes('کلیشه') || tLower.includes('کالوکیشن') || tLower.includes('idiom')) {
          inferredCategory = 'idioms';
        } else if (tLower.includes('لحن') || tLower.includes('تعارف') || tLower.includes('رسمی') || tLower.includes('pragmatic')) {
          inferredCategory = 'pragmatics';
        }
      }

      const assignedChecklistId = itemObj.checklistItemId || matchedC2?.id;

      if (matchIdx === -1) {
        updated.push({
          id: itemObj.id || `weak-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          category: inferredCategory,
          titleFa: title,
          descriptionFa: itemObj.descriptionFa || matchedC2?.descriptionFa || 'نیاز به تمرین و تثبیت در سناریوهای آینده',
          examples: itemObj.examples || (matchedC2 ? [matchedC2.exampleBad, matchedC2.exampleGood] : []),
          severity: itemObj.severity || 'medium',
          frequency: 1,
          firstObserved: new Date().toISOString().split('T')[0],
          lastObserved: new Date().toISOString().split('T')[0],
          status: 'active',
          successStreak: 0,
          checklistItemId: assignedChecklistId,
        });
      } else {
        // Increment frequency for recurring weakness and update description if provided
        updated[matchIdx] = {
          ...updated[matchIdx],
          frequency: updated[matchIdx].frequency + 1,
          lastObserved: new Date().toISOString().split('T')[0],
          status: updated[matchIdx].status === 'mastered' ? 'in_remediation' : updated[matchIdx].status,
          category: (itemObj.category as any) || updated[matchIdx].category || inferredCategory,
          descriptionFa: itemObj.descriptionFa || updated[matchIdx].descriptionFa,
          checklistItemId: updated[matchIdx].checklistItemId || assignedChecklistId,
        };
      }
    });

    setWeaknesses(updated);
    saveStoredWeaknesses(updated);
    syncToCloud({ weaknesses: updated });
  };

  // Launch scenario from Calendar in Progress screen to Speaking screen
  const handleLaunchScenarioFromCalendar = (selectedScenario: Scenario) => {
    setActiveScenario(selectedScenario);
    setActiveTab('speaking');
    playChimeSound('levelUp');
  };

  // Generate an adaptive scenario targeting active weaknesses from database
  const handleGenerateAdaptiveScenario = () => {
    const nextDayIndex = calendar.length + 1;
    const adaptiveCal = generateAdaptiveScenarioFromWeaknesses(weaknesses, nextDayIndex);
    const converted = convertCalendarToScenario(adaptiveCal);

    const updatedCal = [adaptiveCal, ...calendar];
    setCalendar(updatedCal);
    saveStoredCalendar(updatedCal);
    setActiveScenario(converted);
    syncToCloud({ calendar: updatedCal });
    playChimeSound('levelUp');
  };

  // Placement Assessment completed: Generates C2 roadmap directly addressing diagnosed weaknesses
  const handleAssessmentCompleted = (
    result: AssessmentResult,
    newCalendar: CalendarScenario[],
    newWeaknesses: WeaknessItem[]
  ) => {
    setAssessment(result);
    saveStoredAssessment(result);

    const cycleNum = Math.max(1, c2ChecklistState.currentCycle || 1);
    // Re-assessment may re-select previously practiced items that are still weak
    const targetedCohort = getC2CohortForWeaknesses(
      newWeaknesses || [],
      c2ChecklistState.masteredIds,
      10,
      isCycleReassessment
    );
    const targetedCohortIds = targetedCohort.map((i) => i.id);
    const remasteredIds: string[] = (targetedCohort as any).__remasteredIds || [];
    const masteredAfterRemaster = remasteredIds.length
      ? c2ChecklistState.masteredIds.filter((id) => !remasteredIds.includes(id))
      : c2ChecklistState.masteredIds;

    // Prefer Gemini calendar when present; otherwise build from checklist cohort
    const finalizedCalendar: CalendarScenario[] = newCalendar && newCalendar.length >= 10
      ? newCalendar.map((sc, idx) => ({
          ...sc,
          targetChecklistItemId: sc.targetChecklistItemId || targetedCohortIds[idx] || `c2-chk-${String(idx + 1).padStart(2, '0')}`,
          cycleNumber: cycleNum,
          status: (idx === 0 ? 'current' : 'upcoming') as CalendarScenario['status'],
        }))
      : (generateTenScenariosForUntickedCohort(targetedCohort, cycleNum) as any);

    setCalendar(finalizedCalendar);
    saveStoredCalendar(finalizedCalendar);
    setActiveScenario(convertCalendarToScenario(finalizedCalendar[0]));

    if (newWeaknesses && newWeaknesses.length > 0) {
      setWeaknesses(newWeaknesses);
      saveStoredWeaknesses(newWeaknesses);
    }

    const updatedProg = {
      ...progress,
      cefrLevel: result.cefrLevel,
    };
    setProgress(updatedProg);
    saveStoredProgress(updatedProg);

    const nextCycleState: UserC2ChecklistState = {
      ...c2ChecklistState,
      masteredIds: masteredAfterRemaster,
      currentCycleUntickedIds: targetedCohortIds,
      currentCycle: cycleNum,
      cycleScenariosCompleted: 0,
      lastAssessedAt: new Date().toISOString(),
    };
    setC2ChecklistState(nextCycleState);
    saveStoredC2ChecklistState(nextCycleState);

    syncToCloud({
      assessment: result,
      calendar: finalizedCalendar,
      weaknesses: newWeaknesses,
      progress: updatedProg,
      c2ChecklistState: nextCycleState,
    });

    setIsCycleReassessment(false);
    setIsAssessmentOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-fa selection:bg-indigo-500 selection:text-white">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="fixed top-2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          <span>حالت آفلاین — از حافظه محلی استفاده می‌شود</span>
        </div>
      )}

      {/* Main Container */}
      <div
        className={`w-full h-screen flex flex-col transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-md h-[92vh] max-h-[850px] rounded-[40px] border-[6px] border-slate-800 shadow-2xl overflow-hidden my-auto'
            : 'max-w-xl mx-auto'
        }`}
      >
        {/* Top Header & Banner (Collapsible via Bottom Navigation Toggle Arrow) */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${
            isHeaderCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-96 opacity-100'
          }`}
        >
          <header className="px-3 py-2 sm:px-5 sm:py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 gap-2">
          {/* Brand & CEFR Level Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-white tracking-tight truncate">NativeSpeak</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-en hidden md:inline">
                  AI Coach
                </span>
              </div>
            </div>

            {/* Level & Placement Test Badge (Quick Access) */}
            <button
              onClick={openAssessmentFlow}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-bold transition shrink-0 active:scale-95"
              title="مشاهده یا تکرار تعیین سطح هوشمند صوتی"
            >
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-en font-black text-[11px] sm:text-xs text-white">
                {assessment.completed
                  ? `Level ${assessment.cefrLevel}`
                  : progress.cefrLevel && progress.cefrLevel !== 'B1'
                  ? `Level ${progress.cefrLevel}`
                  : 'تعیین سطح 🎙️'}
              </span>
            </button>
          </div>

          {/* Right Header Controls — Clean, spacious, unified with Hamburger Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Persona Pill */}
            <button
              onClick={() => setIsPersonaModalOpen(true)}
              className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white transition active:scale-95"
              title={`مربی فعال: ${persona.name} (کلیک برای تغییر)`}
            >
              <span className="text-sm">{persona.avatar}</span>
              <span className="text-[11px] font-bold hidden md:inline">{persona.name}</span>
            </button>

            {/* Streak Indicator */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold"
              title="روزهای متوالی تمرین"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-en text-[11px]">{progress.streakDays}</span>
            </div>

            {/* PWA Button (sm+ screens) */}
            <div className="hidden md:block">
              <PWAInstallButton />
            </div>

            {/* Frame View Toggle (desktop only) */}
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className="hidden sm:inline-flex p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title={isMobileFrame ? 'نمای تمام‌صفحه' : 'نمای گوشی اندروید'}
            >
              {isMobileFrame ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
            </button>

            {/* HAMBURGER MENU BUTTON — ALWAYS VISIBLE ON ALL SCREENS */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-1.5 py-1 px-2.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-cyan-600/20 hover:from-indigo-600/40 hover:to-cyan-600/30 border border-indigo-500/40 text-white font-bold text-xs transition active:scale-95 shadow-sm"
              title="منوی اصلی و تنظیمات حساب"
              aria-label="منوی اصلی و تنظیمات حساب"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300 shrink-0" />
              <span className="text-[11px] font-fa text-slate-100 font-bold">منو</span>
            </button>
          </div>
        </header>

        {/* Responsive, Dismissible Notice Banner (Only 1 sleek banner max) */}
        {!isBannerDismissed && (!assessment.completed || !currentUser) && (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/30 px-3 py-1.5 flex items-center justify-between text-xs gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              {!assessment.completed ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="text-slate-200 text-[11px] truncate">
                    هنوز تعیین سطح صوتی نداده‌اید!
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="text-slate-200 text-[11px] truncate">
                    برای ذخیره دائمی ابری پیشرفت، وارد حساب شوید.
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!assessment.completed ? (
                <button
                  onClick={openAssessmentFlow}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-[11px] transition shadow-sm active:scale-95"
                >
                  شروع آزمون 🎙️
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition"
                >
                  ورود به حساب
                </button>
              )}
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                title="بستن پیام"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Tab Content Display Area */}
        <main className="flex-1 overflow-hidden relative">
          {/* 1. SPEAKING TAB */}
          {activeTab === 'speaking' && (
            <SpeakingScreen
              persona={persona}
              activeScenario={activeScenario}
              leitnerWords={leitnerWords}
              practiceItems={practiceItems}
              onAddWordToLeitner={handleAddWordToLeitner}
              onAddClicheToPractice={handleAddClicheToPractice}
              onAddWordToBoth={handleAddWordToBoth}
              onSessionMinuteLogged={handleSessionMinuteLogged}
              onScenarioCompleted={handleScenarioCompleted}
              onUpdateMetrics={handleUpdateMetrics}
              activeWeaknesses={weaknesses.filter((w) => w.status !== 'mastered').map((w) => w.titleFa)}
              onWeaknessUpdated={handleWeaknessUpdated}
              calendar={calendar}
              onSelectCalendarScenario={(cal) => setActiveScenario(convertCalendarToScenario(cal))}
              onGenerateAdaptiveScenario={handleGenerateAdaptiveScenario}
              weaknessesItems={weaknesses}
              cefrLevel={assessment.completed ? assessment.cefrLevel : progress.cefrLevel}
              isAssessmentCompleted={Boolean(assessment.completed)}
              onOpenAssessment={openAssessmentFlow}
              isHeaderCollapsed={isHeaderCollapsed}
            />
          )}

          {/* 2. LEITNER TAB */}
          {activeTab === 'leitner' && (
            <LeitnerScreen
              words={leitnerWords}
              onUpdateWords={handleUpdateLeitnerWords}
              onWordMastered={handleWordMastered}
            />
          )}

          {/* 3. PRACTICE TAB */}
          {activeTab === 'practice' && (
            <PracticeScreen
              practiceItems={practiceItems}
              onUpdatePracticeItems={handleUpdatePracticeItems}
              onSessionMinuteLogged={handleSessionMinuteLogged}
              onAddClicheToPractice={handleAddClicheToPractice}
              onAddWordToLeitner={handleAddWordToLeitner}
            />
          )}

          {/* 4. PROGRESS TAB */}
          {activeTab === 'progress' && (
            <ProgressScreen
              calendar={calendar}
              weaknesses={weaknesses}
              progress={progress}
              goals={goals}
              assessment={assessment}
              onUpdateGoals={handleUpdateGoals}
              onLaunchScenario={handleLaunchScenarioFromCalendar}
              onRetakeAssessment={openAssessmentFlow}
            />
          )}
        </main>

        {/* Bottom Android Navigation Bar — EXACTLY 4 PRIMARY MENUS */}
        <nav className="px-2 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-around shrink-0 select-none">
          {/* 1. Speaking */}
          <button
            onClick={() => {
              setActiveTab('speaking');
              playChimeSound('ding');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'speaking'
                ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className={`w-5 h-5 ${activeTab === 'speaking' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">اسپیکینگ</span>
          </button>

          {/* 2. Leitner */}
          <button
            onClick={() => {
              setActiveTab('leitner');
              playChimeSound('ding');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'leitner'
                ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className={`w-5 h-5 ${activeTab === 'leitner' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">لایتنر</span>
          </button>

          {/* 3. Practice */}
          <button
            onClick={() => {
              setActiveTab('practice');
              playChimeSound('ding');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'practice'
                ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${activeTab === 'practice' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">تمرین</span>
          </button>

          {/* 4. Progress */}
          <button
            onClick={() => {
              setActiveTab('progress');
              playChimeSound('ding');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition ${
              activeTab === 'progress'
                ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${activeTab === 'progress' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">پیشرفت</span>
          </button>

          {/* 5. Header Slide-Down / Slide-Up Toggle Arrow */}
          <button
            type="button"
            onClick={() => {
              setIsHeaderCollapsed(!isHeaderCollapsed);
              playChimeSound('ding');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition active:scale-95 ${
              !isHeaderCollapsed
                ? 'text-cyan-400 bg-cyan-500/10'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title={
              isHeaderCollapsed
                ? 'نمایش هدر و اطلاعات سناریو (کشویی رو به پایین)'
                : 'مخفی‌سازی هدر برای باز شدن کامل فضا (کشویی رو به بالا)'
            }
            aria-label="تغییر وضعیت هدر"
          >
            {isHeaderCollapsed ? (
              <ChevronDown className="w-5 h-5 text-cyan-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-slate-300" />
            )}
            <span className="text-[10px] font-bold">
              {isHeaderCollapsed ? 'هدر' : 'بستن'}
            </span>
          </button>
        </nav>
      </div>

      {/* Mobile Hamburger Slide-Over Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={async () => {
          await logOut();
          playChimeSound('ding');
        }}
        assessment={assessment}
        progress={progress}
        onOpenAssessment={openAssessmentFlow}
        persona={persona}
        onOpenPersona={() => setIsPersonaModalOpen(true)}
        onOpenApiKeys={() => setIsApiKeysOpen(true)}
        onOpenPWA={() => {
          const pwaBtn = document.querySelector('[data-pwa-button]') as HTMLButtonElement | null;
          pwaBtn?.click();
        }}
        isOnline={isOnline}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Login / Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        canDismiss={true}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          continueOnboardingAfterAuth(user, getStoredAssessment().completed);
        }}
      />

      {/* Persona Selection Modal */}
      <PersonaSelectorModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        currentPersona={persona}
        onSelectPersona={handleSelectPersona}
      />

      {/* API Keys Modal (Optional Custom Keys) */}
      <ApiKeysModal
        isOpen={isApiKeysOpen}
        canDismiss={true}
        onClose={() => setIsApiKeysOpen(false)}
        onSaved={handleApiKeysSaved}
      />

      {/* Placement Diagnostic Modal */}
      <InitialAssessmentModal
        isOpen={isAssessmentOpen && !isAuthModalOpen}
        isCycleReassessment={isCycleReassessment}
        onClose={() => {
          setIsAssessmentOpen(false);
        }}
        onAssessmentCompleted={handleAssessmentCompleted}
      />
    </div>
  );
}
