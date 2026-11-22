"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import MaterialIcon from "@/components/MaterialIcon";
import { useTranslations } from "next-intl";

interface Group {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPublic: boolean;
  _count: { members: number };
}

export default function GroupsPage() {
  const t = useTranslations("groups");
  const tc = useTranslations("common");
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", isPublic: true });
  const [creating, setCreating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // One effect for the initial load, debounced search and reloads. Stale
  // requests are aborted so an older response can never overwrite a newer one.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = search ? `?search=${encodeURIComponent(search)}` : "";
        const res = await fetch(`/api/groups${params}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted && Array.isArray(data)) setGroups(data);
        }
      } catch {
        // aborted or network error: keep the current list
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search ? 300 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, reloadKey]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: "", description: "", isPublic: true });
        setReloadKey((k) => k + 1);
      }
    } catch {
      // network error: keep the form open so the user can retry
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(groupId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, { method: "POST" });
      if (res.ok || res.status === 409) {
        window.location.href = `/groups/${groupId}`;
      }
    } catch {
      // network error: stay on the list
    }
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
          {t("createGroup")}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Create form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-6 bg-surface rounded-2xl border border-espresso/10 p-4 space-y-3"
          >
            <h2 className="text-xl mb-1">{t("newGroup")}</h2>
            <input
              type="text"
              placeholder={t("namePlaceholder")}
              aria-label={t("namePlaceholder")}
              dir="auto"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <textarea
              placeholder={t("descriptionPlaceholder")}
              aria-label={t("descriptionLabel")}
              dir="auto"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm leading-relaxed placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                id="isPublic"
                className="size-4 accent-primary"
              />
              <label htmlFor="isPublic" className="text-sm text-espresso/70">
                {t("publicGroup")}
              </label>
            </div>
            <button
              type="submit"
              disabled={creating || !form.name.trim()}
              className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? t("creating") : t("create")}
            </button>
          </form>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <MaterialIcon icon="search" className="absolute start-4 top-1/2 -translate-y-1/2 text-espresso/50 pointer-events-none" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-espresso/15 rounded-xl ps-12 pe-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12" role="status" aria-label={tc("loading")}>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-sm text-espresso/70">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div
                key={g.id}
                className="bg-surface rounded-2xl border border-espresso/10 p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 dir="auto" className="font-bold">{g.name}</h3>
                  {g.description && (
                    <p dir="auto" className="text-sm text-espresso/70 leading-relaxed mt-1 line-clamp-2">
                      {g.description}
                    </p>
                  )}
                  <p className="text-xs text-espresso/60 mt-2 flex items-center gap-1">
                    <MaterialIcon icon="group" className="text-sm" />
                    {t("members", { count: g._count.members })}
                  </p>
                </div>
                <button
                  onClick={() => handleJoin(g.id)}
                  className="shrink-0 border border-espresso/15 text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:border-primary/40 transition-colors"
                >
                  {t("join")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
