"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import { useTranslations, useLocale } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  host: { id: string; name: string | null; image: string | null };
  _count: { rsvps: number };
  userRsvp: string | null;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("eventsDetail");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.ok) {
        setEvent(await res.json());
      }
    } catch {
      // leave event null: the not-found state shows
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  async function handleRsvp(status: "GOING" | "INTERESTED") {
    setRsvpLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                userRsvp: data.rsvp,
                _count: {
                  ...prev._count,
                  rsvps: data.rsvp
                    ? prev.userRsvp
                      ? prev._count.rsvps
                      : prev._count.rsvps + 1
                    : prev._count.rsvps - 1,
                },
              }
            : prev
        );
      }
    } catch {
      // network error: RSVP unchanged
    } finally {
      setRsvpLoading(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(intlLocale(locale), {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center" role="status" aria-label={tc("loading")}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background-light text-espresso flex items-center justify-center p-6">
        <div className="text-center">
          <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
          <p className="text-sm text-espresso/70">{t("notFound")}</p>
          <Link href="/events" className="inline-block mt-4 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors">
            {t("allEvents")}
          </Link>
        </div>
      </div>
    );
  }

  const start = new Date(event.startDate);

  return (
    <div className="min-h-screen bg-background-light text-espresso">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/events" aria-label={tc("back")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-64 object-cover rounded-[20px] mb-6"
          />
        )}

        <div className="flex items-start gap-4">
          <div className="shrink-0 w-16 rounded-2xl bg-primary/10 text-primary flex flex-col items-center justify-center py-2.5" aria-hidden>
            <span className="font-display text-3xl leading-none">
              {start.toLocaleDateString(intlLocale(locale), { day: "numeric" })}
            </span>
            <span className="text-xs font-semibold mt-1">
              {start.toLocaleDateString(intlLocale(locale), { month: "short" })}
            </span>
          </div>
          <h2 dir="auto" className="text-2xl leading-snug flex-1 pt-1">{event.title}</h2>
        </div>

        <div className="mt-5 bg-surface rounded-2xl border border-espresso/10 p-4 space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <MaterialIcon icon="schedule" className="text-xl text-primary shrink-0" />
            <div>
              <p className="font-semibold">{formatDate(event.startDate)}</p>
              {event.endDate && (
                <p className="text-xs text-espresso/60 mt-0.5">
                  {t("until", { date: formatDate(event.endDate) })}
                </p>
              )}
            </div>
          </div>
          {event.location && (
            <div className="flex items-start gap-3">
              <MaterialIcon icon="location_on" className="text-xl text-primary shrink-0" />
              <p dir="auto" className="text-espresso/70">{event.location}</p>
            </div>
          )}
          <div className="flex items-start gap-3">
            <MaterialIcon icon="person" className="text-xl text-primary shrink-0" />
            <p className="text-espresso/70">
              {t.rich("hostedBy", { name: event.host.name || t("unknown"), host: (chunks) => <span dir="auto" className="font-semibold text-espresso">{chunks}</span> })}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <MaterialIcon icon="group" className="text-xl text-primary shrink-0" />
            <p className="text-espresso/70">
              {t("attendees", { count: event._count.rsvps })}
            </p>
          </div>
        </div>

        {event.description && (
          <section className="mt-6">
            <h2 className="text-xl mb-3">{t("about")}</h2>
            <p dir="auto" className="text-sm text-espresso/70 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        )}

        {/* RSVP buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => handleRsvp("GOING")}
            disabled={rsvpLoading}
            className={`px-5 py-3 rounded-xl text-sm border transition-colors disabled:opacity-50 ${
              event.userRsvp === "GOING"
                ? "bg-primary text-on-primary border-transparent font-bold hover:bg-primary/90"
                : "border-espresso/15 font-semibold hover:border-primary/40"
            }`}
          >
            {event.userRsvp === "GOING" ? t("going") : t("going")}
          </button>
          <button
            onClick={() => handleRsvp("INTERESTED")}
            disabled={rsvpLoading}
            className={`px-5 py-3 rounded-xl text-sm border transition-colors disabled:opacity-50 ${
              event.userRsvp === "INTERESTED"
                ? "bg-primary text-on-primary border-transparent font-bold hover:bg-primary/90"
                : "border-espresso/15 font-semibold hover:border-primary/40"
            }`}
          >
            {t("interested")}
          </button>
          {event.userRsvp && (
            <button
              onClick={() => handleRsvp(event.userRsvp as "GOING" | "INTERESTED")}
              disabled={rsvpLoading}
              className="px-5 py-3 rounded-xl text-sm border transition-colors disabled:opacity-50 border-red-600/40 text-red-600 font-semibold hover:bg-red-50"
            >
              {t("cancelRsvp")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
