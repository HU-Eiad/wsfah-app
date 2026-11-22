import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-mobile";

/**
 * Challenge progress is tracked server-side (lib/challenges.ts) when the user
 * actually brews, posts, etc. Clients can no longer add progress themselves —
 * that allowed completing any challenge (and minting its points) in one request.
 * This endpoint now only reports the current progress.
 */
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const challengeId = typeof body?.challengeId === "string" ? body.challengeId : null;
  if (!challengeId) {
    return NextResponse.json({ error: "challengeId required" }, { status: 400 });
  }

  const uc = await prisma.userChallenge.findUnique({
    where: { userId_challengeId: { userId: user.id, challengeId } },
    include: { challenge: true },
  });

  if (!uc) {
    return NextResponse.json({ error: "لم تنضم لهذا التحدي بعد" }, { status: 404 });
  }

  return NextResponse.json({ ...uc, pointsAwarded: 0 });
}
