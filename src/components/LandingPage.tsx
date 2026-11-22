import Link from "next/link";
import Image from "next/image";
import MaterialIcon from "./MaterialIcon";
import BrandIcon from "./BrandIcon";
import { UserPricingToggle, RoasterPricingToggle } from "./PricingToggle";
import LanguageSwitch from "./LanguageSwitch";
import { getTranslations } from "next-intl/server";

// Features grouped by what the brewer is doing, not listed as nine equal cards.
const featureGroups = [
  {
    key: "brew",
    items: [
      { icon: "method-v60", key: "guided" },
      { icon: "timer", key: "timer" },
      { icon: "scale", key: "scale" },
    ],
  },
  {
    key: "log",
    items: [
      { icon: "grind", key: "journal" },
      { icon: "bean", key: "library" },
      { icon: "drop", key: "collections" },
    ],
  },
  {
    key: "share",
    items: [
      { icon: "nav-explore", key: "community" },
      { icon: "stamp", key: "rewards" },
      { icon: "verified", key: "roasters" },
    ],
  },
];

const steps = [
  { n: "1", key: "step1" },
  { n: "2", key: "step2" },
  { n: "3", key: "step3" },
];

// A real recipe from the default V60 template, shown as the hero's "recipe slip".
// labelKey/valueKey are keys in the landingPage namespace; plain values are locale-neutral.
const heroRecipe: { icon: string; labelKey: string; valueKey?: string; value?: string }[] = [
  { icon: "bean", labelKey: "hero.coffee", valueKey: "hero.coffeeValue" },
  { icon: "drop", labelKey: "hero.water", valueKey: "hero.waterValue" },
  { icon: "thermometer", labelKey: "hero.temp", value: "93°" },
  { icon: "timer", labelKey: "hero.time", value: "3:30" },
];

function Wordmark({ size = "md", name }: { size?: "md" | "sm"; name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`${size === "md" ? "size-10 rounded-xl" : "size-8 rounded-lg"} bg-forest text-paper flex items-center justify-center`}>
        <span
          className="wsfa-icon"
          style={{ "--icon": "url(/brand/wsfa-mark.svg)", fontSize: size === "md" ? 24 : 18 } as React.CSSProperties}
          aria-hidden
        />
      </span>
      <span className={`font-display ${size === "md" ? "text-2xl" : "text-xl"} font-semibold`}>{name}</span>
    </span>
  );
}

