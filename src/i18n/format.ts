import type { Locale } from "./config";

/**
 * BCP 47 tag for Date/Number formatting. Arabic keeps Arabic month names but
 * always uses Western digits (0-9); English uses en-US.
 */
export function intlLocale(locale: string): string {
  return (locale as Locale) === "ar" ? "ar-u-nu-latn" : "en-US";
}
