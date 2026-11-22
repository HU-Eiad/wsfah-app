"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Reward {
  id: string;
  title: string;
  category: string;
  pointsCost: number;
  imageUrl: string | null;
  isEnabled: boolean;
  _count: { redemptions: number };
}

const REWARD_CATEGORIES = ["Discount", "Merchandise", "Experience", "Digital", "Other"];

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("adminRewards");
  const ta = useTranslations("admin");
  const categoryLabel = (c: string) => (t.has(`categories.${c}`) ? t(`categories.${c}`) : c);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Discount",
    pointsCost: "500",
    imageUrl: "",
  });

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rewards");
      const data = await res.json();
      setRewards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  function resetForm() {
    setForm({ title: "", category: "Discount", pointsCost: "500", imageUrl: "" });
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(r: Reward) {
    setForm({
      title: r.title,
      category: r.category,
      pointsCost: String(r.pointsCost),
      imageUrl: r.imageUrl || "",
    });
    setEditId(r.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    const method = editId ? "PATCH" : "POST";
    const body = editId ? { id: editId, ...form } : form;
    const res = await fetch("/api/admin/rewards", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      resetForm();
      fetchRewards();
    }
  }

  async function toggleEnabled(id: string, isEnabled: boolean) {
    await fetch("/api/admin/rewards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isEnabled: !isEnabled }),
    });
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: !isEnabled } : r)));
  }

  async function deleteReward(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/admin/rewards?id=${id}`, { method: "DELETE" });
    if (res.ok) setRewards((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#eef0e8]">{t("title")}</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-[#8fbf9a] text-[#0e1a13] rounded-lg text-sm font-bold hover:bg-[#7fa88a] transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t("new")}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#16261d] rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[#eef0e80d]">
              <h3 className="text-lg font-bold text-[#eef0e8]">
                {editId ? t("edit") : t("new")}
              </h3>
              <button onClick={resetForm} aria-label={t("close")} className="size-10 rounded-full hover:bg-[#ffffff08] flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#eef0e8cc] mb-1">{t("fTitle")}</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm text-[#eef0e8]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#eef0e8cc] mb-1">{t("fCategory")}</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm text-[#eef0e8]">
                    {REWARD_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#eef0e8cc] mb-1">{t("fPoints")}</label>
                  <input type="number" value={form.pointsCost} onChange={(e) => setForm({ ...form, pointsCost: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm text-[#eef0e8]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#eef0e8cc] mb-1">{t("fImage")}</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm text-[#eef0e8]" />
              </div>
              <button onClick={handleSubmit} className="w-full py-3 bg-[#8fbf9a] text-[#0e1a13] rounded-2xl font-bold text-sm hover:bg-[#7fa88a] transition-colors">
                {editId ? t("update") : t("create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-[#eef0e899]">{ta("loading")}</p>
      ) : rewards.length === 0 ? (
        <p className="text-[#eef0e899]">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto bg-[#16261d] border border-[#eef0e80d] rounded-2xl">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#eef0e80d]">
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colReward")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colCategory")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colPoints")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colRedemptions")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colStatus")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id} className="border-b border-[#eef0e80d] last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin-entered URL, host can be anything
                        <img src={r.imageUrl} alt="" className="size-10 rounded-lg object-cover" />
                      ) : (
                        <div className="size-10 rounded-lg bg-[#8fbf9a]/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#8fbf9a]">redeem</span>
                        </div>
                      )}
                      <p className="font-medium text-[#eef0e8]">{r.title}</p>
                    </div>
                  </td>
                  <td className="p-4 text-[#eef0e8aa]">{categoryLabel(r.category)}</td>
                  <td className="p-4 text-[#eef0e8] font-medium">{t("points", { count: r.pointsCost })}</td>
                  <td className="p-4 text-[#eef0e8aa]">{t("times", { count: r._count.redemptions })}</td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleEnabled(r.id, r.isEnabled)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.isEnabled
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {r.isEnabled ? t("enabled") : t("disabled")}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(r)} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium">
                        {t("editBtn")}
                      </button>
                      <button onClick={() => deleteReward(r.id)} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium">
                        {t("deleteBtn")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
