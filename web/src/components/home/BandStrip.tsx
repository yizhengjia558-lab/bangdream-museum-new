"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BAND_THEMES } from "@/lib/themes";
import { getCharactersByBand } from "@/lib/data";
import { AssetImage } from "@/components/ui/AssetImage";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function BandStrip() {
  const [active, setActive] = useState(0);
  const band = BAND_THEMES[active];
  const members = getCharactersByBand(band.folder);

  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="CHARACTER" subtitle="选择乐队，探索成员与卡面" />

        <div className="mb-8 flex flex-wrap gap-2">
          {BAND_THEMES.map((b, i) => (
            <button
              key={b.slug}
              onClick={() => setActive(i)}
              className={`band-tab rounded-full px-4 py-2 text-xs font-bold tracking-wide ${i === active ? "active" : ""}`}
              style={i === active ? { background: b.colors.primary } : undefined}
            >
              {b.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={band.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#999]">{band.nameJp}</p>
                <p className="text-xl font-bold" style={{ color: band.colors.primary }}>
                  {band.tagline}
                </p>
              </div>
              <Link
                href={`/bands/${band.slug}`}
                className="text-sm font-bold hover:underline"
                style={{ color: band.colors.primary }}
              >
                More →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {members.map((m) => (
                <Link key={m.id} href={`/characters/${m.slug}`} className="official-card card-shine group overflow-hidden">
                  <div className="relative aspect-[3/4] bg-gradient-to-b from-[#fff5f8] to-white">
                    <AssetImage
                      src={m.standing}
                      alt={m.name_cn}
                      fill
                      className="object-contain object-bottom p-2 transition group-hover:scale-105"
                    />
                  </div>
                  <div className="border-t border-[#f0e0e4] p-3 text-center">
                    <p className="text-sm font-bold text-[#2d2d2d]">{m.name_cn}</p>
                    <p className="mt-0.5 text-[10px] text-[#999]">{m.name_jp}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
