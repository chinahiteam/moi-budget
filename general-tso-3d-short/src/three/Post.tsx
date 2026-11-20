import React, { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BloomEffect,
  BrightnessContrastEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { N8AOPostPass } from "n8ao";
import * as THREE from "three";
import type { V3 } from "./util";

// Постобробка 3D-кадру — те, що перетворює «набір примітивів» на цілісну картинку:
//   1. ambient occlusion — м'які контактні тіні в складках і під предметами;
//   2. глибина різкості — тло кухні розмивається, погляд тримається на шефі та страві;
//   3. bloom — світіння полум'я і відблисків на глазурі;
//   4. ACES-тонмапінг, легкий грейд і згладжування країв.
//
// Параметри кадру (точка фокусу, сила розмиття) задаються пропсами на кожен кадр.
// useFrame тут лише викликає composer.render() — анімацією керує виключно номер кадру Remotion.
export const Post: React.FC<{ focus: V3; blur?: number; bloom?: number; exposure?: number }> = ({ focus, blur = 1, bloom = 1, exposure = 1.08 }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const post = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
    composer.addPass(new RenderPass(scene, camera));

    const ao = new N8AOPostPass(scene, camera, size.width, size.height);
    ao.configuration.aoRadius = 0.16;
    ao.configuration.distanceFalloff = 0.6;
    ao.configuration.intensity = 1.7;
    ao.configuration.aoSamples = 10;
    ao.configuration.denoiseSamples = 4;
    ao.configuration.denoiseRadius = 8;
    ao.configuration.halfRes = true;
    ao.configuration.gammaCorrection = false;
    ao.configuration.color = new THREE.Color("#1a0d06");
    composer.addPass(ao);

    const dof = new DepthOfFieldEffect(camera, { focusRange: 0.5, bokehScale: 3, resolutionScale: 0.5 });
    dof.target = new THREE.Vector3();
    composer.addPass(new EffectPass(camera, dof));

    const bloomEffect = new BloomEffect({ mipmapBlur: true, intensity: 0.5, luminanceThreshold: 1.25, luminanceSmoothing: 0.25, radius: 0.7 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    // Легкий грейд після тонмапінгу: трохи контрасту й насиченості, щоб картинка не була «сірою».
    const grade = [new BrightnessContrastEffect({ brightness: 0.01, contrast: 0.12 }), new HueSaturationEffect({ saturation: 0.08 })];
    composer.addPass(new EffectPass(camera, bloomEffect, tone, ...grade));
    composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));
    return { composer, dof, bloomEffect };
  }, [gl, scene, camera]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    post.composer.setSize(size.width, size.height);
  }, [post, size.width, size.height]);
  useEffect(() => () => post.composer.dispose(), [post]);

  // Параметри поточного кадру.
  post.dof.target!.set(...focus);
  post.dof.bokehScale = 3.2 * blur;
  post.dof.cocMaterial.worldFocusRange = 0.55;
  post.bloomEffect.intensity = 0.38 * bloom;
  gl.toneMappingExposure = exposure;

  // Пріоритет 1 вимикає стандартний рендер R3F: кадр малює композер.
  useFrame(() => post.composer.render(), 1);
  return null;
};
