"use client";

interface MaterialIconProps {
  icon: string;
  className?: string;
  filled?: boolean;
}

// Arrows and chevrons are written for RTL (Arabic is the default); mirror them
// in left-to-right languages. Media controls (play, fast_forward) are not mirrored.
const DIRECTIONAL = new Set([
  "arrow_forward",
  "arrow_back",
  "arrow_forward_ios",
  "arrow_back_ios",
  "chevron_left",
  "chevron_right",
  "navigate_next",
  "navigate_before",
]);

export default function MaterialIcon({ icon, className = "", filled = false }: MaterialIconProps) {
  const mirror = DIRECTIONAL.has(icon) ? "ltr:-scale-x-100" : "";
  return (
    <span
      className={`material-symbols-outlined ${mirror} ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden
    >
      {icon}
    </span>
  );
}
