export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { project } from "@/drizzle/schema";
import { eq, count } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { PLAN_LIMITS, Plan } from "@/lib/plans";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  environment: z.enum(["dev", "staging", "prod"]).default("prod"),
});

export async function POST(req: Request) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const db = getDb();

  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(project)
    .where(eq(project.orgId, org.id));

  const limit = PLAN_LIMITS[org.plan as Plan]?.maxProjects ?? PLAN_LIMITS.free.maxProjects;
  if (existingCount >= limit) {
    return NextResponse.json(
      { error: "project_limit_reached", limit, plan: org.plan },
      { status: 403 },
    );
  }

  const id = generateId("prj");
  await db.insert(project).values({
    id,
    orgId: org.id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    environment: parsed.data.environment,
  });

  return NextResponse.json({ id });
}
