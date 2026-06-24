import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { getToken } from "next-auth/jwt";
import { prisma } from "./src/lib/prisma";

/** Best-effort write of a user's last-seen timestamp; never throws into the socket layer. */
function touchLastSeen(userId: string) {
  prisma.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
    .catch(() => {});
}

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

const onlineUsers = new Map<string, Set<string>>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, { path: "/api/socket" });

  io.use(async (socket, nextFn) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? "";
      const token = await getToken({
        req: { headers: { cookie: cookieHeader } } as never,
        secret: process.env.NEXTAUTH_SECRET,
      });
      const userId = token?.id as string | undefined;
      if (!userId) {
        nextFn(new Error("Unauthorized"));
        return;
      }
      socket.data.userId = userId;
      nextFn();
    } catch {
      nextFn(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    // Personal room so API handlers can push notifications/toasts to this user.
    socket.join(`user:${userId}`);

    const wasOffline = !onlineUsers.has(userId);
    if (wasOffline) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    if (wasOffline) {
      touchLastSeen(userId);
      io.emit("presence:update", { userId, online: true });
    }

    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing", ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", { conversationId, userId, isTyping });
    });

    socket.on("presence:list", () => {
      socket.emit("presence:snapshot", Array.from(onlineUsers.keys()));
    });

    socket.on("disconnect", () => {
      const set = onlineUsers.get(userId);
      set?.delete(socket.id);
      if (set && set.size === 0) {
        onlineUsers.delete(userId);
        const lastSeenAt = new Date().toISOString();
        touchLastSeen(userId);
        io.emit("presence:update", { userId, online: false, lastSeenAt });
      }
    });
  });

  // Shared with API route handlers running in this same Node process so they
  // can emit "message:new" etc. after persisting to the database.
  (globalThis as unknown as { io: SocketIOServer }).io = io;

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
