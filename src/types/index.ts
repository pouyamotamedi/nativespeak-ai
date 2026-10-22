export type LeitnerBoxNumber = 1 | 2 | 3 | 4 | 5;

export interface LeitnerWord {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  persianMeaning: string;
  persianNuance?: string;
  americanUsageNote?: string;
  collocations: string[];
  sampleSentences: Array<{ english: string; persian: string }>;
  pronunciationTipFa?: string;
  box: LeitnerBoxNumber;
  lastReviewedAt?: string;
  nextReviewDue: string; // ISO date string
  timesReviewed: number;
  correctCount: number;
}

export interface PracticeItem {
  id: string;
  cliche: string;
  persianMeaning: string;
  context: string;
  exampleSentence: string;
  addedAt: string;
  timesPracticed: number;
  masteryScore: number; // 0-100
  lastPracticedAt?: string;
  category?: 'work' | 'casual' | 'daily' | 'social';
}

export interface ResponseGuidance {
  approachFa: string; // رویکرد و منطق پاسخ: چطور به حرف طرف مقابل واکنش نشان دهید
  suggestedPattern: string; // ساختار پیشنهادی جمله
  keyCollocations: string[]; // واژگان و کالوکیشن‌های کلیدی همنشین
  culturalTipFa: string; // نکته لحن و اتیکت گفتاری آمریکایی
}

export interface AmericanConceptModel {
  expression: string; // جمله‌ای که یک آمریکایی اصیل برای انتقال همین مفهوم می‌گوید
  expressionFa: string; // ترجمه فارسی
  clicheUsed: string; // کلیشه یا اصطلاح به کار رفته
  clicheMeaningFa?: string; // ترجمه و معنی فارسی کلیشه پیشنهادی
  whyItIsNativeFa: string; // چرا این بیان طبیعی‌تر و نیتیو است
}

export interface PracticeEvaluationResult {
  usedTargetCliche: boolean;
  accuracyScore: number;
  verdictFa: string;
  analysis?: SpeakingAnalysis;
  americanConceptModel?: AmericanConceptModel;
  idealSampleResponse?: string;
  idealSampleResponseFa?: string;
  corrections?: string | null;
  nativeEnhancement?: string;
  nativeEnhancementFa?: string;
}

export interface WeaknessItem {
  id: string;
  category:
    | 'grammar'
    | 'pronunciation'
    | 'register_tone'
    | 'vocabulary'
    | 'fluency'
    | 'phonetics'
    | 'idioms'
    | 'pragmatics'
    | 'discourse'
    | 'listening';
  titleFa: string;
  descriptionFa: string;
  examples: string[];
  severity: 'high' | 'medium' | 'low';
  frequency: number;
  firstObserved: string;
  lastObserved: string;
  status: 'active' | 'in_remediation' | 'mastered';
  successStreak: number; // consecutive correct independent usages needed for mastery
  checklistItemId?: string; // Mapped item ID from C2_SCIENTIFIC_CHECKLIST
}

export interface CalendarScenario {
  id: string;
  dayIndex: number;
  title: string;
  titleFa: string;
  category: 'daily' | 'work' | 'travel' | 'social' | 'emergency' | 'personal';
  context: string;
  relationship: string; // 'Formal/Official' | 'Close Friend' | 'Romantic Partner' | 'Work Colleague' | 'Stranger'
  userRole: string;
  aiRole: string;
  icon: string;
  starter: string;
  starterFa: string;
  targetGrammar: string;
  targetGrammarFa?: string;
  targetCliches: string[];
  targetVocabulary?: string[];
  targetPronunciation: string;
  activeWeaknessesInjected: string[];
  status: 'completed' | 'current' | 'upcoming';
  userScore?: number;
  completedAt?: string;
  targetLevel?: string;
  phaseTitleFa?: string;
  targetChecklistItemId?: string;
  cycleNumber?: number;
}

export interface UserC2ChecklistState {
  masteredIds: string[]; // IDs of checklist items from C2_SCIENTIFIC_CHECKLIST that are marked mastered
  currentCycleUntickedIds: string[]; // Exactly 10 unticked items targeted in the current cycle
  currentCycle: number; // 1, 2, 3, etc.
  cycleScenariosCompleted: number; // 0 to 10
  totalCyclesCompleted: number;
  lastAssessedAt?: string;
}

export interface TaskVoiceAssessment {
  taskIndex: number;
  transcription: string;
  scores: {
    grammar: number;
    pronunciation: number;
    fluency: number;
    accent: number;
  };
  wpm: number;
  acousticFeedback: {
    flapT: string;
    rhoticR: string;
    vowelReduction: string;
    rhythm: string;
    summaryFa: string;
  };
  persianTransferFound?: string | null;
  nativeAlternative: string;
  nativeAlternativeFa: string;
  strengthsFa: string[];
  corrections?: Array<{
    original: string;
    corrected: string;
    explanationFa: string;
  }>;
}

