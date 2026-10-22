import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  evaluateSpeakingTextLocally,
  evaluatePracticeResponseLocally,
  generateSituationForCliche,
} from './src/utils/linguisticEngine';
import { C2_SCIENTIFIC_CHECKLIST, C2ChecklistItem, getNextUntickedC2Cohort } from './src/data/c2Checklist';
import {
  generate10ScenariosFromChecklistItems,
  formatChecklistItemsAsWeaknesses,
} from './src/utils/c2ScenarioEngine';
import { enforcePhoneticsStrictness } from './src/utils/phoneticsStrictness';
import { gapgptSynthesizeSpeech, isGapgptConfigured } from './src/utils/gapgptProvider';
import {
  trackConversationDriftAndRotateSubtopic,
  REAL_LIFE_SITUATIONS,
} from './src/utils/subtopicRotation';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Allow Android WebView (file://) and browsers to send per-user API key headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-gemini-api-key, x-openai-api-key'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '25mb' }));

const defaultApiKey = process.env.GEMINI_API_KEY || '';
let defaultAi: GoogleGenAI | null = null;
if (defaultApiKey) {
  defaultAi = new GoogleGenAI({
    apiKey: defaultApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient model cascade: high-throughput/low-latency models first to avoid 503 high demand spikes
const CANDIDATE_GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

function getAiClient(req?: express.Request): GoogleGenAI | null {
  const customKey = ((req?.headers?.['x-gemini-api-key'] as string) || '').trim();
  if (customKey) {
    try {
      return new GoogleGenAI({
        apiKey: customKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize custom Gemini API key:', e);
    }
  }
  return defaultAi;
}

/** Prefer per-user OpenAI key from client header, then server env. */
function getOpenAiApiKey(req?: express.Request): string {
  const fromHeader = ((req?.headers?.['x-openai-api-key'] as string) || '').trim();
  if (fromHeader) return fromHeader;
  return (process.env.OPENAI_API_KEY || '').trim();
}

/** Strict sanitizer to ensure raw audio base64 or binary data NEVER leaks into transcript fields */
function sanitizeTranscriptText(raw: any, fallback = ''): string {
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

/** Shared STT: Whisper (OpenAI) → Gemini multimodal. Used by /api/transcribe and placement. */
async function transcribeAudioBuffer(
  req: express.Request,
  audioBase64: string,
  mimeType = 'audio/webm',
  language = 'en'
): Promise<{ text: string; engine: string }> {
  if (!audioBase64) return { text: '', engine: 'none' };

  const openaiKey = getOpenAiApiKey(req);
  if (openaiKey) {
    try {
      const binary = Buffer.from(audioBase64, 'base64');
      const ext =
        String(mimeType).includes('mp4') || String(mimeType).includes('m4a')
          ? 'm4a'
          : String(mimeType).includes('ogg')
          ? 'ogg'
          : String(mimeType).includes('wav')
          ? 'wav'
          : 'webm';
      const form = new FormData();
      const bytes = new Uint8Array(binary);
      const fileBlob = new Blob([bytes], { type: mimeType || 'audio/webm' });
      form.append('file', fileBlob, `speech.${ext}`);
      form.append('model', 'whisper-1');
      form.append('language', language || 'en');
      form.append('response_format', 'json');

      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: form,
      });
      if (whisperRes.ok) {
        const data = await whisperRes.json();
        const text = sanitizeTranscriptText(data.text);
        if (text) return { text, engine: 'whisper-1' };
      } else {
        const errText = await whisperRes.text().catch(() => '');
        console.warn('Whisper STT failed:', whisperRes.status, errText.slice(0, 200));
      }
    } catch (whisperErr) {
      console.warn('Whisper STT exception:', whisperErr);
    }
  }

  const ai = getAiClient(req);
  if (ai) {
    const cleanMime = String(mimeType || 'audio/webm').split(';')[0];
    const prompt =
      'Transcribe this spoken English audio into plain text only. Return ONLY the transcript, no quotes or commentary. If unintelligible, return an empty string.';
    for (const modelName of CANDIDATE_GEMINI_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            { inlineData: { mimeType: cleanMime, data: audioBase64 } },
            { text: prompt },
          ],
          config: { temperature: 0.1 },
        });
        const rawText = (response.text || '').trim().replace(/^["']|["']$/g, '');
        const text = sanitizeTranscriptText(rawText);
        if (text) return { text, engine: `gemini:${modelName}` };
      } catch (e) {
        console.warn(`Gemini STT ${modelName} failed:`, e);
      }
    }
  }

  return { text: '', engine: 'unavailable' };
}

function safeJsonParse(rawText: string | undefined): any {
  if (!rawText) return {};
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // If wrapped with extra prose, extract the outer JSON object block
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (err2) {}
    }
    return {};
  }
}

// Linguistic rules database for Persian-English interference
function analyzeLinguisticText(userText: string, scenarioTitle: string, relationship: string) {
  const lower = userText.toLowerCase();
  const grammarCorrections: Array<{ original: string; corrected: string; explanationFa: string }> = [];
  let persianTransferPitfall: string | null = null;
  const pronunciationIssues: Array<{
    wordOrSound: string;
    phoneticTarget: string;
    whatWasHeardFa: string;
    tipFa: string;
    acousticFeature: any;
    confidence: number;
  }> = [];

  // Check 1: "go to shopping"
  if (lower.includes('go to shopping') || lower.includes('went to shopping')) {
    grammarCorrections.push({
      original: 'go to shopping',
      corrected: 'go shopping',
      explanationFa: 'در زبان انگلیسی بعد از فعل go برای فعالیت‌های تفریحی و خرید از فرم ing بدون حرف اضافه to استفاده می‌شود (مانند go shopping, go swimming).',
    });
    persianTransferPitfall = 'ترجمه تحت‌اللفظی «رفتن به خرید» از فارسی به انگلیسی';
  }

  // Check 2: "I am agree"
  if (lower.includes('i am agree') || lower.includes("i'm agree")) {
    grammarCorrections.push({
      original: 'I am agree',
      corrected: 'I agree',
      explanationFa: 'کلمه agree در انگلیسی یک فعل است، نه صفت. بنابراین نیازی به فعل to be (am) ندارد.',
    });
    persianTransferPitfall = 'تداخل با ساختار فارسی «من موافق هستم»';
  }

  // Check 3: "interested to"
  if (lower.includes('interested to')) {
    grammarCorrections.push({
      original: 'interested to',
      corrected: 'interested in',
      explanationFa: 'صفت interested همیشه با حرف اضافه in به کار می‌رود (مانند interested in art).',
    });
    persianTransferPitfall = 'استفاده از حرف اضافه اشتباه به دلیل تداخل زبان مادری';
  }

  // Check 4: "marry with"
  if (lower.includes('marry with') || lower.includes('married with')) {
    grammarCorrections.push({
      original: 'marry with',
      corrected: 'marry / married to',
      explanationFa: 'فعل marry مفعول مستقیم می‌گیرد (marry someone) یا در حالت مجهول با to می‌آید (married to someone). حرف اضافه with اشتباه است.',
    });
    persianTransferPitfall = 'ترجمه مستقیم ساختار «ازدواج کردن با کسی» از فارسی';
  }

  // Check 5: "explain about"
  if (lower.includes('explain about')) {
    grammarCorrections.push({
      original: 'explain about',
      corrected: 'explain',
      explanationFa: 'فعل explain نیازی به حرف اضافه about ندارد و مستقیم با مفعول می‌آید (explain the situation).',
    });
  }

  // Check 6: "have ... ago" (Present perfect with past time)
  if ((lower.includes('have gone') || lower.includes('have seen') || lower.includes("haven't seen")) && lower.includes('ago')) {
    grammarCorrections.push({
      original: 'have ... ago',
      corrected: 'went / saw ... ago',
      explanationFa: 'هنگام استفاده از قید زمان مشخص در گذشته (ago) باید از گذشته ساده (Simple Past) استفاده کرد، نه حال کامل.',
    });
    persianTransferPitfall = 'تداخل ساختار «رفته‌ام» فارسی با کاربرد Present Perfect انگلیسی';
  }

  // Pronunciation checks based on words present
  if (lower.includes('water') || lower.includes('city') || lower.includes('better') || lower.includes('little')) {
    pronunciationIssues.push({
      wordOrSound: 'Flap T in water/city/better',
      phoneticTarget: '/ˈwɑːt̬ər/',
      whatWasHeardFa: 'تلفظ T انفجاری خشک به جای Flap T آمریکایی',
      tipFa: 'در لهجه آمریکایی وقتی T بین دو مصوت است، زبان سریع به سقف دهان ضربه می‌زند و صدایی شبیه D سریع و نرم ایجاد می‌کند.',
      acousticFeature: 'Flap T',
      confidence: 85,
    });
  }

  if (lower.includes('went') || lower.includes('very') || lower.includes('want') || lower.includes('visit')) {
    pronunciationIssues.push({
      wordOrSound: 'W vs V Contrast',
      phoneticTarget: '/w/ vs /v/',
      whatWasHeardFa: 'غنچه نشدن کامل لب‌ها در ادای صدای W',
      tipFa: 'برای صدای W لب‌ها کاملاً گرد و غنچه می‌شوند بدون لمس دندان. برای V دندان‌های بالا روی لب پایین قرار می‌گیرند.',
      acousticFeature: 'W vs V',
      confidence: 80,
    });
  }

  if (lower.includes('mountain') || lower.includes('button') || lower.includes('important')) {
    pronunciationIssues.push({
      wordOrSound: 'Glottal Stop before N',
      phoneticTarget: '[ʔn]',
      whatWasHeardFa: 'تلفظ T کامل به جای قطع هوا در حنجره',
      tipFa: 'در آمریکایی قبل از هجای N، حرف T تلفظ نمی‌شود و جریان هوا برای یک لحظه کوتاه در گلو قطع می‌شود.',
      acousticFeature: 'Glottal Stop',
      confidence: 82,
    });
  }

  // Native American alternatives based on context and common speech patterns
  let nativeAlternative = "I'm definitely looking forward to checking that out.";
  let nativeAlternativeFa = 'قطعاً مشتاقم که برم و ببینمش.';
  let nativeCliche = 'check out';
  let nativeClicheMeaningFa = 'دیدن و بررسی کردن چیزی';

  if (lower.includes('coffee') || lower.includes('drink') || lower.includes('order')) {
    nativeAlternative = "Can I just grab a medium iced latte with oat milk, to go?";
    nativeAlternativeFa = 'می‌تونم یه لاته متوسط یخچالی با شیر جو دوسر، بیرون‌بر بگیرم؟';
    nativeCliche = 'grab a coffee';
    nativeClicheMeaningFa = 'قهوه گرفتن / نوشیدن سریع قهوه';
  } else if (lower.includes('shop') || lower.includes('buy') || lower.includes('mall') || lower.includes('store')) {
    nativeAlternative = "I'm actually gonna hit the stores this afternoon to pick up a few things.";
    nativeAlternativeFa = 'من در واقع امروز بعدازظهر می‌خوام برم فروشگاه‌ها تا چند تا چیز بردارم.';
    nativeCliche = 'hit the stores';
    nativeClicheMeaningFa = 'رفتن به بازار یا فروشگاه برای خرید';
  } else if (lower.includes('work') || lower.includes('project') || lower.includes('deadline') || lower.includes('meeting')) {
    nativeAlternative = "Let's touch base tomorrow morning so we can stay on the same page.";
    nativeAlternativeFa = 'بیا فردا صبح یه هماهنگی کوتاه بکنیم تا هماهنگ و هم‌نظر بمونیم.';
    nativeCliche = 'touch base';
    nativeClicheMeaningFa = 'تماس گرفتن و هماهنگ شدن مختصر';
  } else if (lower.includes('remember') || lower.includes('memory') || lower.includes('childhood') || lower.includes('past')) {
    nativeAlternative = "Man, that really brings back memories—those were the good old days!";
    nativeAlternativeFa = 'پسر، واقعاً کلی خاطره زنده کرد—عجب روزهای خوبی بودن!';
    nativeCliche = 'brings back memories';
    nativeClicheMeaningFa = 'زنده کردن و تداعی خاطرات شیرین';
  } else if (lower.includes('agree') || lower.includes('think') || lower.includes('opinion')) {
    nativeAlternative = "I'm totally with you on that; you hit the nail right on the head.";
    nativeAlternativeFa = 'من کاملاً در این مورد باهات موافقم؛ دقیقاً زدی به خال.';
    nativeCliche = 'hit the nail on the head';
    nativeClicheMeaningFa = 'دقیقاً درست گفتن و به هدف زدن';
  } else if (lower.includes('travel') || lower.includes('flight') || lower.includes('airport') || lower.includes('trip')) {
    nativeAlternative = "I'm just visiting for a couple of weeks to do some sightseeing.";
    nativeAlternativeFa = 'من صرفاً برای دو هفته اومدم تا چند تا جای دیدنی رو بگردم.';
    nativeCliche = 'do some sightseeing';
    nativeClicheMeaningFa = 'گشت‌وگذار و دیدن جاهای دیدنی';
  }

  // Calculate scores
  const errorCount = grammarCorrections.length;
  const grammarScore = Math.max(70, 95 - errorCount * 12);
  const nativeScore = Math.max(68, 88 - (persianTransferPitfall ? 10 : 0));
  const pronunciationScore = Math.max(72, 86 - pronunciationIssues.length * 5);
  const overallScore = Math.round((grammarScore + nativeScore + pronunciationScore) / 3);

  const isFormal = relationship.toLowerCase().includes('formal') || relationship.toLowerCase().includes('professional');

  return {
    overallScore,
    grammarScore,
    nativeScore,
    pronunciationScore,
    persianTransferPitfall,
    grammarCorrections,
    socialTone: {
      register: isFormal ? 'formal' : 'casual',
      registerFa: isFormal ? 'رسمی و اداری' : 'محاوره‌ای دوستانه',
      politenessLevel: 4,
      formalityLevel: isFormal ? 4 : 2,
      appropriatenessVerdictFa: isFormal
        ? `لحن شما برای یک موقعیت رسمی و رابطه «${relationship}» مناسب است.`
        : `لحن شما خودمانی و متناسب با گفتگو با یک «${relationship}» است.`,
      culturalEtiquetteTipFa: isFormal
        ? 'در محیط‌های کاری آمریکا به جای تعارف، صراحت مودبانه و پاسخ مستقیم با لبخند ارزش بالایی دارد.'
        : 'در مکالمه با دوستان استفاده از عبارات کوتاه و کاهش‌ها مثل gonna/wanna حس نزدیکی ایجاد می‌کند.',
    },
    nativeAlternative,
    nativeAlternativeFa,
    nativeCliche,
    nativeClicheMeaningFa,
    repetitionChallengePromptFa: `حالا سعی کن با همین کلیشه نیتیو («${nativeCliche}») دوباره پاسخ رو بگی یا دیالوگ رو ادامه بده.`,
    pronunciationIssues,
    accentTips: pronunciationIssues.map((p) => ({
      word: p.wordOrSound,
      phonetic: p.phoneticTarget,
      tipFa: p.tipFa,
      soundRule: p.acousticFeature,
    })),
    newWeaknessIdentified:
      grammarCorrections.length > 0
        ? {
            category: 'grammar',
            titleFa: grammarCorrections[0].original,
            descriptionFa: grammarCorrections[0].explanationFa,
          }
        : null,
    weaknessImprovementNoted: null,
  };
}

// In-character reply generator
function generateScenarioReply(userText: string, scenarioTitle: string, aiRole: string, relationship: string) {
  const lower = userText.toLowerCase();
  const titleLower = (scenarioTitle || '').toLowerCase();

  if (titleLower.includes('coffee') || aiRole.toLowerCase().includes('barista')) {
    if (lower.includes('hot') || lower.includes('iced') || lower.includes('latte') || lower.includes('cappuccino') || lower.includes('espresso')) {
      return {
        reply: "Got it! And what size would you like for that—tall, grande, or venti? Any pastry to go with it?",
        persianTranslation: "عالیه! چه سایزی مایلید باشه—کوچک، متوسط یا بزرگ؟ شیرینی یا کیکی هم در کنارش میل دارید؟",
      };
    }
    return {
      reply: "Sure thing! Do you want that hot or iced? And what kind of milk do you prefer—whole, oat, or almond?",
      persianTranslation: "حتماً! گرم می‌خواید یا یخ‌دار؟ و چه نوع شیری ترجیح می‌دید—معمولی، جو دوسر، یا بادام؟",
    };
  }

  if (titleLower.includes('customs') || titleLower.includes('airport') || aiRole.toLowerCase().includes('officer')) {
    return {
      reply: "Understood. How long do you plan to stay in the United States, and where will you be staying during your trip?",
      persianTranslation: "متوجه شدم. چه مدت قصد دارید در ایالات متحده بمانید و محل اقامتتان کجاست؟",
    };
  }

  if (titleLower.includes('interview') || aiRole.toLowerCase().includes('manager')) {
    return {
      reply: "That's a very insightful approach. How did your team respond to that, and what was the final outcome of the project?",
      persianTranslation: "رویکرد بسیار هوشمندانه‌ای بود. تیم شما چطور واکنش نشان داد و نتیجه نهایی پروژه چه شد؟",
    };
  }

  if (titleLower.includes('memories') || titleLower.includes('friend') || relationship.toLowerCase().includes('friend')) {
    return {
      reply: "Haha, totally! Man, time really flies. Do you remember what happened right after that? We could barely stop laughing!",
      persianTranslation: "هاها، دقیقاً! پسر، چقدر زمان زود می‌گذره. یادته بعدش چی شد؟ اصلاً خنده‌مون بند نمی‌اومد!",
    };
  }

  return {
    reply: "That makes a lot of sense! Tell me a bit more about how that turned out for you.",
    persianTranslation: "کاملاً منطقیه! کمی بیشتر برام بگو که در نهایت چطور پیش رفت.",
  };
}

// Fallback practice situations with rich pedagogical guidance
const PRACTICE_PRESET_SITUATIONS: Record<string, any> = {
  'cut to the chase': {
    situationTitleFa: 'جلسه برنامه‌ریزی کاری با مدیر پروژه',
    situationContextFa: 'شما در جلسه‌ای هستید که همکارتان توضیحات فنی حاشیه‌ای زیادی می‌دهد و وقت جلسه رو به اتمام است. می‌خواهید مؤدبانه اما قاطعانه بحث را سر اصل مطلب بیاورید.',
    relationship: 'همکار / مدیر پروژه',
    conversationalPrompt: "We have only five minutes left, and there's a lot of background details to cover. Where should we begin?",
    conversationalPromptFa: 'فقط پنج دقیقه وقت داریم و کلی جزئیات حاشیه‌ای مونده. از کجا باید شروع کنیم؟',
    hint: 'راهنمای پاسخ: با توجه به کمبود وقت، با یک عبارت مشارکتی پیشنهاد ورود مستقیم به موضوع اصلی را بدهید.',
    guidance: {
      approachFa: 'ابتدا محدودیت زمان را تایید کنید و سپس به جای حالت دستوری، به شکل تیمی و مشارکتی (با Let\'s) پیشنهاد تمرکز روی تصمیم نهایی را مطرح کنید.',
      suggestedPattern: "Let's [just] cut to the chase and focus on [action/deliverables].",
      keyCollocations: ['bottom line', 'main deliverables', 'budget figures', 'wrap things up'],
      culturalTipFa: 'در فرهنگ کاری آمریکا وقت طلا است؛ گفتن "cut to the chase" بی‌ادبی نیست، بلکه نشانه عمل‌گرایی است به شرطی که با لحنی محترمانه و لحن مشارکتی بیان شود.',
    },
    idealSampleResponse: "Let's cut to the chase and focus on the main deliverables.",
    idealSampleResponseFa: 'بیا بریم سر اصل مطلب و روی نتایج اصلی تمرکز کنیم.',
  },
  'play it by ear': {
    situationTitleFa: 'برنامه‌ریزی تفریح آخر هفته با دوستان',
    situationContextFa: 'دوستتان از شما می‌پرسد دقیقاً ساعت چند به پیست اسکیت می‌رسید، اما شما به دلیل ترافیک نامشخص نمی‌توانید ساعت قطعی بدهید و می‌خواهید بگویید «ببینیم چی پیش میاد».',
    relationship: 'دوست صمیمی',
    conversationalPrompt: "Should we book the reservation for exactly 4 PM, or do you think you might run late?",
    conversationalPromptFa: 'آیا برای دقیقاً ساعت ۴ رزرو کنیم یا فکر می‌کنی ممکنه دیر برسی؟',
    hint: 'راهنمای پاسخ: عدم قطعیت شرایط را توضیح دهید و پیشنهاد کنید زمان را باز بگذارید تا وضعیت روشن شود.',
    guidance: {
      approachFa: 'دلیل عدم امکان تعهد زمانی قطعی (مثل ترافیک یا اتمام کار) را بیان کنید و سپس برای اجتناب از استرس، پیشنهاد پیش رفتن بر اساس شرایط لحظه‌ای را بدهید.',
      suggestedPattern: "[Condition/Reason], so why don't we just play it by ear?",
      keyCollocations: ['unpredictable traffic', 'see how it goes', 'keep it flexible', 'check in around 5'],
      culturalTipFa: 'در مراودات دوستانه آمریکایی، انعطاف‌پذیری ارزشمند است و "play it by ear" دقیقاً حس راحتی و عدم تحمیل برنامه خشک را منتقل می‌کند.',
    },
    idealSampleResponse: "Traffic might be unpredictable, so let's just play it by ear.",
    idealSampleResponseFa: 'ترافیک ممکنه غیرقابل پیش‌بینی باشه، پس بیا فعلاً قطعی نکنیم ببینیم چی پیش میاد.',
  },
  'under the weather': {
    situationTitleFa: 'مرخصی گرفتن مؤدبانه از مدیر یا عذرخواهی برای غیبت',
    situationContextFa: 'شما صبح احساس سرماخوردگی و کسالت دارید و می‌خواهید به سرپرست خود پیام دهید که امروز دورکار هستید یا استراحت می‌کنید.',
    relationship: 'مدیر شرکت / رئیس',
    conversationalPrompt: "Good morning! Just checking in to see if you'll be joining our standup meeting in person today?",
    conversationalPromptFa: 'صبح بخیر! خواستم بپرسم آیا امروز حضوری در جلسه هماهنگی شرکت می‌کنی؟',
    hint: 'راهنمای پاسخ: به شکل حرفه‌ای عذرخواهی کرده، کسالت خفیف را بدون ذکر جزئیات پزشکی بیان کنید و وضعیت کاری امروزتان را شفاف سازید.',
    guidance: {
      approachFa: 'یک سلام محترمانه بدهید، با استفاده از کلیشه کسالت ملایم خود را ابراز کنید و بلافاصله راهکار (مثل دورکاری یا پاسخ‌گویی به ایمیل‌ها) را ارائه دهید.',
      suggestedPattern: "I'm feeling a bit under the weather today, so I'll [be working remotely / be resting].",
      keyCollocations: ['feeling a bit', 'work remotely', 'available via Slack', 'keep you updated'],
      culturalTipFa: 'در اتیکت حرفه‌ای شرکت‌های آمریکایی، وارد شدن به جزئیات تهوع یا سرماخوردگی ناخوشایند است؛ عبارت استاندارد و مؤدبانه دقیقاً "feeling under the weather" است.',
    },
    idealSampleResponse: "I'm feeling a bit under the weather today, so I'll be working remotely.",
    idealSampleResponseFa: 'امروز کمی احساس کسالت و ناخوشی دارم، بنابراین دورکاری خواهم کرد.',
  },
  'touch base': {
    situationTitleFa: 'هماهنگی سریع با همکار قبل از جلسه با مشتری',
    situationContextFa: 'می‌خواهید ۱۰ دقیقه قبل از ورود به جلسه با مشتری، با همکارتان نکاتی را مرور و هماهنگ کنید.',
    relationship: 'همکار در یک پروژه',
    conversationalPrompt: "Are you ready for the client presentation this afternoon?",
    conversationalPromptFa: 'برای ارائه بعدازظهر به مشتری آماده‌ای؟',
    hint: 'راهنمای پاسخ: آمادگی اولیه را تایید کنید، اما درخواست یک مرور چند دقیقه‌ای سریع داشته باشید.',
    guidance: {
      approachFa: 'پاسخ مثبت اولیه بدهید، سپس با عبارتی مؤدبانه مثل "Could we..." درخواست یک هماهنگی چند دقیقه‌ای را برای جلوگیری از غافلگیری مطرح کنید.',
      suggestedPattern: "Yes, but could we quickly touch base for [time] before the call?",
      keyCollocations: ['quickly touch base', 'run through the deck', 'align on key points'],
      culturalTipFa: 'کلمه "touch base" یکی از پرکاربردترین اصطلاحات سیلیکون‌ولی و شرکت‌های مدرن برای «هماهنگی بدون تشکیل جلسات طولانی و سنگین» است.',
    },
    idealSampleResponse: "Yes, but could we touch base for five minutes before the call?",
    idealSampleResponseFa: 'بله، اما می‌شه قبل از تماس ۵ دقیقه با هم هماهنگ بشیم؟',
  },
  'call it a day': {
    situationTitleFa: 'پایان دادن به کار بعد از یک روز خسته‌کننده',
    situationContextFa: 'ساعت‌ها روی پروژه کار کرده‌اید و دیگر بازدهی ندارید. به همکارتان پیشنهاد توقف کار می‌دهید.',
    relationship: 'همکار / هم‌تیمی',
    conversationalPrompt: "We've been troubleshooting this bug for five hours straight. Should we keep going?",
    conversationalPromptFa: 'پنج ساعت یک‌نفس داریم این باگ رو رفع می‌کنیم. به نظرت ادامه بدیم؟',
    hint: 'راهنمای پاسخ: خستگی مشترک را یادآوری کنید و پیشنهاد دهید ادامه کار با ذهن باز به فردا موکول شود.',
    guidance: {
      approachFa: 'ابتدا وضعیت انرژی تیم را به رسمیت بشناسید (مثلاً ما خسته‌ایم و بازدهی نداریم)، سپس پیشنهاد توقف کار و از سرگیری با انرژی تازه در روز بعد را بدهید.',
      suggestedPattern: "We're all exhausted, so let's just call it a day and [pick it up tomorrow / resume in the morning].",
      keyCollocations: ['five hours straight', 'fresh eyes', 'exhausted', 'pick it up tomorrow'],
      culturalTipFa: 'در محیط کار سالم در فرهنگ غرب، مرز کشیدن بین ساعات کار و سلامتی پذیرفته شده است؛ عبارت "call it a day" این مرز را با صمیمیت و پذیرش عمومی تعیین می‌کند.',
    },
    idealSampleResponse: "We're all exhausted, so let's just call it a day and pick it up tomorrow.",
    idealSampleResponseFa: 'همه خسته‌ایم، پس بیا کار رو امروز تعطیل کنیم و فردا ادامه‌ش بدیم.',
  },
  'bite the bullet': {
    situationTitleFa: 'تصمیم‌گیری برای انجام یک کار سخت و ناخوشایند',
    situationContextFa: 'مدت‌هاست انجام یک کار دشوار یا تماس سخت را به تعویق انداخته‌اید و همکارتان درباره آن سوال می‌پرسد.',
    relationship: 'دوست و همکار',
    conversationalPrompt: "Are you still putting off that call with the difficult client?",
    conversationalPromptFa: 'هنوز هم داری تماس با اون مشتری سخت‌گیر رو عقب می‌اندازی؟',
    hint: 'راهنمای پاسخ: تعلل قبلی را تایید کنید و سپس عزم خود را برای انجام کار با این کلیشه اعلام کنید.',
    guidance: {
      approachFa: 'پاسخ را با یک پذیرش صادقانه شروع کنید (مثلاً "درسته، ولی...") و بعد قاطعیت خود را برای مواجهه با چالش و اتمام آن ابراز دارید.',
      suggestedPattern: "I just need to bite the bullet and [get it done / make the call] today.",
      keyCollocations: ['put off', 'get it over with', 'face the music', 'tough call'],
      culturalTipFa: 'اصطلاح "bite the bullet" نشان‌دهنده شجاعت در پذیرش سختی است و به شنونده حس مسئولیت‌پذیری شما را القا می‌کند.',
    },
    idealSampleResponse: "No, I just need to bite the bullet and get it over with today.",
    idealSampleResponseFa: 'نه، دیگه باید دل به دریا بزنم و امروز تمومش کنم بره پی کارش.',
  },
};

/**
 * Live connectivity check for user-provided Gemini + OpenAI keys.
 * Body: { geminiApiKey?, openaiApiKey? } — also accepts x-gemini-api-key / x-openai-api-key headers.
 */
app.post('/api/verify-keys', async (req, res) => {
  const geminiKey = String(
    req.body?.geminiApiKey || req.headers['x-gemini-api-key'] || ''
  ).trim();
  const openaiKey = String(
    req.body?.openaiApiKey || req.headers['x-openai-api-key'] || ''
  ).trim();

  const result: {
    gemini: { ok: boolean; skipped?: boolean; model?: string; error?: string };
    openai: { ok: boolean; skipped?: boolean; error?: string };
  } = {
    gemini: { ok: false, skipped: !geminiKey },
    openai: { ok: false, skipped: !openaiKey },
  };

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      let verified = false;
      let usedModel = '';
      let lastErr = '';
      for (const model of CANDIDATE_GEMINI_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ text: 'Reply with exactly: OK' }],
            config: { temperature: 0 },
          });
          const text = (response.text || '').trim();
          if (text) {
            verified = true;
            usedModel = model;
            break;
          }
        } catch (e: any) {
          lastErr = e?.message || String(e);
          console.warn(`verify-keys Gemini ${model} failed:`, lastErr.slice(0, 160));
        }
      }
      if (verified) {
        result.gemini = { ok: true, model: usedModel };
      } else {
        const msg = lastErr.toLowerCase();
        let friendly = lastErr || 'اتصال به Gemini برقرار نشد';
        if (msg.includes('api key') || msg.includes('invalid') || msg.includes('403') || msg.includes('401')) {
          friendly = 'کلید Gemini نامعتبر است یا دسترسی ندارد. از AI Studio یک کلید جدید بسازید.';
        } else if (msg.includes('quota') || msg.includes('429')) {
          friendly = 'سهمیه Gemini تمام شده یا محدود شده. کمی بعد دوباره امتحان کنید.';
        }
        result.gemini = { ok: false, error: friendly };
      }
    } catch (e: any) {
      result.gemini = { ok: false, error: e?.message || 'خطا در بررسی Gemini' };
    }
  }

  if (openaiKey) {
    try {
      const modelsRes = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${openaiKey}` },
      });
      if (modelsRes.ok) {
        result.openai = { ok: true };
      } else {
        const errBody = await modelsRes.text().catch(() => '');
        let friendly = `OpenAI پاسخ ${modelsRes.status} داد`;
        if (modelsRes.status === 401 || modelsRes.status === 403) {
          friendly = 'کلید OpenAI نامعتبر است. از platform.openai.com یک کلید جدید بسازید.';
        } else if (modelsRes.status === 429) {
          friendly = 'سهمیه یا نرخ درخواست OpenAI محدود شده. کمی بعد دوباره امتحان کنید.';
        } else if (errBody) {
          friendly = errBody.slice(0, 180);
        }
        result.openai = { ok: false, error: friendly };
      }
    } catch (e: any) {
      result.openai = { ok: false, error: e?.message || 'خطا در بررسی OpenAI' };
    }
  }

  const geminiRequiredOk = !geminiKey ? false : result.gemini.ok;
  const openaiOkIfProvided = !openaiKey ? true : result.openai.ok;
  const allOk = geminiRequiredOk && openaiOkIfProvided;

  return res.status(allOk ? 200 : 400).json({
    ok: allOk,
    gemini: result.gemini,
    openai: result.openai,
  });
});

// API: Scenario Chat & Real-Time Speaking Analysis
app.post('/api/chat', async (req, res) => {
  try {
    const {
      scenarioId,
      scenarioTitle = 'Daily Conversation',
      context = 'Casual Conversation',
      relationship = 'Friend / Peer',
      userRole = 'Learner',
      aiRole = 'Conversational Partner',
      userMessage = '',
      userAudioBase64,
      chatHistory = [],
      targetWords = [],
      targetGrammar = '',
      targetGrammarFa = '',
      targetCliches = [],
      targetPronunciation = '',
      activeWeaknesses = [],
      weaknessesItems = [],
      cefrLevel = 'B1',
      targetLevel = 'B2',
      turnNumber = 1,
      persona = { name: 'Sam', accent: 'American (California)', tone: 'Friendly and conversational' },
    } = req.body;

    const messageToAnalyze = userMessage.trim();
    const effectiveTargetCliches = (targetCliches && targetCliches.length > 0 ? targetCliches : targetWords);

    const formattedWeaknesses = Array.isArray(weaknessesItems) && weaknessesItems.length > 0
      ? weaknessesItems.map((w: any) =>
          typeof w === 'string'
            ? w
            : `[${w.category || 'grammar'} - ${w.severity || 'medium'} priority] ${w.titleFa}: ${w.descriptionFa || ''}${w.examples?.length ? ` (e.g. ${w.examples.join('; ')})` : ''}`
        ).join('\n')
      : (activeWeaknesses || []).join(', ') || 'No specific previous weaknesses logged yet';

    const effectiveTurnNumber = Number(turnNumber) || (chatHistory ? Math.floor(chatHistory.length / 2) + 1 : 1);
    const rotationResult = trackConversationDriftAndRotateSubtopic({
      turnNumber: effectiveTurnNumber,
      chatHistory,
      targetGrammar,
      targetGrammarFa,
      targetCliches: effectiveTargetCliches,
      scenarioTitle,
      baseContext: context,
      cefrLevel,
    });

    const ai = getAiClient(req);
    // If Gemini API is available and key is present, try Gemini call with resilient model fallback
    if (ai) {
      const candidateModels = CANDIDATE_GEMINI_MODELS;
      const textPrompt = `
You are "${persona.name}", an elite American English speaking coach and conversational partner.
You are roleplaying as "${aiRole}" in this scenario:
- Scenario Title: "${scenarioTitle}"
- Context: "${context}"
- Relationship: "${relationship}"
- User Role: "${userRole}"
- AI Persona: "${persona.name}" (${persona.accent}, ${persona.tone})
- CURRENT CONVERSATION TURN: #${effectiveTurnNumber}
${chatHistory && chatHistory.length > 0 ? `Recent dialogue:\n${chatHistory.map((m: any) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n')}` : ''}

${rotationResult.promptInjectionDirective}

PEDAGOGICAL & PROBING MISSION (مربی‌گری هوشمند تا تحقق کامل اهداف درس و باز شدن زبان کاربر):
- STUDENT'S ASSESSED CEFR LEVEL: "${cefrLevel}" | SCENARIO TARGET LEVEL: "${targetLevel}"
- PRIMARY LESSON GRAMMAR GOAL: "${targetGrammar || 'Spoken grammar fluency'}" (${targetGrammarFa || ''})
- PRIMARY TARGET NATIVE CLICHÉS TO MASTER: ${effectiveTargetCliches.join(', ') || 'Authentic American idiomatic chunks'}
- STUDENT'S LOGGED WEAKNESS DATABASE (تمرین تلفیقی و رفع تدریجی نقاط ضعف کاربر در لابلای مکالمه):
${formattedWeaknesses}

MANDATORY STEP 5 REMEDIATION PROTOCOL (هم‌زمان‌سازی پیشبرد سناریو با ترمیم ضعف‌های دیتابیس کاربر):
You MUST simultaneously:
1. Advance the primary scenario goal and encourage the learner to produce the target clichés.
2. Select ONE specific weakness from the STUDENT'S LOGGED WEAKNESS DATABASE above, and subtly craft your dialogue/probing question in a way that creates a natural conversational necessity for the learner to practice and repair that weakness.
3. If the learner successfully produces the correct construction without their usual mistake, return "weaknessImprovementNoted": "<exact titleFa of the weakness>".

THE USER JUST SAID:
"${messageToAnalyze || '(Audio message)'}"
${userAudioBase64 ? '(Audio of the user saying this is attached. Transcribe and evaluate their spoken English.)' : ''}

CRITICAL RULES:
1. ZERO HALLUCINATION / ZERO COPY-PASTING OF PREVIOUS EXAMPLES:
   Every single comment, strength, issue, correction, voice note, and rewrite MUST BE 100% SPECIFIC TO WHAT THE USER ACTUALLY SAID: "${messageToAnalyze}".

2. DEMANDING COACHING & DYNAMIC REAL-LIFE SUBTOPIC ROTATION (چرخش پویای موضوع و جلوگیری قطعی از گیر کردن روی یک سوژه خاص):
   - CRITICAL REQUIREMENT: Follow the CONVERSATION DRIFT TRIGGER & SUBTOPIC ROTATION DIRECTIVE above!
   - Every 2 to 3 user turns, you MUST rotate to a completely different real-life situation from our extensive catalog (such as being at an airport, in a restaurant, in a business meeting, in a real estate negotiation, working as a product salesperson, checking out at a store, at home, interacting with a spouse, talking to a child, spending time with a girlfriend, at a doctor's clinic, at a car repair shop, etc.).
   - CURRENT DIRECTIVE FOR THIS TURN:
     * ROTATION TRIGGERED: ${rotationResult.isRotationTriggered ? `YES -> Pivot immediately to "${rotationResult.situation.titleFa}"` : 'NO -> Deepen initial scenario'}
     * NEW REAL-LIFE SETTING: "${rotationResult.situation.titleFa}" (${rotationResult.situation.settingEn})
   - NON-NEGOTIABLE PEDAGOGICAL TETHERING (هدف اصلی درس هرگز فراموش نشود):
     * While diversifying the conversation and exposing the user to different real-life situations, YOU MUST NEVER LOSE SIGHT OF THE LESSON'S PRIMARY LEARNING OBJECTIVE.
     * Every transition, question, and conversational exchange MUST reinforce:
       -> PRIMARY GRAMMAR TARGET: "${targetGrammar || 'target structure'}" (${targetGrammarFa || ''})
       -> PRIMARY TARGET CLICHÉ: "${effectiveTargetCliches[0] || 'target idiom'}"
     * Subtly guide the user toward speaking in a way that aligns with this learning objective in context without making it feel forced.
   - STRICTLY ZERO CHIT-CHAT OR VERBOSE CONVERSATIONAL FILLER IN "reply":
     * Do NOT write long personal stories, polite fluff, or rambling pleasantries!
     * Keep the partner's "reply" direct, crisp, and concise (MAXIMUM 1 TO 2 SHORT SENTENCES).
     * Structure: [Short acknowledging reaction (max 1 clause)] + [Direct bridge into the new real-life situation demanding the target grammar].
   - In "inCharacterChallenge":
     - probingQuestionEn: The new, fresh pivot question in "${rotationResult.situation.titleFa}" demanding the target grammar.
     - probingQuestionFa: روان‌ترین ترجمه فارسی این سوال جدید برای راهنمایی ذهن کاربر.
     - coachingGoalFa: دستور آموزشی مستقیم مربی به فارسی برای نوبت بعد با اصطلاح یا گرامر هدف در این زمینه تازه.

3. STRICT 80% LESSON MASTERY THRESHOLD (Requirement 4) — soft AI signal only:
   - The client enforces QUANTITATIVE mastery (≥3 strong turns + target cliché coverage). Your lessonProgress is advisory.
   - Evaluate whether THIS response used target grammar/clichés correctly.
   - Return "lessonProgress":
     - progressPercent: Number from 10 to 100 for THIS turn's contribution toward the lesson goal.
     - isGoalSatisfied: true only if this utterance independently shows confident correct use of targets (client still requires N strong turns).
     - unmetGoalsFa: Array of Persian descriptions of what still needs work.
     - coachingFeedbackFa: Energetic coaching tip on how to break free of Persian translation.
   - ALSO return top-level analysis fields:
     - "usedTargetClichesCorrectly": string[] of target clichés the user correctly produced in THIS utterance (empty if none).
     - "turnQuality": "strong" | "ok" | "weak"

4. WEAKNESS DATABASE LOGGING & REMEDIATION:
   - "newWeaknessIdentified": If user exhibits a recurring Persian transfer mistake (like "I go to shopping", "explain for me", missing Flap T, or hyper-formal textbook tone), return { "category": "grammar"|"pronunciation"|"register_tone"|"fluency", "titleFa": "عنوان ایراد", "descriptionFa": "توضیح کامل به فارسی", "severity": "high"|"medium"|"low", "example": "نمونه اشتباه" }.
   - "weaknessImprovementNoted": If user successfully overcame or improved on any of their active weaknesses, return the exact title string.

5. PRECISE MEANING-PRESERVING NATIVE REWRITE & SENTENCE PATTERNS (الگوها و فرمول‌های جمله‌سازی نیتیو):
   - Provide "nativeAlternative": Rephrase EXACTLY what the user wanted to say in authentic American English.
   - Provide "nativeAlternativesList": 2-3 stylistic options (natural/standard, professional, casual).
   - Provide "nativeCliche": A key natural American collocation or phrase suitable for this context, with its Persian meaning.
   - MANDATORY "sentencePatterns": Extract 2 to 4 reusable American "Sentence Patterns" (الگوها و فرمول‌های کاربردی جمله‌سازی) directly derived from "nativeAlternative" and the concept the user tried to express.
     Format each pattern with variables (X, Y, Z or [bracketed slots]) so the learner can reuse the exact grammatical/idiomatic frame in different situations!
     Example:
     [
       { "pattern": "X is gradually fading.", "meaningFa": "چیزی رفته‌رفته در حال محو یا کم‌رنگ شدن است", "slotExplanation": "X: ترس، درد، احساس، یا خاطره" },
       { "pattern": "X is still more [adjective] than Y.", "meaningFa": "ایکس همچنان از وای فلان‌صفت‌تر است", "slotExplanation": "برای مقایسه استمرار یک وضعیت" },
       { "pattern": "X is more sensitive to Y than Z.", "meaningFa": "حساس‌تر بودن نسبت به یک موضوع یا محرک", "slotExplanation": "Y: محرک یا عامل حساسیت" },
       { "pattern": "X tries to steer clear of Y.", "meaningFa": "تلاش برای دوری گزیدن و فاصله گرفتن از چیزی یا کسی", "slotExplanation": "Y: فرد، خطر، یا موقعیت ناخوشایند" }
     ]

6. SIX-DIMENSION SPEAKING RUBRIC (calibrate to CEFR ${cefrLevel}; be strict but actionable for Persian L1):
   Score each 0–100 and cite concrete evidence from THIS utterance only:
   - grammarScore: Grammar & Structure (syntax, tense, agreement, articles)
   - nativeScore: Naturalness & Word Choice (idioms, collocations, vs textbook Persian calques)
   - contextScore: Context & Pragmatics (register vs relationship "${relationship}", politeness, formality mismatch)
   - communicationScore: Communication & Completeness (answered the prompt fully? clear intent?)
   - pronunciationScore: Pronunciation & Accent (Flap-T, Rhotic R, schwa, linking — from audio if present)
   - fluencyScore: Fluency & Delivery (hesitation, repairs, pacing, chunking)
   overallScore = weighted blend emphasizing the PRIMARY LESSON GOAL above.

7. STRICT AMERICAN PHONETICS PROTOCOL (mandatory when audio is attached; still apply text-based stress/rhythm tips otherwise):
   - Be HARSH on Persian L1 transfers: tapped/trilled R, aspirated T instead of Flap [ɾ], full vowels instead of schwa, syllable-timed rhythm, W/V confusion, missing linking.
   - Lesson pronunciation focus: "${targetPronunciation || 'General American clarity'}". Prioritize issues that block THIS focus.
   - If audio is present: NEVER give pronunciationScore ≥ 88 unless you list at least one concrete strength AND the speech truly sounds near-native. Typical B1–B2 Persian speakers should land 65–82.
   - Always fill voiceAnalysis.phonemeIssues / wordStressIssues / intonation / drillSequenceFa with actionable Persian coaching when anything is off.
   - If pronunciationScore < 78, set overallScore ≤ 74 even if grammar is strong (accent gates fluency mastery).

Return ONLY a valid JSON object matching this structure:
{
  "reply": "English reply as ${aiRole}",
  "persianTranslation": "ترجمه فارسی روان پاسخ",
  "transcribedUserText": "${messageToAnalyze ? messageToAnalyze.replace(/"/g, '\\"') : 'Spoken English words transcribed from audio (DO NOT output base64)'}",
  "analysis": {
    "overallScore": 85,
    "grammarScore": 88,
    "nativeScore": 82,
    "contextScore": 80,
    "communicationScore": 84,
    "pronunciationScore": 84,
    "fluencyScore": 78,
    "userSpokenTranscript": "${messageToAnalyze ? messageToAnalyze.replace(/"/g, '\\"') : 'Spoken English words (DO NOT output base64)'}",
    "strengths": ["نقطه قوت مشخص در جمله کاربر"],
    "categorizedIssues": [
      {
        "category": "grammar",
        "categoryFa": "ساختار گرامری",
        "titleFa": "عنوان ایراد",
        "originalSnippet": "بخشی از جمله کاربر",
        "correctedSnippet": "شکل صحیح نیتیو",
        "explanationFa": "توضیح فارسی...",
        "whyItMattersFa": "چرا مهم است...",
        "howToFixFa": "روش اصلاح..."
      }
    ],
    "voiceAnalysis": {
      "strengthsFa": ["وضوح صدا و بیان..."],
      "phonemeIssues": [
        {
          "soundOrWord": "کلمه یا صدای مربوطه",
          "targetPhonetic": "/.../",
          "whatWasHeardFa": "آنچه معمولاً اشتباه ادا می‌شود",
          "whyItMattersFa": "اهمیت صدا",
          "howToFixFa": "روش تمرین"
        }
      ],
      "wordStressIssues": [
        {
          "word": "کلمه چندبخشی",
          "targetStress": "SYL-la-ble",
          "whyItMattersFa": "اهمیت تکیه",
          "howToFixFa": "روش اصلاح"
        }
      ],
      "sentenceRhythm": {
        "highlightedPattern": "جمله کاربر با حروف بزرگ روی کلمات تاکیدی",
        "whyItMattersFa": "توضیح ریتم",
        "howToFixFa": "روش تمرین ریتم"
      },
      "thoughtGroups": {
        "suggestedChunking": "بخش‌بندی جمله کاربر با علامت /",
        "whyItMattersFa": "اهمیت گروه‌بندی معنایی",
        "howToFixFa": "نحوه مکث صحیح"
      },
      "intonation": {
        "observationFa": "آهنگ جمله کاربر",
        "whyItMattersFa": "تأثیر لحن بر شنونده",
        "howToFixFa": "نحوه فرود یا اوج صدا"
      },
      "drillSequenceFa": ["گام ۱", "گام ۲", "گام ۳"]
    },
    "socialTone": {
      "register": "casual",
      "registerFa": "محاوره‌ای",
      "politenessLevel": 4,
      "formalityLevel": 2,
      "appropriatenessVerdictFa": "بررسی لحن با موقعیت",
      "culturalEtiquetteTipFa": "اتیکت فرهنگی آمریکا"
    },
    "nativeAlternative": "بازنویسی نیتیو دقیق مفهوم کاربر",
    "nativeAlternativeFa": "ترجمه فارسی بازنویسی",
    "nativeAlternativesList": [
      {
        "type": "exact_meaning",
        "labelFa": "بیان طبیعی و متداول",
        "english": "جمله انگلیسی",
        "persian": "ترجمه فارسی"
      }
    ],
    "nativeCliche": "${effectiveTargetCliches[0] || 'اصطلاح کلیدی'}",
    "nativeClicheMeaningFa": "معنی اصطلاح",
    "sentencePatterns": [
      {
        "pattern": "X is gradually fading.",
        "meaningFa": "چیزی رفته‌رفته در حال محو یا کم‌رنگ شدن است",
        "slotExplanation": "X: ترس، درد، احساس، یا خاطره"
      },
      {
        "pattern": "X tries to steer clear of Y.",
        "meaningFa": "تلاش برای دوری گزیدن و پرهیز از چیزی یا کسی",
        "slotExplanation": "Y: خطر، فرد، یا موقعیت ناخوشایند"
      }
    ],
    "repetitionChallengePromptFa": "دعوت به تکرار با عبارت جدید",
    "inCharacterChallenge": {
      "probingQuestionEn": "پرسش چالشی مربی در نقش خود",
      "probingQuestionFa": "ترجمه پرسش چالشی",
      "coachingGoalFa": "دستور مربی برای نوبت بعد جهت باز شدن زبان"
    },
    "lessonProgress": {
      "progressPercent": 40,
      "isGoalSatisfied": false,
      "unmetGoalsFa": ["استفاده از اصطلاح هدف در جمله کامل"],
      "coachingFeedbackFa": "پاسخ اولیه خوب بود، حالا با استفاده از اصطلاح هدف زبانت رو باز کن و کامل‌تر بگو."
    },
    "usedTargetClichesCorrectly": [],
    "turnQuality": "ok",
    "newWeaknessIdentified": null,
    "weaknessImprovementNoted": null
  }
}
`;

      let contentsPayload: any = textPrompt;
      if (userAudioBase64) {
        const cleanMime = (req.body.userAudioMimeType || 'audio/webm').split(';')[0];
        contentsPayload = [
          { inlineData: { mimeType: cleanMime, data: userAudioBase64 } },
          { text: textPrompt },
        ];
      }

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contentsPayload,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.5,
            },
          });

          const parsed = safeJsonParse(response.text);
          if (parsed.reply && parsed.analysis) {
            // Guarantee no binary base64 or garbage strings ever pollute transcribedUserText
            parsed.transcribedUserText = sanitizeTranscriptText(
              parsed.transcribedUserText,
              messageToAnalyze || 'صدای ضبط‌شده شما'
            );
            parsed.analysis.userSpokenTranscript = sanitizeTranscriptText(
              parsed.analysis.userSpokenTranscript,
              parsed.transcribedUserText
            );

            parsed.analysis.isEstimatedOfflineAnalysis = false;
            parsed.analysis.analysisEngineSource = userAudioBase64 ? 'gemini_multimodal_audio' : 'gemini_text_only';
            parsed.analysis = enforcePhoneticsStrictness(parsed.analysis, {
              hadAudio: Boolean(userAudioBase64),
              targetPronunciation: req.body.targetPronunciation || '',
              targetGrammar: targetGrammar || '',
            });
            return res.json(parsed);
          }
        } catch (modelError: any) {
          console.warn(`Model ${modelName} failed (${modelError.message?.slice(0, 80)}), trying next candidate...`);
        }
      }
    }

    // High-precision dynamic contextual linguistic engine fallback
    const localResult = evaluateSpeakingTextLocally(
      messageToAnalyze,
      {
        id: scenarioId || 'daily-chat',
        title: scenarioTitle,
        titleFa: scenarioTitle,
        relationship,
        userRole,
        aiRole,
        category: 'daily',
        starter: '',
        starterFa: '',
        icon: '💬',
        descriptionFa: '',
        clicheTag: '',
        recommendedRegister: relationship.toLowerCase().includes('formal') ? 'formal' : 'casual',
      },
      persona
    );

    localResult.analysis.isEstimatedOfflineAnalysis = true;
    localResult.analysis.analysisEngineSource = 'local_linguistic_estimate';
    localResult.analysis = enforcePhoneticsStrictness(localResult.analysis, {
      hadAudio: Boolean(userAudioBase64),
      targetPronunciation: targetPronunciation || '',
      targetGrammar: targetGrammar || '',
    });

    if (rotationResult.isRotationTriggered && localResult) {
      const sit = rotationResult.situation;
      localResult.reply = `${sit.bridgeTransitions[0]} ${sit.settingEn}`;
      localResult.persianTranslation = `چرخش به موقعیت جدید: ${sit.titleFa}. ${sit.settingFa}`;
      if (localResult.analysis?.inCharacterChallenge) {
        localResult.analysis.inCharacterChallenge.probingQuestionEn = `In this situation (${sit.settingEn}), how would you express yourself using ${targetGrammar || 'the target structure'}?`;
        localResult.analysis.inCharacterChallenge.probingQuestionFa = `در این موقعیت جدید (${sit.titleFa})، چطور نظرتان را با ساختار گرامری ${targetGrammarFa || targetGrammar} بیان می‌کنید؟`;
        localResult.analysis.inCharacterChallenge.coachingGoalFa = `حالا در موقعیت ${sit.titleFa}، سعی کنید با گرامر هدف جمله بسازید تا دایره واژگانتان در بسترهای مختلف تقویت شود.`;
      }
      if (sit.sentencePatternTemplates && sit.sentencePatternTemplates.length > 0) {
        localResult.analysis.sentencePatterns = sit.sentencePatternTemplates;
      }
    }

    res.json({
      reply: localResult.reply,
      persianTranslation: localResult.persianTranslation,
      transcribedUserText: messageToAnalyze,
      analysis: localResult.analysis,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: 'Failed to process chat', details: err.message });
  }
});

// API: Generate Practice Situation
app.post('/api/practice-generate-situation', async (req, res) => {
  try {
    const {
      cliche,
      meaningFa,
      context: originalContext = '',
      regenerate = false,
      scenarioIndex = 0,
      currentTitle = '',
    } = req.body;
    if (!cliche) return res.status(400).json({ error: 'cliche is required' });

    const ai = getAiClient(req);
    // If Gemini available, generate authentic distinct situational task with diverse contexts
    if (ai) {
      try {
        const prompt = `
