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
        take: 100,
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
        take: 100,
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

  return NextResponse.json({ ...safeUser, effectiveTier, hasPassword: !!user.password });
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

/**
 * DELETE /api/users/me — delete the signed-in account.
 * Body: { password?: string } (required when the account has a password).
 *
 * The User row is anonymised rather than removed, so public content other people
 * interacted with (recipes, posts, comments, ratings) stays and shows a deleted user.
 * Personal and private data is deleted. Sign-in methods are removed and all mobile
 * tokens are revoked, so the account can't be used again.
 */
export async function DELETE(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.password && !(password && (await compare(password, user.password)))) {
    return NextResponse.json({ error: "Password is incorrect", code: "WRONG_PASSWORD" }, { status: 400 });
  }

  const ownsBrand = await prisma.company.count({ where: { ownerId: userId } });
  if (ownsBrand > 0) {
    return NextResponse.json(
      { error: "Transfer or delete your brand before deleting your account", code: "OWNS_BRAND" },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    // Keep other users' follower/following counters right.
    const following = await tx.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    const followers = await tx.follow.findMany({ where: { followingId: userId }, select: { followerId: true } });
    if (following.length) {
      await tx.user.updateMany({
        where: { id: { in: following.map((f) => f.followingId) }, followers: { gt: 0 } },
        data: { followers: { decrement: 1 } },
      });
    }
    if (followers.length) {
      await tx.user.updateMany({
        where: { id: { in: followers.map((f) => f.followerId) }, following: { gt: 0 } },
        data: { following: { decrement: 1 } },
      });
    }
    await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });

    // Personal / private data.
    await tx.account.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.mobilePushToken.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.brewLog.deleteMany({ where: { userId } });
    await tx.equipment.deleteMany({ where: { userId } });
    await tx.recipeSave.deleteMany({ where: { userId } });
    await tx.recipeLike.deleteMany({ where: { userId } });
    await tx.galleryPostLike.deleteMany({ where: { userId } });
    await tx.collection.deleteMany({ where: { userId } });
    await tx.activityEvent.deleteMany({ where: { userId } });
    await tx.companyMember.deleteMany({ where: { userId } });
    await tx.groupMember.deleteMany({ where: { userId } });
    await tx.eventRsvp.deleteMany({ where: { userId } });

    // Anonymise the account itself.
    await tx.user.update({
      where: { id: userId },
      data: {
        name: "مستخدم محذوف",
        email: null,
        phone: null,
        emailVerified: null,
        password: null,
        image: null,
        bio: null,
        status: "DELETED",
        subscriptionTier: "free",
        tokenVersion: { increment: 1 },
      },
    });
  });

  logAudit(userId, AUDIT.PROFILE_UPDATE, "user", userId, { action: "account_deleted" });
  return NextResponse.json({ deleted: true });
}
