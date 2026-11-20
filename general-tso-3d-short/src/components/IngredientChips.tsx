import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";
import { SUBTITLE_FONT } from "../fonts";
import type { Scene } from "../timeline";

// Плашки інгредієнтів: кожна «вистрибує» в момент, коли інгредієнт називає диктор.
// Місце під ще не показані плашки зарезервоване, тому рядок не стрибає.
export const IngredientChips: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignContent: "flex-start" }}>
      {scene.chips.map((chip) => {
        const pop = spring({ frame: frame - (chip.atFrame - scene.from), fps, config: { damping: 11, stiffness: 220, mass: 0.6 } });
        return (
          <div
            key={chip.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              font: `700 28px ${SUBTITLE_FONT}`,
              lineHeight: 1,
              letterSpacing: 0.6,
              color: COLORS.ink,
              background: COLORS.cream,
              padding: "14px 20px 14px 16px",
              borderRadius: 999,
              boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
              transform: `scale(${pop}) translateY(${interpolate(pop, [0, 1], [18, 0])}px)`,
              opacity: Math.min(1, pop * 2),
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 7, background: COLORS.chili, flex: "0 0 auto" }} />
            {chip.text}
          </div>
        );
      })}
    </div>
  );
};
