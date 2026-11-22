"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { intlLocale } from "@/i18n/format";

function parseDocuments(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

interface Application {
  id: string;
  documents: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  company: { id: string; name: string };
  applicant: { name: string | null; email: string | null };
}

export default function AdminVerificationPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("adminVerification");
  const ta = useTranslations("admin");
  const locale = intlLocale(useLocale());

  useEffect(() => {
    fetch("/api/admin/verification")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(applicationId: string, status: string) {
    try {
      const res = await fetch("/api/admin/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#eef0e8] mb-6">{t("title")}</h2>

      {loading ? (
        <p className="text-[#eef0e899]">{ta("loading")}</p>
      ) : applications.length === 0 ? (
        <div className="bg-[#16261d] border border-[#eef0e80d] rounded-2xl p-8 text-center">
          <p className="text-[#eef0e899]">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-[#16261d] border border-[#eef0e80d] rounded-2xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#eef0e8]">
                    {app.company.name}
                  </h3>
                  <p className="text-sm text-[#eef0e8aa] mt-1">
                    {t("applicant", { name: app.applicant?.name || app.applicant?.email || ta("unknown") })}
                  </p>
                  {parseDocuments(app.documents).length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[#eef0e899] mb-1">{t("documents")}</p>
                      <div className="flex flex-wrap gap-2">
                        {parseDocuments(app.documents).map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#8fbf9a] hover:underline"
                          >
                            {t("document", { n: i + 1 })}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-[#eef0e880] mt-2">
                    {t("submitted", { date: new Date(app.createdAt).toLocaleDateString(locale) })}
                  </p>
                </div>
                <div className="flex gap-2 ms-4">
                  <button
                    onClick={() => handleAction(app.id, "APPROVED")}
                    className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                  >
                    {t("approve")}
                  </button>
                  <button
                    onClick={() => handleAction(app.id, "REJECTED")}
                    className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
