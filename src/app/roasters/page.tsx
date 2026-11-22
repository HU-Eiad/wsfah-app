import SafeImage from "@/components/SafeImage";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import MaterialIcon from "@/components/MaterialIcon";
import BrandIcon from "@/components/BrandIcon";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function RoastersPage() {
  const t = await getTranslations("roasters");
  const tc = await getTranslations("common");
  const companies = await prisma.company.findMany({
    where: { status: "APPROVED" },
    include: {
      owner: { select: { name: true, image: true } },
      _count: { select: { products: true, recipes: true, galleryPosts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const knownTypes = ["roaster", "cafe", "tea_brand", "equipment"];
  const typeLabel = (type: string) => (knownTypes.includes(type) ? t(`companyType.${type}`) : type);

  const typeIcons: Record<string, string> = {
    roaster: "local_fire_department",
    cafe: "coffee",
    tea_brand: "emoji_food_beverage",
    equipment: "blender",
  };

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/" aria-label={tc("back")} className="size-10 shrink-0 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        {companies.length === 0 ? (
          <div className="py-16 text-center">
            <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
            <p className="text-sm text-espresso/70">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/brand/${c.id}`}
                className="bg-surface rounded-2xl border border-espresso/10 p-4 flex flex-col hover:border-primary/40 transition-colors group"
              >
                {/* Logo + verified */}
                <div className="flex items-start justify-between mb-3">
                  <div className="size-14 rounded-full ring-1 ring-espresso/10 overflow-hidden bg-oat-milk">
                    <SafeImage
                      src={c.logo || "/brand/banners/avatar-placeholder.svg"}
                      alt=""
                      width={56}
                      height={56}
                      sizes="56px"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {c.isVerified && (
                    <span className="bg-brand-gold text-white text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <BrandIcon name="verified" className="text-xs" /> {t("verified")}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm truncate mb-1 group-hover:text-primary transition-colors" dir="auto">{c.name}</h3>
                <span className="inline-flex items-center gap-1 text-espresso/60 text-[11px] font-semibold mb-2">
                  <MaterialIcon icon={typeIcons[c.type] || "store"} className="text-primary text-xs" />
                  {typeLabel(c.type)}
                </span>
                {c.description && (
                  <p className="text-xs text-espresso/60 line-clamp-2 mb-3 leading-relaxed" dir="auto">{c.description}</p>
                )}

                {/* Stats Row */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-espresso/10 text-espresso/60">
                  <div className="flex items-center gap-1" title={t("stats.products")}>
                    <MaterialIcon icon="inventory_2" className="text-xs" />
                    <span className="text-[11px] font-bold tabular-nums">{c._count.products}</span>
                  </div>
                  <div className="flex items-center gap-1" title={t("stats.recipes")}>
                    <MaterialIcon icon="menu_book" className="text-xs" />
                    <span className="text-[11px] font-bold tabular-nums">{c._count.recipes}</span>
                  </div>
                  <div className="flex items-center gap-1" title={t("stats.gallery")}>
                    <MaterialIcon icon="photo_library" className="text-xs" />
                    <span className="text-[11px] font-bold tabular-nums">{c._count.galleryPosts}</span>
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