export interface AssessmentResult {
  completed: boolean;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  levelDescriptionFa: string;
  grammarScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  vocabularyScore: number;
  accentScore?: number;
  wpm?: number;
  acousticFeedback?: {
    flapT?: string;
    rhoticR?: string;
    vowelReduction?: string;
    rhythm?: string;
    summaryFa?: string;
  };
  identifiedWeaknesses: string[];
  totalRoadmapScenarios?: number;
  targetMasteryLevel?: string;
  assessedAt: string;
}

export interface AIPersona {
  id: string;
  name: string;
  titleFa: string;
  avatar: string;
  accent: 'American (California)' | 'American (New York)' | 'British (London)' | 'Australian (Sydney)' | 'American (Texas)';
  accentCode: 'en-US' | 'en-GB' | 'en-AU';
  tone: string;
  taglineFa: string;
  badge: string;
  speechRate: number;
  speechPitch: number;
  descriptionFa: string;
}

export interface Scenario {
  id: string;
  title: string;
  titleFa: string;
  category: 'daily' | 'work' | 'travel' | 'social' | 'emergency' | 'custom' | 'personal';
  userRole: string;
  aiRole: string;
  icon: string;
  starter: string;
  starterFa: string;
  descriptionFa: string;
  clicheTag: string;
  relationship: string;
  recommendedRegister: 'casual' | 'formal' | 'diplomatic';
  activeWeaknessesInjected?: string[];
  targetGrammar?: string;
  targetGrammarFa?: string;
  targetCliches?: string[];
  targetPronunciation?: string;
  targetLevel?: string;
  targetChecklistItemId?: string;
  cycleNumber?: number;
}

export type TabType = 'speaking' | 'leitner' | 'practice' | 'progress';

export interface AcousticPronunciationFeedback {
  wordOrSound: string;
  phoneticTarget: string;
  whatWasHeardFa: string;
  tipFa: string;
  acousticFeature: 'Flap T' | 'Retroflex R' | 'W vs V' | 'Glottal Stop' | 'Vowel Length' | 'Word Stress' | 'Intonation' | 'Connected Speech';
  confidence: number; // 0-100
}

export interface PedagogicalIssue {
  category: 'pragmatics' | 'grammar' | 'word_choice' | 'mechanics' | 'completeness';
  categoryFa: string;
  titleFa: string;
  originalSnippet?: string;
  correctedSnippet?: string;
  explanationFa: string;
  whyItMattersFa?: string;
  howToFixFa?: string;
}

export interface VoiceAcousticAnalysis {
  strengthsFa: string[];
  phonemeIssues?: Array<{
    soundOrWord: string;
    targetPhonetic: string;
    whatWasHeardFa: string;
    whyItMattersFa: string;
    howToFixFa: string;
  }>;
  wordStressIssues?: Array<{
    word: string;
    targetStress: string; // e.g. "CHAL-leng-ing, seg-men-TA-tion, PRO-jects"
    whyItMattersFa: string;
    howToFixFa: string;
  }>;
  consonantClusterIssues?: Array<{
    clusterOrWords: string;
    whyItMattersFa: string;
    howToFixFa: string;
  }>;
  sentenceRhythm?: {
    highlightedPattern: string; // e.g. "One of the most CHALLENGING PROJECTS I've LED recently..."
    whyItMattersFa: string;
    howToFixFa: string;
  };
  thoughtGroups?: {
    suggestedChunking: string; // e.g. "One of the most challenging projects I've led recently / involved customer segmentation / for an online retailer."
    whyItMattersFa: string;
    howToFixFa: string;
  };
  intonation?: {
    observationFa: string;
    whyItMattersFa: string;
    howToFixFa: string;
  };
  drillSequenceFa: string[];
}

export interface SentencePattern {
  pattern: string; // e.g. "X is gradually fading.", "X is still more [adjective] than Y."
  meaningFa: string; // Persian translation and usage
  slotExplanation?: string; // Guidance on what fits into X, Y, or slots
}

