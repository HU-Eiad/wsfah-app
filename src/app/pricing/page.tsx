"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import RiyalSign from "@/components/RiyalSign";
import { PENDING_PROMOTION_KEY } from "@/components/PromoteButton";
import BottomNav from "@/components/BottomNav";
import { useTranslations } from "next-intl";
import { useApiErrorMessage } from "@/components/useApiErrorMessage";

export const dynamic = "force-dynamic";

export default function PricingPageWrapper() {
  return (
    <Suspense>
      <PricingPage />
    </Suspense>
  );
}

type Interval = "monthly" | "yearly";

// Display text lives in the "pricing" namespace; name/features/period/badges below are message keys.
// "custom" marks plans priced on request.
const USER_PLANS = [
  {
    slug: "free",
    key: "free",
    monthly: "0",
    yearly: "0",
    currency: "SAR",
    period: { monthly: "forever", yearly: "forever" },
  },
  {
    slug: { monthly: "pro", yearly: "pro-yearly" },
    key: "pro",
    monthly: "4.99",
    yearly: "49.99",
    currency: "SAR",
    period: { monthly: "perMonth", yearly: "perYear" },
    highlighted: true,
    badge: "badgePopular",
    yearlyBadge: "save17",
  },
];

const ROASTER_PLANS = [
  {
    slug: { monthly: "roaster-basic", yearly: "roaster-basic-yearly" },
    key: "roasterBasic",
    monthly: "39",
    yearly: "390",
    currency: "SAR",
    period: { monthly: "perMonth", yearly: "perYear" },
    yearlyBadge: "save17",
  },
  {
    slug: { monthly: "roaster-pro", yearly: "roaster-pro-yearly" },
    key: "roasterPro",
    monthly: "79",
    yearly: "790",
    currency: "SAR",
    period: { monthly: "perMonth", yearly: "perYear" },
    highlighted: true,
    badge: "badgeBestValue",
    yearlyBadge: "save17",
  },
  {
    slug: { monthly: "enterprise", yearly: "enterprise" },
    key: "enterprise",
    monthly: "custom",
    yearly: "custom",
    currency: "",
    period: { monthly: "", yearly: "" },
  },
];

function PricingPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("pricing");
  const tc = useTranslations("common");
  const apiError = useApiErrorMessage();
  const status = searchParams.get("status");
  const isPromotion = searchParams.get("type") === "promotion";
  const [promoState, setPromoState] = useState<"checking" | "paid" | "unpaid">("checking");
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

  // Back from a promotion payment: confirm it with the server using the stored id.
  useEffect(() => {
    if (status !== "success" && status !== "cancelled") return;
    let promotionId: string | null = null;
    try {
      promotionId = sessionStorage.getItem(PENDING_PROMOTION_KEY);
      if (status === "cancelled") sessionStorage.removeItem(PENDING_PROMOTION_KEY);
    } catch {}
    if (status !== "success" || !isPromotion) return;
    let cancelled = false;
    if (!promotionId) {
      // Nothing stored (e.g. another device/tab): StreamPay only sends users
      // here after a successful payment, so show the received message.
      Promise.resolve().then(() => { if (!cancelled) setPromoState("paid"); });
      return () => { cancelled = true; };
    }
    fetch("/api/promotions/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promotionId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.activated) {
          try { sessionStorage.removeItem(PENDING_PROMOTION_KEY); } catch {}
          setPromoState("paid");
        } else {
          setPromoState("unpaid");
        }
      })
      .catch(() => { if (!cancelled) setPromoState("unpaid"); });
    return () => { cancelled = true; };
  }, [status, isPromotion]);

  // Returning from the payment page via the back button restores this page from
  // the bfcache with the buttons still disabled; re-enable them.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function handleSubscribe(planSlug: string, companyId?: string) {
    if (planSlug === "free") return;
    if (planSlug === "enterprise") {
      window.open(`mailto:sales@wsfa.app?subject=${t("enterpriseMailSubject")}`, "_blank");
      return;
    }

    setLoading(planSlug);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, companyId }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      if (res.ok && data.url) {
        // Keep the buttons disabled while the browser leaves for the payment page.
        window.location.assign(data.url);
        return;
      }
      alert(res.ok ? t("errorGeneric") : apiError(res.status));
      setLoading(null);
    } catch {
      alert(t("paymentConnectionFailed"));
      setLoading(null);
    }
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 glass-bar px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link
          href="/home"
          aria-label={tc("back")}
          className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk"
        >
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 max-w-2xl mx-auto w-full">
        {/* Success/Cancel banner */}
        {status === "success" && isPromotion && (
          <div className={`${promoState === "unpaid" ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"} border rounded-2xl p-4 mb-6 text-center`} role="status">
            <MaterialIcon
              icon={promoState === "unpaid" ? "hourglass_top" : "check_circle"}
              className={`${promoState === "unpaid" ? "text-amber-700" : "text-green-700"} text-3xl mb-2`}
            />
            <p className={`${promoState === "unpaid" ? "text-amber-800" : "text-green-800"} font-bold`}>
              {t(`promotion.${promoState}Title`)}
            </p>
            <p className={`${promoState === "unpaid" ? "text-amber-700" : "text-green-700"} text-sm mt-1`}>
              {t(`promotion.${promoState}Body`)}
            </p>
          </div>
        )}
        {status === "success" && !isPromotion && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <MaterialIcon icon="check_circle" className="text-green-700 text-3xl mb-2" />
            <p className="text-green-800 font-bold">{t("successTitle")}</p>
            <p className="text-green-700 text-sm mt-1">{t("successBody")}</p>
          </div>
        )}
        {status === "cancelled" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-center">
            <MaterialIcon icon="info" className="text-amber-700 text-3xl mb-2" />
            <p className="text-amber-800 font-bold">{t("cancelledTitle")}</p>
            <p className="text-amber-700 text-sm mt-1">{t("cancelledBody")}</p>
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
            {t("tabUsers")}
          </button>
          <button
            onClick={() => setTab("roasters")}
            className={`flex-1 py-3 -mb-px text-sm font-semibold transition-colors ${
              tab === "roasters" ? "text-primary border-b-2 border-primary" : "text-espresso/60 hover:text-espresso"
            }`}
          >
            {t("tabRoasters")}
          </button>
        </div>

        {/* Interval toggle - monthly/yearly */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm font-semibold ${interval === "monthly" ? "text-espresso" : "text-espresso/60"}`}>
            {t("monthly")}
          </span>
          <button
            onClick={() => setInterval(interval === "monthly" ? "yearly" : "monthly")}
            role="switch"
            aria-checked={interval === "yearly"}
            aria-label={t("yearlyBillingAria")}
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
            {t("yearly")}
          </span>
          {interval === "yearly" && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {t("save17")}
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
                  <h3 className="text-lg font-bold">{t(`plans.${plan.key}.name`)}</h3>
                  <div className="flex gap-2">
                    {showYearlySaving && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          plan.highlighted ? "bg-paper text-pine" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {t(plan.yearlyBadge)}
                      </span>
                    )}
                    {plan.badge && !showYearlySaving && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          plan.highlighted ? "bg-paper text-pine" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {t(plan.badge)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-display text-3xl">{price === "custom" ? t("custom") : price}</span>
                  {plan.currency === "SAR" ? (
                    <RiyalSign className={`text-xl ${plan.highlighted ? "text-paper/80" : "text-espresso/70"}`} />
                  ) : plan.currency ? (
                    <span className={`text-sm font-medium ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>
                      {plan.currency}
                    </span>
                  ) : null}
                  {period && (
                    <span className={`text-sm ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>{t(period)}</span>
                  )}
                </div>

                {/* Show monthly equivalent for yearly */}
                {interval === "yearly" && slug !== "free" && slug !== "enterprise" && plan.currency && (
                  <p className={`text-xs -mt-3 mb-4 ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>
                    ≈ {(parseFloat(price) / 12).toFixed(2)} {plan.currency === "SAR" ? <RiyalSign /> : plan.currency} {t("perMonth")}
                  </p>
                )}

                <ul className="space-y-2 mb-5">
                  {(t.raw(`plans.${plan.key}.features`) as string[]).map((f, i) => (
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
                    {t("currentPlan")}
                  </div>
                ) : slug === "free" ? (
                  <Link
                    href="/signup"
                    className="block w-full py-3 text-center rounded-xl border border-espresso/15 font-semibold text-sm hover:border-primary/40 transition-colors"
                  >
                    {t("startFree")}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleSubscribe(slug)}
                    disabled={loading !== null}
                    className={`w-full py-3 text-center rounded-xl font-bold text-sm transition-colors ${
                      plan.highlighted
                        ? "bg-paper text-pine hover:bg-leaf"
                        : "bg-primary text-on-primary hover:bg-primary/90"
                    } disabled:opacity-50`}
                  >
                    {loading === slug
                      ? t("redirecting")
                      : slug === "enterprise"
                      ? t("contactSales")
                      : t("subscribeNow")}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment info */}
        <div className="mt-8 text-center text-xs text-espresso/60 space-y-1">
          <p>{t("securePayment")}</p>
          <p>{t("cancelAnytime")}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">VISA</span>
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">Mastercard</span>
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">{t("mada")}</span>
            <span className="bg-oat-milk px-3 py-1.5 rounded-lg font-medium">Apple Pay</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
