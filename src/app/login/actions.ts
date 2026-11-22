"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";

function isRedirect(error: unknown): boolean {
  // Next.js 14-16 uses different redirect error shapes
  if (error instanceof Error) {
    const msg = error.message || "";
    const digest = (error as { digest?: unknown }).digest;
    if (msg.includes("NEXT_REDIRECT") || msg.includes("redirect")) return true;
    if (typeof digest === "string" && digest.includes("NEXT_REDIRECT")) return true;
  }
  return false;
}

// Only same-site relative paths are accepted as a post-login destination.
function safeCallback(url: unknown): string {
  return typeof url === "string" && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")
    ? url
    : "/";
}

export async function loginWithCredentials(email: string, password: string, callbackUrl?: string) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeCallback(callbackUrl),
    });
    return { success: true };
  } catch (error) {
    if (isRedirect(error)) {
      throw error; // Re-throw so Next.js handles the redirect
    }
    const t = await getTranslations("loginActions");
    if (error instanceof AuthError) {
      return { success: false, error: t("invalidCredentials") };
    }
    return { success: false, error: t("somethingWrong") };
  }
}

export async function loginWithPhoneOtp(phone: string, otp: string, callbackUrl?: string) {
  try {
    await signIn("phone-otp", {
      phone,
      otp,
      redirectTo: safeCallback(callbackUrl),
    });
    return { success: true };
  } catch (error) {
    if (isRedirect(error)) {
      throw error;
    }
    const t = await getTranslations("loginActions");
    if (error instanceof AuthError) {
      return { success: false, error: t("invalidOtp") };
    }
    return { success: false, error: t("somethingWrong") };
  }
}
