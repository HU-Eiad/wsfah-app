"use client";

import { useState } from "react";
import MaterialIcon from "./MaterialIcon";

interface ShareButtonProps {
  url: string;
  title: string;
  className?: string;
}

export default function ShareButton({ url, title, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${url.startsWith("/") ? url : "/" + url}`
      : url;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // User cancelled or share not supported — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Final fallback for HTTP contexts
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label={copied ? "تم نسخ الرابط" : "مشاركة"}
      className={className || "text-primary border border-espresso/15 px-4 py-3 rounded-xl relative hover:border-primary/40 transition-colors"}
    >
      <MaterialIcon icon={copied ? "check" : "share"} className="block" />
      {copied && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-espresso text-background-light text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap">
          تم النسخ!
        </span>
      )}
    </button>
  );
}
