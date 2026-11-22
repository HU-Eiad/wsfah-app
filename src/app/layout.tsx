import type { Metadata } from "next";
import { Epilogue, Noto_Sans_Arabic } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { dirFor, type Locale } from "@/i18n/config";
import SessionProvider from "@/components/SessionProvider";
import AdProvider from "@/components/AdProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AppFrame from "@/components/AppFrame";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://wsfa.app";
  let metadataBase: URL | undefined;
  try {
    metadataBase = new URL(siteUrl);
  } catch {
    metadataBase = undefined;
  }
  return {
    metadataBase,
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    openGraph: { siteName: t("siteName"), title: t("title"), description: t("description") },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;

  return (
    <html lang={locale} dir={dirFor(locale)} translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#1e4a32" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Apply dark mode before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('wsfa-dark')==='true'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${epilogue.variable} ${notoArabic.variable} ${locale === "ar" ? "font-arabic" : "font-display"} antialiased`}>
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
        <NextIntlClientProvider>
          <SessionProvider>
            <AdProvider>
              <AppFrame>{children}</AppFrame>
            </AdProvider>
          </SessionProvider>
        </NextIntlClientProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
