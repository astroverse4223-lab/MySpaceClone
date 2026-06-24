"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socket-client";
import { usePresence } from "@/lib/presence-store";
import { useToasts } from "@/lib/toast-store";

const TYPE_EMOJI: Record<string, string> = {
  FRIEND_REQUEST: "👋",
  FRIEND_ACCEPT: "🤝",
  POST_REACTION: "🔥",
  POST_COMMENT: "💬",
  COMMENT_REPLY: "↩️",
  GUESTBOOK: "📖",
  MESSAGE: "✉️",
  TIP: "💝",
  MENTION: "📣",
  BADGE: "🏅",
  PROFILE_VIEW: "👀",
  COMMUNITY: "🏛️",
};

type IncomingNotification = { type: string; message: string; link: string | null };

export function RealtimeProvider() {
  const { status } = useSession();
  const setSnapshot = usePresence((s) => s.setSnapshot);
  const setOnline = usePresence((s) => s.setOnline);
  const push = useToasts((s) => s.push);

  useEffect(() => {
    if (status !== "authenticated") return;
    const socket = getSocket();

    const onSnapshot = (ids: string[]) => setSnapshot(ids);
    const onUpdate = ({
      userId,
      online,
      lastSeenAt,
    }: {
      userId: string;
      online: boolean;
      lastSeenAt?: string | null;
    }) => setOnline(userId, online, lastSeenAt);
    const onNotification = (n: IncomingNotification) =>
      push({ emoji: TYPE_EMOJI[n.type] ?? "🔔", message: n.message, href: n.link });

    function requestPresence() {
      socket.emit("presence:list");
    }

    socket.on("presence:snapshot", onSnapshot);
    socket.on("presence:update", onUpdate);
    socket.on("notification:new", onNotification);
    socket.on("connect", requestPresence);
    requestPresence();

    return () => {
      socket.off("presence:snapshot", onSnapshot);
      socket.off("presence:update", onUpdate);
      socket.off("notification:new", onNotification);
      socket.off("connect", requestPresence);
    };
  }, [status, setSnapshot, setOnline, push]);

  return null;
}
