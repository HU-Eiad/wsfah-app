"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "@/i18n/format";
import BrewCalendar from "@/components/BrewCalendar";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";

interface Stats {
  total: number;
  thisWeek: number;
  thisMonth: number;
  streak: number;
}

interface BrewLog {
  id: string;
  title: string;
  notes: string | null;
  rating: number | null;
  brewDate: string;
  recipe: { id: string; title: string; slug: string } | null;
}

export default function JournalPage() {
  const t = useTranslations("journal");
  const locale = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<BrewLog[]>([]);
  const [brewDates, setBrewDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/journal/stats").then((r) => r.json()),
      fetch("/api/journal?limit=20").then((r) => r.json()),
    ])
      .then(([s, l]) => {
        setStats(s);
        setLogs(Array.isArray(l) ? l : []);
        setBrewDates(
          Array.isArray(l) ? l.map((log: BrewLog) => log.brewDate) : []
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    { label: t("stats.total"), value: stats?.total ?? 0, brand: "bean" },
    { label: t("stats.thisWeek"), value: stats?.thisWeek ?? 0, icon: "calendar_today" },
    { label: t("stats.thisMonth"), value: stats?.thisMonth ?? 0, icon: "bar_chart" },
    { label: t("stats.streak"), value: t("stats.streakDays", { count: stats?.streak ?? 0 }), icon: "local_fire_department" },
  ];

  return (
    <div className="min-h-screen bg-background-light text-espresso">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <h1 className="text-2xl flex-1">{t("title")}</h1>
        <Link
          href="/journal/new"
          className="bg-primary text-on-primary rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <MaterialIcon icon="add" className="text-lg" />
          {t("logBrew")}
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-surface rounded-2xl border border-espresso/10 p-4"
            >
              <div className="flex items-center gap-2 mb-2 text-primary">
                {card.brand ? (
                  <BrandIcon name={card.brand} className="text-xl" />
                ) : (
                  <MaterialIcon icon={card.icon!} className="text-xl" />
                )}
                <span className="text-xs text-espresso/60">{card.label}</span>
              </div>
              <p className="font-display text-2xl">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <BrewCalendar brewDates={brewDates} />
        </div>

        {/* Recent Logs */}
        <h2 className="text-xl mb-4">{t("recent")}</h2>
        {logs.length === 0 ? (
          <div className="text-center py-10 px-6 bg-surface rounded-2xl border border-espresso/10">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-sm text-espresso/70 leading-relaxed mb-5">
              {t("empty")}
            </p>
            <Link
              href="/journal/new"
              className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("logFirst")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-surface rounded-2xl border border-espresso/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 dir="auto" className="font-bold text-sm">
                      {log.title}
                    </h3>
                    {log.recipe && (
                      <Link
                        href={`/recipe/${log.recipe.slug}`}
                        dir="auto"
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {log.recipe.title}
                      </Link>
                    )}
                    {log.notes && (
                      <p dir="auto" className="text-sm text-espresso/70 leading-relaxed mt-1 line-clamp-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-xs text-espresso/60">
                      {new Date(log.brewDate).toLocaleDateString(intlLocale(locale))}
                    </p>
                    {log.rating && (
                      <div className="flex gap-0.5 mt-1 justify-end">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <MaterialIcon
                            key={s}
                            icon="star"
                            filled
                            className={`text-base ${s <= log.rating! ? "text-crema" : "text-espresso/15"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
