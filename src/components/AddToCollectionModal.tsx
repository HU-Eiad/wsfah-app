"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import MaterialIcon from "@/components/MaterialIcon";

interface Collection {
  id: string;
  name: string;
  _count: { recipes: number };
}

interface AddToCollectionModalProps {
  recipeId: string;
  onClose: () => void;
}

export default function AddToCollectionModal({ recipeId, onClose }: AddToCollectionModalProps) {
  const t = useTranslations("addToCollectionModal");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/collections");
        if (!res.ok) throw new Error("Failed to fetch collections");
        const data: Collection[] = await res.json();
        if (cancelled) return;
        setCollections(data);
        // Find which collections already contain this recipe (read-only GET;
        // the old POST "check" added the recipe to every collection).
        const results = await Promise.all(
          data.map((col) =>
            fetch(`/api/collections/${col.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((c: { recipes?: { recipeId: string }[] } | null) =>
                !!c?.recipes?.some((cr) => cr.recipeId === recipeId)
              )
              .catch(() => false)
          )
        );
        if (cancelled) return;
        setSelectedIds(new Set(data.filter((_, i) => results[i]).map((col) => col.id)));
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const handleToggle = async (collectionId: string, isSelected: boolean) => {
    try {
      setUpdating((prev) => new Set(prev).add(collectionId));
      const res = await fetch(`/api/collections/${collectionId}/recipes`, {
        method: isSelected ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      if (!res.ok) throw new Error("Failed to update collection");
      if (isSelected) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      } else {
        setSelectedIds((prev) => new Set(prev).add(collectionId));
      }
    } catch (error) {
      console.error("Error toggling collection:", error);
      alert(t("updateError"));
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          isPublic: newIsPublic,
        }),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      const newCollection = await res.json();
      setCollections((prev) => [newCollection, ...prev]);
      // Add recipe to new collection
      await handleToggle(newCollection.id, false);
      setNewName("");
      setNewDescription("");
      setNewIsPublic(false);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating collection:", error);
      alert(t("createError"));
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50">
      <div className="bg-surface text-espresso rounded-t-3xl sm:rounded-2xl shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-espresso/10">
          <h2 className="font-display text-xl">{t("title")}</h2>
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="flex items-center justify-center rounded-full size-10 hover:bg-oat-milk"
          >
            <MaterialIcon icon="close" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-6">
              <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
              <p className="text-sm text-espresso/70 mb-4">{t("empty")}</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                {t("createFirst")}
              </button>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-espresso/10 divide-y divide-espresso/10 max-h-60 overflow-y-auto">
              {collections.map((collection) => {
                const isSelected = selectedIds.has(collection.id);
                const isUpdating = updating.has(collection.id);
                return (
                  <label
                    key={collection.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-oat-milk/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggle(collection.id, e.target.checked)}
                      disabled={isUpdating}
                      className="size-5 rounded accent-primary cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate" dir="auto">
                        {collection.name}
                      </span>
                      <span className="text-xs text-espresso/60">
                        {t("recipeCount", { count: collection._count.recipes })}
                      </span>
                    </div>
                    {isUpdating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {/* Create New Collection Form */}
          {showCreateForm && (
            <div className="mt-5 pt-5 border-t border-espresso/10">
              <h3 className="font-bold text-sm mb-3">{t("createNew")}</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <input
                    type="text"
                    dir="auto"
                    aria-label={t("namePlaceholder")}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    className={inputClass}
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <textarea
                    dir="auto"
                    aria-label={t("descriptionPlaceholder")}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={t("descriptionPlaceholder")}
                    className={`${inputClass} leading-relaxed resize-none`}
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newIsPublic"
                    checked={newIsPublic}
                    onChange={(e) => setNewIsPublic(e.target.checked)}
                    className="size-4 rounded accent-primary"
                  />
                  <label htmlFor="newIsPublic" className="text-sm">
                    {t("makePublic")}
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? t("creating") : t("createAndAdd")}
                </button>
              </form>
            </div>
          )}

          {!showCreateForm && collections.length > 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full mt-4 flex items-center justify-center gap-1.5 border border-espresso/15 rounded-xl px-5 py-3 font-semibold text-sm text-primary hover:border-primary/40 transition-colors"
            >
              <MaterialIcon icon="add" className="text-lg" />
              {t("createNew")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
