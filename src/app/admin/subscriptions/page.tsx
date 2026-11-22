"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import RiyalSign from "@/components/RiyalSign";
import { intlLocale } from "@/i18n/format";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: string;
  description: string | null;
  features: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface PromoPricing {
  id: string;
  name: string;
  placement: string;
  duration: number;
  price: number;
  currency: string;
  discount: number;
  isActive: boolean;
  sortOrder: number;
}

interface Subscriber {
  id: string;
  name: string | null;
  email: string | null;
  subscriptionTier: string;
  subscriptionStartsAt: string | null;
  subscriptionExpiresAt: string | null;
  trialUsed: boolean;
  trialEndsAt: string | null;
  trialPlanSlug: string | null;
  createdAt: string;
}

interface SubCompany {
  id: string;
  name: string;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  owner: { id: string; name: string | null; email: string | null };
}

const emptyPlan = { name: "", slug: "", price: "", currency: "USD", interval: "monthly", description: "", features: "", sortOrder: 0 };
const emptyPromo = { name: "", placement: "HOME_TOP", duration: "7", price: "", currency: "USD", discount: "0", sortOrder: 0 };
const PLACEMENTS = ["HOME_TOP", "EXPLORE_TOP", "BOTH"];
const USER_TIERS = ["free", "pro", "premium"];

interface SubscriptionsData {
  plans: Plan[] | null;
  promos: PromoPricing[] | null;
  subscribers: { users?: Subscriber[]; companies?: SubCompany[] } | null;
}

