"use client";

import { useRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Wraps any card in a subtle 3D tilt + glare that follows the cursor.
 * Purely presentational — pointer events pass through to children normally.
 */
export function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 300, damping: 25 });
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${useTransform(x, [0, 1], ["0%", "100%"])} ${useTransform(y, [0, 1], ["0%", "100%"])}, rgba(255,255,255,0.16), transparent 60%)`;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function onMouseLeave() {
    setHovering(false);
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`relative ${className}`}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{ background: glareBackground, opacity: hovering ? 1 : 0 }}
      />
    </motion.div>
  );
}
