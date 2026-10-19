import { C2ChecklistItem, C2_SCIENTIFIC_CHECKLIST } from '../data/c2Checklist';
import { CalendarScenario, WeaknessItem } from '../types';

/**
 * Generate 10 highly realistic, pedagogically calibrated scenarios
 * targeting exactly the 10 selected unticked items from the C2 Scientific Checklist.
 */
export function generate10ScenariosFromChecklistItems(
  items: C2ChecklistItem[],
  cycleNumber: number = 1
): CalendarScenario[] {
  // Ensure we have exactly 10 items (or fallback to top items if fewer provided)
  const targetItems = items.slice(0, 10);
  if (targetItems.length < 10) {
    const existingIds = new Set(targetItems.map((i) => i.id));
    for (const fallback of C2_SCIENTIFIC_CHECKLIST) {
      if (!existingIds.has(fallback.id)) {
        targetItems.push(fallback);
        existingIds.add(fallback.id);
        if (targetItems.length === 10) break;
      }
    }
  }

  const scenarioBlueprints: Record<
    string,
    {
      title: string;
      titleFa: string;
      category: 'daily' | 'work' | 'travel' | 'social' | 'emergency' | 'personal';
      context: string;
      relationship: string;
      userRole: string;
      aiRole: string;
      icon: string;
      starter: string;
      starterFa: string;
      targetCliches: string[];
      targetVocabulary: string[];
      targetPronunciation: string;
    }
  > = {
    'c2-chk-01': {
      title: 'Discussing Hobbies & Interests at a Brooklyn Art Gallery',
      titleFa: 'گفتگو درباره علایق و هنر در گالری بروکلین (حذف حروف اضافه اشتباه)',
      category: 'social',
      context: 'Contemporary Art Gallery Opening in DUMBO, Brooklyn',
      relationship: 'Fellow Art Enthusiast / Peer',
      userRole: 'Gallery Visitor',
      aiRole: 'Local Artist & Curator (Maya)',
      icon: '🎨',
      starter: "Hey there! Are you also interested in modern abstract installations, or is this your first time at this gallery?",
      starterFa: "سلام! شما هم به چیدمان‌های مدرن آبستره علاقه‌مندید یا اولین بارتونه به این گالری میاید؟",
      targetCliches: ["break the ice (آب کردن یخ مکالمه)", "take a keen interest in (علاقه‌مند شدن عمیق)"],
      targetVocabulary: ["interested in (علاقه‌مند به)", "listen to (گوش دادن به)", "keen on (مشتاق)"],
      targetPronunciation: "حذف صدای اضافه to بعد از listen و تلفظ روان interested in بدون مکث",
    },
    'c2-chk-02': {
      title: 'Debating Tech Workplace Policies with Team Lead',
      titleFa: 'مناظره درباره سیاست‌های کاری شرکت (تسلط بر افعال حالتی و حذف I am agree)',
      category: 'work',
      context: 'Tech Startup Coffee Corner / Quick Sync',
      relationship: 'Engineering Lead / Senior Colleague',
      userRole: 'Software Developer',
      aiRole: 'Team Lead (David)',
      icon: '💻',
      starter: "I personally feel four-day work weeks boost output by 20%. Do you agree, or do you have reservations?",
      starterFa: "من شخصاً حس می‌کنم هفته‌های کاری ۴ روزه بازدهی رو ۲۰ درصد بالا می‌بره. موافقی یا ملاحظاتی داری؟",
      targetCliches: ["on the same page (هم‌نظر بودن)", "see eye to eye (اتفاق نظر داشتن)"],
      targetVocabulary: ["I completely agree (کاملاً موافقم)", "I respectfully disagree (با احترام مخالفم)", "It depends on (بستگی دارد به)"],
      targetPronunciation: "ادای روان I agree بدون اضافه کردن am و لحن مصمم",
    },
    'c2-chk-03': {
      title: 'Ordering Fast-Casual Lunch in Downtown Chicago',
      titleFa: 'سفارش ناهار در رستوران شلوغ شیکاگو (تسلط کامل بر Flap T)',
      category: 'daily',
      context: 'Busy Downtown Chicago Gourmet Deli',
      relationship: 'Cashier / Counter Staff',
      userRole: 'Hungry Customer on Lunch Break',
      aiRole: 'Fast-talking Chicago Cashier',
      icon: '🥪',
      starter: "Next in line! What'll it be today? A bottle of water or iced tea with that sandwich combo?",
      starterFa: "نفر بعد! امروز چی تقدیم کنم؟ با ساندویچ بطری آب میل دارید یا آیس‌تی؟",
      targetCliches: ["grab a bite (چیزی سرپایی خوردن)", "on the run (در حال عجله)"],
      targetVocabulary: ["bottle of water (بطری آب)", "little better (کمی بهتر)", "city center (مرکز شهر)"],
      targetPronunciation: "تلفظ Flap-T [ɾ] نرم در کلمات water, bottle, better, city, meeting",
    },
    'c2-chk-04': {
      title: 'Planning a Road Trip Itinerary with a Friend',
      titleFa: 'برنامه‌ریزی سفر جاده‌ای کالیفرنیا (کاهش آوایی شوآ در کلمات کمکی)',
      category: 'travel',
      context: 'Living Room Map Planning for Pacific Coast Highway',
      relationship: 'Close Travel Buddy',
      userRole: 'Road Trip Co-pilot',
      aiRole: 'Adventurous Friend (Chloe)',
      icon: '🚗',
      starter: "We can leave at dawn to beat the traffic, and I can drive for the first four hours. How does that sound?",
      starterFa: "می‌تونیم سپیده‌دم راه بیفتیم تا به ترافیک نخوریم، و من می‌تونم ۴ ساعت اول رو رانندگی کنم. چطوره؟",
      targetCliches: ["hit the road (زدن به دل جاده)", "play it by ear (فعلاً قطعی نکردن)"],
      targetVocabulary: ["can /kən/ (توانستن)", "to /tə/ (به)", "for /fər/ (برای)"],
      targetPronunciation: "کاهش مصوت به صدای شوآ [ə] در کلمات گرامری to, for, can, and, of",
    },
    'c2-chk-05': {
      title: 'Recounting a Lost Passport Misadventure Abroad',
      titleFa: 'روایت داستان پاسپورت گم‌شده در سفر (تسلط بر زمان‌های گذشته)',
      category: 'travel',
      context: 'Hostel Lounge in Amsterdam sharing travel stories',
      relationship: 'Fellow World Traveler',
      userRole: 'Storyteller',
      aiRole: 'Engaged Traveler (Liam)',
      icon: '✈️',
      starter: "You said you had a crazy incident on your trip last year. What actually happened when you realized it was gone?",
      starterFa: "گفتی پارسال تو سفرت یه ماجرای عجیب پیش اومد. دقیقاً چی شد وقتی فهمیدی گم شده؟",
      targetCliches: ["out of the blue (ناگهانی و بی‌مقدمه)", "get to the bottom of (پی بردن به ماجرا)"],
      targetVocabulary: ["had forgotten (فراموش کرده بودم)", "was searching (داشتم می‌گشتم)", "eventually turned up (بالاخره پیدا شد)"],
      targetPronunciation: "پیوستگی بیان گذشته بدون توقف و تلفظ صحیح پسوندهای -ed",
    },
    'c2-chk-06': {
      title: 'Weekend Mall Run & Outdoor Gear Shopping',
      titleFa: 'خرید تجهیزات کوهنوردی آخر هفته (حذف go to shopping)',
      category: 'daily',
      context: 'Outdoor Apparel & Equipment Store',
      relationship: 'Shopping Companion',
      userRole: 'Shopper looking for hiking boots',
      aiRole: 'Outdoor Enthusiast Friend (Sam)',
      icon: '🛍️',
      starter: "I'm so glad we went shopping early! Do you want to go hiking this afternoon after we finish?",
      starterFa: "خیلی خوشحالم زود اومدیم خرید! بعد از اتمام، پایه هستی بعدازظهر بریم کوهنوردی؟",
      targetCliches: ["shop around (قیمت گرفتن از جاهای مختلف)", "cost an arm and a leg (خیلی گران بودن)"],
      targetVocabulary: ["went shopping (رفتیم خرید)", "go hiking (رفتن به کوهنوردی)", "go camping (رفتن به کمپ)"],
      targetPronunciation: "حذف کامل کلمه to بعد از go در فعالیت‌های تفریحی با پسوند ing",
    },
    'c2-chk-07': {
      title: 'Navigating an Airport Terminal Dilemma with Gate Agent',
      titleFa: 'پیگیری تغییر گیت پرواز در فرودگاه (پرسشگری مؤدبانه و غیرمستقیم)',
      category: 'travel',
      context: 'JFK International Airport Terminal Gate Desk',
      relationship: 'Gate Agent / Airline Representative',
      userRole: 'Connecting Passenger',
      aiRole: 'Airline Customer Service Agent',
      icon: '🎫',
      starter: "Next customer please. How can I assist you with your connecting flight today?",
      starterFa: "مسافر بعدی لطفاً. چطور می‌تونم در مورد پرواز ترانزیت‌تون کمکتون کنم؟",
      targetCliches: ["in a tight spot (در مخمصه افتادن)", "make matters worse (اوضاع را بدتر کردن)"],
      targetVocabulary: ["Do you happen to know...? (آیا تصادفاً می‌دانید...)", "I was wondering if... (داشتم فکر می‌کردم آیا...)", "Could you clarify...? (میشه شفاف بفرمایید...)"],
      targetPronunciation: "آهنگ کلامی خیزان و ملایم در سوالات محترمانه",
    },
    'c2-chk-08': {
      title: 'Discussing Career Aspirations over Morning Coffee',
      titleFa: 'بحث درباره اهداف شغلی و مسیر ارتقا (تسلط بر R امریکن بدون لرزش)',
      category: 'work',
      context: 'Office Terrace overlooking San Francisco skyline',
      relationship: 'Career Mentor / Trusted Advisor',
      userRole: 'Ambitious Professional',
      aiRole: 'Senior Vice President (Elena)',
      icon: '📈',
      starter: "Your hard work on that quarterly report really turned heads. Where do you see your career heading next year?",
      starterFa: "تلاش سختت روی گزارش فصلی حسابی به چشم اومد. سال آینده مسیر شغلیت رو کجا می‌بینی؟",
      targetCliches: ["raise the bar (بالا بردن استاندارد)", "learn the ropes (فوت و فن کار را یاد گرفتن)"],
      targetVocabulary: ["career trajectory (مسیر پیشرفت شغلی)", "hard work (سخت‌کوشی)", "first priority (اولویت اول)"],
      targetPronunciation: "صدای R عمیق پست‌آلوئولار در کلمات career, hard, work, report بدون لرزش نوک زبان",
    },
    'c2-chk-09': {
      title: 'Handling a Rapid-Fire Product Strategy Interview',
      titleFa: 'مصاحبه استراتژی محصول و پاسخگویی مسلط (مدیریت مکث‌ها با فیلر)',
      category: 'work',
      context: 'Silicon Valley Product Manager Interview Session',
      relationship: 'Hiring Manager / Interviewer',
      userRole: 'Job Candidate',
      aiRole: 'VP of Product (Marcus)',
      icon: '🎯',
      starter: "Tell me about a time when a metric tanked unexpectedly. How did you react in the first forty-eight hours?",
      starterFa: "از زمانی بگو که یکی از شاخص‌ها افت شدیدی کرد. در ۴۸ ساعت اول چه واکنشی نشون دادی؟",
      targetCliches: ["think on your feet (فی‌البداهه فکر و عمل کردن)", "cut to the chase (رفتن سر اصل مطلب)"],
      targetVocabulary: ["Well, to be fair... (راستش اگر بخوام منصف باشم)", "Actually, what happened was... (در واقع چیزی که رخ داد...)", "You know, looking back... (می‌دونی، اگر به گذشته نگاه کنم...)"],
      targetPronunciation: "حفظ آهنگ کلام بدون سکوت‌های ناگهانی یا صداهای آزاردهنده",
    },
    'c2-chk-10': {
      title: 'Casual Weekend Brainstorming with Startup Co-founders',
      titleFa: 'طوفان فکری آخر هفته با هم‌بنیان‌گذاران استارتاپ (کلیشه‌های محاوره‌ای)',
      category: 'social',
      context: 'Austin Backyard BBQ / Founder Ideation',
      relationship: 'Startup Co-founder & Longtime Friend',
      userRole: 'Technical Co-founder',
      aiRole: 'Commercial Co-founder (Jason)',
      icon: '🚀',
      starter: "Our beta users love the AI coach, but retention drops after day ten. What should we do next?",
      starterFa: "کاربران بتا عاشق مربی هوش مصنوعی شدن، اما موندگاری بعد از روز دهم افت می‌کنه. بعدش چیکار کنیم؟",
      targetCliches: ["touch base (هماهنگی و جلسه کوتاه داشتن)", "call it a day (کار را برای امروز تعطیل کردن)", "bite the bullet (دل به دریا زدن)"],
      targetVocabulary: ["play it by ear (فعلاً قطعی نکردن)", "game plan (برنامه عملیاتی)", "drop the ball (کوتاهی کردن)"],
      targetPronunciation: "لحن صمیمی و سریع کلام با اتصالات آوایی طبیعی",
    },
  };

  return targetItems.map((item, idx) => {
    const blueprint = scenarioBlueprints[item.id] || {
      title: `Mastering ${item.titleEn}`,
      titleFa: `سناریوی تسلط بر: ${item.titleFa}`,
      category: 'work' as const,
      context: 'Professional Collaborative Setting',
      relationship: 'Colleague / Conversational Partner',
      userRole: 'Professional Specialist',
      aiRole: 'American Conversational Partner',
      icon: '🎯',
      starter: `Let's discuss this matter directly. How do you view our path forward?`,
      starterFa: `بیا مستقیماً درباره این موضوع صحبت کنیم. مسیر پیش‌رو رو چطور می‌بینی؟`,
      targetCliches: ['on the same page (هم‌نظر بودن)', 'bring to the table (ارزش افزودن)'],
      targetVocabulary: ['deliberate (آگاهانه)', 'perspective (دیدگاه)', 'collaborate (همکاری کردن)'],
      targetPronunciation: item.criteriaForMasteryFa,
    };

    return {
      id: `cal-c${cycleNumber}-${idx + 1}`,
      dayIndex: idx + 1,
      targetLevel: item.cefrLevel,
      phaseTitleFa: item.tierNameFa,
      targetChecklistItemId: item.id,
      cycleNumber,
      title: blueprint.title,
      titleFa: blueprint.titleFa,
      category: blueprint.category,
      context: blueprint.context,
      relationship: blueprint.relationship,
      userRole: blueprint.userRole,
      aiRole: blueprint.aiRole,
      icon: blueprint.icon,
      starter: blueprint.starter,
      starterFa: blueprint.starterFa,
      targetGrammar: item.titleEn,
      targetGrammarFa: item.descriptionFa,
      targetCliches: blueprint.targetCliches,
      targetVocabulary: blueprint.targetVocabulary,
      targetPronunciation: blueprint.targetPronunciation,
      activeWeaknessesInjected: [item.titleFa],
      status: idx === 0 ? 'current' : 'upcoming',
    };
  });
}

/**
 * Formats a list of 10 checklist items as WeaknessItem[] for database storage
 */
export function formatChecklistItemsAsWeaknesses(items: C2ChecklistItem[]): WeaknessItem[] {
  return items.slice(0, 10).map((item, idx) => ({
    id: `weak-${item.id}`,
    category:
      item.category === 'phonetics'
        ? 'pronunciation'
        : item.category === 'idioms'
        ? 'vocabulary'
        : item.category === 'pragmatics'
        ? 'register_tone'
        : item.category === 'discourse'
        ? 'fluency'
        : 'grammar',
    titleFa: item.titleFa,
    descriptionFa: item.descriptionFa,
    examples: [item.exampleBad, `اصلاح بومی: ${item.exampleGood}`],
    severity: item.tier === 1 ? 'high' : item.tier === 2 ? 'medium' : 'low',
    frequency: 3,
    firstObserved: new Date().toISOString().split('T')[0],
    lastObserved: new Date().toISOString().split('T')[0],
    status: 'active',
    successStreak: 0,
  }));
}
