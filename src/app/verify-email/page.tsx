"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import { useTranslations } from "next-intl";

export default function VerifyEmailWrapper() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}

function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("verifyEmail");
  const token = searchParams.get("token");
  const [result, setResult] = useState<"success" | "error" | null>(null);
  // No token in the link: nothing to verify.
  const status: "loading" | "success" | "error" = !token ? "error" : result ?? "loading";

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => { if (!cancelled) setResult(res.ok ? "success" : "error"); })
      .catch(() => { if (!cancelled) setResult("error"); });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex mb-10">
          <BrandMark name={t("appName")} />
        </div>
        {status === "loading" && (
          <div>
            <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" aria-hidden />
            <p className="font-semibold">{t("verifying")}</p>
          </div>
        )}
        {status === "success" && (
          <div>
            <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <BrandIcon name="verified" className="text-green-700 text-3xl" />
            </div>
            <h1 className="text-2xl mb-2">{t("successTitle")}</h1>
            <p className="text-sm text-espresso/60 leading-relaxed mb-6">{t("successBody")}</p>
            <Link
              href="/home"
              className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("goHome")}
            </Link>
          </div>
        )}
        {status === "error" && (
          <div>
            <div className="size-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <MaterialIcon icon="error" className="text-red-600 text-3xl" />
            </div>
            <h1 className="text-2xl mb-2">{t("errorTitle")}</h1>
            <p className="text-sm text-espresso/60 leading-relaxed mb-6">{t("errorBody")}</p>
            <Link
              href="/login"
              className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("login")}
            </Link>
          </div>
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
