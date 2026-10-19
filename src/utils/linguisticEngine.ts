import {
  SpeakingAnalysis,
  Scenario,
  AIPersona,
  CalendarScenario,
  WeaknessItem,
  ResponseGuidance,
  AmericanConceptModel,
  PracticeEvaluationResult,
} from '../types';

export interface GeneratedSituation {
  targetCliche: string;
  situationTitleFa: string;
  situationContextFa: string;
  relationship: string;
  conversationalPrompt: string;
  conversationalPromptFa: string;
  hint: string;
  guidance?: ResponseGuidance;
  idealSampleResponse: string;
  idealSampleResponseFa: string;
}

// Multi-scenario presets for American idioms and clichés (providing distinct contexts per click)
export const KNOWN_PRACTICE_SITUATIONS: Record<string, GeneratedSituation[]> = {
  'call it a day': [
    {
      targetCliche: 'call it a day',
      situationTitleFa: 'پایان دادن به کار با همکار بعد از رفع باگ طولانی',
      situationContextFa: 'ساعت‌ها روی پروژه مشترک کار کرده‌اید و دیگر بازدهی ندارید. به همکارتان پیشنهاد توقف کار و ادامه با انرژی تازه در صبح فردا را می‌دهید.',
      relationship: 'همکار / هم‌تیمی در شرکت',
      conversationalPrompt: "We've been troubleshooting this nasty bug for five hours straight. Should we keep pushing or take a break?",
      conversationalPromptFa: 'پنج ساعت یک‌نفس داریم این باگ بدقلق رو رفع می‌کنیم. به نظرت ادامه بدیم یا استراحت کنیم؟',
      hint: 'راهنمای پاسخ: خستگی مشترک را یادآوری کنید و پیشنهاد دهید ادامه کار با ذهن باز به فردا موکول شود.',
      guidance: {
        approachFa: 'ابتدا وضعیت انرژی تیم را به رسمیت بشناسید (مثلاً ما خسته‌ایم و بازدهی نداریم)، سپس پیشنهاد توقف کار و از سرگیری با انرژی تازه در روز بعد را بدهید.',
        suggestedPattern: "We're all exhausted, so let's just call it a day and [pick it up tomorrow / resume in the morning].",
        keyCollocations: ['five hours straight', 'fresh eyes', 'exhausted', 'pick it up tomorrow'],
        culturalTipFa: 'در محیط کار سالم در فرهنگ غرب، مرز کشیدن بین ساعات کار و سلامتی پذیرفته شده است؛ عبارت "call it a day" این مرز را با صمیمیت و پذیرش عمومی تعیین می‌کند.',
      },
      idealSampleResponse: "We're all exhausted, so let's just call it a day and pick it up tomorrow morning.",
      idealSampleResponseFa: 'همه خسته‌ایم، پس بیا کار رو امروز تعطیل کنیم و فردا صبح ادامه‌ش بدیم.',
    },
    {
      targetCliche: 'call it a day',
      situationTitleFa: 'درس خواندن شبانه برای امتحان نهایی در کتابخانه',
      situationContextFa: 'ساعت ۱ شب است و شما و همکلاسی‌تان در کتابخانه دانشگاه ۴ فصل از کتاب را خلاصه کرده‌اید. چشمانتان خسته است و وقت خوابیدن رسیده.',
      relationship: 'هم‌کلاسی و پارتنر مطالعه',
      conversationalPrompt: "It's already past 1 AM and we've finished chapter four. Do you want to tackle chapter five tonight?",
      conversationalPromptFa: 'الان ساعت از ۱ شب گذشته و فصل چهار رو تموم کردیم. می‌خوای امشب بریم سراغ فصل پنج؟',
      hint: 'راهنمای پاسخ: قدردانی از پیشرفت امشب و پیشنهاد پایان دادن به مطالعه برای حفظ تمرکز فردا.',
      guidance: {
        approachFa: 'پیشرفت خوب تا این لحظه را تایید کنید و بگویید خواب کافی برای امتحان حیاتی است، پس وقت پایان دادن به مطالعه امشب است.',
        suggestedPattern: "I think our brains are fried. Let's call it a day and get some sleep.",
        keyCollocations: ['past 1 AM', 'brains are fried', 'get some sleep', 'fresh start'],
        culturalTipFa: 'دانشجویان آمریکایی معمولاً برای توصیف خستگی ذهنی از اصطلاح "brain is fried" در کنار "call it a day" استفاده می‌کنند.',
      },
      idealSampleResponse: "Our brains are fried at this point. Let's call it a day and get some sleep.",
      idealSampleResponseFa: 'دیگه مغزمون تا اینجا قفل کرده. بیا امشب تمومش کنیم و یه کم بخوابیم.',
    },
    {
      targetCliche: 'call it a day',
      situationTitleFa: 'نقل مکان و اثاث‌کشی سنگین خانه با دوست',
      situationContextFa: 'کل بعدازظهر در حال بسته‌بندی و جابجایی جعبه‌های سنگین بوده‌اید و دست و کمرتان خسته شده است.',
      relationship: 'دوست صمیمی / هم‌اتاقی',
      conversationalPrompt: "We still have ten more boxes left in the hallway, but my back is killing me. What do you think?",
      conversationalPromptFa: 'هنوز ده تا جعبه دیگه توی راهرو مونده، اما کمرم داره از درد نصف می‌شه. نظرت چیه؟',
      hint: 'راهنمای پاسخ: همدلی با خستگی جسمانی دوستتان و پیشنهاد موکول کردن جعبه‌های باقی‌مانده به فردا.',
      guidance: {
        approachFa: 'همدلی شدید نشان دهید و تاکید کنید که کار طاقت‌فرسا بوده و بهتر است بقیه کار به فردا واگذار شود.',
        suggestedPattern: "You've worked so hard today, let's just call it a day and order some pizza.",
        keyCollocations: ['back is killing me', 'order some pizza', 'leave the rest for tomorrow'],
        culturalTipFa: 'در فرهنگ آمریکایی پس از یک کار بدنی سخت با دوستان، اصطلاح "call it a day" اغلب همراه با پیشنهاد سفارش غذا (مانند پیتزا) می‌آید.',
      },
      idealSampleResponse: "My back is sore too. Let's just call it a day, order a pizza, and do the rest tomorrow.",
      idealSampleResponseFa: 'کمر منم گرفته. بیا امروز دست از کار بکشیم، یه پیتزا سفارش بدیم و بقیه‌ش رو فردا انجام بدیم.',
    },
  ],
  'cut to the chase': [
    {
      targetCliche: 'cut to the chase',
      situationTitleFa: 'جلسه برنامه‌ریزی کاری با مدیر پروژه',
      situationContextFa: 'همکارتان در جلسه کاری توضیحات مقدماتی طولانی می‌دهد و وقت جلسه رو به پایان است. می‌خواهید مؤدبانه اما صریح بگویید سر اصل مطلب برویم.',
      relationship: 'همکار / مدیر پروژه',
      conversationalPrompt: "We have only five minutes left before the next meeting starts. Where should we focus?",
      conversationalPromptFa: 'فقط پنج دقیقه تا شروع جلسه بعدی وقت داریم. روی چی باید تمرکز کنیم؟',
      hint: 'راهنمای پاسخ: با توجه به کمبود وقت، با یک عبارت مشارکتی پیشنهاد ورود مستقیم به موضوع اصلی را بدهید.',
      guidance: {
        approachFa: 'ابتدا محدودیت زمان را تایید کنید و سپس به جای حالت دستوری، به شکل تیمی و مشارکتی (با Let\'s) پیشنهاد تمرکز روی تصمیم نهایی را مطرح کنید.',
        suggestedPattern: "Let's [just] cut to the chase and focus on [action/deliverables].",
        keyCollocations: ['bottom line', 'main deliverables', 'budget figures', 'wrap things up'],
        culturalTipFa: 'در فرهنگ کاری آمریکا وقت طلا است؛ گفتن "cut to the chase" بی‌ادبی نیست، بلکه نشانه عمل‌گرایی است به شرطی که با لحنی محترمانه و لحن مشارکتی بیان شود.',
      },
      idealSampleResponse: "Let's cut to the chase and focus on the main deliverables.",
      idealSampleResponseFa: 'بیا یک‌راست بریم سر اصل مطلب و روی نتایج اصلی تمرکز کنیم.',
    },
    {
      targetCliche: 'cut to the chase',
      situationTitleFa: 'مذاکره قیمت با تأمین‌کننده در نمایشگاه تجاری',
      situationContextFa: 'فروشنده شرکتی ۲۰ دقیقه است درباره تاریخچه و جوایز شرکتش داستان‌سرایی می‌کند و شما می‌خواهید رقم نهایی تخفیف را بدانید.',
      relationship: 'تأمین‌کننده / نماینده فروش',
      conversationalPrompt: "Before I show you the contract packages, let me explain our company's thirty-year heritage...",
      conversationalPromptFa: 'قبل از اینکه بسته‌های قراردادی رو بهتون نشون بدم، اجازه بدید تاریخچه سی‌ساله شرکتمون رو توضیح بدم...',
      hint: 'راهنمای پاسخ: با احترام صحبت را قطع کنید و درخواست کنید مستقیماً سراغ ارقام و پیشنهاد مالی بروید.',
      guidance: {
        approachFa: 'با لحنی حرفه‌ای اما قاطعانه عذرخواهی کنید و بگویید جلسه بعدی دارید و می‌خواهید یک‌راست قیمت نهایی را بررسی کنید.',
        suggestedPattern: "I appreciate the background, but could we cut to the chase and discuss the pricing?",
        keyCollocations: ['appreciate the background', 'pricing options', 'tight schedule', 'bottom-line cost'],
        culturalTipFa: 'در مذاکرات تجاری B2B در آمریکا، فروشندگان عادت دارند وقتی مشتری مقتدرانه می‌گوید "cut to the chase"، سریعاً به قیمت خالص بپردازند.',
      },
      idealSampleResponse: "I appreciate the overview, but we're on a tight schedule. Could we cut to the chase and see the pricing?",
      idealSampleResponseFa: 'از توضیحاتتون ممنونم، اما وقتمون محدوده. می‌تونیم بریم سر اصل مطلب و قیمت‌ها رو ببینیم؟',
    },
    {
      targetCliche: 'cut to the chase',
      situationTitleFa: 'درخواست مبهم و طفره رفتن دوست در کافی‌شاپ',
      situationContextFa: 'دوستتان به کافی‌شاپ آمده و دائم حاشیه می‌رود چون خجالت می‌کشد درخواست قرض گرفتن ماشین یا پول را مطرح کند.',
      relationship: 'دوست صمیمی',
      conversationalPrompt: "Hey, thanks for coming. I mean, the weather is nice, and work is okay, but... well, things are a little tricky lately...",
      conversationalPromptFa: 'سلام، مرسی که اومدی. راستش هوا خوبه و کارم بد نیست، اما... خب این روزا اوضاع یه خرده عجیب شده...',
      hint: 'راهنمای پاسخ: با صمیمیت به او آرامش دهید و بخواهید بدون مقدمه‌چینی مستقیم حرفش را بزند.',
      guidance: {
        approachFa: 'به او بگویید بین ما تعارف نیست و لازم نیست حاشیه برود؛ مستقیماً اصل موضوع را بگوید.',
        suggestedPattern: "Come on, you don't need to beat around the bush. Just cut to the chase, what happened?",
        keyCollocations: ['beat around the bush', 'what happened', 'no need to hesitate'],
        culturalTipFa: 'همنشینی اصطلاح "beat around the bush" (حاشیه‌رفتن) با "cut to the chase" در مکالمات دوستانه آمریکایی نشان‌دهنده رفاقت عمیق و بی‌پردگی است.',
      },
      idealSampleResponse: "Come on, we're best friends. Just cut to the chase, what do you need?",
      idealSampleResponseFa: 'بی‌خیال، ما صمیمی‌ترین دوستیم. رک برو سر اصل مطلب، چی لازم داری؟',
    },
  ],
  'play it by ear': [
    {
      targetCliche: 'play it by ear',
      situationTitleFa: 'هماهنگی تفریح آخر هفته با دوستان با ترافیک نامشخص',
      situationContextFa: 'دوستتان ساعت دقیق قرار را می‌پرسد، اما به دلیل کارهای نامشخص نمی‌توانید ساعت قطعی تعیین کنید و می‌خواهید بگویید بر اساس شرایط پیش می‌رویم.',
      relationship: 'دوست صمیمی',
      conversationalPrompt: "Should we lock in the reservation for exactly 6 PM, or what do you think?",
      conversationalPromptFa: 'آیا برای دقیقاً ساعت ۶ رزرو قطعی کنیم یا نظرت چیه؟',
      hint: 'راهنمای پاسخ: عدم قطعیت شرایط را توضیح دهید و پیشنهاد کنید زمان را باز بگذارید تا وضعیت روشن شود.',
      guidance: {
        approachFa: 'دلیل عدم امکان تعهد زمانی قطعی (مثل ترافیک یا اتمام کار) را بیان کنید و سپس برای اجتناب از استرس، پیشنهاد پیش رفتن بر اساس شرایط لحظه‌ای را بدهید.',
        suggestedPattern: "[Condition/Reason], so why don't we just play it by ear?",
        keyCollocations: ['unpredictable traffic', 'see how it goes', 'keep it flexible', 'check in around 5'],
        culturalTipFa: 'در مراودات دوستانه آمریکایی، انعطاف‌پذیری ارزشمند است و "play it by ear" دقیقاً حس راحتی و عدم تحمیل برنامه خشک را منتقل می‌کند.',
      },
      idealSampleResponse: "Traffic might be unpredictable today, so let's just play it by ear.",
      idealSampleResponseFa: 'ترافیک امروز ممکنه غیرقابل پیش‌بینی باشه، پس بیا فعلاً قطعی نکنیم ببینیم چی پیش میاد.',
    },
    {
      targetCliche: 'play it by ear',
      situationTitleFa: 'شام مشترک در فرودگاه با تأخیر پرواز',
      situationContextFa: 'شما در سفر کاری به شهر جدیدی رسیده‌اید ولی چمدان‌ها دیر می‌رسد و همکارتان می‌خواهد بداند برای شام ساعت مشخصی رزرو کند یا نه.',
      relationship: 'همکار در سفر کاری',
      conversationalPrompt: "Baggage claim is moving so slowly. Should I call the downtown restaurant and book for 8:30?",
      conversationalPromptFa: 'تحویل بار خیلی کند پیش می‌ره. به نظرت به رستوران مرکز شهر زنگ بزنم برای ساعت ۸:۳۰ رزرو کنم؟',
      hint: 'راهنمای پاسخ: پیش‌بینی تأخیر و پیشنهاد تصمیم‌گیری پس از خروج از فرودگاه.',
      guidance: {
        approachFa: 'بگویید اگر الان رزرو کند ممکن است نرسید و استرس بگیرید؛ پس بهتر است بعد از گرفتن تاکسی تصمیم بگیرید.',
        suggestedPattern: "We might miss the reservation if customs takes long. Why don't we play it by ear?",
        keyCollocations: ['baggage claim', 'miss the reservation', 'grab a cab first'],
        culturalTipFa: 'در مسافرت‌ها در آمریکا، "play it by ear" هوشمندانه‌ترین عبارت برای اجتناب از جریمه لغو رزروهاست.',
      },
      idealSampleResponse: "We might get stuck in line, so let's just play it by ear once we grab a cab.",
      idealSampleResponseFa: 'ممکنه توی صف گیر بیفتیم، پس بیا فعلاً برنامه نریزیم و وقتی سوار تاکسی شدیم تصمیم بگیریم.',
    },
    {
      targetCliche: 'play it by ear',
      situationTitleFa: 'پیک‌نیک آخر هفته در هوای ابری و نامطمئن',
      situationContextFa: 'قصد داشتید به پارک بروید اما هواشناسی ۵۰٪ احتمال باران داده و دوستتان مردد است.',
      relationship: 'دوست خانوادگی',
      conversationalPrompt: "The weather forecast says scattered showers this afternoon. Should we call off the barbecue?",
      conversationalPromptFa: 'هواشناسی برای عصر رگبارهای پراکنده زده. به نظرت باربیکیو رو کنسل کنیم؟',
      hint: 'راهنمای پاسخ: پیشنهاد لغو نکردن سریع، بلکه چک کردن آسمان تا ساعت ۲ و تصمیم‌گیری لحظه‌ای.',
      guidance: {
        approachFa: 'بگویید شاید اصلاً باران نبارد، پس برنامه را کاملاً لغو نکنیم و تا ظهر اوضاع ابر را رصد کنیم.',
        suggestedPattern: "Let's not cancel just yet. We can play it by ear around noon.",
        keyCollocations: ['scattered showers', 'call off', 'around noon', 'check the radar'],
        culturalTipFa: 'آمریکایی‌ها هنگام تغییرات جوی ناپایدار همیشه از "play it by ear" استفاده می‌کنند تا روز تعطیل بیهوده خراب نشود.',
      },
      idealSampleResponse: "It might clear up, so let's not cancel yet. Let's just play it by ear until noon.",
      idealSampleResponseFa: 'شاید هوا باز بشه، پس فعلاً کنسل نکنیم. تا ظهر ببینیم چی پیش میاد.',
    },
  ],
  'under the weather': [
    {
      targetCliche: 'under the weather',
      situationTitleFa: 'اعلام کسالت و دورکاری به سرپرست شرکت',
      situationContextFa: 'کمی احساس سرماخوردگی و کسالت دارید و می‌خواهید به مدیرتان اطلاع دهید که امروز از خانه کار می‌کنید یا استراحت می‌کنید.',
      relationship: 'مدیر شرکت / رئیس',
      conversationalPrompt: "Good morning! Just checking in to see if you're coming into the office today?",
      conversationalPromptFa: 'صبح بخیر! فقط چک می‌کنم ببینم آیا امروز دفتر تشریف می‌ارید؟',
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
    {
      targetCliche: 'under the weather',
      situationTitleFa: 'رد مؤدبانه دعوت مهمانی شبانه با دوستان',
      situationContextFa: 'دوستتان پیام داده که همه در رستوران جمع شده‌اند، اما شما سردرد و گلودرد دارید و انرژی خروج از خانه را ندارید.',
      relationship: 'دوست صمیمی',
      conversationalPrompt: "Hey! Everyone is gathering at Joe's Pizza right now. Are you on your way?",
      conversationalPromptFa: 'سلام! همه همین الان داریم توی پیتزا جو جمع می‌شیم. تو راهی؟',
      hint: 'راهنمای پاسخ: عذرخواهی صمیمانه، توضیح کسالت خفیف و ابراز امیدواری برای دیدار هفته بعد.',
      guidance: {
        approachFa: 'بگویید خیلی دوست داشتید بیایید اما احساس بیماری دارید و باید استراحت کنید.',
        suggestedPattern: "I wish I could come, but I'm feeling really under the weather tonight.",
        keyCollocations: ['wish I could make it', 'feeling under the weather', 'catch you next time'],
        culturalTipFa: 'در فرهنگ اجتماعی آمریکا، "under the weather" دلپذیرترین بهانه برای عذرخواهی از نرفتن به مهمانی بدون دلخوری است.',
      },
      idealSampleResponse: "I really wish I could make it, but I'm feeling under the weather tonight. Have fun without me!",
      idealSampleResponseFa: 'واقعاً دلم می‌خواست بیام، اما امشب اصلاً حالم روبه‌راه نیست و کسلم. بهتون خوش بگذره!',
    },
  ],
  'piece of cake': [
    {
      targetCliche: 'piece of cake',
      situationTitleFa: 'اظهار نظر درباره آسان بودن یک وظیفه کاری',
      situationContextFa: 'مدیر پروژه نگران است که آیا می‌توانید این وظیفه را به موقع تمام کنید.',
      relationship: 'مدیر یا همکار',
      conversationalPrompt: "Do you think you can handle this presentation by yourself?",
      conversationalPromptFa: 'فکر می‌کنی بتونی تنهایی این ارائه رو هندل کنی؟',
      hint: 'راهنمای پاسخ: با اعتماد به نفس بالا پاسخ دهید و با کلیشه بیان کنید که این کار برایتان کاملاً آسان است.',
      guidance: {
        approachFa: 'با لحنی آرام‌بخش و مطمئن شروع کنید (Don\'t worry / Absolutely) و سپس آسانی کار را با این تشبیه جذاب بیان نمایید.',
        suggestedPattern: "Don't worry about it at all, it's [going to be] a piece of cake.",
        keyCollocations: ['no sweat', 'piece of cake', 'got it covered', 'breeze through'],
        culturalTipFa: 'بیان اعتماد به نفس بدون تکبر در فرهنگ کاری آمریکا ستوده می‌شود؛ استفاده از "piece of cake" صمیمانه و متواضعانه بودن این اطمینان را می‌رساند.',
      },
      idealSampleResponse: "Don't worry about it at all, it's a piece of cake for me.",
      idealSampleResponseFa: 'اصلاً نگران نباش، این برام مثل آب خوردنه.',
    },
    {
      targetCliche: 'piece of cake',
      situationTitleFa: 'کمک به دوست برای حل مشکل لپ‌تاپ و ویندوز',
      situationContextFa: 'لپ‌تاپ دوستتان بالا نمی‌آید و فکر می‌کند تمام اطلاعاتش پاک شده است، اما شما می‌دانید با یک دستور ساده حل می‌شود.',
      relationship: 'دوست صمیمی',
      conversationalPrompt: "My laptop screen is completely frozen! Are my thesis files gone forever?",
      conversationalPromptFa: 'صفحه لپ‌تاپم کاملاً هنگ کرده! یعنی فایل‌های پایان‌نامه‌م برای همیشه پاک شدن؟',
      hint: 'راهنمای پاسخ: به او آرامش دهید و بگویید نگران نباشد چون بازیابی این فایل‌ها مثل آب خوردن است.',
      guidance: {
        approachFa: 'خیال دوستتان را راحت کنید و بگویید قبلاً هم این مشکل را حل کرده‌اید و تعمیر آن فوق‌العاده ساده است.',
        suggestedPattern: "Don't panic! It's just a minor boot error, fixing it is a piece of cake.",
        keyCollocations: ['don\'t panic', 'minor error', 'piece of cake', 'backed up'],
        culturalTipFa: 'وقتی کسی دچار اضطراب فناوری می‌شود، استفاده از عبارت محاوره‌ای "piece of cake" بلافاصله ضربان قلب او را آرام می‌کند.',
      },
      idealSampleResponse: "Don't panic! It's just a display driver issue, fixing this is a total piece of cake.",
      idealSampleResponseFa: 'هول نشو! فقط مشکل درایور تصویره، درست کردنش مثل آب خوردنه.',
    },
  ],
  'get the hang of it': [
    {
      targetCliche: 'get the hang of it',
      situationTitleFa: 'یادگیری ابزار یا نرم‌افزار جدید با همکار',
      situationContextFa: 'به همکارتان که در استفاده از سیستم جدید گیج شده است دلگرمی می‌دهید.',
      relationship: 'همکار در شرکت',
      conversationalPrompt: "This new software interface feels completely overwhelming. How do you manage?",
      conversationalPromptFa: 'این نرم‌افزار جدید خیلی گیج‌کننده‌ست. تو چطور باهاش کنار میای؟',
      hint: 'راهنمای پاسخ: به همکارتان اطمینان دهید که در ابتدا برای همه سخت است ولی با کمی تمرین قلقش دستش می‌آید.',
      guidance: {
        approachFa: 'ابتدا سختی شروع را تصدیق کنید، سپس او را به صبوری دعوت کرده و قول بدهید که خیلی زود مهارت پیدا خواهد کرد.',
        suggestedPattern: "Take your time; you'll get the hang of it in [no time / a couple of days].",
        keyCollocations: ['learning curve', 'in no time', 'get the hang of it', 'feel comfortable'],
        culturalTipFa: 'عبارت "get the hang of it" دقیقاً معادل اصیل «قلق کاری را یاد گرفتن» در فارسی است و بار تشویقی فوق‌العاده‌ای در مکالمات انگلیسی دارد.',
      },
      idealSampleResponse: "Take your time; you'll get the hang of it in no time.",
      idealSampleResponseFa: 'عجله نکن؛ در کمترین زمان قلقش دستت میاد.',
    },
    {
      targetCliche: 'get the hang of it',
      situationTitleFa: 'آموزش رانندگی ماشین دنده‌ای به دوست',
      situationContextFa: 'دوستتان حین رها کردن کلاچ چند بار ماشین را خاموش کرده و ناامید شده است.',
      relationship: 'دوست صمیمی',
      conversationalPrompt: "I stalled the engine three times already! Maybe I'm just not cut out for manual cars.",
      conversationalPromptFa: 'تا الان سه بار ماشین رو خاموش کردم! شاید من اصلاً به درد رانندگی ماشین دنده‌ای نمی‌خورم.',
      hint: 'راهنمای پاسخ: به او یادآوری کنید همه راننده‌ها اول کار همین بودند و با چند بار تکرار قلق پدال دستش می‌آید.',
      guidance: {
        approachFa: 'احساس ناامیدی او را برطرف کنید؛ بگویید حفظ تعادل کلاچ نیاز به حافظه عضلانی دارد و به زودی قلق آن را یاد می‌گیرد.',
        suggestedPattern: "Don't beat yourself up. Practice for twenty more minutes and you'll get the hang of it.",
        keyCollocations: ['don\'t beat yourself up', 'muscle memory', 'get the hang of it'],
        culturalTipFa: 'مربیان و دوستان آمریکایی برای مهارت‌های فیزیکی مانند اسکیت، شنا یا رانندگی دائم از "get the hang of it" برای تزریق امید استفاده می‌کنند.',
      },
      idealSampleResponse: "Don't beat yourself up! Everyone stalls at first. You'll get the hang of it after a few tries.",
      idealSampleResponseFa: 'خودتو سرزنش نکن! اولش همه خاموش می‌کنن. بعد چند بار تمرین قلقش کامل دستت میاد.',
    },
  ],
  'bite the bullet': [
    {
      targetCliche: 'bite the bullet',
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
    {
      targetCliche: 'bite the bullet',
      situationTitleFa: 'نوبت گرفتن از دندانپزشک بعد از ماه‌ها فرار',
      situationContextFa: 'دندان‌درد دارید اما از دندانپزشکی می‌ترسیدید، هم‌اتاقی‌تان می‌پرسد آیا بالاخره نوبت گرفتی یا نه.',
      relationship: 'هم‌اتاقی',
      conversationalPrompt: "Your tooth has been bothering you all week. Did you finally book that dental appointment?",
      conversationalPromptFa: 'دندونت کل هفته اذیتت کرده. بالاخره اون وقت دندانپزشکی رو گرفتی؟',
      hint: 'راهنمای پاسخ: ابراز ترس از درد، اما اعلام اینکه وقتش رسیده دل به دریا بزنید و نوبت بگیرید.',
      guidance: {
        approachFa: 'بگویید با اینکه از دندانپزشکی متنفرید، اما چاره‌ای نیست و باید دل به دریا بزنید و انجامش دهید.',
        suggestedPattern: "I hate dentists, but I'm gonna bite the bullet and call them this afternoon.",
        keyCollocations: ['bothering you', 'book an appointment', 'bite the bullet', 'hate dentists'],
        culturalTipFa: 'اصطلاح "bite the bullet" ریشه در جراحی‌های نظامی بدون بیهوشی دارد و امروزه برای کارهای ترسناک پزشکی بسیار رایج است.',
      },
      idealSampleResponse: "I dread it, but I'm gonna bite the bullet and call the clinic right now.",
      idealSampleResponseFa: 'خیلی می‌ترسم ازش، اما دل به دریا می‌زنم و همین الان به کلینیک زنگ می‌زنم.',
    },
  ],
  'touch base': [
    {
      targetCliche: 'touch base',
      situationTitleFa: 'هماهنگی کوتاه قبل از جلسه مهم با مشتری',
      situationContextFa: 'می‌خواهید قبل از ارائه به مشتری، با همکارتان در یک تماس ۵ دقیقه‌ای هماهنگ شوید.',
      relationship: 'همکار در پروژه',
      conversationalPrompt: "Are we completely aligned on the slides for this afternoon's pitch?",
      conversationalPromptFa: 'آیا برای اسلایدهای ارائه بعدازظهر کاملاً با هم هماهنگیم؟',
      hint: 'راهنمای پاسخ: آمادگی اولیه را تایید کنید، اما درخواست یک مرور چند دقیقه‌ای سریع داشته باشید.',
      guidance: {
        approachFa: 'پاسخ مثبت اولیه بدهید، سپس با عبارتی مؤدبانه مثل "Could we..." درخواست یک هماهنگی چند دقیقه‌ای را برای جلوگیری از غافلگیری مطرح کنید.',
        suggestedPattern: "Yes, but could we quickly touch base for [time] before the call?",
        keyCollocations: ['quickly touch base', 'run through the deck', 'align on key points'],
        culturalTipFa: 'کلمه "touch base" یکی از پرکاربردترین اصطلاحات سیلیکون‌ولی و شرکت‌های مدرن برای «هماهنگی بدون تشکیل جلسات طولانی و سنگین» است.',
      },
      idealSampleResponse: "I think so, but could we quickly touch base for five minutes before the call?",
      idealSampleResponseFa: 'فکر کنم آره، ولی می‌شه قبل از تماس ۵ دقیقه سریع هماهنگ بشیم؟',
    },
    {
      targetCliche: 'touch base',
      situationTitleFa: 'پیگیری وضعیت قرارداد ارسال‌شده با مدیر بازرگانی',
      situationContextFa: 'سه روز پیش پیش‌نویس قرارداد را برای مشتری فرستاده‌اید و می‌خواهید به مدیرتان اطلاع دهید که امروز یک تماس کوتاه برای پیگیری خواهید گرفت.',
      relationship: 'مدیر بازرگانی',
      conversationalPrompt: "Have you heard anything back from the Acme Corporation about the signed agreement?",
      conversationalPromptFa: 'از شرکت اکمی درباره قرارداد امضاشده خبری شنیدی؟',
      hint: 'راهنمای پاسخ: عدم دریافت پاسخ تا الان و اعلام برنامه برای یک تماس پیگیری کوتاه امروز.',
      guidance: {
        approachFa: 'بگویید هنوز ایمیلی نزدند، بنابراین امروز بعدازظهر با مدیرشان هماهنگ می‌شوید تا وضعیت را جویا شوید.',
        suggestedPattern: "Not yet, but I'm planning to touch base with their director this afternoon.",
        keyCollocations: ['heard back', 'signed agreement', 'touch base with', 'follow up'],
        culturalTipFa: 'در مراودات تجاری آمریکا، "touch base" بسیار محترمانه‌تر و بدون بار فشار نسبت به "chase them" یا "demand an answer" است.',
      },
      idealSampleResponse: "Not yet, but I'm planning to touch base with their team around 2 PM.",
      idealSampleResponseFa: 'هنوز نه، اما برنامه‌ریزی کردم حوالی ساعت ۲ با تیمشون یه هماهنگی و پیگیری سریع داشته باشم.',
    },
  ],
};

export function generateSituationForCliche(
  cliche: string,
  meaningFa?: string,
  scenarioIndex: number = 0
): GeneratedSituation {
  const clean = (cliche || '').trim().toLowerCase();

  // If we have preset scenarios for this cliché, cycle through them using scenarioIndex
  if (KNOWN_PRACTICE_SITUATIONS[clean] && KNOWN_PRACTICE_SITUATIONS[clean].length > 0) {
    const list = KNOWN_PRACTICE_SITUATIONS[clean];
    const pickedIndex = Math.abs(scenarioIndex) % list.length;
    return list[pickedIndex];
  }

  // Generative variation generator based on scenarioIndex for any custom cliché
  const contexts = [
    {
      title: `سناریوی ۱: محیط کار و هماهنگی تیمی (${cliche})`,
      context: `در محل کار هستید و همکارتان نیاز به تصمیم‌گیری سریع دارد. طبیعی‌ترین و شیک‌ترین روش برای بیان مقصود، استفاده از اصطلاح «${cliche}» است.`,
      rel: 'همکار در پروژه',
      starter: `We have a tight deadline coming up. How do you propose we handle this with the client?`,
      starterFa: `مهلت فشرده‌ای پیش رو داریم. پیشنهادت چیه چطور این موضوع رو با مشتری پیش ببریم؟`,
      pattern: `In my view, we should definitely ${cliche} before taking the next step.`,
    },
    {
      title: `سناریوی ۲: گپ و گفت خودمانی با دوستان (${cliche})`,
      context: `در یک کافه با دوست صمیمی‌تان نشسته‌اید و او دارد درباره مشکلی در روابط شخصی‌اش با شما مشورت می‌کند.`,
      rel: 'دوست صمیمی',
      starter: `I honestly don't know what to tell them next time we meet. What would you do in my shoes?`,
      starterFa: `راستش نمی‌دونم دفعه بعد که دیدمشون چی بگم. اگه جای من بودی چیکار می‌کردی؟`,
      pattern: `If I were you, I would just ${cliche} and see how they react.`,
    },
    {
      title: `سناریوی ۳: حل بحران و تصمیم‌گیری غیرمنتظره (${cliche})`,
      context: `یک چالش غیرمنتظره در برنامه کاری یا خانوادگی پیش آمده و شریک مکالمه‌تان مضطرب است.`,
      rel: 'شریک کاری / هم‌تیمی',
      starter: `Things aren't going according to our original plan at all! What's our backup strategy?`,
      starterFa: `اوضاع اصلاً طبق برنامه اولیه‌مون پیش نمی‌ره! استراتژی جایگزینمون چیه؟`,
      pattern: `Don't panic. The smartest move right now is to ${cliche}.`,
    },
  ];

  const picked = contexts[Math.abs(scenarioIndex) % contexts.length];

  return {
    targetCliche: cliche,
    situationTitleFa: picked.title,
    situationContextFa: picked.context,
    relationship: picked.rel,
    conversationalPrompt: picked.starter,
    conversationalPromptFa: picked.starterFa,
    hint: `راهنمای پاسخ: به ابهام شریک مکالمه پاسخ دهید و از عبارت «${cliche}» در جمله‌تان استفاده کنید.`,
    guidance: {
      approachFa: `ابتدا به سوال یا اضطراب مخاطب واکنش نشان دهید و سپس نظر خود را با قالب «${cliche}» به عنوان راهکار اصلی مطرح کنید.`,
      suggestedPattern: picked.pattern,
      keyCollocations: ['take a look', 'make sense', 'move forward', 'in my opinion'],
      culturalTipFa: `در مکالمات آمریکایی، استفاده هوشمندانه از اصطلاحات کوتاه حس تسلط، صمیمیت و تفکر عمیق را به شنونده منتقل می‌کند.`,
    },
    idealSampleResponse: `Honestly, I think we should just ${cliche} and see how it goes.`,
    idealSampleResponseFa: `راستش، به نظرم فقط باید از این اصطلاح استفاده کنیم و ببینیم چطور پیش می‌ره.`,
  };
}

export function evaluatePracticeResponseLocally(
  targetCliche: string,
  userResponse: string,
  situationContextFa?: string,
  conversationalPrompt?: string
): PracticeEvaluationResult {
  const lowerUser = (userResponse || '').toLowerCase().trim();
  const lowerTarget = (targetCliche || '').toLowerCase().trim();

  const words = lowerTarget.split(/\s+/).filter((w) => w.length > 2);
  const hasFull = lowerUser.includes(lowerTarget);
  const matchedWords = words.filter((w) => lowerUser.includes(w));
  const hasPartial = matchedWords.length >= Math.ceil(words.length / 2);

  const used = hasFull || hasPartial;
  const score = hasFull ? 94 : hasPartial ? 76 : 52;
  const grammarScore = lowerUser.length > 15 ? 90 : 80;
  const nativeScore = hasFull ? 95 : hasPartial ? 75 : 55;

  // Build authentic native American equivalent model
  let americanExpression = `Let's just ${targetCliche} and move forward.`;
  let americanExpressionFa = `بیا فقط از این اصطلاح استفاده کنیم و بریم جلو.`;
  let whyNative = `گویشوران بومی آمریکایی برای انتقال این مفهوم معمولاً از ساختارهای کوتاه، روان و بدون کلمات زائد کتابی استفاده می‌کنند.`;

  if (lowerTarget === 'call it a day') {
    americanExpression = "We've been at it for hours, so let's just call it a day and pick it up tomorrow morning.";
    americanExpressionFa = "ساعت‌هاست داریم روش کار می‌کنیم، پس بیا کار رو امروز تعطیل کنیم و فردا اول وقت ادامه‌ش بدیم.";
    whyNative = "یک آمریکایی به جای گفتن جملات تحت‌اللفظی مثل 'I think we must finish our work now'، از عبارت 'We've been at it' برای بیان مدت کار و 'call it a day' برای پایان کار استفاده می‌کند که بینهایت طبیعی و همدلانه است.";
  } else if (lowerTarget === 'cut to the chase') {
    americanExpression = "Look, we're short on time, so let's cut to the chase and talk numbers.";
    americanExpressionFa = "ببین، وقت زیادی نداریم، پس بیا یک‌راست بریم سر اصل مطلب و درباره ارقام و بودجه حرف بزنیم.";
    whyNative = "در مکالمات تجاری آمریکایی به جای حاشیه‌رفتن یا عذرخواهی‌های طولانی، از 'short on time' و عبارت بی‌پرده اما مؤدبانه 'cut to the chase' استفاده می‌شود.";
  } else if (lowerTarget === 'under the weather') {
    americanExpression = "I woke up feeling pretty under the weather today, so I'm gonna work from home.";
    americanExpressionFa = "امروز صبح که بیدار شدم حسابی احساس کسالت و سرماخوردگی داشتم، بنابراین از خونه کار خواهم کرد.";
    whyNative = "آمریکایی‌ها در پیام به مدیر به جای توصیف علائم بیماری از قید 'pretty under the weather' و شکل روان 'gonna work from home' استفاده می‌کنند.";
  } else if (lowerTarget === 'play it by ear') {
    americanExpression = "I'm not sure how bad traffic will be, so why don't we just play it by ear?";
    americanExpressionFa = "مطمئن نیستم ترافیک چقدر سنگین باشه، پس چطوره فعلاً برنامه قطعی نریزیم و ببینیم چی پیش میاد؟";
    whyNative = "استفاده از 'play it by ear' مانع از استرس خلف وعده می‌شود و با لحن منعطف 'why don't we just...' نهایت راحتی و اعتماد را در دوستی القا می‌کند.";
  } else if (lowerTarget === 'bite the bullet') {
    americanExpression = "I know it sucks, but I'll just bite the bullet and handle it right now.";
    americanExpressionFa = "می‌دونم سخته و حوصله‌سربره، ولی دل به دریا می‌زنم و همین الان جمع‌وجورش می‌کنم.";
    whyNative = "کلمه 'sucks' در انگلیسی روزمره آمریکایی همراه با 'bite the bullet' کانتراست قوی از پذیرش سختی و داشتن اراده عمل را منتقل می‌کند.";
  } else if (lowerTarget === 'piece of cake') {
    americanExpression = "Don't sweat it at all, this task is a total piece of cake for me.";
    americanExpressionFa = "اصلاً نگران نباش، این کار برام مثل آب خوردنه.";
    whyNative = "همنشینی اصطلاح 'Don't sweat it' (نگران نباش / غصه نخور) با 'a piece of cake' شاخص‌ترین امضای یک گویشور بومی آمریکایی است.";
  } else if (lowerTarget === 'get the hang of it') {
    americanExpression = "Don't stress, give it a couple of days and you'll totally get the hang of it.";
    americanExpressionFa = "استرس نداشته باش، دو سه روز به خودت فرصت بده، قلقش کاملاً دستت میاد.";
    whyNative = "فرمول 'give it a couple of days' به همراه 'get the hang of it' حس همراهی و تسکین را بسیار صمیمانه‌تر از جملات دستوری کتابی بیان می‌کند.";
  }

  // Pedagogical issues
  const categorizedIssues: any[] = [];
  if (!used) {
    categorizedIssues.push({
      category: 'word_choice',
      categoryFa: 'عدم کاربرد اصطلاح هدف',
      titleFa: `عدم یافت شدن اصطلاح هدف («${targetCliche}»)`,
      originalSnippet: userResponse,
      correctedSnippet: americanExpression,
      explanationFa: `در پاسخی که ارائه دادید، اصطلاح هدف به کار نرفته بود یا ناقص ادا شد. هدف این تمرین این است که ذهن شما یاد بگیرد در لحظه مناسب این کلیشه را فرابخواند.`,
      whyItMattersFa: `استفاده فعال از اصطلاحات در حافظه کوتاه‌مدت، گام اصلی برای تبدیل آنها به تسلط ناخودآگاه در مکالمات واقعی است.`,
      howToFixFa: `جمله خود را مجدداً با فرمول: [مقدمه کوتاه] + ${targetCliche} بازنویسی یا ضبط کنید.`,
    });
  } else if (hasPartial && !hasFull) {
    categorizedIssues.push({
      category: 'completeness',
      categoryFa: 'پیوستگی اصطلاح',
      titleFa: `نقص در ادای کامل اصطلاح «${targetCliche}»`,
      originalSnippet: userResponse,
      correctedSnippet: targetCliche,
      explanationFa: `بخشی از اصطلاح گفته شد اما نه به فرم دقیق و یکپارچه آن. اصطلاحات قالبی انگلیسی (Idioms) ساختارهای ثابتی دارند.`,
      whyItMattersFa: `تغییر دادن یا حذف یک کلمه از کلیشه باعث می‌شود برای شنونده بومی نامأنوس به نظر برسد.`,
      howToFixFa: `دقیقاً عبارت کامل «${targetCliche}» را حفظ کرده و ادا کنید.`,
    });
  }

  // Voice & Acoustic analysis based on words in user response
  const voiceAnalysis: any = {
    strengthsFa: [
      'وضوح انتقال ایده اولیه در پاسخ شما مشهود است.',
      'تلاش برای ارتباط برقرار کردن با زمینه موقعیت مکالمه موفق بوده است.',
    ],
    phonemeIssues: [
      {
        soundOrWord: targetCliche.split(' ')[0] || 'the',
        targetPhonetic: `/${targetCliche.slice(0, 3)}/`,
        whatWasHeardFa: 'تلفظ مستقیم هجاها بدون اتصال نرم بین واژگان',
        whyItMattersFa: 'در گفتار آمریکایی کلمات درون یک عبارت قالبی با هم پیوند (Linking) می‌خورند.',
        howToFixFa: 'کلمات را تک‌تک با وقفه نخوانید؛ آنها را به عنوان یک کلمه کشیده و یکپارچه در نظر بگیرید.',
      },
    ],
    wordStressIssues: [
      {
        word: targetCliche,
        targetStress: targetCliche.toUpperCase(),
        whyItMattersFa: 'در اصطلاحات چندکلمه‌ای، تکیه اصلی معمولاً روی آخرین کلمه محتوایی قرار می‌گیرد.',
        howToFixFa: 'کلمه پایانی اصطلاح را با کشش و لحن رساتر ادا کنید.',
      },
    ],
    sentenceRhythm: {
      highlightedPattern: `I think we should ${targetCliche.toUpperCase()} right now.`,
      whyItMattersFa: 'تفاوت ریتم کلمات گرامری ضعیف (we, should) با اصطلاح کلیدی باعث جذابیت شنیداری می‌شود.',
      howToFixFa: 'روی خود اصطلاح تکیه کنید و کلمات مقدماتی را سبک و روان بگذرانید.',
    },
    thoughtGroups: {
      suggestedChunking: `[Response starter] / [${targetCliche}] / [Next step]`,
      whyItMattersFa: 'تقسیم پاسخ به واحدهای فکری ۳ بخشی مانع از سکته در بیان می‌شود.',
      howToFixFa: 'بین این ۳ بخش مکث بسیار کوتاه داشته باشید.',
    },
    intonation: {
      observationFa: 'لحن طبیعی و اطمینان‌بخش در پایان جمله',
      whyItMattersFa: 'آهنگ نزولی در جملات خبری حس قطعیت و تسلط می‌آورد.',
      howToFixFa: 'در پایان جمله تن صدا را ملایم فرود بیاورید.',
    },
    drillSequenceFa: [
      `۱. سه بار ادای متوالی اصطلاح «${targetCliche}» با سرعت بالا`,
      `۲. قرار دادن اصطلاح در یک جمله کوتاه ۳ کلمه‌ای`,
      `۳. ضبط مجدد کل پاسخ به همراه نمونه مرجع`,
    ],
  };

  const strengths = [
    used
      ? `کاربرد موفق و هوشمندانه اصطلاح هدف («${targetCliche}») در بافت مکالمه.`
      : 'انتقال موفقیت‌آمیز ایده و منظور کلی جمله به مخاطب.',
    'حفظ انسجام و ساختار گرامری منسجم در بیان پاسخ.',
  ];

  return {
    usedTargetCliche: used,
    accuracyScore: score,
    verdictFa: used
      ? `بسیار عالی! اصطلاح «${targetCliche}» با موفقیت در این موقعیت استفاده شد.`
      : `اصطلاح هدف («${targetCliche}») در جمله شما به کار نرفت. به نمونه آمریکایی نگاه کنید و مجدد تلاش کنید.`,
    analysis: {
      overallScore: score,
      grammarScore: grammarScore,
      nativeScore: nativeScore,
      pronunciationScore: 88,
      userSpokenTranscript: userResponse,
      strengths,
      categorizedIssues,
      voiceAnalysis,
      socialTone: {
        register: 'casual',
        registerFa: 'محاوره‌ای روزمره و کاری دوستانه',
        politenessLevel: 4,
        formalityLevel: 3,
        appropriatenessVerdictFa: 'لحن پاسخ متناسب با موقعیت و رابطه مطرح‌شده است.',
        culturalEtiquetteTipFa: `در مکالمات روزمره آمریکایی استفاده از کلمات کوتاه و ملموس بسیار محترم‌تر از عبارات دست‌وپاشکسته طولانی است.`,
      },
      nativeAlternative: americanExpression,
      nativeAlternativeFa: americanExpressionFa,
      nativeCliche: targetCliche,
      nativeClicheMeaningFa: targetCliche,
    },
    americanConceptModel: {
      expression: americanExpression,
      expressionFa: americanExpressionFa,
      clicheUsed: targetCliche,
      clicheMeaningFa:
        lowerTarget === 'call it a day'
          ? 'پایان دادن به کار امروز و دست کشیدن از کار'
          : lowerTarget === 'cut to the chase'
          ? 'رفتن سر اصل مطلب و خلاصه کردن حواشی'
          : lowerTarget === 'play it by ear'
          ? 'برنامه‌ریزی سفت‌وسخت نکردن و دیدن شرایط'
          : lowerTarget === 'under the weather'
          ? 'ناخوش‌احوال یا کسل بودن'
          : lowerTarget === 'piece of cake'
          ? 'بسیار آسان، مثل آب خوردن'
          : lowerTarget === 'get the hang of it'
          ? 'قلق کاری را یاد گرفتن'
          : lowerTarget === 'bite the bullet'
          ? 'دل به دریا زدن برای انجام کار سخت'
          : lowerTarget === 'touch base'
          ? 'هماهنگ شدن سریع و مختصر'
          : 'اصطلاح کاربردی آمریکایی',
      whyItIsNativeFa: whyNative,
    },
    idealSampleResponse: americanExpression,
    idealSampleResponseFa: americanExpressionFa,
    corrections: hasFull ? null : `توصیه: سعی کنید جمله را با عبارت دقیق "${targetCliche}" بسازید.`,
    nativeEnhancement: americanExpression,
    nativeEnhancementFa: americanExpressionFa,
  };
}

/**
 * Highly Dynamic Contextual Linguistic Engine
 * Analyzes what user actually said + the current scenario context + relationship,
 * and generates genuine Native American phrasing and thorough error analysis.
 */
export function evaluateSpeakingTextLocally(
  userText: string,
  scenario: Scenario,
  persona: AIPersona
): {
  reply: string;
  persianTranslation: string;
  analysis: SpeakingAnalysis;
} {
  const text = (userText || '').trim();
  const lower = text.toLowerCase();
  const relationship = scenario?.relationship || 'Friend / Peer';
  const scTitle = (scenario?.title || '').toLowerCase();
  const isFormal =
    relationship.toLowerCase().includes('formal') ||
    relationship.toLowerCase().includes('professional') ||
    relationship.toLowerCase().includes('officer') ||
    relationship.toLowerCase().includes('evaluative') ||
    scTitle.includes('interview') ||
    scenario?.recommendedRegister === 'formal';

  // 1. STRENGTHS DETECTION (نقاط قوت)
  const strengths: string[] = [];
  if (lower.includes('thanks for having me') || lower.includes('thank you for having me')) {
    strengths.push('عبارت «Thanks for having me» کاملاً مناسب، مؤدبانه و استاندارد برای شروع یک مصاحبه یا جلسه کاری است.');
  } else if (lower.includes('thank you') || lower.includes('thanks') || lower.includes('appreciate')) {
    strengths.push('شروع با تشکر و ادب حرفه‌ای نکته مثبتی در ارتباط برقرار کردن است.');
  }

  if (text.length > 30) {
    strengths.push('منظور کلی پاسخ روشن است و تلاش کرده‌اید پاسخ را در قالب یک ساختار جمله‌بندی کامل و مرتبط با موضوع ارائه دهید.');
  } else {
    strengths.push('پاسخ مرتبط با سؤال است و انتقال ایده اولیه صورت گرفته است.');
  }

  if (lower.includes('segmentation')) {
    strengths.push('انتخاب موضوعی حرفه‌ای و تخصصی (دسته‌بندی مشتریان) که ارزش بالایی در سنجش توانایی تحلیلی شما دارد.');
  } else if (lower.includes('project') || lower.includes('led')) {
    strengths.push('اشاره مستقیم به تجربه کاری و پروژه در راستای سؤال مصاحبه.');
  } else if (lower.includes('coffee') || lower.includes('cup') || lower.includes('latte')) {
    strengths.push('بیان صریح و سریع موضوع مورد نظرتان برای سفارش.');
  }

  // 2. DETAILED CATEGORIZED ISSUES (ایرادات موشکافانه زبانی)
  const categorizedIssues: any[] = [];
  const grammarCorrections: Array<{ original: string; corrected: string; explanationFa: string }> = [];
  let persianTransferPitfall: string | null = null;

  // Direct Imperative Check ("give me", "bring me", "i want")
  if (/^(give me|bring me|get me|i want)\b/i.test(text) || lower.includes('give me')) {
    categorizedIssues.push({
      category: 'pragmatics',
      categoryFa: 'اتیکت و نحوه بیان (Pragmatics)',
      titleFa: 'استفاده از ساختار دستوری مستقیم (give me) در سفارش و گفتگو',
      originalSnippet: text.match(/(give me[^\.\,\?]*)/i)?.[0] || 'give me',
      correctedSnippet: 'Can I get... / Could I grab... / I would like...',
      explanationFa: 'در فرهنگ آمریکایی و ارتباط با ارائه‌دهندگان خدمات (مثل باریستا) یا همکاران، استفاده از جمله دستوری مستقیم ("give me") آمرانه و کم‌لطف تلقی می‌شود. یک آمریکایی نیتیو تقریباً همیشه از عبارات وجهی ملایم و محترمانه مثل "Can I get...", "Could I grab...", یا "I\'d like to have..." همراه با "please" استفاده می‌کند.',
      whyItMattersFa: 'لحن مستقیم ممکن است برای شنونده ناخوشایند یا بی‌ادبانه باشد، در حالی که "Can I get" صمیمیت و احترام طبیعی ایجاد می‌کند.',
      howToFixFa: 'به جای "give me"، بگو: "Can I get a cup of coffee, please?" یا "Could I grab a coffee to go?".',
    });
    persianTransferPitfall = 'ترجمه تحت‌اللفظی «یه قهوه به من بده» به صورت مستقیم give me';
  }

  // Issue 1: Pragmatics & Conversation Opening (شروع مکالمه و اتیکت)
  if (lower.startsWith('not at all') || lower.includes('not at all. thanks') || lower.includes('not at all, thanks')) {
    categorizedIssues.push({
      category: 'pragmatics',
      categoryFa: 'شروع مکالمه و اتیکت فرهنگی',
      titleFa: 'استفاده نابجا از عبارت Not at all در ابتدای مصاحبه',
      originalSnippet: 'not at all',
      correctedSnippet: 'Thanks for having me',
      explanationFa: 'عبارت «Not at all» در این موقعیت انتخاب طبیعی‌ای نیست. این عبارت در برخی موقعیت‌ها برای پاسخ به تشکر («خواهش می‌کنم») یا عذرخواهی کاربرد دارد، اما بعد از جمله‌ای مانند «Thanks for coming in today» استفاده از آن طبیعی نیست. در انگلیسی آمریکایی، گفتنِ مستقیم «Thanks for having me» به‌تنهایی شروع بسیار استانداردتر و طبیعی‌تری است.',
      whyItMattersFa: 'استفاده اشتباه از تعارفات متداول در شروع مصاحبه ممکن است در اولین لحظه تسلط زبانی شما را دستخوش تردید کند.',
      howToFixFa: 'به جای تعارف اضافی، با یک تشکر کوتاه و صریح مثل "Thanks for having me! I\'m excited to be here" شروع کن.',
    });
    persianTransferPitfall = 'تداخل با ساختار «خواهش می‌کنم / قابلی نداره» در پاسخ به تشکر ورودی مصاحبه‌کننده';
  }

  // Issue 2: Grammar & Sentence Structure (ساختار جمله و زمان‌ها)
  if (lower.includes('projects that i had') || lower.includes('project that i had') || lower.includes('projects i had')) {
    categorizedIssues.push({
      category: 'grammar',
      categoryFa: 'ساختار جمله و گرامر',
      titleFa: 'نحوه بیان سابقه کاری در گذشته (projects that I had)',
      originalSnippet: 'one of the most challenging projects that I had',
      correctedSnippet: "one of the most challenging projects I've worked on / I've led",
      explanationFa: 'برای صحبت درباره تجربه و سوابق کاری، عبارت «projects I\'ve worked on» یا «projects I\'ve led» بسیار طبیعی‌تر از «projects that I had» است. به علاوه، چون مصاحبه‌کننده پرسیده بود "a project you recently led"، استفاده از فعل led انطباق کلامی شما با مصاحبه‌کننده را به حداکثر می‌رساند.',
      whyItMattersFa: 'افعال دقیق مانند led یا managed وزن مدیریتی و حرفه‌ای صحبت شما را نشان می‌دهند.',
      howToFixFa: 'از فرم حال کامل یا گذشته ساده با افعال دینامیک استفاده کن: "one of the most challenging projects I led recently...".',
    });
    grammarCorrections.push({
      original: 'projects that I had',
      corrected: "projects I've worked on / led",
      explanationFa: 'استفاده از افعال تخصصی مثل work on یا lead به جای فعل عمومی have برای سوابق کاری.',
    });
  }

  // Additional grammar rules
  if (lower.includes('go to shopping') || lower.includes('went to shopping')) {
    categorizedIssues.push({
      category: 'grammar',
      categoryFa: 'ساختار دستوری',
      titleFa: 'حرف اضافه اضافی بعد از فعل go',
      originalSnippet: 'go to shopping',
      correctedSnippet: 'go shopping',
      explanationFa: 'بعد از فعل go برای فعالیت‌های تفریحی حرف اضافه to به کار نمی‌رود.',
    });
    grammarCorrections.push({
      original: 'go to shopping',
      corrected: 'go shopping',
      explanationFa: 'فرم درست: go shopping بدون to.',
    });
  }

  if (lower.includes('i am agree') || lower.includes("i'm agree")) {
    categorizedIssues.push({
      category: 'grammar',
      categoryFa: 'ساختار دستوری',
      titleFa: 'استفاده از to be قبل از فعل agree',
      originalSnippet: 'I am agree',
      correctedSnippet: 'I agree',
      explanationFa: 'واژه agree فعل است و نیازی به am ندارد.',
    });
    grammarCorrections.push({
      original: 'I am agree',
      corrected: 'I agree',
      explanationFa: 'agree فعل است نه صفت.',
    });
  }

  // Issue 3: Naturalness & Word Choice (انتخاب عبارت و طبیعی بودن امریکن)
  if (lower.includes('segmentation of the customers') || lower.includes('fmcg online shop') || lower.includes('was about segmentation')) {
    categorizedIssues.push({
      category: 'word_choice',
      categoryFa: 'انتخاب واژگان و طبیعی بودن آمریکایی',
      titleFa: 'ترکیب واژگان برای اصطلاحات بیزینسی (segmentation of customers)',
      originalSnippet: 'was about segmentation of the customers of a fmcg online shop',
      correctedSnippet: 'involved customer segmentation for an online FMCG retailer',
      explanationFa: 'ترکیب «segmentation of the customers of a fmcg online shop» قابل‌فهم است، ولی طبیعی و اصطلاحی نیست. در انگلیسی اداری آمریکایی، اسم‌ها به عنوان صفت پیشین ترکیب می‌شوند: «customer segmentation». همچنین به جای «online shop» در محیط‌های تخصصی از «online retailer» یا «e-commerce platform» استفاده می‌شود.',
      whyItMattersFa: 'اصطلاحات استاندارد شرکتی آمریکایی نشان‌دهنده احاطه شما بر گفتمان بازار کار بین‌المللی است.',
      howToFixFa: 'بگو: "involved customer segmentation for an online FMCG retailer" یا "involved segmenting customers for an online retailer in the consumer goods industry".',
    });
  }

  // Issue: Capitalization
  if (/^[a-z]/.test(text)) {
    const firstWord = text.split(/\s+/)[0] || '';
    const capWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    categorizedIssues.push({
      category: 'mechanics',
      categoryFa: 'علائم نگارشی (Mechanics)',
      titleFa: 'شروع جمله با حروف کوچک',
      originalSnippet: firstWord,
      correctedSnippet: capWord,
      explanationFa: `ابتدای هر جمله در زبان انگلیسی همیشه با حرف بزرگ شروع می‌شود ("${capWord}" به جای "${firstWord}").`,
      whyItMattersFa: 'رعایت حروف بزرگ ابتدای جمله نشانه تسلط و دقت نگارشی شماست.',
      howToFixFa: `جمله را با حرف بزرگ "${capWord}" شروع کن.`,
    });
  }

  // Issue: Specific Punctuation or comma check
  if (userText.includes('had, was') || userText.includes('had , was')) {
    categorizedIssues.push({
      category: 'mechanics',
      categoryFa: 'علائم نگارشی (Mechanics)',
      titleFa: 'ویرگول نابجا بین فاعل و فعل',
      originalSnippet: 'had, was',
      correctedSnippet: 'had was (بدون ویرگول)',
      explanationFa: 'بین فاعل طولانی و فعل اصلی نباید ویرگول بیاید.',
      whyItMattersFa: 'ویرگول نابجا مکث ناخواسته در خواندن ایجاد می‌کند.',
      howToFixFa: 'ویرگول را حذف کن.',
    });
  }

  if (userText.includes('fmcg') && !userText.includes('FMCG')) {
    categorizedIssues.push({
      category: 'mechanics',
      categoryFa: 'بزرگ‌نویسی اختصارات (Acronyms)',
      titleFa: 'عدم استفاده از حروف بزرگ در مخفف‌های تخصصی',
      originalSnippet: 'fmcg',
      correctedSnippet: 'FMCG',
      explanationFa: 'مخفف‌های اختصاری مانند FMCG همیشه باید با تمام حروف بزرگ نوشته شوند.',
      whyItMattersFa: 'اختصارات با حروف کوچک غیرحرفه‌ای به نظر می‌رسند.',
      howToFixFa: 'آن را به صورت FMCG بنویس.',
    });
  }

  // Issue: Completeness check
  if (isFormal && scTitle.includes('interview') && text.split(/\s+/).length < 25 && (lower.includes('project') || lower.includes('led'))) {
    categorizedIssues.push({
      category: 'completeness',
      categoryFa: 'کامل بودن پاسخ و استراتژی مصاحبه',
      titleFa: 'ناقص بودن پاسخ در برابر پرسش Walk me through',
      originalSnippet: text,
      correctedSnippet: 'استفاده از ساختار STAR (شرح چالش، اقدامات و نتیجه)',
      explanationFa: 'مصاحبه‌کننده خواسته او را در جریان پروژه قرار دهید؛ نام بردن صرف پروژه بدون اشاره به چالش و اقدامات، پاسخ را ناکامل می‌گذارد.',
      whyItMattersFa: 'پاسخ کامل نشانه تسلط حرفه‌ای شماست.',
      howToFixFa: 'چالش اصلی و اقدام عملی خود را هم در ۲ جمله بیان کن.',
    });
  } else if (text.split(/\s+/).length <= 4 && !lower.includes('please')) {
    categorizedIssues.push({
      category: 'completeness',
      categoryFa: 'کامل بودن پاسخ و بسط گفتگو',
      titleFa: 'ایجاز بیش از حد و کوتاه بودن پاسخ',
      originalSnippet: text,
      correctedSnippet: text + ' (اضافه کردن ترجیحات، سایز یا دلیل)',
      explanationFa: 'پاسخ شما بسیار خلاصه است. برای تمرین اسپیکینگ سعی کنید جزئیات بیشتری مثل سایز، نوع یا ترجیحات را بیان کنید.',
      whyItMattersFa: 'پاسخ‌های کوتاه فرصت باز شدن زبان و ارزیابی مکالمه را محدود می‌کنند.',
      howToFixFa: 'با افزودن جزئیات کلام را بسط بده.',
    });
  }

  // 3. DYNAMIC ACOUSTIC & VOICE BREAKDOWN
  const voiceWords = text.split(/\s+/).map((w) => w.replace(/[^a-zA-Z]/g, '')).filter(Boolean);
  let phonemeIssues: any[] = [];
  let wordStressIssues: any[] = [];
  let highlightedPattern = '';
  let suggestedChunking = '';
  let intonationDesc = '';
  let drillSequenceFa: string[] = [];

  if (lower.includes('coffee') || lower.includes('cup') || lower.includes('latte')) {
    phonemeIssues = [
      {
        soundOrWord: 'اتصال روان و پیوسته در عبارت cup of',
        targetPhonetic: '/ˈkʌp.ə/ یا /ˈkʌp.əv/',
        whatWasHeardFa: 'تلفظ مجزای of به صورت /ɒv/ به جای ادغام روان',
        whyItMattersFa: 'در گفتار طبیعی آمریکایی cup of به صورت پیوسته [kʌp-ə] ادا می‌شود.',
        howToFixFa: 'آن را یکپارچه بگو: "cuppa-coffee" بدون مکث.',
      },
      {
        soundOrWord: 'تلفظ مصوت و صدای /f/ در کلمه coffee',
        targetPhonetic: '/ˈkɔː.fi/',
        whatWasHeardFa: 'کوتاه شدن واکه اول یا کمبود هوا در /f/',
        whyItMattersFa: 'واکه /ɔː/ باید کشیده باشد.',
        howToFixFa: 'هجای اول را کشیده‌تر بگو: COF-fee.',
      },
    ];
    wordStressIssues = [
      {
        word: 'coffee',
        targetStress: 'COF-fee (تکیه روی هجای اول)',
        whyItMattersFa: 'در اسامی دوهجایی استرس روی هجای اول است و هجای دوم ضعیف‌تر می‌شود.',
        howToFixFa: 'هجای اول را بلندتر بگو: COF-fee.',
      },
    ];
    highlightedPattern = "Can I GET a CUP of COFFEE, please?";
    suggestedChunking = "Can I get / a cup of coffee / please?";
    intonationDesc = "آهنگ خیزان ملایم (Rising Intonation) در انتهای درخواست‌های مؤدبانه برای سفارش";
    drillSequenceFa = [
      '۱. تمرین ادغام روان "cup of" به صورت [kʌp-ə]',
      '۲. تمرین استرس واژه COF-fee با تکیه روی هجای اول',
      '۳. ادای یکپارچه: Can I get / a cup of coffee / please?',
    ];
  } else if (lower.includes('project') || lower.includes('challenging') || lower.includes('segmentation')) {
    phonemeIssues = [
      {
        soundOrWord: 'خوشه‌های همخوانی پایانی در projects',
        targetPhonetic: '/ˈprɑː.dʒekts/',
        whatWasHeardFa: 'حذف صدای /t/ یا /s/ پایانی',
        whyItMattersFa: 'حذف همخوان پایانی وضوح بیان را کم می‌کند.',
        howToFixFa: 'انتهای کلمه را با ادای کامل cts تمرین کن.',
      },
    ];
    wordStressIssues = [
      {
        word: 'challenging',
        targetStress: 'CHAL-leng-ing',
        whyItMattersFa: 'استرس صحیح برای درک کلمه حیاتی است.',
        howToFixFa: 'هجای اول را قوی‌تر بگو: CHAL-leng-ing.',
      },
    ];
    highlightedPattern = "One of the most CHALLENGING PROJECTS I've LED...";
    suggestedChunking = "One of the most challenging projects / I've led recently / involved...";
    intonationDesc = "تنوع آهنگ صدا برای جلب توجه شنونده و فرود آرام در انتهای جملات خبری";
    drillSequenceFa = [
      '۱. تمرین خوشه پایانی projects',
      '۲. تمرین استرس CHAL-leng-ing',
      '۳. پیوند گروه‌های فکری با تکیه بر کلمات کلیدی',
    ];
  } else {
    const focusWord = voiceWords.find((w) => w.length > 5) || voiceWords[0] || 'speech';
    phonemeIssues = [
      {
        soundOrWord: `تلفظ روان کلمه ${focusWord}`,
        targetPhonetic: `/${focusWord.toLowerCase()}/`,
        whatWasHeardFa: 'وضوح مناسب؛ نیازمند پیوستگی بیشتر با کلمات همجوار',
        whyItMattersFa: 'اتصال روان کلمات حس طبیعی بودن گفتار را بالا می‌برد.',
        howToFixFa: `کلمه "${focusWord}" را به نرمی به کلمه بعد متصل کن.`,
      },
    ];
    wordStressIssues = [
      {
        word: focusWord,
        targetStress: focusWord.toUpperCase(),
        whyItMattersFa: 'تکیه بر هجای اصلی آهنگ گفتار را طبیعی می‌کند.',
        howToFixFa: 'هجای اصلی را کشیده‌تر بیان کن.',
      },
    ];
    highlightedPattern = voiceWords.map((w, i) => (i % 2 === 1 ? w.toUpperCase() : w.toLowerCase())).join(' ');
    suggestedChunking = voiceWords.length > 5
      ? `${voiceWords.slice(0, Math.ceil(voiceWords.length / 2)).join(' ')} / ${voiceWords.slice(Math.ceil(voiceWords.length / 2)).join(' ')}`
      : voiceWords.join(' ');
    intonationDesc = "فرود طبیعی صدا (Falling Intonation) در انتهای جملات خبری";
    drillSequenceFa = [
      `۱. تمرین تلفظ دقیق واژه ${focusWord}`,
      '۲. پیوند دادن کلمات جمله بدون مکث‌های ناخواسته',
      '۳. تکیه بر اطلاعات و کلمات مهم',
    ];
  }

  const voiceAnalysis = {
    strengthsFa: [
      'وضوح کلی گفتار: مفهوم کلی جمله برای شنونده قابل درک است.',
      'تلاش برای حفظ پیوستگی جمله در طول بیان کلمات.',
    ],
    phonemeIssues,
    wordStressIssues,
    sentenceRhythm: {
      highlightedPattern,
      whyItMattersFa: 'در انگلیسی آمریکایی کلمات محتوایی برجسته‌تر از کلمات گرامری بیان می‌شوند.',
      howToFixFa: 'روی کلمات کلیدی تکیه بگذار و کلمات فرعی را سریع‌تر ادا کن.',
    },
    thoughtGroups: {
      suggestedChunking,
      whyItMattersFa: 'گروه‌بندی معنایی کلام مانع از قطع شدن پیوستگی گفتار می‌شود.',
      howToFixFa: 'کلمات هر بخش را بدون وقفه بگو و بین گروه‌ها مکثی بسیار کوتاه داشته باش.',
    },
    intonation: {
      observationFa: intonationDesc,
      whyItMattersFa: 'آهنگ صحیح لحن احترام و اشتیاق شما را به شنونده منتقل می‌کند.',
      howToFixFa: 'به الگوی زیروبمی در نمونه صوتی دقت کن.',
    },
    drillSequenceFa,
  };

  // 4. EXACT MEANING-PRESERVING NATIVE REWRITING
  let nativeAlternative = '';
  let nativeAlternativeFa = '';
  let nativeCliche = '';
  let nativeClicheMeaningFa = '';
  let alternativesList: any[] = [];

  // Match based on what the user ACTUALLY meant
  if (lower.includes('segmentation') || (lower.includes('project') && (lower.includes('fmcg') || lower.includes('customer') || lower.includes('online shop')))) {
    nativeAlternative = "Thanks for having me. One of the most challenging projects I've led recently involved customer segmentation for an online retailer in the FMCG sector.";
    nativeAlternativeFa = 'ممنون که من رو دعوت کردید. یکی از چالش‌برانگیزترین پروژه‌هایی که اخیراً هدایت کردم، مربوط به بخش‌بندی مشتریان برای یک خرده‌فروشی آنلاین در حوزه کالاهای تندمصرف (FMCG) بود.';
    nativeCliche = 'customer segmentation';
    nativeClicheMeaningFa = 'دسته‌بندی و بخش‌بندی تخصصی مشتریان بر اساس رفتار خرید';

    alternativesList = [
      {
        type: 'exact_meaning',
        labelFa: 'بازنویسی طبیعی مفهوم دقیق شما (Natural & Precise)',
        english: "Thanks for having me. One of the most challenging projects I've led recently involved customer segmentation for an online retailer in the FMCG sector.",
        persian: 'ممنون از دعوتتون. یکی از چالش‌برانگیزترین پروژه‌هایی که اخیراً هدایت کردم، مربوط به بخش‌بندی مشتریان برای یک خرده‌فروشی آنلاین در حوزه FMCG بود.',
      },
      {
        type: 'high_impact',
        labelFa: 'نسخه مدیریتی اثرگذار با شروع متد STAR (Executive STAR Format)',
        english: "Thanks for having me! A standout project I recently spearheaded was restructuring customer segmentation for an FMCG e-commerce platform that was tackling high user drop-off.",
        persian: 'ممنون از شما! یکی از پروژه‌های شاخصی که اخیراً هدایت آن را برعهده داشتم، بازسازی ساختار دسته‌بندی مشتریان برای یک پلتفرم تجارت الکترونیک FMCG بود که با چالش ریزش کاربر روبرو بود.',
      },
      {
        type: 'casual',
        labelFa: 'نسخه روان و فشرده (Concise & Polished)',
        english: "Glad to be here! One of the toughest projects I've taken on recently was segmenting consumer data for an online consumer goods store.",
        persian: 'خوشحالم که اینجام! یکی از سخت‌ترین پروژه‌هایی که اخیراً دست گرفتم، بخش‌بندی داده‌های مصرف‌کنندگان برای یک فروشگاه آنلاین کالاهای مصرفی بود.',
      },
    ];
  } else if (lower.includes('coffee') || lower.includes('drink') || lower.includes('latte')) {
    nativeAlternative = "Could I just grab a medium iced latte with oat milk, to go?";
    nativeAlternativeFa = 'می‌تونم یه لاته متوسط یخچالی با شیر جو دوسر، بیرون‌بر بگیرم؟';
    nativeCliche = 'grab a coffee';
    nativeClicheMeaningFa = 'قهوه گرفتن و نوشیدن سریع';
    alternativesList = [
      {
        type: 'exact_meaning',
        labelFa: 'سفارش طبیعی و روان',
        english: "Can I just get a medium iced latte to go, please?",
        persian: 'می‌تونم یه لاته متوسط یخ‌دار بیرون‌بر داشته باشم لطفاً؟',
      },
    ];
  } else if (lower.includes('agree')) {
    nativeAlternative = "I completely agree with your point—that makes a lot of sense.";
    nativeAlternativeFa = 'کاملاً با نظرتون موافقم؛ کاملاً منطقی به نظر می‌رسه.';
    nativeCliche = 'see eye to eye / be on board with';
    nativeClicheMeaningFa = 'هم‌نظر بودن و موافقت کامل';
    alternativesList = [
      {
        type: 'exact_meaning',
        labelFa: 'بیان طبیعی و اصطلاحی موافقت',
        english: "I completely agree with your point—that makes a lot of sense.",
        persian: 'کاملاً با نظرتون موافقم؛ کاملاً منطقی به نظر می‌رسه.',
      },
    ];
  } else {
    // Preserve user meaning dynamically
    const cleanUser = text.replace(/^[,\s.]+/, '').replace(/[.?\s]+$/, '');
    nativeAlternative = isFormal
      ? `Thanks for asking. One key aspect I'd emphasize is that ${cleanUser}.`
      : `Honestly, ${cleanUser}—that's pretty much how it went down.`;
    nativeAlternativeFa = isFormal
      ? `ممنون از سؤالتون. نکته کلیدی که مایلم تأکید کنم این است که ${text}.`
      : `راستش، قضیه از این قرار بود که ${text}.`;
    nativeCliche = isFormal ? 'key takeaway' : 'how it went down';
    nativeClicheMeaningFa = isFormal ? 'نکته کلیدی و برآیند اصلی' : 'نحوه اتفاق افتادن یک ماجرا';
    alternativesList = [
      {
        type: 'exact_meaning',
        labelFa: 'بازنویسی طبیعی مفهوم شما',
        english: nativeAlternative,
        persian: nativeAlternativeFa,
      },
    ];
  }

  // 5. IN-CHARACTER ROLEPLAY & ACTIVE COACHING CHALLENGE
  // The coach stays deeply in character and ELICITS more speaking!
  let reply = '';
  let replyFa = '';
  let inCharacterChallenge = {
    probingQuestionEn: '',
    probingQuestionFa: '',
    coachingGoalFa: '',
  };

  if (isFormal && scTitle.includes('interview')) {
    if (lower.includes('segmentation') || (lower.includes('project') && lower.includes('challenging'))) {
      reply = "That sounds like a very relevant initiative! Could you walk me through the specific challenge your team ran into, and what actions you personally took to lead it?";
      replyFa = "پروژه بسیار مرتبط و ارزشمندی به نظر می‌رسد! می‌توانید توضیح دهید چالش یا گلوگاه دقیق تیم چه بود و شخصاً چه اقداماتی برای رهبری آن انجام دادید؟";
      inCharacterChallenge = {
        probingQuestionEn: "What was the specific bottleneck your team ran into, and what actions did you personally lead?",
        probingQuestionFa: 'چالش دقیق پروژه چه بود و خودت چه اقداماتی برای رفع آن انجام دادی؟',
        coachingGoalFa: 'تشریح اقدامات عملی (Action) در قالب متد STAR برای تقویت توانایی استدلال شغلی.',
      };
    } else if (lower.includes('coffee') || lower.includes('drink')) {
      reply = "A fresh coffee sounds great before we dive in! Once you're settled, could you tell me a bit about your professional background?";
      replyFa = "یک قهوه تازه قبل از شروع بحث عالی است! وقتی راحت شدید، می‌توانید کمی درباره پیشینه کاری‌تان بگویید؟";
      inCharacterChallenge = {
        probingQuestionEn: "Could you give me a brief overview of your background?",
        probingQuestionFa: 'می‌توانید خلاصه کوتاهی از سوابق کاری‌تان ارائه دهید؟',
        coachingGoalFa: 'تمرین معرفی حرفه‌ای و پیوستگی کلام.',
      };
    } else {
      reply = "Thank you for that context! Could you expand on that with a concrete example from your recent experience?";
      replyFa = "ممنون از توضیحتان! می‌توانید این مورد را با یک مثال ملموس از تجربیات اخیرتان بسط دهید؟";
      inCharacterChallenge = {
        probingQuestionEn: "Could you share a concrete example of that?",
        probingQuestionFa: 'می‌توانید یک نمونه ملموس از این موضوع را مثال بزنید؟',
        coachingGoalFa: 'تشویق کاربر به بسط پاسخ و پیوستگی مکالمه.',
      };
    }
  } else if (scTitle.includes('coffee') || lower.includes('coffee') || lower.includes('cup') || lower.includes('order')) {
    reply = "You got it! Would you like whole milk, oat, or almond milk? And would you like any pastry or warm croissant to go with that?";
    replyFa = "حتماً! شیر معمولی میل دارید یا شیر جو دوسر یا بادام؟ و مایلید یک کروسان گرم یا شیرینی هم در کنارش براتون بیارم؟";
    inCharacterChallenge = {
      probingQuestionEn: "What kind of milk do you prefer, and do you want any pastry with it?",
      probingQuestionFa: 'چه شیری ترجیح می‌دید و آیا کیک یا شیرینی هم میل دارید؟',
      coachingGoalFa: 'تمرین پاسخ سریع به شخصی‌سازی سفارش در کافه.',
    };
  } else {
    reply = "That makes total sense! Tell me a bit more about what you're thinking and what comes next.";
    replyFa = "کاملاً منطقی به نظر می‌رسد! کمی بیشتر بگو در فکرت چیست و بعد از آن چه می‌شود.";
    inCharacterChallenge = {
      probingQuestionEn: "What happened next and how did you resolve it?",
      probingQuestionFa: 'بعدش چه اتفاقی افتاد و چطور جمعش کردی؟',
      coachingGoalFa: 'وادار کردن کاربر به داستان‌سرایی و پیوستگی جملات.',
    };
  }

  // Calculate scores based on errors detected
  const issueCount = categorizedIssues.length;
  const grammarScore = Math.max(60, 95 - issueCount * 7);
  const nativeScore = Math.max(65, 92 - (persianTransferPitfall ? 12 : 0) - (issueCount > 2 ? 10 : 0));
  const pronunciationScore = 82;
  const overallScore = Math.round((grammarScore + nativeScore + pronunciationScore) / 3);

  const dynamicPronunciationIssues = voiceAnalysis.phonemeIssues.map((ph: any) => ({
    wordOrSound: ph.soundOrWord,
    phoneticTarget: ph.targetPhonetic,
    whatWasHeardFa: ph.whatWasHeardFa,
    tipFa: ph.howToFixFa,
    acousticFeature: 'Connected Speech' as const,
    confidence: 85,
  }));

  const dynamicAccentTips = voiceAnalysis.wordStressIssues.map((ws: any) => ({
    word: ws.word,
    phonetic: ws.targetStress,
    tipFa: ws.howToFixFa,
    soundRule: ws.whyItMattersFa,
  }));

  const analysis: SpeakingAnalysis = {
    overallScore,
    grammarScore,
    nativeScore,
    pronunciationScore,
    userSpokenTranscript: text,
    strengths,
    categorizedIssues,
    voiceAnalysis,
    persianTransferPitfall,
    grammarCorrections,
    socialTone: {
      register: isFormal ? 'formal' : 'casual',
      registerFa: isFormal ? 'رسمی و اداری' : 'محاوره‌ای و صمیمی',
      politenessLevel: /please|could|would|thank/i.test(text) ? 5 : /give me|bring me/i.test(text) ? 2 : 4,
      formalityLevel: isFormal ? 4 : 2,
      appropriatenessVerdictFa: isFormal
        ? `لحن کلی متناسب با یک محیط کاری و رابطه «${relationship}» است.`
        : `لحن جمله شما خودمانی و صمیمی است.`,
      culturalEtiquetteTipFa: isFormal
        ? 'در محیط‌های بیزینسی و مصاحبه‌ها، پاسخ مستقیم، صریح و متناسب با سؤال بالاترین ارزش ارتباطی را دارد.'
        : /give me/i.test(text)
        ? 'در فرهنگ آمریکایی، حتی در روابط دوستانه یا سفارش در کافه، به جای "give me" از "Can I get" یا "Could I have" همراه با "please" استفاده می‌شود.'
        : 'در مکالمات دوستانه، پیوستگی کلام و لحن خودمانی حس نزدیکی ایجاد می‌کند.',
    },
    nativeAlternative,
    nativeAlternativeFa,
    nativeAlternativesList: alternativesList,
    nativeCliche,
    nativeClicheMeaningFa,
    repetitionChallengePromptFa: `حالا سعی کن با استفاده از عبارت نیتیو («${nativeCliche}») چالش مربی را پاسخ بدهی و صحبتت را تکمیل کنی.`,
    inCharacterChallenge,
    pronunciationIssues: dynamicPronunciationIssues,
    accentTips: dynamicAccentTips,
    newWeaknessIdentified:
      categorizedIssues.length > 0
        ? {
            category: categorizedIssues[0].category,
            titleFa: categorizedIssues[0].titleFa,
            descriptionFa: categorizedIssues[0].explanationFa,
          }
        : null,
    weaknessImprovementNoted: null,
    lessonProgress: {
      progressPercent:
        (scenario?.targetCliches || []).some((c) => lower.includes(c.toLowerCase())) || text.split(/\s+/).length >= 15
          ? 100
          : Math.min(85, Math.max(30, text.split(/\s+/).length * 6)),
      isGoalSatisfied:
        (scenario?.targetCliches || []).some((c) => lower.includes(c.toLowerCase())) || text.split(/\s+/).length >= 15,
      unmetGoalsFa: !(scenario?.targetCliches || []).some((c) => lower.includes(c.toLowerCase()))
        ? (scenario?.targetCliches || []).map((c) => `استفاده از اصطلاح هدف «${c}» در پاسخ بعدی`)
        : [],
      coachingFeedbackFa: (scenario?.targetCliches || []).some((c) => lower.includes(c.toLowerCase()))
        ? 'بسیار عالی! اصطلاح کلیدی سناریو را به کار بردید و هدفتان محقق شد.'
        : 'برای باز شدن زبانتان، مربی پیشنهاد می‌کند در نوبت بعد با استفاده از اصطلاح هدف جمله‌تان را کامل کنید.',
    },
  };

  return {
    reply,
    persianTranslation: replyFa,
    analysis,
  };
}

/**
 * Dynamically generates a customized adaptive scenario
 * specifically targeted at the user's current weakness database.
 */
export function generateAdaptiveScenarioFromWeaknesses(
  activeWeaknesses: WeaknessItem[],
  dayIndex: number
): CalendarScenario {
  const topWeakness = activeWeaknesses.length > 0
    ? activeWeaknesses[0]
    : {
        category: 'grammar',
        titleFa: 'تداخل حال کامل و گذشته ساده',
        descriptionFa: 'استفاده از ساختار گذشته ساده برای خاطرات با قید زمان مشخص',
      };

  const id = `adaptive-cal-${Date.now()}`;
  let title = 'Tackling Past Narratives: Road Trip Memories';
  let titleFa = `سناریوی تطبیقی: مرور خاطرات سفر جاده‌ای (تمرکز روی: ${topWeakness.titleFa})`;
  let starter = "We were just talking about unforgettable road trips. Tell me about the first time you took a long trip—when was it and what happened?";
  let starterFa = "داشتیم درباره سفرهای جاده‌ای فراموش‌نشدنی حرف می‌زدیم. از اولین باری که رفتی یه سفر طولانی بگو—کی بود و چی شد؟";
  let targetGrammar = "Past Simple narrative vs Present Perfect pitfall";
  let targetPronunciation = "American R and Flap T in past verb endings";
  let relationship = "Close Friend / Travel Buddy";

  if (topWeakness.category === 'pronunciation') {
    title = 'At the Downtown Juice Bar & Cafe';
    titleFa = `سناریوی تطبیقی: سفارش آب‌میوه در کافه (تمرکز بر: ${topWeakness.titleFa})`;
    starter = "Welcome to Green Oasis! Would you like a bottle of cold-pressed water or our special better-berry smoothie today?";
    starterFa = "به گرین اویسیس خوش اومدید! امروز یه بطری آب تازه میل دارید یا اسموتی مخصوص تمشک ما؟";
    targetGrammar = "Polite modal requests (Can I get / Could I have)";
    targetPronunciation = "Flap T in 'water', 'bottle', 'better'";
    relationship = "Barista & Customer";
  } else if (topWeakness.category === 'register_tone') {
    title = 'Meeting Your Project Lead for Coffee';
    titleFa = `سناریوی تطبیقی: هماهنگی خودمانی با مدیر پروژه (تمرکز بر: ${topWeakness.titleFa})`;
    starter = "Hey, thanks for making time to meet! Before we get into work, how was your weekend? Did you do anything fun?";
    starterFa = "سلام، ممنون که وقت گذاشتی ببینمت! قبل این‌که بریم سر کار، آخر هفته‌ت چطور بود؟ تفریح خاصی رفتی؟";
    targetGrammar = "Casual conversational reductions (gonna, kinda, gotta)";
    targetPronunciation = "Connected speech in fast friendly chat";
    relationship = "Work Colleague / Casual Lead";
  }

  return {
    id,
    dayIndex,
    title,
    titleFa,
    category: 'daily',
    context: 'Weakness Targeted Adaptive Session',
    relationship,
    userRole: 'Learner',
    aiRole: 'Conversation Partner',
    icon: '🎯',
    starter,
    starterFa,
    targetGrammar,
    targetCliches: ['Brings back memories', 'Hit the road', 'Catch up'],
    targetPronunciation,
    activeWeaknessesInjected: [topWeakness.titleFa],
    status: 'current',
  };
}

export function convertCalendarToScenario(cal: CalendarScenario): Scenario {
  return {
    id: cal.id,
    title: cal.title,
    titleFa: cal.titleFa,
    category: cal.category,
    userRole: cal.userRole,
    aiRole: cal.aiRole,
    icon: cal.icon,
    starter: cal.starter,
    starterFa: cal.starterFa,
    descriptionFa: cal.targetGrammarFa || `${cal.targetGrammar} | ${cal.targetPronunciation}`,
    clicheTag: (cal.targetCliches || []).join(' / '),
    relationship: cal.relationship,
    recommendedRegister: cal.relationship?.toLowerCase().includes('formal') ? 'formal' : 'casual',
    activeWeaknessesInjected: cal.activeWeaknessesInjected,
    targetGrammar: cal.targetGrammar,
    targetGrammarFa: cal.targetGrammarFa,
    targetCliches: cal.targetCliches,
    targetPronunciation: cal.targetPronunciation,
    targetLevel: cal.targetLevel,
    targetChecklistItemId: cal.targetChecklistItemId,
    cycleNumber: cal.cycleNumber,
  };
}

