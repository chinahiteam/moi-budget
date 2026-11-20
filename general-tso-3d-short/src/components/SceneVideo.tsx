import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { SUBTITLE_FONT, TITLE_FONT } from "../fonts";
import type { Scene, Shot } from "../timeline";

// Заглушка на місці кліпу, якого ще немає в public/scenes/ — щоб таймінг і верстку можна було
// перевірити до генерації 3D-сцен.
const Placeholder: React.FC<{ scene: Scene; shot: Shot }> = ({ scene, shot }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, shot.durationInFrames], [0, 60]);
  const hue = 8 + scene.index * 9;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 70% at ${40 + drift / 3}% ${46 - drift / 6}%, hsl(${hue} 70% 34%) 0%, hsl(${hue} 60% 14%) 55%, #0B0908 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 170,
          right: 170,
          top: 700,
          height: 520,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 18,
          color: COLORS.cream,
          textAlign: "center",
        }}
      >
        <div style={{ font: `900 190px ${TITLE_FONT}`, lineHeight: 1, opacity: 0.22 }}>{scene.index}</div>
        <div style={{ font: `800 44px ${TITLE_FONT}`, textTransform: "uppercase" }}>{scene.name}</div>
        <div style={{ font: `600 27px/1.3 ${SUBTITLE_FONT}`, opacity: 0.8 }}>{shot.description.slice(0, 190)}…</div>
        <div style={{ font: `600 24px ${SUBTITLE_FONT}`, color: COLORS.gold }}>Заглушка · покладіть {shot.expectedFile}</div>
      </div>
    </AbsoluteFill>
  );
};

// Один план: відеокліп на весь кадр (cover) з коротким «поштовхом» масштабу на склейці.
export const ShotLayer: React.FC<{ scene: Scene; shot: Shot }> = ({ scene, shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punch = interpolate(frame, [0, 9], [1.06, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ transform: `scale(${punch})`, backgroundColor: COLORS.ink }}>
      {shot.media ? (
        <OffthreadVideo
          src={staticFile(shot.media.src)}
          trimBefore={Math.round(shot.trimStartSec * fps)}
          playbackRate={shot.playbackRate}
          volume={shot.clipAudioVolume}
          muted={shot.clipAudioVolume === 0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <Placeholder scene={scene} shot={shot} />
      )}
    </AbsoluteFill>
  );
};
