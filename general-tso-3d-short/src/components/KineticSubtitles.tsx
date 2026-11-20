import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING } from "../theme";
import { SUBTITLE_FONT } from "../fonts";
import type { SubtitleChunk } from "../timeline";

// Кінетичні субтитри: фраза з'являється блоком, слова «вистрибують» у ритмі мовлення,
// активне слово підсвічується золотим і трохи збільшується.
// `frame` тут — абсолютний кадр ролика (компонент стоїть поза <Sequence>).
export const KineticSubtitles: React.FC<{ chunks: SubtitleChunk[] }> = ({ chunks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chunk = chunks.find((c) => frame >= c.startFrame && frame < c.endFrame);
  if (!chunk) return null;

  const enter = spring({ frame: frame - chunk.startFrame, fps, config: SPRING.smooth });

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          maxWidth: "100%",
          boxSizing: "border-box",
          font: `800 58px ${SUBTITLE_FONT}`,
          lineHeight: 1.16,
          textAlign: "center",
          textWrap: "balance",
          color: COLORS.white,
          background: "rgba(14, 11, 9, 0.66)",
          borderRadius: 28,
          padding: "20px 30px 24px",
          transform: `scale(${interpolate(enter, [0, 1], [0.88, 1])})`,
          transformOrigin: "center bottom",
          opacity: Math.min(1, enter * 2.2),
        }}
      >
        {chunk.words.map((word, i) => {
          const pop = spring({ frame: frame - word.startFrame, fps, config: SPRING.bouncy });
          const active = frame >= word.startFrame && frame < word.endFrame;
          const spoken = frame >= word.startFrame;
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: "inline-block",
                  color: active ? COLORS.gold : COLORS.white,
                  opacity: spoken ? 1 : 0.38,
                  transform: `translateY(${interpolate(pop, [0, 1], [10, 0])}px) scale(${active ? interpolate(pop, [0, 1], [0.9, 1.07]) : 1})`,
                  textShadow: "0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.55)",
                }}
              >
                {word.text}
              </span>
              {i < chunk.words.length - 1 ? " " : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