export default async function LandingPage() {
  const t = await getTranslations("landingPage");
  return (
    <div className="bg-background-light text-espresso min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background-light/85 backdrop-blur-xl border-b border-espresso/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label={t("homeAria")}>
            <Wordmark name={t("appName")} />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-espresso/70 hover:text-espresso">{t("nav.features")}</a>
            <a href="#pricing" className="text-sm font-medium text-espresso/70 hover:text-espresso">{t("nav.pricing")}</a>
            <LanguageSwitch />
            <Link href="/login" className="text-sm font-semibold">{t("nav.login")}</Link>
            <Link href="/signup" className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
              {t("nav.signup")}
            </Link>
          </div>
          <div className="md:hidden flex items-center gap-2.5">
            <LanguageSwitch variant="icon" />
            <Link href="/login" className="text-sm font-semibold whitespace-nowrap">{t("nav.loginShort")}</Link>
            <Link href="/signup" className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap">
              {t("nav.signup")}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero: headline at the start (right), pour-over illustration with a recipe slip at the end */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-[1.05fr_1fr] gap-12 md:gap-8 items-center">
          <div>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.15] mb-6 text-forest dark:text-primary">
              {t("hero.line1")}
              <br />
              {t("hero.line2")}
            </h1>
            <p className="text-lg md:text-xl text-espresso/70 max-w-md mb-10 leading-loose">
              {t("hero.lead")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="bg-primary text-on-primary px-7 py-4 rounded-xl text-base font-bold hover:bg-primary/90 transition-colors text-center"
              >
                {t("hero.startFree")}
              </Link>
              <Link
                href="/search"
                className="border border-espresso/15 px-7 py-4 rounded-xl text-base font-semibold hover:border-primary/40 transition-colors text-center"
              >
                {t("hero.browse")}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[6/5] md:aspect-[1/1.05] rounded-[28px] overflow-hidden bg-paper">
              <Image src="/brand/banners/landing-hero.svg" alt="" fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-left" />
            </div>
            {/* Recipe slip: overlaps the image edge on phones, floats over its corner on desktop */}
            <div className="relative -mt-10 ms-auto me-4 md:absolute md:mt-0 md:me-0 md:-bottom-8 md:-start-10 w-60 bg-surface rounded-2xl border border-espresso/10 p-5">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-lg font-bold">V60</span>
                <span className="text-xs text-espresso/60">{t("hero.ratio")}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {heroRecipe.map((r) => (
                  <div key={r.labelKey} className="flex items-center gap-2">
                    <BrandIcon name={r.icon} className="text-lg text-primary" />
                    <div>
                      <dt className="text-[11px] text-espresso/60 leading-none mb-1">{t(r.labelKey)}</dt>
                      <dd className="text-sm font-semibold leading-none">{r.valueKey ? t(r.valueKey) : r.value}</dd>
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
            {t("features.title")}
          </h2>
          <div className="space-y-16">
            {featureGroups.map((g) => (
              <div key={g.key} className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-12 pt-10 border-t border-espresso/10 first:border-t-0 first:pt-0">
                <div>
                  <h3 className="font-display text-3xl text-forest dark:text-primary mb-2">{t(`features.${g.key}.title`)}</h3>
                  <p className="text-sm text-espresso/60 leading-relaxed">{t(`features.${g.key}.lead`)}</p>
                </div>
                <ul className="grid sm:grid-cols-3 gap-8">
                  {g.items.map((f) => (
                    <li key={f.key}>
                      <BrandIcon name={f.icon} className="text-[28px] text-primary mb-4" />
                      <h4 className="text-base font-bold mb-1.5">{t(`features.${g.key}.${f.key}.title`)}</h4>
                      <p className="text-sm text-espresso/65 leading-relaxed">{t(`features.${g.key}.${f.key}.desc`)}</p>
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
          <h2 className="text-3xl md:text-4xl mb-14">{t("how.title")}</h2>
          <ol className="grid md:grid-cols-3 gap-10 md:gap-6">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-display size-12 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl">
                    {s.n}
                  </span>
                  <span className="hidden md:block flex-1 h-px bg-espresso/15" aria-hidden />
                </div>
                <h3 className="text-lg font-bold mb-1.5">{t(`how.${s.key}.title`)}</h3>
                <p className="text-sm text-espresso/65 leading-relaxed">{t(`how.${s.key}.desc`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing — Brewers */}
      <section id="pricing" className="py-20 md:py-28 bg-surface border-y border-espresso/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-start mb-16">
            <h2 className="text-3xl md:text-4xl mb-4">{t("pricing.title")}</h2>
            <p className="text-base text-espresso/65 max-w-lg">
              {t("pricing.lead")}
            </p>
          </div>
          <UserPricingToggle />
        </div>
      </section>

      {/* Pricing — Roasters */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-start mb-16">
            <p className="text-sm font-semibold text-espresso/60 mb-3">{t("roasters.badge")}</p>
            <h2 className="text-3xl md:text-4xl mb-4">{t("roasters.title")}</h2>
            <p className="text-base text-espresso/65 max-w-lg">
              {t("roasters.lead")}
            </p>
          </div>
          <RoasterPricingToggle />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto rounded-[28px] bg-pine text-paper px-8 py-16 md:px-16 md:py-20 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl mb-4 leading-snug">{t("cta.title")}</h2>
            <p className="text-base text-paper/70 max-w-md">{t("cta.lead")}</p>
          </div>
          <Link
            href="/signup"
            className="bg-paper text-pine px-8 py-4 rounded-xl text-base font-bold hover:bg-leaf transition-colors text-center"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-espresso/5 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="mb-4">
                <Wordmark size="sm" name={t("appName")} />
              </div>
              <p className="text-sm text-espresso/60 leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">{t("footer.product")}</h4>
              <div className="space-y-2">
                <Link href="/search" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.recipes")}</Link>
                <Link href="/roasters" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.roasters")}</Link>
                <Link href="/leaderboard" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.leaderboard")}</Link>
                <Link href="/events" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.events")}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">{t("footer.company")}</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.about")}</a>
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.blog")}</a>
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.careers")}</a>
                <a href="#" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.contact")}</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4">{t("footer.legal")}</h4>
              <div className="space-y-2">
                <a href="/privacy" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.privacy")}</a>
                <a href="/terms" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.terms")}</a>
                <a href="/refund-policy" className="block text-sm text-espresso/60 hover:text-espresso">{t("footer.refund")}</a>
              </div>
            </div>
          </div>
          <div className="border-t border-espresso/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-espresso/50">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-4">
              <LanguageSwitch variant="icon" />
              <a href="#" aria-label={t("footer.mail")} className="size-9 rounded-full bg-espresso/5 flex items-center justify-center hover:bg-primary/15 transition-colors">
                <MaterialIcon icon="mail" className="text-base text-espresso/60" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
