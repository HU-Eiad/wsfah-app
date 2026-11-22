import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Mark an external payment as applied. Returns true the first time for a given id,
 * false if it was already applied (the primary key makes this race-safe).
 */
export async function claimPayment(id: string, kind: string, userId?: string | null): Promise<boolean> {
  try {
    await prisma.processedPayment.create({ data: { id, kind, userId: userId ?? null } });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return false;
    throw e;
  }
}

/** Release a claim when applying the payment failed, so a retry can apply it. */
export async function releasePayment(id: string) {
  await prisma.processedPayment.delete({ where: { id } }).catch(() => {});
}

export function planExpiry(planSlug: string, from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + (planSlug.endsWith("-yearly") ? 12 : 1));
  return d;
}
