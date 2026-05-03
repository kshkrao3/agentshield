export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { getDb } from "@/lib/db";
import { organization, orgMember } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  const existing = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, parsed.data.slug))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  }

  const id = generateId("org");
  await db.insert(organization).values({
    id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    ownerId: user.id,
    plan: "free",
  });
  await db.insert(orgMember).values({
    orgId: id,
    userId: user.id,
    role: "owner",
  });

  return NextResponse.json({ id });
}
