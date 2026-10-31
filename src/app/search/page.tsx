"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import BottomNav from "@/components/BottomNav";

interface Recipe {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  rating: number;
  category: string;
  source: string;
  author: { name: string | null };
  brand: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "الكل";

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeDifficulty, setActiveDifficulty] = useState("الكل");
  const [activeSource, setActiveSource] = useState("الكل");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const difficultyOptions = [
    { label: "الكل", value: "الكل" },
    { label: "مبتدئ", value: "Beginner" },
    { label: "متوسط", value: "Intermediate" },
    { label: "متقدم", value: "Advanced" },
  ];

  const sourceOptions = [
    { label: "الكل", value: "الكل" },
    { label: "مجتمع", value: "COMMUNITY" },
    { label: "علامة تجارية", value: "BRAND" },
  ];

  // Sync activeCategory when URL param changes
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "الكل";
    setActiveCategory(urlCategory);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (activeCategory !== "الكل") params.set("category", activeCategory);
    if (activeDifficulty !== "الكل") params.set("difficulty", activeDifficulty);
    if (activeSource !== "الكل") params.set("source", activeSource);

    fetch(`/api/recipes?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, activeCategory, activeDifficulty, activeSource]);

  const allCategories = ["الكل", ...categories.map((c) => c.name)];

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 pt-3 pb-4 border-b border-espresso/10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/" aria-label="رجوع" className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk">
            <MaterialIcon icon="arrow_forward" />
          </Link>
          <h1 className="text-2xl flex-1">البحث</h1>
        </div>
        <label className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3 border border-espresso/15 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <MaterialIcon icon="search" className="text-espresso/50" />
          <input
            dir="auto"
            autoFocus
            aria-label="ابحث"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm placeholder:text-espresso/50 outline-none"
            placeholder="ابحث عن وصفات، محمصات، أو خلطات شاي"
            type="text"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="مسح البحث" className="shrink-0">
              <MaterialIcon icon="close" className="text-espresso/50" />
            </button>
          )}
        </label>
      </header>

      <main className="flex-1 px-4 pt-4 pb-28">
        {/* Category chips */}
        <div className="flex overflow-x-auto gap-2 mb-4 no-scrollbar -mx-4 px-4">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-on-primary"
                  : "bg-surface border border-espresso/10 text-espresso/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex overflow-x-auto gap-2 mb-3 no-scrollbar -mx-4 px-4">
          <span className="shrink-0 text-xs font-semibold text-espresso/60 self-center me-1">المستوى</span>
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveDifficulty(opt.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeDifficulty === opt.value
                  ? "bg-primary text-on-primary"
                  : "bg-surface border border-espresso/10 text-espresso/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex overflow-x-auto gap-2 mb-6 no-scrollbar -mx-4 px-4">
          <span className="shrink-0 text-xs font-semibold text-espresso/60 self-center me-1">المصدر</span>
          {sourceOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveSource(opt.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeSource === opt.value
                  ? "bg-primary text-on-primary"
                  : "bg-surface border border-espresso/10 text-espresso/70"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="جارٍ التحميل…" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="py-16 text-center">
            <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
            <p className="text-sm text-espresso/70">لا توجد وصفات تطابق بحثك. جرّب كلمة أو قسماً مختلفاً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {recipes.map((item) => (
              <Link href={`/recipe/${item.slug}`} key={item.id} className="flex flex-col gap-3">
                <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-pine">
                  <img
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    src={item.imageUrl || "/brand/banners/recipe-placeholder.svg"}
                  />
                  <span
                    className={`absolute top-3 start-3 text-[11px] font-bold px-2 py-1 rounded-md text-white flex items-center gap-1 ${
                      item.brand ? "bg-brand-gold" : "bg-community-teal"
                    }`}
                  >
                    {item.brand ? (
                      <>
                        <BrandIcon name="verified" className="text-xs" /> علامة تجارية
                      </>
                    ) : (
                      <>
                        <MaterialIcon icon="group" className="text-xs" /> مجتمعي
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <h3 dir="auto" className="font-bold text-sm leading-snug mb-1">{item.title}</h3>
                  <p className="text-xs text-espresso/60 flex items-center gap-1">
                    <span className="truncate" dir="auto">{item.brand?.name || item.author.name}</span>
                    {item.rating > 0 && (
                      <span className="flex items-center gap-0.5 shrink-0">
                        <MaterialIcon icon="star" filled className="text-xs text-crema" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
