import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, M } from "./materials";
import { type V3, between, clamp, lerp, mixColor, rnd } from "./util";

// ── Вок: важка загартована сталь, довга дерев'яна ручка ────────────────────────
export const WOK = { radius: 0.21, depth: 0.1 };
const wokProfile = () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const r = (i / 14) * WOK.radius;
    pts.push(new THREE.Vector2(r, WOK.depth * Math.pow(r / WOK.radius, 2)));
  }
  return pts;
};

// Рівень рідини у воку: диск на висоті h (0..depth) з радіусом за профілем чаші.
const liquidRadius = (h: number) => WOK.radius * Math.sqrt(clamp(h / WOK.depth, 0.001, 1)) * 0.985;

export const Wok: React.FC<{
  position: V3;
  rotation?: V3;
  liquid?: { level: number; color: string | THREE.Color; opacity?: number; roughness?: number };
  children?: React.ReactNode;
}> = ({ position, rotation, liquid, children }) => {
  const m = M();
  const profile = useMemo(wokProfile, []);
  return (
    <group position={position} rotation={rotation}>
      <mesh material={m.wok} castShadow receiveShadow>
        <latheGeometry args={[profile, 40]} />
      </mesh>
      <mesh material={m.steelDark} position={[0, WOK.depth, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[WOK.radius, 0.006, 8, 40]} />
      </mesh>
      {/* Ручка дивиться на кухаря (−Z) */}
      <mesh material={m.steelDark} position={[0, WOK.depth + 0.008, -WOK.radius - 0.035]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
        <cylinderGeometry args={[0.017, 0.02, 0.08, 12]} />
      </mesh>
      <mesh material={m.wood} position={[0, WOK.depth + 0.028, -WOK.radius - 0.18]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow>
        <cylinderGeometry args={[0.019, 0.017, 0.22, 12]} />
      </mesh>
      {liquid && liquid.level > 0.002 ? (
        <mesh position={[0, liquid.level, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[liquidRadius(liquid.level), 40]} />
          <meshPhysicalMaterial
            color={liquid.color}
            roughness={liquid.roughness ?? 0.08}
            transparent
            opacity={liquid.opacity ?? 0.9}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
      ) : null}
      {children}
    </group>
  );
};
// Точка хвату ручки вока в локальних координатах вока.
export const WOK_GRIP: V3 = [0, WOK.depth + 0.03, -WOK.radius - 0.2];

// ── Полум'я пальника: м'які язики вогню (спрайти з адитивним змішуванням), рух — від номера кадру ──
export const Flames: React.FC<{ position: V3; frame: number; power: number; radius?: number; flare?: number }> = ({
  position,
  frame,
  power,
  radius = 0.185,
  flare = 0,
}) => {
  const m = M();
  const count = 18;
  return (
    <group position={position}>
      {/* Тепле сяйво пальника */}
      <sprite position={[0, 0.04, 0]} scale={[0.62 * power, 0.3 * power, 1]}>
        <spriteMaterial map={m.puff} color="#ff6a14" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + 0.17;
        const flick = 0.72 + 0.28 * Math.sin(frame * 0.83 + i * 2.1) * Math.sin(frame * 0.37 + i * 1.3) + 0.14 * Math.sin(frame * 1.9 + i * 0.7);
        // Спалах: язики з дальнього від камери боку злітають над краєм вока.
        const lift = flare * (0.5 + 0.5 * Math.sin(i * 1.3 + frame * 0.55)) * (Math.cos(a) < 0.35 ? 1 : 0.25);
        const h = (0.085 + 0.04 * flick) * power + lift * 0.26;
        const w = (0.05 + 0.014 * flick) * (1 + lift * 0.5);
        const sway = Math.sin(frame * 0.5 + i * 1.7) * 0.012;
        return (
          <React.Fragment key={i}>
            <sprite position={[Math.sin(a) * radius + sway, 0, Math.cos(a) * radius]} center={[0.5, 0.06]} scale={[w, h, 1]}>
              <spriteMaterial map={m.flame} color="#ff8a2c" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
            <sprite position={[Math.sin(a) * radius * 0.96, 0.004, Math.cos(a) * radius * 0.96]} center={[0.5, 0.06]} scale={[w * 0.55, 0.035, 1]}>
              <spriteMaterial map={m.flame} color="#4f8dff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
          </React.Fragment>
        );
      })}
    </group>
  );
};

// ── Пара / дим / хмарка крохмалю: м'які спрайти, що здіймаються й тануть ──────────
export const Puffs: React.FC<{
  position: V3;
  frame: number;
  amount: number; // 0..1
  count?: number;
  spread?: number;
  rise?: number;
  size?: number;
  color?: string;
  seed?: string;
}> = ({ position, frame, amount, count = 9, spread = 0.12, rise = 0.5, size = 0.22, color = "#ffffff", seed = "p" }) => {
  const m = M();
  if (amount <= 0.001) return null;
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => {
        const period = 46 + rnd(`${seed}-per-${i}`) * 30;
        const t = ((frame + rnd(`${seed}-off-${i}`) * period) % period) / period;
        const x = (rnd(`${seed}-x-${i}`) - 0.5) * spread * 2 + Math.sin(t * 4 + i) * 0.03;
        const z = (rnd(`${seed}-z-${i}`) - 0.5) * spread * 2;
        const s = size * (0.5 + t * 1.3);
        return (
          <sprite key={i} position={[x, t * rise, z]} scale={[s, s, s]}>
            <spriteMaterial map={m.puff} color={color} transparent opacity={amount * 0.34 * Math.sin(Math.PI * t)} depthWrite={false} />
          </sprite>
        );
      })}
    </group>
  );
};

