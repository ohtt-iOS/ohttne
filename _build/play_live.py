#!/usr/bin/env python3
"""Google Play에 공개된 앱만 골라 홈페이지에 Google Play 링크를 단다(여러 번 돌려도 안전).

    python3 _build/play_live.py            # 확인 → 공개된 앱 반영 → 굽기 → 커밋·push
    python3 _build/play_live.py --dry-run  # 확인만

공개 판정: https://play.google.com/store/apps/details?id=<패키지> 가 200이면 공개(검토 중·비공개 테스트만이면 404).
반영: build.py APPS의 그 앱에 play= 링크, pills에 Android 최소 버전, cap Platform "iOS" → "iOS · Android".
이미 play=가 있는 앱은 건너뛴다. 출력 마지막 줄: "PENDING <키…>" 또는 "ALL_LIVE".
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "_build" / "build.py"

# 키 → (패키지, Android 최소 버전 — 각 앱 minSdk)
WATCH = {
    "threes": ("com.ohttne.threes", "Android 9+"),          # minSdk 28
    "photodesk": ("com.ohtt.photodesk.android", "Android 11+"),  # minSdk 30
}
NAMES = {"threes": "Threes", "photodesk": "아사진정리해야되는데"}


def play_url(pkg: str) -> str:
    return f"https://play.google.com/store/apps/details?id={pkg}"


def is_live(pkg: str) -> bool:
    req = urllib.request.Request(play_url(pkg) + "&hl=ko&gl=KR", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200
    except urllib.error.HTTPError as err:
        if err.code == 404:
            return False
        raise


def block_span(src: str, key: str) -> tuple[int, int]:
    """APPS 안에서 key="<key>"인 dict( … ), 블록의 시작·끝"""
    start = src.index(f'key="{key}"')
    start = src.rindex("dict(", 0, start)
    end = src.index("\n    ),", start) + len("\n    ),")
    return start, end


def has_play(src: str, key: str) -> bool:
    s, t = block_span(src, key)
    return "play=" in src[s:t]


def add_play(src: str, key: str) -> str:
    pkg, android = WATCH[key]
    s, t = block_span(src, key)
    block = src[s:t]
    # store= 줄 바로 다음에 play= 줄
    block, n = re.subn(r'(\n(\s+)poster="[^"]*", store="[^"]*",\n)',
                       lambda m: f'{m.group(1)}{m.group(2)}play="{play_url(pkg)}",\n', block, count=1)
    if n != 1:
        raise SystemExit(f"✗ {key}: store= 줄을 못 찾았다")
    # pills 끝에 Android (준비 중 표시가 있으면 바꾼다)
    m = re.search(r'pills=\[(.*?)\]', block)
    pills = [p.strip().strip('"') for p in m.group(1).split(",") if p.strip()]
    pills = [p for p in pills if not p.startswith("Android")] + [android]
    block = block[:m.start()] + "pills=[" + ", ".join(f'"{p}"' for p in pills) + "]" + block[m.end():]
    block = block.replace('("Platform", "iOS")', '("Platform", "iOS · Android")')
    block = block.replace('("Platform", "iOS · iPadOS")', '("Platform", "iOS · iPadOS · Android")')
    # Threes: 저장 위치 문구에 갤러리도
    block = block.replace("사진 앱에 저장돼요", "사진 앱·갤러리에 저장돼요")
    return src[:s] + block + src[t:]


def run(*cmd: str) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    src = BUILD.read_text(encoding="utf-8")
    live, pending = [], []
    for key, (pkg, _) in WATCH.items():
        if has_play(src, key):
            print(f"· {key}: 이미 링크 있음")
            continue
        ok = is_live(pkg)
        print(f"· {key}: {'공개됨' if ok else '아직 비공개'} ({play_url(pkg)})")
        (live if ok else pending).append(key)

    if live and not args.dry_run:
        run("git", "pull", "--ff-only", "-q")
        src = BUILD.read_text(encoding="utf-8")
        for key in live:
            if not has_play(src, key):
                src = add_play(src, key)
        BUILD.write_text(src, encoding="utf-8")
        run(sys.executable, "_build/build.py")
        run("git", "add", "-A")
        names = " · ".join(NAMES[k] for k in live)
        run("git", "commit", "-q", "-m", f"{names} Google Play 출시 반영 — Google Play 링크 연결")
        run("git", "push", "-q")
        print(f"✓ 반영·push: {', '.join(live)}")

    print("PENDING " + " ".join(pending) if pending else "ALL_LIVE")


if __name__ == "__main__":
    main()
