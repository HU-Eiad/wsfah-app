import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-mobile";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    // Public profile: explicit allow-list. Never email, phone, status, plan or trial data.
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      role: true,
      points: true,
      followers: true,
      following: true,
      avgRating: true,
      dailyStreak: true,
      createdAt: true,
      recipes: {
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          rating: true,
          category: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 60,
      },
      badges: {
        include: { badge: true },
      },
      challenges: {
        include: { challenge: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = authUser.id;

  // Only the user themselves can update their profile
  if (userId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const limits: Record<string, number> = { name: 80, bio: 500, image: 1000 };

  const data: Record<string, unknown> = {};
  for (const [field, max] of Object.entries(limits)) {
    const v = body[field];
    if (v === undefined) continue;
    if (v !== null && (typeof v !== "string" || v.length > max)) {
      return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
    }
    if (field === "image" && typeof v === "string" && !/^https:\/\//.test(v) && !v.startsWith("/")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
    data[field] = v;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      bio: true,
      role: true,
      status: true,
      points: true,
    },
  });

  return NextResponse.json(user);
}
