"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

const KEY_BY_STATUS: Record<number, string> = {
  400: "badRequest",
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  409: "conflict",
  429: "rateLimited",
  500: "server",
};

/**
 * Maps an HTTP status to a localized, user-safe message from the `errors`
 * namespace. Server `error` strings are never shown to users directly.
 */
export function useApiErrorMessage() {
  const t = useTranslations("errors");
  return useCallback(
    (status?: number | null) => {
      if (typeof status === "number") {
        const key = KEY_BY_STATUS[status] ?? (status >= 500 ? "server" : null);
        if (key) return t(key);
      }
      return t("generic");
    },
    [t]
  );
}

/** Error carrying the HTTP status of a failed API call. */
export class ApiError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}
