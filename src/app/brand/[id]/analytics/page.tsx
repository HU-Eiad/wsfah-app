"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import MaterialIcon from "@/components/MaterialIcon";

interface Analytics {
  totalViews: number;
  uniqueVisitors: number;
  viewsByPage: { page: string; count: number }[];
  recentViews: { date: string; count: number }[];
}

export default function BrandAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/brand/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "تعذّر تحميل التحليلات");
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const header = (
    <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
      <Link href={`/brand/${id}`} aria-label="رجوع" className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk">
        <MaterialIcon icon="arrow_forward" />
      </Link>
      <h1 className="text-xl flex-1">تحليلات العلامة التجارية</h1>
    </header>
  );

  if (loading) {
    return (
      <div className="bg-background-light text-espresso min-h-screen">
        {header}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-label="جارٍ تحميل التحليلات…" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-light text-espresso min-h-screen">
        {header}
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="bg-surface rounded-2xl border border-espresso/10 p-6 text-center max-w-sm w-full">
            <MaterialIcon icon="lock" className="text-3xl text-red-600 mb-2" />
            <h2 className="text-xl mb-2">الوصول مرفوض</h2>
            <p className="text-sm text-espresso/70 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxPageCount = Math.max(...data.viewsByPage.map((v) => v.count), 1);

  return (
    <div className="bg-background-light text-espresso min-h-screen">
      {header}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface rounded-2xl p-4 border border-espresso/10">
            <p className="text-sm text-espresso/60 mb-1">
              إجمالي المشاهدات
            </p>
            <p className="font-display text-3xl tabular-nums">
              {data.totalViews.toLocaleString("en-US")}
            </p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-espresso/10">
            <p className="text-sm text-espresso/60 mb-1">
              الزوار الفريدون
            </p>
            <p className="font-display text-3xl tabular-nums">
              {data.uniqueVisitors.toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {/* Views by Page - Bar Chart */}
        {data.viewsByPage.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl mb-4">المشاهدات حسب الصفحة</h2>
            <div className="bg-surface rounded-2xl border border-espresso/10 p-4 space-y-4">
              {data.viewsByPage
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div key={item.page}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-espresso/80" dir="auto">
                        {item.page}
                      </span>
                      <span className="text-espresso/60 font-semibold tabular-nums">
                        {item.count.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="w-full bg-oat-milk rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(item.count / maxPageCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Recent Views per Day */}
        {data.recentViews.length > 0 && (
          <section>
            <h2 className="text-xl mb-4">المشاهدات الأخيرة (آخر 30 يوم)</h2>
            <div className="bg-surface rounded-2xl border border-espresso/10 divide-y divide-espresso/10">
              {data.recentViews.map((item) => (
                <div
                  key={item.date}
                  className="flex justify-between px-4 py-3 text-sm"
                >
                  <span className="text-espresso/70 tabular-nums" dir="ltr">
                    {item.date}
                  </span>
                  <span className="font-semibold">
                    <span className="tabular-nums">{item.count.toLocaleString("en-US")}</span> مشاهدة
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
