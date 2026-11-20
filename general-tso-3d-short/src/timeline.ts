import script from "../scripts/general_tso_30s.json";
import assets from "./generated/assets.json";
import { FPS } from "./theme";

export type MediaInfo = { src: string; durationSec: number; width?: number; height?: number };
type VideoOptions = { trim_start_sec: number; playback_rate: number | string; clip_audio_volume: number };
type RawShot = { id: string; start_sec: number; end_sec: number; description?: string; video_asset: string; video: VideoOptions };
type RawScene = (typeof script.scenes)[number] & { shots?: RawShot[] };
type SceneAssets = { video: MediaInfo | null; shots: Record<string, MediaInfo | null>; voiceover: MediaInfo | null };
type Manifest = {
  voiceoverFull: MediaInfo | null;
  music: MediaInfo | null;
  sfx: Record<string, MediaInfo | null>;
  scenes: Record<string, SceneAssets>;
};

export type Shot = {
  id: string;
  from: number; // кадри, від початку ролика
  durationInFrames: number;
  description: string;
  expectedFile: string;
  media: MediaInfo | null;
  trimStartSec: number;
  playbackRate: number;
  clipAudioVolume: number;
};

export type Word = { text: string; startFrame: number; endFrame: number };
export type SubtitleChunk = { text: string; startFrame: number; endFrame: number; words: Word[] };
export type Chip = { text: string; atFrame: number };

export type Scene = {
  id: string;
  index: number;
  name: string;
  action: string;
  from: number;
  durationInFrames: number;
  onScreenText: string;
  titleStyle: "hero" | "step" | "outro";
  shots: Shot[];
  subtitles: SubtitleChunk[];
  chips: Chip[];
  voiceover: { media: MediaInfo; from: number; durationInFrames: number; playbackRate: number } | null;
};

const manifest = assets as Manifest;
const { voiceover: voConfig } = script.meta;

const toFrame = (sec: number) => Math.round(sec * FPS);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Тривалість слова пропорційна кількості складів (голосних) — так підсвітка йде в ритмі мовлення.
const syllableWeight = (word: string) => (word.match(/[аеєиіїоуюяaeiouy]/gi)?.length ?? 0) + 0.6;

// Розділові знаки, що стоять окремо («—»), приклеюємо до попереднього слова.
const tokenize = (text: string): string[] => {
  const tokens: string[] = [];
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    if (tokens.length && !/[\p{L}\p{N}]/u.test(raw)) tokens[tokens.length - 1] += ` ${raw}`;
    else tokens.push(raw);
  }
  return tokens;
};

// Автопідбір швидкості кліпу: довший за слот — обрізаємо хвіст, коротший — сповільнюємо до довжини слоту.
const resolvePlaybackRate = (option: number | string, media: MediaInfo | null, trimStartSec: number, slotSec: number) => {
  if (typeof option === "number") return option;
  if (!media) return 1;
  const available = media.durationSec - trimStartSec;
  return available >= slotSec ? 1 : clamp(available / slotSec, 0.4, 1);
};

