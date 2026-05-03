export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireActiveOrg } from "@/lib/session";
import { getDb } from "@/lib/db";
import { apiKey, project } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { generateApiKey, newApiKeyId } from "@/lib/api-keys";

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const { id: projectId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const db = getDb();
  const projectRow = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.orgId, org.id)))
    .limit(1);
  if (projectRow.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { key, prefix, hash } = await generateApiKey();
  const id = newApiKeyId();

  await db.insert(apiKey).values({
    id,
    projectId,
    name: parsed.data.name,
    keyPrefix: prefix,
    keyHash: hash,
    createdById: user.id,
  });

  // Return the plaintext key once. The hash is what we store.
  return NextResponse.json({ id, key, prefix });
}