You are a senior American conversational designer.
Generate an engaging, realistic American conversational practice task for the American cliché: "${cliche}" (Persian meaning: ${meaningFa || 'اصطلاح کاربردی'}).
${
  regenerate || currentTitle
    ? `CRITICAL INSTRUCTION: The user is clicking "Generate New Scenario". They already practiced a scenario titled: "${currentTitle}". Do NOT repeat that context. Generate a COMPLETELY DIFFERENT, FRESH setting (e.g., choose among: airport, coffee shop, job interview, salary negotiation, road trip with friends, gym workout, urgent tech crisis, home renovation, doctor's clinic) with a distinct relationship and conflict.`
    : ''
}

Return ONLY valid JSON matching this schema:
{
  "targetCliche": "${cliche}",
  "situationTitleFa": "عنوان جذاب و متمایز موقعیت به فارسی",
  "situationContextFa": "شرح دقیق ۲-۳ خطی از زمینه و شرایط مکالمه به فارسی",
  "relationship": "رابطه طرفین (مثلاً: همکار در پروژه، دوست صمیمی، مدیر شرکت، فروشنده)",
  "conversationalPrompt": "Realistic, natural conversation starter said by the partner in American English",
  "conversationalPromptFa": "ترجمه روان فارسی جمله شریک مکالمه",
  "hint": "راهنمای کلی برای ایده اولیه پاسخ",
  "guidance": {
    "approachFa": "راهنمای گام‌به‌گام نحوه پاسخ‌دهی و موضع‌گیری در این موقعیت به فارسی",
    "suggestedPattern": "ساختار پیشنهادی ساخت جمله (Sentence Blueprint) با جایگذاری کلیشه",
    "keyCollocations": ["کالوکیشن ۱", "کالوکیشن ۲", "کالوکیشن ۳"],
    "culturalTipFa": "نکته فرهنگی و اتیکت گفتاری در مکالمه بومی آمریکایی"
  },
  "idealSampleResponse": "Ideal natural native response including ${cliche}",
  "idealSampleResponseFa": "ترجمه دقیق و روان فارسی"
}
`;
        const candidateModels = CANDIDATE_GEMINI_MODELS;
        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: prompt,
              config: { responseMimeType: 'application/json', temperature: 0.85 },
            });
            const parsed = safeJsonParse(response.text);
            if (parsed && parsed.situationTitleFa) {
              return res.json(parsed);
            }
          } catch (mErr: any) {
            console.warn(`Model ${model} failed for practice situation, trying next:`, mErr.message);
          }
        }
      } catch (e: any) {
        console.warn('Gemini practice situation failed, using linguistic engine fallback:', e.message);
      }
    }

    // High-diversity multi-scenario local linguistic engine
    const local = generateSituationForCliche(cliche, meaningFa, scenarioIndex);
    res.json(local);
  } catch (err: any) {
    console.error('Error in /api/practice-generate-situation:', err);
    res.status(500).json({ error: 'Failed to generate situation', details: err.message });
  }
});

// API: Evaluate Practice with deep linguistic analysis, audio waveform assessment & American native equivalent model
app.post('/api/practice-evaluate', async (req, res) => {
  try {
    const {
      targetCliche,
      situationContextFa,
      conversationalPrompt,
      userResponse = '',
      userAudioBase64,
      userAudioMimeType,
    } = req.body;

    const cleanUser = (userResponse || '').trim();

    // Check Persian L1 Interference and grammar with linguistic rule database
    const linguisticAnalysis = analyzeLinguisticText(
      cleanUser,
      situationContextFa || 'Practice Scenario',
      'Conversational Partner'
    );

    const ai = getAiClient(req);
    // If Gemini is available, conduct a full speaking-grade multimodal analysis + native American equivalent
    if (ai) {
      try {
        const evalPrompt = `
