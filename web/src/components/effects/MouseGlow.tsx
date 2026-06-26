"use client";

import { useEffect, useState } from "react";

export function MouseGlow({ color = "rgba(255,255,255,0.15)" }: { color?: string }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 45%)`,
      }}
    />
  );
}
