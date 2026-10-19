/** Quantitative lesson mastery — not solely model opinion */

import {
  passesPhoneticsGate,
  PHONETICS_MIN_SCORE_WITH_AUDIO,
} from './phoneticsStrictness';

export const MASTERY_MIN_STRONG_TURNS = 3;
export const MASTERY_MIN_TURN_SCORE = 72;
export const MASTERY_MIN_PROGRESS_PERCENT = 80;
/** Strong turns that also cleared the phonetics gate (when audio / phonetics lesson) */
export const MASTERY_MIN_PHONETICS_STRONG_TURNS = 2;

export interface MasteryEvidence {
  /** User turns that met score + (cliché or no-target) gates */
  strongTurns: number;
  /** Subset of strong turns that also passed pronunciation threshold */
  phoneticsStrongTurns: number;
  /** Target clichés successfully used in a strong turn (normalized lowercase) */
  clichesHitCorrectly: string[];
}

export interface MasteryEvaluationInput {
  evidence: MasteryEvidence;
  targetCliches: string[];
  /** Optional soft signal from the coach model */
  aiProgressPercent?: number;
  aiSaysSatisfied?: boolean;
  latestOverallScore?: number;
  latestUserText?: string;
  /** Require phonetics strong turns (audio practice or phonetics-focused lesson) */
  requirePhoneticsGate?: boolean;
}

export function normalizeCliche(raw: string): string {
  return (raw || '')
    .replace(/\(.*?\)/g, '')
    .replace(/[“”"']/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function textContainsCliche(text: string, cliche: string): boolean {
  const t = (text || '').toLowerCase();
  const c = normalizeCliche(cliche);
  if (!c || c.length < 2) return false;
  return t.includes(c);
}

export function findHitTargetCliches(userText: string, targetCliches: string[]): string[] {
  return targetCliches
    .map(normalizeCliche)
    .filter((c) => c.length >= 2 && textContainsCliche(userText, c));
}

export function isStrongTurn(opts: {
  overallScore: number;
  userText: string;
  targetCliches: string[];
  usedTargetClichesFromAi?: string[];
}): boolean {
  if (opts.overallScore < MASTERY_MIN_TURN_SCORE) return false;
  if (!opts.targetCliches.length) return true;
  const fromText = findHitTargetCliches(opts.userText, opts.targetCliches);
  const fromAi = (opts.usedTargetClichesFromAi || []).map(normalizeCliche).filter(Boolean);
  return fromText.length > 0 || fromAi.length > 0;
}

export function mergeMasteryEvidence(
  prev: MasteryEvidence,
  turn: {
    overallScore: number;
    userText: string;
    targetCliches: string[];
    usedTargetClichesFromAi?: string[];
    pronunciationScore?: number;
    hadAudio?: boolean;
    isPhoneticsLesson?: boolean;
  }
): MasteryEvidence {
  if (!isStrongTurn(turn)) return prev;
  const hits = new Set(prev.clichesHitCorrectly.map(normalizeCliche));
  findHitTargetCliches(turn.userText, turn.targetCliches).forEach((h) => hits.add(h));
  (turn.usedTargetClichesFromAi || []).map(normalizeCliche).forEach((h) => {
    if (h) hits.add(h);
  });
  const phoneticsOk = passesPhoneticsGate({
    pronunciationScore: turn.pronunciationScore,
    hadAudio: Boolean(turn.hadAudio),
    isPhoneticsLesson: Boolean(turn.isPhoneticsLesson),
  });
  return {
    strongTurns: prev.strongTurns + 1,
    phoneticsStrongTurns: prev.phoneticsStrongTurns + (phoneticsOk ? 1 : 0),
    clichesHitCorrectly: Array.from(hits),
  };
}

export function evaluateQuantitativeMastery(input: MasteryEvaluationInput): {
  progressPercent: number;
  isGoalSatisfied: boolean;
  unmetGoalsFa: string[];
  strongTurnsNeeded: number;
  clichesNeeded: number;
  clichesHit: number;
} {
  const targets = input.targetCliches.map(normalizeCliche).filter((c) => c.length >= 2);
  const hits = new Set(input.evidence.clichesHitCorrectly.map(normalizeCliche));
  const clichesHit = targets.length === 0 ? 1 : targets.filter((t) => hits.has(t)).length;
  const clichesNeeded = targets.length === 0 ? 1 : targets.length;
  const requirePhonetics = Boolean(input.requirePhoneticsGate);
  const phoneticsNeeded = requirePhonetics ? MASTERY_MIN_PHONETICS_STRONG_TURNS : 0;
  const phoneticsHit = input.evidence.phoneticsStrongTurns || 0;

  const turnRatio = Math.min(1, input.evidence.strongTurns / MASTERY_MIN_STRONG_TURNS);
  const clicheRatio = targets.length === 0 ? turnRatio : clichesHit / clichesNeeded;
  const phoneticsRatio = requirePhonetics
    ? Math.min(1, phoneticsHit / Math.max(1, phoneticsNeeded))
    : 1;
  const quantitative = Math.round(
    Math.min(100, turnRatio * 45 + clicheRatio * 35 + phoneticsRatio * 20)
  );

  const aiSoft =
    typeof input.aiProgressPercent === 'number'
      ? Math.min(100, Math.max(0, input.aiProgressPercent))
      : quantitative;
  // Quantitative dominates; AI can nudge display but cannot alone unlock
  const progressPercent = Math.round(quantitative * 0.7 + aiSoft * 0.3);

  const unmetGoalsFa: string[] = [];
  if (input.evidence.strongTurns < MASTERY_MIN_STRONG_TURNS) {
    unmetGoalsFa.push(
      `حداقل ${MASTERY_MIN_STRONG_TURNS} نوبت پاسخ قوی (نمره ≥${MASTERY_MIN_TURN_SCORE}) با استفاده از کلیشه هدف لازم است — الان: ${input.evidence.strongTurns}`
    );
  }
  if (targets.length > 0 && clichesHit < clichesNeeded) {
    const missing = targets.filter((t) => !hits.has(t));
    unmetGoalsFa.push(
      `کلیشه‌های هدف هنوز کامل پوشش داده نشده‌اند: ${missing.slice(0, 3).join(' · ')}`
    );
  }
  if (requirePhonetics && phoneticsHit < phoneticsNeeded) {
    unmetGoalsFa.push(
      `حداقل ${phoneticsNeeded} نوبت با تلفظ قابل‌قبول امریکن (نمره تلفظ ≥${PHONETICS_MIN_SCORE_WITH_AUDIO}) لازم است — الان: ${phoneticsHit}`
    );
  }
  if (progressPercent < MASTERY_MIN_PROGRESS_PERCENT) {
    unmetGoalsFa.push(`تسلط کمّی هنوز زیر ${MASTERY_MIN_PROGRESS_PERCENT}٪ است`);
  }

  const isGoalSatisfied =
    input.evidence.strongTurns >= MASTERY_MIN_STRONG_TURNS &&
    clichesHit >= clichesNeeded &&
    phoneticsHit >= phoneticsNeeded &&
    progressPercent >= MASTERY_MIN_PROGRESS_PERCENT;

  return {
    progressPercent,
    isGoalSatisfied,
    unmetGoalsFa,
    strongTurnsNeeded: MASTERY_MIN_STRONG_TURNS,
    clichesNeeded,
    clichesHit,
  };
}

export const EMPTY_MASTERY_EVIDENCE: MasteryEvidence = {
  strongTurns: 0,
  phoneticsStrongTurns: 0,
  clichesHitCorrectly: [],
};
