"use client";

import { motion } from "framer-motion";

export function MessageBubble({
  mine,
  attachmentUrl,
  attachmentType,
  children,
}: {
  mine: boolean;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`max-w-[75%] overflow-hidden text-sm ${
        mine
          ? "gradient-accent rounded-2xl rounded-br-md text-white shadow-[0_6px_20px_-6px_var(--site-accent)]"
          : "rounded-2xl rounded-bl-md border border-white/10 bg-white/10 text-white/90 shadow-md shadow-black/20"
      }`}
    >
      {attachmentUrl && attachmentType === "IMAGE" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachmentUrl} alt="" className="max-h-56 w-full object-cover" />
      )}
      {children}
    </motion.div>
  );
}
