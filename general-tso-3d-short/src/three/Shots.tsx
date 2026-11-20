import React from "react";
import { Chef } from "./Chef";
import { Kitchen, PrepTable, STATION, SqueezeBottle, TABLE_TOP } from "./Kitchen";
import { C, M } from "./materials";
import { Bowl, CLEAVER_GRIP, Cleaver, Flames, LOOK, Piece, Plate, Puffs, SKIMMER_GRIP, Skimmer, Stream, Tray, WOK, WOK_GRIP, Wok, mixLook } from "./Props";
import { Post } from "./Post";
import { Cam, KitchenLights } from "./Stage";
import { type V3, clamp, easeIn, lerp, lerp3, ramp, rnd, rndRange, span } from "./util";

// Усі сім планів ролика. Кожен план — чиста функція від локального номера кадру `f`:
// жодних таймерів і useFrame, тому рендер детермінований і кадр у кадр збігається з озвучкою.

type ShotProps = { f: number };

const WOK_Y = STATION.top + 0.035; // дно вока над пальником
const WOK_POS: V3 = [0, WOK_Y, STATION.z];
const BURNER: V3 = [0, STATION.top + 0.03, STATION.z];
const deg = (d: number) => (d * Math.PI) / 180;

// Камера на орбіті навколо цілі: азимут (0° — спереду, від'ємний — зліва в кадрі), дистанція, висота.
const orbit = (target: V3, azimuth: number, distance: number, height: number): V3 => [
  target[0] + Math.sin(deg(azimuth)) * distance,
  height,
  target[2] + Math.cos(deg(azimuth)) * distance,
];

