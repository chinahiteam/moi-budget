import { random } from "remotion";
import * as THREE from "three";

export type V3 = [number, number, number];

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// Прогрес 0→1 між кадрами a і b із плавним входом і виходом.
export const ramp = (frame: number, a: number, b: number) => {
  const t = clamp((frame - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Лінійний прогрес 0→1.
export const span = (frame: number, a: number, b: number) => clamp((frame - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);

// Детерміноване «випадкове» число 0..1 — однакове на кожному рендері.
export const rnd = (seed: string | number) => random(`tso-${seed}`);
export const rndRange = (seed: string | number, min: number, max: number) => min + rnd(seed) * (max - min);

const Y = new THREE.Vector3(0, 1, 0);

// Положення й орієнтація циліндра, натягнутого між двома точками.
export const between = (from: V3, to: V3) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const length = Math.max(dir.length(), 1e-5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(Y, dir.normalize());
  const position = a.add(b).multiplyScalar(0.5);
  return { position, quaternion, length };
};

// Двокісткова інверсна кінематика: де має бути лікоть, щоб кисть дотяглася до цілі.
export const solveElbow = (shoulder: V3, hand: V3, upper: number, fore: number, pole: V3): { elbow: V3; hand: V3 } => {
  const s = new THREE.Vector3(...shoulder);
  const target = new THREE.Vector3(...hand);
  const toHand = target.clone().sub(s);
  const reach = upper + fore - 0.004;
  if (toHand.length() > reach) toHand.setLength(reach);
  const d = Math.max(toHand.length(), 0.05);
  const h = s.clone().add(toHand);
  const along = (upper * upper - fore * fore + d * d) / (2 * d);
  const radius = Math.sqrt(Math.max(upper * upper - along * along, 0));
  const axis = toHand.clone().normalize();
  const poleDir = new THREE.Vector3(...pole);
  poleDir.sub(axis.clone().multiplyScalar(poleDir.dot(axis))).normalize();
  const elbow = s.clone().add(axis.multiplyScalar(along)).add(poleDir.multiplyScalar(radius));
  return { elbow: elbow.toArray() as V3, hand: h.toArray() as V3 };
};

export const mixColor = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t));
