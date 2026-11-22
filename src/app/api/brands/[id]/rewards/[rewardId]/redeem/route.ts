import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-mobile";

// POST /api/brands/[id]/rewards/[rewardId]/redeem — spend app points for brand reward
export async function POST(req: Request, { params }: { params: Promise<{ id: string; rewardId: string }> }) {
  const { id, rewardId } = await params;
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reward = await prisma.brandReward.findFirst({
    where: { id: rewardId, companyId: id, isActive: true },
  });
  if (!reward) return NextResponse.json({ error: "Reward not found" }, { status: 404 });

  // Check date validity
  const now = new Date();
  if (reward.startDate && reward.startDate > now) {
    return NextResponse.json({ error: "Reward not yet available" }, { status: 400 });
  }
  if (reward.endDate && reward.endDate < now) {
    return NextResponse.json({ error: "Reward has expired" }, { status: 400 });
  }

  // Check stock
  if (reward.stock !== null && reward.stock <= 0) {
    return NextResponse.json({ error: "Reward out of stock" }, { status: 400 });
  }

  // Atomic and race-safe: points and stock are only decremented while they still
  // cover the redemption, so parallel requests can't overspend or oversell.
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    const result = await prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: { id: user.id, points: { gte: reward.pointsCost } },
        data: { points: { decrement: reward.pointsCost } },
      });
      if (debit.count === 0) throw new RedeemError("Insufficient points");

      if (reward.stock !== null) {
        const stock = await tx.brandReward.updateMany({
          where: { id: rewardId, stock: { gt: 0 } },
          data: { stock: { decrement: 1 } },
        });
        if (stock.count === 0) throw new RedeemError("Reward out of stock");
      }

      const redemption = await tx.brandRewardRedemption.create({
        data: {
          userId: user.id,
          brandRewardId: rewardId,
          pointsSpent: reward.pointsCost,
          expiresAt,
        },
      });
      const after = await tx.user.findUnique({ where: { id: user.id }, select: { points: true } });
      return { redemption, remainingPoints: after?.points ?? 0 };
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    if (e instanceof RedeemError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

class RedeemError extends Error {}
