"use client";

import { useState, use } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";

export default function BrandVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [documents, setDocuments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Parse document URLs from newline-separated input
      const urls = documents
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);

      const res = await fetch("/api/brands/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: id,
          documents: urls.length > 0 ? JSON.stringify(urls) : undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "فشل تقديم طلب التوثيق.");
      }
    } catch {
      setError("خطأ في الشبكة. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background-light text-espresso flex items-center justify-center p-4">
        <div className="bg-surface border border-espresso/10 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <BrandIcon name="verified" className="text-3xl" />
          </div>
          <h2 className="text-xl mb-2">
            تم تقديم طلب التوثيق
          </h2>
          <p className="text-espresso/70 text-sm leading-relaxed">
            تم تقديم طلب توثيق علامتك التجارية وهو قيد المراجعة. سيتم إعلامك عند اتخاذ القرار.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light text-espresso">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href={`/brand/${id}`} aria-label="رجوع" className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">توثيق العلامة التجارية</h1>
      </header>

      <main className="max-w-md mx-auto p-4">
        <div className="bg-surface border border-espresso/10 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-5">
            <BrandIcon name="verified" className="text-3xl text-primary shrink-0" />
            <p className="text-sm text-espresso/70 leading-relaxed">
              قدّم المستندات لتوثيق علامتك التجارية. أدخل روابط المستندات الداعمة (رابط واحد في كل سطر).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="verify-documents" className="block text-sm font-semibold mb-1.5">
                روابط المستندات
              </label>
              <textarea
                id="verify-documents"
                dir="ltr"
                value={documents}
                onChange={(e) => setDocuments(e.target.value)}
                rows={4}
                placeholder="https://example.com/business-license.pdf&#10;https://example.com/certificate.pdf"
                className="w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm resize-none placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-espresso/60 mt-1.5 leading-relaxed">
                أدخل رابطاً واحداً في كل سطر. المقبول: رخصة تجارية، شهادة ضريبية، إلخ.
              </p>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "جارٍ التقديم…" : "تقديم طلب التوثيق"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
