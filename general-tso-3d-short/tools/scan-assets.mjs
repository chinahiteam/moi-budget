#!/usr/bin/env node
// Сканує public/ і записує src/generated/assets.json — маніфест наявних відео й аудіо з їхньою
// тривалістю. Композиція Remotion читає маніфест: чого немає — замінює заглушкою (відео) або тишею (звук).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = resolve(ROOT, "public");
const script = JSON.parse(readFileSync(resolve(ROOT, "scripts/general_tso_30s.json"), "utf8"));

const VIDEO_EXT = ["mp4", "mov", "webm", "mkv"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac", "ogg"];

const hasSystemFfprobe = (() => {
  try {
    execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

// Системний ffprobe, а якщо його немає — той, що йде в комплекті з Remotion.
const ffprobe = (args) =>
  hasSystemFfprobe
    ? execFileSync("ffprobe", args, { encoding: "utf8" })
    : execFileSync("npx", ["remotion", "ffprobe", ...args], { encoding: "utf8", cwd: ROOT });

const probe = (relPath) => {
  const out = ffprobe(["-v", "error", "-print_format", "json", "-show_format", "-show_streams", resolve(PUBLIC, relPath)]);
  const info = JSON.parse(out.slice(out.indexOf("{")));
  const video = info.streams.find((s) => s.codec_type === "video");
  return {
    src: relPath,
    durationSec: Number(Number(info.format.duration).toFixed(3)),
    ...(video ? { width: video.width, height: video.height } : {}),
  };
};

// Знаходить файл за базовим шляхом без розширення (або з ним) серед дозволених розширень.
const find = (base, exts) => {
  const stem = base.replace(/\.[a-z0-9]+$/i, "");
  for (const ext of exts) {
    const rel = `${stem}.${ext}`;
    if (existsSync(resolve(PUBLIC, rel))) return probe(rel);
  }
  return null;
};

const warnings = [];
const rows = [];
const vo = script.meta.voiceover;

const manifest = {
  generatedAt: new Date().toISOString(),
  voiceoverFull: find("audio/voiceover", AUDIO_EXT),
  music: find("audio/music", AUDIO_EXT),
  scenes: {},
};

for (const scene of script.scenes) {
  const slot = scene.end_sec - scene.start_sec;
  const sceneVideo = find(scene.video_asset, VIDEO_EXT);
  const shots = {};
  for (const shot of scene.shots ?? []) shots[shot.id] = find(shot.video_asset, VIDEO_EXT);
  const voiceover = find(scene.voiceover_asset, AUDIO_EXT);

  manifest.scenes[scene.id] = { video: sceneVideo, shots, voiceover };

  const shotList = scene.shots ?? [];
  const shotsFound = shotList.filter((s) => shots[s.id]).length;
  const videoState = sceneVideo
    ? `${sceneVideo.src} (${sceneVideo.durationSec} с)`
    : shotList.length && shotsFound
      ? `плани ${shotsFound}/${shotList.length}`
      : "— заглушка";
  rows.push({ сцена: scene.id, слот: `${slot} с`, відео: videoState, озвучка: voiceover ? `${voiceover.src} (${voiceover.durationSec} с)` : "—" });

  for (const v of [sceneVideo, ...Object.values(shots)]) {
    if (v && v.width && Math.abs(v.width / v.height - 9 / 16) > 0.01) {
      warnings.push(`${v.src}: ${v.width}×${v.height} — не 9:16, кадр буде обрізано по центру (object-fit: cover).`);
    }
  }
  if (voiceover && !manifest.voiceoverFull) {
    const available = slot - vo.lead_in_sec - vo.tail_sec;
    const rate = voiceover.durationSec / available;
    if (rate > vo.max_speedup) {
      warnings.push(
        `${voiceover.src}: ${voiceover.durationSec} с не вміщується у ${available.toFixed(2)} с навіть із прискоренням ×${vo.max_speedup} — кінець фрази буде обрізано. Перезапишіть швидше.`,
      );
    } else if (rate > 1.02) {
      warnings.push(`${voiceover.src}: буде прискорено ×${rate.toFixed(2)}, щоб вміститися у слот ${slot} с.`);
    }
  }
}

if (manifest.voiceoverFull && Math.abs(manifest.voiceoverFull.durationSec - script.meta.duration_sec) > 0.5) {
  warnings.push(`audio/voiceover: тривалість ${manifest.voiceoverFull.durationSec} с, а ролик — ${script.meta.duration_sec} с. Субтитри йдуть за таймінгами зі сценарію.`);
}
const anyVo = manifest.voiceoverFull || Object.values(manifest.scenes).some((s) => s.voiceover);
if (!anyVo) warnings.push("Озвучки немає (public/audio/voiceover.* або vo_scene_0N.*) — ролик буде без голосу.");

const outFile = resolve(ROOT, "src/generated/assets.json");
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(manifest, null, 2) + "\n");

console.table(rows);
console.log(`Повна доріжка озвучки: ${manifest.voiceoverFull ? manifest.voiceoverFull.src : "—"} · Музика: ${manifest.music ? manifest.music.src : "—"}`);
for (const w of warnings) console.warn(`⚠ ${w}`);
console.log("✓ src/generated/assets.json");
