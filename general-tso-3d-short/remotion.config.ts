import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");

// Фінальний файл: H.264 + AAC, yuv420p — сумісно з YouTube Shorts, Instagram Reels і TikTok.
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setCrf(17);
Config.setAudioCodec("aac");
Config.setAudioBitrate("192k");
Config.setEnforceAudioTrack(true);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);

// За замовчуванням Remotion сам завантажує Chrome Headless Shell. У середовищах без доступу
// до завантаження вкажіть власний бінарник: REMOTION_BROWSER_EXECUTABLE=/шлях/до/chrome-headless-shell
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
