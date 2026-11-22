"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MaterialIcon from "@/components/MaterialIcon";
import { useTranslations, useLocale } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface EventData {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  host: { id: string; name: string | null; image: string | null };
  _count: { rsvps: number };
}

export default function EventsPage() {
  const t = useTranslations("events");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
  });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate) return;
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          location: form.location || undefined,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setShowCreate(false);
        setForm({ title: "", description: "", location: "", startDate: "", endDate: "" });
        router.push(`/events/${created.id}`);
      }
    } catch {
      // network error: keep the form open so the user can retry
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(intlLocale(locale), {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-background-light text-espresso">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <h1 className="text-2xl flex-1">{t("title")}</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          aria-expanded={showCreate}
          className="bg-primary text-on-primary px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
        >
          <MaterialIcon icon={showCreate ? "close" : "add"} className="text-lg" />
          {t("createEvent")}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Create form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-6 bg-surface rounded-2xl border border-espresso/10 p-4 space-y-3"
          >
            <h2 className="text-xl mb-1">{t("newEvent")}</h2>
            <input
              type="text"
              placeholder={t("titlePlaceholder")}
              aria-label={t("titlePlaceholder")}
              dir="auto"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              placeholder={t("descriptionPlaceholder")}
              aria-label={t("descriptionLabel")}
              dir="auto"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 leading-relaxed resize-none"
              rows={3}
            />
            <input
              type="text"
              placeholder={t("locationPlaceholder")}
              aria-label={t("locationLabel")}
              dir="auto"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="event-start" className="block text-xs font-semibold text-espresso/70 mb-1.5">
                  {t("startDate")}
                </label>
                <input
                  id="event-start"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="event-end" className="block text-xs font-semibold text-espresso/70 mb-1.5">
                  {t("endDate")}
                </label>
                <input
                  id="event-end"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !form.title.trim() || !form.startDate}
              className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? t("creating") : t("createEvent")}
            </button>
          </form>
        )}

        {/* Event list */}
        {loading ? (
          <div className="flex justify-center py-12" role="status" aria-label={tc("loading")}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
            <p className="text-sm text-espresso/70">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => router.push(`/events/${event.id}`)}
                className="w-full text-start bg-surface rounded-2xl border border-espresso/10 p-4 flex items-start gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="shrink-0 w-14 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center py-2" aria-hidden>
                  <span className="font-display text-2xl leading-none">
                    {new Date(event.startDate).toLocaleDateString(intlLocale(locale), { day: "numeric" })}
                  </span>
                  <span className="text-[11px] font-semibold mt-1">
                    {new Date(event.startDate).toLocaleDateString(intlLocale(locale), { month: "short" })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 dir="auto" className="font-bold">{event.title}</h3>
                  <p className="text-xs text-primary font-semibold mt-1">{formatDate(event.startDate)}</p>
                  {event.location && (
                    <p dir="auto" className="text-sm text-espresso/70 mt-1 flex items-center gap-1">
                      <MaterialIcon icon="location_on" className="text-base shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}
                  <p className="text-xs text-espresso/60 mt-2">
                    {t("attendees", { count: event._count.rsvps })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