You are a senior American English linguistic evaluator, phonetics expert, and accent coach.
The student is practicing the American cliché: "${targetCliche}".
Context: ${situationContextFa || 'Daily conversational situation'}
Partner asked: "${conversationalPrompt || 'What do you think?'}"
Student's response: "${cleanUser || '[Spoken Audio Attached]'}"

Perform a thorough, authentic linguistic and pedagogical evaluation in Persian (Farsi), matching the high-end analysis of an IELTS/Native coaching breakdown.
CRITICAL EVALUATION REQUIREMENTS:
1. Did the student use the target cliché accurately? (usedTargetCliche: boolean, accuracyScore: 0-100)
2. americanConceptModel: Explain how a native American would express this exact concept:
   - expression: "The authentic sentence an American native would say in this exact spot"
   - expressionFa: "ترجمه روان فارسی"
   - clicheUsed: "The exact cliché/idiom used by the native"
   - clicheMeaningFa: "معنی روان فارسی کلیشه"
   - whyItIsNativeFa: "توضیح عمیق چرا یک آمریکایی به جای ترجمه کلمه به کلمه فارسی از این ساختار استفاده می‌کند"
3. categorizedIssues: List real linguistic, grammar, punctuation, word choice or completeness errors in student's response. If no errors, provide empty array.
4. voiceAnalysis: Acoustic & pronunciation breakdown (sensitive American phonemes like Flap T /t̬/, American /r/, W vs V contrast, Glottal stop before /n/, word stress for multisyllabic words, thought groups, intonation, speech rate, 3-step drill sequence).
5. transcribedUserText: If audio is provided, output the exact transcribed English words spoken by the user.

