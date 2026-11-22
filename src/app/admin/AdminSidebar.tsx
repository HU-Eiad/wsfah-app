"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

const navItems = [
  { key: "dashboard", href: "/admin", icon: "dashboard" },
  { key: "users", href: "/admin/users", icon: "group" },
  { key: "brands", href: "/admin/brands", icon: "storefront" },
  { key: "recipes", href: "/admin/recipes", icon: "restaurant_menu" },
  { key: "moderation", href: "/admin/moderation", icon: "shield" },
  { key: "verification", href: "/admin/verification", icon: "verified" },
  { key: "analytics", href: "/admin/analytics", icon: "analytics" },
  { key: "subscriptions", href: "/admin/subscriptions", icon: "credit_card" },
  { key: "challenges", href: "/admin/challenges", icon: "emoji_events" },
  { key: "rewards", href: "/admin/rewards", icon: "redeem" },
  { key: "promotions", href: "/admin/promotions", icon: "campaign" },
  { key: "ads", href: "/admin/ads", icon: "ads_click" },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useTranslations("adminSidebar");
  const tc = useTranslations("common");

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: "#16261d", borderBottom: "1px solid rgba(143, 191, 154, 0.1)" }}>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined" style={{ color: "#eef0e8" }}>
            {open ? "close" : "menu"}
          </span>
        </button>
        <h1 className="text-lg" style={{ color: "#eef0e8" }}>
          {tc("appName")} <span style={{ color: "#8fbf9a" }}>{t("admin")}</span>
        </h1>
        <Link href="/home" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined" style={{ color: "#eef0e8" }}>home</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 w-64 h-screen flex flex-col z-50 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#16261d" }}
      >
        {/* Logo */}
        <div className="p-6" style={{ borderBottom: "1px solid rgba(143, 191, 154, 0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(143, 191, 154, 0.15)" }}>
              <span className="material-symbols-outlined text-xl" style={{ color: "#8fbf9a" }}>coffee</span>
            </div>
            <div>
              <h1 className="text-lg" style={{ color: "#eef0e8" }}>
                {tc("appName")} <span style={{ color: "#8fbf9a" }}>{t("admin")}</span>
              </h1>
              <p className="text-[11px]" style={{ color: "rgba(238, 240, 232, 0.55)" }}>{t("panel")}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isActive ? {
                  backgroundColor: "rgba(143, 191, 154, 0.12)",
                  color: "#8fbf9a",
                  boxShadow: "0 0 20px rgba(143, 191, 154, 0.05)",
                } : {
                  color: "rgba(238, 240, 232, 0.5)",
                }}
              >
                <span className="material-symbols-outlined text-xl" style={isActive ? { color: "#8fbf9a" } : {}}>
                  {item.icon}
                </span>
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(143, 191, 154, 0.08)" }}>
          <Link
            href="/home"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ color: "rgba(238, 240, 232, 0.5)" }}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            {t("backToApp")}
          </Link>
        </div>
      </aside>
    </>
  );
}
