import {
  LeitnerWord,
  PracticeGoals,
  UserProgress,
  Scenario,
  AIPersona,
  PracticeItem,
  WeaknessItem,
  CalendarScenario,
  AssessmentResult,
  UserC2ChecklistState,
} from '../types';
import {
  INITIAL_LEITNER_WORDS,
  INITIAL_SCENARIOS,
  AI_PERSONAS,
  INITIAL_PRACTICE_ITEMS,
  INITIAL_WEAKNESSES,
  INITIAL_CALENDAR_SCENARIOS,
  INITIAL_ASSESSMENT,
} from '../data/initialData';

const STORAGE_KEYS = {
  LEITNER_WORDS: 'nativespeak_leitner_words_v2',
  PRACTICE_ITEMS: 'nativespeak_practice_items_v2',
  WEAKNESSES: 'nativespeak_weaknesses_v2',
  CALENDAR: 'nativespeak_calendar_v2',
  ASSESSMENT: 'nativespeak_assessment_v2',
  C2_CHECKLIST_STATE: 'nativespeak_c2_checklist_state_v1',
  PRACTICE_GOALS: 'nativespeak_goals_v2',
  USER_PROGRESS: 'nativespeak_progress_v2',
  CUSTOM_SCENARIOS: 'nativespeak_custom_scenarios_v2',
  ACTIVE_PERSONA: 'nativespeak_active_persona_v2',
};

export const DEFAULT_GOALS: PracticeGoals = {
  dailySpeakingMinutesTarget: 15,
  dailyWordsTarget: 5,
  dailyScenariosTarget: 2,
  reminderTime: '20:00',
  reminderEnabled: true,
  reminderDays: [0, 1, 2, 3, 4, 5, 6],
};

export const DEFAULT_PROGRESS: UserProgress = {
  streakDays: 0,
  lastActiveDate: '',
  totalMinutesSpoken: 0,
  todayMinutesSpoken: 0,
  todayWordsLearned: 0,
  todayScenariosCompleted: 0,
  cefrLevel: 'B1',
  fluencyHistory: [],
  weeklyMinutes: [
    { day: 'یکشنبه', minutes: 0 },
    { day: 'دوشنبه', minutes: 0 },
    { day: 'سه‌شنبه', minutes: 0 },
    { day: 'چهارشنبه', minutes: 0 },
    { day: 'پنج‌شنبه', minutes: 0 },
    { day: 'جمعه', minutes: 0 },
    { day: 'شنبه', minutes: 0 },
  ],
  phoneticsBreakdown: {
    flapT: 50,
    retroflexR: 50,
    wVsV: 50,
    glottalStop: 50,
    connectedSpeech: 50,
    wordStress: 50,
    intonation: 50,
  },
  totalWordsLearned: 0,
  wordsMastered: 0,
  averageGrammarScore: 0,
  averageFluencyScore: 0,
};

// Legacy pre-seeded demo items that should be removed if present
export const DEMO_LEITNER_IDS = new Set([
  'word-1',
  'word-2',
  'word-3',
  'word-4',
  'word-5',
  'demo-1',
  'demo-2',
  'demo-3',
  'demo-4',
  'demo-5',
  'default-item',
]);

export const DEMO_PRACTICE_IDS = new Set([
  'practice-1',
  'practice-2',
  'practice-3',
  'practice-4',
  'practice-5',
  'demo-1',
  'demo-2',
  'demo-3',
  'demo-4',
  'demo-5',
  'default-item',
]);

export const KNOWN_DEMO_PHRASES = new Set([
  'cut to the chase',
  'under the weather',
  'hit the nail on the head',
  'bite the bullet',
  'touch base',
  'play it by ear',
  'call it a day',
]);

export function isDemoLeitnerWord(w: any): boolean {
  if (!w || typeof w !== 'object') return true;
  if (!w.word || typeof w.word !== 'string' || !w.word.trim()) return true;
  if (w.id && DEMO_LEITNER_IDS.has(w.id)) return true;
  if (w.id && (w.id === 'default-item' || String(w.id).startsWith('demo-'))) return true;
  return false;
}

