"use client";

import { useEffect } from "react";

export default function Live2DEmbedLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("live2d-embed-route");
    return () => document.body.classList.remove("live2d-embed-route");
  }, []);

  return children;
}
