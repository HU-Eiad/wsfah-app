"use client";

import SafeImage from "@/components/SafeImage";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import BottomNav from "@/components/BottomNav";
import { useTranslations, useLocale } from "next-intl";
import { intlLocale } from "@/i18n/format";
import { useApiErrorMessage } from "@/components/useApiErrorMessage";

interface UserChallenge {
  currentProgress: number;
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  icon: string;
  rewardPoints: number;
  maxProgress: number;
  rank: string;
  users: UserChallenge[];
}

interface Reward {
  id: string;
  title: string;
  category: string;
  pointsCost: number;
  imageUrl: string | null;
}

interface UserData {
  name: string | null;
  image: string | null;
  points: number;
  dailyStreak: number;
}

export default function RewardsPage() {
  const t = useTranslations("rewards");
  const tc = useTranslations("common");
  const apiError = useApiErrorMessage();
  const nf = intlLocale(useLocale());
  const [user, setUser] = useState<UserData | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [userRes, rewardsRes, challengesRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/rewards"),
          fetch("/api/challenges"),
        ]);

        if (cancelled) return;

        if (!userRes.ok) {
          window.location.href = "/login";
          return;
        }

        const userData = await userRes.json();
        setUser(userData);

        if (rewardsRes.ok) {
          setRewards(await rewardsRes.json());
        }

        if (challengesRes.ok) {
          setChallenges(await challengesRes.json());
        }
      } catch {
        if (!cancelled) window.location.href = "/login";
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleRedeem = useCallback(async (rewardId: string, pointsCost: number) => {
    if (!user || user.points < pointsCost) return;
    setRedeeming(rewardId);
    setRedeemMessage(null);

    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => prev ? { ...prev, points: data.remainingPoints } : prev);
        setRedeemMessage({ type: "success", text: t("redeem.success") });
      } else {
        setRedeemMessage({ type: "error", text: apiError(res.status) });
      }
    } catch {
      setRedeemMessage({ type: "error", text: t("redeem.error") });
    } finally {
      setRedeeming(null);
    }
  }, [user, t, apiError]);

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const memberTier = user.points >= 2000 ? "Gold" : user.points >= 1000 ? "Silver" : "Bronze";
  const tierColors: Record<string, string> = {
    Bronze: "text-orange-500",
    Silver: "text-slate-400",
    Gold: "text-amber-500",
  };
  // Display labels for the stored tier values (Bronze/Silver/Gold) live in messages under "tiers".
  const tierLabel = (tier: string) => t(`tiers.${tier}`);

  // Only show first 3 active challenges (in-progress ones)
  const activeChallenges = challenges.filter((ch) => ch.users?.length > 0 && ch.users[0].currentProgress < ch.maxProgress).slice(0, 3);

  return (
    <div className="bg-background-light text-espresso relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/" aria-label={tc("back")} className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-2xl flex-1">{t("title")}</h1>
        <Link href="/notifications" aria-label={t("notifications")} className="size-10 shrink-0 rounded-full bg-oat-milk flex items-center justify-center">
          <MaterialIcon icon="notifications" className="text-espresso/80" />
        </Link>
      </header>

      {/* Profile banner: member info at the start, stamp-card art at the end */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-[20px] bg-forest text-paper min-h-40 flex items-center p-6">
          <Image src="/brand/banners/rewards-banner.svg" alt="" fill sizes="100vw" className="object-cover object-left ltr:-scale-x-100" />
          <div className="absolute inset-0 bg-gradient-to-l ltr:bg-gradient-to-r from-forest via-forest/85 to-transparent sm:via-forest/40" aria-hidden />
          <div className="relative flex items-center gap-4">
            <SafeImage
              src={user.image || "/brand/banners/avatar-placeholder.svg"}
              alt=""
              width={80}
              height={80}
              sizes="80px"
              className="size-20 rounded-full object-cover ring-4 ring-paper/20"
            />
            <div>
              <p className="font-display text-2xl leading-tight" dir="auto">
                {user.name}
              </p>
              <p className="flex items-center gap-1.5 mt-1 text-sm font-semibold text-paper/80">
                <BrandIcon name="stamp" className="text-base" />
                {t("memberTier", { tier: tierLabel(memberTier) })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rank Progress Bar */}
      <div className="px-4 pb-2">
        <div className="bg-surface rounded-2xl p-4 border border-espresso/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MaterialIcon icon="military_tech" className={tierColors[memberTier]} />
              <p className="text-base font-bold">{t("rankProgress")}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              memberTier === "Gold" ? "bg-amber-100 text-amber-700" :
              memberTier === "Silver" ? "bg-oat-milk text-espresso/70" :
              "bg-orange-100 text-orange-700"
            }`}>
              {tierLabel(memberTier)}
            </span>
          </div>
          {(() => {
            const tierThresholds = [
              { name: "Bronze", min: 0, max: 1000, color: "from-orange-400 to-orange-500" },
              { name: "Silver", min: 1000, max: 2000, color: "from-slate-300 to-slate-400" },
              { name: "Gold", min: 2000, max: 2000, color: "from-amber-400 to-amber-500" },
            ];
            const currentTier = tierThresholds.find((tier) => tier.name === memberTier)!;
            const isMaxed = memberTier === "Gold";
            const progress = isMaxed ? 100 : ((user.points - currentTier.min) / (currentTier.max - currentTier.min)) * 100;
            const nextTierName = memberTier === "Bronze" ? "Silver" : memberTier === "Silver" ? "Gold" : null;

            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {tierThresholds.map((tier, i) => (
                    <div key={tier.name} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`h-2.5 w-full rounded-full overflow-hidden ${
                        i === 0 ? "rounded-s-full" : i === 2 ? "rounded-e-full" : ""
                      } bg-oat-milk`}>
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all duration-500`}
                          style={{
                            width: user.points >= tier.max && tier.name !== "Gold"
                              ? "100%"
                              : tier.name === memberTier
                                ? `${Math.min(progress, 100)}%`
                                : user.points >= tier.min
                                  ? "100%"
                                  : "0%"
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${
                        tier.name === memberTier ? "text-espresso" : "text-espresso/50"
                      }`}>{tierLabel(tier.name)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-espresso/60 font-medium mt-2 text-center">
                  {isMaxed ? (
                    <span className="text-amber-700 font-bold">{t("maxedTier")}</span>
                  ) : (
                    t.rich("tierProgress", {
                      points: user.points.toLocaleString(nf),
                      max: currentTier.max.toLocaleString(nf),
                      remaining: (currentTier.max - user.points).toLocaleString(nf),
                      next: nextTierName ? tierLabel(nextTierName) : "",
                      current: (chunks) => <span className="text-espresso font-bold tabular-nums">{chunks}</span>,
                      num: (chunks) => <span className="tabular-nums">{chunks}</span>,
                      hl: (chunks) => <span className="text-primary font-bold">{chunks}</span>,
                    })
                  )}
                </p>
              </>
            );
          })()}
        </div>
      </div>

      {/* Redeem Message */}
      {redeemMessage && (
        <div className={`mx-4 mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          redeemMessage.type === "success"
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-red-50 text-red-600 border border-red-200"
        }`}>
          {redeemMessage.text}
        </div>
      )}

      {/* Points Balance Card */}
      <div className="px-4 pb-4">
        <div className="flex flex-col gap-2 rounded-2xl p-5 bg-primary text-on-primary">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-on-primary/75 text-sm font-semibold">{t("totalPoints")}</p>
              <p className="font-display text-4xl leading-tight mt-1 tabular-nums">
                {user.points.toLocaleString(nf)}
              </p>
            </div>
            <BrandIcon name="bean" className="text-4xl opacity-60" />
          </div>
          <div className="mt-3 pt-3 border-t border-on-primary/15 flex justify-between items-center">
            <span className="text-sm font-bold">
              {t("nextRank", {
                detail:
                  memberTier === "Gold"
                    ? t("nextRankTop")
                    : memberTier === "Silver"
                      ? t("pointsToGold", { count: 2000 - user.points })
                      : t("pointsToSilver", { count: 1000 - user.points }),
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Streak */}
      <div className="px-4 py-4">
        <div className="bg-surface rounded-2xl p-4 border border-espresso/10">
          <div className="flex gap-2 justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <MaterialIcon icon="local_fire_department" className="text-crema" />
              <p className="text-base font-bold leading-normal">{t("dailyStreak")}</p>
            </div>
            <p className="text-sm font-bold tabular-nums">{t("streakDays", { current: user.dailyStreak, total: 5 })}</p>
          </div>
          <div className="h-2.5 rounded-full bg-oat-milk overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min((user.dailyStreak / 5) * 100, 100)}%` }}
            />
          </div>
          <p className="text-espresso/70 text-xs mt-3 font-medium leading-relaxed">
            {user.dailyStreak >= 5 ? (
              <span className="text-primary font-bold">{t("streakComplete")}</span>
            ) : (
              t.rich("streakRemaining", {
                count: 5 - user.dailyStreak,
                hl: (chunks) => <span className="text-primary font-bold">{chunks}</span>,
              })
            )}
          </p>
        </div>
      </div>

      {/* Active Challenges */}
      <section className="px-4 py-6">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-xl">{t("activeChallenges")}</h2>
          <Link href="/challenges" className="text-primary text-sm font-semibold">
            {tc("seeAll")}
          </Link>
        </div>
        {activeChallenges.length === 0 ? (
          <div className="bg-surface rounded-2xl p-6 border border-espresso/10 text-center">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-sm text-espresso/70 mb-4">{t("noChallenges")}</p>
            <Link href="/challenges" className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors">
              {t("browseChallenges")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeChallenges.map((ch) => {
              const userProgress = ch.users[0];
              const progress = (userProgress.currentProgress / ch.maxProgress) * 100;

              return (
                <div key={ch.id} className="flex items-center gap-4 p-4 bg-surface rounded-2xl border border-espresso/10">
                  <div className="size-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MaterialIcon icon={ch.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" dir="auto">{ch.title}</p>
                    <p className="text-xs text-espresso/60 mt-1">{t("challengeReward", { count: ch.rewardPoints })}</p>
                    <div className="mt-2 h-1.5 w-full bg-oat-milk rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <p className="text-xs font-bold tabular-nums">
                    {userProgress.currentProgress}/{ch.maxProgress}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Redeemable Rewards */}
      <section className="px-4 py-6">
        <h2 className="text-xl mb-4">{t("redeemable")}</h2>
        {rewards.length === 0 ? (
          <div className="bg-surface rounded-2xl p-6 border border-espresso/10 text-center">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-sm text-espresso/70">{t("noRewards")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {rewards.map((rw) => {
              const canRedeem = user.points >= rw.pointsCost;
              return (
                <div key={rw.id} className="bg-surface rounded-2xl overflow-hidden border border-espresso/10 flex flex-col">
                  <div
                    className="h-32 bg-cover bg-center bg-oat-milk"
                    style={rw.imageUrl ? { backgroundImage: `url('${rw.imageUrl}')` } : {}}
                  />
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-[11px] font-semibold text-primary mb-1" dir="auto">{rw.category}</p>
                    <p className="text-sm font-bold mb-3 leading-snug" dir="auto">{rw.title}</p>
                    <button
                      onClick={() => handleRedeem(rw.id, rw.pointsCost)}
                      disabled={!canRedeem || redeeming === rw.id}
                      className={`mt-auto w-full py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl transition-colors hover:bg-primary/90 ${
                        !canRedeem ? "opacity-50 cursor-not-allowed" : "active:scale-95"
                      }`}
                    >
                      {redeeming === rw.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="size-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                          {t("redeem.redeeming")}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          {t.rich("pointsCost", {
                            count: rw.pointsCost,
                            formatted: rw.pointsCost.toLocaleString(nf),
                            num: (chunks) => <span className="font-display text-base tabular-nums">{chunks}</span>,
                          })}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="h-28" />
      <BottomNav />
    </div>
  );
}
