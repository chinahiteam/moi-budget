#!/usr/bin/env python3
"""Синтезує українську озвучку для кожної сцени локально, без хмарних сервісів.

Модель: Piper «uk_UA-ukrainian_tts-medium» (голоси lada / mykyta / tetiana).

    pip install piper-tts
    curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-uk_UA-ukrainian_tts-medium.tar.bz2
    tar -xjf vits-piper-uk_UA-ukrainian_tts-medium.tar.bz2
    python3 tools/tts_voiceover.py --model vits-piper-uk_UA-ukrainian_tts-medium/uk_UA-ukrainian_tts-medium.onnx

Текст береться з поля `voiceover_tts` сценарію (малі літери, наголоси позначені знаком U+0301).
Для кожної сцени темп мовлення підбирається так, щоб фраза вмістилася у свій слот.
Результат: public/audio/vo_scene_01.wav … vo_scene_05.wav
"""

import argparse
import io
import json
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
SPEAKERS = {"lada": 0, "mykyta": 1, "tetiana": 2}


def synthesize(voice: PiperVoice, text: str, speaker: int, speed: float) -> tuple[bytes, float]:
    """Повертає WAV-байти (без тиші на краях) і тривалість у секундах."""
    raw = io.BytesIO()
    with wave.open(raw, "wb") as wav:
        voice.synthesize_wav(text, wav, syn_config=SynthesisConfig(speaker_id=speaker, length_scale=1 / speed))
    raw.seek(0)
    with wave.open(raw, "rb") as wav:
        rate = wav.getframerate()
        samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype=np.int16)

    # Зрізаємо тишу на початку й у кінці, лишаючи по 20 мс запасу.
    loud = np.flatnonzero(np.abs(samples) > 400)
    if loud.size:
        pad = int(0.02 * rate)
        samples = samples[max(0, loud[0] - pad) : loud[-1] + pad]

    out = io.BytesIO()
    with wave.open(out, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(samples.tobytes())
    return out.getvalue(), len(samples) / rate


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", required=True, type=Path, help="шлях до uk_UA-ukrainian_tts-medium.onnx (поруч має лежати .onnx.json)")
    parser.add_argument("--speaker", default="mykyta", choices=SPEAKERS, help="голос (за замовчуванням mykyta)")
    parser.add_argument("--base-speed", type=float, default=1.05, help="базовий темп мовлення")
    parser.add_argument("--max-speed", type=float, default=1.6, help="найшвидший дозволений темп")
    parser.add_argument("--out-dir", type=Path, default=ROOT / "public" / "audio")
    args = parser.parse_args()

    voice = PiperVoice.load(args.model)
    script = json.loads((ROOT / "scripts" / "general_tso_30s.json").read_text(encoding="utf-8"))
    vo = script["meta"]["voiceover"]
    args.out_dir.mkdir(parents=True, exist_ok=True)

    for scene in script["scenes"]:
        available = scene["end_sec"] - scene["start_sec"] - vo["lead_in_sec"] - vo["tail_sec"]
        text = scene.get("voiceover_tts") or scene["voiceover"].lower().replace('"', "")
        speed = args.base_speed
        while True:
            data, duration = synthesize(voice, text, SPEAKERS[args.speaker], speed)
            if duration <= available or speed >= args.max_speed:
                break
            # Наступна спроба — рівно настільки швидше, наскільки фраза не вміщується (+2 % запасу).
            speed = min(args.max_speed, speed * duration / available * 1.02)

        out = args.out_dir / f"vo_{scene['id']}.wav"
        out.write_bytes(data)
        fits = "✓" if duration <= available else "✗ не вміщується — пайплайн прискорить додатково"
        print(f"{out.name}: {duration:.2f} с із {available:.2f} с, темп ×{speed:.2f} {fits}")


if __name__ == "__main__":
    main()
