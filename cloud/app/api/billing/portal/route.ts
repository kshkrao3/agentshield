export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getPolarPortalUrl } from "@/lib/polar";

export async function POST() {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  if (!org.lsCustomerId) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }
  const url = await getPolarPortalUrl(org.lsCustomerId);
  return NextResponse.json({ url });
}
