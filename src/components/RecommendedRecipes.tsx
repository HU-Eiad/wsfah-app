"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import MaterialIcon from "./MaterialIcon";
import SafeImage from "./SafeImage";

interface Recipe {
  id: string;
  slug: string;
  title: string;
  category: string;
  imageUrl: string | null;
  rating: number;
  author: { id: string; name: string | null; image: string | null } | null;
}

export default function RecommendedRecipes() {
  const t = useTranslations("recommendedRecipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => setRecipes(data))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || recipes.length === 0) return null;

  return (
    <section className="py-6">
      <h2 className="text-xl mb-4">{t("title")}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/recipe/${recipe.slug}`}
            className="shrink-0 w-44 flex flex-col gap-3"
          >
            <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-pine">
              <SafeImage
                src={recipe.imageUrl || "/brand/banners/recipe-placeholder.svg"}
                alt=""
                fill
                sizes="176px"
                className="object-cover"
              />
              <span className="absolute top-3 start-3 text-[11px] font-bold px-2 py-1 rounded-md bg-surface/90 text-espresso" dir="auto">
                {recipe.category}
              </span>
            </div>
            <div>
              <h3 dir="auto" className="font-bold text-sm leading-snug mb-1 truncate">
                {recipe.title}
              </h3>
              <p className="text-xs text-espresso/60 flex items-center gap-1">
                {recipe.author?.name && (
                  <span className="truncate" dir="auto">{recipe.author.name}</span>
                )}
                <span className="flex items-center gap-0.5 shrink-0">
                  <MaterialIcon icon="star" filled className="text-xs text-crema" />
                  {recipe.rating.toFixed(1)}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
