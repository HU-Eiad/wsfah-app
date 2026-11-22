"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import ActivityCard from "@/components/ActivityCard";
import AdSlot from "@/components/AdSlot";
import BottomNav from "@/components/BottomNav";
import { useTranslations } from "next-intl";

interface Activity {
  id: string;
  userId: string;
  type: string;
  entityId: string | null;
  entityType: string | null;
  metadata: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function FeedPage() {
  const t = useTranslations("feed");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchFeed = async (cursor?: string) => {
    try {
      const url = cursor ? `/api/feed?cursor=${cursor}` : "/api/feed";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch feed");
      const data = await res.json();
      if (cursor) {
        setActivities((prev) => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchFeed(nextCursor);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <h1 className="text-2xl flex-1">{t("title")}</h1>
      </header>

      {/* Feed */}
      <div className="p-4">
        {activities.length === 0 ? (
          <div className="text-center py-16">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-espresso/70 font-semibold mb-1">{t("emptyTitle")}</p>
            <p className="text-sm text-espresso/60 leading-relaxed">
              {t("emptyBody")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={activity.id}>
                <ActivityCard activity={activity} />
                {/* Show ad after every 3rd activity */}
                {(i + 1) % 3 === 0 && i < activities.length - 1 && (
                  <AdSlot slot={`feed-${Math.floor(i / 3)}`} format="horizontal" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {nextCursor && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              className="px-5 py-3 border border-espresso/15 rounded-xl font-semibold text-sm hover:border-primary/40 transition-colors"
            >
              {t("loadMore")}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
