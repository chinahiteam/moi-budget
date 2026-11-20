#!/usr/bin/env node
// Збирає characters/chef_sian_prompts.json і prompts/scenes_3d_generation.json.
//
// Канонічний опис Шефа Сяна (CHARACTER_LOCK_EN) живе ТУТ, в одному місці, і дослівно
// вшивається в кожен промпт — так персонаж не «пливе» між сценами. Змінили опис —
// запустіть `npm run prompts`, і всі промпти оновляться синхронно.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Канонічні блоки (locks)
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER_LOCK_EN = [
  "CHARACTER — Chef Sian, the exact same single character in every shot, matched to the attached reference photos:",
  "an East Asian (Chinese) man about 50 years old, rendered as a warm, appealing stylized 3D animated character (never a caricature).",
  "FACE: soft round-oval face with full cheeks and a soft rounded chin; warm medium-tan skin with subsurface scattering;",
  "calm, kind, charismatic expression with no aggression; dark-brown almond-shaped eyes that narrow into warm crescents when he smiles;",
  "clearly visible crow's-feet smile lines at the outer corners of the eyes and soft nasolabial folds that deepen with his sincere smile;",
  "natural dark eyebrows of medium thickness; completely clean-shaven — no mustache, no beard, no stubble; no glasses.",
  "HEAD: a snug plain matte black structured six-panel baseball cap with a curved brim, worn brim-forward, with no logo and no text;",
  "very short clipper-cut dark hair with natural salt-and-pepper graying visible only at the temples and the nape below the cap.",
  "BODY: medium, stocky, sturdy chef build of compact height with a confident calm posture; stylized proportions about 5.5–6 heads tall;",
  "strong expressive hands with slightly emphasized fingers.",
  "UNIFORM, total black: a matte black cotton chef jacket with an asymmetric double-breasted front and a mandarin stand collar,",
  "one small round metal snap just below the collar and one on the wearer's left chest;",
  "sleeves neatly rolled to mid-forearm and fastened with button tabs that show small metal snaps;",
  "a long matte black bib apron worn over the jacket with a neck strap, a horizontal seam at the waist, a hem that falls below the knees,",
  "and a small white woven label on the hip pocket seam on the wearer's left side (viewer's right when he faces the camera);",
  "straight matte black chef trousers;",
  "dark navy-blue clog-style kitchen shoes (Crocs-style) with a distinctive contrasting white-and-red stripe band around the sole.",
].join(" ");

// Стислий варіант для інструментів з лімітом довжини промпту (≈2500 символів).
export const CHARACTER_LOCK_COMPACT_EN =
  "Chef Sian (same character as in the reference images): East Asian Chinese man about 50, soft round-oval face, warm tan skin, kind calm look, dark almond eyes, warm crow's-feet smile lines, clean-shaven with no beard or mustache, no glasses; plain matte black baseball cap with no logo, very short graying salt-and-pepper hair at the temples; stocky sturdy build; matte black chef jacket with mandarin collar, sleeves rolled to the elbows with metal snap tabs; long black bib apron with a small white label at the hip; black trousers; dark navy-blue clogs (Crocs-style) with a white-and-red sole stripe.";

const STYLE_COMPACT_EN =
  "Stylized 3D animated feature film look (Pixar / DreamWorks quality), subsurface skin, matte cotton, glossy sauce, volumetric steam and fire, cinematic depth of field, warm professional stainless-steel restaurant kitchen with a large hood and round air duct, warm overhead LED light.";

const COMPOSITION_COMPACT_EN =
  "Vertical 9:16. Keep the face and main action in the central safe zone (13–87% width, 33–67% height); only background in the top 32% and below 68%. No text or captions in the image.";

export const CHARACTER_LOCK_UK = [
  "ПЕРСОНАЖ — Шеф Сян, той самий єдиний персонаж у кожному кадрі, звірений із референсними фото:",
  "чоловік східноазійської (китайської) зовнішності близько 50 років у теплій стилізованій 3D-анімації (не карикатура).",
  "ОБЛИЧЧЯ: м'яке округло-овальне, повні щоки, тепла засмагла шкіра середнього тону із subsurface scattering;",
  "спокійний привітний харизматичний вираз; темно-карі мигдалеподібні очі, що в усмішці звужуються у теплі півмісяці;",
  "виразні «гусячі лапки» біля зовнішніх кутиків очей і м'які носогубні складки; природні темні брови середньої густоти;",
  "повністю гладко поголений — без вусів, бороди і щетини; без окулярів.",
  "ГОЛОВА: щільна однотонна матова чорна структурована бейсболка з вигнутим козирком, козирком уперед, без логотипа й написів;",
  "дуже коротке темне волосся з сивиною «сіль із перцем» видно лише на скронях і потилиці.",
  "ТІЛО: середня кремезна стійка статура, компактний зріст, впевнена спокійна постава; пропорції ~5.5–6 голів;",
  "сильні виразні руки з трохи акцентованими пальцями.",
  "УНІФОРМА, тотал-блек: матовий чорний бавовняний кітель асиметричного двобортного крою з коміром-стійкою,",
  "маленька кругла металева кнопка під коміром і ще одна на грудях; рукави підкочені до середини передпліччя на хлястиках із металевими кнопками;",
  "довгий матовий чорний фартух із нагрудником, шийною бретелею, горизонтальним швом на талії, довжиною нижче колін,",
  "з маленькою білою тканою биркою на шві кишені біля стегна (справа від глядача, ліве стегно персонажа);",
  "прямі матові чорні кухарські штани;",
  "темно-сині сабо / крокси з контрастною біло-червоною смугою по периметру підошви.",
].join(" ");

export const STYLE_LOCK_EN = [
  "STYLE — stylized 3D animated feature film still/shot at the quality level of modern Pixar and DreamWorks features:",
  "warm lifelike proportions, expressive facial acting, physically based rendering, subsurface scattering on skin,",
  "realistic matte cotton cloth with visible weave and soft folds, brushed stainless steel with anisotropic reflections,",
  "glossy sauce with sharp specular highlights, volumetric steam and physically plausible fire,",
  "cinematic depth of field, filmic color grade with warm highlights, global illumination, path-traced look.",
].join(" ");

