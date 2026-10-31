"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MaterialIcon from "@/components/MaterialIcon";
import BottomNav from "@/components/BottomNav";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  _count: { recipes: number };
}

export default function CollectionsPage() {
  const t = useTranslations("collections");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Failed to fetch collections");
      const data = await res.json();
      setCollections(data);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPublic }),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      await fetchCollections();
      setName("");
      setDescription("");
      setIsPublic(false);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating collection:", error);
      alert(t("createError"));
    } finally {
      setCreating(false);
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
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 bg-primary text-on-primary rounded-xl px-4 py-2.5 font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          <MaterialIcon icon="add" className="text-lg" />
          {t("create")}
        </button>
      </header>

      <div className="max-w-5xl mx-auto">
        {/* Create Collection Form */}
        {showCreateForm && (
          <div className="p-4">
            <form onSubmit={handleCreate} className="bg-surface rounded-2xl border border-espresso/10 p-4 space-y-4">
              <div>
                <label htmlFor="collection-name" className="block text-xs font-semibold text-espresso/70 mb-2">{t("nameLabel")}</label>
                <input
                  id="collection-name"
                  type="text"
                  dir="auto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label htmlFor="collection-description" className="block text-xs font-semibold text-espresso/70 mb-2">{t("descriptionLabel")}</label>
                <textarea
                  id="collection-description"
                  dir="auto"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm leading-relaxed placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="size-4 rounded accent-primary"
                />
                <label htmlFor="isPublic" className="text-sm">
                  {t("makePublic")}
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="flex-1 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? t("creating") : t("createCollection")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                  className="border border-espresso/15 rounded-xl px-5 py-3 font-semibold text-sm hover:border-primary/40 transition-colors disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collections Grid */}
        <div className="p-4">
          {collections.length === 0 ? (
            <div className="text-center py-12 px-6">
              <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
              <p className="text-sm text-espresso/70 leading-relaxed">
                {t("empty")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="flex items-start gap-3 bg-surface rounded-2xl p-4 border border-espresso/10 hover:border-primary/40 transition-colors"
                >
                  <span className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MaterialIcon icon="collections_bookmark" className="text-xl" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-base truncate flex-1" dir="auto">
                        {collection.name}
                      </h3>
                      {collection.isPublic && (
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0">
                          <MaterialIcon icon="public" className="text-[11px]" />
                          {t("public")}
                        </span>
                      )}
                    </div>
                    {collection.description && (
                      <p className="text-sm text-espresso/70 leading-relaxed mb-2 line-clamp-2" dir="auto">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-xs text-espresso/60">{t("recipeCount", { count: collection._count.recipes })}</p>
                  </div>
                  <MaterialIcon icon="chevron_left" className="text-espresso/50 self-center shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
