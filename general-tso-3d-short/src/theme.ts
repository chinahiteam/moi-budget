import { Easing } from "remotion";
import script from "../scripts/general_tso_30s.json";

export const FPS = script.meta.fps;
export const WIDTH = script.meta.width;
export const HEIGHT = script.meta.height;
export const DURATION_FRAMES = script.meta.duration_frames;

// Центральна безпечна зона: інтерфейс Shorts / Reels / TikTok її не перекриває.
export const SAFE = script.meta.safe_zone_px;
export const SAFE_WIDTH = SAFE.x_max - SAFE.x_min;
export const BANDS = script.meta.layout_bands_px;

// Кольори бренду зібрані в одному місці — замініть на фірмові за потреби.
export const COLORS = {
  ink: "#120E0C",
  plate: "rgba(18, 14, 12, 0.80)",
  cream: "#FFF4E0",
  chili: "#D8261C",
  chiliDark: "#A3170F",
  gold: "#FFC83D",
  white: "#FFFFFF",
};

// Криві руху. Лінійної інтерполяції в ролику немає: входи — easeOut, виходи — easeIn.
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

// Пресети пружин: snappy — слова й плашки, smooth — великі блоки, bouncy — грайливі акценти.
export const SPRING = {
  snappy: { damping: 13, stiffness: 190, mass: 0.6 },
  smooth: { damping: 14, stiffness: 240, mass: 0.5 },
  bouncy: { damping: 11, stiffness: 220, mass: 0.6 },
};

// Вихід елемента: останні EXIT_FRAMES кадрів сцени, швидший за вхід.
export const EXIT_FRAMES = 8;
