"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MaterialIcon from "./MaterialIcon";
import BrandIcon from "./BrandIcon";
import Image from "next/image";
import SafeImage from "./SafeImage";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  externalUrl: string | null;
};

type Recipe = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  rating: number;
  author: { name: string | null };
};

type GalleryPost = {
  id: string;
  imageUrl: string | null;
  mediaType?: string;
  caption: string | null;
  body?: string | null;
  status?: string;
  author: { name: string | null; image: string | null };
};

type TabKey = "store" | "recipes" | "gallery";

const tabs: { key: TabKey; icon: string }[] = [
  { key: "store", icon: "storefront" },
  { key: "recipes", icon: "menu_book" },
  { key: "gallery", icon: "photo_library" },
];

interface BrandTabsProps {
  products: Product[];
  recipes: Recipe[];
  galleryPosts: GalleryPost[];
  isOwner?: boolean;
  companyId?: string;
}

export default function BrandTabs({ products, recipes, galleryPosts, isOwner, companyId }: BrandTabsProps) {
  const t = useTranslations("brandTabs");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState<TabKey>("store");
  const [localProducts, setLocalProducts] = useState(products);
  const [localGallery, setLocalGallery] = useState(galleryPosts);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [galleryCaption, setGalleryCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p.id);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditUrl(p.externalUrl || "");
  };

  const handleSaveProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, price: editPrice, externalUrl: editUrl }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLocalProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      setEditingProduct(null);
    }
  };

  const handleGalleryUpload = async (file: File) => {
    if (!companyId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) return;
      const { url } = await uploadRes.json();

      const isVideo = file.type.startsWith("video/");
      const postRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, mediaType: isVideo ? "video" : "image", caption: galleryCaption || null, companyId }),
      });
      if (postRes.ok) {
        const newPost = await postRes.json();
        setLocalGallery((prev) => [{ id: newPost.id, imageUrl: newPost.imageUrl, caption: newPost.caption, author: newPost.author }, ...prev]);
        setGalleryCaption("");
      }
    } finally {
      setUploading(false);
    }
  };

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="mt-6">
      {/* Tab Headers */}
      <div className="flex border-b border-espresso/10 px-4" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3.5 text-sm border-b-2 -mb-px transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.key
                ? "border-primary text-primary font-bold"
                : "border-transparent text-espresso/60 font-medium hover:text-espresso"
            }`}
          >
            <MaterialIcon icon={tab.icon} className="text-base" />
            {t(`tabs.${tab.key}`)}
          </button>
        ))}
      </div>

      {/* Store Tab */}
      {activeTab === "store" && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-4">
          {localProducts.length === 0 ? (
            <div className="col-span-2 text-center py-10">
              <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
              <p className="text-sm text-espresso/70">{t("emptyProducts")}</p>
            </div>
          ) : (
            localProducts.map((p) => (
              <div key={p.id} className="space-y-2">
                {editingProduct === p.id && isOwner ? (
                  <div className="bg-surface rounded-2xl border border-espresso/10 p-3 space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`${inputClass} font-bold`}
                      placeholder={t("productName")}
                      aria-label={t("productName")}
                      dir="auto"
                    />
                    <input
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className={inputClass}
                      placeholder={t("price")}
                      aria-label={t("price")}
                      inputMode="decimal"
                    />
                    <input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className={inputClass}
                      placeholder={t("storeUrlPlaceholder")}
                      aria-label={t("storeUrl")}
                      dir="ltr"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveProduct(p.id)} className="flex-1 bg-primary text-on-primary text-sm font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                        {tc("save")}
                      </button>
                      <button onClick={() => setEditingProduct(null)} className="flex-1 border border-espresso/15 text-sm font-semibold py-2.5 rounded-xl hover:border-primary/40 transition-colors">
                        {tc("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="aspect-[4/5] rounded-[20px] bg-oat-milk overflow-hidden relative">
                      <SafeImage
                        fill
                        sizes="(max-width: 768px) 50vw, 360px"
                        className="object-cover"
                        src={p.imageUrl || "/brand/banners/recipe-placeholder.svg"}
                        fallbackSrc="/brand/banners/recipe-placeholder.svg"
                        alt={p.name}
                      />
                      {p.externalUrl ? (
                        <a
                          href={p.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("buyFromStore")}
                          className="absolute bottom-2 end-2 size-10 bg-surface/90 rounded-full flex items-center justify-center"
                        >
                          <MaterialIcon icon="shopping_cart" className="text-primary text-xl" />
                        </a>
                      ) : (
                        <div className="absolute bottom-2 end-2 size-10 bg-surface/90 rounded-full flex items-center justify-center opacity-50">
                          <MaterialIcon icon="shopping_cart" className="text-espresso/60 text-xl" />
                        </div>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleEditProduct(p)}
                          aria-label={t("editProduct")}
                          className="absolute top-2 end-2 size-9 bg-surface/90 rounded-full flex items-center justify-center"
                        >
                          <MaterialIcon icon="edit" className="text-espresso/70 text-base" />
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-snug" dir="auto">{p.name}</p>
                      <p className="text-primary font-bold text-sm tabular-nums">${p.price.toFixed(2)}</p>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === "recipes" && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-4">
          {recipes.length === 0 ? (
            <div className="col-span-2 text-center py-10">
              <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
              <p className="text-sm text-espresso/70">{t("emptyRecipes")}</p>
            </div>
          ) : (
            recipes.map((r) => (
              <Link href={`/recipe/${r.slug}`} key={r.id} className="flex flex-col gap-3">
                <div className="aspect-[3/4] rounded-[20px] bg-pine overflow-hidden relative">
                  <SafeImage
                    fill
                    sizes="(max-width: 768px) 50vw, 360px"
                    className="object-cover"
                    src={r.imageUrl || "/brand/banners/recipe-placeholder.svg"}
                    fallbackSrc="/brand/banners/recipe-placeholder.svg"
                    alt=""
                  />
                  <span className="absolute top-3 start-3 bg-brand-gold text-white text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <BrandIcon name="verified" className="text-xs" /> {tc("badges.brand")}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-snug mb-1" dir="auto">{r.title}</h4>
                  <p className="text-xs text-espresso/60 flex items-center gap-1">
                    <span className="truncate" dir="auto">{r.author.name}</span>
                    {r.rating > 0 && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <MaterialIcon icon="star" filled className="text-xs text-crema" />
                        {r.rating.toFixed(1)}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Gallery Tab */}
      {activeTab === "gallery" && (
        <div className="p-4">
          {/* Gallery Upload (owner only) */}
          {isOwner && (
            <div className="mb-4 bg-surface rounded-2xl border border-espresso/10 p-4 space-y-3">
              <p className="text-sm font-bold flex items-center gap-2">
                <MaterialIcon icon="add_photo_alternate" className="text-primary" />
                {t("addToGallery")}
              </p>
              <input
                value={galleryCaption}
                onChange={(e) => setGalleryCaption(e.target.value)}
                className={inputClass}
                placeholder={t("captionPlaceholder")}
                aria-label={t("caption")}
                dir="auto"
              />
              <input
                ref={galleryFileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleGalleryUpload(file);
                }}
              />
              <button
                onClick={() => galleryFileRef.current?.click()}
                disabled={uploading}
                className="w-full bg-primary text-on-primary text-sm font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? t("uploading") : t("uploadImage")}
              </button>
            </div>
          )}

          {localGallery.length === 0 ? (
            <div className="text-center py-10">
              <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
              <p className="text-sm text-espresso/70">{t("emptyGallery")}</p>
            </div>
          ) : (
            <div className="columns-2 gap-3 space-y-3">
              {localGallery.map((post) => (
                <div key={post.id} className="break-inside-avoid rounded-2xl overflow-hidden bg-surface border border-espresso/10">
                  {post.imageUrl && (post.mediaType === "video" ? (
                    <video src={post.imageUrl} controls playsInline preload="metadata" className="w-full object-cover" />
                  ) : (
                    <SafeImage src={post.imageUrl} alt={post.caption || ""} width={480} height={480} sizes="(max-width: 768px) 50vw, 360px" className="w-full h-auto object-cover" />
                  ))}
                  {post.caption && (
                    <p className="text-xs text-espresso/70 p-2.5 leading-relaxed" dir="auto">{post.caption}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
