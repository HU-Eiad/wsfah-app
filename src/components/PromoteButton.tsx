"use client";

import { useState, useEffect } from "react";
import MaterialIcon from "./MaterialIcon";

interface PromoteButtonProps {
  companyId: string;
  companyName: string;
}

interface PricingOption {
  id: string;
  name: string;
  placement: string;
  duration: number;
  price: number;
  currency: string;
  discount: number;
}

export default function PromoteButton({ companyId, companyName }: PromoteButtonProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState("HOME_TOP");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | "conflict" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [pricing, setPricing] = useState<PricingOption[]>([]);
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/promotion-pricing")
      .then((r) => r.json())
      .then((data) => setPricing(data))
      .catch(() => {});
  }, [open]);

  const filteredPricing = pricing.filter(
    (p) => p.placement === placement || p.placement === "BOTH"
  );

  const selectedPlan = pricing.find((p) => p.id === selectedPricing);
  const finalPrice = selectedPlan
    ? selectedPlan.price * (1 - selectedPlan.discount / 100)
    : null;

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, placement, message }),
      });
      if (res.ok) {
        setResult("success");
        setMessage("");
        setTimeout(() => { setOpen(false); setResult(null); }, 2000);
      } else if (res.status === 409) {
        setResult("conflict");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "تعذّر إرسال الطلب");
        setResult("error");
      }
    } catch {
      setErrorMsg("خطأ في الشبكة");
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-espresso/15 px-4 py-3 rounded-xl flex items-center gap-2 font-semibold text-sm hover:border-primary/40 transition-colors active:scale-95"
      >
        <MaterialIcon icon="campaign" className="text-lg text-primary" />
        ترويج
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-surface rounded-t-3xl sm:rounded-2xl shadow-sm w-full max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-espresso/10">
              <div>
                <h3 className="font-display text-xl">طلب ترويج</h3>
                <p className="text-sm text-espresso/60" dir="auto">{companyName}</p>
              </div>
              <button
                onClick={() => { setOpen(false); setResult(null); }}
                aria-label="إغلاق"
                className="size-10 rounded-full hover:bg-oat-milk flex items-center justify-center"
              >
                <MaterialIcon icon="close" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Placement */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  أين تريد الترويج؟
                </label>
                <div className="space-y-2">
                  {[
                    { value: "HOME_TOP", label: "الصفحة الرئيسية", desc: "يظهر في أعلى الصفحة الرئيسية", icon: "home" },
                    { value: "EXPLORE_TOP", label: "صفحة الاستكشاف", desc: "بانر في أعلى معرض الاستكشاف", icon: "explore" },
                    { value: "BOTH", label: "كلا الصفحتين", desc: "أقصى ظهور في الرئيسية والاستكشاف", icon: "star" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setPlacement(opt.value); setSelectedPricing(null); }}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors text-start ${
                        placement === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-espresso/10 hover:border-primary/40"
                      }`}
                    >
                      <div className={`size-10 rounded-xl flex items-center justify-center ${
                        placement === opt.value ? "bg-primary text-on-primary" : "bg-oat-milk text-espresso/60"
                      }`}>
                        <MaterialIcon icon={opt.icon} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-espresso/60">{opt.desc}</p>
                      </div>
                      {placement === opt.value && (
                        <MaterialIcon icon="check_circle" filled className="text-primary ms-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Plans */}
              {filteredPricing.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold mb-3">
                    اختر باقة
                  </label>
                  <div className="space-y-2">
                    {filteredPricing.map((p) => {
                      const final = p.price * (1 - p.discount / 100);
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPricing(p.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors text-start ${
                            selectedPricing === p.id
                              ? "border-primary bg-primary/10"
                              : "border-espresso/10 hover:border-primary/40"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-sm" dir="auto">{p.name}</p>
                            <p className="text-xs text-espresso/60">{p.duration} يوم</p>
                          </div>
                          <div className="text-end">
                            {p.discount > 0 ? (
                              <>
                                <p className="text-xs text-espresso/50 line-through tabular-nums">${p.price.toFixed(2)}</p>
                                <p className="font-bold text-primary tabular-nums">${final.toFixed(2)}</p>
                                <span className="text-[11px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded-full font-bold">
                                  خصم {p.discount}%
                                </span>
                              </>
                            ) : (
                              <p className="font-bold tabular-nums">${p.price.toFixed(2)}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label htmlFor="promote-message" className="block text-sm font-semibold mb-2">
                  رسالة للمشرف (اختياري)
                </label>
                <textarea
                  id="promote-message"
                  dir="auto"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="أخبرنا عن أهداف ترويجك…"
                  maxLength={500}
                  rows={3}
                  className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm resize-none placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Price Summary */}
              {selectedPlan && finalPrice !== null && (
                <div className="bg-oat-milk rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" dir="auto">{selectedPlan.name}</p>
                      <p className="text-xs text-espresso/60">{selectedPlan.duration} يوم ترويج</p>
                    </div>
                    <div className="text-end">
                      <p className="font-display text-2xl text-primary tabular-nums">${finalPrice.toFixed(2)}</p>
                      {selectedPlan.discount > 0 && (
                        <p className="text-xs text-green-700 dark:text-green-400">توفر ${(selectedPlan.price - finalPrice).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-surface border border-espresso/10 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <MaterialIcon icon="info" className="text-primary mt-0.5" />
                  <div className="text-xs text-espresso/70 leading-relaxed">
                    <p className="font-bold text-espresso mb-1">كيف تعمل؟</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>سيتم مراجعة طلبك من قبل المشرف</li>
                      <li>بعد الموافقة، ستظهر علامتك التجارية في قسم الترويج</li>
                      <li>سيتم ترتيب الدفع بعد الموافقة</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Result Messages */}
              {result === "success" && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm font-medium">
                  <MaterialIcon icon="check_circle" filled className="text-green-600" />
                  تم إرسال الطلب، سيتم مراجعته قريباً.
                </div>
              )}
              {result === "conflict" && (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-sm font-medium">
                  <MaterialIcon icon="warning" className="text-amber-600" />
                  لديك طلب ترويج قيد المراجعة بالفعل.
                </div>
              )}
              {result === "error" && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm font-medium">
                  <MaterialIcon icon="error" className="text-red-600" />
                  {errorMsg}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || result === "success"}
                className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="size-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <MaterialIcon icon="send" className="text-lg" />
                    إرسال طلب الترويج
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
