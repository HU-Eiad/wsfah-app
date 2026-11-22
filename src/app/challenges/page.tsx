"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BottomNav from "@/components/BottomNav";
import { useTranslations, useLocale } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface UserChallenge {
  id: string;
  currentProgress: number;
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardPoints: number;
  maxProgress: number;
  rank: string;
  category: string;
  users?: UserChallenge[];
}

interface UserData {
  points: number;
  name: string | null;
}

const RANKS = ["All", "Bronze", "Silver", "Gold"] as const;
const CATEGORIES = ["All", "General", "Brewing", "Social", "Streak"] as const;

// Display labels for the stored rank/category values live in messages ("challenges.ranks.*" / "challenges.categories.*").
const isRank = (v: string) => (RANKS as readonly string[]).includes(v);
const isCategory = (v: string) => (CATEGORIES as readonly string[]).includes(v);

const rankColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  Bronze: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-600" },
  Silver: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", badge: "bg-slate-200 text-slate-600" },
  Gold: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-600" },
};

export default function ChallengesPage() {
  const t = useTranslations("challenges");
  const tc = useTranslations("common");
  const locale = useLocale();
  const rankLabel = (rank: string) => (isRank(rank) ? t(`ranks.${rank}`) : rank);
  const categoryLabel = (cat: string) => (isCategory(cat) ? t(`categories.${cat}`) : cat);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRank, setActiveRank] = useState<string>("All");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [joining, setJoining] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  // Determine user rank from points
  const userRank = !user ? "Bronze" : user.points >= 2000 ? "Gold" : user.points >= 1000 ? "Silver" : "Bronze";

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => { if (r.ok) return r.json(); throw new Error(); })
      .then((data) => setUser(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeRank !== "All") params.set("rank", activeRank);
    if (activeCategory !== "All") params.set("category", activeCategory);

    fetch(`/api/challenges?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setChallenges(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeRank, activeCategory]);

  const handleJoin = async (challengeId: string) => {
    setJoining(challengeId);
    try {
      const res = await fetch("/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      if (res.ok) {
        // Refresh challenges
        setChallenges((prev) =>
          prev.map((ch) =>
            ch.id === challengeId
              ? { ...ch, users: [{ id: "new", currentProgress: 0, status: "ACTIVE" }] }
              : ch
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setJoining(null);
    }
  };

  const rankOrder = ["Bronze", "Silver", "Gold"];
  const userRankIndex = rankOrder.indexOf(userRank);

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 pt-3 pb-4 border-b border-espresso/10">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/rewards" aria-label={tc("back")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
            <MaterialIcon icon="arrow_forward" />
          </Link>
          <h1 className="text-xl flex-1">{t("title")}</h1>
        </div>

        {/* User Rank Badge */}
        <div className="relative overflow-hidden flex items-center gap-3 mb-4 bg-pine text-paper rounded-[20px] p-5 min-h-28">
          <Image src="/brand/banners/challenges-banner.svg" alt="" fill sizes="100vw" className="object-cover object-left ltr:-scale-x-100" />
          <div className="absolute inset-0 bg-gradient-to-l ltr:bg-gradient-to-r from-pine via-pine/85 to-transparent sm:via-pine/40" aria-hidden />
          <div className="relative flex-1">
            <p className="text-xs text-paper/70 font-medium">{t("yourRank")}</p>
            <p className="font-display text-xl">{t("memberRank", { rank: rankLabel(userRank) })}</p>
            <p className="text-sm text-paper/80 mt-1 tabular-nums">{t("points", { formatted: user?.points?.toLocaleString(intlLocale(locale)) || "0" })}</p>
          </div>
        </div>

        {/* Rank Filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
          {RANKS.map((rank) => (
            <button
              key={rank}
              onClick={() => setActiveRank(rank)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeRank === rank
                  ? "bg-primary text-on-primary"
                  : "bg-surface border border-espresso/10 text-espresso/70"
              }`}
            >
              {rankLabel(rank)}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-on-primary"
                  : "bg-surface border border-espresso/10 text-espresso/70"
              }`}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <MaterialIcon icon="fitness_center" className="text-4xl text-primary animate-pulse" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="py-16 text-center">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-sm text-espresso/70">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((ch) => {
              const userProgress = ch.users?.[0];
              const isJoined = !!userProgress;
              const progress = userProgress
                ? (userProgress.currentProgress / ch.maxProgress) * 100
                : 0;
              const isCompleted = userProgress?.currentProgress === ch.maxProgress;
              const colors = rankColors[ch.rank] || rankColors.Bronze;
              const challengeRankIndex = rankOrder.indexOf(ch.rank);
              const isLocked = challengeRankIndex > userRankIndex;

              return (
                <div
                  key={ch.id}
                  className={`bg-surface rounded-2xl border border-espresso/10 overflow-hidden ${
                    isLocked ? "opacity-60" : ""
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${colors.badge}`}>
                        <MaterialIcon icon={isLocked ? "lock" : ch.icon} className="text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold" dir="auto">{ch.title}</h3>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                            {rankLabel(ch.rank)}
                          </span>
                        </div>
                        <p className="text-xs text-espresso/70 mb-2 leading-relaxed" dir="auto">{ch.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-espresso/60">
                          <span className="flex items-center gap-1">
                            <MaterialIcon icon="stars" className="text-sm text-crema" />
                            {t.rich("rewardPoints", {
                              count: ch.rewardPoints,
                              num: (chunks) => <span className="font-display text-sm text-espresso tabular-nums">{chunks}</span>,
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MaterialIcon icon="flag" className="text-sm" />
                            {t("goal", { count: ch.maxProgress })}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-oat-milk text-espresso/70">
                            {categoryLabel(ch.category)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar for joined challenges */}
                    {isJoined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-espresso/60">{t("progress")}</span>
                          <span className="text-[11px] font-bold tabular-nums">
                            {userProgress.currentProgress}/{ch.maxProgress}
                          </span>
                        </div>
                        <div className="h-2 bg-oat-milk rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="mt-3">
                      {isLocked ? (
                        <p className="text-xs text-espresso/60 font-medium flex items-center gap-1">
                          <MaterialIcon icon="lock" className="text-sm" />
                          {t("locked", { rank: rankLabel(ch.rank) })}
                        </p>
                      ) : isCompleted ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <MaterialIcon icon="check_circle" className="text-lg" />
                          <span className="text-xs font-bold">{t("completed")}</span>
                        </div>
                      ) : isJoined ? (
                        <div className="flex items-center gap-2 text-primary">
                          <MaterialIcon icon="trending_up" className="text-lg" />
                          <span className="text-xs font-bold">{t("inProgress")}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoin(ch.id)}
                          disabled={joining === ch.id}
                          className="bg-primary text-on-primary text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-colors disabled:opacity-50"
                        >
                          {joining === ch.id ? t("joining") : t("join")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
