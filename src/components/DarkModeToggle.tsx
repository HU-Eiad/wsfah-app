"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import MaterialIcon from "./MaterialIcon";

// The `dark` class on <html> (set before first paint by the inline script in
// the root layout) is the source of truth; watch it as an external store.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const getSnapshot = () => document.documentElement.classList.contains("dark");
// Unknown on the server: render the neutral state, then the real one after hydration.
const getServerSnapshot = (): boolean | null => null;

export default function DarkModeToggle() {
  const t = useTranslations("darkModeToggle");
  const dark = useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);
  const mounted = dark !== null;

  const toggle = () => {
    const next = !dark;
    try {
      localStorage.setItem("wsfa-dark", next ? "true" : "false");
    } catch {}
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Prevent hydration mismatch - show neutral state until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-between gap-3 w-full px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="size-9 rounded-full bg-oat-milk flex items-center justify-center text-espresso/70">
            <MaterialIcon icon="light_mode" className="text-xl" />
          </span>
          <span className="text-sm font-semibold">{t("label")}</span>
        </div>
        <div className="w-11 h-6 rounded-full bg-oat-milk relative shrink-0">
          <div className="absolute top-0.5 start-0.5 size-5 rounded-full shadow-sm bg-surface" />
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      className="flex items-center justify-between gap-3 w-full px-4 py-3.5 text-start hover:bg-oat-milk/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="size-9 rounded-full bg-oat-milk flex items-center justify-center text-espresso/70">
          <MaterialIcon icon={dark ? "dark_mode" : "light_mode"} className="text-xl" />
        </span>
        <span className="text-sm font-semibold">{t("label")}</span>
      </div>
      <div className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${dark ? "bg-primary" : "bg-oat-milk"}`}>
        <div
          className={`absolute top-0.5 start-0.5 size-5 rounded-full shadow-sm bg-surface transition-transform ${
            dark ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}
