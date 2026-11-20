import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SAFE_WIDTH, SPRING } from "../theme";
import { TITLE_FONT } from "../fonts";
import type { Scene } from "../timeline";

const SEPARATOR = " • ";
const shadow = "0 4px 0 rgba(0,0,0,0.55), 0 10px 28px rgba(0,0,0,0.55)";

const usePop = (delay: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: SPRING.snappy });
};

const Badge: React.FC<{ text: string; delay: number; background: string; color: string }> = ({ text, delay, background, color }) => {
  const pop = usePop(delay);
  return (
    <div
      style={{
        alignSelf: "flex-start",
        font: `900 42px ${TITLE_FONT}`,
        lineHeight: 1,
        color,
        background,
        padding: "13px 24px 15px",
        borderRadius: 16,
        boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
        transform: `scale(${pop}) rotate(${interpolate(pop, [0, 1], [-8, -2])}deg)`,
        transformOrigin: "left center",
        opacity: Math.min(1, pop * 2),
      }}
    >
      {text}
    </div>
  );
};

// Ділить заголовок на два рядки якомога рівніше («КУРКА» / «ГЕНЕРАЛА ЦО»), щоб не лишалося слова-сироти.
const balanceLines = (words: string[]): string[][] => {
  if (words.length < 2) return [words];
  let best = 1;
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const width = Math.max(words.slice(0, i).join(" ").length, words.slice(i).join(" ").length);
    if (width < bestWidth) [best, bestWidth] = [i, width];
  }
  return [words.slice(0, best), words.slice(best)];
};

// Хук: великий заголовок страви, слова «вистрибують» по черзі, далі — бейдж «30 СЕК».
const HeroTitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [main, badge] = text.split(SEPARATOR);
  const lines = balanceLines(main.split(" "));
  const wordCount = lines.flat().length;
  const longest = Math.max(...lines.map((line) => line.join(" ").length));
  // Roboto Slab 900 у верхньому регістрі ≈ 0.76em на символ: розмір підбираємо так, щоб рядок не вийшов за безпечну зону.
  const fontSize = Math.min(96, Math.floor(SAFE_WIDTH / (longest * 0.76)));
  let wordIndex = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ font: `900 ${fontSize}px ${TITLE_FONT}`, lineHeight: 1.02, textShadow: shadow }}>
        {lines.map((line, lineIndex) => (
          <div key={lineIndex} style={{ display: "flex", columnGap: fontSize * 0.26, whiteSpace: "nowrap" }}>
            {line.map((word) => {
              const i = wordIndex++;
              const pop = spring({ frame: frame - 2 - i * 4, fps, config: SPRING.snappy });
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    transform: `translateY(${interpolate(pop, [0, 1], [46, 0])}px) scale(${interpolate(pop, [0, 1], [0.7, 1])})`,
                    opacity: Math.min(1, pop * 1.6),
                    color: lineIndex === lines.length - 1 ? COLORS.gold : COLORS.cream,
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {badge ? <Badge text={badge} delay={2 + wordCount * 4 + 3} background={COLORS.chili} color={COLORS.white} /> : null}
    </div>
  );
};

// Крок рецепта: золотий номер + плашка з назвою кроку.
const StepTitle: React.FC<{ text: string }> = ({ text }) => {
  const match = text.match(/^(\d+)\.\s*(.*)$/);
  const number = match?.[1] ?? "";
  const label = match?.[2] ?? text;
  const pop = usePop(1);
  const slide = usePop(4);
  const fontSize = label.length > 26 ? 37 : 42;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div
        style={{
          flex: "0 0 auto",
          width: 96,
          height: 96,
          borderRadius: 48,
          background: COLORS.gold,
          color: COLORS.ink,
          font: `900 58px ${TITLE_FONT}`,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 22px rgba(0,0,0,0.5)",
          transform: `scale(${pop}) rotate(${interpolate(pop, [0, 1], [-90, 0])}deg)`,
        }}
      >
        {number}
      </div>
      <div
        style={{
          flex: "0 1 auto",
          minWidth: 0,
          font: `800 ${fontSize}px ${TITLE_FONT}`,
          lineHeight: 1.14,
          color: COLORS.cream,
          background: COLORS.plate,
          borderLeft: `10px solid ${COLORS.chili}`,
          borderRadius: 18,
          padding: "18px 24px 20px",
          textWrap: "balance",
          boxShadow: "0 8px 26px rgba(0,0,0,0.4)",
          transform: `translateX(${interpolate(slide, [0, 1], [70, 0])}px)`,
          opacity: Math.min(1, slide * 1.8),
        }}
      >
        {label}
      </div>
    </div>
  );
};

// Фінал: назва бренду на червоній плашці + «СМАЧНОГО!».
const OutroTitle: React.FC<{ text: string }> = ({ text }) => {
  const [brand, badge] = text.split(SEPARATOR);
  const pop = usePop(2);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          alignSelf: "flex-start",
          font: `900 56px ${TITLE_FONT}`,
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: COLORS.white,
          background: `linear-gradient(180deg, ${COLORS.chili}, ${COLORS.chiliDark})`,
          padding: "18px 28px 21px",
          borderRadius: 20,
          boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
          transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})`,
          transformOrigin: "left center",
          opacity: Math.min(1, pop * 1.8),
        }}
      >
        {brand}
      </div>
      {badge ? <Badge text={badge} delay={12} background={COLORS.gold} color={COLORS.ink} /> : null}
    </div>
  );
};

export const TitlePlate: React.FC<{ scene: Scene }> = ({ scene }) => {
  if (scene.titleStyle === "hero") return <HeroTitle text={scene.onScreenText} />;
  if (scene.titleStyle === "outro") return <OutroTitle text={scene.onScreenText} />;
  return <StepTitle text={scene.onScreenText} />;
};
