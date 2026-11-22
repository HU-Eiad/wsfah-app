"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";

interface RecipeOption {
  id: string;
  title: string;
}

export default function NewBrewLogPage() {
  const t = useTranslations("journalNew");
  return (
    <Suspense fallback={<div className="min-h-screen bg-background-light flex items-center justify-center"><p className="text-sm text-espresso/60">{t("loading")}</p></div>}>
      <NewBrewLogInner />
    </Suspense>
  );
}

function NewBrewLogInner() {
  const router = useRouter();
  const t = useTranslations("journalNew");
  const searchParams = useSearchParams();
  const prefilledRecipeId = searchParams.get("recipeId") || "";

  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [recipeId, setRecipeId] = useState(prefilledRecipeId);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [grindSize, setGrindSize] = useState("");
  const [waterTemp, setWaterTemp] = useState("");
  const [brewTime, setBrewTime] = useState("");
  const [coffeeGrams, setCoffeeGrams] = useState("");
  const [waterMl, setWaterMl] = useState("");
  // Today's date in the user's local time zone (toISOString would use UTC).
  const [brewDate, setBrewDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  useEffect(() => {
    fetch("/api/recipes?limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecipes(data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const body: Record<string, unknown> = { title };
    if (recipeId) body.recipeId = recipeId;
    if (notes) body.notes = notes;
    if (rating > 0) body.rating = rating;
    if (grindSize) body.grindSize = grindSize;
    if (waterTemp) body.waterTemp = parseFloat(waterTemp);
    if (brewTime) body.brewTime = parseInt(brewTime);
    if (coffeeGrams) body.coffeeGrams = parseFloat(coffeeGrams);
    if (waterMl) body.waterMl = parseFloat(waterMl);
    if (brewDate) body.brewDate = brewDate;

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("saveError"));
        return;
      }

      router.push("/journal");
    } catch {
      setError(t("saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "flex items-center gap-1.5 text-xs font-semibold text-espresso/70 mb-2";

  return (
    <div className="min-h-screen bg-background-light text-espresso">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <h1 className="text-xl flex-1">{t("title")}</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface rounded-2xl border border-espresso/10 p-4 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="log-title" className={labelClass}>
                {t("titleLabel")}
              </label>
              <input
                id="log-title"
                type="text"
                dir="auto"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className={inputClass}
              />
            </div>

            {/* Recipe */}
            <div>
              <label htmlFor="log-recipe" className={labelClass}>
                {t("recipeLabel")}
              </label>
              <select
                id="log-recipe"
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t("noRecipe")}</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="log-notes" className={labelClass}>
                {t("notesLabel")}
              </label>
              <textarea
                id="log-notes"
                dir="auto"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={t("notesPlaceholder")}
                className={`${inputClass} leading-relaxed resize-none`}
              />
            </div>

            {/* Rating */}
            <div>
              <p className={labelClass}>{t("ratingLabel")}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    aria-label={t("ratingOf", { value: star })}
                    className="p-0.5"
                  >
                    <MaterialIcon
                      icon="star"
                      filled
                      className={`text-3xl transition-colors ${
                        star <= rating ? "text-crema" : "text-espresso/15 hover:text-crema/60"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brew Parameters Grid */}
          <section>
            <h2 className="text-xl mb-4">{t("paramsTitle")}</h2>
            <div className="bg-surface rounded-2xl border border-espresso/10 p-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="log-grind" className={labelClass}>
                  <BrandIcon name="grind" className="text-base text-primary" />
                  {t("grindSize")}
                </label>
                <input
                  id="log-grind"
                  type="text"
                  dir="auto"
                  value={grindSize}
                  onChange={(e) => setGrindSize(e.target.value)}
                  placeholder={t("grindPlaceholder")}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="log-temp" className={labelClass}>
                  <BrandIcon name="thermometer" className="text-base text-primary" />
                  {t("waterTemp")}
                </label>
                <input
                  id="log-temp"
                  type="number"
                  value={waterTemp}
                  onChange={(e) => setWaterTemp(e.target.value)}
                  placeholder="96"
                  min={0}
                  max={120}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="log-time" className={labelClass}>
                  <BrandIcon name="timer" className="text-base text-primary" />
                  {t("brewTime")}
                </label>
                <input
                  id="log-time"
                  type="number"
                  value={brewTime}
                  onChange={(e) => setBrewTime(e.target.value)}
                  placeholder="240"
                  min={1}
                  max={86400}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="log-coffee" className={labelClass}>
                  <BrandIcon name="bean" className="text-base text-primary" />
                  {t("coffeeGrams")}
                </label>
                <input
                  id="log-coffee"
                  type="number"
                  value={coffeeGrams}
                  onChange={(e) => setCoffeeGrams(e.target.value)}
                  placeholder="18"
                  min={0}
                  step={0.1}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="log-water" className={labelClass}>
                  <BrandIcon name="drop" className="text-base text-primary" />
                  {t("waterMl")}
                </label>
                <input
                  id="log-water"
                  type="number"
                  value={waterMl}
                  onChange={(e) => setWaterMl(e.target.value)}
                  placeholder="300"
                  min={0}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="log-date" className={labelClass}>
                  <MaterialIcon icon="calendar_today" className="text-base text-primary" />
                  {t("date")}
                </label>
                <input
                  id="log-date"
                  type="date"
                  value={brewDate}
                  onChange={(e) => setBrewDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? t("saving") : t("save")}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-espresso/15 rounded-xl px-5 py-3 font-semibold text-sm hover:border-primary/40 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
