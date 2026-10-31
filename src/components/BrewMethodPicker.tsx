"use client";

import { useState, useEffect } from "react";
import MaterialIcon from "./MaterialIcon";
import BrandIcon from "./BrandIcon";

interface Template {
  id: string;
  name: string;
  icon: string;
  temperature: string;
  ratio: string;
  grindSize: string;
  brewTimeSec: number;
  description: string | null;
  steps: string | null;
}

interface BrewMethodPickerProps {
  onSelect: (template: {
    temperature: string;
    ratio: string;
    grindSize: string;
    brewTimeSec: number;
    steps?: string[];
  }) => void;
}

// Default built-in templates (used if no DB templates exist)
const DEFAULT_TEMPLATES = [
  { name: "V60 ترشيح", icon: "filter_alt", temperature: "93°C", ratio: "1:15", grindSize: "متوسط ناعم", brewTimeSec: 210, description: "نكهات نظيفة ومشرقة" },
  { name: "ايروبريس", icon: "coffee_maker", temperature: "85°C", ratio: "1:12", grindSize: "ناعم", brewTimeSec: 120, description: "ناعم ومركز" },
  { name: "فرنش بريس", icon: "coffee", temperature: "96°C", ratio: "1:15", grindSize: "خشن", brewTimeSec: 240, description: "قوام كامل وغني" },
  { name: "إسبريسو", icon: "local_cafe", temperature: "93°C", ratio: "1:2", grindSize: "ناعم جداً", brewTimeSec: 28, description: "مكثف مع كريما" },
  { name: "كولد برو", icon: "ac_unit", temperature: "حرارة الغرفة", ratio: "1:8", grindSize: "خشن", brewTimeSec: 43200, description: "ناعم وحلو، ١٢ ساعة" },
  { name: "كيمكس", icon: "science", temperature: "92°C", ratio: "1:16", grindSize: "متوسط خشن", brewTimeSec: 270, description: "نظيف وحلو" },
  { name: "موكا بوت", icon: "local_fire_department", temperature: "حرارة متوسطة", ratio: "1:7", grindSize: "ناعم", brewTimeSec: 300, description: "قوي، على الموقد" },
  { name: "تركي", icon: "emoji_food_beverage", temperature: "حرارة هادئة", ratio: "1:10", grindSize: "ناعم جداً", brewTimeSec: 180, description: "تقليدي، بدون فلتر" },
];

/** Brew method name → WSFA brand icon; null keeps the Material icon. */
const METHOD_ICON_MATCHERS: [string[], string][] = [
  [["v60"], "method-v60"],
  [["ايروبريس", "إيروبريس", "aeropress"], "method-aeropress"],
  [["فرنش", "french"], "method-french-press"],
  [["إسبريسو", "اسبريسو", "espresso"], "method-espresso-machine"],
  [["كولد", "cold"], "method-cold-brew"],
  [["كيمكس", "chemex"], "method-chemex"],
  [["موكا", "moka"], "method-moka-pot"],
  [["تركي", "turkish"], "method-turkish"],
];

function methodBrandIcon(name: string): string | null {
  const n = name.toLowerCase();
  for (const [keys, icon] of METHOD_ICON_MATCHERS) {
    if (keys.some((k) => n.includes(k))) return icon;
  }
  return null;
}

export default function BrewMethodPicker({ onSelect }: BrewMethodPickerProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    fetch("/api/brewing-templates")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTemplates(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  const items = templates.length > 0
    ? templates.map((t) => ({
        name: t.name,
        icon: t.icon,
        temperature: t.temperature,
        ratio: t.ratio,
        grindSize: t.grindSize,
        brewTimeSec: t.brewTimeSec,
        description: t.description,
        steps: t.steps ? JSON.parse(t.steps) : undefined,
      }))
    : DEFAULT_TEMPLATES;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
      >
        <MaterialIcon icon="auto_awesome" className="text-lg" />
        استخدم القالب
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-surface text-espresso rounded-2xl shadow-sm w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-espresso/10 sticky top-0 bg-surface z-10 rounded-t-2xl">
              <h3 className="font-display text-xl">طريقة التحضير</h3>
              <button onClick={() => setOpen(false)} aria-label="إغلاق" className="size-10 rounded-full hover:bg-oat-milk flex items-center justify-center">
                <MaterialIcon icon="close" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {items.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    onSelect({
                      temperature: t.temperature,
                      ratio: t.ratio,
                      grindSize: t.grindSize,
                      brewTimeSec: t.brewTimeSec,
                      steps: "steps" in t ? t.steps : undefined,
                    });
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-espresso/10 hover:border-primary/40 hover:bg-primary/5 transition-colors text-center"
                >
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {methodBrandIcon(t.name) ? (
                      <BrandIcon name={methodBrandIcon(t.name)!} className="text-[26px]" />
                    ) : (
                      <MaterialIcon icon={t.icon} className="text-2xl" />
                    )}
                  </div>
                  <p dir="auto" className="font-bold text-sm">{t.name}</p>
                  <p dir="auto" className="text-[11px] text-espresso/60 leading-relaxed">{t.description}</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <span dir="auto" className="inline-flex items-center gap-0.5 text-[11px] bg-oat-milk px-2 py-0.5 rounded-full text-espresso/70">
                      <BrandIcon name="thermometer" className="text-[11px]" />
                      {t.temperature}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] bg-oat-milk px-2 py-0.5 rounded-full text-espresso/70">
                      <BrandIcon name="scale" className="text-[11px]" />
                      {t.ratio}
                    </span>
                    <span dir="auto" className="inline-flex items-center gap-0.5 text-[11px] bg-oat-milk px-2 py-0.5 rounded-full text-espresso/70">
                      <BrandIcon name="grind" className="text-[11px]" />
                      {t.grindSize}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
