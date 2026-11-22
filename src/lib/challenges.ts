import { prisma } from "@/lib/prisma";

/**
 * Automatically tracks challenge progress for a user based on their actions.
 * Finds all ACTIVE challenges matching the category and increments progress.
 * Auto-completes and awards points when maxProgress is reached.
 *
 * Fire-and-forget — errors are logged but never block the caller.
 */
export async function trackChallengeProgress(
  userId: string,
  category: string
): Promise<void> {
  try {
    // Find all active user challenges in this category
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId,
        status: "ACTIVE",
        challenge: { category, isActive: true },
      },
      include: { challenge: true },
    });

    for (const uc of userChallenges) {
      const newProgress = Math.min(uc.currentProgress + 1, uc.challenge.maxProgress);
      const isCompleted = newProgress >= uc.challenge.maxProgress;

      // Compare-and-set on the progress we read, so concurrent actions can't
      // complete the same challenge (and award its points) twice.
      const res = await prisma.userChallenge.updateMany({
        where: { id: uc.id, status: "ACTIVE", currentProgress: uc.currentProgress },
        data: {
          currentProgress: newProgress,
          ...(isCompleted
            ? { status: "COMPLETED", completedAt: new Date() }
            : {}),
        },
      });

      if (isCompleted && res.count === 1) {
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: uc.challenge.rewardPoints } },
        });
      }
    }
  } catch (err) {
    console.error("Challenge progress tracking error:", err);
  }
}
