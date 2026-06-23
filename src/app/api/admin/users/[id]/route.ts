import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePrivilegedAdmin, isPrivilegedAdmin, logAudit } from "@/lib/admin";
import { updateUserSchema } from "@/lib/validations/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.role && !isPrivilegedAdmin(session)) {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
  }

  if (id === session.user.id && (parsed.data.isSuspended || parsed.data.role)) {
    return NextResponse.json({ error: "You can't modify your own account here" }, { status: 400 });
  }

  const { verifyEmail, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (verifyEmail === true) data.emailVerified = new Date();
  if (verifyEmail === false) data.emailVerified = null;

  const user = await prisma.user.update({ where: { id }, data });

  await logAudit(session.user.id, "user.update", { type: "USER", id }, parsed.data);

  return NextResponse.json({ user });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePrivilegedAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account here" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } }).catch(() => null);
  await logAudit(session.user.id, "user.delete", { type: "USER", id });

  return NextResponse.json({ success: true });
}
