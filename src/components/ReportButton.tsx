"use client";

import { useState } from "react";

const REASONS = [
  { value: "spam", label: "بريد مزعج" },
  { value: "inappropriate", label: "محتوى غير لائق" },
  { value: "harassment", label: "تحرش" },
  { value: "misinformation", label: "معلومات مضللة" },
  { value: "other", label: "أخرى" },
];

interface ReportButtonProps {
  entityType: string;
  entityId: string;
}

export default function ReportButton({ entityType, entityId }: ReportButtonProps) {
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
        setFeedback({ type: "success", message: "تم إرسال البلاغ. شكراً لك." });
        setReason("");
        setDetails("");
        setTimeout(() => {
          setOpen(false);
          setFeedback(null);
        }, 2000);
      } else {
        const data = await res.json();
        setFeedback({ type: "error", message: data.error || "فشل إرسال البلاغ." });
      }
    } catch {
      setFeedback({ type: "error", message: "خطأ في الشبكة. يرجى المحاولة مرة أخرى." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-espresso/60 hover:text-red-600 transition-colors text-sm"
        title="إبلاغ"
      >
        إبلاغ
      </button>

      {open && (
        <div className="absolute start-0 top-8 z-50 w-72 bg-surface border border-espresso/10 rounded-2xl shadow-sm p-4">
          <h4 className="font-display text-lg mb-3">الإبلاغ عن محتوى</h4>

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
                {r.label}
              </label>
            ))}
          </div>

          <textarea
            aria-label="تفاصيل إضافية"
            dir="auto"
            placeholder="تفاصيل إضافية (اختياري)"
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
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
            >
              {submitting ? "جارٍ الإرسال…" : "إرسال"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