export function isDemoPracticeItem(p: any): boolean {
  if (!p || typeof p !== 'object') return true;
  if (!p.cliche || typeof p.cliche !== 'string' || !p.cliche.trim()) return true;
  if (p.id && DEMO_PRACTICE_IDS.has(p.id)) return true;
  if (p.id && (p.id === 'default-item' || String(p.id).startsWith('demo-'))) return true;
  return false;
}

const LEITNER_STORAGE_KEYS = [
  STORAGE_KEYS.LEITNER_WORDS,
  'nativespeak_leitner_words_v1',
  'nativespeak_leitner_words',
  'leitner_words',
  'nativespeak_words',
];

const PRACTICE_STORAGE_KEYS = [
  STORAGE_KEYS.PRACTICE_ITEMS,
  'nativespeak_practice_items_v1',
  'nativespeak_practice_items',
  'practice_items',
];

// Leitner Words: Multi-key recovery ensuring no previously saved word is ever lost
export function getStoredLeitnerWords(): LeitnerWord[] {
  if (typeof window === 'undefined') return [];
  try {
    const wordsMap = new Map<string, LeitnerWord>();

    for (const key of LEITNER_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item && item.word && !isDemoLeitnerWord(item)) {
                const termKey = String(item.word).toLowerCase().trim();
                if (!wordsMap.has(termKey)) {
                  wordsMap.set(termKey, item);
                }
              }
            });
          }
        } catch (e) {}
      }
    }

    const aggregated = Array.from(wordsMap.values());
    if (aggregated.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LEITNER_WORDS, JSON.stringify(aggregated));
    }
    return aggregated;
  } catch (e) {
    return [];
  }
}

export function saveStoredLeitnerWords(words: LeitnerWord[]) {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = words.filter((w) => !isDemoLeitnerWord(w));
    const serialized = JSON.stringify(cleaned);
    localStorage.setItem(STORAGE_KEYS.LEITNER_WORDS, serialized);
    // Mirror as fallback to legacy keys so no version upgrade loses data
    localStorage.setItem('nativespeak_leitner_words_v1', serialized);
    localStorage.setItem('nativespeak_leitner_words', serialized);
  } catch (e) {}
}

// Practice Items: Multi-key recovery ensuring no previously saved cliché is ever lost
export function getStoredPracticeItems(): PracticeItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const itemsMap = new Map<string, PracticeItem>();

    for (const key of PRACTICE_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item && item.cliche && !isDemoPracticeItem(item)) {
                const clicheKey = String(item.cliche).toLowerCase().trim();
                if (!itemsMap.has(clicheKey)) {
                  itemsMap.set(clicheKey, item);
                }
              }
            });
          }
        } catch (e) {}
      }
    }

    const aggregated = Array.from(itemsMap.values());
    if (aggregated.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PRACTICE_ITEMS, JSON.stringify(aggregated));
    }
    return aggregated;
  } catch (e) {
    return [];
  }
}

export function saveStoredPracticeItems(items: PracticeItem[]) {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = items.filter((p) => !isDemoPracticeItem(p));
    const serialized = JSON.stringify(cleaned);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_ITEMS, serialized);
    // Mirror as fallback to legacy keys so no version upgrade loses data
    localStorage.setItem('nativespeak_practice_items_v1', serialized);
    localStorage.setItem('nativespeak_practice_items', serialized);
  } catch (e) {}
}

// Weakness Database
export function getStoredWeaknesses(): WeaknessItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEAKNESSES);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveStoredWeaknesses(items: WeaknessItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.WEAKNESSES, JSON.stringify(items));
  } catch (e) {}
}

// Scenario Calendar (Strictly designed per user's level and placement test)
export function getStoredCalendar(): CalendarScenario[] {
  if (typeof window === 'undefined') return [];
  try {
    // If placement assessment has not been completed, no scenarios should exist
    const assessment = getStoredAssessment();
    if (!assessment || !assessment.completed) {
      try {
        localStorage.removeItem(STORAGE_KEYS.CALENDAR);
      } catch (e) {}
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEYS.CALENDAR);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any legacy hardcoded airport customs scenarios
    const cleaned = parsed.filter(
      (item: any) =>
        item &&
        item.id !== 'airport-customs' &&
        !item.titleFa?.includes('گیت بازرسی') &&
        !item.titleFa?.includes('کنترل گذرنامه') &&
        !item.title?.toLowerCase().includes('customs') &&
        !item.title?.toLowerCase().includes('airport')
    );
    return cleaned;
  } catch (e) {
    return [];
  }
}

