import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";
import { getPaymentLink } from "@/lib/streampay";

/**
 * POST /api/promotions/verify
 * Called after payment to verify and activate the promotion
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // Only the payment link created for this promotion by /api/promotions/checkout counts;
  // a client-supplied link could be one paid for a different (cheaper) promotion.
  const { promotionId } = await req.json().catch(() => ({}));
  if (!promotionId) {
    return NextResponse.json({ error: "promotionId required" }, { status: 400 });
  }

  const promo = await prisma.promotionRequest.findUnique({
    where: { id: promotionId },
    include: { company: { select: { name: true, ownerId: true } } },
  });

  if (!promo || promo.requesterId !== authUser.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (promo.paymentStatus === "PAID") {
    return NextResponse.json({ activated: true, status: promo.status });
  }

  // Verify payment via StreamPay
  const linkId = promo.paymentLinkId;
  if (!linkId) {
    return NextResponse.json({ activated: false, message: "لم يتم الدفع بعد" });
  }

  try {
    const link = await getPaymentLink(linkId);
    const amountCollected = parseFloat(link.amount_collected || "0");

    if (amountCollected <= 0) {
      return NextResponse.json({ activated: false, message: "لم يتم الدفع بعد" });
    }

    const metadata = link.custom_metadata || {};
    if (metadata.promotion_id && metadata.promotion_id !== promo.id) {
      return NextResponse.json({ error: "رابط دفع غير صالح" }, { status: 400 });
    }
    const expected = promo.amountPaid ?? 0;
    if (expected > 0 && amountCollected + 0.01 < expected) {
      return NextResponse.json({ activated: false, message: "المبلغ المدفوع أقل من المطلوب" });
    }

    // Payment confirmed — activate promotion
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (promo.duration || 7));

    // Conditional update: concurrent verifies activate it once.
    const res = await prisma.promotionRequest.updateMany({
      where: { id: promotionId, paymentStatus: { not: "PAID" } },
      data: {
        paymentStatus: "PAID",
        status: "PENDING", // Moves to PENDING for admin review
        amountPaid: amountCollected,
        startDate: now,
        endDate,
      },
    });
    if (res.count === 0) {
      return NextResponse.json({ activated: true, status: "PENDING" });
    }

    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        action: "PROMOTION_PAID",
        entity: "promotion",
        entityId: promotionId,
        metadata: JSON.stringify({
          company: promo.company.name,
          amount: amountCollected,
          duration: promo.duration,
        }),
      },
    });

    return NextResponse.json({ activated: true, status: "PENDING" });
  } catch (error) {
    console.error("Promotion verify error:", error);
    return NextResponse.json({ error: "فشل التحقق من الدفع" }, { status: 500 });
  }
}
