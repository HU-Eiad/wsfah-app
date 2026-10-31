import Link from "next/link";
import MaterialIcon from "./MaterialIcon";
import BrandIcon from "./BrandIcon";
import { UserPricingToggle, RoasterPricingToggle } from "./PricingToggle";

// Features grouped by what the brewer is doing, not listed as nine equal cards.
const featureGroups = [
  {
    title: "حضّر",
    lead: "كل تحضير بخطوات واضحة، من أول صبّة حتى آخر قطرة.",
    items: [
      { icon: "method-v60", title: "وضع التحضير الموجّه", desc: "خطوة بخطوة مع مؤقت لكل صبّة. فلتر، إسبريسو، أو ماتشا." },
      { icon: "timer", title: "مؤقت التحضير", desc: "تنبيه بالاهتزاز وإشعارات في الخلفية، بمعايير الوصفة نفسها." },
      { icon: "scale", title: "الميزان الذكي", desc: "اربط موازين Acaia وTimemore عبر البلوتوث وتابع الوزن لحظياً." },
    ],
  },
  {
    title: "سجّل",
    lead: "اعرف لماذا كان كوب الأمس أفضل، وكرّره.",
    items: [
      { icon: "grind", title: "دفتر التحضير", desc: "الطحنة والحرارة والنسبة والتقييم لكل كوب، في مكان واحد." },
      { icon: "bean", title: "مكتبة الوصفات", desc: "وصفات من المجتمع ومن محامص موثّقة للقهوة والشاي والماتشا." },
      { icon: "drop", title: "المجموعات", desc: "رتّب وصفاتك المفضلة في مجموعات وارجع لها متى شئت." },
    ],
  },
  {
    title: "شارك",
    lead: "مجتمع يحضّر معك، ومحامص تكافئك على ذلك.",
    items: [
      { icon: "nav-explore", title: "المجتمع والمعرض", desc: "شارك صور تحضيرك، تابع المحضّرين، وانضم لمجموعات التحضير." },
      { icon: "stamp", title: "المكافآت والتحديات", desc: "اجمع النقاط والأختام، أكمل التحديات، واستبدلها بمكافآت حقيقية." },
      { icon: "verified", title: "المحامص والمقاهي", desc: "اكتشف محامص ومقاهي موثّقة، اقرأ التقييمات وتسوّق منتجاتها." },
    ],
  },
];

const steps = [
  { n: "١", title: "أنشئ حسابك", desc: "اختر طرق التحضير والأقسام التي تحبها." },
  { n: "٢", title: "اختر وصفة وحضّر", desc: "اتبع الخطوات والمؤقت، ثم سجّل النتيجة." },
  { n: "٣", title: "طوّر وشارك", desc: "قارن تحضيراتك، اكسب المكافآت، وشارك المجتمع." },
];

// A real recipe from the default V60 template, shown as the hero's "recipe slip".
const heroRecipe = [
  { icon: "bean", label: "البن", value: "١٥ غ" },
  { icon: "drop", label: "الماء", value: "٢٢٥ مل" },
  { icon: "thermometer", label: "الحرارة", value: "٩٣°" },
  { icon: "timer", label: "الوقت", value: "٣:٣٠" },
];

