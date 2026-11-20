import React from "react";
import { Composition } from "remotion";
import { GeneralTso } from "./GeneralTso";
import { Turnaround } from "./three/Turnaround";
import { DURATION_FRAMES, FPS, HEIGHT, WIDTH } from "./theme";

export const Root: React.FC = () => (
  <>
  <Composition id="ChefTurnaround" component={Turnaround} width={WIDTH} height={HEIGHT} fps={FPS} durationInFrames={240} />
  <Composition
    id="GeneralTso30s"
    component={GeneralTso}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={DURATION_FRAMES}
    defaultProps={{ showSafeZone: false }}
  />
  </>
);
