"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

interface AdPlacement {
  id: string;
  /** Key under adminAds.placements */
  nameKey: string;
  slot: string;
  /** Key under adminAds.pages */
  pageKey: string;
  format: string;
  enabled: boolean;
}

const DEFAULT_PLACEMENTS: AdPlacement[] = [
  { id: "1", nameKey: "homeMid", slot: "home-mid", pageKey: "home", format: "horizontal", enabled: true },
  { id: "2", nameKey: "feed0", slot: "feed-0", pageKey: "feed", format: "horizontal", enabled: true },
  { id: "3", nameKey: "exploreTop", slot: "explore-top", pageKey: "explore", format: "horizontal", enabled: true },
  { id: "4", nameKey: "recipeMid", slot: "recipe-mid", pageKey: "recipe", format: "horizontal", enabled: true },
  { id: "5", nameKey: "recipeBottom", slot: "recipe-bottom", pageKey: "recipe", format: "rectangle", enabled: true },
];

export default function AdminAdsPage() {
  const [placements, setPlacements] = useState(DEFAULT_PLACEMENTS);
  const [adsenseId, setAdsenseId] = useState(process.env.NEXT_PUBLIC_ADSENSE_ID || "");
  const [saved, setSaved] = useState(false);
  const t = useTranslations("adminAds");
  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;
  const code = (chunks: ReactNode) => (
    <code className="bg-[#eef0e808] px-1.5 py-0.5 rounded text-xs">{chunks}</code>
  );

  const togglePlacement = (id: string) => {
    setPlacements((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleSave = () => {
    // In production, this would save to DB/env
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enabledCount = placements.filter((p) => p.enabled).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#eef0e8]">{t("title")}</h1>
          <p className="text-sm text-[#eef0e899] mt-1">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">save</span>
          {saved ? t("saved") : t("save")}
        </button>
      </div>

      {/* AdSense Configuration */}
      <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-6 mb-6">
        <h2 className="font-bold text-lg text-[#eef0e8] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-500">ads_click</span>
          Google AdSense
        </h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-[#eef0e8cc] mb-1">
              {t("publisherId")}
            </label>
            <input
              type="text"
              value={adsenseId}
              onChange={(e) => setAdsenseId(e.target.value)}
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              className="w-full px-4 py-2.5 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm"
            />
            <p className="text-xs text-[#eef0e880] mt-1">
              {t("publisherIdHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">monetization_on</span>
            </div>
            <span className="text-sm font-medium text-[#eef0e899]">{t("estRevenue")}</span>
          </div>
          <p className="text-2xl font-bold text-[#eef0e8]">$0.00</p>
          <p className="text-xs text-[#eef0e880] mt-1">{t("estRevenueHint")}</p>
        </div>
        <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">visibility</span>
            </div>
            <span className="text-sm font-medium text-[#eef0e899]">{t("impressions")}</span>
          </div>
          <p className="text-2xl font-bold text-[#eef0e8]">0</p>
          <p className="text-xs text-[#eef0e880] mt-1">{t("impressionsHint")}</p>
        </div>
        <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">ads_click</span>
            </div>
            <span className="text-sm font-medium text-[#eef0e899]">{t("activePlacements")}</span>
          </div>
          <p className="text-2xl font-bold text-[#eef0e8]">{enabledCount}/{placements.length}</p>
          <p className="text-xs text-[#eef0e880] mt-1">{t("activePlacementsHint")}</p>
        </div>
      </div>

      {/* Ad-Free Tiers Info */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">info</span>
          <div>
            <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">{t("rulesTitle")}</h3>
            <ul className="text-xs text-amber-700 dark:text-amber-400 mt-2 space-y-1">
              <li>{t.rich("rules.free", { b: strong })}</li>
              <li>{t.rich("rules.basic", { b: strong })}</li>
              <li>{t.rich("rules.premium", { b: strong })}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ad Placements */}
      <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#eef0e80d]">
          <h2 className="font-bold text-lg">{t("placementsTitle")}</h2>
        </div>
        <div className="divide-y divide-[#eef0e808]">
          {placements.map((placement) => (
            <div key={placement.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#eef0e805]">
              <div className="flex items-center gap-4">
                <div className={`size-10 rounded-lg flex items-center justify-center ${
                  placement.enabled
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-[#eef0e808]"
                }`}>
                  <span className={`material-symbols-outlined text-lg ${
                    placement.enabled
                      ? "text-green-600 dark:text-green-400"
                      : "text-[#eef0e899]"
                  }`}>
                    {placement.format === "rectangle" ? "crop_square" : "view_day"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#eef0e8]">{t(`placements.${placement.nameKey}`)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#eef0e899] bg-[#eef0e808] px-2 py-0.5 rounded">
                      {t(`pages.${placement.pageKey}`)}
                    </span>
                    <span className="text-xs text-[#eef0e880]">
                      {t("slot", { slot: placement.slot })}
                    </span>
                    <span className="text-xs text-[#eef0e880]">
                      {t("format", { format: placement.format })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => togglePlacement(placement.id)}
                role="switch"
                aria-checked={placement.enabled}
                aria-label={t(`placements.${placement.nameKey}`)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  placement.enabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    placement.enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Guide */}
      <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-6 mt-6">
        <h2 className="font-bold text-lg text-[#eef0e8] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#eef0e880]">integration_instructions</span>
          {t("guideTitle")}
        </h2>
        <ol className="text-sm text-[#eef0e8aa] space-y-3 list-decimal list-inside">
          <li>{t.rich("guide.step1", { b: strong })}</li>
          <li>{t.rich("guide.step2", { code })}</li>
          <li>{t.rich("guide.step3", { code, b: strong })}</li>
          <li>{t("guide.step4")}</li>
          <li>{t("guide.step5")}</li>
        </ol>
      </div>
    </div>
  );
}