function Wordmark({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`${size === "md" ? "size-10 rounded-xl" : "size-8 rounded-lg"} bg-forest text-paper flex items-center justify-center`}>
        <span
          className="wsfa-icon"
          style={{ "--icon": "url(/brand/wsfa-mark.svg)", fontSize: size === "md" ? 24 : 18 } as React.CSSProperties}
          aria-hidden
        />
      </span>
      <span className={`font-display ${size === "md" ? "text-2xl" : "text-xl"} font-semibold`}>وصفة</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-background-light text-espresso min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background-light/85 backdrop-blur-xl border-b border-espresso/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label="وصفة، الصفحة الرئيسية">
            <Wordmark />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-espresso/70 hover:text-espresso">المميزات</a>
            <a href="#pricing" className="text-sm font-medium text-espresso/70 hover:text-espresso">الأسعار</a>
            <Link href="/login" className="text-sm font-semibold">تسجيل الدخول</Link>
            <Link href="/signup" className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              أنشئ حساباً
            </Link>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold">دخول</Link>
            <Link href="/signup" className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold">
              أنشئ حساباً
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero: headline at the start (right), pour-over illustration with a recipe slip at the end */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-[1.05fr_1fr] gap-12 md:gap-8 items-center">
          <div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.15] mb-6 text-forest dark:text-primary">
              حضّر كوبك
              <br />
              كما يجب.
            </h1>
            <p className="text-lg md:text-xl text-espresso/70 max-w-md mb-10 leading-loose">
              وصفات مجرّبة بخطوات ومؤقت، ودفتر يحفظ كل تحضير، ومجتمع من عشّاق القهوة والشاي يحضّر معك.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="bg-primary text-on-primary px-7 py-4 rounded-xl text-base font-bold hover:bg-primary/90 transition-colors text-center"
              >
                ابدأ مجاناً
              </Link>
              <Link
                href="/search"
                className="border border-espresso/15 px-7 py-4 rounded-xl text-base font-semibold hover:border-primary/40 transition-colors text-center"
              >
                تصفّح الوصفات
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[6/5] md:aspect-[1/1.05] rounded-[28px] overflow-hidden bg-paper">
              <img src="/brand/banners/landing-hero.svg" alt="" className="w-full h-full object-cover object-left" />
            </div>
            {/* Recipe slip: overlaps the image edge on phones, floats over its corner on desktop */}
            <div className="relative -mt-10 ms-auto me-4 md:absolute md:mt-0 md:me-0 md:-bottom-8 md:-start-10 w-60 bg-surface rounded-2xl shadow-[0_18px_40px_-18px_rgba(20,53,36,0.45)] border border-espresso/5 p-5">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-lg font-bold">V60</span>
                <span className="text-xs text-espresso/60">نسبة ١:١٥</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {heroRecipe.map((r) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <BrandIcon name={r.icon} className="text-lg text-primary" />
                    <div>
                      <dt className="text-[11px] text-espresso/60 leading-none mb-1">{r.label}</dt>
                      <dd className="text-sm font-semibold leading-none">{r.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28 bg-surface border-y border-espresso/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl mb-16 max-w-xl leading-snug">
            من أول صبّة إلى كوبك المفضّل
          </h2>
          <div className="space-y-16">
            {featureGroups.map((g) => (
              <div key={g.title} className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-12 pt-10 border-t border-espresso/10 first:border-t-0 first:pt-0">
                <div>
                  <h3 className="font-display text-3xl text-forest dark:text-primary mb-2">{g.title}</h3>
                  <p className="text-sm text-espresso/60 leading-relaxed">{g.lead}</p>
                </div>
                <ul className="grid sm:grid-cols-3 gap-8">
                  {g.items.map((f) => (
                    <li key={f.title}>
                      <BrandIcon name={f.icon} className="text-[28px] text-primary mb-4" />
                      <h4 className="text-base font-bold mb-1.5">{f.title}</h4>
                      <p className="text-sm text-espresso/65 leading-relaxed">{f.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works: a real three-step sequence */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl mb-14">كيف تعمل وصفة؟</h2>
          <ol className="grid md:grid-cols-3 gap-10 md:gap-6">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-display size-12 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl">
                    {s.n}
                  </span>
                  <span className="hidden md:block flex-1 h-px bg-espresso/15" aria-hidden />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{s.title}</h3>
                <p className="text-sm text-espresso/65 leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing — Brewers */}
      <section id="pricing" className="py-20 md:py-28 bg-surface border-y border-espresso/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl mb-4">أسعار بسيطة وواضحة</h2>
            <p className="text-base text-espresso/65 max-w-lg mx-auto">
              ابدأ مجاناً، وقم بالترقية عندما تحتاج المزيد.
            </p>
          </div>
          <UserPricingToggle />
        </div>
      </section>

      {/* Pricing — Roasters */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-brand-gold/10 rounded-full px-4 py-1.5 mb-6">
              <MaterialIcon icon="storefront" className="text-brand-gold text-sm" />
              <span className="text-xs font-bold text-brand-gold">للمحامص والعلامات التجارية</span>
            </div>
            <h2 className="text-3xl md:text-4xl mb-4">نمِّ علامتك التجارية على وصفة</h2>
            <p className="text-base text-espresso/65 max-w-lg mx-auto">
              اوصل لعشّاق القهوة والشاي. اعرض منتجاتك، ابنِ مجتمعاً، وحقق مبيعات.
            </p>
          </div>
          <RoasterPricingToggle />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto rounded-[28px] bg-pine text-paper px-8 py-16 md:px-16 md:py-20 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl mb-4 leading-snug">كوبك القادم يبدأ من هنا.</h2>
            <p className="text-base text-paper/70 max-w-md">حساب مجاني، بدون بطاقة دفع.</p>
          </div>
          <Link
            href="/signup"
            className="bg-paper text-pine px-8 py-4 rounded-xl text-base font-bold hover:bg-leaf transition-colors text-center"
          >
            أنشئ حساباً مجانياً
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-espresso/5 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="mb-4">
                <Wordmark size="sm" />
              </div>
              <p className="text-sm text-espresso/60 leading-relaxed">
                منصة عشّاق القهوة والشاي.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">المنتج</h4>
              <div className="space-y-2">
                <Link href="/search" className="block text-sm text-espresso/60 hover:text-espresso">الوصفات</Link>
                <Link href="/roasters" className="block text-sm text-espresso/60 hover:text-espresso">المحامص</Link>
                <Link href="/leaderboard" className="block text-sm text-espresso/60 hover:text-espresso">المتصدرون</Link>
                <Link href="/events" className="block text-sm text-espresso/60 hover:text-espresso">الفعاليات</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">الشركة</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">عن وصفة</a>
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">المدونة</a>
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">وظائف</a>
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">تواصل معنا</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">قانوني</h4>
              <div className="space-y-2">
                <a href="/privacy" className="block text-sm text-espresso/60 hover:text-espresso">سياسة الخصوصية</a>
                <a href="/terms" className="block text-sm text-espresso/60 hover:text-espresso">شروط الخدمة</a>
                <a href="/refund-policy" className="block text-sm text-espresso/60 hover:text-espresso">سياسة الاسترداد</a>
              </div>
            </div>
          </div>
          <div className="border-t border-espresso/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-espresso/50">&copy; {new Date().getFullYear()} وصفة. جميع الحقوق محفوظة.</p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="الموقع" className="size-9 rounded-full bg-espresso/5 flex items-center justify-center hover:bg-primary/15 transition-colors">
                <MaterialIcon icon="language" className="text-base text-espresso/60" />
              </a>
              <a href="#" aria-label="البريد" className="size-9 rounded-full bg-espresso/5 flex items-center justify-center hover:bg-primary/15 transition-colors">
                <MaterialIcon icon="mail" className="text-base text-espresso/60" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
