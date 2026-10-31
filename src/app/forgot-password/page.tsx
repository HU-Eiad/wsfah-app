"use client";

import { useState } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" aria-label={t("homeAria")} className="inline-flex mb-8">
            <BrandMark name={t("appName")} />
          </Link>
          <h1 className="text-2xl">{t("title")}</h1>
          <p className="text-sm text-espresso/60 mt-2 leading-relaxed">{t("subtitle")}</p>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <MaterialIcon icon="mark_email_read" className="text-green-700 text-4xl mb-3" />
            <p className="text-green-800 font-bold mb-1">{t("sentTitle")}</p>
            <p className="text-green-700 text-sm leading-relaxed">{t("sentBody")}</p>
            <Link href="/login" className="inline-block mt-4 text-primary font-bold text-sm hover:underline">
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="text-xs font-semibold text-espresso/70 mb-1.5 block">
                {t("emailLabel")}
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                dir="ltr"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? t("sending") : t("sendLink")}
            </button>
            <Link href="/login" className="block text-center text-sm text-espresso/60 hover:text-primary pt-2">
              {t("backToLogin")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

function BrandMark({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="size-10 rounded-xl bg-forest text-paper flex items-center justify-center">
        <span
          className="wsfa-icon"
          style={{ "--icon": "url(/brand/wsfa-mark.svg)", fontSize: 24 } as React.CSSProperties}
          aria-hidden
        />
      </span>
      <span className="font-display text-2xl font-semibold">{name}</span>
    </span>
  );
}
