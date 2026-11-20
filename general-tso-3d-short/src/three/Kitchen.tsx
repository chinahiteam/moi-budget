import React from "react";
import type * as THREE from "three";
import { M } from "./materials";
import type { V3 } from "./util";

// Кухня «Китайського Привіту» за референсними фото: нержавійка, масивна витяжка з фільтрами,
// великий круглий гофрований повітропровід, теплі лінійні LED, бежева плитка, полиці з контейнерами.
// Побудована як «знімальний павільйон»: задня половина закрита стінами, передня відкрита для камери.

const Box: React.FC<{ at: V3; size: V3; material: THREE.Material; shadow?: boolean }> = ({ at, size, material, shadow = true }) => (
  <mesh position={at} material={material} castShadow={shadow} receiveShadow>
    <boxGeometry args={size} />
  </mesh>
);

const Counter: React.FC<{ at: V3; size: V3; doors?: number }> = ({ at, size, doors = 3 }) => {
  const m = M();
  const [w, h, d] = size;
  return (
    <group position={at}>
      <Box at={[0, h / 2, 0]} size={[w, h, d]} material={m.steel} />
      <Box at={[0, h + 0.012, 0]} size={[w + 0.03, 0.03, d + 0.03]} material={m.steel} />
      {Array.from({ length: doors }).map((_, i) => {
        const z = -d / 2 + ((i + 0.5) * d) / doors;
        return (
          <group key={i}>
            <Box at={[(w / 2 + 0.004) * Math.sign(-at[0] || 1), h * 0.45, z]} size={[0.008, h * 0.62, d / doors - 0.05]} material={m.steelDark} shadow={false} />
            <Box at={[(w / 2 + 0.014) * Math.sign(-at[0] || 1), h * 0.68, z]} size={[0.014, 0.02, 0.16]} material={m.dark} shadow={false} />
          </group>
        );
      })}
    </group>
  );
};

