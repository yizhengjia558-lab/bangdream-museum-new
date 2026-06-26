"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import type { CharacterData } from "@/lib/data";

export function CharacterCarousel({ characters }: { characters: CharacterData[] }) {
  const [index, setIndex] = useState(0);
  const featured = characters.slice(0, 12);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % featured.length), 4500);
    return () => clearInterval(timer);
  }, [featured.length]);

  const current = featured[index];

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-[2rem] glass-strong">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_55%)]" />
            <div className="absolute inset-0">
              <AssetImage
                src={current.standing}
                alt={current.name_cn}
                fill
                className="object-contain object-bottom-right p-8 drop-shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
                priority
              />
            </div>
            <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-end p-10">
              <p className="text-xs tracking-[0.45em] text-white/45 uppercase">{current.band}</p>
              <h3 className="mt-3 text-4xl font-bold">{current.name_cn}</h3>
              <p className="mt-1 text-lg text-white/55">{current.name_jp}</p>
              <Link
                href={`/characters/${current.slug}`}
                className="mt-6 inline-flex w-fit rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:scale-105"
              >
                View Profile
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute right-6 bottom-6 flex gap-2">
        {featured.map((c, i) => (
          <button
            key={c.id}
            aria-label={c.name_cn}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
