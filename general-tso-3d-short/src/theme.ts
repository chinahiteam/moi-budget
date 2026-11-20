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
