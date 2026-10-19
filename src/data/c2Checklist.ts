export interface C2ChecklistItem {
  id: string;
  tier: 1 | 2 | 3 | 4; // 1: A2-B1, 2: B1-B2, 3: B2-C1, 4: C1-C2
  tierNameFa: string;
  cefrLevel: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: 'grammar' | 'phonetics' | 'idioms' | 'pragmatics' | 'discourse' | 'listening';
  categoryFa: string;
  titleEn: string;
  titleFa: string;
  descriptionFa: string;
  scientificReference: string; // e.g. "CEFR CV 2020: Phonological Control", "Cambridge CPE Rubric: Lexical Resource", "Swan & Smith: Learner English L1 Transfer"
  criteriaForMasteryFa: string;
  exampleGood: string;
  exampleBad: string;
  priorityOrder: number; // ascending pedagogical priority (1 = earliest)
}

export const C2_SCIENTIFIC_CHECKLIST: C2ChecklistItem[] = [
  // ================= TIER 1: Foundational Fluency & L1 Transfer Elimination (A2 - B1) =================
  {
    id: 'c2-chk-01',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'A2',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Elimination of Preposition Calques from Persian',
    titleFa: 'ریشه‌کنی حروف اضافه اشتباه ناشی از ترجمه مستقیم فارسی',
    descriptionFa: 'در فارسی می‌گوییم «به موسیقی گوش دادن» اما در انگلیسی listen با to می‌آید؛ یا «علاقه‌مند به» که interested in است نه interested to. تسلط بر حروف اضافه همنشین.',
    scientificReference: 'Swan & Smith: Learner English (Persian L1 Calques); CEFR B1 Grammatical Accuracy',
    criteriaForMasteryFa: 'عدم استفاده از حروف اضافه تحت‌اللفظی مثل interested to, marry with, explain to me, wait for.',
    exampleGood: "I'm deeply interested in cognitive psychology, and I listen to podcasts daily.",
    exampleBad: "I am interested to psychology and listen music.",
    priorityOrder: 1,
  },
  {
    id: 'c2-chk-02',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'A2',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Stative & Predicate Verb Accuracy (No "I am agree")',
    titleFa: 'استفاده صحیح از افعال حالتی و اسنادی (حذف ساختار اشتباه I am agree)',
    descriptionFa: 'کلمه agree در انگلیسی فعل است و نباید با to be بیاید (I agree نه I am agree). همچنین افعالی نظیر cost, weigh, belong.',
    scientificReference: 'Yarmohammadi (Contrastive Analysis of Persian & English Syntax); CEFR A2/B1',
    criteriaForMasteryFa: 'ادای درست I agree, I disagree, It depends بدون افعال کمکی زاید فارسی.',
    exampleGood: 'I completely agree with your proposal on remote work.',
    exampleBad: "I am agree with your proposal because I'm think it's good.",
    priorityOrder: 2,
  },
  {
    id: 'c2-chk-03',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Intervocalic American Flap-T [ɾ]',
    titleFa: 'تلفظ روان Flap T امریکن بین دو واکه',
    descriptionFa: 'در لهجه امریکن وقتی T یا D بین دو حرف صدادار قرار می‌گیرد (مانند water, city, better, meeting) به صدای نرم تپ/فلپ [ɾ] تبدیل می‌شود نه T انفجاری خشک.',
    scientificReference: 'Ladefoged & Johnson: A Course in Phonetics; CEFR Phonological Control B1+',
    criteriaForMasteryFa: 'تلفظ پیوسته Flap-T در حداقل ۸۰ درصد کلمات دارای شرایط در مکالمه زنده.',
    exampleGood: 'Could I get a bottle of water in the city meeting?',
    exampleBad: 'Could I get a bo[tʰ]le of wa[tʰ]er in the ci[tʰ]y mee[tʰ]ing?',
    priorityOrder: 3,
  },
  {
    id: 'c2-chk-04',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Schwa [ə] & Vowel Reduction in Function Words',
    titleFa: 'کاهش آوایی شوآ [ə] در کلمات گرامری و تابعی',
    descriptionFa: 'در گفتار نیتیو امریکن، کلماتی مانند to, for, can, and, of با واکه کامل تلفظ نمی‌شوند بلکه به صدای شوآ کاهش می‌یابند تا ریتم استرس-تایمد شکل بگیرد.',
    scientificReference: 'Celce-Murcia et al.: Teaching Pronunciation; CEFR B1 Prosodic Features',
    criteriaForMasteryFa: 'کاهش مصوت‌های کوتاه در حروف اضافه و افعال کمکی و عدم تلفظ تکیه‌دار آنها.',
    exampleGood: "I can /kən/ go to /tə/ the store for /fər/ some bread.",
    exampleBad: 'I /kæn/ go /tu:/ the store /fɔːr/ some bread.',
    priorityOrder: 4,
  },
  {
    id: 'c2-chk-05',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Past Narrative Aspect: Simple vs Continuous vs Perfect',
    titleFa: 'تسلط بر وجوه زمانی گذشته در روایت داستان (Past Narrative)',
    descriptionFa: 'تفکیک دقیق گذشته ساده برای رخدادهای زنجیره‌ای، گذشته استمراری برای پس‌زمینه، و گذشته کامل برای وقایع پیشین.',
    scientificReference: 'Cambridge C2 Speaking Assessment Criteria: Grammatical Resource; CEFR B1 Narrative',
    criteriaForMasteryFa: 'روایت یک خاطره یا ماجرا بدون پرش غیرطبیعی بین زمان حال و گذشته.',
    exampleGood: 'While I was driving home, it started pouring, and I realized I had left the window open.',
    exampleBad: 'When I drive home, it was rain, and I saw I forget my window.',
    priorityOrder: 5,
  },
  {
    id: 'c2-chk-06',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Elimination of "Go to shopping" (Gerund Activity Verbs)',
    titleFa: 'حذف ساختار نادرست Go to shopping و کاربرد صحیح فرم‌های تفریحی',
    descriptionFa: 'افعال فعالیتی بعد از go بدون حرف اضافه to و با فرم ing می‌آیند: go shopping, go swimming, go hiking.',
    scientificReference: 'Swan: Practical English Usage; L1 Persian Interference',
    criteriaForMasteryFa: 'کاربرد خودکار go shopping / went shopping بدون درج حرف اضافه to.',
    exampleGood: 'We went shopping downtown and then went hiking in the afternoon.',
    exampleBad: 'We went to shopping in mall and then went to swimming.',
    priorityOrder: 6,
  },
  {
    id: 'c2-chk-07',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'Indirect & Softened Question Formulation',
    titleFa: 'پرسشگری غیرمستقیم و موقر در مکالمات روزمره',
    descriptionFa: 'استفاده از ساختارهای مؤدبانه به جای سوال مستقیم خشک: Could you tell me..., Do you happen to know..., I was wondering if...',
    scientificReference: 'Brown & Levinson: Politeness Theory; CEFR B1 Sociolinguistic Appropriateness',
    criteriaForMasteryFa: 'تبدیل سوالات امری/مستقیم به قالب‌های محترمانه در موقعیت‌های تعاملی.',
    exampleGood: 'Do you happen to know where the conference room is located?',
    exampleBad: 'Where is conference room? Tell me.',
    priorityOrder: 7,
  },
  {
    id: 'c2-chk-08',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'American Rhotic R (Post-Alveolar / Retroflex Approximation)',
    titleFa: 'ادای صدای R امریکن بدون لرزش نوک زبان (Rhotic R)',
    descriptionFa: 'در فارسی R لرزشی با نوک زبان است (Tapped [r])؛ در امریکن نوک زبان هرگز به سقف دهان نمی‌خورد و بدنه زبان به عقب جمع می‌شود (Bunched or Retroflex R).',
    scientificReference: 'Pennington & Rogerson-Revell: English Pronunciation Teaching and Research; CEFR B1',
    criteriaForMasteryFa: 'ادای R بعد از واکه در کلماتی مانند car, work, morning, first بدون برخورد زبان با سقف.',
    exampleGood: 'Her hard work early in the morning paid off.',
    exampleBad: 'Her ha[r]d wo[r]k ea[r]ly in the mo[r]ning (با ر لرزشی فارسی).',
    priorityOrder: 8,
  },
  {
    id: 'c2-chk-09',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'discourse',
    categoryFa: 'پیوستگی گفتار و دیسکورس',
    titleEn: 'Spoken Discourse Fillers & Hesitation Management',
    titleFa: 'مدیریت مکث‌ها با فیلرهای طبیعی مکالمه (Well, Actually, You know)',
    descriptionFa: 'استفاده از کلمات مکث طبیعی به جای گفتن «ااااام» یا سکوت طولانی در هنگام تفکر.',
    scientificReference: 'CEFR Spoken Fluency B1: Pausing and Hesitation Descriptors',
    criteriaForMasteryFa: 'حفظ رشته کلام با فیلرهای استاندارد انگلیسی بدون مکث‌های منقطع آزاردهنده.',
    exampleGood: "Well, to be perfectly honest, I haven't really looked into that yet.",
    exampleBad: 'I... um... [5 seconds silence]... don\'t know.',
    priorityOrder: 9,
  },
  {
    id: 'c2-chk-10',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'idioms',
    categoryFa: 'اصطلاحات و کلیشه‌های نیتیو',
    titleEn: 'Core American Idiomatic Chunks for Daily Banter',
    titleFa: 'کلیشه‌های اصلی محاوره روزمره آمریکایی (Play it by ear, Touch base)',
    descriptionFa: 'کاربرد روان اصطلاحات پرکاربرد مثل play it by ear, touch base, cut to the chase در بافت مناسب.',
    scientificReference: 'Nattinger & DeCarrico: Lexical Phrases and Language Teaching; CEFR B1/B2 Idiomaticity',
    criteriaForMasteryFa: 'استفاده در جای مناسب با لحن طبیعی بدون احساس ترجمه از زبان مادری.',
    exampleGood: "Traffic is pretty unpredictable, so let's just play it by ear.",
    exampleBad: "Let's see what happens based on conditions.",
    priorityOrder: 10,
  },
  {
    id: 'c2-chk-41',
    tier: 1,
    tierNameFa: 'فاز ۱: تثبیت روانی پایه و ریشه‌کنی تداخلات زبان مادری (A2 - B1)',
    cefrLevel: 'B1',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'American Small Talk & Rapport Openers',
    titleFa: 'اسمال‌تاک آمریکایی و باز کردن گفتگو با غریبه‌ها و همکاران',
    descriptionFa: 'شروع و ادامه گپ سبک آمریکایی: آب‌وهوا، آخر هفته، How\'s it going، بدون ورود ناگهانی به موضوع سنگین یا پرسش‌های خیلی شخصی.',
    scientificReference: 'CEFR B1 Sociolinguistic Appropriateness; Coupland: Small Talk',
    criteriaForMasteryFa: 'توانایی ۲–۳ نوبت اسمال‌تاک طبیعی قبل از موضوع اصلی، با follow-up سوال مناسب.',
    exampleGood: "Pretty crazy weather today, huh? Did you get caught in that downpour this morning?",
    exampleBad: 'Hello. How much is your salary? Are you married?',
    priorityOrder: 10.5,
  },

  // ================= TIER 2: Intermediate Expansion & Modal Nuance (B1+ - B2) =================
  {
    id: 'c2-chk-11',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Second Conditional for Hypothetical Dilemmas',
    titleFa: 'شرطی نوع دوم در بیان فرضیات و مشاوره‌های دوستانه (If I were you)',
    descriptionFa: 'ساختار If + past simple, would + base verb برای موقعیت‌های غیرواقعی و فرضی.',
    scientificReference: 'CEFR B2 Grammatical Control: Complex Sentence Subordination',
    criteriaForMasteryFa: 'ادای خودکار If I were you, I would... بدون اشتباه در زمان افعال.',
    exampleGood: "If I were in your shoes, I'd definitely take that offer without hesitation.",
    exampleBad: 'If I was in your place, I will take this offer.',
    priorityOrder: 11,
  },
  {
    id: 'c2-chk-12',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Third & Mixed Conditionals for Regret and Past Analysis',
    titleFa: 'شرطی نوع سوم و ترکیبی برای تحلیل گذشته و ابراز پشیمانی (Could/Should have)',
    descriptionFa: 'ساختارهای If I had known..., I would have... و افعال وجهی گذشته نظیر should have, could have.',
    scientificReference: 'Cambridge English C1/C2 Handbook: Advanced Structural Flexibility',
    criteriaForMasteryFa: 'کاربرد روان would have / should have مخفف شده (/wʊdə/, /ʃʊdə/) در بیان حسرت یا تحلیل.',
    exampleGood: "If we had left ten minutes earlier, we wouldn't have missed our flight.",
    exampleBad: 'If we left earlier, we did not miss flight.',
    priorityOrder: 12,
  },
  {
    id: 'c2-chk-13',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Glottal Stop [ʔ] before Syllabic N',
    titleFa: 'توقف چاکنایی (Glottal Stop) قبل از n هجایی در واژگانی مانند button, mountain',
    descriptionFa: 'در امریکن نیتیو، در کلماتی مانند important, curtain, button, kitten صدای t با انسداد حنجره ادا می‌شود نه با انفجار نوک زبان.',
    scientificReference: 'Kenyon & Knott: Pronouncing Dictionary of American English; CEFR B2 Phonology',
    criteriaForMasteryFa: 'تلفظ درست کلمات دارای T قبل از N هجایی با گلوتال استاپ طبیعی.',
    exampleGood: 'It is a crucial button on the curtain.',
    exampleBad: 'It is a crucial bu[tʰ]on on the cur[tʰ]ain.',
    priorityOrder: 13,
  },
  {
    id: 'c2-chk-14',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'Diplomatic Hedging & Disagreement Softening',
    titleFa: 'حاشیه‌سازی دیپلماتیک و تلطیف مخالفت در جلسات کاری',
    descriptionFa: 'استفاده از عبارات ملایم‌کننده نظیر I see where you\'re coming from, but..., I\'m not entirely convinced that...',
    scientificReference: 'Hyland: Hedging in Scientific & Spoken Discourse; CEFR B2 Disagreement',
    criteriaForMasteryFa: 'بیان مخالفت قاطع بدون تهاجمی به نظر رسیدن در سناریوهای کاری و تیمی.',
    exampleGood: "I definitely see your point, but don't you think we might be rushing the deadline?",
    exampleBad: 'No, you are wrong, deadline is bad.',
    priorityOrder: 14,
  },
  {
    id: 'c2-chk-15',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'idioms',
    categoryFa: 'اصطلاحات و کلیشه‌های نیتیو',
    titleEn: 'Three-Part Phrasal Verbs in Spoken Interaction',
    titleFa: 'افعال دومفعولی و سه‌بخشی پرکاربرد (Come up with, Cut down on, Get around to)',
    descriptionFa: 'تسلط بر افعال چندکلمه‌ای پیچیده و جایگذاری صحیح ضمایر در میان آنها.',
    scientificReference: 'Biber et al.: Longman Grammar of Spoken and Written English; CEFR B2 Lexicon',
    criteriaForMasteryFa: 'کاربرد روان افعال مرکب سه‌بخشی در پاسخ به چالش‌های روزمره.',
    exampleGood: "We need to come up with an innovative solution to cut down on overhead costs.",
    exampleBad: 'We must create new idea to decrease our costs.',
    priorityOrder: 15,
  },
  {
    id: 'c2-chk-16',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'listening',
    categoryFa: 'شنیدار و درک گفتار پیوسته نیتیو',
    titleEn: 'Decoding Fast Native Connected Speech & Reductions',
    titleFa: 'درک شنیداری گفتار سریع، ادغام حروف و حذفیات صوتی نیتیوها (Connected Speech & Reductions)',
    descriptionFa: 'درک شنیداری بی‌درنگ عباراتی با حذفیات و ادغام‌های آوایی مثل gonna, wanna, shoulda, Whaddya think, lemme see بدون سردرگمی در مکالمه سریع.',
    scientificReference: 'Celce-Murcia: Teaching Pronunciation; CEFR B2 Listening & Spoken Interaction',
    criteriaForMasteryFa: 'تشخیص سریع جملات با حذفیات گفتاری نیتیو امریکن و پاسخ‌گویی متناسب بدون نیاز به تکرار.',
    exampleGood: "Understood 'Whaddya wanna do tonight?' instantly and replied fluently.",
    exampleBad: 'متوقف شدن در مکالمه و تقاضای تکرار کلمه به کلمه What do you want to do.',
    priorityOrder: 16,
  },
  {
    id: 'c2-chk-17',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Sentence Stress Timing & Content vs Function Rhythm',
    titleFa: 'ریتم استرس-تایمد و ضرب‌آهنگ هجاهای اطلاعاتی (Stress-Timed Rhythm)',
    descriptionFa: 'در امریکن هجاهای کلمات معنادار (Content words) کشیده و با تاکید ادا می‌شوند و کلمات ساختاری فشرده می‌شوند.',
    scientificReference: 'Abercrombie: Elements of General Phonetics; CEFR B2 Intonation',
    criteriaForMasteryFa: 'کلام ضربی با تکیه‌های دقیق به جای خواندن یکنواخت تمام کلمات به شیوه سیلاب-تایمد فارسی.',
    exampleGood: "I NEVER said he STOLE the MONEY.",
    exampleBad: 'I-ne-ver-said-he-stole-the-mo-ney (تک‌تک کلمات با یک زمان برابر).',
    priorityOrder: 17,
  },
  {
    id: 'c2-chk-18',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Modal Nuances of Probability (Must have, Can\'t be, Might as well)',
    titleFa: 'وجوه احتمالات و استنتاج منطقی با افعال کمکی وجهی',
    descriptionFa: 'بیان قطعیت، احتمال یا ناممکن بودن وقایع گذشته و حال: must have been, couldn\'t have known, might as well.',
    scientificReference: 'Palmer: Mood and Modality; CEFR B2 Functional Grammar',
    criteriaForMasteryFa: 'استنتاج منطقی روان در مواجهه با یک معما یا خبر غیرمنتظره.',
    exampleGood: "She can't be at the office right now; she must have left early for her appointment.",
    exampleBad: 'It is impossible she is in office, maybe she went.',
    priorityOrder: 18,
  },
  {
    id: 'c2-chk-19',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'Telephone, Ordering & Daily Service Etiquette',
    titleFa: 'اتیکت پیشرفته در سفارش‌دهی، رزرو و تماس‌های اداری/خدماتی',
    descriptionFa: 'مهارت سفارش دادن، پرس‌وجو درباره صورت‌حساب، و اعتراض مؤدبانه به خدمات بدون بی‌احترامی.',
    scientificReference: 'Yule: Pragmatics; CEFR B2 Transactional Interaction',
    criteriaForMasteryFa: 'مدیریت تماس یا سفارش با عبارات نیتیو: Could I get..., Just to clarify..., Put me through to...',
    exampleGood: "Could I get a medium oat latte to go, and could you make it extra hot?",
    exampleBad: 'Give me one coffee quickly.',
    priorityOrder: 19,
  },
  {
    id: 'c2-chk-42',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'Apology, Complaint & Service Recovery Scripts',
    titleFa: 'عذرخواهی، شکایت مؤدبانه و بازسازی رابطه در خدمات/کار',
    descriptionFa: 'الگوهای آمریکایی برای عذرخواهی صادقانه (I owe you an apology)، شکایت سازنده (I was hoping you could help)، و service recovery بدون تهاجم یا تعارف افراطی فارسی.',
    scientificReference: 'Brown & Levinson: Politeness Theory; CEFR B2 Transactional Interaction',
    criteriaForMasteryFa: 'ادای یک عذرخواهی کامل و یک شکایت مؤدبانه با پیشنهاد راهکار، بدون لحن متهم‌کننده یا بیش‌ازحد رسمی کتابی.',
    exampleGood: "I'm really sorry about the delay — that was on me. If it helps, I can send the revised file by noon.",
    exampleBad: 'You made big mistake. Fix it now. I am very angry.',
    priorityOrder: 19.5,
  },
  {
    id: 'c2-chk-20',
    tier: 2,
    tierNameFa: 'فاز ۲: مکالمات حرفه‌ای، افعال وجهی و استدلال تعاملی (B1+ - B2)',
    cefrLevel: 'B2',
    category: 'idioms',
    categoryFa: 'اصطلاحات و کلیشه‌های نیتیو',
    titleEn: 'American Workplace & Professional Idioms',
    titleFa: 'کلیشه‌های حرفه‌ای محیط کار و کسب‌وکار آمریکایی (Bite the bullet, Raise the bar)',
    descriptionFa: 'اصطلاحاتی نظیر bite the bullet, raise the bar, touch base, on the same page در سناریوهای تیمی.',
    scientificReference: 'Cambridge Business English Framework; CEFR B2 Lexical Competence',
    criteriaForMasteryFa: 'به‌کارگیری حداقل ۲ اصطلاح مرتبط کاری در یک مکالمه شبیه‌سازی‌شده تیمی.',
    exampleGood: "Let's bite the bullet and present the honest numbers to the stakeholders.",
    exampleBad: 'We must be brave and show the bad numbers.',
    priorityOrder: 20,
  },

  // ================= TIER 3: Upper-Intermediate & Professional Spoken Polish (B2+ - C1) =================
  {
    id: 'c2-chk-21',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Spoken Inversion for Rhetorical Emphasis',
    titleFa: 'وارونگی گرامری (Inversion) برای ایجاد تاکید و گیرایی در کلام',
    descriptionFa: 'وارونگی فعل و فاعل بعد از قیدهای منفی یا تحدیدی: Rarely have I witnessed..., Not only did we deliver...',
    scientificReference: 'Quirk et al.: A Comprehensive Grammar of the English Language; CEFR C1 Flexibility',
    criteriaForMasteryFa: 'استفاده طبیعی از وارونگی تاکیدی در بیان یک موضع مهم بدون لکنت.',
    exampleGood: "Rarely have I seen a team adapt so quickly to such a drastic shift.",
    exampleBad: 'I have rarely seen team adapt so fast.',
    priorityOrder: 21,
  },
  {
    id: 'c2-chk-22',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Cleft Sentences for Focus & Topic Highlighting',
    titleFa: 'جملات شکافته (Cleft Sentences) برای برجسته‌سازی کانون پیام (What really matters is...)',
    descriptionFa: 'ساختارهای Wh-cleft و It-cleft: What concerns me most is..., It was his lack of transparency that triggered...',
    scientificReference: 'Cambridge English C1 Proficiency Rubrics: Grammatical Resource',
    criteriaForMasteryFa: 'برجسته‌سازی نکات کلیدی با استفاده از ساختارهای کلافت در مناظره یا گفتگو.',
    exampleGood: "What really strikes me about this proposal is its long-term scalability.",
    exampleBad: 'The proposal is good because of scalability.',
    priorityOrder: 22,
  },
  {
    id: 'c2-chk-23',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Connected Speech: Catenation, Linking-W, and Linking-Y',
    titleFa: 'متصل‌خوانی و آواهای رابط در کلام پیوسته (Linking sounds & Liaison)',
    descriptionFa: 'اتصال طبیعی انتهای کلمات به ابتدای کلمات بعد با نیم‌واکه‌های /w/ و /j/: go[w]out, see[j]it, pick[k]it up.',
    scientificReference: 'Roach: English Phonetics and Phonology; CEFR C1 Phonological Control',
    criteriaForMasteryFa: 'پیوستگی کامل جریان صوتی کلمات بدون ایجاد بریدگی‌های مصنوعی بین کلمات مجاور.',
    exampleGood: "Can you go[w]out and see[j]if they're ready?",
    exampleBad: 'Can | you | go | out | and | see | if (کلمات بریده‌بریده).',
    priorityOrder: 23,
  },
  {
    id: 'c2-chk-24',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'High-Stakes Negotiation & Concession Phrasing',
    titleFa: 'ادبیات مذاکره حساس و اعطای امتیازات متقابل (Give and Take)',
    descriptionFa: 'عبارات استراتژیک در مذاکره: meet in the middle, non-starter, on condition that, trade-off.',
    scientificReference: 'Fisher & Ury: Getting to Yes (Principled Negotiation); CEFR C1 Professional Interaction',
    criteriaForMasteryFa: 'مدیریت یک اختلاف نظر تجاری با پیشنهاد راهکارهای میانه و زبان اصیل مذاکره.',
    exampleGood: "While that price point is a non-starter for us, we could meet you halfway if the timeline is flexible.",
    exampleBad: 'I cannot accept this price. Give me discount.',
    priorityOrder: 24,
  },
  {
    id: 'c2-chk-25',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'idioms',
    categoryFa: 'اصطلاحات و کلیشه‌های نیتیو',
    titleEn: 'Culturally Embedded Metaphors & Sports Idioms',
    titleFa: 'استعاره‌های ریشه‌دار فرهنگی و ورزشی در گفتار عمومی (Ballpark figure, Curveball)',
    descriptionFa: 'اصطلاحاتی نظیر throw a curveball, in the ballpark, drop the ball, hit a home run در محاورات روزمره.',
    scientificReference: 'Lakoff & Johnson: Metaphors We Live By; CEFR C1 Sociolinguistic Competence',
    criteriaForMasteryFa: 'درک و به‌کارگیری استعاره‌های فرهنگی آمریکایی بدون تعجب یا تفسیر لفظی.',
    exampleGood: "The client threw us a real curveball with that last-minute requirement change.",
    exampleBad: 'The client did something unexpected to us.',
    priorityOrder: 25,
  },
  {
    id: 'c2-chk-26',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'discourse',
    categoryFa: 'پیوستگی گفتار و دیسکورس',
    titleEn: 'Spontaneous Reformulation & Mid-Sentence Repairs',
    titleFa: 'بازآرایی فی‌البداهه جمله بدون توقف یا از دست دادن تسلط (Spontaneous Repair)',
    descriptionFa: 'توانایی تصحیح یا تدقیق کلام در حین صحبت با عباراتی چون or rather, let me rephrase that, to put it more precisely.',
    scientificReference: 'Levelt: Speaking: From Intention to Articulation; CEFR C1 Fluency Descriptors',
    criteriaForMasteryFa: 'اصلاح مسیر جمله بدون تپق زدن یا شرمندگی، با حفظ اعتماد به نفس کامل.',
    exampleGood: "We should scrap the plan—or rather, pivot our focus to the enterprise tier.",
    exampleBad: 'We scrap... no wait... I mean... uh... change.',
    priorityOrder: 26,
  },
  {
    id: 'c2-chk-27',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Intonation Contours: High-Rising Terminals vs Falling Declaratives',
    titleFa: 'تطابق آهنگ کلام (Intonation) با قصد ارتباطی (کاهش لحن مردد Uptalk)',
    descriptionFa: 'پایان دادن جملات خبری با افت تن صدا (Falling tone) برای القای قاطعیت و اقتدار، و استفاده به جا از خیز صدا.',
    scientificReference: 'Wells: English Intonation: An Introduction; CEFR C1 Phonological Control',
    criteriaForMasteryFa: 'اجتناب از زیروبم سوالی در پایان جملات خبری (عدم استفاده ناخواسته از Uptalk).',
    exampleGood: "Our strategy is already yielding measurable results. [Firm falling tone]",
    exampleBad: 'Our strategy is already yielding results? [Uncertain high rising tone]',
    priorityOrder: 27,
  },
  {
    id: 'c2-chk-28',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Participle Clauses & Adverbial Participles in Speech',
    titleFa: 'بندهای وجه‌وصلی (Participle Clauses) برای پیوستگی روایی و غنای ساختاری',
    descriptionFa: 'ترکیب جملات با وجه‌وصلی: Having wrapped up the project, we celebrated; Taking everything into account...',
    scientificReference: 'Huddleston & Pullum: The Cambridge Grammar of the English Language; CEFR C1',
    criteriaForMasteryFa: 'کاربرد خودجوش عبارات وجه‌وصلی در توضیح رخدادها یا جمع‌بندی مباحث.',
    exampleGood: "Having evaluated all prospective vendors, we settled on the cloud-native solution.",
    exampleBad: 'We evaluated all vendors and after that we selected cloud solution.',
    priorityOrder: 28,
  },
  {
    id: 'c2-chk-29',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'Handling Interruptions & Floor Holding in Meetings',
    titleFa: 'مدیریت قطع کلام و حفظ نوبت صحبت در جلسات پرچالش (Floor Holding)',
    descriptionFa: 'عبارات حرفه‌ای برای بازپس‌گیری حق صحبت: If I could just finish this thought..., Hang on a second, let me just add...',
    scientificReference: 'Sacks, Schegloff & Jefferson: A Simplest Systematics for the Organization of Turn-Taking; CEFR C1',
    criteriaForMasteryFa: 'حفظ آرامش و بازپس‌گیری رشته کلام در صورت وقفه همکار یا مخاطب.',
    exampleGood: "If I could just finish my train of thought before we open it up for comments...",
    exampleBad: 'Stop talking, let me talk.',
    priorityOrder: 29,
  },
  {
    id: 'c2-chk-43',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'discourse',
    categoryFa: 'پیوستگی گفتار و دیسکورس',
    titleEn: 'Public Speaking & Presentation Delivery',
    titleFa: 'سخنرانی در جمع و ارائه حرفه‌ای (signposting، قلاب شروع، جمع‌بندی)',
    descriptionFa: 'ساختار ارائه آمریکایی: hook، roadmap (Today I\'ll cover three things)، signposting (Moving on to...)، و closing takeaway با اعتمادبه‌نفس و لحن falling declarative.',
    scientificReference: 'CEFR C1 Spoken Production: Sustained Monologue; Duarte: Resonate',
    criteriaForMasteryFa: 'ارائه ۲ دقیقه‌ای منسجم با مقدمه، ۲–۳ نکته اصلی و جمع‌بندی، بدون خواندن ترجمه‌ی فارسی.',
    exampleGood: "I'll keep this brief: first the problem, then what we tried, and finally the ask. Let's start with the customer pain point.",
    exampleBad: 'My presentation is about project. First thing... um... wait... next slide.',
    priorityOrder: 29.5,
  },
  {
    id: 'c2-chk-30',
    tier: 3,
    tierNameFa: 'فاز ۳: پولیش لهجه، ساختارهای تاکیدی و استدلال پیشرفته (B2+ - C1)',
    cefrLevel: 'C1',
    category: 'idioms',
    categoryFa: 'اصطلاحات و کلیشه‌های نیتیو',
    titleEn: 'Collocational Precision: Connotation & Lexical Density',
    titleFa: 'دقت در همنشینی واژگان و بار معنایی (Collocations & Connotation)',
    descriptionFa: 'تمایز ظریف کلمات مترادف بر اساس بار منفی یا مثبت: frugal در برابر stingy, ambitious در برابر ruthless.',
    scientificReference: 'Sinclair: Corpus, Concordance, Collocation; CEFR C1 Lexical Resource',
    criteriaForMasteryFa: 'انتخاب دقیق واژه‌ها متناسب با بار احساسی مورد نظر بدون استفاده از کلمات غلط‌انداز.',
    exampleGood: "He is prudent with capital, whereas his predecessor was outright reckless.",
    exampleBad: 'He is good with money and the other was very bad.',
    priorityOrder: 30,
  },

  // ================= TIER 4: Advanced Native Fluency & Pragmatic Mastery (C1+ - C2) =================
  {
    id: 'c2-chk-31',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'listening',
    categoryFa: 'شنیدار و درک کنایه‌ها و لایه‌های پنهان گفتار نیتیو',
    titleEn: 'Auditory Irony, Sarcasm & Implicit Subtext Comprehension',
    titleFa: 'درک شنیداری کنایه‌ها، طنز تلخ و لایه‌های پنهان کلام (Auditory Sarcasm & Implicit Subtext)',
    descriptionFa: 'درک لحن‌های صوتی ظریف و تشخیص تضاد میان محتوای لفظی و پیام شنیداری نیتیو (Understatement) بر اساس ملودی و آهنگ صدا.',
    scientificReference: 'Gibbs: The Poetics of Mind; CEFR C2 Listening & Pragmatic Competence',
    criteriaForMasteryFa: 'پاسخ دادن هوشمندانه به کنایه‌های فرهنگی و طنز بدون جدی گرفتن تحت‌اللفظی آنها.',
    exampleGood: "Oh, fantastic! A flat tire in the pouring rain—just what my morning was missing.",
    exampleBad: 'Why do you say fantastic? Flat tire is very bad.',
    priorityOrder: 31,
  },
  {
    id: 'c2-chk-32',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Coalescent Assimilation in Fast Speech (Would you -> /wʊdʒu/)',
    titleFa: 'همگونی آوایی گفتار پرسرعت نیتیو (Coalescent Assimilation)',
    descriptionFa: 'ترکیب اصوات مجاور در سرعت بالا: What did you -> /wʌdʒə/, don\'t you -> /doʊntʃu/, could you -> /kʊdʒu/.',
    scientificReference: 'Gimson: Pronunciation of English; CEFR C2 Phonological Competence',
    criteriaForMasteryFa: 'درک و تولید طبیعی آواهای همگون‌شده در مکالمه سریع بدون تصنعی بودن.',
    exampleGood: "What'd you think about that keynote speech?",
    exampleBad: 'What | did | you | think (با مکث کامل بین واژه‌ها).',
    priorityOrder: 32,
  },
  {
    id: 'c2-chk-33',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'Seamless Register Shifting (Street Casual to Executive Boardroom)',
    titleFa: 'انعطاف در تغییر سبک گفتار (از گپ صمیمانه تا مذاکره رسمی عالی‌رتبه)',
    descriptionFa: 'تغییر بدون زحمت لحن از اسلنگ و اصطلاحات روزمره به واژگان فاخر و استراتژیک بر اساس مخاطب.',
    scientificReference: 'Biber: Register, Genre, and Style; CEFR C2 Sociolinguistic Appropriateness',
    criteriaForMasteryFa: 'تطبیق فوری کلمات و ساختارها متناسب با تغییر نقش و موقعیت در سناریو.',
    exampleGood: "Casual: 'That's a no-go.' / Formal: 'From a fiscal standpoint, that approach lacks viability.'",
    exampleBad: 'استفاده از لحن کوچه بازاری در جلسه هیئت مدیره یا برعکس.',
    priorityOrder: 33,
  },
  {
    id: 'c2-chk-34',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'discourse',
    categoryFa: 'پیوستگی گفتار و دیسکورس',
    titleEn: 'Rhetorical Rule of Three & Triadic Cadence in Spoken Arguments',
    titleFa: 'ریتم سه‌گانه بلاغی (Tricolon / Rule of Three) در استدلال‌های متقاعدکننده',
    descriptionFa: 'چینش استدلال‌ها در گروه‌های سه‌تایی موازی برای حداکثر تاثیرگذاری و جاذبه شنیداری.',
    scientificReference: 'Cockcroft & Cockcroft: Persuasing People: An Introduction to Rhetoric; CEFR C2 Coherence',
    criteriaForMasteryFa: 'استفاده از سه‌گانه‌های آهنگین در دفاع از یک ایده یا جمع‌بندی یک موضوع مهم.',
    exampleGood: "This strategy empowers our team, streamlines our workflow, and accelerates our growth.",
    exampleBad: 'This strategy is good for team and also workflow is faster and growth happens.',
    priorityOrder: 34,
  },
  {
    id: 'c2-chk-35',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'phonetics',
    categoryFa: 'آکوستیک و فونتیک امریکن',
    titleEn: 'Vowel Duration Before Voiced vs Voiceless Consonants',
    titleFa: 'تنظیم کشش واکه قبل از همخوان‌های واکدار و بی‌واک (Vowel Pre-Fortis Clipping)',
    descriptionFa: 'در امریکن، واکه قبل از صامت واکدار (b, d, g, z) طولانی‌تر است از صامت بی‌واک (p, t, k, s): bed کشیده‌تر از bet است.',
    scientificReference: 'House: Analog Study of Speech Characteristics; CEFR C2 Acoustic Mastery',
    criteriaForMasteryFa: 'ادای دقیق تفاوت کشش صدادارها در جفت‌های کمینه (bad vs bat, cab vs cap).',
    exampleGood: "He had a bad [bæ:d] cold and had to take a cab [kʰæ:b].",
    exampleBad: 'تلفظ مساوی و کوتاه واکه‌ها بدون توجه به واکداری صامت پایانی.',
    priorityOrder: 35,
  },
  {
    id: 'c2-chk-36',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'idioms',
    categoryFa: 'اصطلاحات و کلیشه‌های نیتیو',
    titleEn: 'Idiomatic Deconstruction & Spontaneous Double Entendre',
    titleFa: 'شکستن خلاقانه اصطلاحات و شوخی‌های زبانی چندوجهی (Wordplay & Pun)',
    descriptionFa: 'توانایی بازی با کلمات و تغییر خلاقانه یک اصطلاح رایج برای شوخی یا تاکید بیشتر در مکالمه.',
    scientificReference: 'Crystal: Language Play; CEFR C2 Lexical Resource & Creativity',
    criteriaForMasteryFa: 'درک ایهام‌ها و شوخی‌های زبانی بومی و توانایی پاسخ متقابل هوشمندانه.',
    exampleGood: "They told us to think outside the box, but honestly, there was never a box to begin with.",
    exampleBad: 'عدم درک شوخی‌های کلامی نیتیوها و سکوت ناشی از سردرگمی.',
    priorityOrder: 36,
  },
  {
    id: 'c2-chk-37',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'grammar',
    categoryFa: 'دستور زبان و نحو',
    titleEn: 'Subjunctive Mood in Complex Organizational Directives',
    titleFa: 'کاربرد وجه التزامی پیشرفته (Subjunctive) در موقعیت‌های مدیریتی و حقوقی',
    descriptionFa: 'ساختار فعل ساده بدون s سوم‌شخص: I recommend that he be present; It is imperative that she arrive on time.',
    scientificReference: 'Huddleston: Introduction to the Grammar of English; CEFR C2 Grammatical Precision',
    criteriaForMasteryFa: 'بیان دستورالعمل‌های رسمی یا توصیه‌های حقوقی با وجه التزامی بدون افزودن s یا to be.',
    exampleGood: "I strongly propose that every stakeholder be consulted before finalizing the draft.",
    exampleBad: 'I recommend that everyone is consulted / must be consulted.',
    priorityOrder: 37,
  },
  {
    id: 'c2-chk-38',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'discourse',
    categoryFa: 'پیوستگی گفتار و دیسکورس',
    titleEn: 'Uninterrupted Impromptu Monologue under Cognitive Load (2+ mins)',
    titleFa: 'ارائه مونولوگ فی‌البداهه منسجم بدون مکث و تپق تحت فشار شناختی',
    descriptionFa: 'قدرت صحبت ممتد، شیوا و ساختاریافته به مدت بیش از دو دقیقه درباره یک موضوع پیچیده انتزاعی.',
    scientificReference: 'Cambridge CPE Speaking Rubric: Discourse Management C2 (Extended, coherent production)',
    criteriaForMasteryFa: 'صحبت پیوسته با ساختار مقدمه، تحلیل و نتیجه‌گیری بدون منقطع شدن جریان کلام.',
    exampleGood: "Speaking fluently for 2 minutes analyzing ethics of AI with seamless transitions.",
    exampleBad: 'مکث‌های متوالی بعد از هر جمله و ناتوانی در پروراندن ایده.',
    priorityOrder: 38,
  },
  {
    id: 'c2-chk-39',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'pragmatics',
    categoryFa: 'اتیکت گفتاری و کاربردشناسی',
    titleEn: 'Metaphorical Framing in Abstract & Strategic Discourse',
    titleFa: 'چارچوب‌بندی استعاری عمیق در تحلیل‌های راهبردی و فلسفی',
    descriptionFa: 'استفاده از شبکه‌های استعاری برای تبیین مسائل چندبعدی (unravel the knot, double-edged sword, tip of the iceberg).',
    scientificReference: 'Charteris-Black: Corpus Approaches to Critical Metaphor Analysis; CEFR C2',
    criteriaForMasteryFa: 'تبیین یک چالش پیچیده کاری یا فکری با استعاره‌های پیوسته و متوازن.',
    exampleGood: "This policy is a double-edged sword: while it shields us from short-term volatility, it throttles long-term innovation.",
    exampleBad: 'This policy has good things and bad things.',
    priorityOrder: 39,
  },
  {
    id: 'c2-chk-40',
    tier: 4,
    tierNameFa: 'فاز ۴: استادی کامل، ظرافت‌های کنایی و روانی بومی (C1+ - C2 Native Mastery)',
    cefrLevel: 'C2',
    category: 'discourse',
    categoryFa: 'پیوستگی گفتار و دیسکورس',
    titleEn: 'Native Spoken Fluidity: 150+ WPM with Natural Intonation & Prosody',
    titleFa: 'روانی کامل زبان مادری با سرعت کلام بالای ۱۵۰ کلمه در دقیقه و آهنگ طبیعی',
    descriptionFa: 'بیان خودکار، روان و بی‌تلاش با آهنگ، ریتم و ملودی گفتاری کاملاً منطبق بر یک تحصیل‌کرده بومی آمریکایی.',
    scientificReference: 'CEFR C2 Global Scale: Can express him/herself spontaneously, very fluently and precisely',
    criteriaForMasteryFa: 'ادای جملات با سرعت ۱۵۰ تا ۱۷۰ کلمه در دقیقه بدون خطا در تلفظ یا نحو.',
    exampleGood: "Natural native delivery matching top-tier American professional podcast/keynote cadence.",
    exampleBad: 'گفتار کند، مکانیکی یا پر از مکث‌های جستجوی واژه.',
    priorityOrder: 40,
  },
];

/**
 * Returns the next cohort of exactly 10 unticked checklist items
 * prioritized scientifically according to priorityOrder.
 */
export function getNextUntickedC2Cohort(masteredIds: string[], count = 10): C2ChecklistItem[] {
  const masteredSet = new Set(masteredIds);
  const unticked = C2_SCIENTIFIC_CHECKLIST
    .filter((item) => !masteredSet.has(item.id))
    .sort((a, b) => a.priorityOrder - b.priorityOrder);
  return unticked.slice(0, count);
}

/**
 * Transforms an unticked C2 checklist item into a pedagogical CalendarScenario
 * designed for adaptive AI coaching with target grammar, cliches, and phonetics.
 */
export function buildScenarioForChecklistItem(
  item: C2ChecklistItem,
  dayIndex: number,
  cycleNumber: number
): {
  id: string;
  dayIndex: number;
  targetLevel: string;
  phaseTitleFa: string;
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
  targetGrammar: string;
  targetGrammarFa: string;
  targetCliches: string[];
  targetVocabulary: string[];
  targetPronunciation: string;
  activeWeaknessesInjected: string[];
  status: 'current' | 'upcoming';
  targetChecklistItemId: string;
  cycleNumber: number;
} {
  const id = `c2-cycle${cycleNumber}-sc${dayIndex}-${item.id}`;
  
  // Icon and role categorization based on checklist item domain
  let icon = '🎯';
  let category: 'daily' | 'work' | 'travel' | 'social' | 'emergency' | 'personal' = 'daily';
  let userRole = 'زبان‌آموز کوشا';
  let aiRole = 'پارتنر و مربی هوش مصنوعی';
  let relationship = 'مربی و دوست نیتیو';

  if (item.category === 'grammar') {
    icon = '📐';
    category = 'work';
    userRole = 'همکار در پروژه کاری';
    aiRole = 'سرپرست تیم (مربی هوش مصنوعی)';
    relationship = 'همکار حرفه‌ای در شرکت';
  } else if (item.category === 'phonetics') {
    icon = '🎙️';
    category = 'daily';
    userRole = 'مشتری در کافه یا فروشگاه';
    aiRole = 'باریستا یا متصدی نیتیو';
    relationship = 'تعامل روزمره شهری';
  } else if (item.category === 'idioms') {
    icon = '✨';
    category = 'social';
    userRole = 'مهمان در دورهمی دوستانه';
    aiRole = 'دوست صمیمی آمریکایی';
    relationship = 'دوست نزدیک و اهل شوخی';
  } else if (item.category === 'pragmatics') {
    icon = '🤝';
    category = 'work';
    userRole = 'مذاکره‌کننده در جلسه';
    aiRole = 'طرف مقابل مذاکره';
    relationship = 'شریک تجاری یا همکار';
  } else   if (item.id === 'c2-chk-43') {
    icon = '🎤';
    category = 'work';
    userRole = 'ارائه‌دهنده در جلسه تیمی';
    aiRole = 'مدیر محصول و حضار';
    relationship = 'ارائه رسمی کوتاه در محیط کار';
  } else if (item.id === 'c2-chk-41') {
    icon = '☕';
    category = 'social';
    userRole = 'همکار جدید در آشپزخانه اداری';
    aiRole = 'همکار آمریکایی اهل گپ';
    relationship = 'اسمال‌تاک روزمره قبل از جلسه';
  } else if (item.id === 'c2-chk-42') {
    icon = '🤝';
    category = 'work';
    userRole = 'مشتری یا همکار آسیب‌دیده از تأخیر';
    aiRole = 'مسئول پشتیبانی / طرف مقابل';
    relationship = 'عذرخواهی و شکایت سازنده';
  } else if (item.category === 'discourse') {
    icon = '🧠';
    category = 'social';
    userRole = 'تحلیل‌گر و ارائه‌دهنده';
    aiRole = 'پارتنر مباحثه فکری';
    relationship = 'هم‌صحبت صاحب‌نظر';
  } else if (item.category === 'listening') {
    icon = '🎧';
    category = 'social';
    userRole = 'شنونده و هم‌صحبت فعال';
    aiRole = 'پارتنر گفتگوی سریع نیتیو آمریکایی';
    relationship = 'گفتگوی محاوره‌ای با سرعت طبیعی';
  }

  // Realistic conversational starter that naturally pulls the user into practicing the target skill
  let starter = `Hey there! We're focusing today on mastering "${item.titleEn}". Let's jump right in: how would you express this idea in natural conversation?`;
  let starterFa = `درود! تمرکز امروز ما روی تسلط بر «${item.titleFa}» است. بیایید شروع کنیم: چطور این مفهوم را در یک مکالمه طبیعی بیان می‌کنید؟`;

  if (item.id === 'c2-chk-01') {
    starter = "I was just checking our team survey, and it says most people are deeply interested in remote work. What kinds of activities or hobbies are you genuinely interested in?";
    starterFa = "داشتم نظرسنجی تیم رو می‌دیدم؛ نوشته بیشتر بچه‌ها علاقه عمیقی به دورکاری دارن. تو خودت قلباً به چه کارها یا تفریحاتی علاقه‌مندی؟";
  } else if (item.id === 'c2-chk-02') {
    starter = "Some folks on our team think four-day work weeks boost productivity, while others disagree. What's your honest take—do you agree with that policy?";
    starterFa = "بعضی از همکارا معتقدن هفته‌های کاری ۴ روزه بازدهی رو بالا می‌بره، اما بعضیا مخالفن. نظر واقعی خودت چیه—آیا با این سیاست موافقی؟";
  } else if (item.id === 'c2-chk-03') {
    starter = "Hey! It's so hot outside today. Could I get you a cold bottle of water or something better from the cafe across the street?";
    starterFa = "سلام! بیرون خیلی گرمه امروز. برات یه بطری آب خنک بگیرم یا چیز بهتری از کافه اون‌ور خیابون دوست داری؟";
  } else if (item.id === 'c2-chk-05') {
    starter = "We were just reminiscing about crazy road trips. Tell me about a past vacation where something completely unexpected happened along the way!";
    starterFa = "داشتیم خاطرات سفرهای جاده‌ای عجیب رو مرور می‌کردیم. از یه مسافرت گذشته‌ت بگو که وسط راه یه اتفاق کاملاً غیرمنتظره افتاد!";
  } else if (item.id === 'c2-chk-07') {
    starter = "Excuse me, I'm a bit turned around in this huge building. Do you happen to know where the executive briefing room is?";
    starterFa = "ببخشید، من توی این ساختمون بزرگ یه کم راهمو گم کردم. شما تصادفاً می‌دونید اتاق جلسات مدیران ارشد کجاست؟";
  } else if (item.id === 'c2-chk-11') {
    starter = "I'm facing a huge dilemma: I got offered an exciting startup role, but with lower pay. If you were in my shoes, what would you do?";
    starterFa = "سر یه دو‌راهی بزرگ گیر کردم: یه پیشنهاد کار استارتاپی هیجان‌انگیز گرفتم ولی حقوقش کمتره. اگه تو جای من بودی، چیکار می‌کردی؟";
  } else if (item.id === 'c2-chk-14') {
    starter = "I'm proposing we push back the entire project deadline by three months. What do you think of this approach?";
    starterFa = "پیشنهاد من اینه که کل مهلت تحویل پروژه رو سه ماه عقب بندازیم. نظرت درباره این رویکرد چیه؟";
  }

  return {
    id,
    dayIndex,
    targetLevel: item.cefrLevel,
    phaseTitleFa: item.tierNameFa,
    title: `Targeting: ${item.titleEn}`,
    titleFa: `سناریوی ${dayIndex}: ${item.titleFa}`,
    category,
    context: `تمرکز ویژه بر رفع نقطه ضعف علمی: ${item.titleFa} بر مبنای چک‌لیست C2 (${item.scientificReference})`,
    relationship,
    userRole,
    aiRole,
    icon,
    starter,
    starterFa,
    targetGrammar: item.titleEn,
    targetGrammarFa: `${item.titleFa} — ${item.descriptionFa}`,
    targetCliches: [item.titleEn],
    targetVocabulary: [item.titleEn, item.categoryFa],
    targetPronunciation: item.category === 'phonetics' ? item.titleFa : 'تلفظ روان و پیوسته نیتیو امریکن',
    activeWeaknessesInjected: [item.titleFa],
    status: dayIndex === 1 ? 'current' : 'upcoming',
    targetChecklistItemId: item.id,
    cycleNumber,
  };
}

/**
 * Generates an exact cohort of 10 scenarios for the 10 unticked items of the current cycle.
 */
export function generateTenScenariosForUntickedCohort(
  untickedItems: C2ChecklistItem[],
  cycleNumber: number
) {
  return untickedItems.slice(0, 10).map((item, index) => {
    return buildScenarioForChecklistItem(item, index + 1, cycleNumber);
  });
}

/**
 * Intelligently maps an identified learner weakness to one of the 40 scientific C2 Checklist items.
 */
export function matchWeaknessToC2ChecklistItem(
  titleFa: string = '',
  category: string = '',
  descriptionFa: string = ''
): C2ChecklistItem | undefined {
  const text = `${titleFa} ${category} ${descriptionFa}`.toLowerCase();

  // Keyword rules prioritizing specific pedagogical categories
  if (text.includes('flap') || text.includes('فلپ') || text.includes('water') || text.includes('city') || text.includes('better')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-03');
  }
  if (text.includes('agree') || text.includes('موافقم') || text.includes('i am agree') || text.includes('فعل حالتی')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-02');
  }
  if (text.includes('حرف اضافه') || text.includes('preposition') || text.includes('interested to') || text.includes('marry with') || text.includes('listen to')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-01');
  }
  if (text.includes('w vs v') || text.includes('صدای w') || text.includes('غنچه') || text.includes('went') || text.includes('very')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-06');
  }
  if (text.includes('گذشته') || text.includes('حال کامل') || text.includes('present perfect') || text.includes('past simple') || text.includes('ago')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-04');
  }
  if (text.includes('glottal') || text.includes('چاکنایی') || text.includes('button') || text.includes('mountain')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-19');
  }
  if (text.includes('شرطی') || text.includes('conditional') || text.includes('if i were')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-08');
  }
  if (text.includes('غیرمستقیم') || text.includes('indirect question') || text.includes('do you know where')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-07');
  }
  if (text.includes('پیوستگی') || text.includes('linking') || text.includes('connected speech') || text.includes('انقباض')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-10');
  }
  if (text.includes('لحن') || text.includes('تعارف') || text.includes('رسمی') || text.includes('register') || text.includes('softening') || text.includes('hedging')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-14') || C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-20');
  }
  if (text.includes('اصطلاح') || text.includes('idiom') || text.includes('کلیشه') || text.includes('کالوکیشن') || text.includes('collocation')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-15') || C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-18');
  }
  if (text.includes('روایت') || text.includes('داستان') || text.includes('خاطره') || text.includes('narrative')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-05');
  }
  if (text.includes('شوآ') || text.includes('schwa') || text.includes('کاهش واکه') || text.includes('vowel reduction')) {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === 'c2-chk-16');
  }

  // Fallback match by category
  if (category === 'phonetics') {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.category === 'phonetics');
  }
  if (category === 'pragmatics') {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.category === 'pragmatics');
  }
  if (category === 'idioms') {
    return C2_SCIENTIFIC_CHECKLIST.find((i) => i.category === 'idioms');
  }

  return undefined;
}

