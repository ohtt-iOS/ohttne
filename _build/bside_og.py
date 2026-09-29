#!/usr/bin/env python3
"""SIDE B 공유 카드(bside/og.png 1200×630)와 파비콘·터치 아이콘을 그린다.  python3 _build/bside_og.py"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "bside")
HOME_FONTS = os.path.expanduser("~/Library/Fonts")
BG, INK, GREY = "#0a0a0a", "#ffffff", "#9a9a9a"


def font(name, size):
    """Pretendard(설치돼 있으면) → Apple SD Gothic Neo 순으로 찾는다."""
    cands = {
        "black": [(f"{HOME_FONTS}/Pretendard-ExtraBold.otf", 0), ("/System/Library/Fonts/AppleSDGothicNeo.ttc", 6)],
        "bold": [(f"{HOME_FONTS}/Pretendard-Bold.otf", 0), ("/System/Library/Fonts/AppleSDGothicNeo.ttc", 6)],
        "medium": [(f"{HOME_FONTS}/Pretendard-Medium.otf", 0), ("/System/Library/Fonts/AppleSDGothicNeo.ttc", 2)],
        "mono": [("/System/Library/Fonts/Menlo.ttc", 0), ("/System/Library/Fonts/Supplemental/Courier New.ttf", 0)],
    }[name]
    for path, idx in cands:
        if os.path.exists(path):
            return ImageFont.truetype(path, size, index=idx)
    raise SystemExit(f"font not found: {name}")


def tracked(d, xy, text, f, fill, tracking, stroke=0, stroke_fill=None):
    """자간을 줄여서 한 글자씩 그린다(Pillow엔 letter-spacing이 없다). 끝 x를 돌려준다."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
        x += d.textlength(ch, font=f) + tracking
    return x


def og():
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    mono = font("mono", 20)
    d.text((56, 46), "SIDE B", font=mono, fill=INK)
    d.text((W - 56, 46), "1인 개발자 모임", font=font("medium", 21), fill=GREY, anchor="ra")

    big = font("black", 236)
    tr = -236 * 0.06
    x = tracked(d, (48, 120), "SIDE", big, INK, tr)
    x += 236 * 0.18
    d.text((x, 120), "B", font=big, fill=BG, stroke_width=7, stroke_fill=INK)      # B면 = 뒤집힌 면(외곽선)

    d.text((56, 418), "혼자 개발하는 사람들끼리 같이 얘기해요.", font=font("bold", 44), fill=INK)
    d.text((58, 486), "앱이나 웹을 직접 만들고 있는 20–30대 여성 개발자분들을 찾고 있어요.", font=font("medium", 25), fill=GREY)
    d.text((56, H - 68), "ohttne.com/bside", font=mono, fill=GREY)
    d.text((W - 56, H - 68), "Ohtt", font=mono, fill=GREY, anchor="ra")
    im.save(os.path.join(OUT, "og.png"), optimize=True)
    print("wrote bside/og.png")


def icons():
    for size, name in [(64, "favicon.png"), (180, "apple-touch-icon.png")]:
        S = size * 4
        im = Image.new("RGB", (S, S), BG)
        d = ImageDraw.Draw(im)
        f = font("black", int(S * 0.74))
        d.text((S / 2, S / 2 + S * 0.02), "B", font=f, fill=INK, anchor="mm")
        im.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name), optimize=True)
    print("wrote bside/favicon.png, bside/apple-touch-icon.png")


if __name__ == "__main__":
    og(); icons()
