"use client";

import { useState } from "react";
import Link from "next/link";
import MaterialIcon from "./MaterialIcon";
import RiyalSign from "./RiyalSign";
import { useTranslations } from "next-intl";

type Interval = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  monthly: string;
  yearly: string;
  period: { monthly: string; yearly: string };
  desc: string;
  features: string[];
  cta: { monthly: string; yearly: string } | string;
  href: { monthly: string; yearly: string } | string;
  highlighted?: boolean;
  badge?: string;
  yearlyBadge?: string;
  isGold?: boolean;
}

/** Internal marker for plans priced on request (shown as "custom"). */
const CUSTOM = "custom";

export function UserPricingToggle() {
  const t = useTranslations("pricingToggle");
  const plans: Plan[] = [
    {
      id: "free",
      name: t("free.name"),
      monthly: "0",
      yearly: "0",
      period: { monthly: t("forever"), yearly: t("forever") },
      desc: t("free.desc"),
      features: t.raw("free.features") as string[],
      cta: t("ctaStartNow"),
      href: "/signup",
    },
    {
      id: "pro",
      name: t("pro.name"),
      monthly: "4.99",
      yearly: "49.99",
      period: { monthly: t("perMonth"), yearly: t("perYear") },
      desc: t("pro.desc"),
      features: t.raw("pro.features") as string[],
      cta: t("ctaStartTrial"),
      href: { monthly: "/pricing?interval=monthly", yearly: "/pricing?interval=yearly" },
      highlighted: true,
      badge: t("badgePopular"),
      yearlyBadge: t("save17"),
    },
  ];

  return <PricingSection plans={plans} variant="user" />;
}

export function RoasterPricingToggle() {
  const t = useTranslations("pricingToggle");
  const plans: Plan[] = [
    {
      id: "roasterBasic",
      name: t("roasterBasic.name"),
      monthly: "39",
      yearly: "390",
      period: { monthly: t("perMonth"), yearly: t("perYear") },
      desc: t("roasterBasic.desc"),
      features: t.raw("roasterBasic.features") as string[],
      cta: t("ctaStartTrial"),
      href: { monthly: "/pricing?interval=monthly", yearly: "/pricing?interval=yearly" },
      yearlyBadge: t("save17"),
      isGold: true,
    },
    {
      id: "roasterPro",
      name: t("roasterPro.name"),
      monthly: "79",
      yearly: "790",
      period: { monthly: t("perMonth"), yearly: t("perYear") },
      desc: t("roasterPro.desc"),
      features: t.raw("roasterPro.features") as string[],
      cta: t("ctaStartTrial"),
      href: { monthly: "/pricing?interval=monthly", yearly: "/pricing?interval=yearly" },
      highlighted: true,
      badge: t("badgeBestValue"),
      yearlyBadge: t("save17"),
      isGold: true,
    },
    {
      id: "enterprise",
      name: t("enterprise.name"),
      monthly: CUSTOM,
      yearly: CUSTOM,
      period: { monthly: "", yearly: "" },
      desc: t("enterprise.desc"),
      features: t.raw("enterprise.features") as string[],
      cta: t("ctaContactSales"),
      href: "/pricing",
      isGold: true,
    },
  ];

  return <PricingSection plans={plans} variant="roaster" />;
}

function PricingSection({ plans, variant }: { plans: Plan[]; variant: "user" | "roaster" }) {
  const [interval, setInterval] = useState<Interval>("monthly");
  const isGold = variant === "roaster";
  const t = useTranslations("pricingToggle");

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-semibold ${interval === "monthly" ? "text-espresso" : "text-espresso/60"}`}>
          {t("monthly")}
        </span>
        <button
          onClick={() => setInterval(interval === "monthly" ? "yearly" : "monthly")}
          role="switch"
          aria-checked={interval === "yearly"}
          aria-label={t("yearlyBillingAria")}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            interval === "yearly" ? (isGold ? "bg-brand-gold" : "bg-primary") : "bg-espresso/20"
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
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isGold ? "bg-brand-gold/10 text-brand-gold" : "bg-green-100 text-green-700"
          }`}>
            {t("save17")}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className={`grid gap-6 ${variant === "roaster" ? "md:grid-cols-3 max-w-5xl" : "md:grid-cols-2 max-w-3xl"} mx-auto`}>
        {plans.map((plan) => {
          const price = plan[interval];
          const period = plan.period[interval];
          const href = typeof plan.href === "string" ? plan.href : plan.href[interval];
          const cta = typeof plan.cta === "string" ? plan.cta : plan.cta[interval];
          const showYearlySaving = interval === "yearly" && plan.yearlyBadge && price !== "0" && price !== CUSTOM;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-pine text-paper"
                  : "bg-surface border border-espresso/10"
              }`}
            >
              {plan.highlighted && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                  isGold ? "bg-brand-gold text-white" : "bg-paper text-pine"
                } text-[11px] font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap`}>
                  {showYearlySaving ? plan.yearlyBadge : plan.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl">{price === CUSTOM ? t("custom") : price}</span>
                  {price !== CUSTOM && price !== "0" && (
                    <RiyalSign className={`text-2xl ${plan.highlighted ? "text-paper/80" : "text-espresso/70"}`} />
                  )}
                  {period && (
                    <span className={`text-sm font-semibold ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>{period}</span>
                  )}
                </div>
                {/* Monthly equivalent for yearly */}
                {interval === "yearly" && price !== "0" && price !== CUSTOM && (
                  <p className={`text-xs mt-1 ${plan.highlighted ? "text-paper/70" : "text-espresso/60"}`}>
                    ≈ {(parseFloat(price) / 12).toFixed(2)} <RiyalSign /> {t("perMonth")}
                  </p>
                )}
                <p className={`text-sm mt-2 leading-relaxed ${plan.highlighted ? "text-paper/80" : "text-espresso/70"}`}>{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <MaterialIcon
                      icon="check_circle"
                      className={`text-lg flex-shrink-0 ${
                        plan.highlighted
                          ? "text-leaf"
                          : isGold ? "text-brand-gold" : "text-primary"
                      }`}
                      filled
                    />
                    <span className={plan.highlighted ? "text-paper/90" : "text-espresso/70"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={href}
                className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-colors ${
                  plan.highlighted
                    ? "bg-paper text-pine hover:bg-leaf"
                    : isGold
                      ? "border border-brand-gold/40 text-espresso hover:bg-brand-gold hover:text-white hover:border-brand-gold"
                      : "border border-espresso/15 text-espresso hover:border-primary/40"
                }`}
              >
                {cta}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
