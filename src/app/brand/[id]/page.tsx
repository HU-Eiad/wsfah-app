import BottomNav from "@/components/BottomNav";
import BrandTabs from "@/components/BrandTabs";
import BrandIcon from "@/components/BrandIcon";
import FollowButton from "@/components/FollowButton";
import MaterialIcon from "@/components/MaterialIcon";
import PromoteButton from "@/components/PromoteButton";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("meta");
  let company: { id: string; name: string; description: string | null; logo: string | null } | null = null;
  try {
    company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, logo: true },
    });
  } catch {
    company = null;
  }
  if (!company) return { title: t("brandNotFound"), robots: { index: false } };

  const title = `${company.name} | ${t("siteName")}`;
  const description = (company.description || t("brandDescription", { name: company.name })).slice(0, 200);
  const images = company.logo ? [{ url: company.logo, alt: company.name }] : undefined;
  const url = `/brand/${company.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", title, description, url, siteName: t("siteName"), images },
    twitter: { card: "summary", title, description, images: images?.map((i) => i.url) },
  };
}

export default async function BrandProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("brand");
  const tc = await getTranslations("common");

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      products: true,
      recipes: {
        include: {
          author: { select: { name: true } },
        },
      },
      galleryPosts: {
        include: {
          author: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) notFound();

  const isOwner = session?.user?.id === company.ownerId;
  const typeLabel =
    company.type === "roaster" || company.type === "cafe" || company.type === "tea_brand"
      ? t(`companyType.${company.type}`)
      : t("companyType.equipment");

  return (
    <div className="bg-background-light min-h-screen flex flex-col relative overflow-hidden text-espresso">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/" aria-label={tc("back")} className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1 truncate" dir="auto">{company.name}</h1>
        <ShareButton url={`/brand/${company.id}`} title={t("shareTitle", { name: company.name })} />
      </header>

      <main className="flex-1 pb-24">
        {/* Profile banner */}
        <div className="p-4">
          <div className="bg-forest text-paper rounded-[20px] p-5 flex items-center gap-4">
            <div className="size-20 shrink-0 rounded-full overflow-hidden ring-4 ring-paper/15 bg-pine">
              <img
                src={company.logo || "/brand/banners/avatar-placeholder.svg"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl leading-tight flex items-center gap-2" dir="auto">
                <span className="truncate">{company.name}</span>
                {company.isVerified && (
                  <BrandIcon name="verified" label={tc("badges.verified")} className="text-xl text-leaf shrink-0" />
                )}
              </p>
              <p className="text-sm font-semibold text-paper/75 mt-1">
                {company.isVerified ? t("verifiedType", { type: typeLabel }) : typeLabel}
              </p>
              {company.description && (
                <p className="text-sm text-paper/80 leading-relaxed mt-2 line-clamp-3" dir="auto">{company.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4">
          <FollowButton userId={company.ownerId} className="flex-1" />
          {isOwner && (
            <PromoteButton companyId={company.id} companyName={company.name} />
          )}
          {company.contactEmail && (
            <a
              href={`mailto:${company.contactEmail}`}
              aria-label={t("emailBrand")}
              className="border border-espresso/15 px-4 py-3 rounded-xl flex items-center justify-center hover:border-primary/40 transition-colors"
            >
              <MaterialIcon icon="mail" className="block text-primary" />
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3 px-4 pt-4">
          {[
            { value: String(company.products.length), label: t("stats.products") },
            { value: String(company.recipes.length), label: t("stats.recipes") },
            { value: String(company.galleryPosts.length), label: t("stats.gallery") },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-surface rounded-2xl border border-espresso/10 p-3 text-center">
              <p className="font-display text-2xl tabular-nums">{s.value}</p>
              <p className="text-espresso/60 text-[11px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <BrandTabs
          products={company.products}
          recipes={company.recipes}
          galleryPosts={company.galleryPosts}
          isOwner={isOwner}
          companyId={company.id}
        />
      </main>

      <BottomNav />
    </div>
  );
}
