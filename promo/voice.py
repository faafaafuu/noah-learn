"""Озвучка ролика нейроголосом (edge-tts): по фразе на сцену, WAV 48 кГц и
длительности в durations.json — в том виде, в каком их ждёт worker."""
import asyncio
import json
import os
import subprocess
import sys
import wave

import edge_tts

JOB = sys.argv[1]
VOICE = sys.argv[2] if len(sys.argv) > 2 else "ru-RU-SvetlanaNeural"
RATE = sys.argv[3] if len(sys.argv) > 3 else "+6%"
PITCH = sys.argv[4] if len(sys.argv) > 4 else "+2Hz"
PAD = 0.5


async def main():
    scenes = json.load(open(os.path.join(JOB, "scenes.json"), encoding="utf-8"))
    folder = os.path.join(JOB, "voice")
    os.makedirs(folder, exist_ok=True)
    durations = []
    for n, text in enumerate(scenes):
        mp3 = os.path.join(folder, f"{n:02d}.mp3")
        wav = os.path.join(folder, f"{n:02d}.wav")
        await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(mp3)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mp3, "-ar", "48000", "-ac", "1", wav], check=True)
        os.remove(mp3)
        with wave.open(wav) as sound:
            durations.append(round(sound.getnframes() / sound.getframerate() + PAD, 2))
        print(n, durations[-1], flush=True)
    json.dump(durations, open(os.path.join(JOB, "durations.json"), "w"))


asyncio.run(main())
