"use client";

import { useEffect, useState } from "react";

/** Match phones / tablets in portrait and coarse-pointer touch devices. */
const MOBILE_MEDIA = "(max-width: 768px), (hover: none) and (pointer: coarse)";

export function useMobilePerf() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}
