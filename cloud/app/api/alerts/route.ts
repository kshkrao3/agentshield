import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { alertRule, project } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { PLAN_LIMITS, Plan } from "@/lib/plans";
import { generateId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);

  if (!PLAN_LIMITS[org.plan as Plan]?.alerts) {
    return NextResponse.json({ error: "Alerts require a Pro plan." }, { status: 403 });
  }

  const body = await req.json() as {
    projectId: string;
    name: string;
    filterType: string;
    filterMinSeverity: string;
    channelType: string;
    channelTarget: string;
  };

  const { projectId, name, filterType, filterMinSeverity, channelType, channelTarget } = body;

  if (!name || !channelType || !channelTarget || !projectId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const db = getDb();
  const [proj] = await db.select({ id: project.id }).from(project)
    .where(eq(project.id, projectId));

  if (!proj) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const [rule] = await db.insert(alertRule).values({
    id: generateId("alr"),
    projectId,
    name,
    filterType: (filterType as "any" | "injection" | "tool" | "memory") ?? "any",
    filterMinSeverity: (filterMinSeverity as "low" | "medium" | "high") ?? "medium",
    channelType: channelType as "slack" | "email" | "webhook",
    channelTarget,
    enabled: true,
  }).returning();

  return NextResponse.json({ rule });
}
