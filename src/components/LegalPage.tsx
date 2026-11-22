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

/**
 * Shared layout for static legal pages (privacy, terms), styled like the refund
 * policy page. Each section reads `sections.<key>.title`, `sections.<key>.body`
 * and an optional `sections.<key>.points` string array from the namespace.
 */
export default async function LegalPage({
  namespace,
  sections,
}: {
  namespace: "privacy" | "terms";
  sections: { key: string; hasPoints?: boolean }[];
}) {
  const t = await getTranslations(namespace);
  const tl = await getTranslations("legal");

  return (
    <div className="bg-background-light text-espresso min-h-screen">
      <nav className="sticky top-0 z-50 bg-background-light/85 backdrop-blur-xl border-b border-espresso/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label={tl("homeAria")}>
            <Wordmark name={tl("appName")} />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-espresso/70 hover:text-espresso">
            {tl("login")}
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-14 md:py-20">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl mb-4">{t("title")}</h1>
          <p className="text-base text-espresso/70 leading-loose">{t("lead")}</p>
          <p className="text-xs text-espresso/60 mt-3">{tl("lastUpdated", { date: t("updatedOn") })}</p>
        </header>

        <div>
          {sections.map((section, i) => (
            <section
              key={section.key}
              id={section.key}
              className={`py-8 ${i > 0 ? "border-t border-espresso/10" : "pt-0"}`}
            >
              <h2 className="text-xl mb-3">{t(`sections.${section.key}.title`)}</h2>
              <p className="text-base text-espresso/70 leading-loose">{t(`sections.${section.key}.body`)}</p>
              {section.hasPoints && (
                <ul className="mt-3 space-y-2 list-disc ps-5 text-base text-espresso/70 leading-loose">
                  {(t.raw(`sections.${section.key}.points`) as string[]).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <section className="mt-12 bg-surface rounded-2xl border border-espresso/10 p-6 md:p-8">
          <h2 className="text-xl mb-2">{tl("contactTitle")}</h2>
          <p className="text-sm text-espresso/70 leading-relaxed mb-5">{tl("contactBody")}</p>
          <a
            href="mailto:support@wsfa.app"
            dir="ltr"
            className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            support@wsfa.app
          </a>
        </section>
      </main>

      <footer className="border-t border-espresso/10 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Wordmark size="sm" name={tl("appName")} />
          <div className="flex items-center gap-4 text-xs text-espresso/60">
            <Link href="/privacy" className="hover:text-espresso">{tl("privacyLink")}</Link>
            <Link href="/terms" className="hover:text-espresso">{tl("termsLink")}</Link>
            <Link href="/refund-policy" className="hover:text-espresso">{tl("refundLink")}</Link>
          </div>
          <p className="text-xs text-espresso/60">{tl("copyright", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}
