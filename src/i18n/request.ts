import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, defaultLocale, isLocale } from "./config";

// No locale in the URL: the language comes from the cookie set by LanguageSwitch.
export default getRequestConfig(async () => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(value) ? value : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}/index.ts`)).default,
  };
});
