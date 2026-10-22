/**
 * Dynamic Subtopic Rotation & Conversation Drift Tracking Engine
 *
 * Forces the AI conversational model to rotate through distinct real-life situations
 * every 2-3 user turns while strictly maintaining and reinforcing the primary
 * learning objective (target grammar, native clichés, and sentence patterns) of the current lesson.
 */

export interface RealLifeSituation {
  id: string;
  titleFa: string;
  domain:
    | 'travel'
    | 'dining'
    | 'work'
    | 'housing'
    | 'sales'
    | 'retail'
    | 'family'
    | 'relationships'
    | 'healthcare'
    | 'services'
    | 'social'
    | 'emergency'
    | 'academics';
  settingEn: string;
  settingFa: string;
  roles: {
    user: string;
    partner: string;
    relationship: string;
    register: 'casual' | 'formal' | 'diplomatic';
  };
  bridgeTransitions: string[];
  vocabularyBank: string[];
  sentencePatternTemplates: Array<{
    pattern: string;
    meaningFa: string;
    slotExplanation: string;
  }>;
  keywords: string[];
}

export const REAL_LIFE_SITUATIONS: RealLifeSituation[] = [
  {
    id: 'airport_flight_delay',
    titleFa: 'فرودگاه و اعلام تاخیر ناگهانی پرواز',
    domain: 'travel',
    settingEn: 'At a crowded international departure gate where an unexpected 3-hour flight delay has just been announced.',
    settingFa: 'در سالن پروازهای بین‌المللی فرودگاه در حالی که پرواز ۳ ساعت تاخیر خورده و مسافران سردرگم هستند.',
    roles: {
      user: 'Stranded Airline Passenger',
      partner: 'Fellow Passenger / Airline Customer Service Rep',
      relationship: 'Stranger / Service Provider',
      register: 'casual',
    },
    bridgeTransitions: [
      "That makes total sense in that situation! Moving on from that event, let's look at how you deal with sudden disruptions in a completely different setting: imagine you're stuck at an airport gate after a surprise flight delay...",
      "I hear you loud and clear. Switching gears to another real-life challenge: suppose you're rushing to catch a flight at an airport and your gate gets changed at the last minute...",
    ],
    vocabularyBank: ['connecting flight', 'departure gate', 'layover', 'voucher', 'standby list', 'baggage claim'],
    sentencePatternTemplates: [
      {
        pattern: 'X had no choice but to [verb base] after Y.',
        meaningFa: 'ایکس چاره‌ای جز فلان کار بعد از ایگرگ نداشت',
        slotExplanation: 'X: شخص یا مسافر | Y: رویداد یا تصمیم غیرمنتظره',
      },
      {
        pattern: "As soon as X happened, Y completely fell apart.",
        meaningFa: 'به محض اینکه ایکس اتفاق افتاد، ایگرگ کلاً به هم ریخت',
        slotExplanation: 'X: تاخیر، خبر، یا اتفاق | Y: برنامه سفر یا زمان‌بندی',
      },
    ],
    keywords: ['airport', 'flight', 'gate', 'plane', 'luggage', 'delay', 'airline', 'ticket'],
  },
  {
    id: 'restaurant_dining_issue',
    titleFa: 'رستوران و نارضایتی از کیفیت یا سفارش غذا',
    domain: 'dining',
    settingEn: 'At an upscale American bistro where the dish served is lukewarm or prepared incorrectly.',
    settingFa: 'در یک رستوران شیک که غذای سرو شده سرد است یا با چیزی که سفارش دادید تطابق ندارد.',
    roles: {
      user: 'Customer dining with friends',
      partner: 'Restaurant Server / Floor Manager',
      relationship: 'Customer / Service Staff',
      register: 'diplomatic',
    },
    bridgeTransitions: [
      "That's definitely a common experience. Moving forward, let's explore how you handle expressing disappointment politely: picture yourself sitting at a nice restaurant when your meal arrives undercooked...",
      "Point well taken! Changing the scene completely: suppose you're out having dinner and there's a mix-up on your bill...",
    ],
    vocabularyBank: ['undercooked', 'on the house', 'rare/medium-well', 'dressing on the side', 'comp the meal', 'itemized receipt'],
    sentencePatternTemplates: [
      {
        pattern: "I rarely ever complain, but X was completely [adjective].",
        meaningFa: 'به ندرت شکایت می‌کنم، اما ایکس کاملاً فلان‌جور بود',
        slotExplanation: 'X: غذا، سفارش، یا سرویس | adjective: غیرقابل قبول، سرد، یا اشتباه',
      },
      {
        pattern: "Could you possibly have the kitchen [verb] X for me?",
        meaningFa: 'امکانش هست به آشپزخونه بگید فلان کار رو برای من انجام بدن؟',
        slotExplanation: 'verb: گرم کردن، عوض کردن | X: بشقاب یا غذا',
      },
    ],
    keywords: ['restaurant', 'food', 'waiter', 'server', 'dish', 'steak', 'menu', 'bill', 'dinner'],
  },
  {
    id: 'business_meeting_pushback',
    titleFa: 'جلسه کاری و مخالفت محترمانه با نظر مدیر یا همکار',
    domain: 'work',
    settingEn: 'In a quarterly business strategy meeting where a coworker proposes an unrealistic project deadline.',
    settingFa: 'در جلسه فصلی شرکت در حالی که همکارتان ددلاینی غیرواقعی پیشنهاد داده و باید با استدلال مخالفت کنید.',
    roles: {
      user: 'Senior Project Team Member',
      partner: 'Colleague / Team Lead',
      relationship: 'Work Colleague / Peer',
      register: 'formal',
    },
    bridgeTransitions: [
      "That was handled nicely! Now, let's shift to a high-stakes professional environment: suppose you're in an important team meeting and someone proposes a timeline you know is impossible...",
      "Moving on from that personal story, how would you articulate a diplomatic counterargument in a boardroom meeting where...",
    ],
    vocabularyBank: ['bandwidth', 'hard deadline', 'deliverables', 'push back on', 'bottleneck', 'trade-offs'],
    sentencePatternTemplates: [
      {
        pattern: "While I see where X is coming from, Y might not be feasible.",
        meaningFa: 'با اینکه درک می‌کنم دیدگاه ایکس از کجا میاد، اما ایگرگ ممکن است شدنی نباشد',
        slotExplanation: 'X: شخص یا تیم | Y: پیشنهاد، ددلاین، یا بودجه',
      },
      {
        pattern: "We should probably steer clear of [verb-ing] until X is sorted out.",
        meaningFa: 'احتمالاً باید تا وقتی ایکس حل‌وفصل نشده، از فلان کار دوری کنیم',
        slotExplanation: 'X: ابهام یا مشکل اصلی | verb-ing: متعهد شدن یا اجرا کردن',
      },
    ],
    keywords: ['meeting', 'deadline', 'boss', 'coworker', 'project', 'budget', 'office', 'company', 'client'],
  },
  {
    id: 'real_estate_lease_dispute',
    titleFa: 'مذاکره مسکن و پیگیری تعمیرات ضروری با صاحب‌خانه',
    domain: 'housing',
    settingEn: 'Talking to a strict landlord about a broken HVAC heater in the middle of winter that hasn’t been repaired.',
    settingFa: 'گفتگو با صاحب‌خانه سرسخت درباره خرابی سیستم گرمایش خانه در سرمای زمستان که به موقع تعمیر نشده است.',
    roles: {
      user: 'Tenant leasing an apartment',
      partner: 'Property Landlord / Rental Agent',
      relationship: 'Tenant / Landlord',
      register: 'diplomatic',
    },
    bridgeTransitions: [
      "I appreciate that perspective! Switching contexts to daily independence: suppose you're renting an apartment and your heater breaks down in the middle of a cold snap...",
      "Moving away from that topic, picture a scenario where you have to stand your ground with a difficult landlord regarding...",
    ],
    vocabularyBank: ['lease agreement', 'security deposit', 'maintenance request', 'HVAC unit', 'wear and tear', 'rent deduction'],
    sentencePatternTemplates: [
      {
        pattern: "This has been going on for [time period], and X still hasn't been addressed.",
        meaningFa: 'این قضیه فلان مدت است ادامه دارد و ایکس هنوز رفع نشده است',
        slotExplanation: 'time period: دو هفته، چند روز | X: مشکل، خرابی، یا درخواست',
      },
      {
        pattern: "I need a firm commitment on when X will be taken care of.",
        meaningFa: 'من یک تعهد قطعی می‌خواهم که دقیقا چه زمانی به ایکس رسیدگی می‌شود',
        slotExplanation: 'X: تعمیرات، مسئله، یا خرابی',
      },
    ],
    keywords: ['apartment', 'landlord', 'rent', 'lease', 'heater', 'plumbing', 'tenant', 'house'],
  },
  {
    id: 'product_salesperson_pitch',
    titleFa: 'فروشندگی و متقاعد کردن مشتری مردد به خرید محصول',
    domain: 'sales',
    settingEn: 'Working as a tech sales advisor explaining why an innovative device is worth the premium price tag.',
    settingFa: 'به عنوان مشاور فروش در حال متقاعد کردن یک مشتری مردد که چرا یک محصول تکنولوژی گران‌قیمت ارزش خرید دارد.',
    roles: {
      user: 'Product Specialist / Salesperson',
      partner: 'Hesitant Shopper',
      relationship: 'Salesperson / Customer',
      register: 'casual',
    },
    bridgeTransitions: [
      "Spot on! Now let's test your persuasive fluency in a sales environment: imagine you're working as a tech specialist explaining a premium product to an undecided customer...",
      "Stepping into a completely different pair of shoes: suppose you have to convince someone that a major investment will pay off in the long run...",
    ],
    vocabularyBank: ['value proposition', 'game-changer', 'durability', 'bang for your buck', 'warranty coverage', 'buyer remorse'],
    sentencePatternTemplates: [
      {
        pattern: "What sets X apart from the competition is its ability to [verb base].",
        meaningFa: 'چیزی که ایکس را از رقبا متمایز می‌کند توانایی آن در فلان کار است',
        slotExplanation: 'X: محصول یا ویژگی | verb base: کارایی اصلی',
      },
      {
        pattern: "If you're looking for [noun], X is definitely worth every penny.",
        meaningFa: 'اگر دنبال فلان چیز هستید، ایکس قطعاً ارزش تک‌تک ریال‌هایش را دارد',
        slotExplanation: 'noun: دوام، راحتی، سرعت | X: مدل یا محصول',
      },
    ],
    keywords: ['product', 'sales', 'customer', 'price', 'expensive', 'warranty', 'discount', 'features'],
  },
  {
    id: 'store_checkout_refund',
    titleFa: 'صندوق فروشگاه و درخواست مرجوعی کالا بدون فاکتور',
    domain: 'retail',
    settingEn: 'At the customer service desk of a major retail store trying to return an opened electronic item.',
    settingFa: 'در بخش خدمات مشتریان یک فروشگاه بزرگ برای پس دادن کالایی که بسته‌بندی‌اش باز شده اما فاکتور کاغذی ندارد.',
    roles: {
      user: 'Customer requesting exchange or refund',
      partner: 'Customer Service Representative',
      relationship: 'Customer / Store Associate',
      register: 'casual',
    },
    bridgeTransitions: [
      "That makes total sense! Moving on from this event, let's explore retail interactions: imagine you're at a department store checkout counter trying to return a defective gadget...",
      "Switching gears entirely: suppose you need to negotiate a store credit or return for an item you bought last week...",
    ],
    vocabularyBank: ['store credit', 'receipt on file', 'restocking fee', 'defective', 'proof of purchase', 'exchange policy'],
    sentencePatternTemplates: [
      {
        pattern: "I purchased X just [time period] ago, and it turned out to be completely [adjective].",
        meaningFa: 'من ایکس را همین فلان مدت پیش خریدم و معلوم شد کاملاً فلان‌جور است',
        slotExplanation: 'X: دستگاه یا کالا | adjective: معیوب، ناسازگار، یا خراب',
      },
      {
        pattern: "Is there any way we can look up the transaction via my X?",
        meaningFa: 'آیا راهی هست که تراکنش را از طریق فلان چیز من جستجو کنیم؟',
        slotExplanation: 'X: شماره تلفن، کارت بانکی، یا ایمیل',
      },
    ],
    keywords: ['store', 'return', 'refund', 'receipt', 'checkout', 'cashier', 'exchange', 'defect'],
  },
  {
    id: 'home_domestic_coordination',
    titleFa: 'خانه و تقسیم کارهای نظافت و مدیریت امور منزل با هم‌اتاقی یا خانواده',
    domain: 'family',
    settingEn: 'At the kitchen counter on a Saturday morning discussing chore division and unexpected home repairs.',
    settingFa: 'سر میز آشپزخانه در صبح تعطیل در حال صحبت با اعضای خانواده یا هم‌اتاقی برای برنامه‌ریزی کارهای خانه و تعمیرات.',
    roles: {
      user: 'Housemate / Family Member',
      partner: 'Roommate or Family Member',
      relationship: 'Close Family / Roommate',
      register: 'casual',
    },
    bridgeTransitions: [
      "Got it! Leaving that topic behind, let's dive into domestic life: suppose it's Saturday morning at home, and the sink is leaking while chores are piling up...",
      "Moving to an everyday household situation: how would you discuss dividing up responsibilities when both of you are completely exhausted...",
    ],
    vocabularyBank: ['deep clean', 'chores', 'pull one’s weight', 'pitch in', 'leaky faucet', 'cluttered'],
    sentencePatternTemplates: [
      {
        pattern: "If we both pitch in for [time period], we can easily get X knocked out.",
        meaningFa: 'اگر هر دوتامون فلان مدت کمک کنیم، خیلی راحت ایکس رو تموم می‌کنیم',
        slotExplanation: 'time period: نیم ساعت، یک ساعت | X: نظافت، کارهای عقب‌افتاده',
      },
      {
        pattern: "I don't mind taking care of X as long as you handle Y.",
        meaningFa: 'من مشکلی ندارم ایکس رو انجام بدم به شرطی که تو ایگرگ رو به عهده بگیری',
        slotExplanation: 'X, Y: کارهای مختلف خانه مثل آشپزی، خرید، یا نظافت',
      },
    ],
    keywords: ['home', 'chores', 'kitchen', 'cleaning', 'sink', 'roommate', 'laundry', 'housework'],
  },
  {
    id: 'spouse_heart_to_heart',
    titleFa: 'گفتگوی شبانه با همسر و رفع سوءتفاهم پس از یک هفته پرمشغله',
    domain: 'relationships',
    settingEn: 'Relaxing on the couch late in the evening having an honest, supportive heart-to-heart with your spouse.',
    settingFa: 'روی مبل در پایان یک روز شلوغ در حال گفتگوی صمیمانه و عمیق با همسر درباره احساسات، فشار کاری و برنامه‌های مشترک.',
    roles: {
      user: 'Spouse / Committed Partner',
      partner: 'Spouse / Romantic Partner',
      relationship: 'Spouse / Romantic Partner',
      register: 'casual',
    },
    bridgeTransitions: [
      "That's very insightful! On a completely different note, let's focus on intimate communication with a partner: imagine sitting down with your spouse late at night after a stressful week...",
      "Moving away from public settings to private relationships: suppose you and your spouse are decompressing after a hectic week and discussing how you've both been feeling...",
    ],
    vocabularyBank: ['heart-to-heart', 'burned out', 'on the same page', 'make time for', 'unwind', 'quality time'],
    sentencePatternTemplates: [
      {
        pattern: "I know work has been [adjective] lately, but I really miss spending X with you.",
        meaningFa: 'می‌دونم اخیراً کار خیلی فلان‌جور بوده، اما واقعاً دلم برای گذروندن فلان چیز با تو تنگ شده',
        slotExplanation: 'adjective: شلوغ، فرساینده | X: وقت باکیفیت، آخر هفته آرام',
      },
      {
        pattern: "Let's just call it a day and talk through X without any distractions.",
        meaningFa: 'بیا کار رو تعطیل کنیم و بدون هیچ دغدغه‌ای درباره فلان موضوع حرف بزنیم',
        slotExplanation: 'X: نگرانی‌ها، سفر بعدی، یا برنامه‌های زندگی',
      },
    ],
    keywords: ['spouse', 'wife', 'husband', 'partner', 'marriage', 'couch', 'weekend', 'love', 'exhausted'],
  },
  {
    id: 'talking_to_child_guidance',
    titleFa: 'صحبت و آرام کردن فرزند هنگام مواجهه با چالش در مدرسه',
    domain: 'family',
    settingEn: 'Comforting and guiding a child who came home feeling discouraged after struggling with a school subject.',
    settingFa: 'آرام کردن و انگیزه دادن به فرزند که بعد از یک روز سخت در مدرسه با دلسردی به خانه برگشته است.',
    roles: {
      user: 'Encouraging Parent',
      partner: 'Discouraged Child / Teenager',
      relationship: 'Parent & Child',
      register: 'casual',
    },
    bridgeTransitions: [
      "Understood! Shifting to parental interactions: imagine your child walks through the door feeling disheartened after a difficult test at school...",
      "Moving forward to family dynamics: how would you gently counsel and inspire a young person who wants to give up on something they started...",
    ],
    vocabularyBank: ['discouraged', 'hang in there', 'practice makes perfect', 'proud of you', 'one step at a time', 'learning curve'],
    sentencePatternTemplates: [
      {
        pattern: "It's totally normal to feel [emotion] when X doesn't go as planned.",
        meaningFa: 'کاملاً طبیعیه که وقتی فلان چیز طبق برنامه پیش نرفت، چنین حسی داشته باشی',
        slotExplanation: 'emotion: ناامید، ناراحت | X: امتحان، مسابقه، یا پروژه',
      },
      {
        pattern: "What matters most isn't X, but how you [verb base] after Y.",
        meaningFa: 'چیزی که بیش از همه مهمه فلان چیز نیست، بلکه چگونگی واکنش تو بعد از ایگرگ است',
        slotExplanation: 'X: نمره، نتیجه | Y: شکست یا چالش',
      },
    ],
    keywords: ['child', 'kid', 'school', 'homework', 'parent', 'son', 'daughter', 'grade', 'teenager'],
  },
  {
    id: 'dating_girlfriend_banter',
    titleFa: 'قرار عاشقانه در کافه یا پارک با پارتنر و صحبت از تجربیات جذاب',
    domain: 'relationships',
    settingEn: 'Walking in a scenic city park or sitting at a cozy outdoor cafe on a weekend date with your girlfriend/partner.',
    settingFa: 'قدم زدن در پارک یا نشستن در کافه‌ای دنج در یک بعدازظهر تعطیل با پارتنر در حال شوخی، گپ شیرین و خاطره‌گویی.',
    roles: {
      user: 'Partner on a date',
      partner: 'Girlfriend / Dating Partner',
      relationship: 'Romantic Partner / Dating',
      register: 'casual',
    },
    bridgeTransitions: [
      "Nicely put! Transitioning to casual romance and dating: picture being on a warm weekend walk with your girlfriend when she playfully brings up...",
      "Moving away from work and stress, imagine you're sharing a funny memory over coffee with someone you really care about...",
    ],
    vocabularyBank: ['chemistry', 'inside joke', 'wander around', 'spontaneous', 'daydreaming', 'sweet tooth'],
    sentencePatternTemplates: [
      {
        pattern: "Whenever I'm with you, X seems to completely [verb base].",
        meaningFa: 'هر وقت پیش تو هستم، فلان چیز انگار کلاً محو یا فراموش می‌شود',
        slotExplanation: 'X: استرس، خستگی، زمان | verb base: ناپدید شدن، بی‌اهمیت شدن',
      },
      {
        pattern: "You won't believe what happened the last time I tried to [verb base].",
        meaningFa: 'باورت نمیشه آخرین باری که تلاش کردم فلان کار رو بکنم چی شد',
        slotExplanation: 'verb base: آشپزی، ورزش، رانندگی در برف',
      },
    ],
    keywords: ['date', 'girlfriend', 'romantic', 'park', 'cafe', 'stroll', 'coffee', 'tease', 'relationship'],
  },
  {
    id: 'doctor_clinic_consultation',
    titleFa: 'مطب پزشک، شرح علائم درد و پرسش درباره عوارض دارویی',
    domain: 'healthcare',
    settingEn: 'At a consultation room in an urgent care clinic explaining recurring health symptoms to an attentive physician.',
    settingFa: 'در اتاق معاینه کلینیک در حال توضیح دقیق علائم سردرد، درد بدنی یا خستگی مزمن به پزشک معالج.',
    roles: {
      user: 'Patient seeking medical advice',
      partner: 'Doctor / Nurse Practitioner',
      relationship: 'Patient / Healthcare Professional',
      register: 'diplomatic',
    },
    bridgeTransitions: [
      "That's crystal clear! Let's now explore a critical health encounter: imagine you're sitting in a doctor's examination room explaining a persistent physical symptom...",
      "Switching to medical and wellness conversations: suppose you need to clearly describe how your health changed after...",
    ],
    vocabularyBank: ['dull ache', 'sharp pain', 'side effects', 'prescription', 'dosage', 'flare-up', 'chronic'],
    sentencePatternTemplates: [
      {
        pattern: "The pain is gradually fading, but it's still more [adjective] in the morning.",
        meaningFa: 'درد رفته‌رفته در حال محو شدنه، اما صبح‌ها هنوز فلان‌جورتر است',
        slotExplanation: 'adjective: شدید، تیز، یا آزاردهنده',
      },
      {
        pattern: "I noticed that whenever I [action], X triggers almost immediately.",
        meaningFa: 'متوجه شدم هر زمان فلان کار را می‌کنم، ایکس تقریباً بلافاصله تحریک می‌شود',
        slotExplanation: 'action: ورزش کردن، غذا خوردن | X: سردرد یا درد معده',
      },
    ],
    keywords: ['doctor', 'clinic', 'pain', 'medicine', 'hospital', 'symptom', 'nurse', 'health'],
  },
  {
    id: 'auto_mechanic_highway',
    titleFa: 'تعمیرگاه خودرو و خرابی ناگهانی ماشین در سفر جاده‌ای',
    domain: 'services',
    settingEn: 'At an auto repair garage after your car began making an alarming rattling noise on the freeway.',
    settingFa: 'در تعمیرگاه خودرو بعد از اینکه ماشین در اتوبان صدای نگران‌کننده‌ای داد و مجبور شدید کنار بزنید.',
    roles: {
      user: 'Car Owner / Driver',
      partner: 'Auto Mechanic / Service Advisor',
      relationship: 'Customer / Mechanic',
      register: 'casual',
    },
    bridgeTransitions: [
      "Got it! Leaving that behind, let's step into a sudden transportation headache: imagine you're on a road trip when your car suddenly overheats on the freeway...",
      "Moving to an unexpected mechanical crisis: how would you describe the problem to a mechanic when...",
    ],
    vocabularyBank: ['rattling noise', 'transmission', 'brake pads', 'overheating', 'estimate', 'towing fee'],
    sentencePatternTemplates: [
      {
        pattern: "Out of nowhere, the engine started [verb-ing] as I was driving down the highway.",
        meaningFa: 'ناگهان و از ناکجا، موتور همین‌طور که در اتوبان می‌راندم شروع به فلان کار کرد',
        slotExplanation: 'verb-ing: دود کردن، صدا دادن، خاموش شدن',
      },
      {
        pattern: "Is X something that needs immediate attention, or can it wait until Y?",
        meaningFa: 'آیا فلان قطعه به رسیدگی فوری نیاز داره یا می‌تونه تا فلان زمان صبر کنه؟',
        slotExplanation: 'X: مشکل یا قطعه | Y: آخر هفته، سفر بعدی',
      },
    ],
    keywords: ['car', 'mechanic', 'highway', 'engine', 'brakes', 'repair', 'noise', 'breakdown'],
  },
  {
    id: 'hotel_concierge_upgrade',
    titleFa: 'هتل و شکایت از سر و صدای اتاق و درخواست تعویض',
    domain: 'services',
    settingEn: 'At the front desk of a downtown hotel at midnight reporting a loud party in the adjoining room.',
    settingFa: 'در لابی هتل در نیمه‌شب در حال گزارش سر و صدای مهمانی اتاق کناری و درخواست تعویض سریع اتاق.',
    roles: {
      user: 'Hotel Guest unable to sleep',
      partner: 'Night Manager / Front Desk Associate',
      relationship: 'Guest / Hotel Staff',
      register: 'diplomatic',
    },
    bridgeTransitions: [
      "Understood! Switching to a travel hospitality scenario: suppose you've checked into a hotel after a tiring journey, but the guests next door are blasting loud music at midnight...",
      "Leaving that event behind, imagine addressing an uncomfortable hotel situation politely but firmly...",
    ],
    vocabularyBank: ['complimentary upgrade', 'noise complaint', 'adjoining room', 'unacceptable', 'soundproofing', 'light sleeper'],
    sentencePatternTemplates: [
      {
        pattern: "I hate to be a nuisance, but the noise next door is making it impossible to [verb base].",
        meaningFa: 'بدم میاد مایه دردسر باشم، اما سر و صدای بغل دست خوابیدن را غیرممکن کرده است',
        slotExplanation: 'verb base: خوابیدن، استراحت کردن، تمرکز کردن',
      },
      {
        pattern: "Would it be possible to transfer me to a quieter room on a different X?",
        meaningFa: 'آیا امکانش هست مرا به یک اتاق ساکت‌تر در فلان بخش منتقل کنید؟',
        slotExplanation: 'X: طبقه، بال یا راهرو',
      },
    ],
    keywords: ['hotel', 'room', 'front desk', 'concierge', 'noise', 'guest', 'sleep', 'key'],
  },
  {
    id: 'rideshare_uber_chat',
    titleFa: 'تاکسی اینترنتی، گپ کوتاه با راننده و تغییر مسیر به دلیل ترافیک',
    domain: 'travel',
    settingEn: 'Sitting in the backseat of a rideshare vehicle in rush-hour traffic chatting casually with the driver.',
    settingFa: 'در صندلی عقب تاکسی اینترنتی در ترافیک عصرگاهی در حال گفتگوی گرم با راننده و مشورت برای میانبر زدن.',
    roles: {
      user: 'Rideshare Passenger',
      partner: 'Friendly Rideshare Driver',
      relationship: 'Passenger / Driver (Casual Stranger)',
      register: 'casual',
    },
    bridgeTransitions: [
      "That's a great example! Moving on, let's look at casual American small talk in transit: imagine you're in the back of an Uber stuck in bumper-to-bumper traffic...",
      "Switching gears to urban transportation: how would you carry a relaxed, friendly conversation with a local driver while...",
    ],
    vocabularyBank: ['rush-hour gridlock', 'shortcut', 'detour', 'drop-off spot', 'fare estimate', 'traffic flow'],
    sentencePatternTemplates: [
      {
        pattern: "Traffic seems way worse than usual today because of X.",
        meaningFa: 'ترافیک امروز به خاطر فلان چیز خیلی بدتر از معمول به نظر می‌رسه',
        slotExplanation: 'X: تصادف، باران، ساخت‌وساز، ساعت اوج',
      },
      {
        pattern: "Do you mind if we take the back roads to steer clear of X?",
        meaningFa: 'مشکلی نداری اگه از کوچه‌ها بریم تا از فلان چیز دوری کنیم؟',
        slotExplanation: 'X: ترافیک سنگین، اتوبان شلوغ',
      },
    ],
    keywords: ['uber', 'taxi', 'traffic', 'driver', 'route', 'ride', 'commute', 'destination'],
  },
  {
    id: 'gym_fitness_interaction',
    titleFa: 'باشگاه بدنسازی، اشتراک دستگاه ورزشی و مشورت با مربی',
    domain: 'services',
    settingEn: 'In a bustling gym during peak evening hours asking to work in on a cable machine with someone.',
    settingFa: 'در باشگاه ورزشی شلوغ هنگام عصر، در حال درخواست برای استفاده نوبتی از یک دستگاه و پرسیدن نحوه صحیح حرکت.',
    roles: {
      user: 'Gym-goer working out',
      partner: 'Fellow Gym Member / Personal Trainer',
      relationship: 'Fellow Member / Casual Peer',
      register: 'casual',
    },
    bridgeTransitions: [
      "Makes total sense! Now let's jump into a social fitness scenario: imagine you're at the gym and every squat rack or cable machine is occupied...",
      "Moving on from that topic, picture asking a fellow gym-goer to work in between sets while discussing fitness goals...",
    ],
    vocabularyBank: ['work in between sets', 'personal record', 'spot me', 'cable machine', 'soreness', 'form check'],
    sentencePatternTemplates: [
      {
        pattern: "Do you mind if I work in with you between your [exercise] sets?",
        meaningFa: 'مشکلی نداری من هم بین ست‌های فلان تمرینت باهات شریک بشم؟',
        slotExplanation: 'exercise: پرس سینه، اسکات، لت',
      },
      {
        pattern: "My muscles were completely shot after trying X yesterday.",
        meaningFa: 'عضلاتم دیروز بعد از امتحان کردن فلان تمرین کلاً داغون و خسته شده بودند',
        slotExplanation: 'X: برنامه سنگین، دویدن طولانی',
      },
    ],
    keywords: ['gym', 'workout', 'weights', 'trainer', 'exercise', 'fitness', 'sets', 'reps'],
  },
  {
    id: 'bank_fraud_charge',
    titleFa: 'بانک و پیگیری تراکنش مشکوک و ادعای برگشت پول',
    domain: 'services',
    settingEn: 'On a phone call with bank fraud protection disputing an unexpected international charge on your card.',
    settingFa: 'در تماس تلفنی با بخش پشتیبانی بانک برای مسدود کردن کارت و پیگیری کسر وجه مشکوک خارجی.',
    roles: {
      user: 'Bank Account Holder',
      partner: 'Fraud Specialist / Bank Officer',
      relationship: 'Customer / Financial Official',
      register: 'formal',
    },
    bridgeTransitions: [
      "Well expressed! On a completely different note, let's explore dealing with financial stress: imagine you check your bank account and spot an unauthorized charge of $450...",
      "Switching to financial services: how would you assertively report an error to your bank while keeping your cool...",
    ],
    vocabularyBank: ['unauthorized transaction', 'fraud alert', 'freeze the card', 'reimbursement', 'statement', 'dispute a claim'],
    sentencePatternTemplates: [
      {
        pattern: "I definitely never authorized X, and I wasn't even in Y at the time.",
        meaningFa: 'من قطعاً هرگز به فلان تراکنش مجوز ندادم و اصلاً اون زمان در فلان شهر نبودم',
        slotExplanation: 'X: تراکنش یا پرداخت | Y: مکان یا فروشگاه',
      },
      {
        pattern: "How long does it typically take for the bank to reverse X?",
        meaningFa: 'معمولاً چقدر طول می‌کشه تا بانک فلان وجه رو برگردونه؟',
        slotExplanation: 'X: مبلغ نامعتبر، کارمزد، تراکنش',
      },
    ],
    keywords: ['bank', 'credit card', 'fraud', 'charge', 'money', 'account', 'dispute', 'statement'],
  },
  {
    id: 'tech_support_hotline',
    titleFa: 'تماس با پشتیبانی فنی اینترنت در زمان قطعی کامل شبکه',
    domain: 'services',
    settingEn: 'Calling internet customer support while working remotely when your connection cuts off before an important deadline.',
    settingFa: 'تماس با پشتیبانی ارائه‌دهنده اینترنت در حالی که حین دورکاری شبکه قطع شده و باید کار مهمی تحویل دهید.',
    roles: {
      user: 'Remote Worker facing outage',
      partner: 'Technical Support Specialist',
      relationship: 'Customer / Tech Support Agent',
      register: 'diplomatic',
    },
    bridgeTransitions: [
      "I hear you! Moving on, let's look at dealing with frustrating technology failures: imagine your internet goes down thirty minutes before an urgent remote presentation...",
      "Shifting gears to tech troubleshooting: how would you articulate the steps you've already taken when calling customer support...",
    ],
    vocabularyBank: ['service outage', 'reboot the modem', 'intermittent signal', 'bandwidth throttling', 'technician dispatch', 'hotspot'],
    sentencePatternTemplates: [
      {
        pattern: "I've already tried [verb-ing] X multiple times, but the issue persists.",
        meaningFa: 'من قبلاً چندین بار فلان کار رو امتحان کردم، اما مشکل همچنان پابرجاست',
        slotExplanation: 'verb-ing: ری‌استارت کردن، چک کردن کابل‌ها | X: مودم یا دستگاه',
      },
      {
        pattern: "Is there an outage in my area, or is it strictly tied to my X?",
        meaningFa: 'آیا در منطقه من قطعی سراسری هست یا مشکل صرفاً مربوط به فلان بخش من است؟',
        slotExplanation: 'X: مودم، اکانت، سیم‌کشی',
      },
    ],
    keywords: ['internet', 'wifi', 'modem', 'tech support', 'router', 'outage', 'network', 'connection'],
  },
  {
    id: 'coffee_shop_rush',
    titleFa: 'کافه شلوغ صبحگاهی و سفارش نوشیدنی سفارشی با اصطلاحات باروری',
    domain: 'dining',
    settingEn: 'Standing in a buzzing morning coffee line in Seattle customizing a specialty espresso drink.',
    settingFa: 'در صف شلوغ یک کافه معروف صبحگاهی در حال دادن سفارش دقیق قهوه با تمام جزئیات شیر، شات و دما.',
    roles: {
      user: 'Coffee enthusiast in a hurry',
      partner: 'Barista on morning shift',
      relationship: 'Customer / Barista',
      register: 'casual',
    },
    bridgeTransitions: [
      "Nicely done! Transitioning to high-frequency morning coffee culture: imagine stepping into a bustling neighborhood cafe where the barista asks for your regular order...",
      "Leaving that story behind, picture ordering in a busy American coffee shop with specific dietary preferences...",
    ],
    vocabularyBank: ['oat milk latte', 'extra shot of espresso', 'room for cream', 'sugar-free syrup', 'decaf', 'drip coffee'],
    sentencePatternTemplates: [
      {
        pattern: "Can I get a [size] [drink] with X instead of regular milk?",
        meaningFa: 'می‌تونم یک فلان نوشیدنی سایز فلان با شیر فلانی به جای شیر معمولی داشته باشم؟',
        slotExplanation: 'size: tall, grande | drink: latte, cappuccino | X: oat milk, almond milk',
      },
      {
        pattern: "Could you make sure X is extra [adjective] today?",
        meaningFa: 'میشه مطمئن بشید که فلان چیز امروز خیلی فلان‌جور باشه؟',
        slotExplanation: 'X: نوشیدنی یا فوم | adjective: داغ، کم‌شیرین، خنک',
      },
    ],
    keywords: ['coffee', 'cafe', 'barista', 'espresso', 'latte', 'drink', 'order', 'milk'],
  },
  {
    id: 'veterinarian_pet_care',
    titleFa: 'کلینیک دامپزشکی و شرح وضعیت سگ یا گربه خانگی',
    domain: 'healthcare',
    settingEn: 'At an animal clinic holding your pet while describing subtle behavioral changes to the veterinarian.',
    settingFa: 'در کلینیک دامپزشکی در حال توضیح تغییرات اشتها و رفتار حیوان خانگی‌تان به دامپزشک.',
    roles: {
      user: 'Pet Owner',
      partner: 'Veterinarian / Vet Tech',
      relationship: 'Pet Owner / Medical Professional',
      register: 'casual',
    },
    bridgeTransitions: [
      "Understood! Shifting to pet care and compassion: suppose you're at the vet clinic describing why your pet has been acting lethargic the past few days...",
      "Moving forward to animal companionship: how would you explain an unexpected incident with a pet to a doctor...",
    ],
    vocabularyBank: ['lethargic', 'loss of appetite', 'vaccination record', 'deworming', 'symptoms flare-up', 'check-up'],
    sentencePatternTemplates: [
      {
        pattern: "He was completely fine until X started happening two days ago.",
        meaningFa: 'او تا قبل از اینکه دو روز پیش ایکس شروع بشه کاملاً روبه‌راه بود',
        slotExplanation: 'X: سرفه کردن، بی‌حالی، غذا نخوردن',
      },
      {
        pattern: "I noticed that X is much more sensitive whenever anyone touches Y.",
        meaningFa: 'متوجه شدم ایکس هر وقت کسی به ایگرگ دست می‌زنه خیلی حساس‌تره',
        slotExplanation: 'X: سگ یا گربه | Y: پای چپ، گوش، شکم',
      },
    ],
    keywords: ['pet', 'vet', 'dog', 'cat', 'animal', 'clinic', 'veterinarian', 'puppy'],
  },
  {
    id: 'job_interview_strength_weakness',
    titleFa: 'مصاحبه استخدامی و پاسخ به پرسش مدیریت شکست و یادگیری',
    domain: 'work',
    settingEn: 'Sitting across from an HR director during the final round of a competitive job interview.',
    settingFa: 'در اتاق مصاحبه شغلی با مدیر ارشد که از شما درباره سخت‌ترین چالش کاری گذشته‌تان سوال می‌پرسد.',
    roles: {
      user: 'Job Candidate',
      partner: 'Hiring Manager / Recruiter',
      relationship: 'Candidate / Interviewer',
      register: 'formal',
    },
    bridgeTransitions: [
      "Excellent formulation! Now, let's step into a competitive professional spotlight: imagine an interviewer looks right at you and asks: 'Tell me about a time you made a mistake and what you learned from it'...",
      "Leaving that anecdote behind, how would you articulate personal growth during a high-stakes job interview...",
    ],
    vocabularyBank: ['take ownership', 'silver lining', 'cross-functional', 'hindsight', 'proactive approach', 'growth mindset'],
    sentencePatternTemplates: [
      {
        pattern: "In hindsight, I should have paid closer attention to X before [verb-ing].",
        meaningFa: 'در بازنگری، باید قبل از فلان کار توجه دقیق‌تری به ایکس نشان می‌دادم',
        slotExplanation: 'X: جزئیات قرارداد، زمان‌بندی، فیدبک تیم',
      },
      {
        pattern: "That experience taught me how to [verb base] whenever unexpected obstacles arise.",
        meaningFa: 'اون تجربه به من یاد داد چطور هر زمان موانع غیرمنتظره پیش آمد فلان رفتار رو داشته باشم',
        slotExplanation: 'verb base: آرامش خود را حفظ کردن، برنامه‌ریزی مجدد کردن',
      },
    ],
    keywords: ['interview', 'job', 'resume', 'hire', 'candidate', 'mistake', 'career', 'strength'],
  },
  {
    id: 'neighborhood_block_boundary',
    titleFa: 'جلسه همسایگی و توافق بر سر صدای دیرهنگام یا محدوده باغچه',
    domain: 'social',
    settingEn: 'Standing on the front driveway having a polite, neighborly chat about keeping outdoor music down after 10 PM.',
    settingFa: 'در ورودی حیاط در حال گفتگوی دوستانه اما شفاف با همسایه دیوار به دیوار درباره رعایت آرامش شبانه.',
    roles: {
      user: 'Homeowner / Neighbor',
      partner: 'Next-door Neighbor',
      relationship: 'Neighbors / Casual Acquaintance',
      register: 'diplomatic',
    },
    bridgeTransitions: [
      "Spot on! Moving on from that, let's look at community relations: suppose your next-door neighbor regularly plays loud music late on weeknights...",
      "Switching contexts to neighborhood living: how would you bring up a delicate boundary issue without damaging the relationship...",
    ],
    vocabularyBank: ['keep it down', 'sound carries', 'property line', 'block party', 'early riser', 'middle ground'],
    sentencePatternTemplates: [
      {
        pattern: "I really value having great neighbors, but X has been getting a bit out of hand.",
        meaningFa: 'من واقعاً ارزش زیادی برای همسایه‌های خوب قائلم، اما فلان چیز کمی از کنترل خارج شده',
        slotExplanation: 'X: سر و صدا، پارکینگ در ورودی، پارس سگ',
      },
      {
        pattern: "Could we maybe agree to [verb base] after 10 PM on weekdays?",
        meaningFa: 'میشه شاید توافق کنیم بعد از ساعت ۱۰ شب در روزهای کاری فلان کار رو بکنیم؟',
        slotExplanation: 'verb base: صدا رو کم کردن، سگ رو داخل آوردن',
      },
    ],
    keywords: ['neighbor', 'lawn', 'fence', 'music', 'driveway', 'noise', 'yard', 'house'],
  },
  {
    id: 'university_professor_office_hours',
    titleFa: 'دفتر استاد دانشگاه و مشورت درباره تمدید مهلت مقاله تحلیلی',
    domain: 'academics',
    settingEn: 'Sitting in a college professor’s book-lined office explaining research progress and requesting an extension.',
    settingFa: 'در اتاق کار استاد دانشگاه در حال توضیح روند نگارش مقاله تحقیقی و درخواست منطقی برای تمدید مهلت تحویل.',
    roles: {
      user: 'College Student / Researcher',
      partner: 'University Professor / Academic Advisor',
      relationship: 'Student / Faculty Advisor',
      register: 'formal',
    },
    bridgeTransitions: [
      "That was well stated! Now let's place you in an academic setting: imagine you're sitting in your professor's office explaining why your research paper needs a few more days...",
      "Moving forward to academic discussions: how would you present your methodology and ask for feedback when...",
    ],
    vocabularyBank: ['extension', 'primary sources', 'thesis statement', 'methodology', 'draft review', 'scholarly consensus'],
    sentencePatternTemplates: [
      {
        pattern: "While researching X, I uncovered new findings that forced me to reconsider Y.",
        meaningFa: 'حین تحقیق درباره ایکس، یافته‌های جدیدی پیدا کردم که مرا وادار به تجدیدنظر در ایگرگ کرد',
        slotExplanation: 'X: موضوع یا منبع | Y: فرضیه یا نتیجه‌گیری',
      },
      {
        pattern: "Would it be permissible to submit the final draft by X instead?",
        meaningFa: 'آیا امکان‌پذیر است که پیش‌نویس نهایی را تا فلان تاریخ تحویل دهم؟',
        slotExplanation: 'X: جمعه، دوشنبه آینده',
      },
    ],
    keywords: ['professor', 'university', 'college', 'paper', 'extension', 'office hours', 'exam', 'student'],
  },
];

