import React from "react";
import * as THREE from "three";
import { APRON, apronGeometry, faceZ, headGeometry, onSkirt, torsoGeometry } from "./ChefSculpt";
import { M } from "./materials";
import { type V3, between, lerp, solveElbow, span } from "./util";

// Стилізований 3D-персонаж Шефа Сяна, зібраний із примітивів за біблією characters/chef_sian_3d.md.
// Персонаж стоїть у початку координат, ступні на y = 0, обличчям до +Z. Зріст ≈ 1.65 (≈ 5.6 голови).

export type ChefPose = {
  position?: V3;
  rotationY?: number;
  lean?: number; // нахил корпуса вперед, рад
  headYaw?: number;
  headPitch?: number; // + донизу
  headRoll?: number;
  smile?: number; // 0 — спокійний, 1 — фірмова широка усмішка
  eyeL?: number; // відкритість очей 0..1 (L — ліве око персонажа, +X)
  eyeR?: number;
  browRaise?: number;
  handL?: V3; // цілі для кистей у системі координат персонажа
  handR?: V3;
  gripL?: number; // 0 — розкрита долоня, 1 — кулак
  gripR?: number;
};

const HEAD_Y = 1.47;
const HIP_Y = 0.76;
const UPPER = 0.27;
const FORE = 0.25;

const Limb: React.FC<{ from: V3; to: V3; r1: number; r2: number; material: THREE.Material; flatten?: number }> = ({
  from,
  to,
  r1,
  r2,
  material,
  flatten = 1,
}) => {
  const { position, quaternion, length } = between(from, to);
  return (
    <mesh position={position} quaternion={quaternion} scale={[1, length, flatten]} material={material} castShadow>
      <cylinderGeometry args={[r2, r1, 1, 14]} />
    </mesh>
  );
};

const Ball: React.FC<{ at: V3; r: number; material: THREE.Material; scale?: V3 }> = ({ at, r, material, scale }) => (
  <mesh position={at} scale={scale} material={material} castShadow>
    <sphereGeometry args={[r, 20, 14]} />
  </mesh>
);

// ── Обличчя ───────────────────────────────────────────────────────────────────

