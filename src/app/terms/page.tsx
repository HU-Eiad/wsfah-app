import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage from "@/components/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
  const tl = await getTranslations("legal");
  return { title: `${t("title")} | ${tl("appName")}`, description: t("lead"), alternates: { canonical: "/terms" } };
}

const SECTIONS = [
  { key: "acceptance" },
  { key: "account" },
  { key: "content" },
  { key: "conduct", hasPoints: true },
  { key: "brands" },
  { key: "payments" },
  { key: "rewards" },
  { key: "brewing" },
  { key: "availability" },
  { key: "termination" },
  { key: "liability" },
  { key: "changes" },
];

export default function TermsPage() {
  return <LegalPage namespace="terms" sections={SECTIONS} />;
}