export interface SubtopicRotationResult {
  isRotationTriggered: boolean;
  turnCount: number;
  rotationCycle: number;
  situation: RealLifeSituation;
  promptInjectionDirective: string;
}

/**
 * Tracks conversation drift and determines whether a subtopic rotation is mandatory.
 * Injects a powerful prompt directive commanding the LLM to rotate to a fresh real-life situation
 * after 2-3 user turns while strictly preserving the lesson's target grammar, clichés, and sentence patterns.
 */
export function trackConversationDriftAndRotateSubtopic(params: {
  turnNumber: number;
  chatHistory: Array<{ role: string; text: string }>;
  targetGrammar: string;
  targetGrammarFa: string;
  targetCliches: string[];
  scenarioTitle: string;
  baseContext: string;
  cefrLevel?: string;
}): SubtopicRotationResult {
  const {
    turnNumber,
    chatHistory = [],
    targetGrammar = 'Spoken fluency',
    targetGrammarFa = 'روانی گفتار',
    targetCliches = [],
    scenarioTitle = 'Daily Chat',
    cefrLevel = 'B1',
  } = params;

  // Rotation cycle: turns 1-2 (cycle 0 - initial opening); turns 3-4 (cycle 1 - pivot 1); turns 5-6 (cycle 2 - pivot 2), etc.
  const isRotationTriggered = turnNumber >= 3;
  const rotationCycle = Math.max(0, Math.floor((turnNumber - 1) / 2));

  // Analyze past chat history to extract keywords and avoid reusing contexts already touched upon
  const pastText = chatHistory.map((m) => m.text.toLowerCase()).join(' ');

  // Filter available situations to find unvisited ones
  const availableSituations = REAL_LIFE_SITUATIONS.filter((sit) => {
    // Avoid matching if more than 2 keywords exist in past messages
    const hitCount = sit.keywords.filter((kw) => pastText.includes(kw.toLowerCase())).length;
    return hitCount < 2;
  });

  const candidatePool = availableSituations.length > 0 ? availableSituations : REAL_LIFE_SITUATIONS;

  // Deterministic but diverse rotation selection using scenario title hash and rotationCycle
  const titleHash = scenarioTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const selectedIndex = (titleHash + rotationCycle) % candidatePool.length;
  const situation = candidatePool[selectedIndex];

  // Pick a transition phrase
  const bridgePhrase =
    situation.bridgeTransitions[rotationCycle % situation.bridgeTransitions.length] ||
    `Moving on from this event, let's explore how you handle things in a completely different setting: imagine you are ${situation.settingEn}`;

  const primaryTargetCliche = targetCliches[0] || 'target idiomatic chunk';

  // Construct the prompt injection directive
  let promptInjectionDirective = '';

  if (isRotationTriggered) {
    promptInjectionDirective = `
================================================================================
>>> CONVERSATION DRIFT TRIGGER ACTIVATED: SUBTOPIC ROTATION REQUIRED (TURN #${turnNumber}) <<<
================================================================================
1. CONVERSATION DRIFT ANALYSIS:
   The user has already answered 2+ turns regarding the previous anecdote/subtopic. That specific story is now OFFICIALLY CONCLUDED.
   DO NOT ask another question about the same event, object, or situation (e.g. no more dogs, no more same flight, no more repetitive follow-ups)!

2. MANDATORY REAL-LIFE SITUATION PIVOT:
   - NEW ROTATED SETTING: "${situation.titleFa}" (${situation.settingEn})
   - DOMAIN: ${situation.domain.toUpperCase()} | ROLEPLAY AS: "${situation.roles.partner}" (User is: "${situation.roles.user}")
   - RECOMMENDED REGISTER: ${situation.roles.register.toUpperCase()}
   - DOMAIN VOCABULARY TO SEED: ${situation.vocabularyBank.join(', ')}

3. BRIDGE TRANSITION REQUIREMENT (in your 1-2 sentence "reply"):
   - Acknowledge the user's last statement in at most ONE SHORT CLAUSE (e.g. "Glad you made it through that safe and sound!").
   - Immediately bridge to the new real-life setting using this approach:
     "${bridgePhrase}"

4. NON-NEGOTIABLE PEDAGOGICAL TETHERING (هدف آموزشی درس هرگز فراموش نشود):
   - CRITICAL LAW: While diversifying the setting into "${situation.titleFa}", YOU MUST DIRECTLY SUBTLY COMPEL THE USER TO USE THE PRIMARY LESSON TARGET:
     * PRIMARY LESSON GRAMMAR: "${targetGrammar}" (${targetGrammarFa})
     * TARGET NATIVE CLICHÉ: "${primaryTargetCliche}"
   - Craft your probing question in this new situation so that formulating a natural, native answer REQUIRES using the target grammar structure and offers a golden opportunity to produce "${primaryTargetCliche}".
   - DO NOT make it feel like a grammar drill—it must flow as a realistic human dilemma in this new setting.

5. SENTENCE PATTERNS TO MODEL & ELICIT IN THIS NEW SETTING:
   Derive at least two of your returned "sentencePatterns" from how a native speaker would address this new challenge:
   Pattern A: "${situation.sentencePatternTemplates[0]?.pattern || 'X is gradually fading.'}" (Persian: ${situation.sentencePatternTemplates[0]?.meaningFa || ''})
   Pattern B: "${situation.sentencePatternTemplates[1]?.pattern || 'X tries to steer clear of Y.'}" (Persian: ${situation.sentencePatternTemplates[1]?.meaningFa || ''})

6. IN "inCharacterChallenge":
   - "probingQuestionEn": The sharp, immersive question in this NEW setting that demands an answer using the target grammar.
   - "probingQuestionFa": روان‌ترین ترجمه فارسی این سوال جدید برای راهنمایی ذهن کاربر.
   - "coachingGoalFa": دستور آموزشی مربی به فارسی برای نوبت بعد با اصطلاح یا گرامر هدف در این زمینه تازه (مثلاً: «حالا در این موقعیت جدید فرودگاه، سعی کن با استفاده از ساختار ${targetGrammarFa} و کلیشه "${primaryTargetCliche}" پاسخ بدی تا زبانت در موقعیت‌های مختلف باز بشه»).
================================================================================
`;
  } else {
    promptInjectionDirective = `
================================================================================
>>> INITIAL SCENARIO FOUNDATION PHASE (TURN #${turnNumber}) <<<
Deepen the primary scenario setting ("${scenarioTitle}"). Keep your response crisp (1-2 sentences) and probe the user to express themselves using "${targetGrammar}" (${targetGrammarFa}) and target clichés: ${targetCliches.join(', ')}.
================================================================================
`;
  }

  return {
    isRotationTriggered,
    turnCount: turnNumber,
    rotationCycle,
    situation,
    promptInjectionDirective,
  };
}
