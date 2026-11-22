"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  brewTime: string | null;
  brewTimeSeconds: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  accessTier: string;
  author: { name: string | null };
}

interface RecipeDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  brewTime: string | null;
  brewTimeSeconds: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isVerified: boolean;
  accessTier: string;
  /** true when the API withheld ingredients/steps/brewParams for this viewer */
  locked?: boolean;
  ingredients: { name: string; baseAmount: number; unit: string }[];
  steps: { title: string; description: string }[];
  brewParams: { temperature: string; ratio: string; grindSize: string; brewTimeSec: number } | null;
}

const CATEGORIES = ["pour-over", "cold-brew", "espresso", "matcha", "tea", "rituals"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const TIERS = ["FREE", "BASIC", "PREMIUM", "PRO"];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full relative transition-colors ${
          checked ? "bg-[#8fbf9a]" : "bg-gray-300 dark:bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "left-5" : "left-0.5"
          }`}
        />
      </button>
      <span className="text-sm text-[#eef0e8cc]">{label}</span>
    </label>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">(value && value.startsWith("http") ? "url" : "upload");
  const t = useTranslations("adminRecipes");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      console.error(err);
      alert(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            mode === "upload"
              ? "bg-[#8fbf9a]/20 text-[#8fbf9a] border border-[#8fbf9a]/30"
              : "bg-[#eef0e808] text-[#eef0e899] border border-transparent"
          }`}
        >
          {t("modeUpload")}
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            mode === "url"
              ? "bg-[#8fbf9a]/20 text-[#8fbf9a] border border-[#8fbf9a]/30"
              : "bg-[#eef0e808] text-[#eef0e899] border border-transparent"
          }`}
        >
          {t("modeUrl")}
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-[#eef0e81a] bg-[#ffffff05] text-[#eef0e899] text-sm hover:border-[#8fbf9a]/50 hover:bg-[#8fbf9a]/5 transition-colors disabled:opacity-50"
          >
            {uploading ? t("uploading") : value ? t("changeImage") : t("clickToUpload")}
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm focus:ring-2 focus:ring-[#8fbf9a] focus:border-transparent outline-none"
          placeholder="https://example.com/image.jpg"
        />
      )}

      {value && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded file or any pasted URL */}
          <img
            src={value}
            alt={t("preview")}
            className="w-full max-w-[200px] h-auto rounded-lg border border-[#eef0e80d]"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("removeImage")}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const t = useTranslations("adminRecipes");
  const ta = useTranslations("admin");
  const categoryLabel = (c: string) => (t.has(`categories.${c}`) ? t(`categories.${c}`) : c);
  const difficultyLabel = (d: string) => (t.has(`difficulties.${d}`) ? t(`difficulties.${d}`) : d);
  const tierLabel = (tier: string) => (t.has(`tiers.${tier}`) ? t(`tiers.${tier}`) : tier);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "pour-over",
    difficulty: "Beginner",
    brewTime: "",
    brewTimeSeconds: 180,
    imageUrl: "",
    accessTier: "FREE",
    isFeatured: false,
    isVerified: false,
  });
  const [ingredients, setIngredients] = useState<{ name: string; baseAmount: number; unit: string }[]>([
    { name: "", baseAmount: 0, unit: "g" },
  ]);
  const [steps, setSteps] = useState<{ title: string; description: string }[]>([
    { title: "", description: "" },
  ]);
  const [brewParams, setBrewParams] = useState({
    temperature: "",
    ratio: "",
    grindSize: "",
    brewTimeSec: 180,
  });

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?recipes=1&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  function resetForm() {
    setForm({
      title: "",
      description: "",
      category: "pour-over",
      difficulty: "Beginner",
      brewTime: "",
      brewTimeSeconds: 180,
      imageUrl: "",
      accessTier: "FREE",
      isFeatured: false,
      isVerified: false,
    });
    setIngredients([{ name: "", baseAmount: 0, unit: "g" }]);
    setSteps([{ title: "", description: "" }]);
    setBrewParams({ temperature: "", ratio: "", grindSize: "", brewTimeSec: 180 });
    setEditingId(null);
  }

  async function openEdit(recipeId: string) {
    try {
      const res = await fetch(`/api/recipes/${recipeId}`);
      if (!res.ok) return;
      const data: RecipeDetail = await res.json();
      // Never open a form built from a withheld (paywalled) payload: saving it
      // would look like the recipe has no ingredients or steps.
      if (data.locked) {
        alert(t("lockedCantEdit"));
        return;
      }
      setForm({
        title: data.title,
        description: data.description || "",
        category: data.category,
        difficulty: data.difficulty,
        brewTime: data.brewTime || "",
        brewTimeSeconds: data.brewTimeSeconds,
        imageUrl: data.imageUrl || "",
        accessTier: data.accessTier,
        isFeatured: data.isFeatured,
        isVerified: data.isVerified,
      });
      setIngredients(
        data.ingredients.length > 0
          ? data.ingredients.map((i) => ({ name: i.name, baseAmount: i.baseAmount, unit: i.unit }))
          : [{ name: "", baseAmount: 0, unit: "g" }]
      );
      setSteps(
        data.steps.length > 0
          ? data.steps.map((s) => ({ title: s.title, description: s.description }))
          : [{ title: "", description: "" }]
      );
      setBrewParams(
        data.brewParams
          ? { temperature: data.brewParams.temperature, ratio: data.brewParams.ratio, grindSize: data.brewParams.grindSize, brewTimeSec: data.brewParams.brewTimeSec }
          : { temperature: "", ratio: "", grindSize: "", brewTimeSec: 180 }
      );
      setEditingId(recipeId);
      setShowForm(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const filteredIngredients = ingredients.filter((i) => i.name.trim());
    const filteredSteps = steps.filter((s) => s.title.trim() || s.description.trim());
    const hasBrewParams = brewParams.temperature || brewParams.ratio || brewParams.grindSize;

    const payload = {
      ...form,
      brewTimeSeconds: Number(form.brewTimeSeconds) || 180,
      ingredients: filteredIngredients.length > 0 ? filteredIngredients : undefined,
      steps: filteredSteps.length > 0 ? filteredSteps : undefined,
      brewParams: hasBrewParams ? { ...brewParams, brewTimeSec: Number(brewParams.brewTimeSec) || 180 } : undefined,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/recipes/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/recipes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchRecipes();
      } else {
        const err = await res.json();
        alert(err.error || t("saveFailed"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function updateAccessTier(recipeId: string, tier: string) {
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessTier: tier }),
      });
      if (res.ok) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === recipeId ? { ...r, accessTier: tier } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleField(recipeId: string, field: "isFeatured" | "isVerified", value: boolean) {
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === recipeId ? { ...r, [field]: value } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteRecipe(recipeId: string) {
    if (!confirm(t("confirmDelete"))) return;
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      if (res.ok) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      }
    } catch (err) {
      console.error(err);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm focus:ring-2 focus:ring-[#8fbf9a] focus:border-transparent outline-none";
  const labelClass = "block text-xs font-medium text-[#eef0e8aa] mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#eef0e8]">{t("title")}</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 rounded-lg bg-[#8fbf9a] text-[#0e1a13] font-medium text-sm hover:bg-[#8fbf9a]/80 transition-colors"
        >
          {showForm ? t("cancel") : t("newBtn")}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#16261d] border border-[#eef0e80d] rounded-2xl p-6 mb-6 space-y-6">
          <h3 className="text-lg font-semibold text-[#eef0e8]">
            {editingId ? t("editTitle") : t("createTitle")}
          </h3>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t("fTitle")}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t("fImage")}</label>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />
            </div>
            <div>
              <label className={labelClass}>{t("fCategory")}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("fDifficulty")}</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className={inputClass}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{difficultyLabel(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("fBrewTime")}</label>
              <input
                type="text"
                value={form.brewTime}
                onChange={(e) => setForm({ ...form, brewTime: e.target.value })}
                className={inputClass}
                placeholder={t("fBrewTimePlaceholder")}
              />
            </div>
            <div>
              <label className={labelClass}>{t("fBrewTimeSeconds")}</label>
              <input
                type="number"
                value={form.brewTimeSeconds}
                onChange={(e) => setForm({ ...form, brewTimeSeconds: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("fDescription")}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass + " min-h-[80px]"}
              rows={3}
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <Toggle checked={form.isFeatured} onChange={(v) => setForm({ ...form, isFeatured: v })} label={t("featured")} />
            <Toggle checked={form.isVerified} onChange={(v) => setForm({ ...form, isVerified: v })} label={t("verified")} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-[#eef0e8cc]">{t("fAccess")}</label>
              <select
                value={form.accessTier}
                onChange={(e) => setForm({ ...form, accessTier: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm"
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>{t(`tiersLong.${tier}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Brewing Parameters */}
          <div>
            <h4 className="text-sm font-semibold text-[#eef0e8] mb-3">{t("brewParams")}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>{t("fTemperature")}</label>
                <input
                  type="text"
                  value={brewParams.temperature}
                  onChange={(e) => setBrewParams({ ...brewParams, temperature: e.target.value })}
                  className={inputClass}
                  placeholder="93°C"
                />
              </div>
              <div>
                <label className={labelClass}>{t("fRatio")}</label>
                <input
                  type="text"
                  value={brewParams.ratio}
                  onChange={(e) => setBrewParams({ ...brewParams, ratio: e.target.value })}
                  className={inputClass}
                  placeholder="1:16"
                />
              </div>
              <div>
                <label className={labelClass}>{t("fGrind")}</label>
                <input
                  type="text"
                  value={brewParams.grindSize}
                  onChange={(e) => setBrewParams({ ...brewParams, grindSize: e.target.value })}
                  className={inputClass}
                  placeholder={t("fGrindPlaceholder")}
                />
              </div>
              <div>
                <label className={labelClass}>{t("fTimer")}</label>
                <input
                  type="number"
                  value={brewParams.brewTimeSec}
                  onChange={(e) => setBrewParams({ ...brewParams, brewTimeSec: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[#eef0e8]">{t("ingredients")}</h4>
              <button
                type="button"
                onClick={() => setIngredients([...ingredients, { name: "", baseAmount: 0, unit: "g" }])}
                className="text-xs text-[#8fbf9a] font-medium hover:underline"
              >
                {t("addIngredient")}
              </button>
            </div>
            <div className="space-y-3">
              {ingredients.map((ing, i) => (
                <div key={i} className="bg-[#ffffff05] rounded-lg p-3 border border-[#eef0e80d]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#eef0e880]">#{i + 1}</span>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                        className="text-red-500 text-xs hover:text-red-700 font-medium"
                      >
                        {t("remove")}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[i].name = e.target.value;
                        setIngredients(copy);
                      }}
                      className={inputClass}
                      placeholder={t("ingredientName")}
                    />
                    <input
                      type="number"
                      value={ing.baseAmount || ""}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[i].baseAmount = parseFloat(e.target.value) || 0;
                        setIngredients(copy);
                      }}
                      className={inputClass}
                      placeholder={t("amount")}
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[i].unit = e.target.value;
                        setIngredients(copy);
                      }}
                      className={inputClass}
                    >
                      {["g", "ml", "oz", "tsp", "tbsp", "cup", "piece"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-[#eef0e8]">{t("steps")}</h4>
              <button
                type="button"
                onClick={() => setSteps([...steps, { title: "", description: "" }])}
                className="text-xs text-[#8fbf9a] font-medium hover:underline"
              >
                {t("addStep")}
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-xs font-bold text-[#eef0e880] pt-2 w-6 shrink-0">
                    {i + 1}.
                  </span>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const copy = [...steps];
                        copy[i].title = e.target.value;
                        setSteps(copy);
                      }}
                      className={inputClass}
                      placeholder={t("stepTitle")}
                    />
                    <textarea
                      value={step.description}
                      onChange={(e) => {
                        const copy = [...steps];
                        copy[i].description = e.target.value;
                        setSteps(copy);
                      }}
                      className={inputClass + " min-h-[50px]"}
                      placeholder={t("stepDescription")}
                      rows={2}
                    />
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                      aria-label={t("remove")}
                      className="text-red-500 text-sm hover:text-red-700 pt-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-[#8fbf9a] text-[#0e1a13] font-medium text-sm disabled:opacity-50 hover:bg-[#8fbf9a]/80 transition-colors"
            >
              {saving ? t("saving") : editingId ? t("update") : t("create")}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-6 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-[#eef0e8cc] font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] focus:ring-2 focus:ring-[#8fbf9a] focus:border-transparent outline-none"
        />
      </div>

      {/* Recipe Table */}
      {loading ? (
        <p className="text-[#eef0e899]">{ta("loading")}</p>
      ) : recipes.length === 0 ? (
        <p className="text-[#eef0e899]">{t("empty")}</p>
      ) : (
        <>
        {/* Mobile: Card layout */}
        <div className="lg:hidden space-y-3">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-[#16261d] border border-[#eef0e80d] rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#eef0e8] truncate">{recipe.title}</p>
                  <p className="text-xs text-[#eef0e899]">{recipe.author?.name || "—"} · {categoryLabel(recipe.category)}</p>
                </div>
                <select
                  value={recipe.accessTier}
                  onChange={(e) => updateAccessTier(recipe.id, e.target.value)}
                  className="shrink-0 px-2 py-1 rounded text-[11px] font-bold border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8]"
                >
                  {TIERS.map((tier) => <option key={tier} value={tier}>{tierLabel(tier)}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-[#eef0e8aa]">
                  <button
                    onClick={() => toggleField(recipe.id, "isFeatured", !recipe.isFeatured)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${recipe.isFeatured ? "bg-[#8fbf9a]" : "bg-gray-300 dark:bg-gray-700"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${recipe.isFeatured ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  {t("featured")}
                </label>
                <label className="flex items-center gap-2 text-xs text-[#eef0e8aa]">
                  <button
                    onClick={() => toggleField(recipe.id, "isVerified", !recipe.isVerified)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${recipe.isVerified ? "bg-[#8fbf9a]" : "bg-gray-300 dark:bg-gray-700"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${recipe.isVerified ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  {t("verified")}
                </label>
                <div className="flex gap-2 ms-auto">
                  <button onClick={() => openEdit(recipe.id)} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium">{t("edit")}</button>
                  <button onClick={() => deleteRecipe(recipe.id)} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium">{t("delete")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden lg:block overflow-x-auto bg-[#16261d] border border-[#eef0e80d] rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#eef0e80d]">
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colTitle")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colAuthor")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colCategory")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("featured")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("verified")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colTier")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="border-b border-[#eef0e80d] last:border-0">
                  <td className="p-4 text-[#eef0e8] font-medium">{recipe.title}</td>
                  <td className="p-4 text-[#eef0e8aa]">{recipe.author?.name || "—"}</td>
                  <td className="p-4 text-[#eef0e8aa]">{categoryLabel(recipe.category)}</td>
                  <td className="p-4">
                    <button onClick={() => toggleField(recipe.id, "isFeatured", !recipe.isFeatured)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${recipe.isFeatured ? "bg-[#8fbf9a]" : "bg-gray-300 dark:bg-gray-700"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${recipe.isFeatured ? "left-5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="p-4">
                    <button onClick={() => toggleField(recipe.id, "isVerified", !recipe.isVerified)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${recipe.isVerified ? "bg-[#8fbf9a]" : "bg-gray-300 dark:bg-gray-700"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${recipe.isVerified ? "left-5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="p-4">
                    <select value={recipe.accessTier} onChange={(e) => updateAccessTier(recipe.id, e.target.value)}
                      className="px-2 py-1 rounded text-xs font-medium border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8]">
                      {TIERS.map((tier) => <option key={tier} value={tier}>{tierLabel(tier)}</option>)}
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(recipe.id)} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium">{t("edit")}</button>
                      <button onClick={() => deleteRecipe(recipe.id)} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium">{t("delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