// ── Шматочок курки: стан задає колір і блиск ───────────────────────────────────
export type PieceLook = { color: string | THREE.Color; roughness: number; gloss: number };
export const LOOK = {
  raw: { color: C.raw, roughness: 0.45, gloss: 0.3 },
  marinated: { color: C.marinated, roughness: 0.4, gloss: 0.5 },
  starch: { color: C.starch, roughness: 0.95, gloss: 0 },
  fried: { color: C.fried, roughness: 0.82, gloss: 0.06 },
  glazed: { color: C.glaze, roughness: 0.34, gloss: 0.9 },
} satisfies Record<string, PieceLook>;

export const mixLook = (a: PieceLook, b: PieceLook, t: number): PieceLook => ({
  color: mixColor(a.color as string, b.color as string, t),
  roughness: lerp(a.roughness, b.roughness, clamp(t)),
  gloss: lerp(a.gloss, b.gloss, clamp(t)),
});

// Нерівний шматочок курки: ікосфера з детермінованим зміщенням вершин (великі горби + дрібна «крихта») — три варіанти форми.
const nuggets: THREE.BufferGeometry[] = [];
const nugget = (variant: number) => {
  if (!nuggets[variant]) {
    const g = mergeVertices(new THREE.IcosahedronGeometry(1, 4));
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const k = variant * 3.1;
      const bump =
        0.2 * Math.sin(v.x * 2.6 + k) * Math.cos(v.y * 2.3 + k * 0.7) +
        0.14 * Math.sin(v.z * 3.7 + k * 1.3) * Math.sin(v.y * 3.1 + k) +
        0.07 * Math.sin((v.x + v.z) * 6.3 + k) * Math.cos(v.y * 5.7) +
        0.035 * Math.sin(v.x * 13 + k) * Math.sin(v.y * 12 + 1.7) * Math.sin(v.z * 11);
      v.multiplyScalar(1 + bump);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    nuggets[variant] = g;
  }
  return nuggets[variant];
};

export const Piece: React.FC<{ at: V3; look: PieceLook; seed: number | string; size?: number; spin?: number; cube?: boolean }> = ({
  at,
  look,
  seed,
  size = 0.03,
  spin = 0,
  cube = false,
}) => {
  const sx = 0.9 + rnd(`sx${seed}`) * 0.4;
  const sy = 0.7 + rnd(`sy${seed}`) * 0.3;
  const sz = 0.85 + rnd(`sz${seed}`) * 0.4;
  // Кубики сирого стегна лежать рівно; обсмажені шматочки — кожен під своїм кутом.
  const r0 = cube ? 0 : rnd(`r${seed}`) * Math.PI * 2;
  return (
    <mesh
      position={at}
      rotation={[r0 + spin, r0 * 1.7 + spin * 0.6, r0 * 0.4 + spin * 0.8]}
      scale={cube ? [size, size, size] : [size * sx, size * sy, size * sz]}
      geometry={cube ? undefined : nugget(Math.floor(rnd(`v${seed}`) * 3))}
      castShadow
    >
      {cube ? <boxGeometry args={[1.5, 1.5, 1.5]} /> : null}
      <meshPhysicalMaterial
        color={look.color}
        roughness={look.roughness}
        clearcoat={look.gloss}
        clearcoatRoughness={0.22}
        bumpMap={cube ? null : M().crust}
        bumpScale={cube ? 0 : 1.6}
      />
    </mesh>
  );
};

