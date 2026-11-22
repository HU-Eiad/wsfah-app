import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-mobile";

// POST /api/stamp-cards/stamp — collect a stamp via QR code (one-time use)
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stampCode } = await req.json().catch(() => ({}));
  if (!stampCode) {
    return NextResponse.json({ error: "stampCode required" }, { status: 400 });
  }

  // Look up the one-time code in DB
  const codeRecord = await prisma.stampCode.findUnique({
    where: { code: stampCode },
    include: { stampCard: true },
  });

  if (!codeRecord) {
    return NextResponse.json({ error: "Invalid stamp code" }, { status: 400 });
  }

  if (codeRecord.isUsed) {
    return NextResponse.json({ error: "This stamp code has already been used" }, { status: 400 });
  }

  if (codeRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "This stamp code has expired" }, { status: 400 });
  }

  // Staff can't stamp their own card with a code they issued.
  if (codeRecord.issuedById === user.id) {
    return NextResponse.json({ error: "You can't use a stamp code you issued" }, { status: 403 });
  }

  if (!codeRecord.stampCard.isActive) {
    return NextResponse.json({ error: "Stamp card is no longer active" }, { status: 400 });
  }

  // Find or create user's active stamp card
  let userStampCard = await prisma.userStampCard.findFirst({
    where: {
      userId: user.id,
      stampCardId: codeRecord.stampCardId,
      status: "ACTIVE",
    },
    include: { stampCard: true },
  });

  if (!userStampCard) {
    userStampCard = await prisma.userStampCard.create({
      data: { userId: user.id, stampCardId: codeRecord.stampCardId },
      include: { stampCard: true },
    });
  }

  // Check cooldown
  if (userStampCard.lastStampAt) {
    const cooldownMs = userStampCard.stampCard.stampCooldownMinutes * 60 * 1000;
    const timeSinceLastStamp = Date.now() - userStampCard.lastStampAt.getTime();
    if (timeSinceLastStamp < cooldownMs) {
      const remainingMin = Math.ceil((cooldownMs - timeSinceLastStamp) / 60000);
      return NextResponse.json(
        { error: `Please wait ${remainingMin} minute(s) before scanning again` },
        { status: 429 }
      );
    }
  }

  const newStampCount = userStampCard.currentStamps + 1;
  const isCompleted = newStampCount >= userStampCard.stampCard.stampsRequired;

  // Atomic and race-safe: the code is burned only if still unused, and the card only
  // advances from the stamp count we read — concurrent scans can't double-stamp
  // or slip past the cooldown.
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const burn = await tx.stampCode.updateMany({
        where: { id: codeRecord.id, isUsed: false, expiresAt: { gte: now } },
        data: { isUsed: true, usedById: user.id, usedAt: now },
      });
      if (burn.count === 0) throw new StampError("This stamp code has already been used", 400);

      const advance = await tx.userStampCard.updateMany({
        where: { id: userStampCard.id, status: "ACTIVE", currentStamps: userStampCard.currentStamps },
        data: {
          currentStamps: newStampCount,
          lastStampAt: now,
          ...(isCompleted && { status: "COMPLETED", completedAt: now }),
        },
      });
      if (advance.count === 0) throw new StampError("Please try again", 409);

      await tx.stamp.create({
        data: {
          userStampCardId: userStampCard.id,
          stampCodeId: codeRecord.id,
          stampCode: stampCode,
          stampedById: codeRecord.issuedById,
        },
      });

      return tx.userStampCard.findUniqueOrThrow({
        where: { id: userStampCard.id },
        include: {
          stampCard: {
            select: {
              title: true,
              stampsRequired: true,
              rewardDescription: true,
              company: { select: { name: true, logo: true } },
            },
          },
        },
      });
    });
  } catch (e) {
    if (e instanceof StampError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  return NextResponse.json({
    success: true,
    currentStamps: updated.currentStamps,
    stampsRequired: updated.stampCard.stampsRequired,
    isCompleted,
    rewardDescription: isCompleted ? updated.stampCard.rewardDescription : null,
    stampCardTitle: updated.stampCard.title,
    brandName: updated.stampCard.company.name,
    brandLogo: updated.stampCard.company.logo,
    userStampCard: updated,
  });
}

class StampError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
