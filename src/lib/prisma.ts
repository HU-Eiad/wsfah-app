import { PrismaClient } from "@prisma/client";

/**
 * Additive schema changes applied at startup (idempotent). Every query waits for
 * this to finish, so no request can hit a column/table that isn't there yet.
 * Statements must stay additive (ADD COLUMN / CREATE TABLE IF NOT EXISTS).
 */
const cols = [
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStartsAt" TIMESTAMP`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP`,
    `ALTER TABLE "UserChallenge" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP`,
    `ALTER TABLE "GalleryPost" ADD COLUMN IF NOT EXISTS "body" TEXT`,
    `ALTER TABLE "GalleryPost" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING'`,
    `ALTER TABLE "GalleryPost" ADD COLUMN IF NOT EXISTS "likes" INTEGER DEFAULT 0`,
    `ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "pricingId" TEXT`,
    `ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'UNPAID'`,
    `ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "paymentLinkId" TEXT`,
    `ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION`,
    `ALTER TABLE "PromotionRequest" ADD COLUMN IF NOT EXISTS "duration" INTEGER`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS "ProcessedPayment" ("id" TEXT NOT NULL PRIMARY KEY, "kind" TEXT NOT NULL, "userId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    // "Rituals" category retired (2026-11-23); kept only while a recipe still uses it.
    `DELETE FROM "Category" WHERE "slug" = 'rituals' AND NOT EXISTS (SELECT 1 FROM "Recipe" WHERE "category" IN ('rituals', 'طقوس'))`,
  ];

async function syncSchema(base: PrismaClient) {
  try {
    await base.$queryRaw`SELECT 1`;
    console.log("[db] Connected to PostgreSQL.");
  } catch (err) {
    console.error("[db] FAILED to connect:", err);
    return; // queries will surface their own connection errors
  }
  for (const sql of cols) {
    try {
      await base.$executeRawUnsafe(sql);
    } catch (err) {
      console.error(`[db] Schema sync statement failed: ${sql}`, err);
    }
  }
  console.log("[db] Schema sync done.");
}

function createClient() {
  const base = new PrismaClient();
  const ready = syncSchema(base);
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        await ready;
        return query(args);
      },
    },
  });
}

type ExtendedClient = ReturnType<typeof createClient>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedClient };

export const prisma: ExtendedClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
