"use client";

import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import { useTranslations } from "next-intl";

interface UpgradeModalProps {
  open: boolean;
  feature?: string;
  onClose: () => void;
}

export default function UpgradeModal({ open, feature, onClose }: UpgradeModalProps) {
  const t = useTranslations("upgradeModal");
  const tc = useTranslations("common");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface text-espresso rounded-2xl w-full max-w-sm p-6 text-center shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mx-auto mb-4 size-14 rounded-full bg-primary/10 flex items-center justify-center">
          <MaterialIcon icon="workspace_premium" className="text-primary text-3xl" />
        </div>

        {/* Title */}
        <h2 className="font-display text-xl mb-2">
          {t("title")}
        </h2>

        {/* Description */}
        <p className="text-sm text-espresso/70 leading-relaxed mb-6">
          {feature
            ? t("upgradeFor", { feature })
            : t("upgradeGeneric")}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors block"
          >
            {t("viewPlans")}
          </Link>
          <button
            onClick={onClose}
            className="w-full border border-espresso/15 rounded-xl px-5 py-3 font-semibold text-sm text-espresso/70 hover:border-primary/40 transition-colors"
          >
            {tc("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
