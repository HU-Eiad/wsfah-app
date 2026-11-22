import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage from "@/components/LegalPage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  const tl = await getTranslations("legal");
  return { title: `${t("title")} | ${tl("appName")}`, description: t("lead"), alternates: { canonical: "/privacy" } };
}

const SECTIONS = [
  { key: "account", hasPoints: true },
  { key: "content", hasPoints: true },
  { key: "usage", hasPoints: true },
  { key: "device", hasPoints: true },
  { key: "location" },
  { key: "scale" },
  { key: "payments" },
  { key: "providers", hasPoints: true },
  { key: "use", hasPoints: true },
  { key: "sharing" },
  { key: "visibility" },
  { key: "retention" },
  { key: "deletion" },
  { key: "rights" },
  { key: "children" },
  { key: "changes" },
];

export default function PrivacyPage() {
  return <LegalPage namespace="privacy" sections={SECTIONS} />;
}
