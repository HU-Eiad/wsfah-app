import Link from "next/link";
import { getTranslations } from "next-intl/server";

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

export default async function RefundPolicyPage() {
  const t = await getTranslations("refundPolicy");
  return (
    <div className="bg-background-light text-espresso min-h-screen">
      {/* Nav - matches landing page */}
      <nav className="sticky top-0 z-50 glass-bar border-b border-espresso/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label={t("homeAria")}>
            <Wordmark name={t("appName")} />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-espresso/70 hover:text-espresso">
            {t("login")}
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-14 md:py-20">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl mb-4">{t("title")}</h1>
          <p className="text-base text-espresso/70 leading-loose">
            {t("lead")}
          </p>
        </header>

        {/* Policies */}
        <div>
          {[
            { num: "01", icon: "event_available", key: "within14" },
            { num: "02", icon: "schedule", key: "after14" },
            { num: "03", icon: "autorenew", key: "autoRenew" },
            { num: "04", icon: "block", key: "afterDelivery" },
            { num: "05", icon: "local_offer", key: "promotions" },
          ].map((item, i) => (
            <section
              key={item.num}
              className={`py-8 ${i > 0 ? "border-t border-espresso/10" : "pt-0"}`}
            >
              <h2 className="text-xl mb-3">{t(`items.${item.key}.title`)}</h2>
              <p className="text-base text-espresso/70 leading-loose">{t(`items.${item.key}.body`)}</p>
            </section>
          ))}
        </div>

        {/* Contact */}
        <section className="mt-12 bg-surface rounded-2xl border border-espresso/10 p-6 md:p-8">
          <h2 className="text-xl mb-2">{t("helpTitle")}</h2>
          <p className="text-sm text-espresso/70 leading-relaxed mb-5">{t("helpBody")}</p>
          <a
            href="mailto:support@wsfa.app"
            dir="ltr"
            className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            support@wsfa.app
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-espresso/10 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Wordmark size="sm" name={t("appName")} />
          <p className="text-xs text-espresso/60">{t("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}
