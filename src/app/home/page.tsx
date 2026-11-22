import SafeImage from "@/components/SafeImage";
import BottomNav from "@/components/BottomNav";
import MaterialIcon from "@/components/MaterialIcon";
import AdSlot from "@/components/AdSlot";
import PromotedBrands from "@/components/PromotedBrands";
import BrandIcon, { CATEGORY_ICONS } from "@/components/BrandIcon";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const [featuredRecipe, categories, trendingRecipes, currentUser, roasters] = await Promise.all([
    prisma.recipe.findFirst({
      where: { isFeatured: true },
      include: {
        author: { select: { name: true } },
        brand: { select: { name: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.recipe.findMany({
      take: 4,
      orderBy: { rating: "desc" },
      include: {
        author: { select: { name: true, image: true } },
        brand: { select: { name: true } },
      },
    }),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true, image: true },
        })
      : null,
    prisma.company.findMany({
      where: { isVerified: true },
      select: { id: true, name: true, logo: true, type: true },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const userName = currentUser?.name?.split(" ")[0] || tc("guest");
  const userImage = currentUser?.image || "/brand/banners/avatar-placeholder.svg";
  const recipePlaceholder = "/brand/banners/recipe-placeholder.svg";


  // Server time is UTC; greet by the hour in Saudi Arabia.
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Riyadh" }).format(new Date())
  ) % 24;
  const greeting = hour < 12 ? t("greetingMorning", { name: userName }) : t("greetingEvening", { name: userName });

  const typeLabel = (type: string) =>
    type === "roaster" || type === "cafe" || type === "tea_brand" ? t(`companyType.${type}`) : t("companyType.equipment");

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background-light/85 backdrop-blur-md px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              href={session ? "/profile" : "/login"}
              aria-label={t("profile")}
              className="size-12 rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background-light block overflow-hidden"
            >
              <SafeImage alt="" width={48} height={48} sizes="48px" className="w-full h-full object-cover" src={userImage} />
            </Link>
            <h1 className="text-2xl leading-tight">
              {greeting}
            </h1>
          </div>
          <Link href="/notifications" aria-label={t("notifications")} className="relative size-11 rounded-full bg-oat-milk flex items-center justify-center">
            <MaterialIcon icon="notifications" className="text-espresso/80" />
            <span className="absolute top-2.5 end-2.5 size-2 bg-crema rounded-full" aria-hidden></span>
          </Link>
        </div>

        {/* Search */}
        <Link href="/search" className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3.5 border border-espresso/10">
          <MaterialIcon icon="search" className="text-espresso/50" />
          <span className="text-sm text-espresso/55 flex-1">{t("searchPlaceholder")}</span>
          <MaterialIcon icon="tune" className="text-espresso/50 text-xl" />
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 pb-28 overflow-y-auto">
        <PromotedBrands placement="HOME_TOP" />

        {/* Weekly pick */}
        {featuredRecipe && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl">{t("weeklyPick")}</h2>
              <Link href="/search" className="text-sm font-semibold text-primary">{tc("seeAll")}</Link>
            </div>
            <Link href={`/recipe/${featuredRecipe.slug}`} className="block">
              <article className="relative overflow-hidden rounded-[20px] bg-pine text-paper aspect-[4/5] flex flex-col justify-end">
                <SafeImage
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 672px) 640px, 100vw"
                  className="object-cover"
                  src={featuredRecipe.imageUrl || recipePlaceholder}
                  fallbackSrc={recipePlaceholder}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/75 to-pine/10"></div>
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-3 text-sm text-paper/85">
                    {featuredRecipe.isVerified && (
                      <span className="inline-flex items-center gap-1 bg-paper text-pine text-xs font-bold px-2 py-1 rounded-md">
                        <BrandIcon name="verified" className="text-sm" /> {tc("badges.verified")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <BrandIcon name="timer" className="text-base" /> {featuredRecipe.brewTime || tc("minutesShort", { count: 10 })}
                    </span>
                  </div>
                  <h3 dir="auto" className="font-display text-3xl leading-snug mb-2">{featuredRecipe.title}</h3>
                  <p className="text-sm text-paper/75 mb-5">
                    {t("byline", { author: featuredRecipe.brand?.name || featuredRecipe.author.name || "", category: featuredRecipe.category ?? "" })}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-paper/15 px-3 py-1.5 rounded-full">{featuredRecipe.difficulty}</span>
                    <span className="bg-paper text-pine px-5 py-2.5 rounded-xl font-bold text-sm">{t("openRecipe")}</span>
                  </div>
                </div>
              </article>
            </Link>
          </section>
        )}

        {/* Categories */}
        <section className="mb-10 -mx-6">
          <h2 className="px-6 mb-4 text-xl">{t("categories")}</h2>
          <div className="flex overflow-x-auto gap-3 px-6 no-scrollbar">
            {categories.map((cat) => (
              <Link
                href={`/search?category=${encodeURIComponent(cat.name)}`}
                key={cat.id}
                className="flex flex-col items-center gap-2 shrink-0 w-[76px] group"
              >
                <div className="size-[68px] rounded-2xl bg-surface border border-espresso/10 text-forest dark:text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-on-primary">
                  {CATEGORY_ICONS[cat.slug] ? (
                    <BrandIcon name={CATEGORY_ICONS[cat.slug]} className="text-[30px]" />
                  ) : (
                    <MaterialIcon icon={cat.icon} className="text-3xl" />
                  )}
                </div>
                <span className="text-xs font-medium text-espresso/75 text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured roasters */}
        {roasters.length > 0 && (
          <section className="mb-10 -mx-6">
            <div className="px-6 mb-4 flex items-baseline justify-between">
              <h2 className="text-xl">{t("featuredRoasters")}</h2>
              <Link href="/roasters" className="text-sm font-semibold text-primary">{tc("seeAll")}</Link>
            </div>
            <div className="flex overflow-x-auto gap-4 px-6 no-scrollbar">
              {roasters.map((r) => (
                <Link href={`/brand/${r.id}`} key={r.id} className="flex flex-col items-center gap-2 shrink-0 w-[76px] group">
                  <div className="size-16 rounded-full ring-1 ring-espresso/10 group-hover:ring-2 group-hover:ring-primary overflow-hidden bg-oat-milk transition-shadow">
                    {r.logo ? (
                      <SafeImage src={r.logo} alt="" width={64} height={64} sizes="64px" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center font-display text-2xl text-forest dark:text-primary">
                        {r.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="text-center w-full">
                    <span className="text-xs font-semibold block truncate" dir="auto">{r.name}</span>
                    <span className="text-[11px] text-espresso/60">{typeLabel(r.type)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <AdSlot slot="home-mid" format="horizontal" />

        {/* Trending */}
        <section className="mb-8">
          <h2 className="text-xl mb-4">{t("trending")}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {trendingRecipes.map((item) => (
              <Link href={`/recipe/${item.slug}`} key={item.id} className="flex flex-col gap-3">
                <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden bg-pine">
                  <SafeImage
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover"
                    src={item.imageUrl || recipePlaceholder}
                    fallbackSrc={recipePlaceholder}
                  />
                  <span
                    className={`absolute top-3 start-3 text-[11px] font-bold px-2 py-1 rounded-md text-white flex items-center gap-1 ${
                      item.brand ? "bg-brand-gold" : "bg-community-teal"
                    }`}
                  >
                    {item.brand ? (
                      <>
                        <BrandIcon name="verified" className="text-xs" /> {tc("badges.brand")}
                      </>
                    ) : (
                      <>
                        <MaterialIcon icon="group" className="text-xs" /> {tc("badges.community")}
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <h3 dir="auto" className="font-bold text-sm leading-snug mb-1">{item.title}</h3>
                  <p className="text-xs text-espresso/60 flex items-center gap-1">
                    <span className="truncate" dir="auto">{item.brand?.name || item.author.name}</span>
                    <span className="flex items-center gap-0.5 shrink-0">
                      <MaterialIcon icon="star" filled className="text-xs text-crema" />
                      {item.rating.toFixed(1)}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
