"use client";

import { logout } from "@/app/actions";
import { useTranslations } from "next-intl";
import MaterialIcon from "@/components/MaterialIcon";

export default function SignOutButton() {
  const t = useTranslations("signOutButton");
  return (
    <button
      onClick={() => logout()}
      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
    >
      <MaterialIcon icon="logout" className="text-lg" />
      {t("label")}
    </button>
  );
}
