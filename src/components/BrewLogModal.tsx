"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import MaterialIcon from "./MaterialIcon";
import BrandIcon from "./BrandIcon";

// Stored values stay Arabic (sent to the API); labels come from messages.
const FLAVOR_OPTIONS = [
  { value: "فاكهي", key: "fruity" }, { value: "توت", key: "berry" }, { value: "حمضيات", key: "citrus" }, { value: "استوائي", key: "tropical" },
  { value: "مكسرات", key: "nutty" }, { value: "شوكولاتة", key: "chocolate" }, { value: "كراميل", key: "caramel" }, { value: "فانيلا", key: "vanilla" },
  { value: "زهري", key: "floral" }, { value: "أعشاب", key: "herbal" }, { value: "حار", key: "spicy" }, { value: "مدخن", key: "smoky" },
  { value: "عسل", key: "honey" }, { value: "زبدة", key: "buttery" }, { value: "ترابي", key: "earthy" }, { value: "خشبي", key: "woody" },
];

const GRIND_SIZES = [
  { value: "ناعم جداً", key: "extraFine" },
  { value: "ناعم", key: "fine" },
  { value: "متوسط ناعم", key: "mediumFine" },
  { value: "متوسط", key: "medium" },
  { value: "متوسط خشن", key: "mediumCoarse" },
  { value: "خشن", key: "coarse" },
];

