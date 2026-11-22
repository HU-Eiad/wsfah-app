"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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

// Default built-in templates (used if no DB templates exist).
// Display text lives in messages (brewMethodPicker.templates.<key>); the translated
// strings are what gets passed to onSelect, i.e. the current UI language.
const DEFAULT_TEMPLATES = [
  { key: "v60", icon: "filter_alt", temperature: "93°C", ratio: "1:15", brewTimeSec: 210 },
  { key: "aeropress", icon: "coffee_maker", temperature: "85°C", ratio: "1:12", brewTimeSec: 120 },
  { key: "frenchPress", icon: "coffee", temperature: "96°C", ratio: "1:15", brewTimeSec: 240 },
  { key: "espresso", icon: "local_cafe", temperature: "93°C", ratio: "1:2", brewTimeSec: 28 },
  { key: "coldBrew", icon: "ac_unit", temperature: null, ratio: "1:8", brewTimeSec: 43200 },
  { key: "chemex", icon: "science", temperature: "92°C", ratio: "1:16", brewTimeSec: 270 },
  { key: "mokaPot", icon: "local_fire_department", temperature: null, ratio: "1:7", brewTimeSec: 300 },
  { key: "turkish", icon: "emoji_food_beverage", temperature: null, ratio: "1:10", brewTimeSec: 180 },
] as const;

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
  const t = useTranslations("brewMethodPicker");
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
    ? templates.map((tpl) => ({
        name: tpl.name,
        icon: tpl.icon,
        temperature: tpl.temperature,
        ratio: tpl.ratio,
        grindSize: tpl.grindSize,
        brewTimeSec: tpl.brewTimeSec,
        description: tpl.description,
        steps: tpl.steps ? JSON.parse(tpl.steps) : undefined,
      }))
    : DEFAULT_TEMPLATES.map((tpl) => ({
        name: t(`templates.${tpl.key}.name`),
        icon: tpl.icon,
        temperature: tpl.temperature ?? t(`templates.${tpl.key}.temperature`),
        ratio: tpl.ratio,
        grindSize: t(`templates.${tpl.key}.grindSize`),
        brewTimeSec: tpl.brewTimeSec,
        description: t(`templates.${tpl.key}.description`),
      }));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
      >
        <MaterialIcon icon="auto_awesome" className="text-lg" />
        {t("useTemplate")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] glass-scrim flex items-end sm:items-center justify-center p-4">
          <div className="glass-panel text-espresso rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-espresso/10 sticky top-0 glass-bar z-10 rounded-t-2xl">
              <h3 className="font-display text-xl">{t("title")}</h3>
              <button onClick={() => setOpen(false)} aria-label={t("close")} className="size-10 rounded-full hover:bg-oat-milk flex items-center justify-center">
                <MaterialIcon icon="close" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {items.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => {
                    onSelect({
                      temperature: tpl.temperature,
                      ratio: tpl.ratio,
                      grindSize: tpl.grindSize,
                      brewTimeSec: tpl.brewTimeSec,
                      steps: "steps" in tpl ? tpl.steps : undefined,
                    });
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-espresso/10 hover:border-primary/40 hover:bg-primary/5 transition-colors text-center"
                >
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {methodBrandIcon(tpl.name) ? (
                      <BrandIcon name={methodBrandIcon(tpl.name)!} className="text-[26px]" />
                    ) : (
                      <MaterialIcon icon={tpl.icon} className="text-2xl" />
                    )}
                  </div>
                  <p dir="auto" className="font-bold text-sm">{tpl.name}</p>
                  <p dir="auto" className="text-[11px] text-espresso/60 leading-relaxed">{tpl.description}</p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <span dir="auto" className="inline-flex items-center gap-0.5 text-[11px] bg-oat-milk px-2 py-0.5 rounded-full text-espresso/70">
                      <BrandIcon name="thermometer" className="text-[11px]" />
                      {tpl.temperature}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] bg-oat-milk px-2 py-0.5 rounded-full text-espresso/70">
                      <BrandIcon name="scale" className="text-[11px]" />
                      {tpl.ratio}
                    </span>
                    <span dir="auto" className="inline-flex items-center gap-0.5 text-[11px] bg-oat-milk px-2 py-0.5 rounded-full text-espresso/70">
                      <BrandIcon name="grind" className="text-[11px]" />
                      {tpl.grindSize}
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
