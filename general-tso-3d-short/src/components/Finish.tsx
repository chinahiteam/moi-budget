import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, EXIT_FRAMES } from "../theme";

// Фінальна обробка картинки (верхні шари): теплий колірний грейд → плівкове зерно → віньєтка.
// Вони об'єднують 3D, відеокліпи і графіку в один цілісний вигляд.

export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: COLORS.gold, mixBlendMode: "soft-light", opacity: 0.1 }} />
  </AbsoluteFill>
);

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: NOISE,
        backgroundSize: "220px",
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: 0.06,
        mixBlendMode: "overlay",
      }}
    />
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.3) 100%)" }} />
);

// Обгортка для тексту сцени: легке «дихання», поки елемент на екрані, і швидкий вихід перед склейкою.
export const SceneText: React.FC<{ durationInFrames: number; exit?: boolean; children: React.ReactNode }> = ({
  durationInFrames,
  exit = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const out = exit
    ? interpolate(frame, [durationInFrames - EXIT_FRAMES, durationInFrames - 1], [0, 1], {
        easing: EASE.in,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const breathe = 1 + Math.sin(frame / 22) * 0.008;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-34 * out}px) scale(${breathe * (1 - 0.04 * out)})`, transformOrigin: "50% 22%" }}>
      {children}
    </AbsoluteFill>
  );
};
