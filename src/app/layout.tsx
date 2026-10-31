import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";
import Script from "next/script";
import SessionProvider from "@/components/SessionProvider";
import AdProvider from "@/components/AdProvider";
import "./globals.css";

// Body text: Arabic + Latin in one family, so mixed-language titles share a rhythm.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Display: Kufic headings, used for h1/h2 and `font-display`.
const reemKufi = Reem_Kufi({
  variable: "--font-kufi",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "وصفة - WSFA",
  description: "اكتشف، حضّر، وشارك أفضل وصفات القهوة والشاي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" translate="no" suppressHydrationWarning>
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
      <body className={`${plexArabic.variable} ${reemKufi.variable} font-arabic antialiased`}>
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
        <SessionProvider>
          <AdProvider>{children}</AdProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