const buildScene = (raw: RawScene): Scene => {
  const sceneAssets = manifest.scenes[raw.id] ?? { video: null, shots: {}, voiceover: null };
  const slotSec = raw.end_sec - raw.start_sec;

  // ── Відео: окремі плани, якщо вони є; інакше один файл на всю сцену; інакше заглушка.
  const rawShots = raw.shots ?? [];
  const useShots = rawShots.length > 0 && (!sceneAssets.video || rawShots.some((s) => sceneAssets.shots[s.id]));
  const shotDefs: RawShot[] = useShots
    ? rawShots
    : [{ id: raw.id, start_sec: raw.start_sec, end_sec: raw.end_sec, description: raw.action, video_asset: raw.video_asset, video: raw.video }];

  const shots: Shot[] = shotDefs.map((shot) => {
    const media = useShots ? (sceneAssets.shots[shot.id] ?? null) : sceneAssets.video;
    const shotSlot = shot.end_sec - shot.start_sec;
    return {
      id: shot.id,
      from: toFrame(shot.start_sec),
      durationInFrames: toFrame(shot.end_sec) - toFrame(shot.start_sec),
      description: shot.description ?? raw.action,
      expectedFile: `public/${shot.video_asset}`,
      media,
      trimStartSec: shot.video.trim_start_sec,
      playbackRate: resolvePlaybackRate(shot.video.playback_rate, media, shot.video.trim_start_sec, shotSlot),
      clipAudioVolume: shot.video.clip_audio_volume,
    };
  });

  // ── Озвучка сцени: якщо фраза довша за слот, прискорюємо (без зміни висоти тону), але не більше max_speedup.
  const voMedia = manifest.voiceoverFull ? null : sceneAssets.voiceover;
  const voStartSec = raw.start_sec + voConfig.lead_in_sec;
  const availableSec = slotSec - voConfig.lead_in_sec - voConfig.tail_sec;
  const voRate = voMedia ? clamp(voMedia.durationSec / availableSec, 1, voConfig.max_speedup) : 1;
  const spokenSec = voMedia ? Math.min(voMedia.durationSec / voRate, availableSec) : 0;

  // ── Ретаймінг: коли є реальна озвучка сцени, розтягуємо/стискаємо таймінги субтитрів і плашок
  //    зі сценарію на фактичну тривалість фрази.
  const designStart = raw.subtitles[0]?.start_sec ?? raw.start_sec;
  const designEnd = raw.subtitles[raw.subtitles.length - 1]?.end_sec ?? raw.end_sec;
  const retime = (sec: number) =>
    voMedia
      ? clamp(voStartSec + ((sec - designStart) / (designEnd - designStart)) * spokenSec, raw.start_sec, raw.end_sec)
      : sec;

  const subtitles: SubtitleChunk[] = raw.subtitles.map((chunk) => {
    const startFrame = toFrame(retime(chunk.start_sec));
    const endFrame = Math.max(startFrame + 1, toFrame(retime(chunk.end_sec)));
    const tokens = tokenize(chunk.text);
    const weights = tokens.map(syllableWeight);
    const total = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    const words = tokens.map((text, i) => {
      const wordStart = startFrame + Math.round((acc / total) * (endFrame - startFrame));
      acc += weights[i];
      const wordEnd = startFrame + Math.round((acc / total) * (endFrame - startFrame));
      return { text, startFrame: wordStart, endFrame: wordEnd };
    });
    return { text: chunk.text, startFrame, endFrame, words };
  });

  return {
    id: raw.id,
    index: raw.index,
    name: raw.name,
    action: raw.action,
    from: toFrame(raw.start_sec),
    durationInFrames: toFrame(raw.end_sec) - toFrame(raw.start_sec),
    onScreenText: raw.on_screen_text,
    titleStyle: raw.title_style as Scene["titleStyle"],
    shots,
    subtitles,
    chips: raw.ingredient_chips.map((chip) => ({ text: chip.text, atFrame: toFrame(retime(chip.at_sec)) })),
    voiceover: voMedia
      ? { media: voMedia, from: toFrame(voStartSec), durationInFrames: toFrame(raw.end_sec) - toFrame(voStartSec), playbackRate: voRate }
      : null,
  };
};

export const scenes: Scene[] = (script.scenes as RawScene[]).map(buildScene);
export const voiceoverFull = manifest.voiceoverFull;
export const music = manifest.music;
export const musicVolume = script.meta.music.volume;

// ── Звукові ефекти ───────────────────────────────────────────────────────────
// Кожен ефект стартує на 2 кадри раніше за подію в кадрі: так звук сприймається синхронним.
export type SfxCue = { src: string; from: number; durationInFrames?: number; volume: number };

const sfxCues = (): SfxCue[] => {
  const files = manifest.sfx ?? {};
  const cues: SfxCue[] = [];
  const push = (name: string, frame: number, volume: number, durationInFrames?: number) => {
    const file = files[name];
    if (file) cues.push({ src: file.src, from: Math.max(0, Math.round(frame) - 2), volume, durationInFrames });
  };
  const byId = Object.fromEntries(scenes.flatMap((scene) => scene.shots).map((shot) => [shot.id, shot]));

  for (const scene of scenes) {
    for (const shot of scene.shots) if (shot.from > 0) push("whoosh", shot.from, 0.45); // монтажні склейки
    for (const chip of scene.chips) push("pop", chip.atFrame, 0.3); // плашки інгредієнтів
  }
  // Звуки дії прив'язані до анімації 3D-планів (src/three/Shots.tsx) і вимикаються, якщо план замінено відеокліпом.
  const at = (id: string, frame: number) => (byId[id] && !byId[id].media ? byId[id].from + frame : null);
  const cue = (name: string, id: string, frame: number, volume: number, duration?: number) => {
    const f = at(id, frame);
    if (f !== null) push(name, f, volume, duration);
  };
  cue("sizzle", "scene_01", 0, 0.16, 90);
  cue("flare", "scene_01", 22, 0.5);
  for (const hit of [8, 19, 30, 41]) cue("chop", "scene_02a", hit, 0.7); // удари тесака
  cue("sizzle", "scene_03", 4, 0.3, 150);
  cue("sizzle", "scene_04", 6, 0.2, 232);
  cue("flare", "scene_04", 170, 0.4);
  cue("flare", "scene_04", 200, 0.6);
  cue("ding", "scene_05", 132, 0.4); // фінальна усмішка, 29.4 с
  return cues;
};
export const sfx: SfxCue[] = sfxCues();