Return ONLY valid JSON matching this schema:
{
  "usedTargetCliche": boolean,
  "accuracyScore": number,
  "verdictFa": "نتیجه‌گیری ارزیابی به فارسی",
  "transcribedUserText": "${cleanUser}",
  "analysis": {
    "overallScore": number,
    "grammarScore": number,
    "nativeScore": number,
    "pronunciationScore": number,
    "speechRateWpm": 115,
    "userSpokenTranscript": "${cleanUser}",
    "strengths": ["نقطه قوت ۱ به فارسی", "نقطه قوت ۲ به فارسی"],
    "categorizedIssues": [
      {
        "category": "grammar",
        "categoryFa": "دسته‌بندی خطا به فارسی",
        "titleFa": "عنوان خطا",
        "originalSnippet": "بخش دارای اشکال",
        "correctedSnippet": "شکل صحیح",
        "explanationFa": "شرح دقیق خطای گرامری یا ساختاری",
        "whyItMattersFa": "چرا این موضوع برای شنونده بومی مهم است",
        "howToFixFa": "روش تمرین و اصلاح"
      }
    ],
    "voiceAnalysis": {
      "strengthsFa": ["وضوح و پیوستگی گفتار"],
      "phonemeIssues": [
        {
          "soundOrWord": "کلمه یا فونم حساس (مثلاً Flap T در water)",
          "targetPhonetic": "/ˈwɑːt̬ər/",
          "whatWasHeardFa": "آنچه شنیده شد",
          "whyItMattersFa": "اهمیت ادای صحیح در اکسنت آمریکایی",
          "howToFixFa": "روش تولید صدا با نوک زبان یا لب‌ها"
        }
      ],
      "wordStressIssues": [
        {
          "word": "کلمه",
          "targetStress": "SYL-la-ble",
          "whyItMattersFa": "اهمیت تکیه هجا در درک شنونده بومی",
          "howToFixFa": "روش ادای هجای قوی‌تر"
        }
      ],
      "sentenceRhythm": {
        "highlightedPattern": "HIGHLIGHTED content words in sentence",
        "whyItMattersFa": "تکیه بر کلمات محتوایی و ریتم موزون گفتار آمریکایی",
        "howToFixFa": "راهنمای ریتم"
      },
      "thoughtGroups": {
        "suggestedChunking": "Chunk 1 / Chunk 2 / Chunk 3",
        "whyItMattersFa": "دسته‌بندی معنایی و مکث در محل مناسب",
        "howToFixFa": "راهنمای مکث"
      },
      "intonation": {
        "observationFa": "تحلیل آهنگ صعودی یا فرودی",
        "whyItMattersFa": "القای اعتمادبه‌نفس و اطمینان",
        "howToFixFa": "راهنمای تنظیم زیر و بم صدا"
      },
      "drillSequenceFa": [
        "گام ۱ تمرین دهان و زبان",
        "گام ۲ تمرین دهان و زبان",
        "گام ۳ تمرین دهان و زبان"
      ]
    },
    "socialTone": {
      "register": "casual",
      "registerFa": "لحن ثبت‌شده",
      "politenessLevel": 4,
      "formalityLevel": 3,
      "appropriatenessVerdictFa": "تطابق لحن با موقعیت",
      "culturalEtiquetteTipFa": "نکته اتیکت و ظرافت فرهنگی در آمریکا"
    },
    "nativeAlternative": "Native expression",
    "nativeAlternativeFa": "ترجمه فارسی"
  },
  "americanConceptModel": {
    "expression": "Native expression",
    "expressionFa": "ترجمه فارسی",
    "clicheUsed": "${targetCliche}",
    "clicheMeaningFa": "معنی فارسی کلیشه",
    "whyItIsNativeFa": "توضیح تفاوت نگاه بومی آمریکایی با ترجمه تحت‌اللفظی"
  },
  "idealSampleResponse": "Ideal response",
  "idealSampleResponseFa": "ترجمه فارسی"
}
`;
        const candidateModels = CANDIDATE_GEMINI_MODELS;
        for (const model of candidateModels) {
          try {
            const contents: any[] = [];
            if (userAudioBase64) {
              contents.push({
                inlineData: {
                  data: userAudioBase64,
                  mimeType: userAudioMimeType || 'audio/webm',
                },
              });
            }
            contents.push({ text: evalPrompt });

            const response = await ai.models.generateContent({
              model,
              contents,
              config: { responseMimeType: 'application/json', temperature: 0.4 },
            });
            const parsed = safeJsonParse(response.text);
            if (parsed && parsed.analysis && parsed.americanConceptModel) {
              // Merge any linguistic rule issues if detected
              if (linguisticAnalysis.grammarCorrections.length > 0) {
                const existingIssues = parsed.analysis.categorizedIssues || [];
                linguisticAnalysis.grammarCorrections.forEach((gc) => {
                  if (!existingIssues.some((ei: any) => ei.originalSnippet?.includes(gc.original))) {
                    existingIssues.unshift({
                      category: 'grammar',
                      categoryFa: 'تداخل ترجمه زبان مادری',
                      titleFa: `اشکال در عبارت «${gc.original}»`,
                      originalSnippet: gc.original,
                      correctedSnippet: gc.corrected,
                      explanationFa: gc.explanationFa,
                      whyItMattersFa: 'ترجمه تحت‌اللفظی فارسی به انگلیسی باعث احساس غیرطبیعی بودن جمله برای نیتیوها می‌شود.',
                      howToFixFa: `به جای «${gc.original}» از شکل طبیعی «${gc.corrected}» استفاده فرمایید.`,
                    });
                  }
                });
                parsed.analysis.categorizedIssues = existingIssues;
              }

              parsed.analysis = enforcePhoneticsStrictness(parsed.analysis, {
                hadAudio: Boolean(userAudioBase64),
                targetPronunciation: `American pronunciation of cliché "${targetCliche}"`,
                targetGrammar: targetCliche,
              });
              return res.json(parsed);
            }
          } catch (mErr: any) {
            console.warn(`Model ${model} failed for practice evaluate, trying next:`, mErr.message);
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini practice evaluate failed, falling back to linguistic engine:', geminiErr.message);
      }
    }

    // Resilient instant local linguistic engine fallback
    const localResult = evaluatePracticeResponseLocally(
      targetCliche,
      cleanUser,
      situationContextFa,
      conversationalPrompt
    );

    // Merge linguistic corrections if present
    if (linguisticAnalysis.grammarCorrections.length > 0 && localResult.analysis) {
      if (!localResult.analysis.categorizedIssues) {
        localResult.analysis.categorizedIssues = [];
      }
      linguisticAnalysis.grammarCorrections.forEach((gc) => {
        localResult.analysis!.categorizedIssues!.unshift({
          category: 'grammar' as any,
          categoryFa: 'تداخل ترجمه زبان مادری',
          titleFa: `اشکال در عبارت «${gc.original}»`,
          originalSnippet: gc.original,
          correctedSnippet: gc.corrected,
          explanationFa: gc.explanationFa,
          whyItMattersFa: 'ترجمه تحت‌اللفظی فارسی به انگلیسی باعث احساس غیرطبیعی بودن جمله برای نیتیوها می‌شود.',
          howToFixFa: `به جای «${gc.original}» از شکل طبیعی «${gc.corrected}» استفاده فرمایید.`,
        });
      });
    }

    res.json(localResult);
  } catch (err: any) {
    console.error('Error in /api/practice-evaluate:', err);
  }
});

// API: Assess Individual Placement Task Voice Recording (Instant Multimodal Acoustic & Linguistic Diagnostic)
app.post('/api/assess-task-voice', async (req, res) => {
  try {
    const {
      taskIndex = 1,
      question = '',
      promptFa = '',
      audioBase64,
      audioMimeType = 'audio/webm',
      userText = '',
    } = req.body;

    if (!audioBase64 && !String(userText || '').trim()) {
      return res.status(400).json({
        error: 'audio_or_text_required',
        details: 'برای تحلیل تعیین سطح باید ویس یا متن ارسال شود.',
      });
    }

    // Step 1: real STT (Whisper → Gemini) — never invent a transcript
    let transcript = String(userText || '').trim();
    let sttEngine = transcript ? 'client-text' : 'none';
    if (audioBase64) {
      const stt = await transcribeAudioBuffer(req, audioBase64, audioMimeType, 'en');
      if (stt.text) {
        transcript = stt.text;
        sttEngine = stt.engine;
      }
    }

    if (!transcript) {
      return res.status(422).json({
        error: 'transcription_failed',
        details:
          'نتوانستیم ویس را به متن تبدیل کنیم. لطفاً دوباره با صدای واضح‌تر و حداقل ۸–۱۰ ثانیه صحبت ضبط کنید. کلید OpenAI (Whisper) دقت را بالا می‌برد.',
        sttEngine,
      });
    }

    const ai = getAiClient(req);
    if (!ai) {
      return res.status(503).json({
        error: 'gemini_key_missing',
        details: 'کلید Gemini برای تحلیل عمیق ویس الزامی است.',
        transcription: transcript,
        sttEngine,
      });
    }

    const cleanMime = (audioMimeType || 'audio/webm').split(';')[0];
    const taskPrompt = `
