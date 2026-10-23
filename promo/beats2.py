"""Точная разметка ударов: онсеты + динамическое программирование (Эллис 2007),
сильные доли по акценту. python beats2.py music.pcm out.json"""
import json
import sys

import numpy as np

sr = 22050
x = np.fromfile(sys.argv[1], dtype=np.int16).astype(np.float32) / 32768
hop = 256
fps = sr / hop
n = len(x) // hop
frames = x[: n * hop].reshape(n, hop)
# Онсеты по мел-подобным полосам: поток спектра с логарифмом, низы весомее.
win = np.hanning(1024)
pad = np.concatenate([np.zeros(512), x, np.zeros(1024)])
spec = np.array([np.abs(np.fft.rfft(pad[i * hop: i * hop + 1024] * win)) for i in range(n)])
bands = np.array_split(np.arange(spec.shape[1]), 24)
banded = np.stack([spec[:, b].sum(1) for b in bands], 1)
logb = np.log1p(banded * 10)
flux = np.maximum(0, np.diff(logb, axis=0, prepend=logb[:1])).sum(1)
low = np.maximum(0, np.diff(logb[:, :4], axis=0, prepend=logb[:1, :4])).sum(1)
onset = flux - np.convolve(flux, np.ones(16) / 16, "same")
onset = np.maximum(onset, 0)
onset /= onset.std() + 1e-9

# Темп: автокорреляция онсетов, 60..180 BPM, предпочтение около 100.
ac = np.correlate(onset, onset, "full")[n - 1:]
lags = np.arange(len(ac))
bpm = 60 * fps / np.maximum(lags, 1)
weight = np.exp(-0.5 * (np.log2(bpm / 100) / 0.9) ** 2)
valid = (bpm > 60) & (bpm < 180)
period = int(lags[valid][np.argmax((ac * weight)[valid])])
print(f"темп {60 * fps / period:.2f} BPM, доля {period / fps:.4f} с")

# DP-трекинг.
alpha = 100
score = onset.copy()
back = np.full(n, -1)
for t in range(n):
    lo, hi = t - 2 * period, t - period // 2
    if hi <= 0:
        continue
    lo = max(lo, 0)
    prev = np.arange(lo, hi)
    pen = -alpha * np.log((t - prev) / period) ** 2
    cand = score[prev] + pen
    k = np.argmax(cand)
    score[t] = onset[t] + cand[k]
    back[t] = prev[k]
t = int(np.argmax(score[-2 * period:]) + n - 2 * period)
beats = []
while t >= 0:
    beats.append(t)
    t = back[t]
beats = np.array(beats[::-1])
times = beats / fps
# Акцент доли: низы + поток около удара.
acc = np.array([low[max(0, b - 2): b + 3].max() + flux[max(0, b - 2): b + 3].max() * 0.3 for b in beats])
# Сильная доля: фаза из 4, у которой средний акцент выше.
phase = int(np.argmax([acc[p::4].mean() for p in range(4)]))
down = [bool((i - phase) % 4 == 0) for i in range(len(beats))]
# Громкость вокруг удара — для «больших» ударов.
rms = np.sqrt((frames ** 2).mean(1))
loud = np.array([rms[b: b + int(fps * 0.25)].mean() for b in beats])
strong = acc > np.percentile(acc, 85)
out = [{"t": round(float(tt), 3), "down": d, "acc": round(float(a), 2), "big": bool(s), "loud": round(float(l), 3)} for tt, d, a, s, l in zip(times, down, acc, strong, loud)]
json.dump({"period": period / fps, "beats": out}, open(sys.argv[2], "w"))
d = np.diff(times)
print(f"ударов {len(times)}, шаг {d.mean():.4f}±{d.std():.4f} с, фаза сильной доли {phase}")
for lo, hi in [(50, 70), (57, 66)]:
    seg = [(o["t"], "D" if o["down"] else ".", "!" if o["big"] else "") for o in out if lo <= o["t"] <= hi]
    print(f"{lo}-{hi}:", " ".join(f"{t:.2f}{a}{b}" for t, a, b in seg))
