interface BrandIconProps {
  /** File name in public/brand/icons without extension, e.g. "cat-matcha". */
  name: string;
  className?: string;
  /** Accessible name; omit for decorative icons. */
  label?: string;
}

/**
 * WSFA's own line icons. Rendered as a CSS mask so they take the current
 * text colour (and therefore follow dark mode) like MaterialIcon does.
 */
export default function BrandIcon({ name, className = "", label }: BrandIconProps) {
  return (
    <span
      className={`wsfa-icon ${className}`}
      style={{ "--icon": `url(/brand/icons/${name}.svg)` } as React.CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

/** Category slug → brand icon, falling back to null so callers keep MaterialIcon. */
export const CATEGORY_ICONS: Record<string, string> = {
  "pour-over": "cat-pour-over",
  "cold-brew": "cat-cold-brew",
  espresso: "cat-espresso",
  matcha: "cat-matcha",
  tea: "cat-tea",
};
