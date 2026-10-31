"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default function PricingPageWrapper() {
  return (
    <Suspense>
      <PricingPage />
    </Suspense>
  );
}

type Interval = "monthly" | "yearly";

const USER_PLANS = [
  {
    slug: "free",
    name: "مجاني",
    monthly: "0",
    yearly: "0",
    currency: "SAR",
    period: { monthly: "للأبد", yearly: "للأبد" },
    features: [
      "تصفح جميع الوصفات",
      "مؤقت تحضير أساسي",
      "٣ وصفات خاصة بك",
      "بحث أساسي",
      "عرض المحمصات والعلامات",
      "ملف شخصي أساسي",
    ],
  },
  {
    slug: { monthly: "pro", yearly: "pro-yearly" },
    name: "احترافي",
    monthly: "4.99",
    yearly: "49.99",
    currency: "SAR",
    period: { monthly: "/شهرياً", yearly: "/سنوياً" },
    highlighted: true,
    badge: "الأكثر شعبية",
    yearlyBadge: "وفّر ١٧%",
    features: [
      "كل مميزات المجاني",
      "وصفات غير محدودة",
      "دفتر التحضير الكامل",
      "المجموعات والمحفوظات",
      "الرسائل المباشرة",
      "المجموعات والفعاليات",
      "معرض الصور",
      "معدات التحضير",
    ],
  },
];

const ROASTER_PLANS = [
  {
    slug: { monthly: "roaster-basic", yearly: "roaster-basic-yearly" },
    name: "المحمصة - أساسي",
    monthly: "39",
    yearly: "390",
    currency: "SAR",
    period: { monthly: "/شهرياً", yearly: "/سنوياً" },
    yearlyBadge: "وفّر ١٧%",
    features: [
      "صفحة علامة تجارية مخصصة",
      "نشر حتى ١٠ منتجات",
      "وصفات رسمية للعلامة",
      "إحصائيات أساسية",
      "شارة موثق",
      "مدير واحد",
    ],
  },
  {
    slug: { monthly: "roaster-pro", yearly: "roaster-pro-yearly" },
    name: "المحمصة - احترافي",
    monthly: "79",
    yearly: "790",
    currency: "SAR",
    period: { monthly: "/شهرياً", yearly: "/سنوياً" },
    highlighted: true,
    badge: "أفضل قيمة",
    yearlyBadge: "وفّر ١٧%",
    features: [
      "كل مميزات الأساسي",
      "منتجات غير محدودة",
      "ستوريز وقصص",
      "كوبونات وبطاقات ولاء",
      "مكافآت العلامة التجارية",
      "تحليلات متقدمة",
      "٥ أعضاء فريق",
      "أولوية في الظهور",
    ],
  },
  {
    slug: { monthly: "enterprise", yearly: "enterprise" },
    name: "الشركات",
    monthly: "مخصص",
    yearly: "مخصص",
    currency: "",
    period: { monthly: "", yearly: "" },
    features: [
      "كل مميزات الاحترافي",
      "أعضاء فريق غير محدودين",
      "API مخصص",
      "مدير حساب مخصص",
      "تقارير مخصصة",
      "ترويج مميز",
      "تكامل مع أنظمة POS",
      "دعم فني ٢٤/٧",
    ],
  },
];

function PricingPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [tab, setTab] = useState<"users" | "roasters">("users");
  const [interval, setInterval] = useState<Interval>("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("free");

  useEffect(() => {
    fetch("/api/subscriptions")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUserTier(data.user.tier);
      })
      .catch(() => {});
  }, []);

  async function handleSubscribe(planSlug: string, companyId?: string) {
    if (planSlug === "free") return;
    if (planSlug === "enterprise") {
      window.open("mailto:sales@wsfa.app?subject=اشتراك الشركات", "_blank");
      return;
    }

    setLoading(planSlug);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, companyId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "حدث خطأ");
      }
    } catch {
      alert("فشل الاتصال بخدمة الدفع");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link
          href="/home"
          aria-label="رجوع"
          className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk"
        >
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">الأسعار</h1>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 max-w-2xl mx-auto w-full">
        {/* Success/Cancel banner */}
        {status === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <MaterialIcon icon="check_circle" className="text-green-700 text-3xl mb-2" />
            <p className="text-green-800 font-bold">تم الاشتراك بنجاح</p>
            <p className="text-green-700 text-sm mt-1">شكراً لك، تم تفعيل اشتراكك</p>
          </div>
        )}
        {status === "cancelled" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center">
            <MaterialIcon icon="info" className="text-amber-700 text-3xl mb-2" />
            <p className="text-amber-800 font-bold">تم إلغاء عملية الدفع</p>
            <p className="text-amber-700 text-sm mt-1">يمكنك المحاولة مرة أخرى في أي وقت</p>
          </div>
        )}

        {/* Tab switch - users/roasters */}
        <div className="flex border-b border-espresso/10 mb-6">
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-3 -mb-px text-sm font-semibold transition-colors ${
              tab === "users" ? "text-primary border-b-2 border-primary" : "text-espresso/60 hover:text-espresso"
            }`}
          >
            للمستخدمين
          </button>
          <button
            onClick={() => setTab("roasters")}
            className={`flex-1 py-3 -mb-px text-sm font-semibold transition-colors ${
              tab === "roasters" ? "text-primary border-b-2 border-primary" : "text-espresso/60 hover:text-espresso"
            }`}
          >
            للمحمصات والعلامات
          </button>
        </div>

        {/* Interval toggle - monthly/yearly */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm font-semibold ${interval === "monthly" ? "text-espresso" : "text-espresso/60"}`}>
            شهري
          </span>
          <button
            onClick={() => setInterval(interval === "monthly" ? "yearly" : "monthly")}
            role="switch"
            aria-checked={interval === "yearly"}
            aria-label="الفوترة السنوية"
            className={`relative w-14 h-7 rounded-full transition-colors ${
              interval === "yearly" ? "bg-primary" : "bg-espresso/20"
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 bg-surface rounded-full shadow-sm transition-all ${
                interval === "yearly" ? "end-0.5" : "start-0.5"
              }`}
            />
          </button>
          <span className={`text-sm font-semibold ${interval === "yearly" ? "text-espresso" : "text-espresso/60"}`}>
            سنوي
          </span>
          {interval === "yearly" && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
              وفّر ١٧%
            </span>
          )}
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {(tab === "users" ? USER_PLANS : ROASTER_PLANS).map((plan) => {
            const slug = typeof plan.slug === "string" ? plan.slug : plan.slug[interval];
            const price = plan[interval];
            const period = plan.period[interval];
            const isCurrent = tab === "users" && (slug === userTier || (slug === "free" && userTier === "free"));
            const showYearlySaving = interval === "yearly" && plan.yearlyBadge && slug !== "free";

            return (
              <div
                key={slug}
                className={`rounded-2xl p-5 ${
                  plan.highlighted
                    ? "bg-pine text-paper"
                    : "bg-surface border border-espresso/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="flex gap-2">
                    {showYearlySaving && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          plan.highlighted ? "bg-paper text-pine" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {plan.yearlyBadge}
                      </span>
                    )}
                    {plan.badge && !showYearlySaving && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          plan.highlighted ? "bg-paper text-pine" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-display text-3xl">{price}</span>
                  {plan.currency && (
                    <span className={`text-sm font-medium ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>
                      {plan.currency}
                    </span>
                  )}
                  {period && (
                    <span className={`text-sm ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>{period}</span>
                  )}
                </div>

                {/* Show monthly equivalent for yearly */}
                {interval === "yearly" && slug !== "free" && slug !== "enterprise" && plan.currency && (
                  <p className={`text-xs -mt-3 mb-4 ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>
                    ≈ {(parseFloat(price) / 12).toFixed(2)} {plan.currency} /شهرياً
                  </p>
                )}

                <ul className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <MaterialIcon
                        icon="check_circle"
                        className={`text-base ${
                          plan.highlighted ? "text-leaf" : "text-primary"
                        }`}
                      />
                      <span className={plan.highlighted ? "text-paper/90" : "text-espresso/70"}>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent && slug === userTier ? (
                  <div
                    className={`w-full py-3 text-center rounded-xl font-semibold text-sm ${
                      plan.highlighted ? "bg-paper/10 text-paper/80" : "bg-oat-milk text-espresso/60"
                    }`}
                  >
                    خطتك الحالية
                  </div>
                ) : slug === "free" ? (
                  <Link
                    href="/signup"
                    className="block w-full py-3 text-center rounded-xl border border-espresso/15 font-semibold text-sm hover:border-primary/40 transition-colors"
                  >
                    ابدأ مجاناً
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSubscribe(slug)}
                    disabled={loading === slug}
                    className={`w-full py-3 text-center rounded-xl font-bold text-sm transition-colors ${
                      plan.highlighted
                        ? "bg-paper text-pine hover:bg-leaf"
                        : "bg-primary text-on-primary hover:bg-primary/90"
                    } disabled:opacity-50`}
                  >
                    {loading === slug
                      ? "جارٍ التحويل…"
                      : slug === "enterprise"
                      ? "تواصل مع المبيعات"
                      : "اشترك الآن"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment info */}
        <div className="mt-8 text-center text-xs text-espresso/60 space-y-1">
          <p>الدفع آمن عبر StreamPay</p>
          <p>يمكنك إلغاء اشتراكك في أي وقت</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">VISA</span>
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">Mastercard</span>
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">مدى</span>
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">Apple Pay</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
