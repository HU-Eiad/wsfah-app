import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import { getTranslations } from "next-intl/server";

export default async function DesktopOnlyPage() {
  const t = await getTranslations("desktopOnly");
  return (
    <div className="bg-background-light text-espresso min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2.5 mb-10">
          <span className="size-10 rounded-xl bg-forest text-paper flex items-center justify-center">
            <span
              className="wsfa-icon"
              style={{ "--icon": "url(/brand/wsfa-mark.svg)", fontSize: 24 } as React.CSSProperties}
              aria-hidden
            />
          </span>
          <span className="font-display text-2xl font-semibold">{t("appName")}</span>
        </div>
        <h1 className="text-2xl mb-3">{t("title")}</h1>
        <p className="text-sm text-espresso/60 leading-relaxed mb-8">
          {t("body")}
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=com.wsfa.app"
            className="flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <MaterialIcon icon="android" className="text-lg" />
            {t("googlePlay")}
          </a>
          <a
            href="https://apps.apple.com/app/wsfa/id0000000000"
            className="flex items-center justify-center gap-2 border border-espresso/15 rounded-xl px-5 py-3 font-semibold text-sm hover:border-primary/40 transition-colors"
          >
            <MaterialIcon icon="phone_iphone" className="text-lg" />
            {t("appStore")}
          </a>
        </div>
        <Link href="/" className="inline-block mt-6 text-sm text-primary font-semibold hover:underline">
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
