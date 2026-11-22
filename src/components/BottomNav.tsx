"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import BrandIcon from "./BrandIcon";

const navItems = [
  { href: "/home", icon: "nav-home", key: "home", isFab: false },
  { href: "/search", icon: "nav-search", key: "search", isFab: false },
  { href: "/create", icon: "nav-create", key: "create", isFab: true },
  { href: "/rewards", icon: "nav-rewards", key: "rewards", isFab: false },
  { href: "/explore", icon: "nav-explore", key: "explore", isFab: false },
];

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("common.nav");

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-(--app-width) glass-bar border-t border-espresso/10 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-end justify-around z-40">
      {navItems.map((item) => {
        const active = isActive(item.href);

        if (item.isFab) {
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 -mt-7">
              <span className="size-14 rounded-2xl bg-primary text-on-primary shadow-[0_10px_24px_-10px_rgba(20,53,36,0.7)] flex items-center justify-center active:scale-95 transition-transform">
                <BrandIcon name={item.icon} className="text-[28px]" />
              </span>
              <span className="text-[11px] font-semibold text-espresso/70">{t(item.key)}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-1 min-w-14 pt-2 ${active ? "text-primary" : "text-espresso/55"}`}
          >
            <span
              className={`absolute top-0 h-0.5 w-6 rounded-full bg-primary transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
              aria-hidden
            />
            <BrandIcon name={item.icon} className="text-2xl" />
            <span className={`text-[11px] ${active ? "font-bold" : "font-medium"}`}>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
