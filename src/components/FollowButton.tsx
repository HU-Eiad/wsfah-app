"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export default function FollowButton({ userId, className = "" }: FollowButtonProps) {
  const t = useTranslations("followButton");
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/follow?userId=${userId}`)
      .then((r) => r.json())
      .then((d) => setIsFollowing(d.following))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`py-3 rounded-xl text-sm border transition-colors disabled:opacity-50 ${
        isFollowing
          ? "border-espresso/15 text-espresso font-semibold hover:border-primary/40"
          : "bg-primary text-on-primary border-transparent font-bold hover:bg-primary/90"
      } ${className}`}
    >
      {loading ? "…" : isFollowing ? t("following") : t("follow")}
    </button>
  );
}
