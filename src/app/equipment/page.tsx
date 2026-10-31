"use client";

import { useState, useEffect, useCallback } from "react";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  imageUrl: string | null;
  notes: string | null;
}

const CATEGORIES = [
  { value: "grinder", label: "مطحنة", icon: "grain" },
  { value: "kettle", label: "غلاية", icon: "water_drop" },
  { value: "dripper", label: "قطارة", icon: "filter_alt" },
  { value: "scale", label: "ميزان", icon: "scale" },
  { value: "espresso_machine", label: "ماكينة إسبريسو", icon: "coffee_maker" },
  { value: "other", label: "أخرى", icon: "devices_other" },
];

/** Equipment category → WSFA brand icon where one matches; others keep MaterialIcon. */
const CATEGORY_BRAND_ICONS: Record<string, string> = {
  grinder: "grind",
  dripper: "method-v60",
  scale: "scale",
  espresso_machine: "method-espresso-machine",
};

function CategoryIcon({ value, icon, className = "" }: { value: string; icon: string; className?: string }) {
  const brand = CATEGORY_BRAND_ICONS[value];
  return brand ? <BrandIcon name={brand} className={className} /> : <MaterialIcon icon={icon} className={className} />;
}

export default function EquipmentPage() {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "grinder", brand: "", model: "", notes: "" });

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/equipment");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function resetForm() {
    setForm({ name: "", category: "grinder", brand: "", model: "", notes: "" });
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(item: EquipmentItem) {
    setForm({
      name: item.name,
      category: item.category,
      brand: item.brand || "",
      model: item.model || "",
      notes: item.notes || "",
    });
    setEditId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    const method = editId ? "PATCH" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    const res = await fetch("/api/equipment", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      resetForm();
      fetchItems();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد إزالة هذه المعدات؟")) return;
    const res = await fetch(`/api/equipment?id=${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const getCategoryInfo = (cat: string) => CATEGORIES.find((c) => c.value === cat) || CATEGORIES[5];

  const grouped = CATEGORIES.reduce<Record<string, EquipmentItem[]>>((acc, cat) => {
    const filtered = items.filter((i) => i.category === cat.value);
    if (filtered.length > 0) acc[cat.value] = filtered;
    return acc;
  }, {});

  const inputClass =
    "w-full bg-surface border border-espresso/15 rounded-xl px-4 py-3 text-sm placeholder:text-espresso/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-xs font-semibold text-espresso/70 mb-2";

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/profile" aria-label="رجوع" className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">معداتي</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} aria-label="إضافة معدات" className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="add" className="text-primary" />
        </button>
      </header>

      <main className="flex-1 pb-28 max-w-screen-sm mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
            <p className="text-sm text-espresso/70 leading-relaxed mb-5">
              لا توجد معدات بعد. تتبع أدوات التحضير للحصول على اقتراحات وصفات مخصصة.
            </p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              إضافة معدات
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-8">
            {/* Summary */}
            <div className="bg-surface rounded-2xl border border-espresso/10 p-4">
              <h2 className="text-xl mb-4">ملخص المعدات</h2>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.filter((c) => items.some((i) => i.category === c.value)).map((cat) => {
                  const count = items.filter((i) => i.category === cat.value).length;
                  return (
                    <div key={cat.value} className="bg-oat-milk rounded-xl p-3 text-center flex flex-col items-center">
                      <CategoryIcon value={cat.value} icon={cat.icon} className="text-primary text-xl" />
                      <p className="font-display text-lg mt-1">{count}</p>
                      <p className="text-[11px] text-espresso/60">{cat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Equipment List by Category */}
            {Object.entries(grouped).map(([catValue, catItems]) => {
              const cat = getCategoryInfo(catValue);
              return (
                <section key={catValue}>
                  <h2 className="text-xl mb-4 flex items-center gap-2">
                    <CategoryIcon value={cat.value} icon={cat.icon} className="text-xl text-primary" />
                    {cat.label}
                  </h2>
                  <div className="bg-surface rounded-2xl border border-espresso/10 divide-y divide-espresso/10">
                    {catItems.map((item) => (
                      <div key={item.id} className="p-4 flex items-start gap-3">
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <CategoryIcon value={cat.value} icon={cat.icon} className="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" dir="auto">{item.name}</p>
                          {(item.brand || item.model) && (
                            <p className="text-xs text-espresso/60" dir="auto">
                              {[item.brand, item.model].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {item.notes && <p className="text-xs text-espresso/60 leading-relaxed mt-1" dir="auto">{item.notes}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(item)} aria-label="تعديل" className="size-9 rounded-full hover:bg-oat-milk flex items-center justify-center">
                            <MaterialIcon icon="edit" className="text-base text-espresso/60" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} aria-label="حذف" className="size-9 rounded-full hover:bg-red-50 flex items-center justify-center">
                            <MaterialIcon icon="delete" className="text-base text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-surface text-espresso rounded-t-3xl sm:rounded-2xl shadow-sm w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-espresso/10">
              <h3 className="font-display text-xl">{editId ? "تعديل المعدات" : "إضافة معدات"}</h3>
              <button onClick={resetForm} aria-label="إغلاق" className="size-10 rounded-full hover:bg-oat-milk flex items-center justify-center">
                <MaterialIcon icon="close" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="equipment-name" className={labelClass}>الاسم</label>
                <input id="equipment-name" dir="auto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: Comandante C40" className={inputClass} />
              </div>
              <div>
                <label htmlFor="equipment-category" className={labelClass}>الفئة</label>
                <select id="equipment-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="equipment-brand" className={labelClass}>العلامة التجارية</label>
                  <input id="equipment-brand" dir="auto" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="اختياري" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="equipment-model" className={labelClass}>الموديل</label>
                  <input id="equipment-model" dir="auto" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="اختياري" className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="equipment-notes" className={labelClass}>ملاحظات</label>
                <textarea id="equipment-notes" dir="auto" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="أي ملاحظات..." className={`${inputClass} leading-relaxed resize-none`} />
              </div>
              <button onClick={handleSave} disabled={!form.name} className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {editId ? "تحديث" : "إضافة معدات"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
