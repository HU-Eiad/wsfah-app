import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-mobile";

export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { rewardId } = await req.json().catch(() => ({}));
  if (!rewardId) {
    return NextResponse.json({ error: "rewardId required" }, { status: 400 });
  }

  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.isEnabled) {
    return NextResponse.json({ error: "Reward not available" }, { status: 404 });
  }

  // Deduct points only if the balance still covers the cost at write time, so
  // parallel requests can't spend the same points twice.
  try {
    const result = await prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: { id: user.id, points: { gte: reward.pointsCost } },
        data: { points: { decrement: reward.pointsCost } },
      });
      if (debit.count === 0) throw new InsufficientPoints();
      const redemption = await tx.redemption.create({
        data: { userId: user.id, rewardId: reward.id, points: reward.pointsCost },
      });
      const after = await tx.user.findUnique({ where: { id: user.id }, select: { points: true } });
      return { redemption, remainingPoints: after?.points ?? 0 };
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    if (e instanceof InsufficientPoints) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }
    throw e;
  }
}

class InsufficientPoints extends Error {}
