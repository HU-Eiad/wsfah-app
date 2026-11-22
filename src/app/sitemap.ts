import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "https://wsfa.app"
).replace(/\/+$/, "");

// Rebuilt at most hourly; DB failures (e.g. at build time without a database)
// fall back to the static pages only.
export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/home", priority: 0.9, changeFrequency: "daily" },
  { path: "/roasters", priority: 0.7, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
];

const MAX_ENTRIES = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const recipes = await prisma.recipe.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: MAX_ENTRIES,
    });
    for (const r of recipes) {
      entries.push({ url: `${SITE_URL}/recipe/${r.id}`, lastModified: r.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {
    // No database available: keep the static entries.
  }

  try {
    const brands = await prisma.company.findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: MAX_ENTRIES,
    });
    for (const b of brands) {
      entries.push({ url: `${SITE_URL}/brand/${b.id}`, lastModified: b.updatedAt, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    // No database available: keep the static entries.
  }

  return entries;
}
