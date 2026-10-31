"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import BottomNav from "@/components/BottomNav";
import { useTranslations } from "next-intl";

interface Category {
  id: string;
  name: string;
}

type IngredientUnit = "g" | "ml" | "oz" | "tsp" | "tbsp" | "cups" | "whole";

interface Ingredient {
  name: string;
  amount: string;
  unit: IngredientUnit;
}

const GRIND_SIZES = [
  "Extra Fine",
  "Fine",
  "Medium-Fine",
  "Medium",
  "Medium-Coarse",
  "Coarse",
] as const;

// Display labels come from messages (recipeEdit.units.<value>); stored values stay as-is.
const INGREDIENT_UNITS: IngredientUnit[] = ["g", "ml", "oz", "tsp", "tbsp", "cups", "whole"];

function formatBrewTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("recipeEdit");
  const tc = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [recipeName, setRecipeName] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [brewTime, setBrewTime] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "g" },
  ]);
  const [steps, setSteps] = useState([""]);

  const [temperature, setTemperature] = useState("");
  const [ratio, setRatio] = useState("");
  const [grindSize, setGrindSize] = useState("");
  const [brewTimeSec, setBrewTimeSec] = useState<number | "">("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (!res.ok) {
          setError(t("errors.notFound"));
          setLoading(false);
          return;
        }
        const data = await res.json();
        setRecipeName(data.title || "");
        setCategory(data.category || "");
        setDifficulty(data.difficulty || "Beginner");
        setBrewTime(data.brewTime || "");
        setDescription(data.description || "");
        setImageUrl(data.imageUrl || null);

        if (data.ingredients?.length) {
          setIngredients(
            data.ingredients.map((i: { name: string; baseAmount: number; unit: string }) => ({
              name: i.name,
              amount: String(i.baseAmount),
              unit: i.unit as IngredientUnit,
            }))
          );
        }

        if (data.steps?.length) {
          setSteps(data.steps.map((s: { description: string }) => s.description));
        }

        if (data.brewParams) {
          setTemperature(data.brewParams.temperature || "");
          setRatio(data.brewParams.ratio || "");
          setGrindSize(data.brewParams.grindSize || "");
          setBrewTimeSec(data.brewParams.brewTimeSec || "");
        }
      } catch {
        setError(t("errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    }
    loadRecipe();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", amount: "", unit: "g" }]);
  const removeIngredient = (idx: number) =>
    setIngredients(ingredients.filter((_, i) => i !== idx));
  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (idx: number) => setSteps(steps.filter((_, i) => i !== idx));
  const updateStep = (idx: number, value: string) => {
    const updated = [...steps];
    updated[idx] = value;
    setSteps(updated);
  };

  const handleSave = async () => {
    if (!recipeName || !category) {
      setError(t("errors.required"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const hasBrewParams = temperature || ratio || grindSize || brewTimeSec;

      const res = await fetch(`/api/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipeName,
          category,
          difficulty,
          brewTime,
          description,
          imageUrl,
          ingredients: ingredients
            .filter((i) => i.name)
            .map((i) => ({
              name: i.name,
              baseAmount: parseFloat(i.amount) || 0,
              unit: i.unit,
            })),
          steps: steps
            .filter((s) => s.trim())
            .map((s, idx) => ({
              title: `Step ${idx + 1}`,
              description: s,
            })),
          brewParams: hasBrewParams
            ? {
                temperature: temperature || null,
                ratio: ratio || null,
                grindSize: grindSize || null,
                brewTimeSec: typeof brewTimeSec === "number" ? brewTimeSec : null,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("errors.saveFailed"));
      }

      setSaved(true);
      setTimeout(() => router.push(`/recipe/${id}`), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";
  const labelClass =
    "text-sm font-semibold text-espresso/80 mb-1.5 block";
  const sectionClass = "bg-surface rounded-2xl border border-espresso/10 p-4";
  const paramInputClass =
    "w-full bg-transparent text-sm font-medium outline-none placeholder:text-espresso/50";

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link
          href={`/recipe/${id}`}
          aria-label={tc("close")}
          className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk"
        >
          <MaterialIcon icon="close" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-on-primary rounded-xl px-4 py-2 font-bold text-sm hover:bg-primary/90 active:scale-95 transition-colors disabled:opacity-50"
        >
          {saving ? "…" : tc("save")}
        </button>
      </header>

      {saved && (
        <div className="mx-4 mt-4 bg-primary/10 rounded-xl p-4 flex items-center gap-3">
          <MaterialIcon icon="check_circle" className="text-primary text-xl" />
          <p className="text-sm font-semibold text-primary">{t("saved")}</p>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <MaterialIcon icon="error" className="text-red-600 text-xl" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <main className="flex-1 px-4 py-6 pb-28 space-y-4">
        {/* Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video rounded-[20px] border-2 border-dashed border-espresso/15 flex flex-col items-center justify-center gap-3 bg-surface cursor-pointer hover:border-primary/40 transition-colors overflow-hidden relative"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          ) : imageUrl ? (
            <>
              <img src={imageUrl} alt={t("imageAlt")} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-surface/90 rounded-full p-3">
                  <MaterialIcon icon="edit" className="text-xl text-espresso" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MaterialIcon icon="add_a_photo" className="text-2xl text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">{t("addCover")}</p>
                <p className="text-xs text-espresso/60 mt-1">{t("tapToUpload")}</p>
              </div>
            </>
          )}
        </div>

        {/* Basic info */}
        <section className={`${sectionClass} space-y-4`}>
          <h2 className="text-xl">{t("aboutSection")}</h2>

          {/* Recipe Name */}
          <div>
            <label htmlFor="edit-name" className={labelClass}>{t("nameLabel")}</label>
            <input
              id="edit-name"
              dir="auto"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className={inputClass}
              placeholder={t("namePlaceholder")}
            />
          </div>

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-category" className={labelClass}>{t("categoryLabel")}</label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="">{t("choose")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-difficulty" className={labelClass}>{t("difficultyLabel")}</label>
              <select
                id="edit-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="Beginner">{t("difficulty.Beginner")}</option>
                <option value="Intermediate">{t("difficulty.Intermediate")}</option>
                <option value="Advanced">{t("difficulty.Advanced")}</option>
              </select>
            </div>
          </div>

          {/* Brew Time */}
          <div>
            <label htmlFor="edit-brew-time" className={labelClass}>{t("brewTimeLabel")}</label>
            <input
              id="edit-brew-time"
              dir="auto"
              value={brewTime}
              onChange={(e) => setBrewTime(e.target.value)}
              className={inputClass}
              placeholder={t("brewTimePlaceholder")}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-description" className={labelClass}>{t("descriptionLabel")}</label>
            <textarea
              id="edit-description"
              dir="auto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none leading-relaxed`}
              placeholder={t("descriptionPlaceholder")}
            />
          </div>
        </section>

        {/* Brewing Parameters */}
        <section className={sectionClass}>
          <div className="mb-4">
            <h2 className="text-xl">{t("brewParams")}</h2>
            <p className="text-xs text-espresso/60 mt-1">{t("brewParamsHint")}</p>
          </div>

          <div className="rounded-xl border border-espresso/10 divide-y divide-espresso/10 overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="thermometer" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="edit-temp" className="text-xs font-semibold text-espresso/60 block mb-1">{t("temperature")}</label>
                <input
                  id="edit-temp"
                  inputMode="numeric"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className={paramInputClass}
                  placeholder={t("temperaturePlaceholder")}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="scale" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="edit-ratio" className="text-xs font-semibold text-espresso/60 block mb-1">{t("ratio")}</label>
                <input
                  id="edit-ratio"
                  dir="ltr"
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  className={`${paramInputClass} text-end`}
                  placeholder={t("ratioPlaceholder")}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="grind" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="edit-grind" className="text-xs font-semibold text-espresso/60 block mb-1">{t("grindSize")}</label>
                <select
                  id="edit-grind"
                  value={grindSize}
                  onChange={(e) => setGrindSize(e.target.value)}
                  className={`${paramInputClass} appearance-none`}
                >
                  <option value="">{t("chooseGrind")}</option>
                  {GRIND_SIZES.map((size) => (
                    <option key={size} value={size}>{t(`grind.${size}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="timer" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="edit-timer" className="text-xs font-semibold text-espresso/60 block mb-1">{t("timerSeconds")}</label>
                <div className="flex items-center gap-3">
                  <input
                    id="edit-timer"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={brewTimeSec}
                    onChange={(e) =>
                      setBrewTimeSec(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className={`flex-1 ${paramInputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder={t("timerPlaceholder")}
                  />
                  {typeof brewTimeSec === "number" && brewTimeSec > 0 && (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap tabular-nums" dir="ltr">
                      {formatBrewTime(brewTimeSec)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ingredients */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">{t("ingredients")}</h2>
            <button
              onClick={addIngredient}
              className="text-primary text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
            >
              <MaterialIcon icon="add" className="text-base" /> {t("add")}
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-oat-milk rounded-xl p-2">
                <input
                  dir="auto"
                  aria-label={t("ingredientName", { number: idx + 1 })}
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                  className="flex-1 min-w-0 bg-surface rounded-xl px-3 py-2.5 border border-espresso/10 text-sm placeholder:text-espresso/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={t("ingredientPlaceholder")}
                />
                <input
                  inputMode="decimal"
                  aria-label={t("ingredientAmount", { number: idx + 1 })}
                  value={ing.amount}
                  onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                  className="w-20 bg-surface rounded-xl px-3 py-2.5 border border-espresso/10 text-sm placeholder:text-espresso/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={t("amountPlaceholder")}
                />
                <select
                  aria-label={t("ingredientUnit", { number: idx + 1 })}
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                  className="w-20 bg-surface rounded-xl px-2 py-2.5 border border-espresso/10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none text-center"
                >
                  {INGREDIENT_UNITS.map((u) => (
                    <option key={u} value={u}>{t(`units.${u}`)}</option>
                  ))}
                </select>
                {ingredients.length > 1 && (
                  <button
                    onClick={() => removeIngredient(idx)}
                    aria-label={t("removeIngredient")}
                    className="size-9 shrink-0 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <MaterialIcon icon="delete" className="text-lg" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">{t("steps")}</h2>
            <button
              onClick={addStep}
              className="text-primary text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
            >
              <MaterialIcon icon="add" className="text-base" /> {t("addStep")}
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start bg-oat-milk rounded-xl p-3">
                <div className="size-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0 mt-1.5">
                  {idx + 1}
                </div>
                <textarea
                  dir="auto"
                  aria-label={t("stepLabel", { number: idx + 1 })}
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  rows={2}
                  className="flex-1 min-w-0 bg-surface rounded-xl px-3 py-2.5 border border-espresso/10 text-sm leading-relaxed placeholder:text-espresso/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder={t("stepPlaceholder", { number: idx + 1 })}
                />
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(idx)}
                    aria-label={t("removeStep")}
                    className="size-9 shrink-0 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <MaterialIcon icon="delete" className="text-lg" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl text-sm hover:bg-primary/90 active:scale-[0.98] transition-colors disabled:opacity-50"
        >
          {saving ? tc("saving") : t("saveChanges")}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
