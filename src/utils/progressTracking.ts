import { UserProgress } from '../types';

const PERSIAN_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

/** Local calendar day key YYYY-MM-DD */
export function localDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDayKey(key: string): Date | null {
  if (!key) return null;
  // Accept ISO timestamps or YYYY-MM-DD
  const dayOnly = key.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayOnly)) {
    const t = Date.parse(key);
    if (Number.isNaN(t)) return null;
    return new Date(t);
  }
  const [y, m, d] = dayOnly.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

function ensureWeeklyMinutes(progress: UserProgress): UserProgress['weeklyMinutes'] {
  if (progress.weeklyMinutes?.length === 7) return [...progress.weeklyMinutes];
  return PERSIAN_WEEKDAYS.map((day) => ({ day, minutes: 0 }));
}

function ensureFluencyHistory(progress: UserProgress): UserProgress['fluencyHistory'] {
  return Array.isArray(progress.fluencyHistory) ? [...progress.fluencyHistory] : [];
}

/**
 * Reconcile streak / today counters when the calendar day changes.
 * Call on app load and before every progress mutation.
 */
export function reconcileProgressCalendar(progress: UserProgress, now = new Date()): UserProgress {
  const today = localDayKey(now);
  const lastKey = progress.lastActiveDate ? localDayKey(parseDayKey(progress.lastActiveDate) || now) : '';
  if (lastKey === today) {
    return {
      ...progress,
      weeklyMinutes: ensureWeeklyMinutes(progress),
      fluencyHistory: ensureFluencyHistory(progress),
    };
  }

  const lastDate = parseDayKey(progress.lastActiveDate);
  let streakDays = progress.streakDays || 0;

  if (!lastDate || !progress.lastActiveDate) {
    streakDays = 0;
  } else {
    const gap = daysBetween(lastDate, now);
    if (gap === 1) {
      // streak continues when they practice today (increment happens on activity)
      // keep current streak until activity today
    } else if (gap > 1) {
      streakDays = 0;
    }
  }

  return {
    ...progress,
    streakDays,
    // Keep prior lastActiveDate (may be empty for brand-new users) until real activity
    lastActiveDate: progress.lastActiveDate || '',
    todayMinutesSpoken: lastKey ? 0 : progress.todayMinutesSpoken || 0,
    todayWordsLearned: lastKey ? 0 : progress.todayWordsLearned || 0,
    todayScenariosCompleted: lastKey ? 0 : progress.todayScenariosCompleted || 0,
    weeklyMinutes: ensureWeeklyMinutes(progress),
    fluencyHistory: ensureFluencyHistory(progress),
  };
}

export interface ActivityPatch {
  minutesSpoken?: number;
  grammarScore?: number;
  fluencyScore?: number;
  scenarioCompleted?: boolean;
  wordsLearned?: number;
  phoneticsHints?: Partial<UserProgress['phoneticsBreakdown']>;
}

/**
 * Apply real practice activity: streak, weekly minutes, fluency history, averages.
 */
