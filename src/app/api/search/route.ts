import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { globalSearch } from "@/lib/search";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(params.get("limit")) || 5, 1), 20);

  const results = await globalSearch(q, limit);
  return NextResponse.json(results);
}
