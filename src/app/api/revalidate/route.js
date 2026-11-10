import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

const ALLOWED_TAGS = /^(products|categories|settings|legal|privacy|product:[a-z0-9-]+|legal:[a-z0-9-]+)$/;

function secretMatches(provided) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called by the backend after catalog / settings / legal changes: POST { tags: ["products", "product:slug"] } */
export async function POST(request) {
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) {
    return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const tags = Array.isArray(body?.tags) ? body.tags.filter((t) => typeof t === "string" && ALLOWED_TAGS.test(t)) : [];
  if (tags.length === 0) {
    return Response.json({ ok: false, error: { code: "BAD_REQUEST", message: "No valid tags" } }, { status: 400 });
  }
  for (const tag of tags) revalidateTag(tag, "max");
  return Response.json({ ok: true, data: { revalidated: tags } });
}
