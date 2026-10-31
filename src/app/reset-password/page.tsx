"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import { useTranslations } from "next-intl";

export default function ResetPasswordWrapper() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}

function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("resetPassword");
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError(t("mismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-background-light text-espresso min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/" aria-label={t("homeAria")} className="inline-flex mb-8">
            <BrandMark name={t("appName")} />
          </Link>
          <h1 className="text-2xl mb-2">{t("invalidTitle")}</h1>
          <p className="text-sm text-espresso/60 leading-relaxed mb-6">{t("invalidBody")}</p>
          <Link
            href="/forgot-password"
            className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            {t("requestNew")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" aria-label={t("homeAria")} className="inline-flex mb-8">
            <BrandMark name={t("appName")} />
          </Link>
          <h1 className="text-2xl">{t("title")}</h1>
        </div>

        {done ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <MaterialIcon icon="check_circle" className="text-green-700 text-4xl mb-3" />
            <p className="text-green-800 font-bold mb-1">{t("doneTitle")}</p>
            <Link
              href="/login"
              className="inline-block mt-4 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("login")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="reset-password" className={labelCls}>{t("newPasswordLabel")}</label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("newPasswordPlaceholder")}
                className={inputCls}
                required
                minLength={8}
                aria-describedby="reset-password-hint"
              />
              <p id="reset-password-hint" className="text-xs text-espresso/60 mt-1.5 leading-relaxed">
                {t("hint")}
              </p>
            </div>
            <div>
              <label htmlFor="reset-confirm" className={labelCls}>{t("confirmLabel")}</label>
              <input
                id="reset-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("confirmPlaceholder")}
                className={inputCls}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? t("updating") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelCls = "text-xs font-semibold text-espresso/70 mb-1.5 block";
const inputCls =
  "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

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
