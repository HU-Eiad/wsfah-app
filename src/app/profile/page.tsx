import SafeImage from "@/components/SafeImage";
import BottomNav from "@/components/BottomNav";
import MaterialIcon from "@/components/MaterialIcon";
import ProfileTabs from "@/components/ProfileTabs";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const t = await getTranslations("profile");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
      badges: {
        include: { badge: true },
      },
      saves: {
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              slug: true,
              imageUrl: true,
              rating: true,
              likes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      likes: {
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              slug: true,
              imageUrl: true,
              rating: true,
              likes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      companies: {
        take: 1,
        select: { id: true, name: true },
      },
    },
  });

  if (!user) redirect("/login");

  const badgeColors: Record<string, string> = {
    amber: "text-amber-500",
    orange: "text-orange-500",
    green: "text-green-600",
    primary: "text-primary",
  };

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  // Role badge configuration
  const roleBadgeConfig: Record<string, { label: string; color: string; icon?: string }> = {
    USER: { label: t("roles.USER"), color: "bg-green-100 text-green-700 border-green-200" },
    CREATOR: { label: t("roles.CREATOR"), color: "bg-purple-100 text-purple-700 border-purple-200", icon: "verified" },
    BRAND_ADMIN: { label: t("roles.BRAND_ADMIN"), color: "bg-amber-100 text-amber-700 border-amber-200" },
  };

  const currentRoleBadge = roleBadgeConfig[user.role] || roleBadgeConfig.USER;

  // Creator analytics
  const totalLikes = user.recipes.reduce((sum, r) => sum + r.likes, 0);
  const avgRating =
    user.recipes.length > 0
      ? user.recipes.reduce((sum, r) => sum + r.rating, 0) / user.recipes.length
      : 0;

  // Brand admin company
  const company = user.companies.length > 0 ? user.companies[0] : null;

  return (
    <div className="bg-background-light text-espresso min-h-screen flex flex-col max-w-screen-sm mx-auto w-full">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-bar px-4 py-3 flex items-center gap-2 border-b border-espresso/10">
        <Link href="/" aria-label={t("back")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="arrow_forward" />
        </Link>
        <h1 className="text-xl flex-1">{t("title")}</h1>
        <Link href="/settings" aria-label={t("settings")} className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk">
          <MaterialIcon icon="settings" />
        </Link>
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
            <h2 dir="auto" className="font-display text-2xl">{user.name}</h2>

            {/* Role Badge */}
            <div className="flex justify-center">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentRoleBadge.color}`}
              >
                {currentRoleBadge.icon && (
                  <MaterialIcon icon={currentRoleBadge.icon} className="text-sm" filled />
                )}
                <span>{currentRoleBadge.label}</span>
              </span>
            </div>

            {user.bio && (
              <p dir="auto" className="text-espresso/70 text-sm leading-relaxed max-w-xs mx-auto px-4">{user.bio}</p>
            )}
          </div>

          {/* Stats */}
          <div className="w-full flex divide-x divide-espresso/10 bg-surface rounded-2xl border border-espresso/10 py-3">
            {[
              { value: String(user.recipes.length), label: t("stats.recipes") },
              { value: formatCount(user.followers), label: t("stats.followers") },
              { value: formatCount(user.following), label: t("stats.following") },
              { value: user.avgRating.toFixed(1), label: t("stats.avgRating"), star: true },
            ].map((s) => (
              <div key={s.label} className="flex-1 text-center px-2">
                <div className="flex items-center justify-center gap-1">
                  <p className="font-display text-xl">{s.value}</p>
                  {s.star && <MaterialIcon icon="star" className="text-crema text-sm" filled />}
                </div>
                <p className="text-xs text-espresso/60 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="w-full flex gap-3">
            <Link href="/settings" className="flex-1 bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center">
              {t("editProfile")}
            </Link>
            <ShareButton
              url={`/profile/${user.id}`}
              title={t("shareTitle", { name: user.name ?? "" })}
              className="relative border border-espresso/15 rounded-xl px-4 py-3 text-espresso/70 hover:border-primary/40 transition-colors"
            />
          </div>
        </div>

        {/* Role-Specific Quick Actions */}
        {user.role === "CREATOR" && (
          <div className="px-4 pb-4">
            <div className="bg-surface border border-espresso/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MaterialIcon icon="analytics" className="text-primary text-xl" />
                </div>
                <div className="text-start">
                  <h3 className="font-bold text-sm">{t("analytics.title")}</h3>
                  <p className="text-xs text-espresso/60">{t("analytics.subtitle")}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-oat-milk rounded-xl p-3 text-center">
                  <p className="font-display text-lg">{user.recipes.length}</p>
                  <p className="text-[11px] text-espresso/60 font-medium">{t("analytics.totalRecipes")}</p>
                </div>
                <div className="bg-oat-milk rounded-xl p-3 text-center">
                  <p className="font-display text-lg">{formatCount(totalLikes)}</p>
                  <p className="text-[11px] text-espresso/60 font-medium">{t("analytics.totalLikes")}</p>
                </div>
                <div className="bg-oat-milk rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <p className="font-display text-lg">{avgRating.toFixed(1)}</p>
                    <MaterialIcon icon="star" className="text-xs text-crema" filled />
                  </div>
                  <p className="text-[11px] text-espresso/60 font-medium">{t("analytics.avgRating")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role === "BRAND_ADMIN" && company && (
          <div className="px-4 pb-4">
            <Link href={`/brand/${company.id}`}>
              <div className="bg-surface border border-espresso/10 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors">
                <div className="size-12 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                  <MaterialIcon icon="storefront" className="text-brand-gold text-2xl" />
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <h3 className="font-bold text-sm">{t("manageBrand")}</h3>
                  <p dir="auto" className="text-xs text-espresso/60 truncate">{company.name}</p>
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

        {/* Tabs + Recipes / Saved / Liked */}
        <ProfileTabs
          recipes={user.recipes}
          saves={user.saves}
          likes={user.likes}
        />

        {/* Sign Out removed — available in Settings */}
      </main>

      <BottomNav />
    </div>
  );
}
