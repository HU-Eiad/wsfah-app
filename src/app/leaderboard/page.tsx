"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string | null;
  image: string | null;
  points: number;
  followers: number;
  recipes: number;
  score: number;
}

type SortTab = "points" | "recipes" | "followers";

// Labels: messages leaderboard.tabs.<key> and leaderboard.units.<key>
const TABS: SortTab[] = ["points", "recipes", "followers"];

/** Podium styling for the top three ranks. */
function rankStyle(rank: number): string {
  if (rank === 1) return "bg-crema text-white";
  if (rank === 2) return "bg-leaf text-pine";
  if (rank === 3) return "bg-primary/15 text-primary";
  return "text-espresso/60";
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<SortTab>("points");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?sort=${activeTab}`)
      .then((res) => res.json())
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="bg-background-light text-espresso min-h-screen">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <h1 className="text-2xl flex-1">{t("title")}</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex border-b border-espresso/10 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-espresso/60 border-transparent hover:text-espresso"
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 px-6">
            <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
            <p className="text-sm text-espresso/70">{t("empty")}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-espresso/10 divide-y divide-espresso/10 overflow-hidden">
            {entries.map((entry) => {
              const podium = entry.rank <= 3;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 ${podium ? "py-4" : "py-3"}`}
                >
                  {/* Rank */}
                  <div
                    className={`size-9 rounded-full flex items-center justify-center shrink-0 ${rankStyle(entry.rank)} ${
                      podium ? "font-display text-lg" : "text-sm font-semibold tabular-nums"
                    }`}
                  >
                    {entry.rank}
                  </div>

                  {/* Avatar */}
                  <img
                    src={entry.image || "/brand/banners/avatar-placeholder.svg"}
                    alt=""
                    className={`rounded-full object-cover shrink-0 bg-oat-milk ${podium ? "size-12" : "size-10"}`}
                  />

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p dir="auto" className={`truncate ${podium ? "font-bold text-base" : "font-semibold text-sm"}`}>
                      {entry.name || tc("unknownUser")}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-end shrink-0">
                    <p className={`text-primary ${podium ? "font-display text-xl" : "font-bold text-sm"}`}>
                      {entry.score.toLocaleString(intlLocale(locale))}
                    </p>
                    <p className="text-[11px] text-espresso/60">
                      {t(`units.${activeTab}`, { count: entry.score })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