const Containers: React.FC<{ at: V3; count: number; seed: number }> = ({ at, count, seed }) => {
  const m = M();
  const fills = ["#d8b98a", "#c9a56a", "#e6dcc2", "#b9774a", "#d6c7a1"];
  return (
    <group position={at}>
      {Array.from({ length: count }).map((_, i) => (
        <group key={i} position={[i * 0.27, 0, 0]}>
          <mesh material={m.plastic} position={[0, 0.06, 0]}>
            <boxGeometry args={[0.22, 0.12, 0.16]} />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <boxGeometry args={[0.2, 0.08, 0.14]} />
            <meshStandardMaterial color={fills[(i + seed) % fills.length]} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const SqueezeBottle: React.FC<{ at: V3; color?: string; rotation?: V3 }> = ({ at, color = "#d9b94a", rotation }) => {
  const m = M();
  return (
    <group position={at} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.03, 0.032, 0.15, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh material={m.plastic} position={[0, 0.095, 0]}>
        <coneGeometry args={[0.026, 0.05, 14]} />
      </mesh>
      <mesh material={m.plastic} position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.004, 0.008, 0.04, 8]} />
      </mesh>
    </group>
  );
};

export const Kitchen: React.FC<{ station?: boolean; ceiling?: boolean }> = ({ station = true, ceiling = true }) => {
  const m = M();
  return (
    <group>
      {/* Підлога: світла бежева плитка з темними швами */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.floor} receiveShadow>
        <planeGeometry args={[30, 30]} />
      </mesh>

      {/* Задня і бічні стіни, обшиті нержавійкою */}
      <Box at={[0, 1.4, -2.3]} size={[4.4, 2.8, 0.06]} material={m.steel} shadow={false} />
      <Box at={[-2.2, 1.4, -1.5]} size={[0.06, 2.8, 1.6]} material={m.steel} shadow={false} />
      <Box at={[2.2, 1.4, -1.5]} size={[0.06, 2.8, 1.6]} material={m.steel} shadow={false} />
      {ceiling ? <Box at={[0, 2.82, -0.6]} size={[4.4, 0.05, 3.4]} material={m.steelDark} shadow={false} /> : null}

      {/* Лінії обладнання вздовж стін */}
      <Counter at={[-1.82, 0, -1.25]} size={[0.7, 0.88, 2.0]} />
      <Counter at={[1.82, 0, -1.25]} size={[0.7, 0.88, 2.0]} />
      <Counter at={[0, 0, -1.95]} size={[2.9, 0.88, 0.62]} doors={0} />
      {/* Біла обробна дошка і ваги на лівій лінії, пляшки-диспенсери на правій */}
      <Box at={[-1.8, 0.925, -0.9]} size={[0.44, 0.022, 0.6]} material={m.board} />
      <Box at={[-1.82, 0.96, -1.75]} size={[0.3, 0.09, 0.3]} material={m.white} />
      <SqueezeBottle at={[1.72, 0.985, -0.55]} />
      <SqueezeBottle at={[1.86, 0.985, -0.62]} color="#3a1c10" />
      <SqueezeBottle at={[1.74, 0.985, -0.74]} color="#b8321f" />
      {/* Складені воки з дерев'яними ручками */}
      {[0, 1].map((i) => (
        <group key={i} position={[1.78, 0.97 + i * 0.045, -1.35]} rotation={[0, 0.5 + i * 0.3, 0]}>
          <mesh material={m.wok} scale={[1, 0.36, 1]}>
            <sphereGeometry args={[0.21, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          </mesh>
          <mesh material={m.wood} position={[-0.3, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.016, 0.018, 0.22, 10]} />
          </mesh>
        </group>
      ))}

      {/* Полиці з пластиковими контейнерами заготовок */}
      {[1.42, 1.86].map((y, row) => (
        <group key={y}>
          <Box at={[0.15, y, -2.14]} size={[2.5, 0.025, 0.3]} material={m.steel} />
          <Containers at={[-0.95 + row * 0.2, y + 0.012, -2.14]} count={7 - row} seed={row * 2} />
        </group>
      ))}
      {/* Диспенсер рушників і розетки на стіні */}
      <Box at={[-1.55, 1.5, -2.24]} size={[0.3, 0.36, 0.1]} material={m.white} />
      {[-0.4, 0.5].map((x) => (
        <Box key={x} at={[x, 1.12, -2.262]} size={[0.16, 0.09, 0.012]} material={m.white} shadow={false} />
      ))}

      {/* Масивна витяжка з жироуловлювальними фільтрами */}
      <group position={[0.75, 2.22, -0.55]} visible={ceiling}>
        <Box at={[0, 0.18, 0]} size={[2.7, 0.5, 2.3]} material={m.steel} />
        <mesh material={m.steel} position={[0, -0.2, 0]} scale={[2.7, 0.3, 2.3]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.707, 0.62, 1, 4, 1, true]} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} at={[-1.05 + i * 0.42, -0.14, 0.86]} size={[0.38, 0.02, 0.46]} material={m.steelDark} shadow={false} />
        ))}
      </group>
      {/* Великий круглий гофрований повітропровід під стелею */}
      <group position={[-0.95, 2.42, -0.7]} rotation={[Math.PI / 2, 0, 0]} visible={ceiling}>
        <mesh material={m.steel} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 3.2, 28, 1, true]} />
        </mesh>
        {Array.from({ length: 22 }).map((_, i) => (
          <mesh key={i} material={m.steelDark} position={[0, -1.5 + i * 0.143, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.302, 0.012, 6, 28]} />
          </mesh>
        ))}
      </group>
      {/* Теплі лінійні LED-світильники */}
      {[
        [-0.2, -1.2],
        [-0.2, 0.3],
        [1.6, -0.4],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 2.76, z]} visible={ceiling}>
          <Box at={[0, 0, 0]} size={[0.16, 0.05, 1.1]} material={m.steelDark} shadow={false} />
          <Box at={[0, -0.03, 0]} size={[0.11, 0.02, 1.0]} material={m.led} shadow={false} />
        </group>
      ))}

      {station ? <WokStation /> : null}
    </group>
  );
};

// Вок-станція: сталева тумба з газовим пальником і ручками керування.
export const STATION = { x: 0, z: 0.62, top: 0.97 };

export const WokStation: React.FC = () => {
  const m = M();
  return (
    <group position={[STATION.x, 0, STATION.z]}>
      <Box at={[0, STATION.top / 2 - 0.02, 0]} size={[0.86, STATION.top - 0.04, 0.6]} material={m.steel} />
      <Box at={[0, STATION.top - 0.015, 0]} size={[0.9, 0.03, 0.64]} material={m.steel} />
      <mesh material={m.dark} position={[0, STATION.top + 0.01, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.03, 28]} />
      </mesh>
      <mesh material={m.steelDark} position={[0, STATION.top + 0.028, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.012, 8, 28]} />
      </mesh>
      {[-0.26, 0, 0.26].map((x) => (
        <mesh key={x} material={m.dark} position={[x, STATION.top - 0.2, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.036, 0.03, 16]} />
        </mesh>
      ))}
      <SqueezeBottle at={[0.36, STATION.top + 0.075, -0.2]} color="#3a1c10" />
      <SqueezeBottle at={[0.36, STATION.top + 0.075, -0.08]} />
    </group>
  );
};

// Стіл для підготовки (сцена 2): сталева стільниця на місці вок-станції.
export const PrepTable: React.FC = () => {
  const m = M();
  return (
    <group position={[0, 0, 0.62]}>
      <Box at={[0, 0.43, 0]} size={[1.5, 0.86, 0.8]} material={m.steel} />
      <Box at={[0, 0.885, 0]} size={[1.56, 0.03, 0.86]} material={m.steel} />
    </group>
  );
};
export const TABLE_TOP = 0.9;
