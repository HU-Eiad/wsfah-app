import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-mobile";
import { prisma } from "@/lib/prisma";
import { getPaymentLink } from "@/lib/streampay";
import { claimPayment, releasePayment } from "@/lib/payments";

/**
 * POST /api/checkout/verify
 * Fallback for when webhooks don't fire (e.g., sandbox mode).
 * The mobile app calls this after WebBrowser returns from StreamPay.
 * Checks the payment link status and activates the subscription if paid.
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { paymentLinkId } = await req.json().catch(() => ({}));
  if (!paymentLinkId || typeof paymentLinkId !== "string") {
    return NextResponse.json({ error: "paymentLinkId required" }, { status: 400 });
  }

  let claimed: string | null = null;
  try {
    const link = await getPaymentLink(paymentLinkId);

    // Check if payment was collected
    const amountCollected = parseFloat(link.amount_collected || "0");
    if (amountCollected <= 0) {
      return NextResponse.json({
        activated: false,
        status: link.status,
        message: "لم يتم الدفع بعد",
      });
    }

    // Extract metadata
    const metadata = link.custom_metadata || {};
    const userId = metadata.user_id;
    const planSlug = metadata.plan_slug;
    const companyId = metadata.company_id;

    // Verify the payment belongs to the authenticated user
    if (userId !== authUser.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    if (!planSlug) {
      return NextResponse.json({ error: "خطة غير محددة" }, { status: 400 });
    }
    if (metadata.type === "promotion") {
      return NextResponse.json({ error: "رابط دفع غير صالح" }, { status: 400 });
    }

    // Each paid link activates a subscription period exactly once.
    const claimId = `link:${paymentLinkId}`;
    if (!(await claimPayment(claimId, "subscription", userId))) {
      return NextResponse.json({ activated: true, plan: planSlug, alreadyProcessed: true });
    }
    claimed = claimId;

    // Activate subscription
    const isTrial = metadata.is_trial === "true";
    const isYearly = planSlug.endsWith("-yearly");
    const now = new Date();
    const expiresAt = new Date(now);
    if (isTrial) {
      expiresAt.setDate(expiresAt.getDate() + 14); // 14-day trial
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1));
    }

    if (planSlug === "pro" || planSlug === "pro-yearly") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: "pro",
          subscriptionStartsAt: now,
          subscriptionExpiresAt: expiresAt,
          trialUsed: true,
          trialEndsAt: isTrial ? expiresAt : null,
          trialPlanSlug: isTrial ? planSlug : null,
        },
      });
    } else if (planSlug.startsWith("roaster") && companyId) {
      const tier = planSlug.includes("roaster-pro") ? "pro" : "basic";
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
      if (!company || company.ownerId !== userId) {
        await releasePayment(claimId);
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      await prisma.company.update({
        where: { id: companyId },
        data: {
          subscriptionTier: tier,
          subscriptionExpiresAt: expiresAt,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: "PAYMENT_VERIFIED",
        entity: "subscription",
        entityId: paymentLinkId,
        metadata: JSON.stringify({
          plan: planSlug,
          amount: link.amount,
          method: "manual_verify",
        }),
      },
    });

    return NextResponse.json({ activated: true, plan: planSlug });
  } catch (error) {
    if (claimed) await releasePayment(claimed);
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "فشل التحقق من الدفع" },
      { status: 500 }
    );
  }
}
