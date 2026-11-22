import SafeImage from "@/components/SafeImage";
import Image from "next/image";
import AdSlot from "@/components/AdSlot";
import BottomNav from "@/components/BottomNav";
import PromotedBrands from "@/components/PromotedBrands";
import ExploreUpload from "@/components/ExploreUpload";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const session = await auth();
  const t = await getTranslations("explore");

  const posts = await prisma.galleryPost.findMany({
    include: {
      author: { select: { id: true, name: true, image: true } },
      company: { select: { id: true, name: true, logo: true } },
      _count: { select: { galleryLikes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Check if current user is a brand admin with a company
  let brandCompany: { id: string; name: string } | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        companies: { take: 1, select: { id: true, name: true } },
      },
    });
    if (user?.role === "BRAND_ADMIN" && user.companies.length > 0) {
      brandCompany = user.companies[0];
    }
  }

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 glass-bar px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <h1 className="text-2xl flex-1">{t("title")}</h1>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {/* Upload form for brand admins only */}
        {brandCompany && (
          <ExploreUpload companyId={brandCompany.id} companyName={brandCompany.name} />
        )}

        {/* Promoted Brands */}
        <PromotedBrands placement="EXPLORE_TOP" />

        {/* Ad Banner */}
        <AdSlot slot="explore-top" format="horizontal" />

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-sm font-semibold text-espresso/70">{t("emptyTitle")}</p>
            <p className="text-xs text-espresso/60 mt-1">{t("emptyBody")}</p>
          </div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {posts.map((post) => (
              <Link
                href={`/explore/${post.id}`}
                key={post.id}
                className="break-inside-avoid rounded-[20px] overflow-hidden bg-surface border border-espresso/10 block"
              >
                {post.imageUrl && post.mediaType === "video" ? (
                  <video
                    src={post.imageUrl}
                    playsInline
                    muted
                    preload="metadata"
                    className="w-full object-cover"
                  />
                ) : post.imageUrl ? (
                  <SafeImage src={post.imageUrl} alt={post.caption || t("postAlt")} width={0} height={0} sizes="(min-width: 672px) 336px, 50vw" className="w-full h-auto object-cover" />
                ) : null}
                <div className="p-3">
                  {/* Roaster Info - Prominent */}
                  {post.company && (
                    <div className="flex items-center gap-2 mb-2">
                      <SafeImage
                        src={post.company.logo || "/brand/banners/avatar-placeholder.svg"}
                        alt=""
                        width={28}
                        height={28}
                        sizes="28px"
                        className="size-7 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
                      />
                      <div className="flex-1 min-w-0">
                        <p dir="auto" className="text-xs font-bold truncate">{post.company.name}</p>
                      </div>
                      <BrandIcon name="verified" className="text-primary text-sm shrink-0" label={t("verified")} />
                    </div>
                  )}
                  {!post.company && (
                    <div className="flex items-center gap-2 mb-2">
                      <SafeImage
                        src={post.author.image || "/brand/banners/avatar-placeholder.svg"}
                        alt=""
                        width={28}
                        height={28}
                        sizes="28px"
                        className="size-7 rounded-full object-cover bg-oat-milk ring-1 ring-espresso/10"
                      />
                      <p dir="auto" className="text-xs font-bold truncate">{post.author.name}</p>
                    </div>
                  )}
                  {post.caption && <p dir="auto" className="text-xs text-espresso/70 leading-relaxed line-clamp-2">{post.caption}</p>}
                  {/* Like count */}
                  <div className="flex items-center gap-1 mt-2 text-espresso/60">
                    <MaterialIcon icon="favorite" className="text-xs" />
                    <span className="text-[11px] font-bold">{post._count.galleryLikes}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