export function saveStoredCalendar(calendar: CalendarScenario[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(calendar));
  } catch (e) {}
}

// Initial Assessment
export function getStoredAssessment(): AssessmentResult {
  if (typeof window === 'undefined') return INITIAL_ASSESSMENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENT);
    if (!raw) {
      return INITIAL_ASSESSMENT;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_ASSESSMENT;
  }
}

export function saveStoredAssessment(assessment: AssessmentResult) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ASSESSMENT, JSON.stringify(assessment));
  } catch (e) {}
}

// C2 Scientific Checklist State
export const DEFAULT_C2_CHECKLIST_STATE: UserC2ChecklistState = {
  masteredIds: [],
  currentCycleUntickedIds: [],
  currentCycle: 1,
  cycleScenariosCompleted: 0,
  totalCyclesCompleted: 0,
};

export function getStoredC2ChecklistState(): UserC2ChecklistState {
  if (typeof window === 'undefined') return DEFAULT_C2_CHECKLIST_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.C2_CHECKLIST_STATE);
    if (!raw) return DEFAULT_C2_CHECKLIST_STATE;
    return { ...DEFAULT_C2_CHECKLIST_STATE, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_C2_CHECKLIST_STATE;
  }
}

export function saveStoredC2ChecklistState(state: UserC2ChecklistState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.C2_CHECKLIST_STATE, JSON.stringify(state));
  } catch (e) {}
}

// Goals
export function getStoredGoals(): PracticeGoals {
  if (typeof window === 'undefined') return DEFAULT_GOALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRACTICE_GOALS);
    if (!raw) return DEFAULT_GOALS;
    return { ...DEFAULT_GOALS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_GOALS;
  }
}

export function saveStoredGoals(goals: PracticeGoals) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PRACTICE_GOALS, JSON.stringify(goals));
  } catch (e) {}
}

// Progress
export function getStoredProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    if (!raw) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_PROGRESS;
  }
}

export function saveStoredProgress(progress: UserProgress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
  } catch (e) {}
}

export function getStoredPersonas(): AIPersona[] {
  return AI_PERSONAS;
}

export function getStoredActivePersona(): AIPersona {
  if (typeof window === 'undefined') return AI_PERSONAS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_PERSONA);
    if (!raw) return AI_PERSONAS[0];
    const found = AI_PERSONAS.find((p) => p.id === raw);
    return found || AI_PERSONAS[0];
  } catch (e) {
    return AI_PERSONAS[0];
  }
}

export function saveStoredActivePersona(personaId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PERSONA, personaId);
  } catch (e) {}
}

export function getStoredScenarios(): Scenario[] {
  if (typeof window === 'undefined') return INITIAL_SCENARIOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCENARIOS);
    const custom = raw ? JSON.parse(raw) : [];
    return [...INITIAL_SCENARIOS, ...custom];
  } catch (e) {
    return INITIAL_SCENARIOS;
  }
}

export function saveCustomScenario(scenario: Scenario) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCENARIOS);
    const custom = raw ? JSON.parse(raw) : [];
    custom.push(scenario);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_SCENARIOS, JSON.stringify(custom));
  } catch (e) {}
}

// Active Scenario In-Progress Conversation Persistence (Requirement 4: Resuming Unfinished Lessons)
export interface StoredScenarioDraft {
  scenarioId: string;
  messages: any[];
  progressPercent: number;
  isGoalSatisfied: boolean;
  masteryEvidence?: {
    strongTurns: number;
    phoneticsStrongTurns?: number;
    clichesHitCorrectly: string[];
  };
  lastUpdated: string;
}

