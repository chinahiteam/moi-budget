import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";

// «Ліплення» форм через поля відстаней (SDF): прості тіла плавно зливаються одне з одним,
// як пластилін або литий вініл, а не стирчать окремими кулями. Сітку будує алгоритм marching cubes.

export type Sdf = (x: number, y: number, z: number) => number;
type P = [number, number, number];

export const ellipsoid = (c: P, r: P): Sdf => (x, y, z) => {
  const px = (x - c[0]) / r[0];
  const py = (y - c[1]) / r[1];
  const pz = (z - c[2]) / r[2];
  const k0 = Math.sqrt(px * px + py * py + pz * pz);
  if (k0 < 1e-6) return -Math.min(r[0], r[1], r[2]);
  const qx = px / r[0];
  const qy = py / r[1];
  const qz = pz / r[2];
  return (k0 * (k0 - 1)) / Math.sqrt(qx * qx + qy * qy + qz * qz);
};

export const capsule = (a: P, b: P, r: number): Sdf => {
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const bz = b[2] - a[2];
  const bb = bx * bx + by * by + bz * bz;
  return (x, y, z) => {
    const px = x - a[0];
    const py = y - a[1];
    const pz = z - a[2];
    const h = Math.min(1, Math.max(0, (px * bx + py * by + pz * bz) / bb));
    const dx = px - bx * h;
    const dy = py - by * h;
    const dz = pz - bz * h;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
  };
};

// Плавне об'єднання / віднімання / перетин із радіусом згладжування k.
export const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

export const blend = (k: number, ...parts: Sdf[]): Sdf => (x, y, z) => {
  let d = parts[0](x, y, z);
  for (let i = 1; i < parts.length; i++) d = smin(d, parts[i](x, y, z), k);
  return d;
};
export const add = (base: Sdf, part: Sdf, k: number): Sdf => (x, y, z) => smin(base(x, y, z), part(x, y, z), k);
export const carve = (base: Sdf, tool: Sdf, k: number): Sdf => (x, y, z) => smax(base(x, y, z), -tool(x, y, z), k);
export const clip = (base: Sdf, mask: Sdf, k: number): Sdf => (x, y, z) => smax(base(x, y, z), mask(x, y, z), k);
// Дзеркальна симетрія відносно площини x = 0: деталь описуємо один раз для +X.
export const mirror = (sdf: Sdf): Sdf => (x, y, z) => sdf(Math.abs(x), y, z);

export type Paint = (x: number, y: number, z: number, out: THREE.Color) => void;

// Перетворює SDF на сітку з гладкими нормалями і (за бажанням) кольором у вершинах.
export const sculpt = (sdf: Sdf, center: P, halfSize: number, resolution: number, paint?: Paint): THREE.BufferGeometry => {
  const mc = new MarchingCubes(resolution, new THREE.MeshBasicMaterial(), false, false, 260000);
  mc.isolation = 0;
  const n = resolution;
  const half = n / 2;
  let q = 0;
  for (let k = 0; k < n; k++) {
    const z = center[2] + ((k - half) / half) * halfSize;
    for (let j = 0; j < n; j++) {
      const y = center[1] + ((j - half) / half) * halfSize;
      for (let i = 0; i < n; i++) {
        const x = center[0] + ((i - half) / half) * halfSize;
        mc.field[q++] = -sdf(x, y, z);
      }
    }
  }
  mc.update();

  const count = mc.count;
  const src = mc.geometry.getAttribute("position").array as Float32Array;
  const srcN = mc.geometry.getAttribute("normal").array as Float32Array;
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  const color = paint ? new Float32Array(count * 3) : null;
  const tint = new THREE.Color();
  for (let v = 0; v < count; v++) {
    const o = v * 3;
    const x = center[0] + src[o] * halfSize;
    const y = center[1] + src[o + 1] * halfSize;
    const z = center[2] + src[o + 2] * halfSize;
    position[o] = x;
    position[o + 1] = y;
    position[o + 2] = z;
    const len = Math.hypot(srcN[o], srcN[o + 1], srcN[o + 2]) || 1;
    normal[o] = srcN[o] / len;
    normal[o + 1] = srcN[o + 1] / len;
    normal[o + 2] = srcN[o + 2] / len;
    if (paint && color) {
      paint(x, y, z, tint);
      color[o] = tint.r;
      color[o + 1] = tint.g;
      color[o + 2] = tint.b;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  if (color) geometry.setAttribute("color", new THREE.BufferAttribute(color, 3));
  geometry.computeBoundingSphere();
  mc.geometry.dispose();
  return geometry;
};
