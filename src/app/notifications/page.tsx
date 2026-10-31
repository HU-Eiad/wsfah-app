"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/MaterialIcon";
import BottomNav from "@/components/BottomNav";

interface Notification {
  id: string;
  type: "LIKE" | "SAVE" | "FOLLOW" | "BADGE" | "CHALLENGE" | "SYSTEM";
  title: string;
  body: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const NOTIFICATION_ICON_MAP: Record<
  Notification["type"],
  { icon: string; color: string; bg: string }
> = {
  LIKE: { icon: "favorite", color: "text-red-500", bg: "bg-red-50" },
  SAVE: { icon: "bookmark", color: "text-primary", bg: "bg-primary/10" },
  FOLLOW: { icon: "person_add", color: "text-primary", bg: "bg-primary/10" },
  BADGE: { icon: "military_tech", color: "text-crema", bg: "bg-crema/10" },
  CHALLENGE: { icon: "emoji_events", color: "text-crema", bg: "bg-crema/10" },
  SYSTEM: { icon: "info", color: "text-espresso/70", bg: "bg-oat-milk" },
};

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return `منذ ${diffSeconds} ث`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `منذ ${diffMinutes} د`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} س`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `منذ ${diffDays} ي`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `منذ ${diffMonths} شهر`;

  const diffYears = Math.floor(diffMonths / 12);
  return `منذ ${diffYears} سنة`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch {
      // Silently handle errors
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleNotificationClick(notif: Notification) {
    if (!notif.isRead) {
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        // Silently handle errors
      }
    }

    if (notif.link) {
      router.push(notif.link);
    }
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link
          href="/"
          aria-label="رجوع"
          className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk"
        >
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1 flex items-center">
          الإشعارات
          {unreadCount > 0 && (
            <span className="ms-2 inline-flex items-center justify-center min-w-6 px-2 py-0.5 text-xs font-bold font-sans bg-primary text-on-primary rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>
      </header>

      {/* Mark all as read */}
      {unreadCount > 0 && (
        <div className="px-4 pt-3 pb-1 flex justify-end max-w-screen-sm mx-auto w-full">
          <button
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <MaterialIcon icon="done_all" className="text-base" />
            {markingAllRead ? "جارٍ التحديد…" : "تحديد الكل كمقروء"}
          </button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 pb-28 max-w-screen-sm mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-espresso/60 font-medium">جارٍ تحميل الإشعارات…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
            <p className="text-sm text-espresso/70 leading-relaxed mb-5">
              لا توجد إشعارات بعد. عندما يعجب أحد بوصفتك، أو يتابعك، أو تحصل على شارة، ستراها هنا.
            </p>
            <Link
              href="/"
              className="bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              استكشف الوصفات
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-espresso/10">
            {notifications.map((notif) => {
              const meta = NOTIFICATION_ICON_MAP[notif.type];

              return (
                <li key={notif.id}>
                  <button
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-start flex items-start gap-3 px-4 py-4 transition-colors ${
                      !notif.isRead
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-oat-milk/50"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`size-10 rounded-full ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <MaterialIcon
                        icon={meta.icon}
                        className={`text-xl ${meta.color}`}
                        filled
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          dir="auto"
                          className={`text-sm leading-snug ${
                            !notif.isRead ? "font-bold" : "font-semibold"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[11px] text-espresso/60 font-medium shrink-0 mt-0.5">
                          {relativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p dir="auto" className="text-xs text-espresso/70 mt-0.5 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className="size-2 rounded-full bg-crema shrink-0 mt-2" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