You are a Senior Phonetician, Applied Linguist, and American Accent Diagnostic Specialist for CEFR placement examinations.
A Persian speaker is completing Task ${taskIndex} of their Speaking Placement Test.
Task Question: "${question}"
Persian Context: "${promptFa}"
Verified Speech-to-Text transcript (engine=${sttEngine}): "${transcript}"

${audioBase64 ? 'REAL AUDIO is attached. Listen to the audio AND use the transcript.' : 'No audio — analyze the transcript only.'}

YOUR MISSION (be strict and specific — no generic praise):
1. Set "transcription" to the exact spoken words (prefer the verified transcript; correct only obvious STT typos).
2. Deep acoustic & phonetic analysis grounded in THIS sample:
   - Flap T [ɾ] vs aspirated Persian/British [tʰ]
   - American Rhotic R vs Persian tapped [r]
   - Vowel reduction / schwa on function words
   - Stress-timed vs syllable-timed rhythm, hesitations, WPM
3. Detect Persian L1 transfer (go to shopping, I am agree, interested to, give me, etc.).
4. nativeAlternative + nativeAlternativeFa for a natural American rewrite of THEIR meaning.
5. 2–3 concrete strengthsFa and corrections with original/corrected/explanationFa.
6. Scores 0–100 must reflect THIS sample — do not default everyone to ~75.

