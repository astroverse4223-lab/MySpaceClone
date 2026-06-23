import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/account → permanently delete the signed-in user's account.
// Body must include { confirm: "<username>" } to guard against accidents.
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (body?.confirm !== session.user.username) {
    return NextResponse.json({ error: "Type your username to confirm." }, { status: 400 });
  }

  // Relations cascade-delete via the schema's onDelete: Cascade rules.
  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ success: true });
}