const Eye: React.FC<{ side: 1 | -1; open: number; smile: number }> = ({ side, open, smile }) => {
  const m = M();
  // В усмішці щоки підтискають очі знизу — вони звужуються у теплі півмісяці.
  const o = Math.max(0.06, open * lerp(1, 0.34, smile));
  const arc = Math.PI * 0.74;
  return (
    <group position={[side * 0.056, 0.004, faceZ(0.056, 0.004) - 0.0075]} rotation={[0, side * 0.3, 0]}>
      <group scale={[1, o, 1]}>
        <mesh material={m.eyeWhite} scale={[1.38, 0.8, 0.45]}>
          <sphereGeometry args={[0.0235, 20, 14]} />
        </mesh>
        <mesh material={m.iris} position={[0, -0.001, 0.0072]} scale={[1, 1, 0.5]}>
          <sphereGeometry args={[0.0142, 18, 12]} />
        </mesh>
      </group>
      {o > 0.25 ? (
        <mesh position={[0.004, 0.005 * o, 0.0135]}>
          <sphereGeometry args={[0.0034, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ) : null}
      {/* Верхня повіка: мигдалеподібний контур; коли око заплющене — дужка-півмісяць */}
      <mesh
        material={m.brow}
        position={[0, lerp(-0.027, -0.0118, o), 0.0085]}
        rotation={[0, 0, Math.PI / 2 - arc / 2]}
        scale={[1.2, 1, 1]}
      >
        <torusGeometry args={[0.0295, 0.0022, 6, 20, arc]} />
      </mesh>
    </group>
  );
};

// «Гусячі лапки» — три промінчики від зовнішнього кутика ока; в усмішці стають виразнішими.
const CrowsFeet: React.FC<{ side: 1 | -1; smile: number }> = ({ side, smile }) => {
  const m = M();
  const thick = lerp(0.7, 1.5, smile);
  return (
    <group position={[side * 0.097, 0.003, faceZ(0.097, 0.003) - 0.001]} rotation={[0, side * 0.7, 0]}>
      {[0.42, 0.04, -0.36].map((angle, i) => (
        <group key={i} rotation={[0, 0, side * angle]}>
          <mesh material={m.skinLine} position={[side * 0.011, 0, 0.002]} rotation={[0, 0, Math.PI / 2]} scale={[thick, 1, 0.5]}>
            <capsuleGeometry args={[0.0009, 0.011 - i * 0.0015, 3, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const MOUTH_Y = -0.078;
// Вигинає плоску деталь рота по кривизні обличчя, щоб вона лежала на поверхні, а не «висіла» наклейкою.
const conform = (geometry: THREE.BufferGeometry) => {
  const pos = geometry.attributes.position;
  const z0 = faceZ(0, MOUTH_Y);
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) + faceZ(Math.abs(pos.getX(i)), MOUTH_Y) - z0);
  pos.needsUpdate = true;
  return geometry;
};
let mouthParts: { cavity: THREE.BufferGeometry; teeth: THREE.BufferGeometry; lip: THREE.BufferGeometry } | null = null;
const mouthGeometry = () =>
  (mouthParts ??= {
    cavity: conform(new THREE.CircleGeometry(0.041, 40, Math.PI, Math.PI)),
    teeth: conform(new THREE.CircleGeometry(0.0375, 40, Math.PI, Math.PI)),
    lip: conform(new THREE.PlaneGeometry(0.086, 0.0042, 24, 1)),
  });

const Mouth: React.FC<{ smile: number }> = ({ smile }) => {
  const m = M();
  const open = span(smile, 0.5, 1);
  const arc = lerp(0.85, 1.75, smile);
  const parts = mouthGeometry();
  const z = faceZ(0, MOUTH_Y);
  // Нахил рота за схилом обличчя: нижня губа трохи далі від камери, ніж верхня.
  const slope = Math.atan((faceZ(0, MOUTH_Y + 0.02) - faceZ(0, MOUTH_Y - 0.02)) / 0.04);
  // Закрита усмішка: дужка з коротких сегментів, що лягає на поверхню.
  const smileLine = Array.from({ length: 13 }).map((_, i) => {
    const a = -Math.PI / 2 - arc / 2 + (arc * i) / 12;
    const x = Math.cos(a) * 0.05;
    return [x, 0.03 + Math.sin(a) * 0.05, faceZ(Math.abs(x), MOUTH_Y) - z + 0.001] as V3;
  });
  return (
    <group position={[0, MOUTH_Y, z + 0.0008]} rotation={[slope, 0, 0]}>
      {open < 0.35
        ? smileLine.slice(1).map((p, i) => <Limb key={i} from={smileLine[i]} to={p} r1={0.003} r2={0.003} material={m.lip} />)
        : null}
      {open > 0 ? (
        <group position={[0, 0.004, 0]}>
          {/* Відкрита усмішка: темна порожнина рота і верхній ряд зубів */}
          <mesh geometry={parts.cavity} material={m.mouth} scale={[1, 0.08 + open * 0.56, 1]} />
          <mesh geometry={parts.teeth} material={m.teeth} position={[0, 0, 0.0012]} scale={[1, 0.04 + open * 0.26, 1]} />
          <mesh geometry={parts.lip} material={m.lip} position={[0, 0.0012, 0.0016]} />
        </group>
      ) : null}
    </group>
  );
};

const Head: React.FC<{ pose: ChefPose }> = ({ pose }) => {
  const m = M();
  const smile = pose.smile ?? 0.15;
  const brow = pose.browRaise ?? 0;
  return (
    <group position={[0, HEAD_Y, 0]} rotation={[pose.headPitch ?? 0, pose.headYaw ?? 0, pose.headRoll ?? 0]}>
      {/* Голова виліплена єдиною гладкою формою: округлий овал, повні щоки, ніс, вуха, носогубні складки */}
      <mesh geometry={headGeometry()} material={m.skinSculpt} castShadow receiveShadow />
      {[1, -1].map((s) => (
        <React.Fragment key={s}>
          <Eye side={s as 1 | -1} open={(s === 1 ? pose.eyeL : pose.eyeR) ?? 1} smile={smile} />
          <CrowsFeet side={s as 1 | -1} smile={smile} />
          {/* Брови: природні темні, середньої густоти */}
          <mesh material={m.brow} position={[s * 0.058, 0.046 + brow * 0.012, faceZ(0.058, 0.046) + 0.0012]} rotation={[0, s * 0.3, Math.PI / 2 - s * 0.1]}>
            <capsuleGeometry args={[0.0028, 0.04, 4, 8]} />
          </mesh>
        </React.Fragment>
      ))}
      <Mouth smile={smile} />

      {/* Дуже коротке волосся «сіль із перцем» на скронях і потилиці */}
      <mesh material={m.hair} scale={[1, 1.04, 1]}>
        <sphereGeometry args={[0.1612, 48, 12, Math.PI / 2 + 0.98, Math.PI * 2 - 1.96, 1.02, 1.16]} />
      </mesh>

      {/* Чорна матова бейсболка: 6 клинів, ґудзик, вигнутий козирок уперед, без логотипа */}
      <group position={[0, 0.074, 0]}>
        <mesh material={m.cap} scale={[1, 0.7, 1.04]} castShadow>
          <sphereGeometry args={[0.153, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={m.cap} position={[0, -0.006, 0]} scale={[1, 1, 1.04]}>
          <cylinderGeometry args={[0.153, 0.151, 0.014, 40, 1, true]} />
        </mesh>
        <group scale={[1, 0.7, 1.04]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} material={m.seam} rotation={[0, (i * Math.PI) / 3, 0]}>
              <torusGeometry args={[0.1535, 0.0014, 4, 28, Math.PI]} />
            </mesh>
          ))}
        </group>
        <Ball at={[0, 0.107, 0]} r={0.011} material={m.cap} scale={[1, 0.6, 1]} />
        <mesh material={m.cap} position={[0, -0.002, 0.092]} rotation={[0.1, 0, 0]} scale={[1.22, 1, 1.12]} castShadow>
          <cylinderGeometry args={[0.105, 0.105, 0.009, 32, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
};

// ── Руки ─────────────────────────────────────────────────────────────────────

const Hand: React.FC<{ at: V3; elbow: V3; side: 1 | -1; grip: number }> = ({ at, elbow, side, grip }) => {
  const m = M();
  const { quaternion } = between(elbow, at);
  return (
    <group position={at} quaternion={quaternion}>
      <mesh material={m.skin} scale={[1, 1.12, 0.62]} castShadow>
        <sphereGeometry args={[0.042, 16, 12]} />
      </mesh>
      {[-0.027, -0.009, 0.009, 0.027].map((x, i) => (
        <group key={i} position={[x, 0.03, 0]} rotation={[grip * 1.7, 0, 0]}>
          <mesh material={m.skin} position={[0, 0.03 - Math.abs(x) * 0.25, 0]} castShadow>
            <capsuleGeometry args={[0.0115, 0.034, 4, 8]} />
          </mesh>
        </group>
      ))}
      <group position={[-side * 0.036, 0.0, 0.012]} rotation={[grip * 0.9, 0, side * 0.75]}>
        <mesh material={m.skin} position={[0, 0.022, 0]} castShadow>
          <capsuleGeometry args={[0.0125, 0.026, 4, 8]} />
        </mesh>
      </group>
    </group>
  );
};

const Arm: React.FC<{ side: 1 | -1; shoulder: V3; target: V3; grip: number }> = ({ side, shoulder, target, grip }) => {
  const m = M();
  const { elbow, hand } = solveElbow(shoulder, target, UPPER, FORE, [side * 0.7, -0.5, -0.75]);
  const mix = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const cuff = mix(elbow, hand, 0.4);
  const wrist = mix(elbow, hand, 0.86);
  const out: V3 = [side * 0.055, 0, 0];
  const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  return (
    <>
      <Ball at={shoulder} r={0.068} material={m.jacket} />
      <Limb from={shoulder} to={elbow} r1={0.066} r2={0.057} material={m.jacket} />
      <Ball at={elbow} r={0.057} material={m.jacket} />
      <Limb from={elbow} to={cuff} r1={0.056} r2={0.054} material={m.jacket} />
      {/* Підкочений рукав до середини передпліччя: об'ємна манжета */}
      <Limb from={mix(elbow, hand, 0.32)} to={mix(elbow, hand, 0.47)} r1={0.062} r2={0.064} material={m.jacket} />
      {/* Хлястик із маленькою металевою кнопкою на зовнішньому боці руки */}
      <Limb from={add(mix(elbow, shoulder, 0.02), out)} to={add(mix(elbow, shoulder, 0.34), out)} r1={0.013} r2={0.013} material={m.seam} flatten={0.4} />
      <Ball at={add(mix(elbow, shoulder, 0.27), [side * 0.061, 0, 0])} r={0.0085} material={m.snap} />
      <Limb from={cuff} to={wrist} r1={0.045} r2={0.036} material={m.skin} />
      <Hand at={hand} elbow={elbow} side={side} grip={grip} />
    </>
  );
};

// ── Взуття: темно-сині сабо з біло-червоною смугою по периметру підошви ───────

const Clog: React.FC<{ side: 1 | -1 }> = ({ side }) => {
  const m = M();
  return (
    <group position={[side * 0.1, 0, 0.035]} rotation={[0, side * 0.14, 0]}>
      <mesh material={m.dark} position={[0, 0.006, 0]} scale={[1.04, 1, 1.86]}>
        <cylinderGeometry args={[0.071, 0.07, 0.012, 24]} />
      </mesh>
      <mesh material={m.soleWhite} position={[0, 0.027, 0]} scale={[1.06, 1, 1.88]}>
        <cylinderGeometry args={[0.072, 0.072, 0.03, 24]} />
      </mesh>
      <mesh material={m.soleRed} position={[0, 0.027, 0]} scale={[1.075, 1, 1.895]}>
        <cylinderGeometry args={[0.072, 0.072, 0.008, 24]} />
      </mesh>
      <mesh material={m.clog} position={[0, 0.052, 0.012]} scale={[1, 0.78, 1.74]} castShadow>
        <sphereGeometry args={[0.07, 22, 14]} />
      </mesh>
      <mesh material={m.clog} position={[0, 0.06, -0.085]} scale={[1, 1, 0.55]}>
        <cylinderGeometry args={[0.064, 0.068, 0.06, 20]} />
      </mesh>
      {/* Вентиляційні отвори на носку */}
      {[-0.028, 0, 0.028].flatMap((x) =>
        [0.05, 0.082].map((z) => (
          <mesh key={`${x}-${z}`} material={m.dark} position={[x, 0.1 - Math.abs(x) * 0.25 - (z - 0.05) * 0.32, z]}>
            <sphereGeometry args={[0.0065, 8, 6]} />
          </mesh>
        )),
      )}
    </group>
  );
};

// ── Персонаж цілком ──────────────────────────────────────────────────────────

export const Chef: React.FC<{ pose?: ChefPose }> = ({ pose = {} }) => {
  const m = M();
  const lean = pose.lean ?? 0;
  // Плече після нахилу корпуса (обертання навколо осі X у точці стегон).
  const leaned = (p: V3): V3 => {
    const y = p[1] - HIP_Y;
    return [p[0], HIP_Y + y * Math.cos(lean) - p[2] * Math.sin(lean), y * Math.sin(lean) + p[2] * Math.cos(lean)];
  };

  return (
    <group position={pose.position} rotation={[0, pose.rotationY ?? 0, 0]}>
      {/* Ноги: прямі чорні штани і сабо */}
      {[1, -1].map((s) => (
        <React.Fragment key={s}>
          <Limb from={[s * 0.1, 0.085, 0.005]} to={[s * 0.1, 0.74, 0]} r1={0.068} r2={0.082} material={m.jacket} />
          <Clog side={s as 1 | -1} />
        </React.Fragment>
      ))}

      {/* Низ фартуха і біла ткана бирка на лівому стегні персонажа рухаються разом зі стегнами */}
      <group position={onSkirt(0.8, APRON.waist - 0.032)} rotation={[0, 0.8, 0]}>
        <mesh material={m.white} position={[0, 0, 0.003]}>
          <boxGeometry args={[0.036, 0.013, 0.004]} />
        </mesh>
        <mesh material={m.soleRed} position={[0, 0, 0.0045]}>
          <boxGeometry args={[0.016, 0.004, 0.003]} />
        </mesh>
      </group>

      <group position={[0, HIP_Y, 0]} rotation={[lean, 0, 0]}>
        <group position={[0, -HIP_Y, 0]}>
          {/* Кітель: кремезний корпус, виліплений однією формою */}
          <mesh geometry={torsoGeometry()} material={m.jacket} castShadow receiveShadow />
          {/* Фартух із нагрудником: облягає тулуб, шов на талії, довжина нижче колін */}
          <mesh geometry={apronGeometry()} material={m.apron} castShadow receiveShadow />

          {/* Комір-стійка (мандарин), трохи розкритий спереду */}
          <mesh material={m.jacket} position={[0, 1.292, 0]}>
            <cylinderGeometry args={[0.07, 0.078, 0.052, 28, 1, true, 0.24, Math.PI * 2 - 0.48]} />
          </mesh>
          {/* Асиметрична пола кітеля і дві металеві кнопки */}
          <Limb from={[0.012, 1.262, 0.118]} to={[0.118, 1.176, 0.128]} r1={0.0032} r2={0.0032} material={m.seam} />
          <Ball at={[0.004, 1.228, 0.139]} r={0.0095} material={m.snap} />
          <Ball at={[0.094, 1.214, 0.133]} r={0.0095} material={m.snap} />
          {/* Шийна бретеля фартуха */}
          {[1, -1].map((s) => (
            <Limb key={s} from={[s * 0.112, APRON.top - 0.004, 0.142]} to={[s * 0.066, 1.3, 0.03]} r1={0.011} r2={0.011} material={m.apron} flatten={0.45} />
          ))}

          <Head pose={pose} />
        </group>
      </group>

      {[1, -1].map((s) => {
        const side = s as 1 | -1;
        const rest: V3 = [s * 0.3, 0.72, 0.04];
        return (
          <Arm
            key={s}
            side={side}
            shoulder={leaned([s * 0.208, 1.2, 0])}
            target={(side === 1 ? pose.handL : pose.handR) ?? rest}
            grip={(side === 1 ? pose.gripL : pose.gripR) ?? 0.35}
          />
        );
      })}
    </group>
  );
};
