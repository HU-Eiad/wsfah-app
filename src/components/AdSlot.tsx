"use client";

import { useTranslations } from "next-intl";
import { useAds } from "./AdProvider";
import AdBanner from "./AdBanner";

interface AdSlotProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
  /** Show a placeholder when ads are disabled (e.g. for testing layout) */
  showPlaceholder?: boolean;
}

/**
 * Smart ad slot that only renders for free-tier users.
 * Wraps AdBanner with tier-based visibility logic.
 */
export default function AdSlot({
  slot,
  format = "auto",
  className = "",
  showPlaceholder = false,
}: AdSlotProps) {
  const { showAds } = useAds();
  const t = useTranslations("adSlot");

  if (!showAds) {
    if (showPlaceholder) {
      return (
        <div className={`flex items-center justify-center py-2 ${className}`}>
          <span className="text-[11px] text-espresso/50">{t("adFree")}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`my-4 ${className}`}>
      <AdBanner slot={slot} format={format} />
    </div>
  );
}
