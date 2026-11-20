import React from "react";
import { AbsoluteFill } from "remotion";
import { BANDS, COLORS, HEIGHT, SAFE, SAFE_WIDTH, WIDTH } from "../theme";

// Смуга всередині безпечної зони: усе, що в неї покладено, фізично не може вийти за її межі.
export const Band: React.FC<{
  band: { y_min: number; y_max: number };
  align?: "start" | "end" | "center";
  children: React.ReactNode;
}> = ({ band, align = "start", children }) => (
  <div
    style={{
      position: "absolute",
      left: SAFE.x_min,
      width: SAFE_WIDTH,
      top: band.y_min,
      height: band.y_max - band.y_min,
      display: "flex",
      flexDirection: "column",
      justifyContent: align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

// Налагоджувальні напрямні (`--props='{"showSafeZone":true}'`): межі безпечної зони та смуг верстки.
export const SafeZoneGuides: React.FC = () => {
  const label: React.CSSProperties = {
    position: "absolute",
    left: 6,
    top: 4,
    font: '600 20px "Jost", sans-serif',
    color: COLORS.white,
    background: "rgba(0,0,0,0.6)",
    padding: "2px 8px",
    borderRadius: 6,
  };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <path
          fillRule="evenodd"
          fill="rgba(255, 0, 60, 0.28)"
          d={`M0 0H${WIDTH}V${HEIGHT}H0Z M${SAFE.x_min} ${SAFE.y_min}V${SAFE.y_max}H${SAFE.x_max}V${SAFE.y_min}Z`}
        />
        <rect
          x={SAFE.x_min}
          y={SAFE.y_min}
          width={SAFE_WIDTH}
          height={SAFE.y_max - SAFE.y_min}
          fill="none"
          stroke="#00E5FF"
          strokeWidth={3}
          strokeDasharray="14 8"
        />
      </svg>
      {Object.entries(BANDS).map(([name, band]) => (
        <div
          key={name}
          style={{
            position: "absolute",
            left: SAFE.x_min,
            width: SAFE_WIDTH,
            top: band.y_min,
            height: band.y_max - band.y_min,
            boxSizing: "border-box",
            border: "2px dashed rgba(255, 200, 61, 0.9)",
          }}
        >
          <span style={{ ...label, left: SAFE_WIDTH + 8, top: 0, width: 116, fontSize: 15, lineHeight: 1.2 }}>
            {name} Y {band.y_min}–{band.y_max}
          </span>
        </div>
      ))}
      <span style={{ ...label, left: SAFE.x_min + 6, top: SAFE.y_min - 34 }}>
        SAFE ZONE · X {SAFE.x_min}–{SAFE.x_max} · Y {SAFE.y_min}–{SAFE.y_max}
      </span>
    </AbsoluteFill>
  );
};
