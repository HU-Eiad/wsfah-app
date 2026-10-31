"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import BottomNav from "@/components/BottomNav";
import BrewMethodPicker from "@/components/BrewMethodPicker";
import UpgradeModal from "@/components/UpgradeModal";

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

// Display labels only; the stored values stay the English keys above.
const GRIND_LABELS: Record<string, string> = {
  "Extra Fine": "ناعم جداً",
  Fine: "ناعم",
  "Medium-Fine": "متوسط إلى ناعم",
  Medium: "متوسط",
  "Medium-Coarse": "متوسط إلى خشن",
  Coarse: "خشن",
};

const INGREDIENT_UNITS: { value: IngredientUnit; label: string }[] = [
  { value: "g", label: "غ" },
  { value: "ml", label: "مل" },
  { value: "oz", label: "oz" },
  { value: "tsp", label: "ملعقة ص" },
  { value: "tbsp", label: "ملعقة ك" },
  { value: "cups", label: "كوب" },
  { value: "whole", label: "حبة" },
];

function formatBrewTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function CreatePage() {
  const router = useRouter();

  // Basic fields
  const [recipeName, setRecipeName] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [brewTime, setBrewTime] = useState("");
  const [description, setDescription] = useState("");

  // Ingredients with unit support
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", amount: "", unit: "g" },
  ]);

  // Steps
  const [steps, setSteps] = useState([""]);

  // Brewing Parameters
  const [temperature, setTemperature] = useState("");
  const [ratio, setRatio] = useState("");
  const [grindSize, setGrindSize] = useState("");
  const [brewTimeSec, setBrewTimeSec] = useState<number | "">("");

  // Image upload
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Brand / role state
  const [userRole, setUserRole] = useState<string>("USER");
  const [publishAsBrand, setPublishAsBrand] = useState(false);
  const [userBrand, setUserBrand] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // Fetch user role and company for brand admins
  useEffect(() => {
    async function checkUserRole() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) return;
        const data = await res.json();
        const role = data.role || "USER";
        setUserRole(role);

        if (role === "BRAND_ADMIN") {
          // Fetch companies owned by this user
          const companiesRes = await fetch("/api/companies");
          if (companiesRes.ok) {
            const companies = await companiesRes.json();
            // Find companies owned by the current user
            const ownCompany = companies.find(
              (c: { owner: { id: string }; status: string }) =>
                c.owner.id === data.id && c.status === "APPROVED"
            );
            if (ownCompany) {
              setUserBrand({ id: ownCompany.id, name: ownCompany.name });
            }
          }
        }
      } catch {
        // Silently fail - user just won't see brand options
      }
    }
    checkUserRole();
  }, []);

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

  // Ingredient helpers
  const addIngredient = () =>
    setIngredients([...ingredients, { name: "", amount: "", unit: "g" }]);
  const removeIngredient = (idx: number) =>
    setIngredients(ingredients.filter((_, i) => i !== idx));
  const updateIngredient = (
    idx: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setIngredients(updated);
  };

  // Step helpers
  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (idx: number) =>
    setSteps(steps.filter((_, i) => i !== idx));
  const updateStep = (idx: number, value: string) => {
    const updated = [...steps];
    updated[idx] = value;
    setSteps(updated);
  };

  const handlePublish = async () => {
    if (!recipeName || !category) {
      setError("Ø§Ø³Ù Ø§ÙÙØµÙØ© ÙØ§ÙÙØ³Ù ÙØ·ÙÙØ¨Ø§Ù");
      return;
    }

    setPublishing(true);
    setError("");

    try {
      const hasBrewParams = temperature || ratio || grindSize || brewTimeSec;

      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipeName,
          category,
          difficulty,
          brewTime,
          description,
          imageUrl,
          brandId: publishAsBrand && userBrand ? userBrand.id : undefined,
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
                brewTimeSec:
                  typeof brewTimeSec === "number" ? brewTimeSec : null,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403 && data.upgradeRequired) {
          setUpgradeFeature(data.feature || "");
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(data.error || "ØªØ¹Ø°ÙØ± ÙØ´Ø± Ø§ÙÙØµÙØ©Ø Ø­Ø§ÙÙ ÙØ±Ø© Ø£Ø®Ø±Ù");
      }

      setPublished(true);
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙØ± ÙØªÙÙØ¹Ø Ø­Ø§ÙÙ ÙØ±Ø© Ø£Ø®Ø±Ù");
    } finally {
      setPublishing(false);
    }
  };

  // Shared style tokens
  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";
  const labelClass =
    "text-sm font-semibold text-espresso/80 mb-1.5 block";
  const sectionClass = "bg-surface rounded-2xl border border-espresso/10 p-4";
  const paramInputClass =
    "w-full bg-transparent text-sm font-medium outline-none placeholder:text-espresso/50";

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link
          href="/"
          aria-label="إغلاق"
          className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk"
        >
          <MaterialIcon icon="close" />
        </Link>
        <h1 className="text-xl flex-1">إنشاء وصفة</h1>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="bg-primary text-on-primary rounded-xl px-4 py-2 font-bold text-sm hover:bg-primary/90 active:scale-95 transition-colors disabled:opacity-50"
        >
          {publishing ? "…" : "نشر"}
        </button>
      </header>

      {/* Success banner */}
      {published && (
        <div className="mx-4 mt-4 bg-primary/10 rounded-xl p-4 flex items-center gap-3">
          <MaterialIcon icon="check_circle" className="text-primary text-xl" />
          <p className="text-sm font-semibold text-primary">
            تم نشر الوصفة بنجاح.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <MaterialIcon icon="error" className="text-red-600 text-xl" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <UpgradeModal
        open={showUpgradeModal}
        feature={upgradeFeature}
        onClose={() => setShowUpgradeModal(false)}
      />

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
              <img src={imageUrl} alt="صورة الوصفة" className="absolute inset-0 w-full h-full object-cover" />
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
                <p className="text-sm font-bold">إضافة صورة غلاف</p>
                <p className="text-xs text-espresso/60 mt-1">انقر للرفع</p>
              </div>
            </>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/*  BASIC INFO                                                 */}
        {/* ──────────────────────────────────────────────────────────── */}
        <section className={`${sectionClass} space-y-4`}>
          <h2 className="text-xl">عن الوصفة</h2>

          {/* Recipe Name */}
          <div>
            <label htmlFor="create-name" className={labelClass}>اسم الوصفة</label>
            <input
              id="create-name"
              dir="auto"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className={inputClass}
              placeholder="مثال: قهوة الصباح بالترشيح"
            />
          </div>

          {/* Publish As Toggle - BRAND_ADMIN only */}
          {userRole === "BRAND_ADMIN" && userBrand && (
            <div>
              <p className={labelClass}>النشر باسم</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPublishAsBrand(false)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                    !publishAsBrand
                      ? "bg-primary/10 border-primary text-espresso"
                      : "bg-oat-milk border-transparent text-espresso/60 hover:text-espresso"
                  }`}
                >
                  <MaterialIcon
                    icon="group"
                    className={`text-lg ${!publishAsBrand ? "text-primary" : "text-espresso/50"}`}
                  />
                  <span dir="auto">وصفة مجتمعية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPublishAsBrand(true)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                    publishAsBrand
                      ? "bg-brand-gold/10 border-brand-gold text-espresso"
                      : "bg-oat-milk border-transparent text-espresso/60 hover:text-espresso"
                  }`}
                >
                  <BrandIcon
                    name="verified"
                    className={`text-lg ${publishAsBrand ? "text-brand-gold" : "text-espresso/50"}`}
                  />
                  <span dir="auto" className="truncate">{userBrand.name}</span>
                </button>
              </div>
              {publishAsBrand && (
                <div className="mt-2 px-3 py-2 bg-oat-milk rounded-xl flex items-center gap-2">
                  <MaterialIcon icon="info" className="text-sm text-brand-gold" />
                  <p className="text-xs text-espresso/70 leading-relaxed" dir="auto">
                    سيتم نشر هذه الوصفة تحت <strong>{userBrand.name}</strong> كوصفة رسمية للعلامة التجارية.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Category & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="create-category" className={labelClass}>القسم</label>
              <select
                id="create-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="">اختر…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="create-difficulty" className={labelClass}>الصعوبة</label>
              <select
                id="create-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="Beginner">مبتدئ</option>
                <option value="Intermediate">متوسط</option>
                <option value="Advanced">متقدم</option>
              </select>
            </div>
          </div>

          {/* Brew Time */}
          <div>
            <label htmlFor="create-brew-time" className={labelClass}>وقت التحضير</label>
            <input
              id="create-brew-time"
              dir="auto"
              value={brewTime}
              onChange={(e) => setBrewTime(e.target.value)}
              className={inputClass}
              placeholder="مثال: ١٠ دقائق"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="create-description" className={labelClass}>الوصف</label>
            <textarea
              id="create-description"
              dir="auto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none leading-relaxed`}
              placeholder="أخبرنا قصة وصفتك…"
            />
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────── */}
        {/*  BREWING PARAMETERS SECTION                                 */}
        {/* ──────────────────────────────────────────────────────────── */}
        <section className={sectionClass}>
          {/* Section heading */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <h2 className="text-xl">معايير التحضير</h2>
              <p className="text-xs text-espresso/60 mt-1">
                اضبط معايير تحضيرك للكوب المثالي
              </p>
            </div>
            <BrewMethodPicker
              onSelect={(tmpl) => {
                setTemperature(tmpl.temperature);
                setRatio(tmpl.ratio);
                setGrindSize(tmpl.grindSize);
                setBrewTimeSec(tmpl.brewTimeSec);
              }}
            />
          </div>

          {/* Parameter rows */}
          <div className="rounded-xl border border-espresso/10 divide-y divide-espresso/10 overflow-hidden">
            {/* Temperature */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="thermometer" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="create-temp" className="text-xs font-semibold text-espresso/60 block mb-1">
                  الحرارة
                </label>
                <input
                  id="create-temp"
                  inputMode="numeric"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className={paramInputClass}
                  placeholder="مثال: ٩٣"
                />
              </div>
            </div>

            {/* Coffee-to-Water Ratio */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="scale" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="create-ratio" className="text-xs font-semibold text-espresso/60 block mb-1">
                  نسبة القهوة إلى الماء
                </label>
                <input
                  id="create-ratio"
                  dir="ltr"
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  className={`${paramInputClass} text-end`}
                  placeholder="مثال: ١:١٥"
                />
              </div>
            </div>

            {/* Grind Size */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="grind" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="create-grind" className="text-xs font-semibold text-espresso/60 block mb-1">
                  حجم الطحن
                </label>
                <select
                  id="create-grind"
                  value={grindSize}
                  onChange={(e) => setGrindSize(e.target.value)}
                  className={`${paramInputClass} appearance-none`}
                >
                  <option value="">اختر حجم الطحن…</option>
                  {GRIND_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {GRIND_LABELS[size] || size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brew Timer */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="size-10 rounded-xl bg-oat-milk text-primary flex items-center justify-center shrink-0">
                <BrandIcon name="timer" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <label htmlFor="create-timer" className="text-xs font-semibold text-espresso/60 block mb-1">
                  مؤقت التحضير (بالثواني)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="create-timer"
                    type="number"
                    min={0}
                    value={brewTimeSec}
                    onChange={(e) =>
                      setBrewTimeSec(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className={`flex-1 ${paramInputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    placeholder="مثال: ٢٤٠"
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

        {/* ──────────────────────────────────────────────────────────── */}
        {/*  INGREDIENTS                                                */}
        {/* ──────────────────────────────────────────────────────────── */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">المكونات</h2>
            <button
              onClick={addIngredient}
              className="text-primary text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
            >
              <MaterialIcon icon="add" className="text-base" /> إضافة
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-oat-milk rounded-xl p-2">
                <input
                  dir="auto"
                  aria-label={`اسم المكوّن ${idx + 1}`}
                  value={ing.name}
                  onChange={(e) =>
                    updateIngredient(idx, "name", e.target.value)
                  }
                  className="flex-1 min-w-0 bg-surface rounded-xl px-3 py-2.5 border border-espresso/10 text-sm placeholder:text-espresso/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="المكوّن"
                />
                <input
                  inputMode="decimal"
                  aria-label={`كمية المكوّن ${idx + 1}`}
                  value={ing.amount}
                  onChange={(e) =>
                    updateIngredient(idx, "amount", e.target.value)
                  }
                  className="w-20 bg-surface rounded-xl px-3 py-2.5 border border-espresso/10 text-sm placeholder:text-espresso/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="الكمية"
                />
                <select
                  aria-label={`وحدة المكوّن ${idx + 1}`}
                  value={ing.unit}
                  onChange={(e) =>
                    updateIngredient(idx, "unit", e.target.value)
                  }
                  className="w-20 bg-surface rounded-xl px-2 py-2.5 border border-espresso/10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none text-center"
                >
                  {INGREDIENT_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                {ingredients.length > 1 && (
                  <button
                    onClick={() => removeIngredient(idx)}
                    aria-label="حذف المكوّن"
                    className="size-9 shrink-0 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <MaterialIcon icon="delete" className="text-lg" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────── */}
        {/*  STEPS                                                      */}
        {/* ──────────────────────────────────────────────────────────── */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">الخطوات</h2>
            <button
              onClick={addStep}
              className="text-primary text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
            >
              <MaterialIcon icon="add" className="text-base" /> إضافة خطوة
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
                  aria-label={`الخطوة ${idx + 1}`}
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                  rows={2}
                  className="flex-1 min-w-0 bg-surface rounded-xl px-3 py-2.5 border border-espresso/10 text-sm leading-relaxed placeholder:text-espresso/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder={`تعليمات الخطوة ${idx + 1}…`}
                />
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(idx)}
                    aria-label="حذف الخطوة"
                    className="size-9 shrink-0 rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <MaterialIcon icon="delete" className="text-lg" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Verified Creator Badge */}
        {userRole === "CREATOR" && (
          <div className="flex items-center justify-center gap-2 py-2">
            <BrandIcon name="verified" className="text-primary text-lg" />
            <span className="text-xs font-bold text-primary">
              النشر كمبدع موثق
            </span>
          </div>
        )}

        {/* Brand publish indicator */}
        {publishAsBrand && userBrand && (
          <div className="flex items-center justify-center gap-2 py-2">
            <MaterialIcon icon="storefront" className="text-brand-gold text-lg" />
            <span className="text-xs font-bold text-brand-gold" dir="auto">
              النشر تحت {userBrand.name}
            </span>
          </div>
        )}

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          disabled={publishing}
          className={`w-full font-bold py-4 rounded-xl text-sm active:scale-[0.98] transition-colors disabled:opacity-50 ${
            publishAsBrand && userBrand
              ? "bg-brand-gold text-white hover:bg-brand-gold/90"
              : "bg-primary text-on-primary hover:bg-primary/90"
          }`}
        >
          {publishing
            ? "جارٍ النشر…"
            : publishAsBrand && userBrand
              ? `نشر باسم ${userBrand.name}`
              : "نشر الوصفة"}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