export const ENVIRONMENT_LOCK_EN = [
  "ENVIRONMENT — the authentic professional kitchen of the Asian restaurant «Китайський Привіт»:",
  "a narrow galley between two lines of matte brushed stainless-steel counters and equipment, stainless-steel clad walls,",
  "a massive stainless extraction hood with baffle filters and a large round corrugated air duct under the ceiling,",
  "warm overhead linear LED lights, light beige square floor tiles with dark grout,",
  "shelves with plastic prep containers in the background, plastic squeeze bottles of sauces on the counter,",
  "a wok station with a powerful gas burner and a heavy seasoned carbon-steel wok with a long wooden handle.",
].join(" ");

export const NEGATIVE_PROMPT_EN = [
  "glasses, sunglasses, mustache, beard, stubble, goatee, earrings, tattoos,",
  "white chef coat, chef toque, tall chef hat, bandana, backwards cap, logo on cap, text on cap, embroidery on cap,",
  "long hair, fringe, fully black hair, fully white hair, young man, teenager, elderly man, thin body, bodybuilder body,",
  "short waist apron, apron without bib, long sleeves down to the wrists, sleeveless,",
  "sneakers, boots, black shoes, white shoes, sandals, barefoot,",
  "second chef, duplicate person, crowd, extra fingers, fused fingers, deformed hands, extra limbs, face distortion, identity change,",
  "photorealistic live action, uncanny valley, anime, 2D cartoon, flat cel shading, clay look, low-poly, caricature, exaggerated ethnic features, angry yelling chef,",
  "on-screen text, captions, subtitles, letters, watermark, logo overlay, UI, frame border, letterbox, horizontal 16:9 framing, blurry face, face cropped by frame edge",
].join(" ");

const REFERENCE_IMAGES = [
  { file: "characters/reference/IMG_3464.png", role: "Портрет з фірмовою усмішкою, крій кітеля, кнопки, бирка", weight: "primary_face" },
  { file: "characters/reference/IMG_3463.png", role: "Повний зріст: пропорції, фартух, штани, сабо", weight: "primary_body" },
  { file: "characters/reference/IMG_3462.png", role: "Повний зріст (дубль), кухня", weight: "body" },
  { file: "characters/reference/IMG_3461.png", role: "Профіль: кепка, скроня, потилиця, хлястик рукава", weight: "profile" },
  { file: "characters/reference/IMG_3460.png", role: "Анфас нейтральний, руки в замку", weight: "face" },
  { file: "characters/reference/IMG_3459.png", role: "Анфас нейтральний (дубль)", weight: "face" },
  { file: "characters/reference/IMG_3458.png", role: "Три чверті, усмішка вбік", weight: "three_quarter" },
  { file: "characters/reference/IMG_3457.png", role: "Три чверті (дубль)", weight: "three_quarter" },
  { file: "characters/reference/IMG_3456.png", role: "Три чверті, сміх", weight: "expression" },
  { file: "characters/reference/IMG_3455.png", role: "Три чверті, сміх: очі-півмісяці, «гусячі лапки»", weight: "expression" },
];

// Безпечна зона 9:16 (1080×1920): X 140–940, Y 260–1520.
const SAFE_ZONE = {
  frame_px: { width: 1080, height: 1920 },
  safe_zone_px: { x_min: 140, x_max: 940, y_min: 260, y_max: 1520 },
  safe_zone_pct: { x_min: 13, x_max: 87, y_min: 13.5, y_max: 79 },
  bands_pct_of_height: {
    platform_ui_top: "0–13.5 % — лише тло (стеля, витяжка)",
    title_and_chips_overlay: "13.5–32 % — тут ляжуть заголовок і плашки інгредієнтів: лише тло, без обличчя",
    picture_clear: "33–67 % — обличчя шефа і головна дія",
    subtitles_overlay: "68–79 % — тут ляжуть субтитри: другорядні деталі (фартух, стільниця)",
    platform_ui_bottom: "79–100 % — інтерфейс Shorts/Reels/TikTok: лише тло",
  },
};

const SAFE_ZONE_BASE_EN =
  "COMPOSITION — vertical 9:16 frame, 1080x1920. Keep every important element inside the central safe zone: horizontally between 13% and 87% of the frame width, vertically between 13.5% and 79% of the frame height. " +
  "The top 32% of the frame holds only background (ceiling, hood, air duct) because a title and ingredient labels will be overlaid there. " +
  "The band between 68% and 79% of the height holds only secondary detail because subtitles will be overlaid there. " +
  "Nothing important below 79% or within 13% of the left and right edges. No text, letters or captions anywhere in the image.";

const prompt = (...parts) => parts.filter(Boolean).join("\n\n");

// ─────────────────────────────────────────────────────────────────────────────
// 2. Turnaround sheet
// ─────────────────────────────────────────────────────────────────────────────

const TURNAROUND_BG =
  "BACKGROUND — clean neutral warm-gray seamless studio backdrop (#B8B2A8), soft even three-point studio lighting with a gentle warm rim light, soft contact shadow on the floor, no props, no text, no labels.";

