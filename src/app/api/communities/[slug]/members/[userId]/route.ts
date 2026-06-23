import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateMemberRoleSchema } from "@/lib/validations/communities";
import { requireStaff } from "@/lib/communities";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, userId } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const staff = await requireStaff(community.id, session.user.id);
  if (!staff || staff.role === "MODERATOR") {
    return NextResponse.json({ error: "Only admins or the owner can change roles" }, { status: 403 });
  }

  const target = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  });
  if (!target || target.role === "OWNER") {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.communityMember.update({
    where: { communityId_userId: { communityId: community.id, userId } },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ member: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, userId } = await params;
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const staff = await requireStaff(community.id, session.user.id);
  if (!staff) {
    return NextResponse.json({ error: "Only moderators can remove members" }, { status: 403 });
  }

  const target = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId: community.id, userId } },
  });
  if (!target || target.role === "OWNER") {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.communityMember.delete({
    where: { communityId_userId: { communityId: community.id, userId } },
  });

  return NextResponse.json({ success: true });
}
