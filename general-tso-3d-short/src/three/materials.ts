import * as THREE from "three";

// Палітра з біблії персонажа (characters/chef_sian_3d.md, розділ 9).
export const C = {
  uniform: "#18181b",
  apron: "#101013",
  cap: "#0d0d0f",
  seam: "#34343a",
  skin: "#c68e63",
  skinDark: "#8f5f42",
  lip: "#a05f4c",
  mouth: "#4d1a17",
  eye: "#2e1b10",
  hair: "#77736e",
  clog: "#232f4b",
  soleWhite: "#f2f2f0",
  soleRed: "#d8342b",
  steel: "#8f8a80",
  steelDark: "#5d5a54",
  wok: "#1d1d21",
  wood: "#9a6a3a",
  tile: "#bfae8e",
  raw: "#eaa79b",
  marinated: "#8f4f2c",
  starch: "#f4ecdd",
  fried: "#a8691a",
  glaze: "#55200c",
  oil: "#c98216",
  soy: "#2a140b",
  scallion: "#5fa83b",
  sesame: "#f5ecd2",
  chili: "#b3201a",
  garlic: "#f0e6cc",
  ginger: "#d9b45a",
};

const std = (color: string, roughness: number, metalness = 0, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

// Матова бавовна: легкий sheen, щоб чорна форма читалася у світлі кухні.
const cloth = (color: string) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.92,
    sheen: 0.3,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color("#50505a"),
    side: THREE.DoubleSide,
  });

// Сиве коротке волосся «сіль із перцем» — крапчаста текстура.
const hairTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#4a4744";
  ctx.fillRect(0, 0, 256, 256);
  let seed = 7;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9000; i++) {
    const light = next() > 0.6;
    ctx.fillStyle = light ? `rgba(205,202,196,${0.35 + next() * 0.45})` : `rgba(26,24,22,${0.35 + next() * 0.4})`;
    ctx.fillRect(next() * 256, next() * 256, 1.2, 2.2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 2.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// Світла бежева квадратна плитка з темними швами.
const tileTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#6f6659";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = C.tile;
  ctx.fillRect(4, 4, 248, 248);
  const g = ctx.createLinearGradient(0, 0, 256, 256);
  g.addColorStop(0, "rgba(255,255,255,0.10)");
  g.addColorStop(1, "rgba(120,90,50,0.10)");
  ctx.fillStyle = g;
  ctx.fillRect(4, 4, 248, 248);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(26, 26);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

// М'яка кругла пляма для пари, диму й хмарки крохмалю.
const puffTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
};

// Язик полум'я: м'яка крапля, яскрава біля основи і прозора до кінчика.
const flameTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "blur(7px)";
  const g = ctx.createLinearGradient(0, 256, 0, 0);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,236,170,0.95)");
  g.addColorStop(0.55, "rgba(255,150,60,0.6)");
  g.addColorStop(1, "rgba(255,70,20,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(64, 14);
  ctx.bezierCurveTo(84, 90, 112, 150, 106, 200);
  ctx.bezierCurveTo(102, 236, 82, 246, 64, 246);
  ctx.bezierCurveTo(46, 246, 26, 236, 22, 200);
  ctx.bezierCurveTo(16, 150, 44, 90, 64, 14);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
};

// Рельєф хрусткої скоринки: дрібний плямистий шум для bump-карти.
const crustTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  let seed = 31;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1400; i++) {
    const r = 2 + next() * 7;
    const light = next() > 0.5;
    ctx.fillStyle = light ? `rgba(255,255,255,${0.12 + next() * 0.22})` : `rgba(0,0,0,${0.12 + next() * 0.22})`;
    ctx.beginPath();
    ctx.arc(next() * 256, next() * 256, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
};

let cache: ReturnType<typeof build> | null = null;

const build = () => ({
  jacket: cloth(C.uniform),
  apron: cloth(C.apron),
  cap: cloth(C.cap),
  seam: std(C.seam, 0.8),
  skin: new THREE.MeshPhysicalMaterial({ color: C.skin, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color("#ffb08a"), emissive: new THREE.Color("#7a2c14"), emissiveIntensity: 0.16 }),
  // Виліплена голова: колір (шкіра + рум'янець) записаний у вершинах.
  skinSculpt: new THREE.MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color("#ffb08a"), emissive: new THREE.Color("#7a2c14"), emissiveIntensity: 0.16 }),
  skinLine: std("#a8734f", 0.7),
  lip: std(C.lip, 0.5),
  mouth: std(C.mouth, 0.6),
  teeth: std("#fbf7ee", 0.3),
  eyeWhite: std("#f6f1e8", 0.25),
  iris: std(C.eye, 0.15),
  brow: std("#2b211c", 0.8),
  hair: std("#ffffff", 0.85, 0, { map: hairTexture() }),
  snap: std("#c9c9cc", 0.3, 1),
  clog: std(C.clog, 0.6),
  soleWhite: std(C.soleWhite, 0.6),
  soleRed: std(C.soleRed, 0.55),
  dark: std("#0b0b0c", 0.8),
  white: std("#f4f1ea", 0.7),
  steel: std(C.steel, 0.42, 0.8),
  steelDark: std(C.steelDark, 0.45, 0.8),
  wok: std(C.wok, 0.42, 0.75, { side: THREE.DoubleSide }),
  wood: std(C.wood, 0.7),
  bamboo: std("#c9a25e", 0.6),
  floor: std("#ffffff", 0.55, 0, { map: tileTexture() }),
  board: std("#f3efe6", 0.6),
  plate: std("#2a2725", 0.35),
  plastic: std("#e9e2c8", 0.35, 0, { transparent: true, opacity: 0.85 }),
  led: new THREE.MeshBasicMaterial({ color: "#fff1cf" }),
  puff: puffTexture(),
  flame: flameTexture(),
  crust: crustTexture(),
});

export const M = () => (cache ??= build());
