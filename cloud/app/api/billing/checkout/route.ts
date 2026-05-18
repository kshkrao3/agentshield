export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { createPolarCheckout } from "@/lib/polar";

const bodySchema = z.object({
  plan: z.enum(["pro", "team"]),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const productId =
    parsed.data.plan === "pro"
      ? env.POLAR_PRO_PRODUCT_ID
      : env.POLAR_TEAM_PRODUCT_ID;

  const url = await createPolarCheckout(productId, {
    email: user.email,
    orgId: org.id,
    redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
  });

  return NextResponse.json({ url });
}
