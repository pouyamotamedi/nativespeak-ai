import { SpeakingAnalysis, UserProgress } from '../types';

/** Minimum pronunciation score for a turn to count as "strong" when audio was evaluated */
export const PHONETICS_MIN_SCORE_WITH_AUDIO = 78;
/** Absolute floor — even text-only turns cannot claim native accent without this */
export const PHONETICS_MIN_SCORE_SOFT = 70;
/** Cap overallScore when pronunciation collapses (prevents grammar-only mastery) */
export const PHONETICS_OVERALL_CAP_IF_WEAK = 74;

export type PhoneticsFeatureKey = keyof UserProgress['phoneticsBreakdown'];

const FEATURE_KEYWORDS: Array<{ key: PhoneticsFeatureKey; patterns: RegExp[] }> = [
  { key: 'flapT', patterns: [/flap\s*t/i, /flap-t/i, /t̬/, /\[ɾ\]/, /intervocalic/i, /water|city|better|bottle/i] },
  { key: 'retroflexR', patterns: [/rhotic/i, /retroflex/i, /\br\b/i, /american\s*r/i, /کار|morning|first/i] },
  { key: 'wVsV', patterns: [/w\s*vs\s*v/i, /\bw\b.*\bv\b/i, /went|very|wine|vine/i] },
  { key: 'glottalStop', patterns: [/glottal/i, /چاکنایی/, /button|mountain|latin/i] },
  { key: 'connectedSpeech', patterns: [/connected\s*speech/i, /linking/i, /catenation/i, /coalescent/i, /assimilation/i] },
  { key: 'wordStress', patterns: [/word\s*stress/i, /syllable/i, /stress/i, /تکیه/] },
  { key: 'intonation', patterns: [/intonation/i, /uptalk/i, /falling/i, /آهنگ/i, /prosody/i] },
];

export function inferTargetPhoneticsFeatures(
  targetPronunciation?: string,
  targetGrammar?: string
): PhoneticsFeatureKey[] {
  const blob = `${targetPronunciation || ''} ${targetGrammar || ''}`;
  const hits = FEATURE_KEYWORDS.filter((f) => f.patterns.some((p) => p.test(blob))).map((f) => f.key);
  return hits.length > 0 ? hits : ['flapT', 'retroflexR', 'wordStress'];
}

export function countPhonemeIssues(analysis?: SpeakingAnalysis | null): number {
  if (!analysis) return 0;
  const phonemes = analysis.voiceAnalysis?.phonemeIssues?.length || 0;
  const stress = analysis.voiceAnalysis?.wordStressIssues?.length || 0;
  const legacy = analysis.pronunciationIssues?.length || 0;
  return phonemes + stress + legacy;
}

/**
 * Apply hard phonetics discipline to an analysis object (server or client).
 * - Lowers inflated pronunciation scores when audio evidence is weak/missing issues
 * - Caps overallScore if pronunciation is weak
 */