export interface SpeakingAnalysis {
  overallScore: number;
  grammarScore: number;
  nativeScore: number;
  /** Context & Pragmatics (register, politeness, situation fit) */
  contextScore?: number;
  /** Communication & Completeness */
  communicationScore?: number;
  pronunciationScore?: number;
  /** Fluency & Delivery */
  fluencyScore?: number;
  userSpokenTranscript?: string;
  strengths?: string[];
  categorizedIssues?: PedagogicalIssue[];
  voiceAnalysis?: VoiceAcousticAnalysis;
  persianTransferPitfall?: string | null;
  grammarCorrections?: Array<{
    original: string;
    corrected: string;
    explanationFa: string;
  }>;
  socialTone?: {
    register: 'casual' | 'formal' | 'slang' | 'blunt_impolite' | 'polite_diplomatic';
    registerFa: string;
    politenessLevel: number; // 1-5
    formalityLevel: number; // 1-5
    appropriatenessVerdictFa: string;
    culturalEtiquetteTipFa: string;
  };
  nativeAlternative: string; // "اگر یک آمریکایی نیتیو بود می‌گفت"
  nativeAlternativeFa: string;
  nativeAlternativesList?: Array<{
    type: 'exact_meaning' | 'high_impact' | 'casual';
    labelFa: string;
    english: string;
    persian: string;
  }>;
  nativeCliche?: string; // the specific key cliché/idiomatic chunk
  nativeClicheMeaningFa?: string;
  /** Reusable native formulaic patterns/templates (Sentence Patterns) */
  sentencePatterns?: SentencePattern[];
  pronunciationIssues?: AcousticPronunciationFeedback[];
  accentTips?: Array<{
    word: string;
    phonetic: string;
    tipFa: string;
    soundRule: string;
  }>;
  usedTargetWords?: string[];
  repetitionChallengePromptFa?: string; // "حالا سعی کن با همین کلیشه نیتیو دوباره بگی یا ادامه بده"
  inCharacterChallenge?: {
    probingQuestionEn: string;
    probingQuestionFa: string;
    coachingGoalFa: string;
  };
  newWeaknessIdentified?: { category: string; titleFa: string; descriptionFa: string; severity?: string; example?: string } | null;
  weaknessImprovementNoted?: string | null;
  lessonProgress?: {
    progressPercent: number; // 0-100
    isGoalSatisfied: boolean;
    unmetGoalsFa?: string[];
    coachingFeedbackFa?: string;
  };
  /** Target clichés correctly produced in this utterance (quantitative mastery) */
  usedTargetClichesCorrectly?: string[];
  turnQuality?: 'strong' | 'ok' | 'weak';
  isEstimatedOfflineAnalysis?: boolean;
  analysisEngineSource?: 'gemini_multimodal_audio' | 'gemini_text_only' | 'local_linguistic_estimate';
}

export interface SpeakingMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  persianTranslation?: string;
  audioUrl?: string; // recorded user audio or model audio
  analysis?: SpeakingAnalysis;
  isRepetitionTurn?: boolean;
}

export interface ScenarioSummary {
  scenarioId: string;
  scenarioTitle: string;
  overallScore: number;
  strengths: string[];
  keyErrors: Array<{ original: string; corrected: string; explanationFa: string }>;
  clichesLearned: Array<{ english: string; persian: string }>;
  pronunciationNotes: string[];
  newWeaknessesAdded: string[];
  weaknessesImproved: string[];
  futureRemediationPlanFa?: string;
  lessonGoalsAchieved?: boolean;
}

export interface PracticeGoals {
  dailySpeakingMinutesTarget: number;
  dailyWordsTarget: number;
  dailyScenariosTarget: number;
  reminderTime: string; // "20:00"
  reminderEnabled: boolean;
  reminderDays: number[]; // 0-6 (0 is Sunday)
}

export interface UserProgress {
  streakDays: number;
  lastActiveDate: string;
  totalMinutesSpoken: number;
  todayMinutesSpoken: number;
  todayWordsLearned: number;
  todayScenariosCompleted: number;
  fluencyHistory: Array<{ date: string; score: number }>;
  weeklyMinutes: Array<{ day: string; minutes: number }>;
  phoneticsBreakdown: {
    flapT: number; // %
    retroflexR: number; // %
    wVsV: number; // %
    glottalStop: number; // %
    connectedSpeech: number; // %
    wordStress: number; // %
    intonation: number; // %
  };
  totalWordsLearned: number;
  wordsMastered: number;
  averageGrammarScore: number;
  averageFluencyScore: number;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface ToneLabResult {
  analyzedText: string;
  registerType: string;
  registerTitleFa: string;
  badgeColor: 'emerald' | 'blue' | 'purple' | 'amber' | 'red';
  formalityScore: number;
  politenessScore: number;
  socialSafetyStatus: 'safe' | 'caution' | 'unsafe_in_public' | 'offensive';
  socialSafetyVerdictFa: string;
  culturalContextFa: string;
  whenToUseFa: string;
  whenToAvoidFa: string;
  registerVariations: Array<{
    registerName: string;
    english: string;
    persian: string;
    bestFor: string;
  }>;
}
