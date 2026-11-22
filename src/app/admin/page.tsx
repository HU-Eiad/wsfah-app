"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface Stats {
  totalUsers: number;
  totalRecipes: number;
  totalBrands: number;
  totalPoints: number;
  recentUsers: { id: string; name: string | null; email: string | null; createdAt: string }[];
}

const STAT_ICONS = ["group", "restaurant_menu", "storefront", "stars"];
const STAT_COLORS = ["#8fbf9a", "#c98a3d", "#2D7D7D", "#8B5CF6"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("adminDashboard");
  const ta = useTranslations("admin");
  const locale = intlLocale(useLocale());

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl animate-spin" style={{ color: "#8fbf9a" }}>coffee</span>
          <p className="text-sm font-medium" style={{ color: "rgba(238, 240, 232, 0.6)" }}>{ta("loading")}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-red-500">{t("loadFailed")}</p>;
  }

  const cards = [
    { label: t("users"), value: stats.totalUsers },
    { label: t("recipes"), value: stats.totalRecipes },
    { label: t("brands"), value: stats.totalBrands },
    { label: t("points"), value: stats.totalPoints },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl" style={{ color: "#eef0e8" }}>{t("title")}</h2>
        <p className="text-sm mt-1" style={{ color: "rgba(238, 240, 232, 0.5)" }}>{t("subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="rounded-2xl p-4 lg:p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform"
            style={{
              backgroundColor: "#16261d",
              border: `1px solid ${STAT_COLORS[i]}20`,
            }}
          >
            {/* Background glow */}
            <div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-xl"
              style={{ backgroundColor: STAT_COLORS[i] }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg" style={{ color: STAT_COLORS[i] }}>
                  {STAT_ICONS[i]}
                </span>
                <p className="text-[11px] lg:text-xs font-bold" style={{ color: "rgba(238, 240, 232, 0.6)" }}>
                  {card.label}
                </p>
              </div>
              <p className="text-2xl lg:text-4xl font-display" style={{ color: "#eef0e8" }}>
                {card.value.toLocaleString("en-US")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#16261d", border: "1px solid rgba(143, 191, 154, 0.06)" }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(143, 191, 154, 0.06)" }}>
          <span className="material-symbols-outlined text-lg" style={{ color: "#8fbf9a" }}>person_add</span>
          <h3 className="font-bold" style={{ color: "#eef0e8" }}>{t("recentSignups")}</h3>
        </div>
        <div>
          {stats.recentUsers.map((user, i) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              style={i < stats.recentUsers.length - 1 ? { borderBottom: "1px solid rgba(238, 240, 232, 0.04)" } : {}}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(143, 191, 154, 0.1)" }}>
                  <span className="font-bold text-sm" style={{ color: "#8fbf9a" }}>
                    {(user.name || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#eef0e8" }}>
                    {user.name || ta("noName")}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "rgba(238, 240, 232, 0.5)" }}>{user.email || "—"}</p>
                </div>
              </div>
              <p className="text-[11px] shrink-0" style={{ color: "rgba(238, 240, 232, 0.5)" }}>
                {new Date(user.createdAt).toLocaleDateString(locale)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
