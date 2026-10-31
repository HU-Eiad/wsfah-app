"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";

function isRedirect(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message || "";
    const digest = (error as any).digest;
    if (msg.includes("NEXT_REDIRECT") || msg.includes("redirect")) return true;
    if (typeof digest === "string" && digest.includes("NEXT_REDIRECT")) return true;
  }
  return false;
}

export async function signupAndLogin(
  provider: "credentials" | "phone-otp",
  credentials: Record<string, string>
) {
  try {
    await signIn(provider, {
      ...credentials,
      redirectTo: "/",
    });
    return { success: true };
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }
    const t = await getTranslations("signupActions");
    if (error instanceof AuthError) {
      return { success: false, error: t("loginAfterSignupFailed") };
    }
    return { success: false, error: t("somethingWrong") };
  }
}
