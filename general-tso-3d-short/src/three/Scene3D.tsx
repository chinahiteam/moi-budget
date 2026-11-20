import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { Shot } from "../timeline";
import { SHOTS } from "./Shots";
import { Environment } from "./Stage";

// 3D-шар ролика: один WebGL-канвас на все відео, у якому за номером кадру вмикається потрібний план.
// Малює лише ті плани, для яких у public/scenes/ немає готового відеокліпу.
export const Scene3D: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const shot = shots.find((s) => frame >= s.from && frame < s.from + s.durationInFrames);
  const View = shot ? SHOTS[shot.id] : undefined;
  if (!shot || !View) return null;
  const local = frame - shot.from;
  // Короткий «поштовх» масштабу на кожній монтажній склейці.
  const punch = interpolate(local, [0, 9], [1.05, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ transform: `scale(${punch})` }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={1}
        flat
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#17110d"]} />
        <fog attach="fog" args={["#17110d", 7, 16]} />
        <Environment />
        <View key={shot.id} f={local} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
