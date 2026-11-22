import SafeImage from "@/components/SafeImage";
import Image from "next/image";
import BottomNav from "@/components/BottomNav";
import MaterialIcon from "@/components/MaterialIcon";
import FollowButton from "@/components/FollowButton";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isOwnProfile = session?.user?.id === id;

  // If viewing own profile, redirect to /profile
  if (isOwnProfile) redirect("/profile");
  const t = await getTranslations("profileDetail");

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      recipes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          rating: true,
          likes: true,
        },
      },
      badges: { include: { badge: true } },
      companies: { take: 1, select: { id: true, name: true } },
    },
  });

  if (!user) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Image src="/brand/banners/empty-state.svg" alt="" width={160} height={120} className="w-40 h-auto mx-auto mb-4" />
          <p className="text-sm text-espresso/70 mb-4">{t("notFound")}</p>
          <Link href="/" className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors">{t("home")}</Link>
        </div>
      </div>
    );
  }

  const roleBadgeConfig: Record<string, { label: string; color: string; icon?: string }> = {
    USER: { label: t("roles.USER"), color: "bg-green-100 text-green-700 border-green-200" },
    CREATOR: { label: t("roles.CREATOR"), color: "bg-purple-100 text-purple-700 border-purple-200", icon: "verified" },
    BRAND_ADMIN: { label: t("roles.BRAND_ADMIN"), color: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const currentRoleBadge = roleBadgeConfig[user.role] || roleBadgeConfig.USER;

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  // Check privacy: show followers count based on user's privacy settings
  const showFollowers = user.privacyFollowers === "everyone";

  const badgeColors: Record<string, string> = {
    amber: "text-amber-500",
    orange: "text-orange-500",
    green: "text-green-600",
    primary: "text-primary",
  };

  const company = user.companies.length > 0 ? user.companies[0] : null;

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col max-w-screen-sm mx-auto w-full">
      <header className="sticky top-0 z-30 glass-bar px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/" aria-label={t("back")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
      </header>

      <main className="flex-1 pb-28">
        {/* Profile Header */}
        <div className="flex px-6 pt-8 pb-6 flex-col items-center text-center gap-4">
          <SafeImage
            src={user.image || "/brand/banners/avatar-placeholder.svg"}
            alt=""
            width={96}
            height={96}
            sizes="96px"
            className="size-24 rounded-full object-cover ring-4 ring-surface bg-oat-milk"
          />
          <div className="space-y-2">
            <h2 className="font-display text-2xl" dir="auto">{user.name}</h2>
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentRoleBadge.color}`}>
                {currentRoleBadge.icon && <MaterialIcon icon={currentRoleBadge.icon} className="text-sm" filled />}
                <span dir="auto">{currentRoleBadge.label}</span>
              </span>
            </div>
            {user.bio && (
              <p className="text-espresso/70 text-sm leading-relaxed max-w-xs mx-auto px-4" dir="auto">{user.bio}</p>
            )}
          </div>

          {/* Stats */}
          <div className="w-full flex divide-x divide-espresso/10 bg-surface rounded-2xl border border-espresso/10 py-3">
            <div className="flex-1 text-center px-2">
              <p className="font-display text-xl">{user.recipes.length}</p>
              <p className="text-xs text-espresso/60 mt-0.5">{t("stats.recipes")}</p>
            </div>
            {showFollowers && (
              <>
                <div className="flex-1 text-center px-2">
                  <p className="font-display text-xl">{formatCount(user.followers)}</p>
                  <p className="text-xs text-espresso/60 mt-0.5">{t("stats.followers")}</p>
                </div>
                <div className="flex-1 text-center px-2">
                  <p className="font-display text-xl">{formatCount(user.following)}</p>
                  <p className="text-xs text-espresso/60 mt-0.5">{t("stats.following")}</p>
                </div>
              </>
            )}
            <div className="flex-1 text-center px-2">
              <div className="flex items-center justify-center gap-1">
                <p className="font-display text-xl">{user.avgRating.toFixed(1)}</p>
                <MaterialIcon icon="star" className="text-crema text-sm" filled />
              </div>
              <p className="text-xs text-espresso/60 mt-0.5">{t("stats.avgRating")}</p>
            </div>
          </div>

          <div className="w-full flex gap-3">
            <FollowButton userId={user.id} className="flex-1" />
            <ShareButton
              url={`/profile/${user.id}`}
              title={t("shareTitle", { name: user.name ?? "" })}
              className="relative border border-espresso/15 rounded-xl px-4 py-3 text-espresso/70 hover:border-primary/40 transition-colors"
            />
          </div>
        </div>

        {/* Brand link */}
        {company && (
          <div className="px-4 pb-4">
            <Link href={`/brand/${company.id}`}>
              <div className="bg-surface border border-espresso/10 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors">
                <div className="size-12 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                  <MaterialIcon icon="storefront" className="text-brand-gold text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm" dir="auto">{company.name}</h3>
                  <p className="text-xs text-espresso/60">{t("viewBrand")}</p>
                </div>
                <MaterialIcon icon="chevron_left" className="text-espresso/50 text-xl shrink-0" />
              </div>
            </Link>
          </div>
        )}

        {/* Badges */}
        {user.badges.length > 0 && (
          <section className="px-4 py-6">
            <h2 className="text-xl mb-4">{t("badges")}</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {user.badges.map((ub) => (
                <div key={ub.id} className="flex flex-col items-center gap-2 shrink-0 min-w-[72px]">
                  <div className="size-14 rounded-2xl bg-surface border border-espresso/10 flex items-center justify-center">
                    <MaterialIcon
                      icon={ub.badge.icon}
                      className={`text-2xl ${badgeColors[ub.badge.color] || "text-primary"}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-espresso/70 text-center">
                    {ub.badge.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recipes */}
        {user.recipes.length > 0 && (
          <section className="px-4 py-4">
            <h2 className="text-xl mb-4">{t("recipes")}</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {user.recipes.map((r) => (
                <Link href={`/recipe/${r.id}`} key={r.id} className="flex flex-col gap-3">
                  <div className="aspect-[3/4] rounded-[20px] bg-pine overflow-hidden relative">
                    <SafeImage
                      fill
                      sizes="(min-width: 768px) 33vw, 50vw"
                      className="object-cover"
                      src={r.imageUrl || "/brand/banners/recipe-placeholder.svg"}
                      fallbackSrc="/brand/banners/recipe-placeholder.svg"
                      alt=""
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-snug mb-1" dir="auto">{r.title}</h3>
                    <p className="text-xs text-espresso/60 flex items-center gap-1">
                      {t("likes", { count: r.likes })}
                      {r.rating > 0 && (
                        <> &bull; {r.rating.toFixed(1)} <MaterialIcon icon="star" filled className="text-xs text-crema" /></>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
