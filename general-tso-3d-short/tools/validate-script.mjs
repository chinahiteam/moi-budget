#!/usr/bin/env node
// Перевіряє сценарій і промпти перед рендером: таймінги, безпечну зону, довжину субтитрів
// і те, що канонічний опис Шефа Сяна дослівно присутній у кожному промпті.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));

const script = read("scripts/general_tso_30s.json");
const character = read("characters/chef_sian_prompts.json");
const prompts = read("prompts/scenes_3d_generation.json");

const errors = [];
const check = (ok, msg) => ok || errors.push(msg);
const near = (a, b) => Math.abs(a - b) < 1e-6;

const MAX_SUBTITLE_CHARS = 30;
const { meta, scenes } = script;

// ── Формат ───────────────────────────────────────────────────────────────────
check(meta.width === 1080 && meta.height === 1920, "meta: кадр має бути 1080×1920");
check(meta.fps === 30, "meta: fps має бути 30");
check(meta.duration_sec === 30 && meta.duration_frames === 900, "meta: тривалість має бути 30 с / 900 кадрів");

// ── Безпечна зона ────────────────────────────────────────────────────────────
const sz = meta.safe_zone_px;
check(sz.x_min === 140 && sz.x_max === 940 && sz.y_min === 260 && sz.y_max === 1520, "meta.safe_zone_px: очікується X 140–940, Y 260–1520");
for (const [name, band] of Object.entries(meta.layout_bands_px)) {
  check(band.y_min >= sz.y_min && band.y_max <= sz.y_max && band.y_min < band.y_max, `layout_bands_px.${name}: виходить за безпечну зону`);
}

// ── Сцени ────────────────────────────────────────────────────────────────────
check(scenes.length === 5, "Очікується рівно 5 сцен");
let cursor = 0;
for (const scene of scenes) {
  const tag = scene.id;
  check(near(scene.start_sec, cursor), `${tag}: початок ${scene.start_sec} с, а попередня сцена закінчується на ${cursor} с`);
  check(scene.end_sec > scene.start_sec, `${tag}: порожня сцена`);
  cursor = scene.end_sec;

  check(Boolean(scene.voiceover?.trim()), `${tag}: немає тексту озвучки`);
  check(Boolean(scene.on_screen_text?.trim()), `${tag}: немає тексту на екрані`);
  check(["hero", "step", "outro"].includes(scene.title_style), `${tag}: невідомий title_style`);

  let t = scene.start_sec;
  for (const sub of scene.subtitles) {
    check(sub.start_sec >= t - 1e-6, `${tag}: субтитр «${sub.text}» перекриває попередній`);
    check(sub.end_sec > sub.start_sec && sub.end_sec <= scene.end_sec + 1e-6, `${tag}: субтитр «${sub.text}» виходить за межі сцени`);
    check(sub.text.length <= MAX_SUBTITLE_CHARS, `${tag}: субтитр «${sub.text}» довший за ${MAX_SUBTITLE_CHARS} символів — не вміститься у 2 рядки`);
    t = sub.end_sec;
  }

  // Слова субтитрів мають збігатися з озвучкою (щоб текст на екрані не розходився з голосом).
  const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  check(norm(scene.subtitles.map((s) => s.text).join(" ")) === norm(scene.voiceover), `${tag}: текст субтитрів не збігається з текстом озвучки`);

  for (const chip of scene.ingredient_chips) {
    check(chip.at_sec >= scene.start_sec && chip.at_sec < scene.end_sec, `${tag}: плашка «${chip.text}» з'являється поза сценою`);
  }

  if (scene.shots) {
    let st = scene.start_sec;
    for (const shot of scene.shots) {
      check(near(shot.start_sec, st), `${tag}/${shot.id}: плани мають іти встик`);
      st = shot.end_sec;
    }
    check(near(st, scene.end_sec), `${tag}: плани не покривають сцену повністю`);
  }
}
check(near(cursor, meta.duration_sec), `Сцени закінчуються на ${cursor} с, а ролик триває ${meta.duration_sec} с`);

// ── Промпти: zero character drift ───────────────────────────────────────────
const lock = character.character_lock_en;
const compact = character.character_lock_compact_en;
check(prompts.locks.character_lock_en === lock, "prompts.locks.character_lock_en відрізняється від characters/chef_sian_prompts.json — запустіть `npm run prompts`");

const mustMention = [
  "about 50", "East Asian", "crow's-feet", "no glasses", "clean-shaven", "baseball cap", "no logo",
  "salt-and-pepper", "mandarin", "rolled", "metal snap", "bib apron", "white woven label", "trousers",
  "navy-blue clog", "white-and-red stripe",
];
for (const key of mustMention) check(lock.includes(key), `character_lock_en: немає обов'язкової деталі «${key}»`);

const expectedShots = scenes.flatMap((s) => (s.shots ? s.shots.map((x) => x.id) : [s.id]));
const promptShots = prompts.scenes.map((s) => s.shot_id);
check(JSON.stringify(expectedShots) === JSON.stringify(promptShots), `Промпти (${promptShots}) не відповідають планам сценарію (${expectedShots})`);

for (const p of prompts.scenes) {
  for (const field of ["video_prompt_en", "keyframe_start_prompt_en", "keyframe_end_prompt_en"]) {
    if (p[field] === undefined) continue;
    check(p[field].includes(lock), `${p.shot_id}.${field}: немає дослівного character_lock_en`);
    check(/9:16/.test(p[field]) && /safe zone/.test(p[field]), `${p.shot_id}.${field}: немає опису безпечної зони 9:16`);
  }
  check(p.video_prompt_compact_en.includes(compact), `${p.shot_id}.video_prompt_compact_en: немає character_lock_compact_en`);
  check(p.video_prompt_compact_en.length <= 2500, `${p.shot_id}.video_prompt_compact_en: довший за 2500 символів`);
}
for (const v of character.turnaround_sheet.views) {
  check(v.prompt_en.includes(lock), `turnaround ${v.id}: немає дослівного character_lock_en`);
}
check(character.turnaround_sheet.master_prompt_en.includes(lock), "turnaround master: немає дослівного character_lock_en");

if (errors.length) {
  console.error(`✗ Знайдено помилок: ${errors.length}`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}
console.log(`✓ Сценарій і промпти коректні: ${scenes.length} сцен, ${meta.duration_sec} с, ${promptShots.length} промптів із вшитим описом персонажа.`);
