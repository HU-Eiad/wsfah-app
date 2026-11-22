import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// /profile on its own is the signed-in user's page; /profile/<id> is a public profile.
const protectedPrefixes = ["/create", "/rewards", "/admin"];
const protectedExact = ["/profile"];

// Pages that should work on all devices (desktop + mobile)
const desktopAllowed = [
  "/",
  "/home",
  "/login",
  "/signup",
  "/pricing",
  "/refund-policy",
  "/privacy",
  "/terms",
  "/admin",
  "/desktop-only",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/roasters",
  "/offline",
];

// Files and pages that must never be redirected, for any client.
const alwaysAllowed = ["/robots.txt", "/sitemap.xml", "/privacy", "/terms"];

// Read-only public pages that desktop visitors may open (shared links).
const desktopReadOnly = [
  /^\/recipe\/(?!edit(?:\/|$))[^/]+\/?$/,
  /^\/brand\/[^/]+\/?$/,
  /^\/profile\/[^/]+\/?$/,
];

const BOT_UA =
  /googlebot|bingbot|facebookexternalhit|twitterbot|whatsapp|slackbot|telegrambot|linkedinbot|discordbot|applebot|duckduckbot|yandex/i;

function isMobile(ua: string): boolean {
  return /android|iphone|ipad|ipod|mobile|phone/i.test(ua);
}

function matchesPrefix(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + "/");
}

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const userAgent = req.headers.get("user-agent") || "";

  if (alwaysAllowed.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session token (NextAuth stores it as a cookie)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;
  const isLoggedIn = !!sessionToken;

  // Protect routes that require authentication
  const isProtected =
    protectedExact.includes(pathname) ||
    protectedPrefixes.some((r) => matchesPrefix(pathname, r));
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    const callbackUrl = pathname + search;
    if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Crawlers and link-preview bots always get the real page
  if (BOT_UA.test(userAgent)) {
    return NextResponse.next();
  }

  // Redirect desktop users to download page (app pages only)
  if (!isMobile(userAgent)) {
    const isDesktopAllowed =
      desktopAllowed.some((r) => (r === "/" ? pathname === "/" : matchesPrefix(pathname, r))) ||
      desktopReadOnly.some((re) => re.test(pathname));

    if (!isDesktopAllowed) {
      return NextResponse.redirect(new URL("/desktop-only", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|manifest.json|sw.js|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
