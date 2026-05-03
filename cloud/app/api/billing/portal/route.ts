export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getLsPortalUrl } from "@/lib/ls";

export async function POST() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  if (!org.lsSubscriptionId) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }
  const url = await getLsPortalUrl(org.lsSubscriptionId);
  return NextResponse.json({ url });
}
