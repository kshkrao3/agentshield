import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function setup() {
  const { env } = getCloudflareContext();
  lemonSqueezySetup({ apiKey: env.LEMONSQUEEZY_API_KEY });
  return env;
}

export async function createLsCheckout(
  variantId: string,
  storeId: string,
  opts: { email: string; name: string; orgId: string; redirectUrl: string },
) {
  setup();
  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: opts.email,
      name: opts.name,
      custom: { org_id: opts.orgId },
    },
    productOptions: {
      redirectUrl: opts.redirectUrl,
    },
  });
  if (error) throw new Error(error.message);
  return data!.data.attributes.url as string;
}

export async function getLsPortalUrl(lsSubscriptionId: string): Promise<string> {
  setup();
  const { data, error } = await getSubscription(lsSubscriptionId);
  if (error) throw new Error(error.message);
  return data!.data.attributes.urls.customer_portal as string;
}

export function planFromVariantId(variantId: string | null | undefined): "free" | "pro" | "team" {
  if (!variantId) return "free";
  const { env } = getCloudflareContext();
  if (variantId === env.LEMONSQUEEZY_PRO_VARIANT_ID) return "pro";
  if (variantId === env.LEMONSQUEEZY_TEAM_VARIANT_ID) return "team";
  return "free";
}

export async function verifyLsWebhook(req: Request, secret: string): Promise<unknown> {
  const sig = req.headers.get("x-signature");
  const body = await req.text();
  if (!sig) throw new Error("no_signature");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex !== sig) throw new Error("invalid_signature");

  return JSON.parse(body);
}
