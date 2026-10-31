"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const REASONS = [
  { value: "spam", labelKey: "reasons.spam" },
  { value: "inappropriate", labelKey: "reasons.inappropriate" },
  { value: "harassment", labelKey: "reasons.harassment" },
  { value: "misinformation", labelKey: "reasons.misinformation" },
  { value: "other", labelKey: "reasons.other" },
];

interface ReportButtonProps {
  entityType: string;
  entityId: string;
}

export default function ReportButton({ entityType, entityId }: ReportButtonProps) {
  const t = useTranslations("reportButton");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details || undefined, entityType, entityId }),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: t("success") });
        setReason("");
        setDetails("");
        setTimeout(() => {
          setOpen(false);
          setFeedback(null);
        }, 2000);
      } else {
        const data = await res.json();
        setFeedback({ type: "error", message: data.error || t("errorFailed") });
      }
    } catch {
      setFeedback({ type: "error", message: t("errorNetwork") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-espresso/60 hover:text-red-600 transition-colors text-sm"
        title={t("report")}
      >
        {t("report")}
      </button>

      {open && (
        <div className="absolute start-0 top-8 z-50 w-72 bg-surface border border-espresso/10 rounded-2xl shadow-sm p-4">
          <h4 className="font-display text-lg mb-3">{t("heading")}</h4>

          <div className="space-y-2 mb-3">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors ${
                  reason === r.value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-espresso/70 hover:bg-oat-milk"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    reason === r.value ? "border-primary" : "border-espresso/25"
                  }`}
                >
                  {reason === r.value && <span className="w-2 h-2 rounded-full bg-primary" />}
                </span>
                {t(r.labelKey)}
              </label>
            ))}
          </div>

          <textarea
            aria-label={t("detailsLabel")}
            dir="auto"
            placeholder={t("detailsPlaceholder")}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm resize-none placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 mb-3"
          />

          {feedback && (
            <p
              className={`text-xs mb-2 ${
                feedback.type === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setFeedback(null);
              }}
              className="flex-1 px-3 py-2.5 rounded-xl border border-espresso/15 text-sm font-semibold hover:border-primary/40 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
            >
              {submitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
