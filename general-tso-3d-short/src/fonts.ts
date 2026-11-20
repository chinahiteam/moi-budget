// Шрифти вшиті в проєкт через @fontsource (латиниця + кирилиця) — рендер не залежить від мережі.
import "@fontsource/roboto-slab/latin-800.css";
import "@fontsource/roboto-slab/latin-900.css";
import "@fontsource/roboto-slab/cyrillic-800.css";
import "@fontsource/roboto-slab/cyrillic-900.css";
import "@fontsource/jost/latin-600.css";
import "@fontsource/jost/latin-700.css";
import "@fontsource/jost/latin-800.css";
import "@fontsource/jost/cyrillic-600.css";
import "@fontsource/jost/cyrillic-700.css";
import "@fontsource/jost/cyrillic-800.css";

export const TITLE_FONT = '"Roboto Slab", serif';
export const SUBTITLE_FONT = '"Jost", sans-serif';

// Зразок містить і кирилицю, і латиницю/цифри — щоб браузер підвантажив обидва unicode-діапазони.
const SAMPLE = "Привіт Її Єґ 30 • «»—!";
const FACES = [
  '800 48px "Roboto Slab"',
  '900 48px "Roboto Slab"',
  '600 48px "Jost"',
  '700 48px "Jost"',
  '800 48px "Jost"',
];

export const loadFonts = async (): Promise<void> => {
  await Promise.all(FACES.map((face) => document.fonts.load(face, SAMPLE)));
  await document.fonts.ready;
};