// Тонкий струмінь рідини між двома точками.
export const Stream: React.FC<{ from: V3; to: V3; radius: number; color: string; opacity?: number }> = ({ from, to, radius, color, opacity = 1 }) => {
  const { position, quaternion, length } = between(from, to);
  return (
    <mesh position={position} quaternion={quaternion} scale={[1, length, 1]}>
      <cylinderGeometry args={[radius * 0.7, radius, 1, 10]} />
      <meshPhysicalMaterial color={color} roughness={0.08} clearcoat={1} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

// ── Китайський тесак ─────────────────────────────────────────────────────────
export const Cleaver: React.FC<{ position: V3; rotation?: V3 }> = ({ position, rotation }) => {
  const m = M();
  return (
    <group position={position} rotation={rotation}>
      <mesh material={m.steel} position={[0, 0.045, 0.02]} castShadow>
        <boxGeometry args={[0.004, 0.09, 0.2]} />
      </mesh>
      <mesh material={m.wood} position={[0, 0.07, -0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.017, 0.12, 12]} />
      </mesh>
    </group>
  );
};
export const CLEAVER_GRIP: V3 = [0, 0.07, -0.15];

// ── Шумівка-павутинка ────────────────────────────────────────────────────────
export const Skimmer: React.FC<{ position: V3; rotation?: V3; children?: React.ReactNode }> = ({ position, rotation, children }) => {
  const m = M();
  return (
    <group position={position} rotation={rotation}>
      {[0.085, 0.058, 0.03].map((r, i) => (
        <mesh key={r} material={m.steel} position={[0, -i * 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, i === 0 ? 0.0045 : 0.002, 6, 28]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} material={m.steel} position={[0, -0.016, 0]} rotation={[0, (i / 8) * Math.PI, Math.PI / 2 - 0.0]}>
          <cylinderGeometry args={[0.0016, 0.0016, 0.166, 5]} />
        </mesh>
      ))}
      <mesh material={m.bamboo} position={[0, 0.03, -0.22]} rotation={[Math.PI / 2 - 0.22, 0, 0]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.3, 10]} />
      </mesh>
      {children}
    </group>
  );
};
export const SKIMMER_GRIP: V3 = [0, 0.06, -0.33];

// ── Миска, лоток, дошка, тарілка ─────────────────────────────────────────────
export const Bowl: React.FC<{ position: V3; children?: React.ReactNode }> = ({ position, children }) => {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.15, 32, 16, 0, Math.PI * 2, Math.PI * 0.56, Math.PI * 0.44]} />
        <meshStandardMaterial color={C.steel} roughness={0.3} metalness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {children}
    </group>
  );
};

export const Tray: React.FC<{ position: V3; children?: React.ReactNode }> = ({ position, children }) => {
  const m = M();
  const w = 0.42;
  const d = 0.3;
  return (
    <group position={position}>
      <mesh material={m.steel} position={[0, 0.004, 0]} receiveShadow>
        <boxGeometry args={[w, 0.008, d]} />
      </mesh>
      {[
        [0, d / 2, w, 0.012],
        [0, -d / 2, w, 0.012],
        [w / 2, 0, 0.012, d],
        [-w / 2, 0, 0.012, d],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} material={m.steel} position={[x, 0.022, z]} castShadow>
          <boxGeometry args={[sx, 0.044, sz]} />
        </mesh>
      ))}
      {children}
    </group>
  );
};

export const Plate: React.FC<{ position: V3; rotation?: V3; children?: React.ReactNode }> = ({ position, rotation, children }) => {
  const m = M();
  const profile = useMemo(
    () => [
      [0, 0],
      [0.09, 0],
      [0.13, 0.012],
      [0.16, 0.026],
      [0.162, 0.03],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[profile, 40]} />
        <meshPhysicalMaterial color={m.plate.color} roughness={0.32} clearcoat={0.6} side={THREE.DoubleSide} />
      </mesh>
      {children}
    </group>
  );
};
