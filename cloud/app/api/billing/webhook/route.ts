export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { organization } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyPolarWebhook, planFromProductId } from "@/lib/polar";

export async function POST(req: Request) {
  const { env } = getCloudflareContext();

  let event: Awaited<ReturnType<typeof verifyPolarWebhook>>;
  try {
    event = await verifyPolarWebhook(req, env.POLAR_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const db = getDb();
  const { type, data } = event as unknown as {
    type: string;
    data: {
      id: string;
      customerId: string;
      productId: string;
      status: string;
      currentPeriodEnd: Date | null;
      metadata?: Record<string, unknown>;
    };
  };

  const orgId = typeof data.metadata?.org_id === "string" ? data.metadata.org_id : undefined;

  if (
    type === "subscription.created" ||
    type === "subscription.updated"
  ) {
    if (!orgId) return NextResponse.json({ received: true });

    if (data.status === "canceled" || data.status === "revoked") {
      await db
        .update(organization)
        .set({
          plan: "free",
          lsSubscriptionId: null,
          lsVariantId: null,
          lsCustomerId: null,
          subscriptionStatus: data.status,
          currentPeriodEnd: null,
        })
        .where(eq(organization.id, orgId));
      return NextResponse.json({ received: true });
    }

    const plan = planFromProductId(data.productId);
    await db
      .update(organization)
      .set({
        plan,
        lsSubscriptionId: data.id,
        lsVariantId: data.productId,
        lsCustomerId: data.customerId,
        subscriptionStatus: data.status,
        currentPeriodEnd: data.currentPeriodEnd ?? null,
      })
      .where(eq(organization.id, orgId));
  }

  if (type === "subscription.canceled" || type === "subscription.revoked") {
    if (!orgId) return NextResponse.json({ received: true });
    await db
      .update(organization)
      .set({
        plan: "free",
        lsSubscriptionId: null,
        lsVariantId: null,
        lsCustomerId: null,
        subscriptionStatus: type === "subscription.canceled" ? "cancelled" : "expired",
        currentPeriodEnd: null,
      })
      .where(eq(organization.id, orgId));
  }

  return NextResponse.json({ received: true });
}