const turnaroundViews = [
  {
    id: "turnaround_front",
    title_uk: "Анфас, повний зріст",
    aspect_ratio: "2:3",
    reference_images: ["IMG_3463", "IMG_3460", "IMG_3464"],
    pose_en:
      "VIEW — full-body front view (0°), orthographic-like 85mm lens, camera at chest height. Neutral A-pose relaxed into his natural stance: feet shoulder-width apart, arms hanging slightly away from the body, calm friendly neutral expression with a hint of a smile, looking straight at the camera. The whole figure from the cap to the soles is in frame with margin; both navy-blue clogs with the white-and-red sole stripe are fully visible; the small white label is visible on the apron at the hip on the viewer's right.",
  },
  {
    id: "turnaround_profile",
    title_uk: "Профіль, повний зріст",
    aspect_ratio: "2:3",
    reference_images: ["IMG_3461", "IMG_3463"],
    pose_en:
      "VIEW — full-body strict side profile (90°, facing screen right), orthographic-like 85mm lens, camera at chest height. Same relaxed standing pose, arms at his sides. Shows the curved cap brim silhouette, the short salt-and-pepper hair at the temple and nape, the fully uncovered ear, the mandarin collar, the rolled sleeve with its button tab and metal snap on the outer arm, the apron neck strap, the apron hem below the knee, straight black trousers and the side of the navy-blue clog with the white-and-red sole stripe.",
  },
  {
    id: "turnaround_three_quarter",
    title_uk: "Три чверті, повний зріст",
    aspect_ratio: "2:3",
    reference_images: ["IMG_3458", "IMG_3456", "IMG_3463"],
    pose_en:
      "VIEW — full-body three-quarter view (45°, body turned toward screen right, face turned to the camera), 85mm lens, camera at chest height. Hands loosely clasped in front of him at waist level — his signature calm pose. Gentle closed-mouth smile. The whole figure is in frame including both navy-blue clogs with the white-and-red sole stripe.",
  },
  {
    id: "turnaround_back",
    title_uk: "Вид ззаду, повний зріст",
    aspect_ratio: "2:3",
    reference_images: ["IMG_3461", "IMG_3463"],
    pose_en:
      "VIEW — full-body back view (180°), orthographic-like 85mm lens. Shows the back of the plain black cap with its adjustment strap, the clipper-cut salt-and-pepper hair at the nape, the apron neck strap and waist ties knotted at the back, the plain back of the black chef jacket, straight black trousers and the heels of the navy-blue clogs with the white-and-red sole stripe.",
  },
  {
    id: "full_body_hero_crocs",
    title_uk: "Повний зріст на кухні — темно-сині крокси з біло-червоною смугою",
    aspect_ratio: "9:16",
    reference_images: ["IMG_3463", "IMG_3462"],
    environment: true,
    pose_en:
      "VIEW — full-body hero shot, front view, 35mm lens at waist height, standing in the middle of the kitchen aisle exactly like in the full-body reference photo: feet shoulder-width apart on the beige tiled floor, arms relaxed at his sides, calm confident friendly look to the camera. The figure occupies 26% to 66% of the frame height. The dark navy-blue clog-style shoes with the white-and-red stripe band around the sole are sharp, well lit and unmistakable; the apron hem falls below the knees; straight black trousers break softly over the shoes.",
  },
  {
    id: "portrait_signature_smile",
    title_uk: "Портрет із фірмовою усмішкою",
    aspect_ratio: "4:5",
    reference_images: ["IMG_3464", "IMG_3455", "IMG_3456"],
    pose_en:
      "VIEW — head-and-shoulders portrait, front view, 85mm lens, shallow depth of field, eyes in sharp focus. His signature wide, sincere, warm smile showing the upper teeth; eyes narrowed into warm crescents; crow's-feet smile lines and nasolabial folds at their most expressive; cheeks lifted. The cap brim casts only a soft shadow on the forehead — both eyes stay clearly lit with a bright catchlight. Mandarin collar and the metal snap below it are visible.",
  },
  {
    id: "expression_sheet",
    title_uk: "Аркуш міміки (5 виразів)",
    aspect_ratio: "16:9",
    reference_images: ["IMG_3464", "IMG_3460", "IMG_3455", "IMG_3458"],
    pose_en:
      "VIEW — expression sheet: five head-and-shoulders busts of the same character in a single row, identical scale, identical lighting, identical cap and collar: (1) calm friendly neutral with closed lips; (2) signature wide sincere smile with crescent eyes; (3) laughing while looking off to the side in three-quarter view; (4) playful warm wink with one eye closed; (5) focused concentration with slightly lowered brows and closed lips, never angry. Crow's-feet lines visible in all smiling expressions. No labels, no text.",
  },
  {
    id: "detail_callouts",
    title_uk: "Аркуш деталей (взуття, кепка, кнопки, бирка, руки)",
    aspect_ratio: "16:9",
    reference_images: ["IMG_3463", "IMG_3464", "IMG_3461"],
    pose_en:
      "VIEW — detail sheet of the same character, six separate close-up tiles on one sheet: (1) the pair of dark navy-blue clog-style shoes in three-quarter view showing the white-and-red stripe band around the sole and ventilation holes on top, no logos; (2) the plain matte black six-panel baseball cap, front and side, no logo; (3) the mandarin collar with the asymmetric front and two small round metal snaps; (4) the rolled sleeve at mid-forearm with the button tab and its metal snap; (5) the apron waist seam with the small white woven label at the hip pocket; (6) his strong hands holding a Chinese cleaver with a wooden handle. No labels, no text.",
  },
];

const turnaroundMaster =
  "VIEW — professional 3D character turnaround model sheet on one wide canvas: five figures of the same character at identical scale standing on one ground line, from left to right: full-body front view, full-body three-quarter view, full-body side profile, full-body back view, and a larger head-and-shoulders portrait with his signature warm sincere smile. Identical face, identical age, identical cap, identical uniform and identical shoes in every figure. In every full-body figure the dark navy-blue clog-style shoes with the white-and-red sole stripe are fully visible. No labels, no text, no arrows.";

