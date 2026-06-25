import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getActivityFeed } from "@/lib/activity";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const before = params.get("before") ?? undefined;
  const limit = Number(params.get("limit")) || undefined;

  const { items, nextCursor } = await getActivityFeed(session.user.id, { before, limit });

  return NextResponse.json({ items, nextCursor });
}
