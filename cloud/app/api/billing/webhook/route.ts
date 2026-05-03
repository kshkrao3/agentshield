export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { organization } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyLsWebhook, planFromVariantId } from "@/lib/ls";

export async function POST(req: Request) {
  const { env } = getCloudflareContext();

  let payload: unknown;
  try {
    payload = await verifyLsWebhook(req, env.LEMONSQUEEZY_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const p = payload as {
    meta: { event_name: string; custom_data?: { org_id?: string } };
    data: {
      id: string;
      attributes: {
        customer_id: number;
        variant_id: number;
        status: string;
        renews_at: string | null;
        ends_at: string | null;
      };
    };
  };

  const event = p.meta.event_name;
  const orgId = p.meta.custom_data?.org_id;
  const db = getDb();

  if (
    event === "subscription_created" ||
    event === "subscription_updated" ||
    event === "subscription_resumed"
  ) {
    if (!orgId) return NextResponse.json({ received: true });
    const attrs = p.data.attributes;

    // If LS sends updated with status=expired/cancelled, treat as revocation
    if (attrs.status === "expired" || attrs.status === "cancelled") {
      await db
        .update(organization)
        .set({
          plan: "free",
          lsSubscriptionId: null,
          lsVariantId: null,
          subscriptionStatus: attrs.status,
          currentPeriodEnd: null,
        })
        .where(eq(organization.id, orgId));
      return NextResponse.json({ received: true });
    }

    const variantId = String(attrs.variant_id);
    const plan = planFromVariantId(variantId);
    const periodEnd = attrs.renews_at ? new Date(attrs.renews_at) : null;
    await db
      .update(organization)
      .set({
        plan,
        lsSubscriptionId: p.data.id,
        lsVariantId: variantId,
        lsCustomerId: String(attrs.customer_id),
        subscriptionStatus: attrs.status,
        currentPeriodEnd: periodEnd,
      })
      .where(eq(organization.id, orgId));
  }

  if (event === "subscription_cancelled" || event === "subscription_expired") {
    if (!orgId) return NextResponse.json({ received: true });
    await db
      .update(organization)
      .set({
        plan: "free",
        lsSubscriptionId: null,
        lsVariantId: null,
        subscriptionStatus: event === "subscription_cancelled" ? "cancelled" : "expired",
        currentPeriodEnd: null,
      })
      .where(eq(organization.id, orgId));
  }

  return NextResponse.json({ received: true });
}
