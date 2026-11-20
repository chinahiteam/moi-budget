import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { V3 } from "./util";

// Камера: положення, точка погляду й кут задаються декларативно на кожен кадр.
// Матрицю оновлюємо прямо під час рендеру React — до того, як Remotion попросить R3F намалювати кадр.
export const Cam: React.FC<{ position: V3; look: V3; fov: number; up?: V3 }> = ({ position, look, fov, up = [0, 1, 0] }) => {
  const set = useThree((s) => s.set);
  const size = useThree((s) => s.size);
  const camera = useMemo(() => new THREE.PerspectiveCamera(35, 9 / 16, 0.05, 60), []);
  camera.position.set(...position);
  camera.up.set(...up);
  camera.lookAt(...look);
  camera.fov = fov;
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  useLayoutEffect(() => {
    set({ camera });
  }, [camera, set]);
  return null;
};

// М'яке оточення для відбиттів на нержавійці та глазурі (без зовнішніх HDR-файлів).
export const Environment: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = texture;
    scene.environmentIntensity = 0.42;
    return () => {
      scene.environment = null;
      texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

// Тепле верхнє світло кухні (~3300 K), заповнення і холодний контровий, що відділяє чорну форму від тла.
export const KitchenLights: React.FC<{ target?: V3; flame?: number; flameAt?: V3 }> = ({ target = [0, 1, 0.3], flame = 0, flameAt = [0, 1.05, 0.62] }) => {
  const key = useMemo(() => new THREE.DirectionalLight("#ffd9a8", 2.3), []);
  key.position.set(target[0] - 1.6, target[1] + 3.2, target[2] + 2.6);
  key.target.position.set(...target);
  key.target.updateMatrixWorld();
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  const cam = key.shadow.camera;
  cam.left = cam.bottom = -2.2;
  cam.right = cam.top = 2.2;
  cam.near = 0.5;
  cam.far = 12;
  cam.updateProjectionMatrix();
  return (
    <>
      <hemisphereLight args={["#ffe2bd", "#3a2a1e", 0.6]} />
      <primitive object={key} />
      <directionalLight color="#bcd4ff" intensity={1.5} position={[2.2, 2.4, -2.6]} />
      <directionalLight color="#ffc890" intensity={0.7} position={[2.6, 1.4, 2.4]} />
      <pointLight color="#ffa861" intensity={flame * 1.5} distance={2.6} decay={1.8} position={flameAt} />
    </>
  );
};
