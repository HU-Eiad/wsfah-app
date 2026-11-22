import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { parseBody, userUpdateSchema } from "@/lib/validation";
import { logAudit, AUDIT } from "@/lib/audit";
import { getAuthUser } from "@/lib/auth-mobile";
import { signMobileToken } from "@/lib/jwt";
import { getUserTier } from "@/lib/features";

async function getUserId(req: Request): Promise<string | null> {
  // Bearer token (mobile) or NextAuth session (web); rejects suspended users and revoked tokens.
  const user = await getAuthUser(req);
  return user?.id ?? null;
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      recipes: {
        select: {
          id: true, title: true, slug: true, imageUrl: true,
          rating: true, category: true, likes: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      badges: { include: { badge: true } },
      challenges: { include: { challenge: true } },
      saves: {
        include: {
          recipe: {
            select: { id: true, title: true, slug: true, imageUrl: true, rating: true, likes: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, tokenVersion: _tv, ...safeUser } = user;

  // Resolve effective tier (Pro if part of active roaster)
  const effectiveTier = await getUserTier(userId);

  return NextResponse.json({ ...safeUser, effectiveTier });
}

export async function PATCH(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(userUpdateSchema, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
  if (parsed.data.image !== undefined) data.image = parsed.data.image;
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, password: true },
  });
  if (!current) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (parsed.data.email !== undefined && parsed.data.email !== current.email) {
    // A changed email must be verified again (Google sign-in links accounts by email).
    data.email = parsed.data.email;
    data.emailVerified = null;
  }
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone;

  let passwordChanged = false;
  if (parsed.data.newPassword) {
    // Accounts that already have a password must prove they know it.
    // (Google-only accounts have none and may set their first password.)
    if (current.password) {
      const valid = parsed.data.currentPassword
        ? await compare(parsed.data.currentPassword, current.password)
        : false;
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }
    data.password = await hash(parsed.data.newPassword, 12);
    // Revoke every existing mobile session.
    data.tokenVersion = { increment: 1 };
    passwordChanged = true;
    logAudit(userId, AUDIT.PASSWORD_CHANGE, "user", userId);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, name: true, email: true, phone: true,
        image: true, bio: true, role: true, status: true, points: true, tokenVersion: true,
      },
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Email or phone already in use" }, { status: 409 });
    }
    throw e;
  }

  logAudit(userId, AUDIT.PROFILE_UPDATE, "user", userId, {
    fields: Object.keys(data).filter((k) => k !== "password"),
  });

  const { tokenVersion, ...result } = updated;
  // After a password change, hand the caller a fresh mobile token (old ones are revoked).
  const token = passwordChanged
    ? await signMobileToken({ id: updated.id, role: updated.role, tokenVersion })
    : undefined;
  return NextResponse.json({ ...result, ...(token ? { token } : {}) });
}
