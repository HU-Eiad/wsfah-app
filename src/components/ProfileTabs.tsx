"use client";

import { useState } from "react";
import Link from "next/link";
import MaterialIcon from "./MaterialIcon";

type RecipeCard = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  rating: number;
  likes: number;
};

type SaveEntry = {
  id: string;
  recipe: RecipeCard;
};

type LikeEntry = {
  id: string;
  recipe: RecipeCard;
};

interface ProfileTabsProps {
  recipes: RecipeCard[];
  saves: SaveEntry[];
  likes: LikeEntry[];
}

const PLACEHOLDER_IMG = "/brand/banners/recipe-placeholder.svg";

type TabKey = "recipes" | "saved" | "liked";

const tabs: { key: TabKey; label: string }[] = [
  { key: "recipes", label: "وصفاتي" },
  { key: "saved", label: "المحفوظات" },
  { key: "liked", label: "الإعجابات" },
];

function RecipeGrid({ items, emptyText, emptyAction }: {
  items: RecipeCard[];
  emptyIcon: string;
  emptyText: string;
  emptyAction?: { label: string; href: string };
}) {
  if (items.length === 0) {
    return (
      <div className="col-span-2 flex flex-col items-center py-10 text-center">
        <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
        <p className="text-sm text-espresso/70 mb-4" dir="auto">{emptyText}</p>
        {emptyAction && (
          <Link href={emptyAction.href} className="bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors" dir="auto">
            {emptyAction.label}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {items.map((r) => (
        <Link href={`/recipe/${r.slug}`} key={r.id} className="flex flex-col gap-2">
          <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-pine">
            <img
              className="absolute inset-0 w-full h-full object-cover"
              src={r.imageUrl || PLACEHOLDER_IMG}
              alt=""
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-pine/80 to-transparent p-3">
              <div className="flex items-center justify-between text-paper text-[11px] font-bold">
                <div className="flex items-center gap-1">
                  <MaterialIcon icon="favorite" className="text-xs" filled />
                  {r.likes}
                </div>
                <div className="flex items-center gap-0.5">
                  {r.rating.toFixed(1)} <MaterialIcon icon="star" className="text-xs text-crema" filled />
                </div>
              </div>
            </div>
          </div>
          <h4 className="font-bold text-sm leading-snug" dir="auto">{r.title}</h4>
        </Link>
      ))}
    </>
  );
}

export default function ProfileTabs({ recipes, saves, likes }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("recipes");

  const savedRecipes = saves.map((s) => s.recipe);
  const likedRecipes = likes.map((l) => l.recipe);

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-espresso/10 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-espresso/60 font-medium"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {activeTab === "recipes" && (
          <RecipeGrid
            items={recipes}
            emptyIcon="menu_book"
            emptyText="لا توجد وصفات بعد"
            emptyAction={{ label: "أنشئ وصفتك الأولى", href: "/create" }}
          />
        )}
        {activeTab === "saved" && (
          <RecipeGrid
            items={savedRecipes}
            emptyIcon="bookmark"
            emptyText="لا توجد وصفات محفوظة بعد"
            emptyAction={{ label: "استكشف الوصفات", href: "/search" }}
          />
        )}
        {activeTab === "liked" && (
          <RecipeGrid
            items={likedRecipes}
            emptyIcon="favorite"
            emptyText="لا توجد وصفات معجب بها بعد"
            emptyAction={{ label: "استكشف الوصفات", href: "/search" }}
          />
        )}
      </div>
    </div>
  );
}
