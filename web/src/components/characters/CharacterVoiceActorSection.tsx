"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getVoiceActorName } from "@/lib/i18n/display";
import type { VoiceActorData } from "@/lib/data-types";

export function CharacterVoiceActorSection({
  voiceActor,
  accent,
}: {
  voiceActor: VoiceActorData;
  accent: string;
}) {
  const { t, locale } = useLocale();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const name = getVoiceActorName(voiceActor, locale);
  const altName =
    locale === "zh"
      ? voiceActor.cv_jp
      : locale === "ja"
        ? voiceActor.cv_cn
        : voiceActor.cv_jp;

  return (
    <section className="character-voice-section page-section relative py-12 md:py-16">
      <div className="relative page-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <GlassPanel
            className="character-voice-section-panel"
            glow={`radial-gradient(circle at 20% 50%, ${accent}35, transparent 65%)`}
          >
            <p className="character-voice-section-eyebrow">{t("character.voiceActor")}</p>
            <div className="character-voice-section-body">
              {voiceActor.image ? (
                <button
                  type="button"
                  className="character-voice-section-photo character-voice-section-photo-btn"
                  style={{ boxShadow: `0 12px 48px ${accent}40`, borderColor: `${accent}55` }}
                  aria-label={t("character.viewVoiceActorPhoto")}
                  onClick={() => setLightboxOpen(true)}
                >
                  <AssetImage
                    src={voiceActor.image}
                    alt={name}
                    className="character-voice-section-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add(
                        "character-voice-section-photo--fallback"
                      );
                    }}
                  />
                  <span className="character-voice-section-zoom" aria-hidden>
                    {t("character.viewVoiceActorPhoto")}
                  </span>
                </button>
              ) : (
                <div
                  className="character-voice-section-photo character-voice-section-photo--fallback"
                  style={{ boxShadow: `0 12px 48px ${accent}40`, borderColor: `${accent}55` }}
                >
                  <span className="character-voice-section-fallback" aria-hidden>
                    {name.slice(0, 1)}
                  </span>
                </div>
              )}
              <div className="character-voice-section-text">
                <h2 className="character-voice-section-name">{name}</h2>
                {altName && altName !== name ? (
                  <p className="character-voice-section-alt">{altName}</p>
                ) : null}
                {voiceActor.cv_romaji && voiceActor.cv_romaji !== name ? (
                  <p className="character-voice-section-romaji">{voiceActor.cv_romaji}</p>
                ) : null}
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {voiceActor.image ? (
        <ImageLightbox
          open={lightboxOpen}
          src={voiceActor.image}
          alt={name}
          caption={name}
          closeLabel={t("common.close")}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </section>
  );
}
