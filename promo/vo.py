"""Закадровый голос ролика: Светлана, MP3 96 кбит/с → WAV. Печатает длительности.
python vo.py <out-dir> <lines.json>"""
import asyncio
import json
import os
import subprocess
import sys
import wave

import edge_tts
from edge_tts import communicate

# 96 кбит/с вместо 48 — та же подмена, что в голосовом сервере.
TARGET = "audio-24khz-48kbitrate-mono-mp3"


def patched(code):
    consts, changed = [], False
    for const in code.co_consts:
        if isinstance(const, str) and TARGET in const:
            const, changed = const.replace(TARGET, "audio-24khz-96kbitrate-mono-mp3"), True
        elif hasattr(const, "co_consts"):
            inner = patched(const)
            changed = changed or inner is not const
            const = inner
        consts.append(const)
    return code.replace(co_consts=tuple(consts)) if changed else code


for value in vars(communicate.Communicate).values():
    if hasattr(value, "__code__"):
        value.__code__ = patched(value.__code__)

OUT, LINES = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)


async def main():
    lines = json.load(open(LINES, encoding="utf-8"))
    for key, item in lines.items():
        text, rate, pitch = item["text"], item.get("rate", "+6%"), item.get("pitch", "+2Hz")
        mp3 = os.path.join(OUT, f"{key}.mp3")
        wav = os.path.join(OUT, f"{key}.wav")
        await edge_tts.Communicate(text, "ru-RU-SvetlanaNeural", rate=rate, pitch=pitch).save(mp3)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp3, "-ar", "48000", "-ac", "1",
                        "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
                        wav], check=True)
        with wave.open(wav) as sound:
            seconds = sound.getnframes() / sound.getframerate()
        room = item.get("room")
        mark = "" if room is None or seconds <= room else f"  ДЛИННЕЕ на {seconds - room:.1f} с"
        print(f"{key}: {seconds:.2f} с (место {room}){mark}", flush=True)


asyncio.run(main())
