"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "@/i18n/format";

interface Promotion {
  id: string;
  companyId: string;
  placement: string;
  message: string | null;
  imageUrl: string | null;
  status: string;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  adminNotes: string | null;
  createdAt: string;
  company: { id: string; name: string; logo: string | null; type: string };
  requester: { id: string; name: string | null; image: string | null };
}

async function loadPromos(): Promise<Promotion[] | null> {
  const res = await fetch("/api/promotions?all=1");
  return res.ok ? res.json() : null;
}

export default function AdminPromotionsPage() {
  const t = useTranslations("adminPromotions");
  const ta = useTranslations("admin");
  const locale = intlLocale(useLocale());
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    priority: 0,
    startDate: "",
    endDate: "",
    adminNotes: "",
  });

  const fetchPromos = useCallback(async () => {
    try {
      const data = await loadPromos();
      if (data) setPromos(data);
    } catch {
      // keep the current list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPromos()
      .then((data) => {
        if (!cancelled && data) setPromos(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchPromos();
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priority: editForm.priority,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        adminNotes: editForm.adminNotes || null,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchPromos();
    }
  };

  const deletePromo = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    if (res.ok) fetchPromos();
  };

  const startEdit = (p: Promotion) => {
    setEditingId(p.id);
    setEditForm({
      priority: p.priority,
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.slice(0, 10) : "",
      adminNotes: p.adminNotes || "",
    });
  };

  const filtered = filter === "ALL" ? promos : promos.filter((p) => p.status === filter);

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  const placementLabel = (p: string) => (t.has(`placements.${p}`) ? t(`placements.${p}`) : p);
  const statusLabel = (s: string) => (t.has(`status.${s}`) ? t(`status.${s}`) : s);

  const pendingCount = promos.filter((p) => p.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#eef0e8] flex items-center gap-3">
            {t("title")}
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {t("pendingCount", { count: pendingCount })}
              </span>
            )}
          </h1>
          <p className="text-sm text-[#eef0e899] mt-1">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "EXPIRED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? "bg-green-600 text-white"
                : "bg-[#16261d] text-[#eef0e8aa] border border-[#eef0e80d] hover:bg-[#eef0e805]"
            }`}
          >
            {t("filterCount", { label: statusLabel(s), count: s === "ALL" ? promos.length : promos.filter((p) => p.status === s).length })}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[#eef0e880] mb-3 block">campaign</span>
          <p className="text-[#eef0e899] font-medium">{t("empty")}</p>
          <p className="text-sm text-[#eef0e880] mt-1">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Brand Logo (any URL the brand saved, so a plain img) */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- brand logo URL can be any host */}
                  <img
                    src={p.company.logo || "/brand/banners/avatar-placeholder.svg"}
                    alt={p.company.name}
                    className="size-14 rounded-2xl object-cover border border-gray-200 dark:border-gray-600 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-[#eef0e8] text-lg">{p.company.name}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusColor[p.status]}`}>
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-[#eef0e899]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        {placementLabel(p.placement)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">person</span>
                        {p.requester.name || ta("unknown")}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        {new Date(p.createdAt).toLocaleDateString(locale)}
                      </span>
                      {p.priority > 0 && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <span className="material-symbols-outlined text-base">priority_high</span>
                          {t("priority", { priority: p.priority })}
                        </span>
                      )}
                    </div>
                    {p.message && (
                      <p className="text-sm text-[#eef0e8aa] mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 italic">
                        &ldquo;{p.message}&rdquo;
                      </p>
                    )}
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element -- banner URL submitted by the brand, host can be anything
                      <img src={p.imageUrl} alt={t("bannerAlt")} className="mt-3 rounded-lg max-h-32 object-cover" />
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {editingId === p.id && (
                  <div className="mt-4 pt-4 border-t border-[#eef0e80d] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fPriority")}</label>
                      <input
                        type="number"
                        value={editForm.priority}
                        onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fNotes")}</label>
                      <input
                        type="text"
                        value={editForm.adminNotes}
                        onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                        placeholder={t("fNotesPlaceholder")}
                        className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fStart")}</label>
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fEnd")}</label>
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[#eef0e81a] bg-[#16261d] text-[#eef0e8] text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <button
                        onClick={() => saveEdit(p.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        {t("save")}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-[#eef0e808] text-[#eef0e8cc] rounded-lg text-sm font-medium"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-750 border-t border-[#eef0e80d]">
                {p.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => updateStatus(p.id, "APPROVED")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      {t("approve")}
                    </button>
                    <button
                      onClick={() => updateStatus(p.id, "REJECTED")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      {t("reject")}
                    </button>
                  </>
                )}
                {p.status === "APPROVED" && (
                  <button
                    onClick={() => updateStatus(p.id, "EXPIRED")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                  >
                    <span className="material-symbols-outlined text-base">timer_off</span>
                    {t("end")}
                  </button>
                )}
                {p.status === "REJECTED" && (
                  <button
                    onClick={() => updateStatus(p.id, "APPROVED")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    {t("approve")}
                  </button>
                )}
                <button
                  onClick={() => editingId === p.id ? setEditingId(null) : startEdit(p)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  {editingId === p.id ? t("close") : t("settings")}
                </button>
                <button
                  onClick={() => deletePromo(p.id)}
                  className="flex items-center gap-1.5 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium ms-auto"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
