import { prisma } from "./prisma";

// Tier names match User.subscriptionTier values in the database
export const TIER_LIMITS = {
  FREE: {
    recipes: 3,
    saves: 20,
    journalLogs: 50,
    collections: false,
    messages: false,
    groups: false,
    events: false,
    equipment: false,
    gallery: false,
    analytics: false,
  },
  PRO: {
    recipes: -1, // unlimited
    saves: -1,
    journalLogs: -1,
    collections: true,
    messages: true,
    groups: true,
    events: true,
    equipment: true,
    gallery: true,
    analytics: false,
  },
  PREMIUM: {
    recipes: -1,
    saves: -1,
    journalLogs: -1,
    collections: true,
    messages: true,
    groups: true,
    events: true,
    equipment: true,
    gallery: true,
    analytics: true,
  },
} as const;

export type TierName = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  const normalized = tier.toUpperCase() as TierName;
  return TIER_LIMITS[normalized] || TIER_LIMITS.FREE;
}

/** Check if user can create a counted resource (recipes, saves, journalLogs) */
export function canCreateCount(tier: string, currentCount: number, resource: "recipes" | "saves" | "journalLogs"): boolean {
  const limits = getTierLimits(tier);
  const limit = limits[resource];
  return limit === -1 || currentCount < limit;
}

/** Check if user has access to a boolean-gated feature */
export function hasFeature(tier: string, feature: "collections" | "messages" | "groups" | "events" | "equipment" | "gallery" | "analytics"): boolean {
  const limits = getTierLimits(tier);
  return !!limits[feature];
}

/** A brand subscription only counts once it has been paid for or trialled, which
 *  always sets an expiry date. New brands start with tier "basic" and no expiry. */
function activeCompanySubscription(now: Date) {
  return { subscriptionExpiresAt: { gte: now } };
}

/** Get user's effective tier from database.
 *  Personal plans expire at subscriptionExpiresAt; legacy trials (no expiry recorded)
 *  expire at trialEndsAt. Admin-granted plans without any dates do not expire.
 *  Owners and active members of a brand with a live subscription get Pro. */
export async function getUserTier(userId: string): Promise<string> {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, subscriptionExpiresAt: true, trialEndsAt: true, trialPlanSlug: true },
  });
  let personalTier = user?.subscriptionTier || "FREE";

  if (user && personalTier.toUpperCase() !== "FREE") {
    const expired = user.subscriptionExpiresAt
      ? user.subscriptionExpiresAt < now
      : !!(user.trialPlanSlug && user.trialEndsAt && user.trialEndsAt < now);
    if (expired) personalTier = "FREE";
  }

  if (personalTier.toUpperCase() !== "FREE") return personalTier;

  const ownedBrand = await prisma.company.findFirst({
    where: { ownerId: userId, ...activeCompanySubscription(now) },
    select: { id: true },
  });
  if (ownedBrand) return "PRO";

  const membership = await prisma.companyMember.findFirst({
    where: { userId, status: "active", company: activeCompanySubscription(now) },
    select: { id: true },
  });
  if (membership) return "PRO";

  return personalTier;
}

/** Helper: check tier + return 403 response if blocked */
export function tierBlockedResponse(feature: string) {
  return {
    error: `Upgrade required: ${feature} is not available on your current plan.`,
    upgradeRequired: true,
    feature,
  };
}
