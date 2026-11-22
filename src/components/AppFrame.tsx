"use client";

import { usePathname } from "next/navigation";

// Pages designed for wide screens. Everything else is a phone-first app screen.
const FULL_WIDTH = ["/admin", "/privacy", "/terms", "/refund-policy", "/desktop-only"];

/**
 * App screens are laid out for phones. On wide screens they are shown in a
 * centred column (width set by --app-width in globals.css, shared with
 * BottomNav) instead of being stretched across the whole window.
 */
export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const fullWidth =
    pathname === "/" || FULL_WIDTH.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (fullWidth) return <>{children}</>;
  return <div className="app-frame">{children}</div>;
}
