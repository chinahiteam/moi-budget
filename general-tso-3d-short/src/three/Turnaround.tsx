import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Chef } from "./Chef";
import { Kitchen } from "./Kitchen";
import * as THREE from "three";
import { Post } from "./Post";
import { Cam, Environment, KitchenLights } from "./Stage";

// Обертання персонажа на 360° — для перевірки моделі з усіх боків (turnaround).
// Кадри 0–119: повний зріст; 120–239: портрет із фірмовою усмішкою.
export const Turnaround: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = frame >= 120;
  const angle = ((frame % 120) / 120) * Math.PI * 2;
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1410" }}>
      <ThreeCanvas width={width} height={height} shadows={{ type: THREE.PCFSoftShadowMap }} dpr={1} flat gl={{ antialias: false }}>
        <color attach="background" args={["#17110d"]} />
        <Environment />
        <KitchenLights target={[0, 1, 0]} />
        <Cam position={portrait ? [0, 1.5, 1.25] : [0, 1.0, 4.9]} look={portrait ? [0, 1.44, 0] : [0, 0.86, 0]} fov={portrait ? 28 : 30} />
        <Post focus={[0, portrait ? 1.46 : 1, 0.1]} blur={portrait ? 1 : 0.5} />
        <Kitchen station={false} />
        <Chef
          pose={{
            rotationY: angle,
            smile: portrait ? 1 : 0.25,
            handL: portrait ? undefined : [0.06, 0.8, 0.2],
            handR: portrait ? undefined : [-0.06, 0.78, 0.21],
            gripL: 0.6,
            gripR: 0.6,
          }}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
