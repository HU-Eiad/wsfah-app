"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupAndLogin } from "./actions";

type Tab = "phone" | "email";

export default function SignupPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Phone state
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [testOtp, setTestOtp] = useState("");

  // Email state
  const [email, setEmail] = useState("");
  const [emailName, setEmailName] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const sendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtpSent(true);
      if (data.otp_for_testing) setTestOtp(data.otp_for_testing);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const signupWithPhone = async () => {
    setError("");
    setLoading(true);
    try {
      // Register user first
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password: phonePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Then sign in with OTP (server action)
      const result = await signupAndLogin("phone-otp", { phone, otp });
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Login failed after signup");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  const signupWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailName,
          email,
          password: emailPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Auto-login after registration (server action)
      const result = await signupAndLogin("credentials", { email, password: emailPassword });
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Login failed after signup");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background-light text-espresso flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="text-center mb-10">
          <Link href="/" aria-label="وصفة، الصفحة الرئيسية" className="inline-flex mb-8">
            <BrandMark />
          </Link>
          <h1 className="text-2xl">إنشاء حساب</h1>
          <p className="text-sm text-espresso/60 mt-2 leading-relaxed">انضم إلى مجتمع وصفة</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-espresso/10 mb-6">
          {(["phone", "email"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-3 -mb-px text-sm font-semibold transition-colors ${
                tab === t
                  ? "text-primary border-b-2 border-primary"
                  : "text-espresso/60 hover:text-espresso"
              }`}
            >
              {t === "phone" ? "الهاتف" : "البريد الإلكتروني"}
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
              <label htmlFor="signup-name" className={labelCls}>الاسم</label>
              <input
                id="signup-name"
                dir="auto"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="signup-phone" className={labelCls}>رقم الهاتف</label>
              <input
                id="signup-phone"
                dir="ltr"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 5XX XXX XXXX"
                className={`${inputCls} disabled:opacity-60`}
                disabled={otpSent}
              />
            </div>
            <div>
              <label htmlFor="signup-phone-password" className={labelCls}>كلمة المرور</label>
              <input
                id="signup-phone-password"
                type="password"
                value={phonePassword}
                onChange={(e) => setPhonePassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                className={inputCls}
              />
            </div>

            {!otpSent ? (
              <button
                onClick={sendOtp}
                disabled={loading || !phone || !name || phonePassword.length < 6}
                className={primaryBtnCls}
              >
                {loading ? "جارٍ الإرسال…" : "إرسال الرمز"}
              </button>
            ) : (
              <>
                {testOtp && (
                  <div className="bg-primary/10 rounded-xl p-3">
                    <p className="text-xs text-primary text-center">
                      رمز تجريبي: <span className="font-mono font-bold">{testOtp}</span>
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="signup-otp" className={labelCls}>رمز التحقق</label>
                  <input
                    id="signup-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="أدخل الرمز المكون من 6 أرقام"
                    maxLength={6}
                    className={`${inputCls} text-center tracking-[0.5em] font-mono`}
                  />
                </div>
                <button
                  onClick={signupWithPhone}
                  disabled={loading || otp.length !== 6}
                  className={primaryBtnCls}
                >
                  {loading ? "جارٍ إنشاء الحساب…" : "إنشاء حساب"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Email Tab */}
        {tab === "email" && (
          <form onSubmit={signupWithEmail} className="space-y-4">
            <div>
              <label htmlFor="signup-email-name" className={labelCls}>الاسم</label>
              <input
                id="signup-email-name"
                dir="auto"
                type="text"
                value={emailName}
                onChange={(e) => setEmailName(e.target.value)}
                placeholder="اسمك"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="signup-email" className={labelCls}>البريد الإلكتروني</label>
              <input
                id="signup-email"
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="signup-email-password" className={labelCls}>كلمة المرور</label>
              <input
                id="signup-email-password"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || !emailName || emailPassword.length < 6}
              className={primaryBtnCls}
            >
              {loading ? "جارٍ إنشاء الحساب…" : "إنشاء حساب"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-espresso/10" />
          <span className="text-xs text-espresso/50">أو</span>
          <div className="flex-1 h-px bg-espresso/10" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className={googleBtnCls}
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          المتابعة مع Google
        </button>

        {/* Login link */}
        <p className="text-center text-sm text-espresso/60 mt-6">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-primary font-semibold">
            تسجيل الدخول
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

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="size-10 rounded-xl bg-forest text-paper flex items-center justify-center">
        <span
          className="wsfa-icon"
          style={{ "--icon": "url(/brand/wsfa-mark.svg)", fontSize: 24 } as React.CSSProperties}
          aria-hidden
        />
      </span>
      <span className="font-display text-2xl font-semibold">وصفة</span>
    </span>
  );
}
