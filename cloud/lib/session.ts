import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import { getDb } from "./db";
import { organization, orgMember } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function getActiveOrg(userId: string) {
  const db = getDb();
  const memberships = await db
    .select({ org: organization })
    .from(orgMember)
    .innerJoin(organization, eq(organization.id, orgMember.orgId))
    .where(eq(orgMember.userId, userId))
    .limit(1);
  return memberships[0]?.org ?? null;
}

export async function requireActiveOrg(userId: string) {
  const org = await getActiveOrg(userId);
  if (!org) redirect("/onboarding");
  return org;
}
