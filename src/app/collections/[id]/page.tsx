"use client";

import SafeImage from "@/components/SafeImage";
import Image from "next/image";
import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MaterialIcon from "@/components/MaterialIcon";
import BottomNav from "@/components/BottomNav";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  recipes: Array<{
    id: string;
    addedAt: string;
    recipe: {
      id: string;
      title: string;
      imageUrl: string | null;
      category: string;
      difficulty: string;
      rating: number;
      likes: number;
      author: {
        id: string;
        name: string | null;
        image: string | null;
      };
    };
  }>;
}

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("collectionDetail");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const fetchCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) throw new Error("Failed to fetch collection");
      const data = await res.json();
      setCollection(data);
      setName(data.name);
      setDescription(data.description || "");
      setIsPublic(data.isPublic);
    } catch (error) {
      console.error("Error fetching collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.id);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchCollection();
    fetchCurrentUser();
  }, [id]);

  const isOwner = currentUserId && collection?.userId === currentUserId;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setEditing(true);
      const res = await fetch(`/api/collections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPublic }),
      });
      if (!res.ok) throw new Error("Failed to update collection");
      await fetchCollection();
      setShowEditForm(false);
    } catch (error) {
      console.error("Error updating collection:", error);
      alert(t("updateError"));
    } finally {
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
          <p className="text-sm text-espresso/70 mb-4">{t("notFound")}</p>
          <Link href="/collections" className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors">{t("backToCollections")}</Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="bg-background-light text-espresso min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/collections" aria-label={t("back")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk shrink-0">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1 truncate" dir="auto">
          {collection.name}
        </h1>
        {isOwner && (
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            aria-label={t("editCollection")}
            className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk shrink-0"
          >
            <MaterialIcon icon="edit" />
          </button>
        )}
      </header>

      <div className="max-w-5xl mx-auto">
        {/* Edit Form */}
        {showEditForm && isOwner && (
          <div className="p-4">
            <form onSubmit={handleUpdate} className="bg-surface rounded-2xl border border-espresso/10 p-4 space-y-4">
              <div>
                <label htmlFor="collection-name" className="block text-xs font-semibold text-espresso/70 mb-2">{t("nameLabel")}</label>
                <input
                  id="collection-name"
                  type="text"
                  dir="auto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
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
                  className={`${inputClass} leading-relaxed resize-none`}
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
                  disabled={editing || !name.trim()}
                  className="flex-1 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? t("saving") : t("saveChanges")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  disabled={editing}
                  className="border border-espresso/15 rounded-xl px-5 py-3 font-semibold text-sm hover:border-primary/40 transition-colors disabled:opacity-50"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collection Info */}
        <div className="p-4">
          {collection.description && (
            <p className="text-sm text-espresso/70 leading-relaxed mb-4" dir="auto">
              {collection.description}
            </p>
          )}

          {/* Public/Private Badge */}
          <div className="flex items-center gap-2 mb-6">
            {collection.isPublic ? (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">
                <MaterialIcon icon="public" className="text-xs" />
                {t("publicCollection")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-oat-milk text-espresso/70 px-3 py-1.5 rounded-full text-xs font-bold">
                <MaterialIcon icon="lock" className="text-xs" />
                {t("privateCollection")}
              </span>
            )}
            <span className="text-xs text-espresso/60">
              {t("recipeCount", { count: collection.recipes.length })}
            </span>
          </div>

          {/* Recipes Grid */}
          {collection.recipes.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
              <p className="text-sm text-espresso/70 leading-relaxed">
                {t("empty")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
              {collection.recipes.map(({ recipe }) => (
                <Link
                  key={recipe.id}
                  href={`/recipe/${recipe.id}`}
                  className="flex flex-col gap-3"
                >
                  <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-pine">
                    <SafeImage
                      src={recipe.imageUrl || "/brand/banners/recipe-placeholder.svg"}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2" dir="auto">
                      {recipe.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-espresso/60">
                      <span dir="auto">{recipe.category}</span>
                      <span aria-hidden>•</span>
                      <span dir="auto">{recipe.difficulty}</span>
                      <span aria-hidden>•</span>
                      <span className="flex items-center gap-0.5">
                        <MaterialIcon icon="star" className="text-[11px] text-crema" filled />
                        {recipe.rating > 0 ? recipe.rating.toFixed(1) : t("noRating")}
                      </span>
                      <span aria-hidden>•</span>
                      <span className="flex items-center gap-0.5">
                        <MaterialIcon icon="favorite" className="text-[11px] text-red-500" filled />
                        {recipe.likes}
                      </span>
                    </div>
                  </div>
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
