#!/usr/bin/env node
// Синтезує музичну підкладку і набір звукових ефектів — без жодних зовнішніх файлів і бібліотек.
// Усе детерміноване: однаковий результат на кожному запуску.
//
//   public/audio/music.wav   30 с, 120 BPM (усі склейки 3 / 10 / 17 / 25 с потрапляють у долю),
//                            пентатоніка на «щипковій струні» (алгоритм Карплуса — Стронга)
//   public/sfx/*.wav         whoosh, pop, chop, sizzle, flare, ding

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SR = 32000;

// ── Детермінований шум ───────────────────────────────────────────────────────
let seed = 20261119;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

const buffer = (sec) => new Float32Array(Math.round(sec * SR));
const mixInto = (dest, src, atSec, gain = 1) => {
  const offset = Math.round(atSec * SR);
  for (let i = 0; i < src.length && offset + i < dest.length; i++) dest[offset + i] += src[i] * gain;
};

// Однополюсні фільтри: lowpass / highpass.
const lowpass = (x, cutoff) => {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  return x.map((v) => (y += a * (v - y)));
};
const highpass = (x, cutoff) => {
  const lp = lowpass(x, cutoff);
  return x.map((v, i) => v - lp[i]);
};
const bandpass = (x, lo, hi) => highpass(lowpass(x, hi), lo);

// ── Інструменти ──────────────────────────────────────────────────────────────

// Щипкова струна (Карплус — Стронг): звучить як гуджен / піпа.
const pluck = (freq, sec, brightness = 0.5) => {
  const out = buffer(sec);
  const period = Math.round(SR / freq);
  const line = Float32Array.from({ length: period }, () => noise());
  // Початкове згладжування задає яскравість атаки.
  for (let pass = 0; pass < Math.round((1 - brightness) * 6); pass++) {
    for (let i = 1; i < period; i++) line[i] = (line[i] + line[i - 1]) / 2;
  }
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    const next = (idx + 1) % period;
    out[i] = line[idx];
    line[idx] = (line[idx] + line[next]) * 0.4985;
    idx = next;
  }
  return out;
};

const kick = () => {
  const out = buffer(0.28);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * (48 * t + 22 * (1 - Math.exp(-t * 28)))) * Math.exp(-t * 13);
  }
  return out;
};

// Дерев'яна коробочка (темпл-блок).
const woodblock = (freq) => {
  const out = buffer(0.09);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 2.4 * t)) * Math.exp(-t * 55);
  }
  return out;
};

const shaker = () => {
  const out = buffer(0.06).map(() => noise());
  const hp = highpass(out, 5000);
  return hp.map((v, i) => v * Math.exp((-i / SR) * 70));
};

