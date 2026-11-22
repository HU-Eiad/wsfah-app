import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "crypto";
import { claimPayment, releasePayment, planExpiry } from "@/lib/payments";

function secretMatches(given: string | null, expected: string) {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// StreamPay webhook event names (from their dashboard)
export async function POST(req: NextRequest) {
  // Verify webhook secret (mandatory)
  const webhookSecret = process.env.STREAM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  const signature =
    req.headers.get("x-webhook-signature") ||
    req.headers.get("x-webhook-secret");
  if (!secretMatches(signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const event = body.event || body.type;
  const data = body.data || body;

  // Deliveries can be retried or replayed; apply each money-moving event once.
  // Payment ids are unique per payment. A renewal carries the subscription id, which repeats
  // every cycle, so it is only deduplicated when the payload names the billing period.
  let claimId: string | null = null;
  if ((event === "PAYMENT_SUCCEEDED" || event === "PAYMENT_MARKED_AS_PAID") && data?.id) {
    claimId = `wh:pay:${data.id}`;
  } else if (event === "SUBSCRIPTION_CYCLE_RENEWED_SUCCESSFULLY" && data?.id && data.current_period_end) {
    claimId = `wh:renew:${data.id}:${data.current_period_end}`;
  }
  if (claimId) {
    if (!(await claimPayment(claimId, "webhook", (data.custom_metadata || data.metadata || {}).user_id))) {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    switch (event) {
      case "PAYMENT_SUCCEEDED":
      case "PAYMENT_MARKED_AS_PAID":
        await handlePaymentSuccess(data);
        break;

      case "SUBSCRIPTION_CREATED":
      case "SUBSCRIPTION_ACTIVATED":
        await handleSubscriptionCreated(data);
        break;

      case "SUBSCRIPTION_CANCELED":
      case "SUBSCRIPTION_INACTIVATED":
        await handleSubscriptionEnded(data);
        break;

      case "SUBSCRIPTION_CYCLE_RENEWED_SUCCESSFULLY":
        await handleRenewalSuccess(data);
        break;

      case "SUBSCRIPTION_CYCLE_RENEWAL_FAILED":
        await handleRenewalFailed(data);
        break;

      case "PAYMENT_FAILED":
        await handlePaymentFailed(data);
        break;

      case "PAYMENT_REFUNDED":
        await handleRefund(data);
        break;

      default:
        // Unhandled event — ignore silently
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (claimId) await releasePayment(claimId);
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function handlePaymentSuccess(data: any) {
  const metadata = data.custom_metadata || data.metadata || {};

  // Handle promotion payments
  if (metadata.type === "promotion" && metadata.promotion_id) {
    const now = new Date();
    const promo = await prisma.promotionRequest.findUnique({
      where: { id: metadata.promotion_id },
    });
    if (promo && promo.paymentStatus !== "PAID") {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (promo.duration || 7));
      await prisma.promotionRequest.updateMany({
        where: { id: metadata.promotion_id, paymentStatus: { not: "PAID" } },
        data: {
          paymentStatus: "PAID",
          status: "PENDING",
          amountPaid: parseFloat(metadata.amount || "0"),
          startDate: now,
          endDate,
        },
      });
    }
    return;
  }

  const userId = metadata.user_id;
  const planSlug = metadata.plan_slug;
  const companyId = metadata.company_id;

  if (!userId || !planSlug) return;

  const isYearly = planSlug.endsWith("-yearly");
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + (isYearly ? 12 : 1));

  if (planSlug === "pro" || planSlug === "pro-yearly") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: "pro",
        subscriptionStartsAt: now,
        subscriptionExpiresAt: expiresAt,
        trialEndsAt: null,
        trialPlanSlug: null,
      },
    });
  } else if (planSlug.startsWith("roaster") && companyId) {
    const tier = planSlug.includes("roaster-pro") ? "pro" : "basic";
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
      action: "PAYMENT_SUCCESS",
      entity: "subscription",
      entityId: companyId || userId,
      metadata: JSON.stringify({
        plan: planSlug,
        payment_id: data.id,
        amount: data.amount,
        currency: data.currency,
      }),
    },
  });
}

async function handleSubscriptionCreated(data: any) {
  const metadata = data.custom_metadata || data.metadata || {};
  const userId = metadata.user_id;

  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "SUBSCRIPTION_CREATED",
        entity: "subscription",
        entityId: data.id,
        metadata: JSON.stringify({
          plan: metadata.plan_slug,
          stream_subscription_id: data.id,
        }),
      },
    });
  }
}

async function handleSubscriptionEnded(data: any) {
  const metadata = data.custom_metadata || data.metadata || {};
  const userId = metadata.user_id;
  const planSlug = metadata.plan_slug;
  const companyId = metadata.company_id;

  if (!userId) return;

  if (planSlug === "pro" || planSlug === "pro-yearly") {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: "free" },
    });
  } else if (planSlug?.startsWith("roaster") && companyId) {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionTier: "basic",
        subscriptionExpiresAt: null,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIPTION_ENDED",
      entity: "subscription",
      entityId: data.id,
      metadata: JSON.stringify({
        plan: planSlug,
        reason: data.reason || "cancelled",
      }),
    },
  });
}

async function handleRenewalSuccess(data: any) {
  const metadata = data.custom_metadata || data.metadata || {};
  const userId = metadata.user_id;
  const companyId = metadata.company_id;

  if (!userId) return;

  // Extend expiration by one billing period
  const planSlug: string = metadata.plan_slug || "";
  const expiresAt = planExpiry(planSlug);

  if (planSlug === "pro" || planSlug === "pro-yearly") {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: "pro", subscriptionExpiresAt: expiresAt },
    });
  } else if (companyId) {
    await prisma.company.update({
      where: { id: companyId },
      data: { subscriptionExpiresAt: expiresAt },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIPTION_RENEWED",
      entity: "subscription",
      entityId: data.id,
      metadata: JSON.stringify({ plan: metadata.plan_slug }),
    },
  });
}

async function handleRenewalFailed(data: any) {
  const metadata = data.custom_metadata || data.metadata || {};
  const userId = metadata.user_id;

  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "SUBSCRIPTION_RENEWAL_FAILED",
        entity: "subscription",
        entityId: data.id,
        metadata: JSON.stringify({
          plan: metadata.plan_slug,
          reason: data.reason || "payment_failed",
        }),
      },
    });
  }
}

async function handlePaymentFailed(data: any) {
  const metadata = data.custom_metadata || data.metadata || {};
  const userId = metadata.user_id;

  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PAYMENT_FAILED",
        entity: "payment",
        entityId: data.id,
        metadata: JSON.stringify({
          plan: metadata.plan_slug,
          amount: data.amount,
        }),
      },
    });
  }
}

async function handleRefund(data: any) {
  const metadata = data.custom_metadata || data.metadata || {};
  const userId = metadata.user_id;
  const planSlug = metadata.plan_slug;
  const companyId = metadata.company_id;

  if (!userId) return;

  // Downgrade on refund
  if (planSlug === "pro" || planSlug === "pro-yearly") {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: "free" },
    });
  } else if (planSlug?.startsWith("roaster") && companyId) {
    await prisma.company.update({
      where: { id: companyId },
      data: { subscriptionTier: "basic", subscriptionExpiresAt: null },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: "PAYMENT_REFUNDED",
      entity: "payment",
      entityId: data.id,
      metadata: JSON.stringify({
        plan: planSlug,
        amount: data.amount,
      }),
    },
  });
}
