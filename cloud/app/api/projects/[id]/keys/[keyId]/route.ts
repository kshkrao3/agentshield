export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { apiKey, project } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; keyId: string }> },
) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const { id: projectId, keyId } = await params;
  const db = getDb();

  const projectRow = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.orgId, org.id)))
    .limit(1);
  if (projectRow.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await db
    .update(apiKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKey.id, keyId), eq(apiKey.projectId, projectId)));

  return NextResponse.json({ ok: true });
}
