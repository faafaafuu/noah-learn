"""Звук ролика: музыка + голос по своим местам, музыка приседает под голос.
python mix.py <reel-dir> <cut> <video.mp4> <out.mp4>"""
import subprocess
import sys

D, CUT, VIDEO, OUT = sys.argv[1:5]
VOICE = {
    "long": [("L1", 0.4), ("R2", 5.6), ("L4", 10.9), ("L5", 16.65), ("L6", 27.2), ("L8", 32.6), ("L10", 46.1)],
    "reels": [("R1", 0.4), ("R2", 5.6), ("R3", 9.6), ("R4", 13.6), ("R5", 24.3), ("R6", 29.6), ("R7", 35.0)],
}[CUT]

inputs = ["-i", VIDEO, "-i", f"{D}/music_{CUT}.wav"]
for key, _ in VOICE:
    inputs += ["-i", f"{D}/vo/{key}.wav"]
parts = []
for n, (key, at) in enumerate(VOICE):
    ms = int(at * 1000)
    parts.append(f"[{n + 2}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms},apad[v{n}]")
labels = "".join(f"[v{n}]" for n in range(len(VOICE)))
graph = ";".join(parts) + (
    f";{labels}amix=inputs={len(VOICE)}:normalize=0:duration=longest,"
    "highpass=f=90,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=3dB,"
    "equalizer=f=3500:t=q:w=1.2:g=2,asplit=2[vo][key];"
    "[1:a]volume=0.8[mus];"
    "[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450:makeup=1[duck];"
    "[duck][vo]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.2:LRA=9[a]"
)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", graph, "-map", "0:v", "-map", "[a]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", OUT], check=True)
print("готово", OUT)
