import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/account/export → download all of the signed-in user's data as JSON.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, posts, comments, photos, albums, guestbook, friendships, playlists] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    }),
    prisma.post.findMany({ where: { authorId: userId } }),
    prisma.comment.findMany({ where: { authorId: userId } }),
    prisma.photo.findMany({ where: { userId } }),
    prisma.album.findMany({ where: { userId } }),
    prisma.guestbookEntry.findMany({ where: { authorId: userId } }),
    prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    }),
    prisma.playlist.findMany({ where: { userId }, include: { tracks: true } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    account: user,
    posts,
    comments,
    photos,
    albums,
    guestbook,
    friendships,
    playlists,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="myspace-reborn-data-${session.user.username}.json"`,
    },
  });
}