// ── Музика ───────────────────────────────────────────────────────────────────
const makeMusic = () => {
  const total = 30;
  const beat = 0.5; // 120 BPM
  const out = buffer(total);
  const hz = (semi) => 220 * Math.pow(2, semi / 12);
  // Пентатоніка (гун): C D E G A — у півтонах від A3.
  const scale = [3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
  // Двотактова фраза восьмими (−1 — пауза); далі варіюється по секціях.
  const phraseA = [4, -1, 5, 6, 4, -1, 2, 3, 4, 5, 6, -1, 7, 6, 5, -1];
  const phraseB = [6, 7, 8, -1, 7, 6, 5, 4, 6, -1, 4, 5, 3, -1, 4, -1];
  const phraseC = [8, 7, 6, 7, 8, -1, 9, 8, 7, 6, 5, 6, 7, -1, 8, -1];
  const bass = [0, 0, 3, 2]; // ступені баса по тактах
  const k = kick();
  const sh = shaker();

  for (let step = 0; step < total / (beat / 2); step++) {
    const t = step * (beat / 2);
    const bar = Math.floor(t / 2);
    // Секції збігаються зі сценами: хук 0–3, підготовка 3–10, смаження 10–17, вок 17–25, фінал 25–30.
    const phrase = t < 3 ? phraseC : t < 10 ? phraseA : t < 17 ? phraseB : t < 25 ? phraseC : phraseA;
    const note = phrase[step % phrase.length];
    const energy = t < 3 ? 1 : t < 10 ? 0.85 : t < 17 ? 0.7 : t < 25 ? 1 : 0.9;
    if (note >= 0) mixInto(out, pluck(hz(scale[note]), 0.9, 0.75), t, 0.34 * energy * (step % 2 === 0 ? 1 : 0.8));
    // Бас на першу й третю долі.
    if (step % 4 === 0) mixInto(out, pluck(hz(scale[bass[bar % 4]]) / 4, 1.1, 0.25), t, 0.6);
    // Бочка на сильні долі, шейкер на слабкі восьмі, коробочка на «і».
    if (step % 4 === 0) mixInto(out, k, t, 0.75 * energy);
    if (step % 2 === 1) mixInto(out, sh, t, 0.16 * energy);
    if (step % 8 === 6 || (t >= 17 && t < 25 && step % 4 === 3)) mixInto(out, woodblock(step % 16 === 6 ? 900 : 1200), t, 0.3);
  }
  // Акценти на монтажних склейках і фінальний удар.
  for (const cut of [3, 10, 17, 25]) {
    mixInto(out, k, cut, 0.9);
    mixInto(out, pluck(hz(scale[9]), 1.2, 0.9), cut, 0.3);
  }
  for (const [i, n] of [4, 6, 9].entries()) mixInto(out, pluck(hz(scale[n]), 1.6, 0.9), 29.5 + i * 0.012, 0.36);

  const lp = lowpass(out, 9000);
  for (let i = 0; i < lp.length; i++) {
    const t = i / SR;
    lp[i] *= Math.min(1, t / 0.02) * Math.min(1, (total - t) / 0.35);
  }
  return lp;
};

// ── Звукові ефекти ───────────────────────────────────────────────────────────

// Свист на склейці: шум зі смугою, що «проїжджає» знизу вгору.
const whoosh = () => {
  const sec = 0.34;
  const out = buffer(sec);
  let lpState = 0;
  let hpState = 0;
  for (let i = 0; i < out.length; i++) {
    const p = i / out.length;
    const cutoff = 400 + 5200 * Math.sin(Math.PI * p);
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
    lpState += a * (noise() - lpState);
    hpState += 0.02 * (lpState - hpState);
    out[i] = (lpState - hpState) * Math.pow(Math.sin(Math.PI * p), 1.6) * 1.8;
  }
  return out;
};

// «Поп» для плашок інгредієнтів: синус із падінням висоти.
const pop = () => {
  const out = buffer(0.1);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * (520 * t + 300 * (1 - Math.exp(-t * 40)) * 0.02)) * Math.exp(-t * 42) * Math.min(1, t * 900);
  }
  return out;
};

// Удар тесака по дошці: клац + глухий стук.
const chop = () => {
  const out = buffer(0.12);
  const click = highpass(buffer(0.12).map(() => noise()), 1800);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = click[i] * Math.exp(-t * 120) * 0.8 + Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 45) * 0.9;
  }
  return out;
};

// Шкварчання олії: шипіння + випадкові потріскування. Довжина 8 с, краї згладжені.
const sizzle = () => {
  const sec = 8;
  const hiss = bandpass(buffer(sec).map(() => noise()), 2500, 9000);
  const out = buffer(sec);
  let crackle = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    if (rand() < 0.0014) crackle = 0.9 + rand() * 0.6;
    crackle *= 0.985;
    const wobble = 0.75 + 0.25 * Math.sin(t * 9.1) * Math.sin(t * 3.7);
    out[i] = hiss[i] * (0.55 * wobble + crackle) * Math.min(1, t / 0.25) * Math.min(1, (sec - t) / 0.4);
  }
  return out;
};

// Спалах полум'я: низький гул, що наростає і спадає.
const flare = () => {
  const sec = 0.9;
  const rumble = lowpass(buffer(sec).map(() => noise()), 420);
  return rumble.map((v, i) => v * Math.pow(Math.sin((Math.PI * i) / rumble.length), 1.3) * 3.2);
};

// Дзвіночок на фінальній усмішці.
const ding = () => {
  const out = buffer(1.1);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] =
      (Math.sin(2 * Math.PI * 1318.5 * t) + 0.5 * Math.sin(2 * Math.PI * 2637 * t) + 0.25 * Math.sin(2 * Math.PI * 3955 * t)) *
      Math.exp(-t * 5) *
      Math.min(1, t * 600) *
      0.5;
  }
  return out;
};

// ── Запис WAV (16 біт, моно) з нормалізацією ───────────────────────────────────
const writeWav = (rel, samples, peak = 0.89) => {
  const max = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9);
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write("RIFF", 0);
  data.writeUInt32LE(36 + samples.length * 2, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round((samples[i] / max) * peak * 32767), 44 + i * 2);
  const file = resolve(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  console.log(`✓ ${rel} (${(samples.length / SR).toFixed(2)} с)`);
};

writeWav("public/audio/music.wav", makeMusic());
writeWav("public/sfx/whoosh.wav", whoosh());
writeWav("public/sfx/pop.wav", pop());
writeWav("public/sfx/chop.wav", chop());
writeWav("public/sfx/sizzle.wav", sizzle());
writeWav("public/sfx/flare.wav", flare());
writeWav("public/sfx/ding.wav", ding());