export function applyProgressActivity(
  progress: UserProgress,
  patch: ActivityPatch,
  now = new Date()
): UserProgress {
  let next = reconcileProgressCalendar(progress, now);
  const today = localDayKey(now);
  const lastKey = next.lastActiveDate ? localDayKey(parseDayKey(next.lastActiveDate) || now) : '';
  const isFirstActivityToday = lastKey !== today;

  if (isFirstActivityToday) {
    const lastDate = parseDayKey(next.lastActiveDate);
    const gap = lastDate ? daysBetween(lastDate, now) : 999;
    if (gap === 1) {
      next = { ...next, streakDays: (next.streakDays || 0) + 1 };
    } else if (gap === 0) {
      // same day already handled
    } else {
      next = { ...next, streakDays: 1 };
    }
    next = {
      ...next,
      lastActiveDate: today,
      todayMinutesSpoken: 0,
      todayWordsLearned: 0,
      todayScenariosCompleted: 0,
    };
  } else {
    next = { ...next, lastActiveDate: today };
    if ((next.streakDays || 0) < 1) {
      next = { ...next, streakDays: 1 };
    }
  }

  const minutes = Math.max(0, patch.minutesSpoken || 0);
  if (minutes > 0) {
    const weekly = ensureWeeklyMinutes(next);
    const weekdayIndex = now.getDay(); // 0 Sun ... 6 Sat — matches PERSIAN_WEEKDAYS order above
    weekly[weekdayIndex] = {
      ...weekly[weekdayIndex],
      day: PERSIAN_WEEKDAYS[weekdayIndex],
      minutes: (weekly[weekdayIndex]?.minutes || 0) + minutes,
    };
    next = {
      ...next,
      todayMinutesSpoken: next.todayMinutesSpoken + minutes,
      totalMinutesSpoken: next.totalMinutesSpoken + minutes,
      weeklyMinutes: weekly,
    };
  }

  if (typeof patch.fluencyScore === 'number' && !Number.isNaN(patch.fluencyScore)) {
    const score = Math.round(Math.min(100, Math.max(0, patch.fluencyScore)));
    let history = ensureFluencyHistory(next);
    const todayLabel = 'امروز';
    const existingIdx = history.findIndex((h) => h.date === todayLabel || h.date === today);
    if (existingIdx >= 0) {
      const prev = history[existingIdx].score;
      history[existingIdx] = {
        date: todayLabel,
        score: Math.round(prev * 0.4 + score * 0.6),
      };
    } else {
      history = [...history, { date: todayLabel, score }].slice(-14);
    }
    // Relabel older entries lightly for chart readability
    if (history.length > 1) {
      history = history.map((h, i) => {
        if (i === history.length - 1) return { ...h, date: todayLabel };
        const age = history.length - 1 - i;
        return { ...h, date: age === 1 ? 'دیروز' : `${age} روز قبل` };
      });
    }
    next = {
      ...next,
      fluencyHistory: history,
      averageFluencyScore:
        next.averageFluencyScore > 0
          ? Math.round(next.averageFluencyScore * 0.7 + score * 0.3)
          : score,
    };
  }

  if (typeof patch.grammarScore === 'number' && !Number.isNaN(patch.grammarScore)) {
    const score = Math.round(Math.min(100, Math.max(0, patch.grammarScore)));
    next = {
      ...next,
      averageGrammarScore:
        next.averageGrammarScore > 0
          ? Math.round(next.averageGrammarScore * 0.7 + score * 0.3)
          : score,
    };
  }

  if (patch.scenarioCompleted) {
    next = {
      ...next,
      todayScenariosCompleted: next.todayScenariosCompleted + 1,
    };
  }

  if (patch.wordsLearned && patch.wordsLearned > 0) {
    next = {
      ...next,
      todayWordsLearned: next.todayWordsLearned + patch.wordsLearned,
      totalWordsLearned: next.totalWordsLearned + patch.wordsLearned,
    };
  }

  if (patch.phoneticsHints) {
    const ph = { ...next.phoneticsBreakdown };
    (Object.keys(patch.phoneticsHints) as Array<keyof typeof ph>).forEach((k) => {
      const v = patch.phoneticsHints![k];
      if (typeof v === 'number') {
        ph[k] = Math.round(ph[k] * 0.85 + Math.min(100, Math.max(0, v)) * 0.15);
      }
    });
    next = { ...next, phoneticsBreakdown: ph };
  }

  return next;
}

export function freshDefaultProgress(): UserProgress {
  return {
    streakDays: 0,
    lastActiveDate: '',
    totalMinutesSpoken: 0,
    todayMinutesSpoken: 0,
    todayWordsLearned: 0,
    todayScenariosCompleted: 0,
    cefrLevel: 'B1',
    fluencyHistory: [],
    weeklyMinutes: PERSIAN_WEEKDAYS.map((day) => ({ day, minutes: 0 })),
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
}