export function getStoredScenarioDraft(scenarioId: string): StoredScenarioDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`nativespeak_scenario_draft_${scenarioId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveStoredScenarioDraft(
  scenarioId: string,
  draft: {
    messages: any[];
    progressPercent: number;
    isGoalSatisfied: boolean;
    masteryEvidence?: {
      strongTurns: number;
      phoneticsStrongTurns?: number;
      clichesHitCorrectly: string[];
    };
  }
) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `nativespeak_scenario_draft_${scenarioId}`,
      JSON.stringify({
        scenarioId,
        messages: draft.messages,
        progressPercent: draft.progressPercent,
        isGoalSatisfied: draft.isGoalSatisfied,
        masteryEvidence: draft.masteryEvidence,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch (e) {}
}

export function clearStoredScenarioDraft(scenarioId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`nativespeak_scenario_draft_${scenarioId}`);
  } catch (e) {}
}

export function getAllStoredScenarioDrafts(): Record<string, StoredScenarioDraft> {
  if (typeof window === 'undefined') return {};
  const result: Record<string, StoredScenarioDraft> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nativespeak_scenario_draft_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.scenarioId) {
            result[parsed.scenarioId] = parsed;
          }
        }
      }
    }
  } catch (e) {}
  return result;
}

export function restoreAllStoredScenarioDrafts(drafts: Record<string, any>) {
  if (typeof window === 'undefined' || !drafts || typeof drafts !== 'object') return;
  try {
    Object.entries(drafts).forEach(([scenarioId, draft]) => {
      if (scenarioId && draft) {
        localStorage.setItem(
          `nativespeak_scenario_draft_${scenarioId}`,
          JSON.stringify(draft)
        );
        if (Array.isArray(draft.messages)) {
          localStorage.setItem(`nativespeak_chat_${scenarioId}`, JSON.stringify(draft.messages));
        }
      }
    });
  } catch (e) {}
}

/**
 * Generates an authentic, grammatically correct contextual example sentence for a cliché
 * avoiding broken templates for non-verb phrases.
 */
export function generateSmartExampleSentence(cliche: string, meaningFa?: string): string {
  const clean = cliche.replace(/\(.*?\)/g, '').trim();
  const lower = clean.toLowerCase();

  if (lower.includes('under the weather')) {
    return "I've been feeling a bit under the weather lately, so I decided to take it easy today.";
  }
  if (lower.includes('hit the nail')) {
    return "You really hit the nail on the head with that analysis of the problem.";
  }
  if (lower.includes('piece of cake')) {
    return "Don't stress about the interview; with your preparation, it'll be a piece of cake.";
  }
  if (lower.includes('break the ice')) {
    return "Telling a lighthearted story is always a great way to break the ice in a new meeting.";
  }
  if (lower.includes('call it a day')) {
    return "We've covered everything on the agenda, so let's call it a day.";
  }
  if (lower.includes('touch base')) {
    return "Let's touch base first thing tomorrow morning to ensure we're aligned.";
  }
  if (lower.includes('on the same page')) {
    return "I just wanted to do a quick sync to make sure we're all on the same page.";
  }
  if (lower.includes('cut corners')) {
    return "When it comes to quality and safety, our team never cuts corners.";
  }
  if (lower.includes('bite the bullet')) {
    return "It was a tough conversation, but I had to bite the bullet and address the issue.";
  }
  if (lower.includes('play it by ear')) {
    return "Since the weather is unpredictable, let's just play it by ear for the afternoon.";
  }
  if (lower.includes('spill the beans')) {
    return "We were trying to keep the surprise party a secret, but Alex spilled the beans.";
  }
  if (lower.includes('back to square one')) {
    return "The initial proposal was rejected, so we're basically back to square one.";
  }
  if (lower.includes('hit the ground running')) {
    return "With our onboarding complete, we're ready to hit the ground running on Monday.";
  }

  // Grammatically flexible natural contextual framing
  return `Native speakers often say, "${clean}", in situations like this.`;
}

export function getStoredActiveScenarioId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nativespeak_active_scenario_id_v2');
}

export function saveStoredActiveScenarioId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('nativespeak_active_scenario_id_v2', id);
  } catch (e) {}
}

