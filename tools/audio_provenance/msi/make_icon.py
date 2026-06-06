#!/usr/bin/env python3
"""Generate the AI SoundStripper app icon (multi-resolution .ico).

Design: a deep-blue rounded tile with a white audio waveform, crossed by a
dashed "strip" cut line and a small magenta accent dot - reads as
"audio, cleaned". Run:  python3 make_icon.py
"""
import math
from PIL import Image, ImageDraw

SIZE = 256
BG_TOP = (33, 118, 209)      # #2176d1
BG_BOT = (8, 30, 64)         # #081e40
WAVE = (255, 255, 255)
ACCENT = (233, 30, 140)      # magenta


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def vgradient(size, top, bot):
    base = Image.new("RGB", (size, size), top)
    d = ImageDraw.Draw(base)
    for y in range(size):
        t = y / (size - 1)
        d.line([(0, y), (size, y)],
               fill=tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return base


def build(size=SIZE):
    scale = size / 256.0
    img = vgradient(size, BG_TOP, BG_BOT).convert("RGBA")
    img.putalpha(rounded_mask(size, int(48 * scale)))
    d = ImageDraw.Draw(img)

    # Waveform bars: symmetric, smooth envelope.
    n = 13
    margin = 44 * scale
    span = size - 2 * margin
    bw = span / (n * 1.8)
    cx0 = margin + bw * 0.4
    midy = size / 2
    heights = [0.30, 0.55, 0.78, 0.95, 0.62, 0.40, 1.0, 0.45, 0.70, 0.92, 0.66, 0.48, 0.28]
    for i in range(n):
        x = cx0 + i * (span / n)
        h = heights[i] * (78 * scale)
        d.rounded_rectangle([x, midy - h, x + bw, midy + h],
                            radius=bw / 2, fill=WAVE)

    # Diagonal dashed "strip / cut" line.
    dash = 14 * scale
    gap = 9 * scale
    x = 30 * scale
    y = size - 34 * scale
    ex, ey = size - 30 * scale, 34 * scale
    length = math.hypot(ex - x, ey - y)
    ux, uy = (ex - x) / length, (ey - y) / length
    dist = 0
    while dist < length:
        sx, sy = x + ux * dist, y + uy * dist
        ed = min(dist + dash, length)
        d.line([(sx, sy), (x + ux * ed, y + uy * ed)],
               fill=ACCENT, width=int(8 * scale))
        dist += dash + gap

    # Accent dot.
    r = 11 * scale
    d.ellipse([ex - r, ey - r, ex + r, ey + r], fill=ACCENT)
    return img


def main():
    master = build(256)
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    master.save("aisoundstripper.ico", format="ICO", sizes=sizes)
    master.save("aisoundstripper.png")  # handy preview
    print("Wrote aisoundstripper.ico and aisoundstripper.png")


if __name__ == "__main__":
    main()
