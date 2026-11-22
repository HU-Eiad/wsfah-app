"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Brand {
  id: string;
  name: string;
  type: string;
  status: string;
  owner: { name: string | null; email: string | null };
}

const TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];
export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const t = useTranslations("adminBrands");
  const ta = useTranslations("admin");
  const statusLabel = (s: string) => (t.has(`status.${s}`) ? t(`status.${s}`) : s);
  const typeLabel = (type: string) => {
    const key = `types.${(type || "").toLowerCase()}`;
    return t.has(key) ? t(key) : type;
  };

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeTab === "ALL" ? "/api/admin/brands" : `/api/admin/brands?status=${activeTab}`;
      const res = await fetch(url);
      const data = await res.json();
      setBrands(data.companies || []);
    } catch {
      // fetch failed
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  async function updateStatus(companyId: string, status: string) {
    try {
      const res = await fetch("/api/admin/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status }),
      });
      if (res.ok) {
        setBrands((prev) => prev.map((b) => (b.id === companyId ? { ...b, status } : b)));
      }
    } catch {
      // update failed
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#eef0e8] mb-6">{t("title")}</h2>

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#8fbf9a] text-[#0e1a13]"
                : "bg-[#eef0e808] text-[#eef0e8aa] hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {statusLabel(tab)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[#eef0e899]">{ta("loading")}</p>
      ) : brands.length === 0 ? (
        <p className="text-[#eef0e899]">{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto bg-[#16261d] border border-[#eef0e80d] rounded-2xl">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#eef0e80d]">
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colCompany")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colType")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colOwner")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colStatus")}</th>
                <th className="text-start p-4 text-[#eef0e899] font-medium">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand.id} className="border-b border-[#eef0e80d] last:border-0">
                  <td className="p-4 text-[#eef0e8] font-medium">{brand.name}</td>
                  <td className="p-4 text-[#eef0e8aa]">{typeLabel(brand.type)}</td>
                  <td className="p-4 text-[#eef0e8aa]">
                    {brand.owner?.name || brand.owner?.email || "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        brand.status === "APPROVED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : brand.status === "REJECTED"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {statusLabel(brand.status)}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {brand.status !== "APPROVED" && (
                      <button
                        onClick={() => updateStatus(brand.id, "APPROVED")}
                        className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                      >
                        {t("approve")}
                      </button>
                    )}
                    {brand.status !== "REJECTED" && (
                      <button
                        onClick={() => updateStatus(brand.id, "REJECTED")}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                      >
                        {t("reject")}
                      </button>
                    )}
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
