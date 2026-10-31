import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(request);

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, image: true } },
      _count: { select: { rsvps: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let userRsvp = null;
  if (user?.id) {
    const rsvp = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId: id, userId: user.id } },
    });
    userRsvp = rsvp?.status || null;
  }

  return NextResponse.json({ ...event, userRsvp });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.hostId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
