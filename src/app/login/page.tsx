"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useApiErrorMessage } from "@/components/useApiErrorMessage";
import { loginWithCredentials, loginWithPhoneOtp } from "./actions";

type Tab = "phone" | "email";

// Post-login destination from ?callbackUrl=, limited to same-site relative paths.
function getCallbackUrl(): string {
  if (typeof window === "undefined") return "/";
  const value = new URLSearchParams(window.location.search).get("callbackUrl");
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : "/";
}

export default function LoginPage() {
  const t = useTranslations("login");
  const apiError = useApiErrorMessage();
  const [tab, setTab] = useState<Tab>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [testOtp, setTestOtp] = useState("");

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const sendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        setError(apiError(res.status));
        return;
      }
      const data = await res.json().catch(() => ({}));
      setOtpSent(true);
      if (data.otp_for_testing) setTestOtp(data.otp_for_testing);
    } catch {
      setError(t("sendOtpFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await loginWithPhoneOtp(phone, otp, getCallbackUrl());
      if (result && !result.success) {
        setError(result.error || t("invalidOtp"));
        setLoading(false);
      }
      // If successful, server action redirects automatically
    } catch {
      // NEXT_REDIRECT throws here — that's success
      // If it's actually an error, show it
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginWithCredentials(email, password, getCallbackUrl());
      if (result && !result.success) {
        setError(result.error || t("invalidCredentials"));
        setLoading(false);
      }
      // If successful, server action redirects automatically
    } catch {
      // NEXT_REDIRECT throws here — that's success
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    signIn("google", { callbackUrl: getCallbackUrl() });
  };


  return (
    <div className="min-h-screen bg-background-light text-espresso flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Language switch: visitors can change language before signing in */}
        <div className="flex justify-end mb-4">
          <LanguageSwitch />
        </div>
        {/* Brand mark */}
        <div className="text-center mb-10">
          <Link href="/" aria-label={t("homeAria")} className="inline-flex mb-8">
            <BrandMark name={t("appName")} />
          </Link>
          <h1 className="text-2xl">{t("title")}</h1>
          <p className="text-sm text-espresso/60 mt-2 leading-relaxed">{t("subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-espresso/10 mb-6">
          {(["phone", "email"] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setError(""); }}
              className={`flex-1 py-3 -mb-px text-sm font-semibold transition-colors ${
                tab === tabKey
                  ? "text-primary border-b-2 border-primary"
                  : "text-espresso/60 hover:text-espresso"
              }`}
            >
              {tabKey === "phone" ? t("tabPhone") : t("tabEmail")}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Phone Tab */}
        {tab === "phone" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="login-phone" className={labelCls}>
                {t("phoneLabel")}
              </label>
              <input
                id="login-phone"
                dir="ltr"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 5XX XXX XXXX"
                className={`${inputCls} disabled:opacity-60`}
                disabled={otpSent}
              />
            </div>

            {!otpSent ? (
              <button
                onClick={sendOtp}
                disabled={loading || !phone}
                className={primaryBtnCls}
              >
                {loading ? t("sending") : t("sendCode")}
              </button>
            ) : (
              <>
                {testOtp && (
                  <div className="bg-primary/10 rounded-xl p-3">
                    <p className="text-xs text-primary text-center">
                      {t("testCode")} <span className="font-mono font-bold">{testOtp}</span>
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="login-otp" className={labelCls}>
                    {t("otpLabel")}
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder={t("otpPlaceholder")}
                    maxLength={6}
                    className={`${inputCls} text-center tracking-[0.5em] font-mono`}
                  />
                </div>
                <button
                  onClick={handleOtpLogin}
                  disabled={loading || otp.length !== 6}
                  className={primaryBtnCls}
                >
                  {loading ? t("verifying") : t("verifyAndLogin")}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(""); setTestOtp(""); }}
                  className="w-full text-center text-xs text-espresso/60 hover:text-primary py-1"
                >
                  {t("resendCode")}
                </button>
              </>
            )}
          </div>
        )}

        {/* Email Tab */}
        {tab === "email" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className={labelCls}>
                {t("emailLabel")}
              </label>
              <input
                id="login-email"
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="login-password" className={labelCls}>
                {t("passwordLabel")}
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={primaryBtnCls}
            >
              {loading ? t("loggingIn") : t("login")}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-espresso/10" />
          <span className="text-xs text-espresso/50">{t("or")}</span>
          <div className="flex-1 h-px bg-espresso/10" />
        </div>

        {/* Google */}
        <button
          onClick={loginWithGoogle}
          className={googleBtnCls}
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t("continueGoogle")}
        </button>

        {/* Forgot password */}
        <Link href="/forgot-password" className="block text-center text-sm text-espresso/60 mt-6 hover:text-primary">
          {t("forgotPassword")}
        </Link>

        {/* Sign up link */}
        <p className="text-center text-sm text-espresso/60 mt-4">
          {t("noAccount")}{" "}
          <Link href="/signup" className="text-primary font-semibold">
            {t("signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelCls = "text-xs font-semibold text-espresso/70 mb-1.5 block";
const inputCls =
  "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const primaryBtnCls =
  "w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50";
const googleBtnCls =
  "w-full py-3 rounded-xl bg-surface border border-espresso/15 font-semibold text-sm flex items-center justify-center gap-3 hover:border-primary/40 transition-colors";

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