/**
 * Returns a cohort of exactly 10 C2 checklist items tailored directly to the learner's
 * diagnosed weaknesses first, filling remaining slots from unticked items by priority.
 * When allowRemasterDiagnosed is true (post-cycle re-assessment), previously "mastered"
 * items that still show as weaknesses can re-enter the next 10-lesson cohort.
 */
export function getC2CohortForWeaknesses(
  weaknesses: Array<{ checklistItemId?: string; titleFa?: string; category?: string; descriptionFa?: string }>,
  masteredIds: string[] = [],
  count = 10,
  allowRemasterDiagnosed = false
): C2ChecklistItem[] {
  const masteredSet = new Set(masteredIds);
  const selectedItems: C2ChecklistItem[] = [];
  const selectedIds = new Set<string>();
  const remasteredIds: string[] = [];

  // 1. First prioritize items matching the user's diagnosed weaknesses
  for (const w of weaknesses) {
    let matchedItem: C2ChecklistItem | undefined;
    if (w.checklistItemId) {
      matchedItem = C2_SCIENTIFIC_CHECKLIST.find((i) => i.id === w.checklistItemId);
    }
    if (!matchedItem && w.titleFa) {
      matchedItem = matchWeaknessToC2ChecklistItem(w.titleFa, w.category, w.descriptionFa);
    }
    if (!matchedItem || selectedIds.has(matchedItem.id)) continue;

    const wasMastered = masteredSet.has(matchedItem.id);
    if (wasMastered && !allowRemasterDiagnosed) continue;

    if (wasMastered && allowRemasterDiagnosed) {
      remasteredIds.push(matchedItem.id);
    }
    selectedItems.push(matchedItem);
    selectedIds.add(matchedItem.id);
    if (selectedItems.length >= count) break;
  }

  // 2. If fewer than count, fill up with remaining unticked items sorted by priorityOrder
  if (selectedItems.length < count) {
    const remainingUnticked = C2_SCIENTIFIC_CHECKLIST
      .filter((item) => !masteredSet.has(item.id) && !selectedIds.has(item.id))
      .sort((a, b) => a.priorityOrder - b.priorityOrder);

    for (const item of remainingUnticked) {
      selectedItems.push(item);
      selectedIds.add(item.id);
      if (selectedItems.length >= count) break;
    }
  }

  // Attach remaster metadata for callers that need to un-tick checklist items
  (selectedItems as any).__remasteredIds = remasteredIds;
  return selectedItems.slice(0, count);
}