async function loadSubscriptionsData(search: string, tier: string): Promise<SubscriptionsData> {
  const [plansRes, promosRes, subsRes] = await Promise.all([
    fetch("/api/admin/subscriptions"),
    fetch("/api/admin/promotion-pricing"),
    fetch(`/api/admin/subscribers?search=${encodeURIComponent(search)}&tier=${encodeURIComponent(tier)}`),
  ]);
  return {
    plans: plansRes.ok ? await plansRes.json() : null,
    promos: promosRes.ok ? await promosRes.json() : null,
    subscribers: subsRes.ok ? await subsRes.json() : null,
  };
}

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promos, setPromos] = useState<PromoPricing[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subCompanies, setSubCompanies] = useState<SubCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("adminSubscriptions");
  const locale = intlLocale(useLocale());
  const placementLabel = (p: string) => (t.has(`placements.${p}`) ? t(`placements.${p}`) : p);
  const tierLabel = (tier: string) => (t.has(`tiers.${tier}`) ? t(`tiers.${tier}`) : tier);
  const [tab, setTab] = useState<"subscribers" | "plans" | "promos">("subscribers");
  const [subSearch, setSubSearch] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [extendingUser, setExtendingUser] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState("30");

  // Plan form
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planSaving, setPlanSaving] = useState(false);

  // Promo form
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoSaving, setPromoSaving] = useState(false);

  const applyData = useCallback((data: SubscriptionsData) => {
    if (data.plans) setPlans(data.plans);
    if (data.promos) setPromos(data.promos);
    if (data.subscribers) {
      setSubscribers(data.subscribers.users || []);
      setSubCompanies(data.subscribers.companies || []);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      applyData(await loadSubscriptionsData(subSearch, subFilter));
    } catch {
      // keep what is on screen
    } finally {
      setLoading(false);
    }
  }, [subSearch, subFilter, applyData]);

  useEffect(() => {
    let cancelled = false;
    loadSubscriptionsData(subSearch, subFilter)
      .then((data) => { if (!cancelled) applyData(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [subSearch, subFilter, applyData]);

  const updateUserTier = async (userId: string, tier: string) => {
    setUpdatingUser(userId);
    const res = await fetch("/api/admin/subscribers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subscriptionTier: tier }),
    });
    if (res.ok) fetchData();
    setUpdatingUser(null);
  };

  const extendSubscription = async (userId: string) => {
    const days = parseInt(extendDays);
    if (!days || days <= 0) return;
    setUpdatingUser(userId);
    const res = await fetch("/api/admin/subscribers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, extendDays: days }),
    });
    if (res.ok) {
      setExtendingUser(null);
      fetchData();
    }
    setUpdatingUser(null);
  };

  // Plan CRUD
  const savePlan = async () => {
    setPlanSaving(true);
    const method = editingPlanId ? "PATCH" : "POST";
    const body = editingPlanId ? { id: editingPlanId, ...planForm } : planForm;
    const res = await fetch("/api/admin/subscriptions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setPlanForm(emptyPlan);
      setEditingPlanId(null);
      fetchData();
    }
    setPlanSaving(false);
  };

  const editPlan = (p: Plan) => {
    setEditingPlanId(p.id);
    setPlanForm({
      name: p.name,
      slug: p.slug,
      price: String(p.price),
      currency: p.currency,
      interval: p.interval,
      description: p.description || "",
      features: p.features || "",
      sortOrder: p.sortOrder,
    });
  };

  const deletePlan = async (id: string) => {
    if (!confirm(t("confirmDeletePlan"))) return;
    await fetch(`/api/admin/subscriptions?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const togglePlan = async (p: Plan) => {
    await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    fetchData();
  };

  // Promo pricing CRUD
  const savePromo = async () => {
    setPromoSaving(true);
    const method = editingPromoId ? "PATCH" : "POST";
    const body = editingPromoId ? { id: editingPromoId, ...promoForm } : promoForm;
    const res = await fetch("/api/admin/promotion-pricing", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setPromoForm(emptyPromo);
      setEditingPromoId(null);
      fetchData();
    }
    setPromoSaving(false);
  };

  const editPromo = (p: PromoPricing) => {
    setEditingPromoId(p.id);
    setPromoForm({
      name: p.name,
      placement: p.placement,
      duration: String(p.duration),
      price: String(p.price),
      currency: p.currency,
      discount: String(p.discount),
      sortOrder: p.sortOrder,
    });
  };

  const deletePromo = async (id: string) => {
    if (!confirm(t("confirmDeletePricing"))) return;
    await fetch(`/api/admin/promotion-pricing?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const togglePromo = async (p: PromoPricing) => {
    await fetch("/api/admin/promotion-pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#eef0e8] mb-2">{t("title")}</h1>
      <p className="text-sm text-[#eef0e899] mb-6">{t("subtitle")}</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-espresso/5 dark:bg-white/5 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setTab("subscribers")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === "subscribers" ? "bg-[#16261d] text-[#eef0e8] shadow-sm" : "text-[#eef0e899]"
          }`}
        >
          {t("tabSubscribers", { count: subscribers.filter((u) => u.subscriptionTier !== "free").length })}
        </button>
        <button
          onClick={() => setTab("plans")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === "plans" ? "bg-[#16261d] text-[#eef0e8] shadow-sm" : "text-[#eef0e899]"
          }`}
        >
          {t("tabPlans", { count: plans.length })}
        </button>
        <button
          onClick={() => setTab("promos")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            tab === "promos" ? "bg-[#16261d] text-[#eef0e8] shadow-sm" : "text-[#eef0e899]"
          }`}
        >
          {t("tabPromos", { count: promos.length })}
        </button>
      </div>

      {/* ─── Subscribers Tab ─── */}
      {tab === "subscribers" && (
        <>
          {/* Search & Filter */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
            />
            <select
              value={subFilter}
              onChange={(e) => setSubFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
            >
              <option value="">{t("allTiers")}</option>
              {USER_TIERS.map((tier) => <option key={tier} value={tier}>{tierLabel(tier)}</option>)}
            </select>
          </div>

          {/* Subscribers list */}
          <div className="space-y-3 mb-6">
            {subscribers.map((u) => {
              const isExpired = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt) < new Date();
              const isOnTrial = u.trialEndsAt && new Date(u.trialEndsAt) > new Date();
              return (
                <div key={u.id} className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-4 space-y-3">
                  {/* Row 1: Name + tier badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#eef0e8] truncate">{u.name || "—"}</p>
                      <p className="text-xs text-[#eef0e899] truncate">{u.email}</p>
                    </div>
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      u.subscriptionTier === "pro"
                        ? isExpired ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : u.subscriptionTier === "premium" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-[#eef0e810] text-[#eef0e880]"
                    }`}>
                      {u.subscriptionTier === "pro" ? (isExpired ? t("expired") : tierLabel("pro")) : u.subscriptionTier === "premium" ? tierLabel("premium") : tierLabel("free")}
                      {isOnTrial && ` ${t("trialSuffix")}`}
                    </span>
                  </div>

                  {/* Row 2: Dates */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#eef0e899]">
                    <span>{t("starts", { date: u.subscriptionStartsAt ? new Date(u.subscriptionStartsAt).toLocaleDateString(locale) : "—" })}</span>
                    <span>
                      {t("ends")} {u.subscriptionExpiresAt ? (
                        <span className={isExpired ? "text-red-500 font-medium" : ""}>
                          {new Date(u.subscriptionExpiresAt).toLocaleDateString(locale)}
                          {isExpired && ` (${t("expired")})`}
                        </span>
                      ) : u.subscriptionTier !== "free" ? (
                        <span className="text-green-600 font-medium">{t("unlimited")}</span>
                      ) : "—"}
                    </span>
                  </div>

                  {/* Row 3: Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={u.subscriptionTier}
                      onChange={(e) => updateUserTier(u.id, e.target.value)}
                      disabled={updatingUser === u.id}
                      className="px-3 py-1.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm disabled:opacity-50"
                    >
                      {USER_TIERS.map((tier) => <option key={tier} value={tier}>{tierLabel(tier)}</option>)}
                    </select>
                    {extendingUser === u.id ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <input
                          type="number"
                          value={extendDays}
                          onChange={(e) => setExtendDays(e.target.value)}
                          className="w-14 px-2 py-1.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm text-center"
                          placeholder="30"
                          min="1"
                        />
                        <span className="text-xs text-[#eef0e880]">{t("days")}</span>
                        <button
                          onClick={() => extendSubscription(u.id)}
                          disabled={updatingUser === u.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                        >
                          {t("extend")}
                        </button>
                        <button onClick={() => setExtendingUser(null)} aria-label={t("cancel")} className="px-2 py-1.5 bg-gray-200 dark:bg-[#ffffff15] rounded-lg text-xs">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setExtendingUser(u.id); setExtendDays("30"); }}
                        className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">event_repeat</span>
                        {t("extend")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {subscribers.length === 0 && (
              <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-[#eef0e880] mb-3 block">group</span>
                <p className="text-[#eef0e880] font-medium">{t("noSubscribers")}</p>
              </div>
            )}
          </div>

          {/* Companies with subscriptions */}
          {subCompanies.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-[#eef0e8] mb-3">{t("brandSubscriptions")}</h3>
              <div className="space-y-3">
                {subCompanies.map((c) => (
                  <div key={c.id} className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#eef0e8]">{c.name}</p>
                      <p className="text-xs text-[#eef0e899] truncate">{c.owner?.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {c.subscriptionTier}
                      </span>
                      <span className="text-xs text-[#eef0e880]">
                        {c.subscriptionExpiresAt ? new Date(c.subscriptionExpiresAt).toLocaleDateString(locale) : t("unlimited")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Subscription Plans Tab ─── */}
      {tab === "plans" && (
        <>
          {/* Form */}
          <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-6 mb-6">
            <h2 className="font-bold text-lg text-[#eef0e8] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500">{editingPlanId ? "edit" : "add_circle"}</span>
              {editingPlanId ? t("editPlan") : t("createPlanTitle")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fPlanName")}</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value, slug: planForm.slug || e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder={t("fPlanNamePlaceholder")}
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fSlug")}</label>
                <input
                  type="text"
                  value={planForm.slug}
                  onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })}
                  placeholder="premium"
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fPrice")}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="9.99"
                    className="flex-1 px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                  />
                  <select
                    value={planForm.currency}
                    onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                    className="px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fInterval")}</label>
                <select
                  value={planForm.interval}
                  onChange={(e) => setPlanForm({ ...planForm, interval: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                >
                  <option value="monthly">{t("monthly")}</option>
                  <option value="yearly">{t("yearly")}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fDescription")}</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder={t("fDescriptionPlaceholder")}
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fFeatures")}</label>
                <textarea
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder={t("fFeaturesPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={savePlan}
                disabled={planSaving || !planForm.name || !planForm.price}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">{editingPlanId ? "save" : "add"}</span>
                {planSaving ? t("saving") : editingPlanId ? t("updatePlan") : t("createPlan")}
              </button>
              {editingPlanId && (
                <button
                  onClick={() => { setEditingPlanId(null); setPlanForm(emptyPlan); }}
                  className="px-5 py-2.5 bg-espresso/5 dark:bg-white/5 rounded-lg font-semibold text-sm"
                >
                  {t("cancel")}
                </button>
              )}
            </div>
          </div>

          {/* Plans List */}
          {plans.length === 0 ? (
            <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#eef0e880] mb-3 block">credit_card</span>
              <p className="text-[#eef0e880] font-medium">{t("noPlans")}</p>
              <p className="text-sm text-[#eef0e880] mt-1">{t("noPlansHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div key={p.id} className={`bg-[#16261d] rounded-2xl border-2 overflow-hidden transition-all ${
                  p.isActive ? "border-green-200 dark:border-green-800" : "border-[#eef0e80d] opacity-60"
                }`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg text-[#eef0e8]">{p.name}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        p.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-[#eef0e810] text-[#eef0e880]"
                      }`}>
                        {p.isActive ? t("active") : t("inactive")}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-display text-[#eef0e8]">
                        {p.currency === "USD" ? "$" : p.currency === "EUR" ? "€" : p.currency === "GBP" ? "£" : ""}{p.price}{p.currency === "SAR" && <RiyalSign className="ms-1" />}
                      </span>
                      <span className="text-sm text-[#eef0e880]">/{p.interval === "yearly" ? t("perYear") : t("perMonth")}</span>
                    </div>
                    {p.description && (
                      <p className="text-sm text-[#eef0e899] mb-3">{p.description}</p>
                    )}
                    {p.features && (
                      <ul className="space-y-1.5 mb-4">
                        {p.features.split("\n").filter(Boolean).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-[#eef0e8aa]">
                            <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-[11px] text-[#eef0e880]">{t("slugLabel", { slug: p.slug })}</p>
                  </div>
                  <div className="flex border-t border-[#eef0e80d]">
                    <button onClick={() => editPlan(p)} className="flex-1 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-base">edit</span>{t("edit")}
                    </button>
                    <button onClick={() => togglePlan(p)} className="flex-1 py-3 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center gap-1 border-x border-[#eef0e80d]">
                      <span className="material-symbols-outlined text-base">{p.isActive ? "visibility_off" : "visibility"}</span>
                      {p.isActive ? t("disable") : t("enable")}
                    </button>
                    <button onClick={() => deletePlan(p.id)} className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-base">delete</span>{t("delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Promotion Pricing Tab ─── */}
      {tab === "promos" && (
        <>
          {/* Form */}
          <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-6 mb-6">
            <h2 className="font-bold text-lg text-[#eef0e8] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">{editingPromoId ? "edit" : "add_circle"}</span>
              {editingPromoId ? t("editPricing") : t("createPricingTitle")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fPackageName")}</label>
                <input
                  type="text"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  placeholder={t("fPackageNamePlaceholder")}
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fPlacement")}</label>
                <select
                  value={promoForm.placement}
                  onChange={(e) => setPromoForm({ ...promoForm, placement: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                >
                  {PLACEMENTS.map((p) => <option key={p} value={p}>{placementLabel(p)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fDuration")}</label>
                <input
                  type="number"
                  value={promoForm.duration}
                  onChange={(e) => setPromoForm({ ...promoForm, duration: e.target.value })}
                  placeholder="7"
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fPrice")}</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={promoForm.price}
                    onChange={(e) => setPromoForm({ ...promoForm, price: e.target.value })}
                    placeholder="49.99"
                    className="flex-1 px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                  />
                  <select
                    value={promoForm.currency}
                    onChange={(e) => setPromoForm({ ...promoForm, currency: e.target.value })}
                    className="px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#eef0e899] mb-1">{t("fDiscount")}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={promoForm.discount}
                  onChange={(e) => setPromoForm({ ...promoForm, discount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg border border-espresso/10 dark:border-white/10 bg-[#16261d] text-[#eef0e8] text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={savePromo}
                disabled={promoSaving || !promoForm.name || !promoForm.price}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">{editingPromoId ? "save" : "add"}</span>
                {promoSaving ? t("saving") : editingPromoId ? t("updatePricing") : t("createPricing")}
              </button>
              {editingPromoId && (
                <button
                  onClick={() => { setEditingPromoId(null); setPromoForm(emptyPromo); }}
                  className="px-5 py-2.5 bg-espresso/5 dark:bg-white/5 rounded-lg font-semibold text-sm"
                >
                  {t("cancel")}
                </button>
              )}
            </div>
          </div>

          {/* Pricing List */}
          {promos.length === 0 ? (
            <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#eef0e880] mb-3 block">sell</span>
              <p className="text-[#eef0e880] font-medium">{t("noPricing")}</p>
              <p className="text-sm text-[#eef0e880] mt-1">{t("noPricingHint")}</p>
            </div>
          ) : (
            <div className="bg-[#16261d] rounded-2xl border border-[#eef0e80d] overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#eef0e80d] text-start">
                    <th className="px-5 py-3 text-xs font-bold text-[#eef0e899]">{t("colPackage")}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#eef0e899]">{t("colPlacement")}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#eef0e899]">{t("colDuration")}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#eef0e899]">{t("colPrice")}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#eef0e899]">{t("colDiscount")}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#eef0e899]">{t("colFinal")}</th>
                    <th className="px-5 py-3 text-xs font-bold text-[#eef0e899]">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {promos.map((p) => {
                    const final = p.price * (1 - p.discount / 100);
                    return (
                      <tr key={p.id} className={`hover:bg-espresso/[0.02] dark:hover:bg-white/[0.02] ${!p.isActive ? "opacity-50" : ""}`}>
                        <td className="px-5 py-4 text-sm font-semibold text-[#eef0e8]">{p.name}</td>
                        <td className="px-5 py-4 text-sm text-[#eef0e8aa]">{placementLabel(p.placement)}</td>
                        <td className="px-5 py-4 text-sm text-[#eef0e8aa]">{t("durationDays", { count: p.duration })}</td>
                        <td className="px-5 py-4 text-sm text-[#eef0e8aa]">${p.price.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          {p.discount > 0 ? (
                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-bold px-2 py-0.5 rounded-full">
                              -{p.discount}%
                            </span>
                          ) : (
                            <span className="text-xs text-[#eef0e880]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-green-600 dark:text-green-400">${final.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => editPromo(p)} aria-label={t("edit")} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => togglePromo(p)} aria-label={p.isActive ? t("disable") : t("enable")} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600">
                              <span className="material-symbols-outlined text-lg">{p.isActive ? "visibility_off" : "visibility"}</span>
                            </button>
                            <button onClick={() => deletePromo(p.id)} aria-label={t("delete")} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