// Точка у світі для локальної точки предмета, нахиленого навколо осі X (вок) або Z (тесак).
const tiltX = (origin: V3, p: V3, a: number): V3 => [origin[0] + p[0], origin[1] + p[1] * Math.cos(a) - p[2] * Math.sin(a), origin[2] + p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const tiltZ = (origin: V3, p: V3, a: number): V3 => [origin[0] + p[0] * Math.cos(a) - p[1] * Math.sin(a), origin[1] + p[0] * Math.sin(a) + p[1] * Math.cos(a), origin[2] + p[2]];

// Місце шматочка на дні вока.
const inWok = (i: number, spread = 0.115, seed = "w"): V3 => {
  const r = Math.sqrt(rnd(`${seed}r${i}`)) * spread;
  const a = rnd(`${seed}a${i}`) * Math.PI * 2;
  return [Math.cos(a) * r, WOK.depth * Math.pow(r / WOK.radius, 2) + 0.022, Math.sin(a) * r];
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// Підкидання у воку: шматочок злітає по параболі й повертається.
const tossArc = (i: number, u: number, height: number, seed: string): V3 => {
  const h = height * rndRange(`${seed}h${i}`, 0.7, 1.15);
  return [rndRange(`${seed}x${i}`, -0.05, 0.05) * Math.sin(Math.PI * u), h * 4 * u * (1 - u), -0.06 * Math.sin(Math.PI * u)];
};

// ─────────────────────────────────────────────────────────────────────────────
// Сцена 1 · Хук: наїзд камери, підкидання золотистої курки над вогнем, усмішка й підморгування
// ─────────────────────────────────────────────────────────────────────────────
export const Shot01: React.FC<ShotProps> = ({ f }) => {
  const push = ramp(f, 5, 40);
  const jerk = Math.sin(span(f, 20, 36) * Math.PI);
  const tilt = -0.3 * jerk;
  const wokPos: V3 = [0, WOK_Y + 0.07 * jerk, STATION.z - 0.06 * jerk];
  const turn = ramp(f, 36, 54);
  const wink = Math.sin(span(f, 64, 80) * Math.PI);

  const target = lerp3([0, 0.83, 0.3], [0, 1.28, 0.42], push);
  const cam = orbit(target, lerp(-62, -12, push), lerp(7.6, 2.15, push) - 0.14 * span(f, 40, 90), lerp(1.05, 1.24, push));

  return (
    <>
      <Cam position={cam} look={target} fov={lerp(34, 40, push)} />
      <Post focus={lerp3([0, 1, 0.3], [0, 1.38, 0.3], push)} blur={lerp(0.5, 1, push)} bloom={1.2} />
      <KitchenLights target={[0, 1, 0.4]} flame={1.1 + jerk * 1.6 + 0.2 * Math.sin(f * 1.3)} flameAt={[0, WOK_Y + 0.25, STATION.z]} />
      <Kitchen />
      <Flames position={BURNER} frame={f} power={1.1 + jerk * 0.5} flare={Math.sin(span(f, 22, 62) * Math.PI) * 0.9} />
      <Wok position={wokPos} rotation={[tilt, 0, 0]} />
      {Array.from({ length: 13 }).map((_, i) => {
        // Слоу-мо: шматочки довго «висять» у повітрі над язиками полум'я.
        const u = span(f, 24 + rnd(`d${i}`) * 5, 80 + rnd(`d${i}`) * 5);
        const base = add(wokPos, inWok(i, 0.11, "s1"));
        return <Piece key={i} at={add(base, tossArc(i, u, 0.25, "s1"))} look={LOOK.fried} seed={`s1-${i}`} spin={u * 5} />;
      })}
      <Puffs position={[0, WOK_Y + 0.12, STATION.z]} frame={f} amount={0.55} seed="s1" />
      <Chef
        pose={{
          lean: lerp(0.14, 0.06, turn),
          handL: tiltX(wokPos, WOK_GRIP, tilt),
          gripL: 1,
          handR: [-0.31, STATION.top + 0.04, 0.3],
          gripR: 0.3,
          headPitch: lerp(0.34, 0.03, turn),
          headYaw: lerp(0, -0.2, turn),
          headRoll: 0.06 * wink,
          smile: lerp(0.25, 1, turn),
          eyeR: 1 - wink,
          browRaise: wink,
        }}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Сцена 2а · Вид зверху: нарізка курячого стегна китайським тесаком
// ─────────────────────────────────────────────────────────────────────────────
const BOARD_TOP = TABLE_TOP + 0.022;
const PREP_Z = 0.56;

export const Shot02a: React.FC<ShotProps> = ({ f }) => {
  const m = M();
  const cols = 5;
  const step = 0.037;
  const hits = [8, 19, 30, 41];
  // Лінії розрізів ідуть від правої руки кухаря (−X) до лівої.
  const cutX = (k: number) => -step * 1.5 + k * step;
  const k = clamp(Math.floor((f - hits[0] + 7) / 11), 0, hits.length - 1);
  const phase = f - hits[k];
  const done = f > hits[hits.length - 1] + 5;
  const raise = done ? ramp(f, 46, 56) : phase < 0 ? Math.pow(clamp(-phase / 7), 1.6) : clamp(phase / 5);
  const x = done ? lerp(cutX(3), -0.19, ramp(f, 46, 58)) : phase > 0 && k < hits.length - 1 ? lerp(cutX(k), cutX(k + 1), ramp(phase, 1, 5)) : cutX(k);
  const lean = 0.5 * raise;
  const cleaverPos: V3 = [x, BOARD_TOP + 0.002 + raise * 0.11, PREP_Z];

  return (
    <>
      <Cam position={[0, lerp(2.75, 2.58, ramp(f, 0, 60)), PREP_Z + 0.02]} look={[0, TABLE_TOP, PREP_Z + 0.02]} up={[0, 0, 1]} fov={30} />
      <Post focus={[0, BOARD_TOP, PREP_Z]} blur={0.5} />
      <KitchenLights target={[0, 0.9, 0.5]} />
      {/* Вид зверху: стеля, витяжка і повітропровід приховані, щоб не затуляти камеру */}
      <Kitchen station={false} ceiling={false} />
      <PrepTable />
      <mesh material={m.board} position={[0, TABLE_TOP + 0.011, PREP_Z]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.022, 0.34]} />
      </mesh>
      {Array.from({ length: cols * 2 }).map((_, i) => {
        const c = i % cols; // 0 — найправіший від кухаря
        const row = i < cols ? -1 : 1;
        // Після кожного удару відрізаний ряд відсувається, шматочки трохи розвертаються.
        const cuts = hits.reduce((sum, h, j) => sum + (j >= c ? ramp(f, h, h + 4) : 0), 0);
        const free = c < cols - 1 ? ramp(f, hits[c], hits[c] + 5) : ramp(f, hits[3], hits[3] + 5);
        return (
          <Piece
            key={i}
            cube
            at={[-step * 2 + c * step - cuts * 0.012, BOARD_TOP + 0.017, PREP_Z + row * (0.019 + free * 0.006)]}
            look={LOOK.raw}
            seed={`thigh${i}`}
            size={0.0225}
            spin={free * rndRange(`ts${i}`, -0.14, 0.14)}
          />
        );
      })}
      <Cleaver position={cleaverPos} rotation={[0, 0, lean]} />
      <Chef
        pose={{
          lean: 0.24,
          headPitch: 0.5,
          handR: tiltZ(cleaverPos, CLEAVER_GRIP, lean),
          gripR: 1,
          handL: [0.1 - 0.02 * ramp(f, 30, 45), BOARD_TOP + 0.045, PREP_Z + 0.005],
          gripL: 0.75,
          smile: 0.2,
        }}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Сцена 2б · 45°: кубики летять у миску, зверху ллється соєвий соус
// ─────────────────────────────────────────────────────────────────────────────
export const Shot02b: React.FC<ShotProps> = ({ f }) => {
  const bowl: V3 = [0, TABLE_TOP + 0.15, PREP_Z];
  const bottom = TABLE_TOP + 0.012;
  const pour = span(f, 16, 21) * (1 - span(f, 44, 49));
  const nozzle: V3 = [0.012, 1.165, PREP_Z];
  const mixing = ramp(f, 44, 52);
  const cleaverPos: V3 = [-0.17, 1.1, PREP_Z];
  const push = ramp(f, 0, 60);

  return (
    <>
      <Cam position={[0.32, lerp(1.82, 1.74, push), lerp(1.7, 1.56, push)]} look={[0, 0.94, 0.46]} fov={30} />
      <Post focus={[0, 1.0, PREP_Z]} />
      <KitchenLights target={[0, 0.95, 0.5]} />
      <Kitchen station={false} />
      <PrepTable />
      <Bowl position={bowl}>
        {/* Темна глянцева калюжка соєвого соусу на дні */}
        <mesh position={[0, -0.15 + 0.02 + 0.012 * ramp(f, 20, 46), 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.005 + 0.1 * ramp(f, 19, 46), 28]} />
          <meshPhysicalMaterial color={C.soy} roughness={0.06} clearcoat={1} />
        </mesh>
      </Bowl>
      {Array.from({ length: 10 }).map((_, i) => {
        const t = span(f, 1 + i * 1.6, 13 + i * 1.6);
        const r = Math.sqrt(rnd(`b${i}`)) * 0.075;
        const a = rnd(`ba${i}`) * Math.PI * 2;
        const rest: V3 = [Math.cos(a) * r, bottom + 0.03 + r * 0.25 + rnd(`by${i}`) * 0.02, PREP_Z + Math.sin(a) * r];
        const start: V3 = [-0.19 + rnd(`bs${i}`) * 0.05, 1.13, PREP_Z + rndRange(`bz${i}`, -0.05, 0.05)];
        const p = lerp3(start, rest, easeIn(t) * 0.6 + t * 0.4);
        const stir = mixing * Math.sin(f * 0.9 + i) * 0.012;
        return (
          <Piece
            key={i}
            cube
            at={[p[0] + stir, p[1] + Math.sin(Math.PI * t) * 0.05, p[2] + stir * 0.6]}
            look={mixLook(LOOK.raw, LOOK.marinated, span(f, 22 + i, 46 + i))}
            seed={`bowl${i}`}
            size={0.0225}
            spin={t * 3 + stir * 8}
          />
        );
      })}
      <Cleaver position={cleaverPos} rotation={[0, 0, -1.15 + 0.25 * ramp(f, 0, 14)]} />
      <SqueezeBottle at={[0.145, 1.225, PREP_Z]} color="#3a1c10" rotation={[0, 0, lerp(0.6, 2.0, ramp(f, 8, 17)) - 1.2 * ramp(f, 48, 58)]} />
      {pour > 0.02 ? <Stream from={nozzle} to={[0.004, lerp(nozzle[1], bottom + 0.03, pour), PREP_Z]} radius={0.0055} color={C.soy} /> : null}
      <Chef
        pose={{
          lean: 0.2,
          headPitch: 0.42,
          handR: [-0.2, 1.17, PREP_Z - 0.15],
          gripR: 1,
          handL: [0.2, 1.24, PREP_Z - 0.01],
          gripL: 0.9,
          smile: 0.25,
        }}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Сцена 2в · 45°: обвалювання в кукурудзяному крохмалі, задоволений кивок
// ─────────────────────────────────────────────────────────────────────────────
export const Shot02c: React.FC<ShotProps> = ({ f }) => {
  const m = M();
  const tray: V3 = [0, TABLE_TOP, PREP_Z];
  const look = ramp(f, 56, 72);
  const nod = Math.sin(span(f, 70, 86) * Math.PI * 2) * 0.09;
  const hand: V3 = lerp3([-0.02 + Math.sin(f * 0.28) * 0.09, 1.2, PREP_Z + 0.02], [-0.13, 1.27, 0.4], look);
  const toss = ramp(f, 36, 44) * (1 - ramp(f, 52, 60));

  return (
    <>
      <Cam position={lerp3([-0.3, 1.74, 1.74], [-0.3, 1.5, 2.12], look)} look={lerp3([0, 0.95, 0.5], [0, 1.365, 0.1], look)} fov={30} />
      <Post focus={lerp3([0, TABLE_TOP + 0.04, PREP_Z], [0, 1.42, 0.2], look)} />
      <KitchenLights target={[0, 0.95, 0.5]} />
      <Kitchen station={false} />
      <PrepTable />
      <Tray position={tray} />
      {Array.from({ length: 13 }).map((_, i) => {
        const x = -0.15 + (i % 5) * 0.075 + rndRange(`tx${i}`, -0.014, 0.014);
        const z = PREP_Z - 0.085 + Math.floor(i / 5) * 0.085 + rndRange(`tz${i}`, -0.014, 0.014);
        const hop = toss * Math.abs(Math.sin(f * 0.7 + i * 1.9)) * 0.035;
        return (
          <Piece
            key={i}
            cube
            at={[x, TABLE_TOP + 0.03 + hop, z]}
            look={mixLook(LOOK.marinated, LOOK.starch, span(f, 10 + i * 1.5, 36 + i * 1.5))}
            seed={`tray${i}`}
            size={0.0225}
            spin={hop * 30}
          />
        );
      })}
      {/* Крохмаль сиплеться з руки дрібними частинками */}
      {Array.from({ length: 90 }).map((_, i) => {
        const born = 3 + rnd(`cb${i}`) * 44;
        const t = (f - born) / 13;
        if (t < 0 || t > 1) return null;
        const x0 = -0.02 + Math.sin(born * 0.28) * 0.09;
        return (
          <mesh
            key={i}
            material={m.white}
            position={[x0 + rndRange(`cx${i}`, -0.07, 0.07) * t, lerp(1.17, TABLE_TOP + 0.04, t * t), PREP_Z + 0.02 + rndRange(`cz${i}`, -0.07, 0.07) * t]}
          >
            <sphereGeometry args={[0.0042, 6, 5]} />
          </mesh>
        );
      })}
      {/* Шеф показує ідеально обваляний шматочок */}
      {look > 0.02 ? <Piece cube at={[hand[0] + 0.012, hand[1] + 0.055, hand[2] + 0.03]} look={LOOK.starch} seed="show" size={0.024} spin={0.3} /> : null}
      <Puffs position={[0, TABLE_TOP + 0.05, PREP_Z]} frame={f} amount={span(f, 6, 16) * (1 - span(f, 52, 78)) * 1.4} spread={0.16} rise={0.28} size={0.2} seed="starch" />
      <Chef
        pose={{
          lean: lerp(0.22, 0.1, look),
          headPitch: lerp(0.44, 0.06, look) + nod,
          headYaw: lerp(0, -0.12, look),
          handR: hand,
          gripR: lerp(0.25, 0.7, look),
          handL: [0.215, TABLE_TOP + 0.07, PREP_Z - 0.1],
          gripL: 0.8,
          smile: lerp(0.25, 0.85, look),
        }}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Сцена 3 · Смаження: макро киплячої олії, золотиста скоринка, шумівка-павутинка
// ─────────────────────────────────────────────────────────────────────────────
export const Shot03: React.FC<ShotProps> = ({ f }) => {
  const level = 0.068;
  const surface = WOK_Y + level;
  const count = 9;
  const reveal = ramp(f, 142, 186);
  const dip = ramp(f, 128, 148);
  const lift = ramp(f, 150, 184);
  const scoop = ramp(f, 146, 158);
  const skimmer: V3 = [
    lerp(-0.3, -0.02, dip) + lerp(0, -0.16, lift),
    lerp(1.5, surface - 0.012, dip) + lerp(0, 0.2, lift),
    lerp(0.56, STATION.z, dip) + lerp(0, -0.02, lift),
  ];

  const macroCam: V3 = [0.15 - 0.03 * span(f, 0, 140), surface + 0.15, STATION.z + 0.44 - 0.07 * span(f, 0, 140)];
  const cam = lerp3(macroCam, [0.1, 1.3, 2.25], reveal);
  const target = lerp3([0, surface - 0.012, STATION.z], [-0.02, 1.33 + 0.12 * (1 - ramp(f, 166, 190)), 0.32], reveal);

  return (
    <>
      <Cam position={cam} look={target} fov={lerp(30, 34, reveal)} />
      <Post focus={lerp3([0, surface, STATION.z], [0, 1.42, 0.25], reveal)} blur={lerp(1.3, 1, reveal)} bloom={1.2} />
      <KitchenLights target={[0, 1, 0.4]} flame={0.9} flameAt={[0, WOK_Y + 0.02, STATION.z + 0.25]} />
      <Kitchen />
      <Flames position={BURNER} frame={f} power={0.75} />
      <Wok position={WOK_POS} liquid={{ level, color: C.oil, opacity: 0.86, roughness: 0.05 }} />
      {Array.from({ length: count }).map((_, i) => {
        const enter = 3 + i * 6.5;
        const drop = span(f, enter, enter + 9);
        const a = (i / count) * Math.PI * 2 + 0.4;
        const r = 0.035 + (i % 3) * 0.038;
        const px = Math.cos(a) * r;
        const pz = STATION.z + Math.sin(a) * r;
        const bob = Math.sin(f * 0.35 + i * 1.7) * 0.003;
        const frying: V3 = [px, lerp(surface + 0.26, surface - 0.006, easeIn(drop)) + (drop >= 1 ? bob : 0), pz];
        // У шумівці шматочки лежать гіркою.
        const piled: V3 = [skimmer[0] + Math.cos(a) * 0.04 * ((i % 3) / 2 + 0.3), skimmer[1] + 0.012 + (i % 3) * 0.02, skimmer[2] + Math.sin(a) * 0.04 * ((i % 3) / 2 + 0.3)];
        const sizzle = drop >= 1 ? clamp(1 - (f - enter - 9) / 150, 0.35, 1) * (1 - scoop) : 0;
        return (
          <React.Fragment key={i}>
            <Piece at={lerp3(frying, piled, scoop)} look={mixLook(LOOK.starch, LOOK.fried, span(f, enter + 8, enter + 78))} seed={`fry${i}`} size={0.031} spin={drop * 2} />
            {/* Вінець дрібних бульбашок навколо кожного шматочка */}
            {sizzle > 0
              ? Array.from({ length: 9 }).map((__, j) => {
                  const period = 7 + rnd(`bp${i}-${j}`) * 7;
                  const t = ((f + rnd(`bo${i}-${j}`) * period) % period) / period;
                  const ba = rnd(`ba${i}-${j}`) * Math.PI * 2 + Math.floor((f + rnd(`bo${i}-${j}`) * period) / period);
                  const br = 0.03 + rnd(`br${i}-${j}`) * 0.022;
                  const s = (0.004 + 0.007 * t) * sizzle;
                  return (
                    <mesh key={j} position={[px + Math.cos(ba) * br, surface + 0.002 + t * 0.004, pz + Math.sin(ba) * br]} scale={[s, s * 0.7, s]}>
                      <sphereGeometry args={[1, 8, 6]} />
                      <meshBasicMaterial color="#fff2c2" transparent opacity={0.8 * (1 - t * t)} depthWrite={false} />
                    </mesh>
                  );
                })
              : null}
          </React.Fragment>
        );
      })}
      {/* Краплі олії стікають із шумівки */}
      {Array.from({ length: 7 }).map((_, i) => {
        const t = ((f - 152 - i * 5) % 16) / 16;
        if (f < 152 + i * 5 || f > 200 || t < 0) return null;
        return (
          <mesh key={i} position={[skimmer[0] + rndRange(`dx${i}`, -0.05, 0.05), skimmer[1] - 0.02 - t * t * 0.22, skimmer[2] + rndRange(`dz${i}`, -0.05, 0.05)]} scale={[1, 1.8, 1]}>
            <sphereGeometry args={[0.0045, 8, 6]} />
            <meshPhysicalMaterial color={C.oil} roughness={0.05} clearcoat={1} />
          </mesh>
        );
      })}
      <Skimmer position={skimmer} />
      <Puffs position={[0, surface + 0.03, STATION.z]} frame={f} amount={0.5} seed="fry" />
      <Chef
        pose={{
          lean: lerp(0.16, 0.06, reveal),
          handL: add(WOK_POS, WOK_GRIP),
          gripL: 1,
          handR: add(skimmer, SKIMMER_GRIP),
          gripR: 1,
          headPitch: lerp(0.36, 0.08, reveal),
          headYaw: lerp(0, 0.1, reveal) - 0.14 * ramp(f, 186, 204),
          smile: lerp(0.2, 0.9, ramp(f, 160, 190)),
        }}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Сцена 4 · Глазурування: часник, імбир, чилі, соус → рубінова глазур → підкидання курки
// ─────────────────────────────────────────────────────────────────────────────
export const Shot04: React.FC<ShotProps> = ({ f }) => {
  const m = M();
  // Кухар нахиляє вок до камери, щоб було видно соус; далі два підкидання, друге — у слоу-мо зі спалахом.
  const show = ramp(f, 50, 70) * (1 - ramp(f, 150, 168));
  const toss1 = span(f, 168, 196);
  const toss2 = span(f, 198, 240);
  const jerk = Math.sin(toss1 * Math.PI) * (toss1 < 0.35 ? 1 : 0.4) + Math.sin(span(f, 198, 214) * Math.PI);
  const tilt = 0.2 * show - 0.3 * clamp(jerk);
  const wokPos: V3 = [0, WOK_Y + 0.02 * show + 0.07 * clamp(jerk), STATION.z - 0.05 * clamp(jerk)];

  const sauce = ramp(f, 68, 118);
  const ruby = ramp(f, 112, 156);
  const glazeMix = span(f, 162, 200);
  const soy = span(f, 64, 69) * (1 - span(f, 100, 105));
  const vinegar = span(f, 106, 110) * (1 - span(f, 124, 128));
  const hand: V3 =
    f < 46
      ? [-0.27, 1.2 + 0.05 * Math.sin(span(f, 2, 22) * Math.PI), 0.5]
      : f < 150
        ? lerp3([-0.27, 1.2, 0.5], [-0.3, 1.27, STATION.z + 0.03], ramp(f, 46, 62))
        : lerp3([-0.3, 1.27, STATION.z + 0.03], [-0.3, STATION.top + 0.04, 0.3], ramp(f, 162, 176));
  const nozzle: V3 = [hand[0] + 0.115, hand[1] - 0.085, hand[2] + 0.02];
  const sauceTop: V3 = [nozzle[0] * 0.55, WOK_Y + 0.03, STATION.z];

  const orbitT = ramp(f, 0, 240);
  const target: V3 = [0, 1.275, 0.5];
  const cam = orbit(target, lerp(-31, -15, orbitT), lerp(1.52, 1.42, orbitT), 1.2);

  return (
    <>
      <Cam position={cam} look={target} fov={40} />
      <Post focus={[0, 1.22, 0.42]} bloom={1.4} />
      <KitchenLights target={[0, 1, 0.4]} flame={1.2 + clamp(jerk) * 2.2 + 0.25 * Math.sin(f * 1.1)} flameAt={[0, WOK_Y + 0.3, STATION.z - 0.1]} />
      <Kitchen />
      <Flames position={BURNER} frame={f} power={1.15 + clamp(jerk) * 0.5} flare={Math.sin(span(f, 200, 236) * Math.PI) * 1.0 + Math.sin(span(f, 170, 188) * Math.PI) * 0.45} />
      <Wok
        position={wokPos}
        rotation={[tilt, 0, 0]}
        liquid={{ level: 0.004 + 0.03 * sauce * (1 - 0.45 * ruby), color: mixLook(LOOK.marinated, LOOK.glazed, ruby).color, opacity: 0.96, roughness: 0.05 }}
      >
        {/* Бульбашки киплячого соусу */}
        {sauce > 0.2
          ? Array.from({ length: 16 }).map((_, i) => {
              const period = 8 + rnd(`sp${i}`) * 8;
              const t = ((f + rnd(`so${i}`) * period) % period) / period;
              const r = Math.sqrt(rnd(`sr${i}`)) * 0.1;
              const a = rnd(`sa${i}`) * Math.PI * 2;
              const s = (0.006 + 0.012 * t) * (1 - 0.5 * glazeMix);
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.03 + 0.004 * t, Math.sin(a) * r]} scale={[s, s * 0.6, s]}>
                  <sphereGeometry args={[1, 8, 6]} />
                  <meshPhysicalMaterial color={mixLook(LOOK.marinated, LOOK.glazed, ruby).color} roughness={0.05} clearcoat={1} transparent opacity={1 - t * t} />
                </mesh>
              );
            })
          : null}
      </Wok>

      {/* Часник, імбир і сушений чилі летять у розпечений вок */}
      {Array.from({ length: 21 }).map((_, i) => {
        const kind = i % 3; // 0 — часник, 1 — імбир, 2 — чилі
        const t = span(f, 6 + i * 1.3, 24 + i * 1.3);
        const rest = add(wokPos, inWok(i, 0.1, "aro"));
        const start: V3 = [-0.25 + rnd(`as${i}`) * 0.05, 1.24, 0.52];
        const p = lerp3(start, rest, t);
        const u = Math.max(toss1 > 0 && toss1 < 1 ? toss1 : 0, toss2 > 0 && toss2 < 1 ? toss2 : 0);
        const fly = u > 0 ? tossArc(i, u, 0.13, "aro") : ([0, 0, 0] as V3);
        const hide = ruby > 0.9 && u === 0 && kind !== 2;
        if (hide) return null;
        return (
          <mesh
            key={i}
            position={[p[0] + fly[0], p[1] + Math.sin(Math.PI * t) * 0.12 + fly[1], p[2] + fly[2]]}
            rotation={[i, i * 2 + t * 5 + u * 6, i * 3]}
            scale={kind === 2 ? [0.007, 0.007, 0.03] : [0.009, 0.006, 0.009]}
            castShadow
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshPhysicalMaterial color={kind === 0 ? C.garlic : kind === 1 ? C.ginger : C.chili} roughness={kind === 2 ? 0.3 : 0.6} clearcoat={kind === 2 ? 0.8 : 0} />
          </mesh>
        );
      })}

      {/* Соєвий соус, рисовий оцет і цукор */}
      {f > 44 && f < 162 ? <SqueezeBottle at={[hand[0] + 0.01, hand[1], hand[2] + 0.02]} color={f < 106 ? "#3a1c10" : "#e9e2c8"} rotation={[0, 0, -2.0 * ramp(f, 56, 66) + 0.5 * ramp(f, 100, 106) - 0.5 * ramp(f, 104, 110) + 2.0 * ramp(f, 128, 138)]} /> : null}
      {soy > 0.02 ? <Stream from={nozzle} to={lerp3(nozzle, sauceTop, soy)} radius={0.006} color={C.soy} /> : null}
      {vinegar > 0.02 ? <Stream from={nozzle} to={lerp3(nozzle, sauceTop, vinegar)} radius={0.004} color="#f3ecd2" opacity={0.75} /> : null}
      {Array.from({ length: 40 }).map((_, i) => {
        const born = 128 + rnd(`sg${i}`) * 16;
        const t = (f - born) / 10;
        if (t < 0 || t > 1) return null;
        return (
          <mesh key={i} material={m.white} position={[lerp(hand[0] + 0.06, rndRange(`gx${i}`, -0.06, 0.06), t), lerp(hand[1] - 0.05, WOK_Y + 0.04, t * t), STATION.z + rndRange(`gz${i}`, -0.05, 0.05) * t]}>
            <sphereGeometry args={[0.0035, 5, 4]} />
          </mesh>
        );
      })}

      {/* Хрустка курка повертається у вок і вкривається рубіновою глазур'ю */}
      {Array.from({ length: 13 }).map((_, i) => {
        const arrive = span(f, 150 + i * 1.2, 164 + i * 1.2);
        if (arrive <= 0) return null;
        const u1 = span(f, 168 + rnd(`q${i}`) * 4, 194 + rnd(`q${i}`) * 4);
        const u2 = span(f, 200 + rnd(`q${i}`) * 5, 238 + rnd(`q${i}`) * 4);
        const rest = add(wokPos, inWok(i, 0.11, "s4"));
        const from: V3 = [-0.3 + rnd(`f${i}`) * 0.06, 1.3, STATION.z + 0.02];
        const p = lerp3(from, rest, easeIn(arrive));
        const fly = u2 > 0 ? tossArc(i, u2, 0.21, "s4b") : tossArc(i, u1, 0.15, "s4a");
        return <Piece key={i} at={add(p, arrive >= 1 ? fly : [0, 0, 0])} look={mixLook(LOOK.fried, LOOK.glazed, span(f, 166 + i, 196 + i))} seed={`s4-${i}`} size={0.032} spin={(u1 + u2) * 5} />;
      })}

      <Puffs position={[0, WOK_Y + 0.1, STATION.z]} frame={f} amount={0.45 + 0.6 * Math.sin(span(f, 12, 60) * Math.PI) + 0.5 * Math.sin(span(f, 66, 130) * Math.PI)} count={12} rise={0.6} seed="s4" />
      <Chef
        pose={{
          lean: 0.24 - 0.06 * clamp(jerk),
          handL: tiltX(wokPos, WOK_GRIP, tilt),
          gripL: 1,
          handR: hand,
          gripR: f > 44 && f < 162 ? 1 : 0.4,
          headPitch: 0.3 - 0.12 * ramp(f, 200, 226),
          headYaw: -0.25 * ramp(f, 206, 230),
          smile: lerp(0.15, 0.8, ramp(f, 196, 226)),
          browRaise: -0.4 + 0.6 * ramp(f, 196, 226),
        }}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Сцена 5 · Подача: дощ із кунжуту й зеленої цибулі, від'їзд на шефа з фірмовою усмішкою
// ─────────────────────────────────────────────────────────────────────────────
export const Shot05: React.FC<ShotProps> = ({ f }) => {
  const plate: V3 = [0, 1.165, 0.4];
  const pull = ramp(f, 46, 104);
  const cam = lerp3([0.1, 1.45, 0.86 - 0.05 * span(f, 0, 46)], [0, 1.37, 2.72 - 0.08 * span(f, 104, 150)], pull);
  const target = lerp3([0, 1.19, 0.4], [0, 1.325, 0.2], pull);
  const blink = Math.sin(span(f, 122, 130) * Math.PI);
  const breathe = Math.sin(f / 22) * 0.004;

  // Місце шматочка курки в гірці на тарілці.
  const pile = (i: number): V3 => {
    const ring = i < 6 ? 0 : i < 11 ? 1 : 2;
    const n = ring === 0 ? 6 : ring === 1 ? 5 : 2;
    const a = (i / n) * Math.PI * 2 + ring;
    const r = ring === 0 ? 0.075 : ring === 1 ? 0.04 : 0.012;
    return [Math.cos(a) * r, 0.03 + ring * 0.03, Math.sin(a) * r];
  };

  return (
    <>
      <Cam position={cam} look={target} fov={lerp(30, 32, pull)} />
      <Post focus={lerp3([0, 1.2, 0.4], [0, 1.4, 0.22], pull)} blur={lerp(1.3, 1, pull)} />
      <KitchenLights target={[0, 1.1, 0.3]} />
      <Kitchen station={false} />
      <Plate position={[plate[0], plate[1] + breathe, plate[2]]}>
        {Array.from({ length: 13 }).map((_, i) => (
          <Piece key={i} at={pile(i)} look={LOOK.glazed} seed={`pl${i}`} size={0.031} />
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2.2) * 0.1, 0.03, Math.sin(i * 2.2) * 0.1]} rotation={[0, i * 1.3, 0.2]} scale={[0.008, 0.008, 0.034]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshPhysicalMaterial color={C.chili} roughness={0.3} clearcoat={0.8} />
          </mesh>
        ))}
        {/* Сповільнений дощ із білого кунжуту */}
        {Array.from({ length: 70 }).map((_, i) => {
          const base = pile(i % 13);
          const land: V3 = [base[0] + rndRange(`kx${i}`, -0.03, 0.03), base[1] + 0.03, base[2] + rndRange(`kz${i}`, -0.03, 0.03)];
          const t = span(f, rnd(`kb${i}`) * 44, 20 + rnd(`kb${i}`) * 44);
          return (
            <mesh key={i} position={[land[0] + (1 - t) * rndRange(`kw${i}`, -0.04, 0.04), land[1] + (1 - t * t) * 0.42, land[2]]} rotation={[i, i * 2 + (1 - t) * 6, i * 3]} scale={[0.0022, 0.0013, 0.0036]}>
              <sphereGeometry args={[1, 6, 5]} />
              <meshStandardMaterial color={C.sesame} roughness={0.5} />
            </mesh>
          );
        })}
        {/* …і кілець зеленої цибулі */}
        {Array.from({ length: 16 }).map((_, i) => {
          const base = pile((i * 5) % 13);
          const t = span(f, 4 + rnd(`ob${i}`) * 40, 26 + rnd(`ob${i}`) * 40);
          return (
            <mesh
              key={i}
              position={[base[0] + rndRange(`ox${i}`, -0.025, 0.025), base[1] + 0.034 + (1 - t * t) * 0.46, base[2] + rndRange(`oz${i}`, -0.025, 0.025)]}
              rotation={[Math.PI / 2 + rndRange(`or${i}`, -0.5, 0.5) + (1 - t) * 5, (1 - t) * 4, i]}
            >
              <torusGeometry args={[0.0085, 0.0028, 6, 14]} />
              <meshStandardMaterial color={i % 4 === 0 ? "#cfe3a1" : C.scallion} roughness={0.5} />
            </mesh>
          );
        })}
      </Plate>
      <Puffs position={[0, plate[1] + 0.08, plate[2]]} frame={f} amount={0.5 * (1 - 0.5 * pull)} count={6} spread={0.06} rise={0.3} size={0.14} seed="s5" />
      <Chef
        pose={{
          handL: [0.15, plate[1] + 0.005 + breathe, plate[2] - 0.03],
          handR: [-0.15, plate[1] + 0.005 + breathe, plate[2] - 0.03],
          gripL: 0.55,
          gripR: 0.55,
          headPitch: lerp(0.3, 0.02, ramp(f, 40, 80)),
          headRoll: 0.04 * Math.sin(f / 30),
          smile: lerp(0.5, 1, ramp(f, 50, 84)),
          eyeL: 1 - blink,
          eyeR: 1 - blink,
        }}
      />
    </>
  );
};

export const SHOTS: Record<string, React.FC<ShotProps>> = {
  scene_01: Shot01,
  scene_02a: Shot02a,
  scene_02b: Shot02b,
  scene_02c: Shot02c,
  scene_03: Shot03,
  scene_04: Shot04,
  scene_05: Shot05,
};
