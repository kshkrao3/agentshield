import { Polar } from "@polar-sh/sdk";
import { validateEvent } from "@polar-sh/sdk/webhooks";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function getPolar() {
  const { env } = getCloudflareContext();
  return { polar: new Polar({ accessToken: env.POLAR_ACCESS_TOKEN }), env };
}

export async function createPolarCheckout(
  productId: string,
  opts: { email: string; orgId: string; redirectUrl: string },
): Promise<string> {
  const { polar } = getPolar();
  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: opts.redirectUrl,
    customerEmail: opts.email,
    metadata: { org_id: opts.orgId },
  });
  return checkout.url;
}

export async function getPolarPortalUrl(polarCustomerId: string): Promise<string> {
  const { polar } = getPolar();
  const session = await polar.customerSessions.create({ customerId: polarCustomerId });
  return session.customerPortalUrl;
}

export function planFromProductId(productId: string | null | undefined): "free" | "pro" | "team" {
  if (!productId) return "free";
  const { env } = getCloudflareContext();
  if (productId === env.POLAR_PRO_PRODUCT_ID) return "pro";
  if (productId === env.POLAR_TEAM_PRODUCT_ID) return "team";
  return "free";
}

export async function verifyPolarWebhook(req: Request, secret: string): Promise<ReturnType<typeof validateEvent>> {
  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  return validateEvent(body, headers, secret);
}
