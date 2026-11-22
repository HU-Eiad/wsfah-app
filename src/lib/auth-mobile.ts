import { auth } from "./auth";
import { verifyMobileToken } from "./jwt";
import { prisma } from "./prisma";

/**
 * Get authenticated user ID from either NextAuth session or mobile Bearer token.
 * Use this instead of `auth()` in API routes that need to support both web and mobile.
 *
 * Suspended users are rejected, and mobile tokens whose version no longer matches
 * User.tokenVersion (password changed/reset, account suspended) are treated as revoked.
 */
export async function getAuthUser(req: Request): Promise<{ id: string; role: string } | null> {
  // Check Bearer token first (mobile app)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const tokenData = await verifyMobileToken(authHeader.slice(7));
    if (tokenData) {
      const user = await prisma.user.findUnique({
        where: { id: tokenData.id },
        select: { id: true, role: true, status: true, tokenVersion: true },
      });
      if (!user || user.status === "SUSPENDED") return null;
      if (user.tokenVersion !== tokenData.tokenVersion) return null;
      return { id: user.id, role: user.role };
    }
  }
  // Fall back to NextAuth session (web app)
  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, status: true },
    });
    if (!user || user.status === "SUSPENDED") return null;
    return { id: user.id, role: user.role || "USER" };
  }
  return null;
}
