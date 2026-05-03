import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const handler = (req: NextRequest) => {
  const { GET, POST } = toNextJsHandler(getAuth());
  return req.method === "POST" ? POST(req) : GET(req);
};

export { handler as GET, handler as POST };