interface BrewLogModalProps {
  recipeId?: string;
  recipeName?: string;
  defaultParams?: {
    grindSize?: string;
    waterTemp?: string;
    brewTimeSec?: number;
    ratio?: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

export default function BrewLogModal({ recipeId, recipeName, defaultParams, onClose, onSaved }: BrewLogModalProps) {
  const t = useTranslations("brewLogModal");
  const [title, setTitle] = useState(recipeName ? t("defaultTitleWithRecipe", { name: recipeName }) : t("defaultTitle"));
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [grindSize, setGrindSize] = useState(defaultParams?.grindSize || "");
  const [waterTemp, setWaterTemp] = useState(defaultParams?.waterTemp || "");
  const [brewTime, setBrewTime] = useState(defaultParams?.brewTimeSec ? String(defaultParams.brewTimeSec) : "");
  const [coffeeGrams, setCoffeeGrams] = useState("");
  const [waterMl, setWaterMl] = useState("");

  // Tasting notes
  const [acidity, setAcidity] = useState(2.5);
  const [body, setBody] = useState(2.5);
  const [sweetness, setSweetness] = useState(2.5);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"brew" | "taste">("brew");

  const toggleFlavor = (f: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/brew-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: recipeId || null,
          title,
          notes: notes || null,
          rating: rating || null,
          grindSize: grindSize || null,
          waterTemp: waterTemp || null,
          brewTime: brewTime || null,
          coffeeGrams: coffeeGrams || null,
          waterMl: waterMl || null,
          acidity,
          body: body,
          sweetness,
          flavorNotes: selectedFlavors.length > 0 ? selectedFlavors : null,
        }),
      });
      if (res.ok) {
        onSaved();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "flex items-center gap-1.5 text-xs font-semibold text-espresso/70 mb-2";

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-surface text-espresso rounded-t-3xl sm:rounded-2xl shadow-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-espresso/10 sticky top-0 bg-surface z-10">
          <div className="min-w-0">
            <h3 className="font-display text-xl">{t("heading")}</h3>
            {recipeName && <p dir="auto" className="text-sm text-espresso/60 truncate">{recipeName}</p>}
          </div>
          <button onClick={onClose} aria-label={t("close")} className="size-10 rounded-full hover:bg-oat-milk flex items-center justify-center shrink-0">
            <MaterialIcon icon="close" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-espresso/10">
          {(["brew", "taste"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                tab === tabKey
                  ? "text-primary border-primary"
                  : "text-espresso/60 border-transparent hover:text-espresso"
              }`}
            >
              {tabKey === "brew" ? t("tabs.brew") : t("tabs.taste")}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {tab === "brew" ? (
            <>
              {/* Title */}
              <div>
                <label htmlFor="brewlog-title" className={labelClass}>{t("titleLabel")}</label>
                <input id="brewlog-title" dir="auto" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
              </div>

              {/* Rating */}
              <div>
                <p className={labelClass}>{t("ratingLabel")}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setRating(v)}
                      onMouseEnter={() => setHoverRating(v)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={t("ratingOf", { value: v })}
                      className="p-1"
                    >
                      <MaterialIcon
                        icon="star"
                        filled={v <= (hoverRating || rating)}
                        className={`text-2xl ${v <= (hoverRating || rating) ? "text-crema" : "text-espresso/15"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Brew Params Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="brewlog-coffee" className={labelClass}>
                    <BrandIcon name="bean" className="text-base text-primary" />
                    {t("coffeeGrams")}
                  </label>
                  <input id="brewlog-coffee" type="number" value={coffeeGrams} onChange={(e) => setCoffeeGrams(e.target.value)} placeholder="18" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="brewlog-water" className={labelClass}>
                    <BrandIcon name="drop" className="text-base text-primary" />
                    {t("waterMl")}
                  </label>
                  <input id="brewlog-water" type="number" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} placeholder="300" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="brewlog-temp" className={labelClass}>
                    <BrandIcon name="thermometer" className="text-base text-primary" />
                    {t("waterTemp")}
                  </label>
                  <input id="brewlog-temp" type="number" value={waterTemp} onChange={(e) => setWaterTemp(e.target.value)} placeholder="93" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="brewlog-time" className={labelClass}>
                    <BrandIcon name="timer" className="text-base text-primary" />
                    {t("brewTime")}
                  </label>
                  <input id="brewlog-time" type="number" value={brewTime} onChange={(e) => setBrewTime(e.target.value)} placeholder="240" className={inputClass} />
                </div>
              </div>

              {/* Grind Size */}
              <div>
                <label htmlFor="brewlog-grind" className={labelClass}>
                  <BrandIcon name="grind" className="text-base text-primary" />
                  {t("grindSize")}
                </label>
                <select id="brewlog-grind" value={grindSize} onChange={(e) => setGrindSize(e.target.value)} className={inputClass}>
                  <option value="">{t("choose")}</option>
                  {GRIND_SIZES.map((g) => <option key={g.value} value={g.value}>{t(`grind.${g.key}`)}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="brewlog-notes" className={labelClass}>{t("notesLabel")}</label>
                <textarea id="brewlog-notes" dir="auto" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("notesPlaceholder")} className={`${inputClass} leading-relaxed resize-none`} />
              </div>
            </>
          ) : (
            <>
              {/* Tasting Sliders */}
              <div className="space-y-5">
                {[
                  { label: t("taste.acidity"), value: acidity, set: setAcidity, low: t("taste.acidityLow"), high: t("taste.acidityHigh") },
                  { label: t("taste.body"), value: body, set: setBody, low: t("taste.bodyLow"), high: t("taste.bodyHigh") },
                  { label: t("taste.sweetness"), value: sweetness, set: setSweetness, low: t("taste.sweetnessLow"), high: t("taste.sweetnessHigh") },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-semibold">{s.label}</label>
                      <span className="text-sm font-bold text-primary tabular-nums">{s.value.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={s.value}
                      onChange={(e) => s.set(parseFloat(e.target.value))}
                      aria-label={s.label}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[11px] text-espresso/60 mt-0.5">
                      <span>{s.low}</span>
                      <span>{s.high}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Flavor Tags */}
              <div>
                <p className="text-sm font-semibold mb-3">{t("flavorsLabel")}</p>
                <div className="flex flex-wrap gap-2">
                  {FLAVOR_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => toggleFlavor(f.value)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                        selectedFlavors.includes(f.value)
                          ? "bg-primary text-on-primary"
                          : "bg-surface border border-espresso/10 text-espresso/70 hover:border-primary/40"
                      }`}
                    >
                      {t(`flavors.${f.key}`)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="size-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <MaterialIcon icon="save" className="text-lg" />
                {t("saveLog")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