const characterFile = {
  _generated_by: "tools/build-prompts.mjs — не редагуйте вручну, змінюйте джерело і запускайте `npm run prompts`",
  version: "1.0",
  character_id: "chef_sian",
  display_name_uk: "Шеф Сян",
  brand: "Китайський Привіт",
  bible: "characters/chef_sian_3d.md",
  priority: "ZERO CHARACTER DRIFT — максимальна портретна схожість із референсними фото у кожному кадрі",
  reference_images: REFERENCE_IMAGES,
  reference_usage_uk: [
    "Завжди прикріплюйте фото як image / character reference (IP-Adapter, character reference, «elements», «subject reference» — залежно від інструмента). Текстовий опис лише закріплює те, що вже є на фото.",
    "Мінімальний набір: IMG_3464 (обличчя з усмішкою) + IMG_3463 (повний зріст) + IMG_3461 (профіль).",
    "Використовуйте оригінали фото, обрізані до самої людини (без інтерфейсу телефона).",
    "Після затвердження turnaround sheet саме він стає головним референсом для сцен разом з 1–2 фото обличчя.",
  ],
  character_lock_en: CHARACTER_LOCK_EN,
  character_lock_uk: CHARACTER_LOCK_UK,
  character_lock_compact_en: CHARACTER_LOCK_COMPACT_EN,
  style_lock_en: STYLE_LOCK_EN,
  environment_lock_en: ENVIRONMENT_LOCK_EN,
  negative_prompt_en: NEGATIVE_PROMPT_EN,
  palette_hex: {
    uniform_black: "#141416",
    skin_base: "#C68E63",
    skin_light: "#E2B089",
    skin_shadow: "#8F5F42",
    eyes: "#3A2415",
    clogs_navy: "#232F4B",
    sole_stripe_white: "#F2F2F0",
    sole_stripe_red: "#D8342B",
  },
  generation_settings: {
    reference_strength: "0.75–0.9 для обличчя (character / face reference), 0.5–0.65 для стилю",
    guidance: "Середній CFG / prompt adherence; надто високий ламає стилізацію і дає uncanny-фотореалізм",
    resolution: "Не менше 2048 px по довгій стороні для аркушів; сцени — 1080×1920",
    seed: "Зафіксуйте seed затвердженого turnaround і перевикористовуйте його для всіх кадрів",
    batch: "Генеруйте по 4 варіанти, відбирайте за чеклістом з розділу 11 біблії персонажа",
  },
  turnaround_sheet: {
    master_prompt_en: prompt(STYLE_LOCK_EN, CHARACTER_LOCK_EN, turnaroundMaster, TURNAROUND_BG),
    master_aspect_ratio: "16:9",
    negative_prompt_en: NEGATIVE_PROMPT_EN,
    views: turnaroundViews.map((v) => ({
      id: v.id,
      title_uk: v.title_uk,
      aspect_ratio: v.aspect_ratio,
      reference_images: v.reference_images,
      prompt_en: prompt(
        STYLE_LOCK_EN,
        CHARACTER_LOCK_EN,
        v.pose_en,
        v.environment
          ? ENVIRONMENT_LOCK_EN +
            " LIGHTING — warm overhead LED key light (about 3300K), soft bounce from the stainless steel, gentle rim light separating the black uniform from the background."
          : TURNAROUND_BG,
      ),
      negative_prompt_en: NEGATIVE_PROMPT_EN,
    })),
  },
  consistency_workflow_uk: [
    "1. Згенеруйте `portrait_signature_smile` з референсами обличчя; доведіть до портретної схожості (чекліст, розділ 11 біблії).",
    "2. Із затвердженим портретом як референсом згенеруйте `turnaround_front`, `turnaround_profile`, `turnaround_three_quarter`, `turnaround_back`.",
    "3. Згенеруйте `full_body_hero_crocs` і `detail_callouts` — зафіксуйте взуття, кнопки, бирку.",
    "4. Зберіть майстер-аркуш (`master_prompt_en`) або складіть його з окремих видів.",
    "5. Для кожної сцени подавайте як референс: майстер-аркуш + портрет + стартовий кадр сцени (image-to-video).",
    "6. Якщо інструмент підтримує тренування персонажа (LoRA / «Soul ID» / character sheet) — тренуйте на 15–25 затверджених 3D-кадрах, а не на фото.",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Сцени
// ─────────────────────────────────────────────────────────────────────────────

const LIGHT_KITCHEN =
  "LIGHTING — warm overhead linear LED key light from above (about 3300K) with soft specular streaks on the brushed steel; soft warm bounce fill from the counters; a subtle cooler rim light from the hood separating the black uniform and black cap from the background; the eyes stay clearly lit under the cap brim with a bright catchlight; gentle bloom on highlights; filmic contrast.";

const scenes = [
  {
    scene_id: "scene_01",
    shot_id: "scene_01",
    name_uk: "Хук",
    time_range_sec: [0, 3],
    slot_duration_sec: 3,
    generate_clip_sec: 5,
    playback_uk:
      "Генеруйте 5 с у звичайній швидкості з уже «вбудованим» slow-motion; пайплайн візьме перші 3 с. Якщо наїзд триває довше — пришвидшіть через `video.playback_rate` у сценарії.",
    summary_uk:
      "Наїзд камери від загального плану (шеф на повний зріст, видно сабо) до середнього: у слоу-мо він підкидає золотисту курку у воку над полум'ям, усміхається і підморгує в камеру.",
    reference_images: ["turnaround_sheet", "IMG_3464", "IMG_3463"],
    action_en:
      "ACTION — Chef Sian stands at the wok station, body turned three-quarters toward the wok, gripping the long wooden handle of the heavy carbon-steel wok with one hand. With a confident flick of the wrist he tosses crispy golden-brown bite-size pieces of fried chicken high above the wok; in slow motion the pieces hang in the air above licking tongues of orange flame, tiny droplets of oil and crumbs of crust sparkling around them. He turns his face to the camera, breaks into his signature warm sincere smile and gives one friendly wink.",
    camera_en:
      "CAMERA — fast dynamic dolly-in with a slight crane-down: starts on a wide full-body shot where the whole chef is visible from cap to shoes (figure between 26% and 64% of the frame height, the navy-blue clogs with the white-and-red sole stripe clearly visible on the beige tiled floor), then pushes in within about 1.2 seconds to a waist-up medium shot and settles. 35mm lens feel tightening to 50mm, shallow depth of field, focus locked on his face; the toss and the wink play in 50% slow motion; subtle handheld energy, light motion blur on the push-in.",
    lighting_en:
      LIGHT_KITCHEN +
      " A strong warm orange key from the burner flame lights his face and the underside of the cap brim from below-side, flickering naturally.",
    fx_en:
      "PHYSICS AND FX — physically plausible wok-hei fire: turbulent orange-to-yellow flames with blue bases licking over the wok rim, heat haze distortion above the flame, glowing sparks, thin volumetric steam; chicken pieces follow a real parabolic arc with slight individual spin, crisp craggy cornstarch crust with micro-specular oil sheen; cloth of the apron and sleeves reacts subtly to the arm motion.",
    composition_en:
      SAFE_ZONE_BASE_EN +
      " In the final medium shot his face sits between 34% and 52% of the frame height, horizontally centered; the wok, flames and flying chicken sit between 46% and 66% of the height, inside the horizontal safe zone. In the opening wide shot his shoes are no lower than 65% of the frame height.",
    start_frame_en:
      "FRAME — opening frame of the shot: wide full-body view, the chef stands at the wok station holding the wok handle, flame under the wok, calm confident look, whole figure from cap to navy-blue clogs visible between 26% and 64% of the frame height.",
    end_frame_en:
      "FRAME — final frame of the shot: waist-up medium shot, golden chicken pieces frozen in mid-air above the flaming wok, the chef looks into the camera with his signature warm smile and a wink.",
    params: {
      camera: { move: "dolly-in + crane-down", lens_mm: "35→50", shot_size: "wide full body → medium (waist-up)", angle: "eye level, 3/4 front", slow_motion: "50 % на підкиданні", dof: "shallow, focus on face" },
      lighting: { key: "overhead LED 3300K", practical: "wok burner flame, warm orange, flicker", rim: "cool soft rim from hood", mood: "energetic, appetizing" },
      physics_fx: { fire: "turbulent wok flame, heat haze, sparks", steam: "thin volumetric", food: "parabolic toss, per-piece spin, crisp crust", cloth: "subtle secondary motion" },
    },
  },
  {
    scene_id: "scene_02",
    shot_id: "scene_02a",
    name_uk: "Підготовка — нарізка (вид зверху)",
    time_range_sec: [3, 5],
    slot_duration_sec: 2,
    generate_clip_sec: 5,
    playback_uk: "Генеруйте 5 с; пайплайн візьме найкращі 2 с (зсув задається `trim_start_sec` у сценарії) або пришвидшить кліп.",
    summary_uk: "Вид зверху: руки шефа китайським тесаком ритмічно нарізають соковите куряче стегно кубиками на білій дошці.",
    reference_images: ["turnaround_sheet", "detail_callouts", "IMG_3460"],
    action_en:
      "ACTION — seen from directly above: Chef Sian's strong hands work on a white cutting board set on a brushed stainless-steel counter. One hand holds a rectangular Chinese cleaver with a wooden handle, the other steadies a juicy boneless skinless chicken thigh with a proper claw grip. With fast, rhythmic, precise chops he cuts the thigh into even bite-size cubes; the cut cubes glisten and are swept aside with the flat of the blade. In this shot only his hands, forearms with the rolled black sleeves and their button tabs with metal snaps, and the top of the black bib apron are visible; the top of his black cap may enter the upper edge of the picture area.",
    camera_en:
      "CAMERA — locked-off top-down 90° overhead shot, 50mm lens feel, the cutting board fills the central picture area; crisp real-time speed, snappy rhythm, slight motion blur on the cleaver.",
    lighting_en:
      "LIGHTING — warm overhead linear LED key light (about 3300K) slightly off-axis so the cleaver blade catches a moving specular glint; soft shadows of the hands on the white board; warm bounce from the steel counter; clean appetizing contrast.",
    fx_en:
      "PHYSICS AND FX — raw chicken with realistic moist translucent surface and soft-body give under the blade; tiny droplets on the board; weighty cleaver motion with believable inertia; subtle skin deformation on the knuckles; no blood.",
    composition_en:
      SAFE_ZONE_BASE_EN +
      " The cutting board, the chicken and both hands sit between 34% and 66% of the frame height and inside the horizontal safe zone; the area above 32% shows only the steel counter.",
    start_frame_en:
      "FRAME — opening frame: top-down view of the white cutting board with a whole juicy chicken thigh, the cleaver raised a few centimeters above it, both hands in position.",
    params: {
      camera: { move: "locked-off", lens_mm: "50", shot_size: "overhead close", angle: "top-down 90°", slow_motion: "ні", dof: "medium" },
      lighting: { key: "overhead LED 3300K, off-axis", practical: "—", rim: "blade specular glint", mood: "clean, rhythmic" },
      physics_fx: { fire: "—", steam: "—", food: "moist raw chicken, soft-body cuts", cloth: "sleeve cuffs follow forearm motion" },
    },
  },
  {
    scene_id: "scene_02",
    shot_id: "scene_02b",
    name_uk: "Підготовка — маринад у соєвому соусі (45°)",
    time_range_sec: [5, 7],
    slot_duration_sec: 2,
    generate_clip_sec: 5,
    playback_uk: "Генеруйте 5 с; пайплайн візьме 2 с.",
    summary_uk: "Кут 45°: кубики курки падають у сталеву миску, зверху ллється темний соєвий соус, рука шефа перемішує.",
    reference_images: ["turnaround_sheet", "detail_callouts", "IMG_3460"],
    action_en:
      "ACTION — Chef Sian slides the chicken cubes off the cleaver blade into a brushed stainless-steel mixing bowl on the counter, then pours a thin glossy stream of dark soy sauce over them from a plastic squeeze bottle and tosses the pieces with his fingers so that every cube is coated in the dark marinade. His hands, forearms with rolled black sleeves and metal-snap tabs, and his black bib apron with the waist seam and the small white label are in frame; his face is above the picture area or just entering it, calm and focused.",
    camera_en:
      "CAMERA — 45° high-angle medium close-up from the front-side with a gentle push-in toward the bowl, 50mm lens feel, shallow depth of field, focus on the chicken; quick energetic real-time pace.",
    lighting_en:
      LIGHT_KITCHEN + " The soy sauce stream catches a sharp warm backlit highlight.",
    fx_en:
      "PHYSICS AND FX — viscous-thin fluid simulation for the soy sauce: a coherent stream that coils slightly, splashes in small droplets and pools dark and glossy between the cubes; wet specular highlights on the coated chicken; reflections of the overhead lights in the steel bowl.",
    composition_en:
      SAFE_ZONE_BASE_EN +
      " The bowl and hands sit between 40% and 66% of the frame height, horizontally centered; if his face is visible it sits between 33% and 45% of the height.",
    start_frame_en:
      "FRAME — opening frame: 45° view of the steel bowl with the first chicken cubes falling in from the cleaver blade, the squeeze bottle of soy sauce ready in the other hand.",
    params: {
      camera: { move: "gentle push-in", lens_mm: "50", shot_size: "medium close-up", angle: "45° high angle", slow_motion: "ні", dof: "shallow, focus on bowl" },
      lighting: { key: "overhead LED 3300K", practical: "—", rim: "backlit sauce stream", mood: "appetizing, glossy" },
      physics_fx: { fire: "—", steam: "—", food: "fluid sim for soy sauce, wet coating", cloth: "—" },
    },
  },
  {
    scene_id: "scene_02",
    shot_id: "scene_02c",
    name_uk: "Підготовка — обвалювання в крохмалі (45°)",
    time_range_sec: [7, 10],
    slot_duration_sec: 3,
    generate_clip_sec: 5,
    playback_uk: "Генеруйте 5 с; пайплайн візьме 3 с.",
    summary_uk: "Кут 45°: шеф щедро обвалює мариновані шматочки в кукурудзяному крохмалі — біла хмарка пилу; наприкінці задоволено киває.",
    reference_images: ["turnaround_sheet", "IMG_3464", "IMG_3460"],
    action_en:
      "ACTION — Chef Sian generously showers the marinated chicken cubes with white cornstarch from his hand and tosses them in a wide steel tray until every piece is evenly coated matte white; a soft cloud of starch dust puffs up and hangs in the warm light. He lifts a few coated pieces to show the dry, powdery, perfectly even coating, glances up toward the camera and gives a small satisfied nod with a gentle smile.",
    camera_en:
      "CAMERA — 45° medium shot from the front with a subtle pan following his hand, then a slight tilt-up to include his face for the nod; 40mm lens feel, shallow depth of field; real-time with a brief 70% slow-motion beat on the starch cloud.",
    lighting_en:
      LIGHT_KITCHEN + " The starch dust is backlit so each particle glows softly against the dark uniform.",
    fx_en:
      "PHYSICS AND FX — fine particle simulation for the cornstarch: a soft dusty plume with volumetric light scattering that settles slowly; a light dusting of starch on his fingertips; the coating on the chicken turns from wet dark to dry matte white; no starch on his face.",
    composition_en:
      SAFE_ZONE_BASE_EN +
      " His face sits between 33% and 50% of the frame height, horizontally centered; the tray, hands and starch cloud sit between 48% and 66% of the height.",
    start_frame_en:
      "FRAME — opening frame: 45° medium shot, the chef's hand full of white cornstarch poised above a steel tray of dark marinated chicken cubes, his focused calm face in the upper part of the picture area.",
    params: {
      camera: { move: "pan + slight tilt-up", lens_mm: "40", shot_size: "medium", angle: "45° front", slow_motion: "70 % на хмарці крохмалю", dof: "shallow" },
      lighting: { key: "overhead LED 3300K", practical: "—", rim: "backlit starch dust", mood: "light, tactile" },
      physics_fx: { fire: "—", steam: "—", food: "particle sim for starch, matte coating", cloth: "—" },
    },
  },
  {
    scene_id: "scene_03",
    shot_id: "scene_03",
    name_uk: "Смаження",
    time_range_sec: [10, 17],
    slot_duration_sec: 7,
    generate_clip_sec: 8,
    playback_uk: "Генеруйте 8 с (або 10 с); пайплайн візьме 7 с. Якщо модель дає лише 5 с — пайплайн сповільнить кліп до 7 с (це доречно для макро).",
    summary_uk:
      "Макро киплячої олії: шматочки курки занурюються, вкриваються золотистою скоринкою; шеф дістає їх шумівкою-павутинкою, камера піднімається до його задоволеного обличчя.",
    reference_images: ["turnaround_sheet", "IMG_3464", "IMG_3458"],
    action_en:
      "ACTION — extreme close-up at the surface of clear hot frying oil in the seasoned carbon-steel wok. Starch-coated chicken pieces drop into the oil one after another; the oil erupts instantly into a dense crown of fine bubbles around each piece, and within moments the pale coating turns into an appetizing craggy golden-brown crust. Then a metal spider skimmer with a wire mesh basket and a bamboo handle dips into the frame and Chef Sian lifts out a heap of crispy golden chicken; drops of oil fall back in sparkling strings. The camera rises with the skimmer to reveal his face: he looks at the chicken with a satisfied warm smile.",
    camera_en:
      "CAMERA — macro shot, 100mm lens feel at oil-surface level with very shallow depth of field and a slow push-in during the frying; then a smooth tilt-up following the skimmer to a medium close-up of the chef. The plunge into the oil plays in 60% slow motion.",
    lighting_en:
      "LIGHTING — warm overhead LED key (about 3300K) raking across the oil so that every bubble gets a sharp specular highlight; golden glow transmitted through the oil; warm orange practical glow from the burner under the wok; in the final medium close-up the face is lit by the warm key with a soft catchlight under the cap brim and a subtle cool rim light.",
    fx_en:
      "PHYSICS AND FX — high-resolution fluid simulation of deep-frying: vigorous nucleate bubbling around the food, rolling surface turbulence, tiny spatters, refraction and caustics in the oil; the crust visibly changes color from pale cream to golden brown and gains a blistered, craggy texture; light steam rising; oil drips forming and breaking under surface tension from the skimmer; no smoke, no burnt pieces.",
    composition_en:
      SAFE_ZONE_BASE_EN +
      " During the macro part the frying chicken sits between 36% and 66% of the frame height; in the final framing his face sits between 33% and 50% of the height and the skimmer with chicken between 50% and 66%, all horizontally inside the safe zone.",
    start_frame_en:
      "FRAME — opening frame: macro view of shimmering hot oil in the dark wok with the first starch-coated chicken piece just touching the surface and the first bubbles forming.",
    end_frame_en:
      "FRAME — final frame: medium close-up of the chef holding the spider skimmer full of crispy golden chicken above the wok, oil dripping, his satisfied warm smile.",
    params: {
      camera: { move: "slow push-in → tilt-up", lens_mm: "100 macro → 50", shot_size: "extreme close-up → medium close-up", angle: "oil-surface level → eye level", slow_motion: "60 % на зануренні", dof: "very shallow" },
      lighting: { key: "overhead LED 3300K, raking", practical: "burner glow under the wok", rim: "specular on bubbles", mood: "golden, sizzling" },
      physics_fx: { fire: "burner glow only", steam: "light", food: "deep-fry fluid sim, bubbling, crust color change, oil drips", cloth: "—" },
    },
  },
  {
    scene_id: "scene_04",
    shot_id: "scene_04",
    name_uk: "Глазурування у воку",
    time_range_sec: [17, 25],
    slot_duration_sec: 8,
    generate_clip_sec: 8,
    playback_uk: "Генеруйте 8 с (або 10 с); пайплайн візьме 8 с. Якщо модель обмежена 5 с — зніміть дві половини (аромати+соус / курка+підкидання) і склейте в один файл scene_04.mp4.",
    summary_uk:
      "Героїчний боковий ракурс: шеф кидає у вок часник, імбир і сушений чилі, вливає соєвий соус, рисовий оцет, додає цукор — соус карамелізується в глянцеву рубінову глазур, у якій він підкидає хрустку курку.",
    reference_images: ["turnaround_sheet", "IMG_3461", "IMG_3458"],
    action_en:
      "ACTION — heroic side view of the wok over a roaring burner. Chef Sian, seen in profile to three-quarter view behind and above the wok, throws minced garlic, minced ginger and whole dried red chilies into the hot wok — they sizzle and release a burst of fragrant steam. He pours in dark soy sauce from a plastic squeeze bottle, then clear rice vinegar, and adds a spoonful of sugar; the sauce boils violently and within a moment caramelizes into a thick, glossy, ruby-red glaze. He tips the crispy golden fried chicken back into the wok and, gripping the wooden handle, tosses everything with powerful practiced flicks of the wrist: every piece becomes lacquered in the shining ruby glaze while a tongue of flame leaps over the wok rim. His expression is focused and confident, with a slight pleased smile.",
    camera_en:
      "CAMERA — low heroic side angle with the wok large in the foreground and the chef rising behind it, 35mm lens feel, slow 15° orbit around the wok, shallow depth of field with focus pulling from the wok to his face and back; the final toss plays in 50% slow motion.",
    lighting_en:
      "LIGHTING — dramatic warm backlight through the steam and smoke creating glowing volumetric shafts; strong flickering orange key from the wok flame on his face, forearms and the front of the black apron; warm overhead LED fill (about 3300K) keeping the black uniform readable with soft sheen on the cotton; cool subtle rim on the cap; his eyes remain clearly lit under the brim.",
    fx_en:
      "PHYSICS AND FX — the sauce behaves as a real reducing glaze: rapid boil with large glossy bubbles, thickening into a viscous syrup that clings to the chicken in a mirror-like ruby-red coat with sharp specular highlights and slow stretchy drips; aromatics tumble with correct weight; physically plausible wok-hei flame flare with heat haze and sparks; dense volumetric steam catching the backlight; chicken pieces fly in a tight arc and land back in the wok.",
    composition_en:
      SAFE_ZONE_BASE_EN +
      " His face sits between 33% and 48% of the frame height; the wok, flame and flying glazed chicken sit between 46% and 66% of the height; everything inside the horizontal safe zone, with the wok handle not cropped by the frame edge.",
    start_frame_en:
      "FRAME — opening frame: low side view of the smoking-hot empty wok over the burner flame, the chef behind it in three-quarter profile with a small bowl of minced garlic, ginger and dried red chilies poised above the wok.",
    end_frame_en:
      "FRAME — final frame: glossy ruby-glazed chicken pieces suspended in the air above the wok with a flame flare behind them, the chef in three-quarter profile gripping the wooden wok handle with a confident pleased look.",
    params: {
      camera: { move: "slow 15° orbit", lens_mm: "35", shot_size: "medium (wok foreground)", angle: "low heroic side angle", slow_motion: "50 % на фінальному підкиданні", dof: "shallow, focus pulls wok ↔ face" },
      lighting: { key: "wok flame, flickering orange", practical: "burner", rim: "warm backlight through steam", mood: "heroic, dramatic, appetizing" },
      physics_fx: { fire: "wok-hei flare, heat haze, sparks", steam: "dense volumetric, backlit", food: "boiling sauce → viscous ruby glaze, clinging coat, stretchy drips", cloth: "apron and sleeves react to the toss" },
    },
  },
  {
    scene_id: "scene_05",
    shot_id: "scene_05",
    name_uk: "Подача та фінал",
    time_range_sec: [25, 30],
    slot_duration_sec: 5,
    generate_clip_sec: 5,
    playback_uk:
      "Генеруйте 5 с із першим і останнім кадром (start/end frame). Якщо модель не тримає від'їзд від макро до середнього плану — зніміть два кліпи (тарілка / шеф) і склейте в scene_05.mp4.",
    summary_uk:
      "Сповільнений дощ із кунжуту й зеленої цибулі падає на гарячу страву; камера від'їжджає на середній план шефа з тарілкою курки генерала Цо в руках і фірмовою доброю усмішкою.",
    reference_images: ["turnaround_sheet", "portrait_signature_smile", "IMG_3464"],
    action_en:
      "ACTION — close on a plate of hot General Tso's chicken: crispy pieces lacquered in glossy ruby-red glaze with a few dried red chilies, steam rising. In slow motion a rain of white sesame seeds and thin rings of fresh green scallion falls onto the dish; seeds bounce and stick to the glaze. The camera pulls back and tilts up to a medium shot: Chef Sian stands in the kitchen of «Китайський Привіт» holding the plate with both hands at chest level, slightly toward the camera, and looks straight into the lens with his signature kind, wide, sincere smile — eyes narrowed into warm crescents, crow's-feet smile lines clearly visible. He holds the smile, calm and proud, for the last second and a half.",
    camera_en:
      "CAMERA — starts as a macro three-quarter top view of the plate in 40% slow motion, then a smooth dolly-out with tilt-up to a waist-up medium shot at eye level, 50mm lens feel, shallow depth of field with the kitchen softly blurred behind him; the last 1.5 seconds are a stable, nearly static hero frame.",
    lighting_en:
      LIGHT_KITCHEN +
      " A soft warm key from the front-side shapes his face; the glaze on the chicken carries bright crisp highlights; gentle steam is backlit.",
    fx_en:
      "PHYSICS AND FX — particle simulation for sesame seeds and scallion rings with individual tumbling, bouncing and sticking to the viscous glaze; thin volumetric steam curling up from the hot dish; glossy ruby glaze with sharp speculars and subtle subsurface warmth; natural micro-motion in his face and breathing in the final hold.",
    composition_en:
      SAFE_ZONE_BASE_EN +
      " In the final medium shot his face sits between 34% and 52% of the frame height, horizontally centered; the plate sits between 54% and 66% of the height; his hands and the plate are fully inside the horizontal safe zone.",
    start_frame_en:
      "FRAME — opening frame: macro three-quarter top view of the plate of glossy ruby-glazed General Tso's chicken with steam, the first white sesame seeds and green scallion rings falling into frame from above. The chef is not yet visible except for his hands at the plate edge.",
    end_frame_en:
      "FRAME — final frame: waist-up medium shot of the chef in the restaurant kitchen, holding the garnished plate of General Tso's chicken with both hands at chest level, looking into the camera with his signature kind, wide, sincere smile.",
    params: {
      camera: { move: "dolly-out + tilt-up", lens_mm: "100 macro → 50", shot_size: "macro → medium (waist-up)", angle: "3/4 top → eye level", slow_motion: "40 % на дощі з кунжуту", dof: "shallow" },
      lighting: { key: "overhead LED 3300K + soft warm front-side key", practical: "—", rim: "cool soft rim from hood", mood: "warm, proud, inviting" },
      physics_fx: { fire: "—", steam: "thin volumetric from the dish", food: "particle sim sesame + scallion, sticky glaze", cloth: "—" },
    },
  },
];

const buildScene = (s) => {
  const base = [STYLE_LOCK_EN, CHARACTER_LOCK_EN, ENVIRONMENT_LOCK_EN];
  const tail = [s.lighting_en, s.fx_en, s.composition_en];
  const out = {
    scene_id: s.scene_id,
    shot_id: s.shot_id,
    name_uk: s.name_uk,
    time_range_sec: s.time_range_sec,
    slot_duration_sec: s.slot_duration_sec,
    generate_clip_sec: s.generate_clip_sec,
    output_file: `public/scenes/${s.shot_id}.mp4`,
    output_spec: { aspect_ratio: "9:16", resolution: "1080x1920", fps: 30, audio: "без звуку (звук додає пайплайн)" },
    playback_uk: s.playback_uk,
    summary_uk: s.summary_uk,
    reference_images: s.reference_images,
    video_prompt_en: prompt(...base, s.action_en, s.camera_en, ...tail),
    video_prompt_compact_en: [STYLE_COMPACT_EN, CHARACTER_LOCK_COMPACT_EN, s.action_en, s.camera_en, COMPOSITION_COMPACT_EN]
      .join(" ")
      .replace(/\b(?:ACTION|CAMERA) — (\w)/g, (_, c) => c.toUpperCase()),
    keyframe_start_prompt_en: prompt(...base, s.start_frame_en, s.camera_en, ...tail),
    ...(s.end_frame_en ? { keyframe_end_prompt_en: prompt(...base, s.end_frame_en, s.camera_en, ...tail) } : {}),
    negative_prompt_en: NEGATIVE_PROMPT_EN,
    parameters: {
      ...s.params,
      safe_zone: SAFE_ZONE,
    },
  };
  return out;
};

const scenesFile = {
  _generated_by: "tools/build-prompts.mjs — не редагуйте вручну, змінюйте джерело і запускайте `npm run prompts`",
  version: "1.0",
  project: "general_tso_30s",
  script: "scripts/general_tso_30s.json",
  character: "characters/chef_sian_prompts.json",
  output: { aspect_ratio: "9:16", resolution: "1080x1920", fps: 30, total_duration_sec: 30 },
  usage_uk: [
    "Кожен промпт самодостатній: у нього дослівно вшиті стиль, повний опис Шефа Сяна та опис кухні — нічого не треба дописувати.",
    "Рекомендований шлях — image-to-video: спершу згенеруйте стартовий кадр за `keyframe_start_prompt_en` (і фінальний за `keyframe_end_prompt_en`, якщо є) з референсами персонажа, затвердьте схожість, потім анімуйте за `video_prompt_en`.",
    "До кожної генерації прикріплюйте `reference_images` (turnaround sheet + фото з characters/reference/).",
    "`video_prompt_compact_en` — стисла версія (до ~2500 символів) для інструментів з лімітом довжини; у неї теж вшитий опис шефа.",
    "`negative_prompt_en` — у поле negative prompt; якщо його немає, додайте наприкінці промпту «Avoid: …».",
    "Жодного тексту в кадрі: заголовки, плашки і субтитри накладає пайплайн Remotion.",
    "Готові кліпи кладіть у `public/scenes/` під іменами з `output_file`.",
  ],
  locks: {
    character_lock_en: CHARACTER_LOCK_EN,
    character_lock_compact_en: CHARACTER_LOCK_COMPACT_EN,
    style_lock_en: STYLE_LOCK_EN,
    environment_lock_en: ENVIRONMENT_LOCK_EN,
    negative_prompt_en: NEGATIVE_PROMPT_EN,
  },
  safe_zone: SAFE_ZONE,
  scenes: scenes.map(buildScene),
};

const write = (rel, data) => {
  const file = resolve(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ ${rel}`);
};

write("characters/chef_sian_prompts.json", characterFile);
write("prompts/scenes_3d_generation.json", scenesFile);