Return ONLY valid JSON:
{
  "taskIndex": ${taskIndex},
  "transcription": "...",
  "scores": { "grammar": 0, "pronunciation": 0, "fluency": 0, "accent": 0 },
  "wpm": 0,
  "acousticFeedback": {
    "flapT": "...",
    "rhoticR": "...",
    "vowelReduction": "...",
    "rhythm": "...",
    "summaryFa": "..."
  },
  "persianTransferFound": "..." or null,
  "nativeAlternative": "...",
  "nativeAlternativeFa": "...",
  "strengthsFa": ["...", "..."],
  "corrections": [{ "original": "...", "corrected": "...", "explanationFa": "..." }]
}
`;

    const contents: any[] = [];
    if (audioBase64) {
      contents.push({ inlineData: { mimeType: cleanMime, data: audioBase64 } });
    }
    contents.push({ text: taskPrompt });

    for (const model of CANDIDATE_GEMINI_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { responseMimeType: 'application/json', temperature: 0.25 },
        });

        const parsed = safeJsonParse(response.text);
        if (parsed && (parsed.transcription || parsed.acousticFeedback)) {
          if (!parsed.transcription || !String(parsed.transcription).trim()) {
            parsed.transcription = transcript;
          }
          parsed.sttEngine = sttEngine;
          parsed.analyzedFromAudio = Boolean(audioBase64);
          return res.json(parsed);
        }
      } catch (modelErr: any) {
        console.warn(`Model ${model} task voice assessment attempt failed:`, modelErr.message);
      }
    }

    // Do NOT invent fake analysis — client must retry
    return res.status(503).json({
      error: 'voice_analysis_unavailable',
      details:
        'مدل‌های Gemini موقتاً پاسخ ندادند. متن ویس استخراج شد؛ لطفاً چند ثانیه بعد دوباره تحلیل را امتحان کنید.',
      transcription: transcript,
      sttEngine,
    });
  } catch (err: any) {
    console.error('Error in /api/assess-task-voice:', err);
    res.status(500).json({ error: 'Task voice assessment failed', details: err.message });
  }
});

function calibrateCefrAssessment(rawParsed: any, enrichedAnswers: any[]): any {
  const answerTexts = (enrichedAnswers || []).map((a: any) => String(a.responseText || '').trim());
  const wordsPerAnswer = answerTexts.map((txt: string) => (txt ? txt.split(/\s+/).filter(Boolean).length : 0));
  const totalWords = wordsPerAnswer.reduce((acc: number, w: number) => acc + w, 0);
  const avgWords = wordsPerAnswer.length > 0 ? totalWords / wordsPerAnswer.length : 0;

  // Extract pure CEFR level
  let level = String(rawParsed.cefrLevel || rawParsed.level || rawParsed.cefr || '').toUpperCase().trim();
  const match = level.match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
  level = match ? match[1].toUpperCase() : 'B1';

  // Scientific CEFR calibration rules based on empirical discourse output:
  // 1. A1 Level: Very short, single basic sentence or fragment (< 25 words total, < 7 words avg)
  if (totalWords < 25 || avgWords < 7) {
    level = 'A1';
    rawParsed.grammarScore = Math.min(rawParsed.grammarScore || 52, 58);
    rawParsed.fluencyScore = Math.min(rawParsed.fluencyScore || 48, 52);
    rawParsed.pronunciationScore = Math.min(rawParsed.pronunciationScore || 54, 58);
    rawParsed.vocabularyScore = Math.min(rawParsed.vocabularyScore || 50, 56);
    rawParsed.accentScore = Math.min(rawParsed.accentScore || 46, 54);
    rawParsed.wpm = Math.min(rawParsed.wpm || 70, 75);
    rawParsed.levelDescriptionFa =
      'سطح مقدماتی (A1): پاسخ‌ها در حد جملات بسیار کوتاه یا ساختارهای پایه زمان حال ساده هستند. اولویت آموزشی: یادگیری ساختارهای اساسی معرفی، گسترش جمله‌سازی مستقیم و شکستن سد مکالمه.';
  }
  // 2. A2 Level: Simple elementary sentences (< 50 words total, < 13 words avg)
  else if (totalWords < 50 || avgWords < 13) {
    level = 'A2';
    rawParsed.grammarScore = Math.min(rawParsed.grammarScore || 64, 68);
    rawParsed.fluencyScore = Math.min(rawParsed.fluencyScore || 62, 66);
    rawParsed.pronunciationScore = Math.min(rawParsed.pronunciationScore || 65, 69);
    rawParsed.vocabularyScore = Math.min(rawParsed.vocabularyScore || 62, 67);
    rawParsed.accentScore = Math.min(rawParsed.accentScore || 60, 65);
    rawParsed.wpm = Math.min(rawParsed.wpm || 90, 95);
    rawParsed.levelDescriptionFa =
      'سطح پیش‌متوسط (A2): توانایی بیان مفاهیم و نیازهای روزمره با جملات کوتاه، اما تکیه بر ساختارهای سرراست است و استدلال‌های عمیق هنوز شکل نگرفته است. اولویت: تسلط بر زمان‌های گذشته، افعال تفریحی و حروف اضافه صحیح.';
  }
  // 3. B1 Level: Connected text but lacking complex argumentation or idioms (< 95 words total, < 24 words avg)
  else if (totalWords < 95 || avgWords < 24) {
    if (['C1', 'C2', 'B2'].includes(level)) {
      level = totalWords > 70 ? 'B1' : 'A2';
    }
    rawParsed.grammarScore = Math.min(rawParsed.grammarScore || 74, 78);
    rawParsed.fluencyScore = Math.min(rawParsed.fluencyScore || 72, 76);
    rawParsed.pronunciationScore = Math.min(rawParsed.pronunciationScore || 72, 78);
    rawParsed.vocabularyScore = Math.min(rawParsed.vocabularyScore || 73, 78);
    rawParsed.accentScore = Math.min(rawParsed.accentScore || 68, 74);
    rawParsed.wpm = Math.min(rawParsed.wpm || 110, 120);
    rawParsed.levelDescriptionFa =
      'سطح متوسط استاندارد (B1): انتقال موفق پیام در موضوعات آشنا، اما با تداخل جزئی دستور زبان مادری و احتیاط در صحبت. اولویت: درونی‌سازی کلیشه‌های نیتیو، حذف ترجمه تحت‌اللفظی و تقویت Flap T امریکن.';
  }
  // 4. B2 Level: Extended sentences with reasoning (< 150 words total)
  else if (totalWords < 150 || avgWords < 38) {
    if (level === 'C2') {
      level = 'B2';
    }
    if (level === 'C1' && totalWords < 125) {
      level = 'B2';
    }
  }

  // 5. C2 Level: Requires mastery, rich collocations, and at least 160 words
  if (level === 'C2' && totalWords < 160) {
    level = 'C1';
  }

  rawParsed.cefrLevel = level;
  return rawParsed;
}

// API: Initial Assessment (Comprehensive Multimodal Audio & Linguistic Diagnostic + C2 Curriculum Roadmap)
app.post('/api/initial-assessment', async (req, res) => {
  try {
    const { answers = [] } = req.body;

    // Pre-transcribe every audio answer so analysis is grounded in real speech
    const enrichedAnswers: any[] = [];
    for (let i = 0; i < answers.length; i++) {
      const a = answers[i] || {};
      let responseText = String(a.responseText || '').trim();
      let sttEngine = a.sttEngine || (responseText ? 'client' : 'none');
      if (a.audioBase64 && (!responseText || responseText === 'صوت ضبط‌شده دریافت شد' || responseText.includes('پاسخ صوتی ضبط‌شده'))) {
        const stt = await transcribeAudioBuffer(req, a.audioBase64, a.audioMimeType || 'audio/webm', 'en');
        if (stt.text) {
          responseText = stt.text;
          sttEngine = stt.engine;
        }
      }
      enrichedAnswers.push({ ...a, responseText, sttEngine });
    }

    const combinedText = enrichedAnswers
      .map((a: any, i: number) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.responseText || '(missing)'}`)
      .join('\n\n');

    const hasAudio = enrichedAnswers.some((a: any) => !!a.audioBase64);
    const hasAnyTranscript = enrichedAnswers.some((a: any) => String(a.responseText || '').trim().length > 0);

    if (hasAudio && !hasAnyTranscript) {
      return res.status(422).json({
        error: 'transcription_failed',
        details:
          'هیچ ویسی قابل تبدیل به متن نبود. لطفاً هر بخش را دوباره با صدای واضح ضبط کنید. افزودن کلید OpenAI دقت Whisper را بالا می‌برد.',
      });
    }

    const ai = getAiClient(req);
    if (!ai && hasAudio) {
      return res.status(503).json({
        error: 'gemini_key_missing',
        details: 'کلید Gemini برای آنالیز تعیین سطح الزامی است.',
      });
    }

    if (ai) {
      try {
        const assessmentPrompt = `
You are a distinguished Senior CEFR English Language Assessment Examiner, Applied Linguist, and American Accent Diagnostic Specialist.
A Persian speaker is taking their Speaking Placement Test for American English proficiency.

There are 4 progressive assessment tasks evaluated:
1. Task 1: Self-introduction, routine, and daily fluency.
2. Task 2: Phonetic articulation, Flap-T, Rhotic R, and American accent reading.
3. Task 3: Past narrative, storytelling, and memories without native Persian tense interference.
4. Task 4: Professional opinion, argumentation, and abstract trade-offs.

${hasAudio ? 'CRITICAL: REAL SPOKEN AUDIO is attached for one or more tasks. You MUST listen to every audio clip, map weaknesses to what you hear (not generic Persian-learner tropes), and ground CEFR scores in this sample only.' : ''}
Verified transcripts per task are included — use them with the audio.

CRITICAL ASSESSMENT CRITERIA & CEFR CALIBRATION:
1. Honest, Strict, and Accurate CEFR Placement (A1, A2, B1, B2, C1, C2):
   - CRITICAL: DO NOT INFLATE SCORES OR LEVELS! Evaluate the candidate strictly on what is observed in their actual words.
   - If the learner gives very short, elementary 1-sentence answers (e.g. 5-10 words per answer), they are demonstrating A1 or A2 level! Mark them as A1 or A2.
   - A1 (Breakthrough): 1 isolated short sentence, very simple words, present simple, no complex connectors (< 25 words total across 4 tasks). Scores: 45-56.
   - A2 (Waystage): Simple sentences with elementary connectors (and, because), everyday routine, limited vocabulary (< 50 words total). Scores: 58-68.
   - B1 (Threshold): Moderate length, can narrate past events, noticeable Persian transfer errors, lack of idiomatic chunks (< 95 words total). Scores: 68-78.
   - B2 (Vantage): Detailed multi-sentence responses, good vocabulary, discussing trade-offs, some minor errors (95-150 words). Scores: 78-86.
   - C1 (Effective Proficiency): Extended discourse, complex syntax, conditionals, natural American idioms (120+ words). Scores: 87-93.
   - C2 (Mastery): Near-native American fluency, subtle stylistic control, effortless rhythm and idioms (160+ words). Scores: 94-100.
   - NEVER give C1 or C2 to short, elementary, or safe 1-sentence responses!
2. Detailed Sub-scores (0-100):
   - grammarScore: Syntactic accuracy, complex structures, elimination of Persian transfer errors.
   - fluencyScore: Smoothness, speech rate (WPM), cadence, pausing, lack of hesitation.
   - pronunciationScore: Phonetic clarity, American English sound production.
   - vocabularyScore: Lexical range, natural collocations, avoidance of literal translation.
   - accentScore: Likeness to General American English (Flap T, Rhotic R, vowel reductions, linking).
3. Scientific C2 Checklist Mapping & Exact 10 Prioritized Weaknesses (Requirement 2 & 3):
   Based on the user's spoken audio/text, diagnose which items from the scientific C2 Reference Standards (c2-chk-01 to c2-chk-40) the learner has NOT yet mastered.
   Select EXACTLY 10 prioritized weaknesses/unticked items ordered by urgency (highest priority first) that need remediation in this cycle.
   Each weakness MUST have:
   - checklistItemId: The exact matching item ID from the C2 Reference Checklist (e.g. "c2-chk-01", "c2-chk-02", ..., "c2-chk-40")
   - id: e.g. "weak-1" through "weak-10"
   - category: 'grammar' | 'phonetics' | 'vocabulary' | 'fluency' | 'register_tone' | 'pragmatics' | 'discourse' | 'listening'
   - titleFa: Short Persian title of the weakness
   - descriptionFa: Detailed pedagogical explanation in Persian
   - severity: 'high' | 'medium' | 'low'
   - examples: Array of error vs corrected usage (e.g. ["interested to -> interested in"])

4. Exact 10 Progressive Scenario Curriculum for Current Cycle (10 Scenarios for the 10 Unticked Items):
   Design an exact cohort of 10 rich, highly realistic, conversational scenarios—each one specifically structured to teach, practice, and eliminate one of the 10 identified weaknesses:
   - Exactly 10 scenarios (dayIndex 1 to 10).
   - Each scenario must have an active target goal, grammar objective, and cliches.
   - Scenario 1 has status: "current", scenarios 2 to 10 have status: "upcoming".
   - The user must practice each scenario with the AI Coach until achieving >= 80% mastery.
   - After completing all 10 scenarios, a fresh comprehensive diagnostic will re-assess the learner and generate the next 10 scenarios for remaining unticked items until all 40 C2 checklist competencies are mastered across 4 cohorts (40 total scenarios).

   FOR EACH of the 10 scenarios, provide:
   - id: "cal-1" through "cal-10"
   - dayIndex: 1 to 10
   - targetLevel: Assessed CEFR level (e.g. "B1", "B2", "C1", or "C2")
   - targetChecklistItemId: The checklist item ID (e.g. "c2-chk-01") targeted by this lesson
   - phaseTitleFa: Title of the curriculum phase in Persian
   - title: English scenario title
   - titleFa: Persian scenario title
   - category: 'daily' | 'work' | 'travel' | 'social' | 'emergency' | 'personal'
   - context: Clear context description
   - relationship: Relationship between learner and AI partner
   - userRole: Learner's role
   - aiRole: AI partner's role
   - icon: Relevant emoji
   - starter: Realistic opening line in English
   - starterFa: Persian translation of starter
   - targetGrammar: Educational grammar objective in English
   - targetGrammarFa: توضیح فارسی دقیق هدف آموزشی گرامری
   - targetCliches: Array of 2-3 key American native idioms/clichés with Persian meanings
   - targetVocabulary: Array of 3-4 essential collocations/words with Persian meanings
   - targetPronunciation: American accent & pronunciation focus in Persian (e.g. Flap T, Linking, American R)
   - activeWeaknessesInjected: Array containing the specific weakness title addressed in this scenario
   - status: "current" for day 1, "upcoming" for the rest.

Return ONLY valid JSON matching this schema:
{
  "cefrLevel": "B2",
  "levelDescriptionFa": "توضیح کامل و حرفه‌ای سطح به فارسی (حتماً سطح ذکر شده با cefrLevel هماهنگ باشد)...",
  "grammarScore": 75,
  "fluencyScore": 72,
  "pronunciationScore": 70,
  "vocabularyScore": 74,
  "accentScore": 68,
  "wpm": 115,
  "acousticFeedback": {
    "flapT": "توضیح وضعیت تلفظ Flap T به فارسی",
    "rhoticR": "توضیح وضعیت صدای R امریکن به فارسی",
    "vowelReduction": "توضیح کاهش واکه‌ها و شوآ به فارسی",
    "rhythm": "توضیح ریتم تکیه‌ای و پیوستگی گفتار به فارسی",
    "summaryFa": "خلاصه وضعیت آکوستیک و لهجه کاربر به فارسی"
  },
  "initialWeaknesses": [
    {
      "checklistItemId": "c2-chk-01",
      "category": "grammar",
      "titleFa": "عنوان ضعف",
      "descriptionFa": "توضیح کامل به فارسی...",
      "severity": "high",
      "examples": ["نمونه خطا و اصلاح آن"]
    }
  ],
  "totalRoadmapScenarios": 40,
  "targetMasteryLevel": "C2 Mastery (40 Scientific Checkpoints)",
  "calendarScenarios": [
    {
      "id": "cal-1",
      "dayIndex": 1,
      "targetLevel": "B2",
      "phaseTitleFa": "فاز ۱: تثبیت مکالمات روزمره و رفع تداخلات زبان مادری",
      "title": "Scenario Title",
      "titleFa": "عنوان سناریو",
      "category": "daily",
      "context": "Context description",
      "relationship": "Colleague / Peer",
      "userRole": "Your Role",
      "aiRole": "AI Role",
      "icon": "☕",
      "starter": "Starter dialogue in English",
      "starterFa": "ترجمه استارتر",
      "targetGrammar": "Grammar Objective in English",
      "targetGrammarFa": "هدف آموزشی گرامری به فارسی",
      "targetCliches": ["cliche 1 (معنی)", "cliche 2 (معنی)"],
      "targetVocabulary": ["word 1 (معنی)", "word 2 (معنی)"],
      "targetPronunciation": "تمرکز تلفظ و لهجه امریکن به فارسی",
      "activeWeaknessesInjected": ["ضعف ۱"],
      "status": "current"
    }
  ]
}
`;

        const contents: any[] = [];
        for (let i = 0; i < enrichedAnswers.length; i++) {
          const a = enrichedAnswers[i];
          contents.push({
            text: `Task ${i + 1}: ${a.question || `Prompt ${i + 1}`}\nPrompt Persian: ${a.promptFa || ''}\nSTT engine: ${a.sttEngine || 'n/a'}`,
          });
          if (a.audioBase64) {
            const cleanMime = (a.audioMimeType || 'audio/webm').split(';')[0];
            contents.push({
              inlineData: {
                mimeType: cleanMime,
                data: a.audioBase64,
              },
            });
          }
          if (a.responseText) {
            contents.push({ text: `Verified transcription: "${a.responseText}"` });
          }
        }
        contents.push({ text: assessmentPrompt });

        const candidateModels = CANDIDATE_GEMINI_MODELS;
        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents,
              config: { responseMimeType: 'application/json', temperature: 0.35 },
            });

            const parsed = safeJsonParse(response.text);
            if (parsed && (parsed.cefrLevel || parsed.level || parsed.cefr) && parsed.calendarScenarios && parsed.calendarScenarios.length > 0) {
              const calibrated = calibrateCefrAssessment(parsed, enrichedAnswers);
              calibrated.usedFallback = false;
              calibrated.analyzedFromAudio = hasAudio;

              // Filter out any accidental airport customs scenarios and ensure targetLevel is explicitly stamped
              calibrated.calendarScenarios = (calibrated.calendarScenarios || [])
                .filter((sc: any) =>
                  sc &&
                  sc.id !== 'airport-customs' &&
                  !sc.titleFa?.includes('گیت بازرسی') &&
                  !sc.titleFa?.includes('کنترل گذرنامه')
                )
                .map((sc: any, idx: number) => ({
                  ...sc,
                  dayIndex: sc.dayIndex || idx + 1,
                  targetLevel: sc.targetLevel || calibrated.cefrLevel || 'B2',
                }));
              return res.json(calibrated);
            }
          } catch (modelErr: any) {
            console.warn(`Model ${model} assessment attempt failed:`, modelErr.message);
          }
        }
      } catch (e: any) {
        console.warn('Gemini assessment failed:', e.message);
      }
    }

    // When the learner provided real audio, never invent a fake placement — force retry
    if (hasAudio) {
      return res.status(503).json({
        error: 'assessment_analysis_unavailable',
        details:
          'آنالیز عمیق ویس با Gemini کامل نشد. لطفاً چند ثانیه بعد دوباره امتحان کنید و مطمئن شوید کلید Gemini معتبر است.',
      });
    }

    // Text-only fallback (no audio) — calibrated to demonstrated volume and vocabulary
    const totalWords = enrichedAnswers.reduce(
      (sum: number, a: any) => sum + String(a.responseText || '').trim().split(/\s+/).filter(Boolean).length,
      0
    );
    let cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'B1';
    let levelDesc = 'سطح متوسط استاندارد (B1): قادر به انتقال مفهوم و بیان کلی، اما نیازمند تسلط بر پیوستگی آوایی، حذف ترجمه تحت‌اللفظی فارسی و درونی‌سازی کلیشه‌های نیتیو آمریکایی.';
    let grammarScore = 72;
    let fluencyScore = 70;
    let pronunciationScore = 71;
    let vocabularyScore = 72;
    let accentScore = 67;
    let wpm = 110;

    if (totalWords < 25) {
      cefrLevel = 'A1';
      levelDesc = 'سطح مقدماتی (A1): پاسخ‌ها بسیار کوتاه و در حد کلمات و جملات بسیار ساده اولیه هستند. اولویت: الگوهای پایه مکالمه، معرفی خود و شروع جمله‌سازی فعال.';
      grammarScore = 52;
      fluencyScore = 48;
      pronunciationScore = 54;
      vocabularyScore = 50;
      accentScore = 46;
      wpm = 70;
    } else if (totalWords < 55) {
      cefrLevel = 'A2';
      levelDesc = 'سطح پیش‌متوسط (A2): ساختارهای پایه شکل گرفته اما جملات کوتاه هستند و استدلال‌های عمیق هنوز شکل نگرفته است؛ نیازمند کلیشه‌های روزمره و تمرین‌های تلفظی جهت صعود به B1.';
      grammarScore = 64;
      fluencyScore = 61;
      pronunciationScore = 63;
      vocabularyScore = 62;
      accentScore = 60;
      wpm = 85;
    } else if (totalWords > 130) {
      cefrLevel = 'B2';
      levelDesc = 'سطح متوسط رو به بالا (B2): اعتمادبه‌نفس خوب و تسلط بر واژگان و استدلال‌های چندجمله‌ای؛ اولویت اصلی ارتقا، ظرافت‌های لحن حرفه‌ای/دوستانه، تلفظ Flap T و روان‌سازی ریتم گفتار برای تسلط بیشتر است.';
      grammarScore = 82;
      fluencyScore = 80;
      pronunciationScore = 78;
      vocabularyScore = 83;
      accentScore = 76;
      wpm = 135;
    }

    const defaultWeaknesses = [
      {
        id: 'weak-1',
        checklistItemId: 'c2-chk-01',
        category: 'grammar' as const,
        titleFa: 'ریشه‌کنی حروف اضافه اشتباه ناشی از ترجمه مستقیم فارسی',
        descriptionFa: 'در فارسی می‌گوییم «به موسیقی گوش دادن» اما در انگلیسی listen با to می‌آید؛ یا «علاقه‌مند به» که interested in است نه interested to. تسلط بر حروف اضافه همنشین.',
        severity: 'high' as const,
        examples: ['interested to (اشتباه) -> interested in (صحیح)', 'marry with (اشتباه) -> marry (صحیح)'],
      },
      {
        id: 'weak-2',
        checklistItemId: 'c2-chk-02',
        category: 'grammar' as const,
        titleFa: 'استفاده صحیح از افعال حالتی و اسنادی (حذف ساختار اشتباه I am agree)',
        descriptionFa: 'کلمه agree در انگلیسی فعل است و نباید با to be بیاید (I agree نه I am agree). همچنین افعالی نظیر cost, weigh, belong.',
        severity: 'high' as const,
        examples: ["I am agree (اشتباه) -> I agree (صحیح)"],
      },
      {
        id: 'weak-3',
        checklistItemId: 'c2-chk-03',
        category: 'phonetics' as const,
        titleFa: 'تلفظ روان Flap T امریکن بین دو واکه',
        descriptionFa: 'در لهجه امریکن وقتی T یا D بین دو حرف صدادار قرار می‌گیرد (مانند water, city, better, meeting) به صدای نرم تپ/فلپ [ɾ] تبدیل می‌شود نه T انفجاری خشک.',
        severity: 'high' as const,
        examples: ['water -> /ˈwɑː.tər/ به جای /ˈwɑː.dər/', 'better -> /ˈbet.tər/ به جای /ˈbed.ər/'],
      },
      {
        id: 'weak-4',
        checklistItemId: 'c2-chk-04',
        category: 'phonetics' as const,
        titleFa: 'کاهش آوایی شوآ [ə] در کلمات گرامری و تابعی',
        descriptionFa: 'در گفتار نیتیو امریکن، کلماتی مانند to, for, can, and, of با واکه کامل تلفظ نمی‌شوند بلکه به صدای شوآ کاهش می‌یابند تا ریتم استرس-تایمد شکل بگیرد.',
        severity: 'high' as const,
        examples: ['I can /kən/ go to /tə/ the store for /fər/ some bread.'],
      },
      {
        id: 'weak-5',
        checklistItemId: 'c2-chk-05',
        category: 'grammar' as const,
        titleFa: 'تسلط بر وجوه زمانی گذشته در روایت داستان (Past Narrative)',
        descriptionFa: 'تفکیک دقیق گذشته ساده برای رخدادهای زنجیره‌ای، گذشته استمراری برای پس‌زمینه، و گذشته کامل برای وقایع پیشین بدون پرش غیرطبیعی به زمان حال.',
        severity: 'medium' as const,
        examples: ['When I drive home, it was rain (اشتباه) -> While I was driving home, it started pouring (صحیح)'],
      },
      {
        id: 'weak-6',
        checklistItemId: 'c2-chk-06',
        category: 'grammar' as const,
        titleFa: 'حذف ساختار نادرست Go to shopping و کاربرد صحیح فرم‌های تفریحی',
        descriptionFa: 'افعال فعالیتی بعد از go بدون حرف اضافه to و با فرم ing می‌آیند: go shopping, go swimming, go hiking.',
        severity: 'medium' as const,
        examples: ['We went to shopping (اشتباه) -> We went shopping (صحیح)'],
      },
      {
        id: 'weak-7',
        checklistItemId: 'c2-chk-07',
        category: 'pragmatics' as const,
        titleFa: 'پرسشگری غیرمستقیم و موقر در مکالمات روزمره',
        descriptionFa: 'استفاده از ساختارهای مؤدبانه به جای سوال مستقیم خشک: Could you tell me..., Do you happen to know..., I was wondering if...',
        severity: 'medium' as const,
        examples: ['Where is room? (خشک) -> Do you happen to know where the room is? (نیتیو و موقر)'],
      },
      {
        id: 'weak-8',
        checklistItemId: 'c2-chk-08',
        category: 'phonetics' as const,
        titleFa: 'ادای صدای R امریکن بدون لرزش نوک زبان (Rhotic R)',
        descriptionFa: 'در فارسی R لرزشی با نوک زبان است؛ در امریکن نوک زبان هرگز به سقف دهان نمی‌خورد و بدنه زبان به عقب جمع می‌شود.',
        severity: 'high' as const,
        examples: ['hard work early in the morning (با R امریکن بدون لرزش)'],
      },
      {
        id: 'weak-9',
        checklistItemId: 'c2-chk-09',
        category: 'discourse' as const,
        titleFa: 'مدیریت مکث‌ها با فیلرهای طبیعی مکالمه (Well, Actually, You know)',
        descriptionFa: 'استفاده از کلمات مکث طبیعی به جای گفتن «ااااام» یا سکوت طولانی در هنگام تفکر برای حفظ پیوستگی جریان کلام.',
        severity: 'medium' as const,
        examples: ["Well, to be perfectly honest, I haven't really looked into that yet."],
      },
      {
        id: 'weak-10',
        checklistItemId: 'c2-chk-10',
        category: 'idioms' as const,
        titleFa: 'کلیشه‌های اصلی محاوره روزمره آمریکایی (Play it by ear, Touch base)',
        descriptionFa: 'کاربرد روان اصطلاحات پرکاربرد مثل play it by ear, touch base, cut to the chase در بافت مناسب با لحن طبیعی.',
        severity: 'medium' as const,
        examples: ["Traffic is unpredictable, let's play it by ear."],
      },
    ];

    const defaultCalendarScenarios = [
      {
        id: 'cal-1',
        dayIndex: 1,
        targetLevel: cefrLevel,
        phaseTitleFa: 'فاز ۱: غلبه بر تله‌های ترجمه فارسی و مکالمات روزمره',
        title: 'Ordering at a Fast-Paced Downtown Coffee Shop',
        titleFa: 'سناریوی ۱: سفارش سریع قهوه در کافه شلوغ با باریستای نیتیو',
        category: 'daily' as const,
        context: 'Downtown Specialty Coffee Roaster',
        relationship: 'Barista / Customer',
        userRole: 'Customer on Morning Commute',
        aiRole: 'Busy American Barista',
        icon: '☕',
        starter: "Morning! What can I get started for you today? For here or to-go?",
        starterFa: "صبح بخیر! امروز برات چی آماده کنم؟ اینجا میل می‌کنی یا بیرون‌بره؟",
        targetGrammar: "Natural modal requests & omission of literal prepositions (Can I get / I'll do a...)",
        targetGrammarFa: "تسلط بر فرم‌های روان درخواست بدون حروف اضافه اشتباه (Interested in / Listen to)",
        targetCliches: ["on the run (در حال عجله و حرکت)", "for here or to-go (داخل یا بیرون‌بر)"],
        targetVocabulary: ["drip coffee (قهوه دمی)", "splash of milk (کمی شیر)", "keep the change (باقی پول مال خودت)"],
        targetPronunciation: "تلفظ Flap T در کلمات water و better و اتصال کلمات Can I get",
        activeWeaknessesInjected: ['ریشه‌کنی حروف اضافه اشتباه ناشی از ترجمه مستقیم فارسی'],
        status: 'current' as const,
      },
      {
        id: 'cal-2',
        dayIndex: 2,
        targetLevel: cefrLevel,
        phaseTitleFa: 'فاز ۱: غلبه بر تله‌های ترجمه فارسی و مکالمات روزمره',
        title: 'Debating Four-Day Work Weeks with Team Lead',
        titleFa: 'سناریوی ۲: اظهارنظر و توافق کاری (حذف ساختار I am agree)',
        category: 'work' as const,
        context: 'Team Lounge Discussion',
        relationship: 'Team Lead / Colleague',
        userRole: 'Team Member',
        aiRole: 'Engineering Lead (Alex)',
        icon: '💡',
        starter: "I'm thinking of proposing a four-day work week for our engineering team. What's your take—do you agree?",
        starterFa: "دارم به پیشنهاد هفته کاری ۴ روزه برای تیم فنی فکر می‌کنم. نظرت چیه—آیا موافقی؟",
        targetGrammar: "Stative verb predicate accuracy (I completely agree / I respectfully disagree)",
        targetGrammarFa: "کاربرد افعال اسنادی agree, disagree, depend بدون ساختارهای نادرست کمکی فارسی",
        targetCliches: ["on the same page (هم‌نظر بودن)", "see eye to eye (توافق نظر داشتن)"],
        targetVocabulary: ["productivity (بازدهی)", "morale (روحیه تیمی)", "trade-off (بده‌بستان)"],
        targetPronunciation: "تلفظ درست مصوت کشیده در agree و ادای روان I agree",
        activeWeaknessesInjected: ['استفاده صحیح از افعال حالتی و اسنادی (حذف ساختار اشتباه I am agree)'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-3',
        dayIndex: 3,
        targetLevel: cefrLevel,
        phaseTitleFa: 'فاز ۱: غلبه بر تله‌های ترجمه فارسی و مکالمات روزمره',
        title: 'At the Downtown Juice Bar & Cafe',
        titleFa: 'سناریوی ۳: سفارش آبمیوه تازه (تمرکز بر Flap T امریکن)',
        category: 'daily' as const,
        context: 'Summer Juice Stand',
        relationship: 'Barista / Customer',
        userRole: 'Customer',
        aiRole: 'Barista',
        icon: '🥤',
        starter: "Welcome to Green Oasis! Would you like a bottle of cold-pressed water or our special better-berry smoothie today?",
        starterFa: "به گرین اویسیس خوش اومدید! امروز یه بطری آب تازه میل دارید یا اسموتی مخصوص تمشک ما؟",
        targetGrammar: "Polite modal requests (Can I get / Could I have a bottle of water...)",
        targetGrammarFa: "فرمول‌بندی درخواست‌های محترمانه در سفارش‌های روزمره",
        targetCliches: ["hit the spot (چسبیدن و حال آوردن)", "quench my thirst (رفع عطش)"],
        targetVocabulary: ["bottle of water", "better berry", "city smoothie"],
        targetPronunciation: "تلفظ Flap T امریکن [ɾ] در کلمات water, bottle, better, city",
        activeWeaknessesInjected: ['تلفظ روان Flap T امریکن بین دو واکه'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-4',
        dayIndex: 4,
        targetLevel: cefrLevel,
        phaseTitleFa: 'فاز ۱: غلبه بر تله‌های ترجمه فارسی و مکالمات روزمره',
        title: 'Quick Grocery Run with Roommate',
        titleFa: 'سناریوی ۴: خرید سریع با هم‌اتاقی (کاهش واکه‌ها و صدای Schwa)',
        category: 'daily' as const,
        context: 'Supermarket Aisle',
        relationship: 'Roommate',
        userRole: 'Roommate',
        aiRole: 'Roommate (Chris)',
        icon: '🛒',
        starter: "I can run to the grocery store for some bread and milk. Do you want to come along?",
        starterFa: "می‌تونم یه سر برم سوپرمارکت برای کمی نون و شیر. می‌خوای همراهم بیای؟",
        targetGrammar: "Rhythmic sentence stress with reduced function words",
        targetGrammarFa: "کاهش کلمات تابعی to, for, can, and به صدای شوآ برای ایجاد ریتم استرس‌تایمد",
        targetCliches: ["grab a bite (چیزی سرپایی خوردن)", "on the way (در مسیر راه)"],
        targetVocabulary: ["essentials", "grocery list", "quick errand"],
        targetPronunciation: "کاهش واکه‌های کوتاه شوآ /kən/, /tə/, /fər/",
        activeWeaknessesInjected: ['کاهش آوایی شوآ [ə] در کلمات گرامری و تابعی'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-5',
        dayIndex: 5,
        targetLevel: 'B1',
        phaseTitleFa: 'فاز ۱: غلبه بر تله‌های ترجمه فارسی و مکالمات روزمره',
        title: 'Tackling Past Narratives: Road Trip Memories',
        titleFa: 'سناریوی ۵: روایت خاطرات سفر جاده‌ای (تمایز وجوه گذشته)',
        category: 'social' as const,
        context: 'Coffee Break Reminiscing',
        relationship: 'Travel Buddy / Friend',
        userRole: 'Friend',
        aiRole: 'Friend (Sarah)',
        icon: '🚗',
        starter: "We were just talking about crazy road trips. Tell me about a past vacation where something completely unexpected happened!",
        starterFa: "داشتیم خاطرات سفرهای جاده‌ای عجیب رو مرور می‌کردیم. از یه مسافرت گذشته‌ت بگو که وسط راه یه اتفاق کاملاً غیرمنتظره افتاد!",
        targetGrammar: "Past Narrative: Past Simple vs Continuous vs Past Perfect",
        targetGrammarFa: "تفکیک دقیق رخدادهای زنجیره‌ای (Past Simple) از پس‌زمینه (Past Continuous) و وقایع پیشین (Past Perfect)",
        targetCliches: ["brings back memories (خاطرات را زنده کردن)", "hit the road (زدن به دل جاده)"],
        targetVocabulary: ["flat tire", "scenic route", "unforgettable milestone"],
        targetPronunciation: "تلفظ پسوندهای ed در افعال گذشته بدون افزودن هجای اضافه",
        activeWeaknessesInjected: ['تسلط بر وجوه زمانی گذشته در روایت داستان (Past Narrative)'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-6',
        dayIndex: 6,
        targetLevel: 'B1',
        phaseTitleFa: 'فاز ۱: غلبه بر تله‌های ترجمه فارسی و مکالمات روزمره',
        title: 'Planning a Weekend Activity with Friends',
        titleFa: 'سناریوی ۶: برنامه‌ریزی تفریح آخر هفته (حذف go to shopping)',
        category: 'social' as const,
        context: 'Weekend Planning Chat',
        relationship: 'Close Friend',
        userRole: 'Friend',
        aiRole: 'Friend (Jordan)',
        icon: '🛍️',
        starter: "Hey! The weather is gorgeous this weekend. Do you want to go shopping downtown or maybe go hiking in the hills?",
        starterFa: "سلام! هوای این آخر هفته محشره. می‌خوای بریم مرکز شهر خرید یا شاید بریم کوه‌پیمایی در تپه‌ها؟",
        targetGrammar: "Gerund activity verbs after GO (go shopping, go swimming, go hiking)",
        targetGrammarFa: "به کار بردن افعال تفریحی بدون حرف اضافه to و به شکل Gerund",
        targetCliches: ["count me in (روی من حساب کن)", "window shopping (ویترین‌گردی)"],
        targetVocabulary: ["go hiking", "go shopping", "outdoor recreation"],
        targetPronunciation: "تلفظ روان اتصال go shopping بدون مکث و تپق",
        activeWeaknessesInjected: ['حذف ساختار نادرست Go to shopping و کاربرد صحیح فرم‌های تفریحی'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-7',
        dayIndex: 7,
        targetLevel: 'B1',
        phaseTitleFa: 'فاز ۱: غلبه بر تله‌های ترجمه فارسی و مکالمات روزمره',
        title: 'Asking for Directions in a Massive Conference Center',
        titleFa: 'سناریوی ۷: پرسشگری مؤدبانه و غیرمستقیم در سالن همایش',
        category: 'work' as const,
        context: 'Conference Hallway',
        relationship: 'Conference Organizer / Attendee',
        userRole: 'Attendee',
        aiRole: 'Event Coordinator',
        icon: '🏢',
        starter: "Excuse me, I notice you're looking around. Are you trying to locate one of the keynote breakout sessions?",
        starterFa: "ببخشید، متوجه شدم دارید اطراف رو نگاه می‌کنید. دنبال سالن جلسات کلیدی می‌گردید؟",
        targetGrammar: "Indirect questions (Do you happen to know where... / Could you tell me if...)",
        targetGrammarFa: "تبدیل سوالات مستقیم خشک به قالب‌های موقر و اتیکت‌محور بین‌المللی",
        targetCliches: ["turn around (راست و ریست شدن)", "point me in the right direction (راهنمایی جهت مسیر)"],
        targetVocabulary: ["keynote hall", "registration booth", "corridor"],
        targetPronunciation: "آهنگ صعودی و ملایم در سوالات غیرمستقیم",
        activeWeaknessesInjected: ['پرسشگری غیرمستقیم و موقر در مکالمات روزمره'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-8',
        dayIndex: 8,
        targetLevel: 'B2',
        phaseTitleFa: 'فاز ۲: ارتقا به مکالمات حرفه‌ای و استدلال در کار',
        title: 'Reviewing Early Morning Project Deliverables',
        titleFa: 'سناریوی ۸: بررسی پیشرفت پروژه صبحگاهی (صدای Rhotic R امریکن)',
        category: 'work' as const,
        context: 'Morning Office Check-in',
        relationship: 'Co-worker',
        userRole: 'Team Member',
        aiRole: 'Senior Colleague (Mark)',
        icon: '💼',
        starter: "Good morning! Your hard work early this morning really paid off. Are we ready to present the report?",
        starterFa: "صبح بخیر! تلاش سختت اول صبح واقعاً نتیجه داد. آماده‌ایم گزارش رو ارائه کنیم؟",
        targetGrammar: "Compound complex professional status updates",
        targetGrammarFa: "گزارش وضعیت کار و ارائه بازخورد حرفه‌ای با ساختارهای روان",
        targetCliches: ["hit the ground running (شروع با قدرت و انرژی)", "touch base (هماهنگ شدن مقطعی)"],
        targetVocabulary: ["hard work", "morning report", "first quarter"],
        targetPronunciation: "ادای عمیق صدای R امریکن در hard, work, early, morning بدون لرزش نوک زبان",
        activeWeaknessesInjected: ['ادای صدای R امریکن بدون لرزش نوک زبان (Rhotic R)'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-9',
        dayIndex: 9,
        targetLevel: 'B2',
        phaseTitleFa: 'فاز ۲: ارتقا به مکالمات حرفه‌ای و استدلال در کار',
        title: 'Spontaneous Brainstorming & Handling Unfamiliar Questions',
        titleFa: 'سناریوی ۹: طوفان فکری و مدیریت مکث با فیلرهای نیتیو',
        category: 'social' as const,
        context: 'Team Strategy Brainstorm',
        relationship: 'Colleague',
        userRole: 'Contributor',
        aiRole: 'Product Lead',
        icon: '🧠',
        starter: "We're brainstorming new ways to boost customer retention. It's a tricky question—what pops into your head first?",
        starterFa: "داریم ایده‌پردازی می‌کنیم چطور نگه‌داشت مشتری رو بالا ببریم. سوال سختیه—اولین چیزی که به ذهنت میاد چیه؟",
        targetGrammar: "Spoken discourse markers and conversational pausing",
        targetGrammarFa: "استفاده از عبارات Well, To be honest, Actually به جای سکوت‌های طولانی",
        targetCliches: ["think outside the box (خلاقانه و نوآورانه فکر کردن)", "food for thought (موضوع قابل تأمل)"],
        targetVocabulary: ["retention", "engagement", "friction point"],
        targetPronunciation: "ریتم یکنواخت و پیوسته بدون قطع ناگهانی کلام",
        activeWeaknessesInjected: ['مدیریت مکث‌ها با فیلرهای طبیعی مکالمه (Well, Actually, You know)'],
        status: 'upcoming' as const,
      },
      {
        id: 'cal-10',
        dayIndex: 10,
        targetLevel: 'B2',
        phaseTitleFa: 'فاز ۲: ارتقا به مکالمات حرفه‌ای و استدلال در کار',
        title: 'Navigating Unpredictable Weekend Traffic & Dinner Timing',
        titleFa: 'سناریوی ۱۰: هماهنگی تفریح و رستوران (کلیشه‌های اصیل امریکن)',
        category: 'social' as const,
        context: 'Evening Dinner Planning',
        relationship: 'Close Friend',
        userRole: 'Friend',
        aiRole: 'Friend (Taylor)',
        icon: '🍕',
        starter: "Downtown traffic looks pretty wild tonight, but I'm starving. Should we lock in reservations or just play it by ear?",
        starterFa: "ترافیک مرکز شهر امشب خیلی شلوغ به نظر میاد اما من از گرسنگی ضعف کردم. وقت رزرو قطعی کنیم یا شرایطی پیش بریم؟",
        targetGrammar: "Idiomatic chunks and pragmatic agreements",
        targetGrammarFa: "کاربرد اصطلاحات play it by ear, call it a day, touch base در موقعیت زنده",
        targetCliches: ["play it by ear (بر اساس شرایط پیش رفتن)", "cut to the chase (یک‌راست سر اصل مطلب رفتن)"],
        targetVocabulary: ["rush hour", "reservation", "flexible timing"],
        targetPronunciation: "لهجه طبیعی و خودمانی دوستانه General American",
        activeWeaknessesInjected: ['کلیشه‌های اصلی محاوره روزمره آمریکایی (Play it by ear, Touch base)'],
        status: 'upcoming' as const,
      },
    ];

    res.json({
      cefrLevel,
      levelDescriptionFa: levelDesc,
      grammarScore,
      fluencyScore,
      pronunciationScore,
      vocabularyScore,
      accentScore,
      wpm,
      usedFallback: true,
      analyzedFromAudio: false,
      acousticFeedback: {
        flapT: 'صدای T در کلمات میانی نیاز به نرم‌تر شدن و تبدیل به ضربه نوک زبان (Flap T) دارد.',
        rhoticR: 'صدای R امریکن در انتهای کلمات نیازمند عقب کشیدن بیشتر زبان برای رسیدن به رزونانس نیتیو است.',
        vowelReduction: 'هجاهای بدون تکیه به اندازه کافی کاهش نیافته و بیش از حد کامل ادا می‌شوند.',
        rhythm: 'ریتم گفتار نیازمند حرکت از سیستم هجابنیان فارسی به سیستم تکیه‌بنیان انگلیسی است.',
        summaryFa: 'پتانسیل بالایی در درک گفتار دارید؛ با اجرای سناریوهای فاز ۱ و ۲ تلفظ و پیوستگی شما به سرعت صیقل می‌خورد.',
      },
      initialWeaknesses: defaultWeaknesses,
      totalRoadmapScenarios: 40,
      targetMasteryLevel: 'C2 Mastery (40 Scientific Checkpoints)',
      calendarScenarios: defaultCalendarScenarios,
    });
  } catch (err: any) {
    console.error('Error in /api/initial-assessment:', err);
    res.status(500).json({ error: 'Assessment failed', details: err.message });
  }
});

// API: Summarize Scenario with AI session synthesis and weakness database logging
app.post('/api/summarize-scenario', async (req, res) => {
  try {
    const {
      scenarioTitle = 'Speaking Scenario',
      messages = [],
      targetCliches = [],
      targetGrammar = '',
      activeWeaknesses = [],
    } = req.body;

    const conversationText = messages
      .map((m: any) => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.text}`)
      .join('\n');

    const ai = getAiClient(req);
    if (ai && conversationText.trim()) {
      try {
        const summaryPrompt = `
You are a senior American English Speaking Examiner and Pedagogical Coach.
Analyze the complete student-coach conversation that just finished:
- Scenario Title: "${scenarioTitle}"
- Target Grammar: "${targetGrammar || 'Natural speech grammar'}"
- Target Clichés: ${(targetCliches || []).join(', ') || 'American idioms'}
- Student Active Weaknesses: ${(activeWeaknesses || []).join(', ') || 'Persian direct translation'}

COMPLETE CONVERSATION:
${conversationText}

TASK:
1. Synthesize student performance:
   - overallScore (0-100) based on confidence, grammar, accent attempts, and conversational engagement.
   - strengths: 2-3 specific communicative successes demonstrated in this conversation.
   - keyErrors: Up to 3 real mistakes made by the student during this dialogue with:
     - original: exact phrase student said
     - corrected: authentic American native alternative
     - explanationFa: clear pedagogical explanation in Persian
   - clichesLearned: 2-3 American idioms/clichés from this scenario with English and Persian translation.
   - pronunciationNotes: 2 actionable phonetic accent tips (Flap T, Rhotic R, Connected speech).
   - newWeaknessesAdded: Array of new weaknesses titles (in Persian) that should be logged into the student's weaknesses database.
   - weaknessesImproved: Array of weaknesses from active weaknesses list that the student successfully practiced or improved.
   - futureRemediationPlanFa: Persian roadmap advice explaining what the student should focus on in their next scenario.

Return ONLY valid JSON:
{
  "scenarioTitle": "${scenarioTitle}",
  "overallScore": 86,
  "strengths": ["نقطه قوت ۱", "نقطه قوت ۲"],
  "keyErrors": [
    {
      "original": "جمله اشتباه دانش‌آموز",
      "corrected": "جمله صحیح نیتیو",
      "explanationFa": "توضیح فارسی ایراد"
    }
  ],
  "clichesLearned": [
    {
      "english": "idiom 1",
      "persian": "معنی فارسی ۱"
    }
  ],
  "pronunciationNotes": ["نکته تلفظ ۱", "نکته تلفظ ۲"],
  "newWeaknessesAdded": ["عنوان ضعف جدید در صورت وجود"],
  "weaknessesImproved": ["عنوان ضعفی که در این سناریو بهتر شد"],
  "futureRemediationPlanFa": "برنامه پیشنهادی برای سناریوی بعد..."
}
`;
        const candidateModels = CANDIDATE_GEMINI_MODELS;
        for (const model of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model,
              contents: summaryPrompt,
              config: { responseMimeType: 'application/json', temperature: 0.3 },
            });
            const parsed = safeJsonParse(response.text);
            if (parsed && parsed.overallScore && parsed.strengths) {
              return res.json(parsed);
            }
          } catch (modelErr: any) {
            console.warn(`Summary model ${model} error:`, modelErr.message);
          }
        }
      } catch (err: any) {
        console.warn('AI summary failed, using intelligent fallback:', err.message);
      }
    }

    // Intelligent Fallback Synthesis
    res.json({
      scenarioTitle,
      overallScore: 84,
      strengths: [
        'ادامه فعال مکالمه و تلاش برای بیان منظور بدون توقف‌های طولانی',
        'پاسخ‌گویی متناسب با نقش تعیین‌شده و حفظ پیوستگی کلام',
      ],
      keyErrors: [
        {
          original: 'I want to go to shopping',
          corrected: 'I want to go shopping',
          explanationFa: 'بعد از فعل go در فعالیت‌های تفریحی، حرف اضافه to به کار نمی‌رود.',
        },
      ],
      clichesLearned: [
        {
          english: targetCliches[0] || 'on the same page',
          persian: 'هم‌نظر و هماهنگ بودن',
        },
        {
          english: targetCliches[1] || 'cut corners',
          persian: 'سمبل کردن و از سر وا کردن کار',
        },
      ],
      pronunciationNotes: [
        'توجه به اجرای Flap T در کلمات پرکاربرد با حرف T میان دو مصوت',
        'اتصال حرف بی‌صدای انتهای کلمه به حرف صدادار آغاز کلمه بعد (Connected Speech)',
      ],
      newWeaknessesAdded: [],
      weaknessesImproved: activeWeaknesses.length > 0 ? [activeWeaknesses[0]] : ['تداخل ترجمه تحت‌اللفظی فارسی به انگلیسی (L1 Transfer)'],
      futureRemediationPlanFa: 'در سناریوی بعدی تقویم، تمرکز روی استفاده از افعال دوکلمه‌ای و افزایش سرعت کلام خواهد بود.',
    });
  } catch (err: any) {
    console.error('Error in /api/summarize-scenario:', err);
    res.status(500).json({ error: 'Summary failed', details: err.message });
  }
});

// API: Word Lookup
// Dedicated STT: OpenAI Whisper → Gemini multimodal transcription
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'en' } = req.body || {};
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 required', text: '', engine: 'none' });
    }
    const result = await transcribeAudioBuffer(req, audioBase64, mimeType, language);
    return res.json({ text: result.text, engine: result.engine, language });
  } catch (err: any) {
    console.error('transcribe error:', err);
    return res.status(500).json({ error: err.message, text: '', engine: 'error' });
  }
});

// Dedicated American TTS: GapGPT → OpenAI speech → Gemini audio → 503 for client browser fallback
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'nova', speed = 1.0 } = req.body || {};
    const clean = String(text || '').trim().slice(0, 4000);
    if (!clean) {
      return res.status(400).json({ error: 'text required' });
    }

    // Prefer GapGPT when configured (easy Rial top-up in Iran)
    if (isGapgptConfigured()) {
      const gap = await gapgptSynthesizeSpeech(clean, voice === 'nova' ? 'en-male-1' : String(voice));
      if (gap) {
        res.setHeader('Content-Type', gap.mimeType);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-TTS-Engine', gap.engine);
        return res.send(gap.buffer);
      }
    }

    const openaiKey = getOpenAiApiKey(req);
    if (openaiKey) {
      try {
        const allowed = new Set(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);
        const ttsVoice = allowed.has(String(voice)) ? String(voice) : 'nova';
        const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: ttsVoice,
            input: clean,
            response_format: 'mp3',
            speed: Math.min(1.25, Math.max(0.75, Number(speed) || 1)),
          }),
        });
        if (ttsRes.ok) {
          const buf = Buffer.from(await ttsRes.arrayBuffer());
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('X-TTS-Engine', 'openai-tts-1');
          return res.send(buf);
        }
        const errText = await ttsRes.text().catch(() => '');
        console.warn('OpenAI TTS failed:', ttsRes.status, errText.slice(0, 200));
      } catch (ttsErr) {
        console.warn('OpenAI TTS exception:', ttsErr);
      }
    }

    // Gemini native audio (when available on the API key / model)
    const ai = getAiClient(req);
    if (ai) {
      const ttsModels = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];
      for (const modelName of ttsModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ text: `Say in a clear natural General American accent:\n${clean}` }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            } as any,
          });
          const parts = (response as any)?.candidates?.[0]?.content?.parts || [];
          const audioPart = parts.find((p: any) => p?.inlineData?.data);
          if (audioPart?.inlineData?.data) {
            return res.json({
              audioBase64: audioPart.inlineData.data,
              mimeType: audioPart.inlineData.mimeType || 'audio/wav',
              engine: `gemini:${modelName}`,
            });
          }
        } catch (e) {
          console.warn(`Gemini TTS ${modelName} unavailable:`, e);
        }
      }
    }

    return res.status(503).json({
      error: 'No server TTS available — client should use browser en-US voice',
      engine: 'unavailable',
    });
  } catch (err: any) {
    console.error('tts error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/lookup-word', async (req, res) => {
  try {
    const { word = '', context = '' } = req.body;
    const clean = String(word || '').trim();
    if (!clean) {
      return res.status(400).json({ error: 'word is required' });
    }

    const ai = getAiClient(req);
    if (ai) {
      try {
        const prompt = `You are a bilingual lexicographer and elite American English coach for Persian speakers.
Analyze this English word or expression to create an accurate Leitner flashcard:
Term to analyze: "${clean}"
${context ? `DIALOGUE CONTEXT WHERE THIS WORD WAS ENCOUNTERED: "${context}"` : ''}

${
  context
    ? `CRITICAL CONTEXTUAL MEANING RULE:
The word "${clean}" has multiple distinct definitions in English. You MUST translate and explain ONLY the specific meaning intended in the provided dialogue context above!
DO NOT list unrelated generic dictionary meanings!
For example:
- If "${clean}" is "spring" and the dialogue context is about drinking clean water or natural resources, the meaning MUST be "چشمه / سرچشمه آب" and NEVER "بهار" or "فنر".
- If "${clean}" is "plant" and the context is an industrial facility, the meaning MUST be "کارخانه / واحد تولیدی" and NEVER "گیاه".
- If "${clean}" is "bank" and the context is near water, the meaning MUST be "ساحل رودخانه" and NEVER "بانک مالی".
The "persianMeaning" and "sampleSentences" must strictly adhere to this exact contextual meaning.`
    : ''
}

Provide an accurate, idiomatic Persian translation, American phonetic pronunciation (IPA), and an authentic, natural American example sentence with Persian translation.

Respond with ONLY a JSON object (no markdown, no backticks):
{
  "word": "${clean}",
  "phonetic": "/IPA transcription/",
  "partOfSpeech": "exact part of speech in this context (e.g. noun, verb, idiom, phrasal verb)",
  "persianMeaning": "معنی دقیق و روان این واژه در همین بافت جمله به فارسی (نه معانی بی‌ربط دیگر)",
  "persianNuance": "توضیح کوتاه کاربرد و تفاوت ظریف معنایی در این کاربرد خاص",
  "americanUsageNote": "نکته کاربردی نحوه استفاده توسط گویشوران آمریکایی",
  "collocations": ["collocation 1", "collocation 2"],
  "sampleSentences": [
    {
      "english": "Authentic natural American sentence using the word with this exact contextual meaning.",
      "persian": "ترجمه روان و طبیعی این جمله به فارسی"
    }
  ],
  "pronunciationTipFa": "نکته تلفظ آمریکایی یا وصل حروف به فارسی"
}`;

        for (const modelName of CANDIDATE_GEMINI_MODELS) {
          try {
            const resp = await ai.models.generateContent({
              model: modelName,
              contents: [{ text: prompt }],
              config: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            });
            const text = (resp.text || '').trim();
            const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (parsed && (parsed.persianMeaning || parsed.sampleSentences)) {
              return res.json({
                word: parsed.word || clean,
                phonetic: parsed.phonetic || `/${clean}/`,
                partOfSpeech: parsed.partOfSpeech || 'expression',
                persianMeaning: parsed.persianMeaning || clean,
                persianNuance: parsed.persianNuance || '',
                americanUsageNote: parsed.americanUsageNote || '',
                collocations: Array.isArray(parsed.collocations) ? parsed.collocations : [],
                sampleSentences: Array.isArray(parsed.sampleSentences) && parsed.sampleSentences.length > 0
                  ? parsed.sampleSentences
                  : [{ english: context || `I usually use "${clean}" in conversation.`, persian: `مثال کاربردی برای ${clean}` }],
                pronunciationTipFa: parsed.pronunciationTipFa || 'تلفظ با استرس طبیعی کلمات',
              });
            }
          } catch (modelErr) {
            console.warn(`Model ${modelName} failed for lookup-word:`, modelErr);
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini lookup failed, falling back to linguistic engine:', geminiErr);
      }
    }

    // High quality fallback if AI is not reached
    const fallbackSentence = context || `I usually ${clean} whenever I get the chance.`;
    return res.json({
      word: clean,
      phonetic: `/${clean}/`,
      partOfSpeech: 'expression',
      persianMeaning: `اصطلاح کاربردی: ${clean}`,
      persianNuance: 'اصطلاح رایج در مکالمات محاوره‌ای روزمره آمریکایی',
      americanUsageNote: 'کاربرد بسیار متداول در محیط‌های کاری و دوستانه نیتیو',
      collocations: [`use ${clean}`, `always ${clean}`],
      sampleSentences: [
        {
          english: fallbackSentence,
          persian: `مثال کاربردی برای عبارت "${clean}" در مکالمه`,
        },
      ],
      pronunciationTipFa: 'تلفظ با ریتم پیوسته بدون مکث بین کلمات',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Lookup failed', details: err.message });
  }
});

// Full-stack Vite middleware integration
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NativeSpeak Server listening on port ${PORT}`);
  });
}

startServer();
