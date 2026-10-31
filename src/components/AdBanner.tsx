"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: string; // Google AdSense ad slot ID
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
  label?: string; // e.g. "إعلان"
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
  label = "إعلان",
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded or blocked
    }
  }, []);

  return (
    <div className={`ad-container bg-surface border border-espresso/10 rounded-2xl p-3 ${className}`}>
      <p className="text-[11px] text-espresso/60 mb-2 font-semibold">
        {label}
      </p>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-XXXXXXXXXXXXXXXX"}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
