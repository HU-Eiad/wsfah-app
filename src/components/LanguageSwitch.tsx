"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import MaterialIcon from "./MaterialIcon";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

interface LanguageSwitchProps {
  /** "button": compact pill for headers; "row": settings list row; "icon": round icon button. */
  variant?: "button" | "row" | "icon";
  className?: string;
}

/** Switches between Arabic and English. Stored in a cookie; the page re-renders in place. */
export default function LanguageSwitch({ variant = "button", className = "" }: LanguageSwitchProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.language");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "ar" ? "en" : "ar";

  const change = () => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={change}
        disabled={pending}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-start disabled:opacity-60 ${className}`}
      >
        <MaterialIcon icon="language" className="text-xl text-espresso/60" />
        <span className="flex-1 text-sm font-medium">{t("label")}</span>
        <span className="text-sm text-espresso/60">{t("current")}</span>
        {/* The other language is always written in its own script so anyone can find it. */}
        <span lang={next} className="text-sm font-semibold text-primary">{t("switchTo")}</span>
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={change}
        disabled={pending}
        aria-label={t("switchLabel")}
        className={`size-9 rounded-full bg-espresso/5 flex items-center justify-center hover:bg-primary/15 transition-colors disabled:opacity-60 ${className}`}
      >
        <MaterialIcon icon="language" className="text-base text-espresso/60" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={change}
      disabled={pending}
      aria-label={t("switchLabel")}
      className={`inline-flex items-center gap-1.5 rounded-full border border-espresso/15 px-3 py-1.5 text-sm font-semibold hover:border-primary/40 transition-colors disabled:opacity-60 ${className}`}
    >
      <MaterialIcon icon="language" className="text-base" />
      <span lang={next}>{t("switchTo")}</span>
    </button>
  );
}
