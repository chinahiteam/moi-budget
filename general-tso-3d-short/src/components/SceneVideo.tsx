import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import type { Shot } from "../timeline";

// Готовий відеокліп плану (public/scenes/…) на весь кадр з коротким «поштовхом» масштабу на склейці.
// Якщо кліпу немає, цей шар не рендериться — замість нього працює 3D-сцена (src/three/Scene3D.tsx).
export const ShotLayer: React.FC<{ shot: Shot }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!shot.media) return null;
  const punch = interpolate(frame, [0, 9], [1.05, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ transform: `scale(${punch})`, backgroundColor: COLORS.ink }}>
      <OffthreadVideo
        src={staticFile(shot.media.src)}
        trimBefore={Math.round(shot.trimStartSec * fps)}
        playbackRate={shot.playbackRate}
        volume={shot.clipAudioVolume}
        muted={shot.clipAudioVolume === 0}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};
