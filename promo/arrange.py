"""Монтаж музыки по нарастанию: куски трека по тактам, плавные склейки.
python arrange.py <mp3> <beats.json> <out-dir>
Пишет music_<cut>.wav и beats_<cut>.json (удары во времени ролика)."""
import json
import subprocess
import sys

import numpy as np

SRC, BEATS, OUT = sys.argv[1:4]
SR = 48000
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", SRC, "-f", "f32le", "-ac", "2", "-ar", str(SR), "pipe:1"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
beats = json.load(open(BEATS))["beats"]

# Куски — от такта до такта (время исходного трека).
CUTS = {
    "long": [(51.93, 57.26), (102.34, 118.60), (57.26, 67.94), (75.95, 81.27), (132.11, 150.79)],
    "reels": [(51.93, 57.26), (107.68, 115.68), (57.26, 67.94), (75.95, 81.27), (132.11, 142.78)],
}
XF = int(0.03 * SR)  # склейка 30 мс, равная мощность


def build(cut):
    parts, beat_out, offset = [], [], 0.0
    for start, end in CUTS[cut]:
        a, b = int(start * SR), int(end * SR)
        parts.append(audio[a - XF: b + XF].copy())
        for k, o in enumerate(beats):
            if start - 0.02 <= o["t"] < end - 0.02:
                prev = beats[k - 1] if k else None
                # Большой удар — громкость резко выросла: дроп, удар, кульминация.
                big = bool(prev and o["loud"] > prev["loud"] * 2.2 and o["loud"] > 0.12)
                beat_out.append({"t": round(offset + o["t"] - start, 3), "big": big})
        offset += end - start
    # Склейка: хвост прежнего куска уходит, начало нового входит.
    fade_out = np.cos(np.linspace(0, np.pi / 2, 2 * XF))[:, None]
    fade_in = np.sin(np.linspace(0, np.pi / 2, 2 * XF))[:, None]
    out = parts[0][XF:]
    for p in parts[1:]:
        tail = out[-XF:] if False else None
        joined_head = p[: 2 * XF] * fade_in
        out[-XF:] = out[-XF:]  # без изменений
        # Прежний кусок продлён на XF за свой конец — перекрываем 2*XF.
        overlap = out[-2 * XF:] * fade_out + joined_head
        out = np.concatenate([out[:-2 * XF], overlap, p[2 * XF:]])
    out = out[: int(offset * SR)]
    # Конец — затухание за последние 1,6 с; начало — мягкий вход 0,05 с.
    n = int(1.6 * SR)
    out[-n:] *= np.linspace(1, 0, n)[:, None] ** 1.5
    m = int(0.05 * SR)
    out[:m] *= np.linspace(0, 1, m)[:, None]
    pcm = (np.clip(out, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ac", "2", "-ar", str(SR), "-i", "pipe:0", f"{OUT}/music_{cut}.wav"], input=pcm, check=True)
    json.dump({"duration": round(offset, 3), "beats": beat_out}, open(f"{OUT}/beats_{cut}.json", "w"))
    bigs = [b["t"] for b in beat_out if b["big"]]
    print(f"{cut}: {offset:.2f} с, ударов {len(beat_out)}, больших {bigs}")


for cut in CUTS:
    build(cut)
