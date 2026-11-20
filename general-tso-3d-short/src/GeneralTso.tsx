import React, { useEffect, useState } from "react";
import { AbsoluteFill, Html5Audio, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFonts } from "./fonts";
import { BANDS, COLORS } from "./theme";
import { music, musicVolume, scenes, sfx, voiceoverFull } from "./timeline";
import { Grade, Grain, SceneText, Vignette } from "./components/Finish";
import { IngredientChips } from "./components/IngredientChips";
import { KineticSubtitles } from "./components/KineticSubtitles";
import { Band, SafeZoneGuides } from "./components/SafeZone";
import { ShotLayer } from "./components/SceneVideo";
import { TitlePlate } from "./components/TitlePlate";
import { Scene3D } from "./three/Scene3D";

export type GeneralTsoProps = {
  // Показати межі безпечної зони та смуг верстки (для перевірки, не для публікації).
  showSafeZone: boolean;
};

// Затемнення під текстом: згори — під заголовок і плашки, знизу — під субтитри.
const Scrims: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(10,8,7,0.62) 0%, rgba(10,8,7,0.42) 22%, rgba(10,8,7,0) 36%, rgba(10,8,7,0) 62%, rgba(10,8,7,0.38) 76%, rgba(10,8,7,0.55) 100%)",
    }}
  />
);

// Фонова музика: зациклена, тихо під голосом, із плавним входом і затуханням в останню секунду.
// Гучність рахуємо від абсолютного кадру ролика: усередині `loop` лічильник кадрів обнуляється на кожному колі.
const Music: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const envelope = interpolate(frame, [0, 0.3 * fps, durationInFrames - fps, durationInFrames - 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <Html5Audio src={staticFile(src)} loop volume={musicVolume * envelope} />;
};

export const GeneralTso: React.FC<GeneralTsoProps> = ({ showSafeZone }) => {
  // Кадри рендеряться лише після завантаження Roboto Slab і Jost.
  const [fontHandle] = useState(() => delayRender("Завантаження шрифтів Roboto Slab і Jost"));
  useEffect(() => {
    loadFonts().then(() => continueRender(fontHandle));
  }, [fontHandle]);

  const shots = scenes.flatMap((scene) => scene.shots);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {/* 1. 3D-сцени, зібрані в коді (Three.js) — для планів, де немає готового кліпу */}
      <Scene3D shots={shots.filter((shot) => !shot.media)} />

      {/* 2. Готові відеокліпи з public/scenes/ мають пріоритет над 3D */}
      {scenes.flatMap((scene) =>
        scene.shots
          .filter((shot) => shot.media)
          .map((shot) => (
            <Sequence key={shot.id} from={shot.from} durationInFrames={shot.durationInFrames} name={`Відео · ${shot.id}`}>
              <ShotLayer shot={shot} />
            </Sequence>
          )),
      )}

      <Scrims />

      {/* 3. Заголовки і плашки інгредієнтів — у верхніх смугах безпечної зони */}
      {scenes.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationInFrames} name={`Текст · ${scene.id}`}>
          {/* Останній титр лишається до кінця ролика, решта швидко виходять перед склейкою */}
          <SceneText durationInFrames={scene.durationInFrames} exit={scene.titleStyle !== "outro"}>
            <Band band={scene.titleStyle === "hero" ? { y_min: BANDS.title.y_min, y_max: BANDS.ingredient_chips.y_max } : BANDS.title}>
              <TitlePlate scene={scene} />
            </Band>
            {scene.chips.length ? (
              <Band band={BANDS.ingredient_chips}>
                <IngredientChips scene={scene} />
              </Band>
            ) : null}
          </SceneText>
        </Sequence>
      ))}

      {/* 4. Кінетичні субтитри — у нижній смузі безпечної зони */}
      <Band band={BANDS.subtitles} align="end">
        <KineticSubtitles chunks={scenes.flatMap((scene) => scene.subtitles)} />
      </Band>

      {/* 5. Звук: або одна доріжка на весь ролик, або по файлу на сцену */}
      {voiceoverFull ? <Html5Audio src={staticFile(voiceoverFull.src)} /> : null}
      {scenes.map((scene) =>
        scene.voiceover ? (
          <Sequence key={scene.id} from={scene.voiceover.from} durationInFrames={scene.voiceover.durationInFrames} name={`Озвучка · ${scene.id}`}>
            <Html5Audio src={staticFile(scene.voiceover.media.src)} playbackRate={scene.voiceover.playbackRate} />
          </Sequence>
        ) : null,
      )}
      {music ? <Music src={music.src} /> : null}
      {sfx.map((cue, i) => (
        <Sequence key={i} from={cue.from} durationInFrames={cue.durationInFrames} name={`SFX · ${cue.src}`}>
          <Html5Audio src={staticFile(cue.src)} volume={cue.volume} />
        </Sequence>
      ))}

      {/* 6. Фінальна обробка: грейд → зерно → віньєтка */}
      <Grade />
      <Grain />
      <Vignette />

      {showSafeZone ? <SafeZoneGuides /> : null}
    </AbsoluteFill>
  );
};
