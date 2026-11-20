import * as THREE from "three";
import { C } from "./materials";
import { type Sdf, add, blend, capsule, carve, clip, ellipsoid, mirror, sculpt } from "./sculpt";

// Виліплені частини Шефа Сяна: голова, тулуб і фартух. Кожна будується один раз і кешується.

const cache: Record<string, THREE.BufferGeometry> = {};
const once = (key: string, build: () => THREE.BufferGeometry) => (cache[key] ??= build());

// ── Голова (початок координат — центр голови, обличчя до +Z) ─────────────────────
// М'який округлий овал із повними щоками й заокругленим підборіддям, ніс, вуха,
// неглибокі очні западини і м'які носогубні складки — усе єдиною гладкою поверхнею.
// Основа обличчя без дрібних деталей — по ній же розставляються очі, брови й рот.
const faceBase = (): Sdf => {
  let head = blend(
    0.055,
    ellipsoid([0, 0.014, -0.004], [0.152, 0.166, 0.158]),
    ellipsoid([0, -0.058, 0.014], [0.146, 0.114, 0.138]),
    ellipsoid([0, -0.124, 0.064], [0.058, 0.04, 0.05]),
  );
  // Повні щоки.
  head = add(head, mirror(ellipsoid([0.07, -0.042, 0.09], [0.046, 0.04, 0.046])), 0.05);
  return head;
};

let baseCache: Sdf | null = null;
// Глибина поверхні обличчя (координата z) у точці (x, y) — пошук кореня SDF діленням навпіл.
export const faceZ = (x: number, y: number): number => {
  const base = (baseCache ??= faceBase());
  let lo = 0.02;
  let hi = 0.26;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (base(x, y, mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

const headSdf = (): Sdf => {
  let head = faceBase();
  // Ніс: спинка, округлий кінчик і крила.
  head = add(head, capsule([0, 0.004, 0.14], [0, -0.03, 0.156], 0.012), 0.022);
  head = add(head, ellipsoid([0, -0.035, 0.161], [0.021, 0.017, 0.018]), 0.016);
  head = add(head, mirror(ellipsoid([0.019, -0.041, 0.15], [0.011, 0.0095, 0.0105])), 0.012);
  // Ледь помітні очні западини.
  const socketZ = faceZ(0.057, 0.004);
  head = carve(head, mirror(ellipsoid([0.057, 0.004, socketZ + 0.017], [0.038, 0.022, 0.02])), 0.03);
  // Носогубні складки — неглибокі м'які борозенки від крил носа до кутиків рота.
  const top: [number, number] = [0.032, -0.05];
  const low: [number, number] = [0.055, -0.086];
  head = carve(
    head,
    mirror(capsule([top[0], top[1], faceZ(...top) + 0.0022], [low[0], low[1], faceZ(...low) + 0.0026], 0.004)),
    0.007,
  );
  // Вуха з заглибленням.
  head = add(head, mirror(ellipsoid([0.156, -0.012, -0.004], [0.018, 0.037, 0.027])), 0.012);
  head = carve(head, mirror(ellipsoid([0.174, -0.011, 0.004], [0.011, 0.022, 0.014])), 0.008);
  // Шия.
  head = add(head, capsule([0, -0.13, -0.014], [0, -0.25, -0.018], 0.052), 0.03);
  return head;
};

const skin = new THREE.Color(C.skin);
const rosy = new THREE.Color("#cf7f62");
const paintHead = (x: number, y: number, z: number, out: THREE.Color) => {
  out.copy(skin);
  // Теплий рум'янець на щоках, кінчику носа і вухах.
  const ax = Math.abs(x);
  const cheek = Math.max(0, 1 - Math.hypot(ax - 0.078, y + 0.05, (z - 0.115) * 0.7) / 0.058);
  const nose = Math.max(0, 1 - Math.hypot(x, y + 0.034, z - 0.166) / 0.03);
  const ear = Math.max(0, 1 - Math.hypot(ax - 0.16, y + 0.012, z) / 0.04);
  out.lerp(rosy, Math.min(0.5, cheek * cheek * 0.5 + nose * 0.28 + ear * 0.3));
};

export const headGeometry = () => once("head", () => sculpt(headSdf(), [0, -0.045, 0], 0.26, 120, paintHead));

// ── Тулуб (координати персонажа: ступні на y = 0) ──────────────────────────────
// Кремезний корпус: широка грудна клітка, округлі плечі, легкий живіт.
const torsoSdf = (): Sdf =>
  blend(
    0.08,
    ellipsoid([0, 1.07, 0], [0.212, 0.2, 0.15]),
    ellipsoid([0, 0.91, 0.022], [0.222, 0.19, 0.165]),
    ellipsoid([0, 0.77, 0], [0.21, 0.12, 0.155]),
    mirror(ellipsoid([0.192, 1.2, 0], [0.085, 0.072, 0.086])),
    capsule([0, 1.2, 0], [0, 1.27, 0], 0.072),
  );

export const torsoGeometry = () => once("torso", () => sculpt(torsoSdf(), [0, 0.99, 0], 0.36, 112));

// ── Фартух: нагрудник точно облягає тулуб, спідниця розширюється донизу нижче колін ───
export const APRON = { top: 1.168, waist: 0.866, hem: 0.3 };
const skirtRadius = (y: number) => 0.262 + ((y - APRON.hem) / (APRON.waist - APRON.hem)) * (0.236 - 0.262);

const apronSdf = (): Sdf => {
  const torso = torsoSdf();
  const slab = (lo: number, hi: number): Sdf => (_x, y) => Math.max(lo - y, y - hi);
  // Нагрудник: оболонка тулуба завтовшки ~8 мм, обмежена спереду трапецією.
  const bib: Sdf = (x, y, z) => {
    const shell = torso(x, y, z) - 0.009;
    const halfWidth = 0.118 + (APRON.top - y) * 0.2;
    const mask = Math.max(Math.abs(x) - halfWidth, APRON.waist - 0.02 - y, y - APRON.top, 0.03 - z);
    return Math.max(shell, mask);
  };
  // Спідниця: зрізаний конус з овальним перерізом, відкритий ззаду.
  const cone: Sdf = (x, y, z) => (Math.hypot(x, z / 0.8) - skirtRadius(y)) * 0.85;
  const skirt = clip(clip(cone, slab(APRON.hem, APRON.waist), 0.012), (_x, _y, z) => -0.07 - z, 0.02);
  let apron = add(bib, skirt, 0.012);
  // Горизонтальний шов на талії — тонка борозенка.
  apron = carve(apron, (x, y, z) => Math.hypot(Math.hypot(x, z / 0.8) - skirtRadius(y) - 0.002, y - (APRON.waist - 0.012)) - 0.0045, 0.004);
  return apron;
};

export const apronGeometry = () => once("apron", () => sculpt(apronSdf(), [0, 0.74, 0.02], 0.46, 128));
// Точка на поверхні спідниці фартуха: кут від «прямо вперед» (рад) і висота.
export const onSkirt = (angle: number, y: number): [number, number, number] => [Math.sin(angle) * skirtRadius(y), y, Math.cos(angle) * skirtRadius(y) * 0.8];