export function enforcePhoneticsStrictness(
  analysis: SpeakingAnalysis,
  opts: {
    hadAudio: boolean;
    targetPronunciation?: string;
    targetGrammar?: string;
  }
): SpeakingAnalysis {
  const next = { ...analysis };
  let pronunciation = typeof next.pronunciationScore === 'number' ? next.pronunciationScore : opts.hadAudio ? 72 : 80;
  const issueCount = countPhonemeIssues(next);

  // Without audio, pronunciation claims are softer and capped
  if (!opts.hadAudio) {
    pronunciation = Math.min(pronunciation, 82);
  } else {
    // With audio: require concrete phoneme notes when score is high
    if (pronunciation >= 88 && issueCount === 0) {
      // Suspicious perfection — pull down; Persian L1 almost always has residual cues
      pronunciation = Math.min(pronunciation, 84);
    }
    if (issueCount >= 2) {
      pronunciation = Math.min(pronunciation, 76);
    } else if (issueCount === 1) {
      pronunciation = Math.min(pronunciation, 82);
    }
    // Never inflate below evidence floor when issues exist
    if (issueCount > 0 && pronunciation > 90) pronunciation = 82;
  }

  // Lesson targeting specific phonetics: be harsher if those issues appear
  const targets = inferTargetPhoneticsFeatures(opts.targetPronunciation, opts.targetGrammar);
  const issueBlob = JSON.stringify(next.voiceAnalysis || next.pronunciationIssues || {}).toLowerCase();
  const hitTargetIssue = targets.some((t) => {
    if (t === 'flapT') return /flap|t̬|ɾ|water|city/.test(issueBlob);
    if (t === 'retroflexR') return /rhotic|retroflex|american r|ر لرزشی/.test(issueBlob);
    if (t === 'glottalStop') return /glottal|چاکنایی|button/.test(issueBlob);
    if (t === 'connectedSpeech') return /linking|connected|coalescent/.test(issueBlob);
    if (t === 'wordStress') return /stress|تکیه|syll/.test(issueBlob);
    if (t === 'intonation') return /intonation|uptalk|آهنگ/.test(issueBlob);
    if (t === 'wVsV') return /w vs|\/w\/|\/v\//.test(issueBlob);
    return false;
  });
  if (hitTargetIssue) {
    pronunciation = Math.min(pronunciation, 72);
  }

  next.pronunciationScore = Math.round(Math.max(40, Math.min(100, pronunciation)));

  if (next.pronunciationScore < PHONETICS_MIN_SCORE_WITH_AUDIO) {
    next.overallScore = Math.min(
      next.overallScore || 0,
      PHONETICS_OVERALL_CAP_IF_WEAK
    );
  }

  // Ensure drill sequence exists when issues found
  if (issueCount > 0 && next.voiceAnalysis) {
    const drills = next.voiceAnalysis.drillSequenceFa || [];
    if (drills.length < 2) {
      next.voiceAnalysis = {
        ...next.voiceAnalysis,
        drillSequenceFa: [
          'کلمه هدف را آهسته با الگوی صحیح ۳ بار تکرار کن',
          'همان کلمه را داخل یک جمله کوتاه بگو',
          'جمله کامل را با سرعت مکالمه طبیعی تکرار کن',
          ...(drills || []),
        ].slice(0, 4),
      };
    }
  }

  return next;
}

export function phoneticsHintsFromAnalysis(
  analysis?: SpeakingAnalysis | null
): Partial<UserProgress['phoneticsBreakdown']> | undefined {
  if (!analysis) return undefined;
  const score = analysis.pronunciationScore;
  if (typeof score !== 'number') return undefined;

  const blob = JSON.stringify(analysis.voiceAnalysis || analysis.pronunciationIssues || '').toLowerCase();
  const hints: Partial<UserProgress['phoneticsBreakdown']> = {};
  const base = Math.round(score);

  FEATURE_KEYWORDS.forEach(({ key, patterns }) => {
    const mentioned = patterns.some((p) => p.test(blob));
    if (mentioned) {
      // Issue mentioned → slightly below overall pronunciation score
      hints[key] = Math.max(40, base - 8);
    }
  });

  // Always nudge general dimensions toward latest pronunciation reading
  if (Object.keys(hints).length === 0) {
    hints.flapT = base;
    hints.retroflexR = base;
    hints.wordStress = base;
    hints.intonation = base;
  }

  return hints;
}

export function passesPhoneticsGate(opts: {
  pronunciationScore?: number;
  hadAudio: boolean;
  isPhoneticsLesson: boolean;
}): boolean {
  const score = opts.pronunciationScore;
  if (typeof score !== 'number') {
    // No score: fail hard for phonetics lessons or audio turns
    return !(opts.hadAudio || opts.isPhoneticsLesson);
  }
  if (opts.isPhoneticsLesson || opts.hadAudio) {
    return score >= PHONETICS_MIN_SCORE_WITH_AUDIO;
  }
  return score >= PHONETICS_MIN_SCORE_SOFT;
}
