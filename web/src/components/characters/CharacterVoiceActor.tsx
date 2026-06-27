"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { getVoiceActorName } from "@/lib/i18n/display";
import type { VoiceActorData } from "@/lib/data";

export function CharacterVoiceActor({
  voiceActor,
  accent,
}: {
  voiceActor: VoiceActorData;
  accent: string;
}) {
  const { t, locale } = useLocale();
  const name = getVoiceActorName(voiceActor, locale);
  const altName =
    locale === "zh"
      ? voiceActor.cv_jp
      : locale === "ja"
        ? voiceActor.cv_cn
        : voiceActor.cv_jp;

  return (
    <div className="character-voice-actor">
      <p className="character-voice-actor-label">{t("character.voiceActor")}</p>
      <div className="character-voice-actor-row">
        <div
          className="character-voice-actor-photo"
          style={{ boxShadow: `0 8px 32px ${accent}35` }}
        >
          {voiceActor.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={voiceActor.image}
              alt={name}
              className="character-voice-actor-img"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement?.classList.add("character-voice-actor-photo--fallback");
              }}
            />
          ) : null}
          <span className="character-voice-actor-fallback" aria-hidden>
            {name.slice(0, 1)}
          </span>
        </div>
        <div className="character-voice-actor-text">
          <p className="character-voice-actor-name">{name}</p>
          {altName && altName !== name ? (
            <p className="character-voice-actor-alt">{altName}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
