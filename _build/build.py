#!/usr/bin/env python3
"""Ohtt 홈페이지 생성기.

    python3 _build/build.py          # 페이지 전부 다시 굽기
    python3 _build/build.py --og     # + 공유 카드(og.png)·파비콘도 다시 그리기 (Pillow 필요)

앱을 추가하려면 APPS 에 항목 하나를 넣고, assets/apps/<key>.png(아이콘 256px)와
<key>-1.webp … <key>-N.webp(스크린샷 660px 폭)를 넣은 뒤 다시 굽는다.
`_` 로 시작하는 폴더는 GitHub Pages(Jekyll)가 배포에서 뺀다.
"""
import html, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://www.ohttne.com"
NAME = "Ohtt"
MAIL = "ohttangent@gmail.com"
INSTA = "https://www.instagram.com/ohtt_anyway/"
YEAR = "2026"

APPS = [
    dict(
        key="siori", title="Siori", ko="시오리", cat="독서 기록", new=False,
        poster="#f6efdc", store="https://apps.apple.com/kr/app/id6788732084",
        lead="책 읽다 좋았던 문장, 잊어버리기 전에. 읽는 중인 책과 마음에 남은 문장을 차곡차곡 모으는 독서 다이어리.",
        problem="여러 권을 동시에 읽다 보면 어디까지 읽었는지 헷갈리고, 좋았던 문장은 사진첩 어딘가로 사라집니다. 읽은 흔적이 흩어지지 않고 한곳에 남았으면 했어요.",
        solution="책마다 인용·메모·사진·포스트잇을 채팅하듯 남기고, 책 속 문장은 카메라로 스캔해 옮깁니다. 인물 관계도, 독서 잔디와 리딩 리시트, 집중 타이머, 단어장 위젯까지. 책 한 권을 읽는 과정 전체가 기록이 됩니다.",
        pills=["iOS 17.3+", "iPhone", "iPad", "Mac", "Android 준비 중"],
        extra=[("기능 둘러보기", "/siori/tour/")],
        cap=[("Released", "2026.08"), ("Platform", "iOS · iPadOS"), ("Price", "무료")],
        shots=["독서 노트", "지금 읽는 책 서재", "리딩 로그", "리딩 리시트", "인물 관계도", "집중 타이머", "단어장"],
        desc="책 읽다 좋았던 문장, 잊어버리기 전에. 인용·메모·사진 노트, 인물 관계도, 독서 잔디, 집중 타이머, 단어장까지 담은 독서 기록 앱 시오리.",
    ),
    dict(
        key="forband", title="ForBand", ko="포밴드", cat="밴드 합주 연습", new=False,
        poster="#1d1d1f", store="https://apps.apple.com/kr/app/id6793964973",
        lead="카피 연습부터 합주, 무대까지. 밴드 연습에 필요한 도구를 하나로 모은 주머니 속 연습실.",
        problem="합주 준비엔 앱이 너무 많이 필요했습니다. 느리게 듣는 플레이어, 메트로놈, 튜너, 녹음기, 세트리스트 메모까지 전부 따로따로였어요.",
        solution="음정은 그대로 두고 템포만 50–150%로, 피치는 ±6반음, 어려운 구간은 A-B 반복과 스피드 트레이너로. 변박 메트로놈과 베이스 저음까지 잡는 튜너, 노래를 틀어 둔 채 찍는 연주 영상, 공연 순서대로 이어지는 세트리스트를 한 앱에 담았습니다.",
        pills=["iOS 18+", "iPhone", "iPad"],
        extra=[],
        cap=[("Released", "2026.07"), ("Platform", "iOS · iPadOS"), ("Price", "₩5,900")],
        shots=["연습 플레이어", "메트로놈", "연주 영상 촬영", "튜너", "세트리스트"],
        desc="밴드 합주 연습의 모든 것. 템포·피치 조절 플레이어, 변박 메트로놈, 튜너, 연주 영상 촬영, 세트리스트를 하나에 담은 포밴드.",
    ),
    dict(
        key="photodesk", title="Photodesk", ko="아사진정리해야되는데", cat="사진 정리", new=True,
        poster="#0a0a0c", store="https://apps.apple.com/kr/app/id6808960253",
        lead="밀린 사진 정리, 하루치씩 가볍게. 날짜를 고르고 넘기다 보면 어느새 그날 정리가 끝나요.",
        problem="사진첩은 ‘언젠가 정리해야지’ 하는 사이 몇만 장이 됩니다. 한 번에 다 하려니 시작조차 못 하게 돼요.",
        solution="하루치만 꺼내서 남길 건 오른쪽, 지울 건 위로, 고민되면 왼쪽으로 넘깁니다. 비슷한 사진과 흔들린 사진은 앱이 먼저 찾아 주고, 넘긴 사진은 휴지통에 모였다가 확인을 눌러야 지워져요. 실수는 바로 되돌릴 수 있습니다.",
        pills=["iOS 18+", "iPhone"],
        extra=[],
        cap=[("Released", "2026.09"), ("Platform", "iOS"), ("Price", "무료")],
        shots=["날짜별 사진첩", "밀어서 보관·삭제", "폴더로 나누기", "하루치씩", "지우기 전에 한 번 더"],
        desc="밀린 사진 정리, 하루치씩 가볍게. 날짜를 골라 스와이프로 남기고 지우는 사진 정리 앱 아사진정리해야되는데(Photodesk).",
    ),
]

APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>'

EYES = ('<svg class="eyes" viewBox="0 0 72 40" aria-hidden="true" focusable="false">'
        '<g transform="translate(19 20)"><g class="eye"><ellipse class="white" rx="15" ry="18"/><g class="pp"><circle class="pupil" r="6.5"/></g></g></g>'
        '<g transform="translate(53 20)"><g class="eye"><ellipse class="white" rx="15" ry="18"/><g class="pp"><circle class="pupil" r="6.5"/></g></g></g>'
        '</svg>')

e = html.escape


def head(title, desc, path, intro=False):
    intro_js = ("try{if(!sessionStorage.getItem('ohtt-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches)"
                "document.documentElement.classList.add('intro')}catch(e){}") if intro else ""
    return f'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE}/assets/og.png">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{SITE}{path}">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0b" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/assets/site.css">
<script>document.documentElement.classList.add('js');{intro_js}</script>
</head>
<body>
<header class="nav">
  <div class="nav-l"><a href="/"><b class="nm">{NAME}</b></a><span>Indie App Studio</span></div>
  <nav class="nav-r"><a href="/">Apps</a><a href="/about/">About</a></nav>
</header>
<a class="eyes-link" href="/" aria-label="{NAME} 홈">{EYES}</a>
'''


def links():
    return (f'<a href="{INSTA}" target="_blank" rel="noopener">Instagram</a>'
            f'<a href="mailto:{MAIL}">Mail</a>'
            f'<a href="/privacy.html">Privacy</a>')


def index_rows(current=None, peek=True):
    rows = []
    for n, a in enumerate(APPS, 1):
        cur = ' cur' if a["key"] == current else ''
        pk = f' data-peek="/assets/apps/{a["key"]}-1.webp"' if peek else ''
        new = '<i>NEW</i>' if a["new"] else ''
        rows.append(
            f'    <li><a class="row{cur}" href="/{a["key"]}/"{pk}>'
            f'<span class="no">[{n:02d}]</span><span class="t">{e(a["title"])}</span>'
            f'<span class="badge"><img src="/assets/apps/{a["key"]}.png" alt="" width="27" height="27">'
            f'<span><b>{e(a["ko"])}{new}</b>{e(a["cat"])}</span></span></a></li>')
    return "\n".join(rows)


def tail(scripts=True, inapp=False):
    s = '<script src="/assets/site.js" defer></script>\n' if scripts else ''
    if inapp:
        s += '<script src="/assets/inapp-browser.js" defer></script>\n'
    return s + '</body>\n</html>\n'


def page_home():
    desc = f"1인 앱 스튜디오 {NAME}. 독서 기록 앱 시오리, 밴드 합주 연습 앱 포밴드, 사진 정리 앱 아사진정리해야되는데를 만듭니다."
    return head(f"{NAME} — 취미가 오래 가도록, 작은 앱을 만듭니다", desc, "/", intro=True) + f'''<main class="home">
  <div>
    <h1 class="sr">{NAME} — 앱 목록</h1>
    <ul class="index">
{index_rows()}
    </ul>
  </div>
</main>
<div class="corner l">{links()}</div>
<div class="corner r">©{YEAR}</div>
<div class="peek" aria-hidden="true"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></div>
''' + tail()


def page_app(a):
    pills = "".join(f'<span class="pill">{e(p)}</span>' for p in a["pills"])
    extra = "".join(f'<a class="pill ghost" href="{h}">{e(t)} ↗</a>' for t, h in a["extra"])
    cap = "".join(f'<span><b>{e(k)}</b>{e(v)}</span>' for k, v in a["cap"])
    shots = "\n".join(
        f'      <img src="/assets/apps/{a["key"]}-{i}.webp" alt="{e(a["ko"])} — {e(s)}" width="660" height="1434" loading="lazy">'
        for i, s in enumerate(a["shots"], 1))
    return head(f'{a["title"]} · {a["ko"]} — {NAME}', a["desc"], f'/{a["key"]}/') + f'''<main class="proj" style="--poster:{a["poster"]}">
  <h1 class="p-title">{e(a["title"])}</h1>
  <aside class="p-side">
    <p class="ko">{e(a["ko"])} — {e(a["cat"])}</p>
    <p class="lead">{e(a["lead"])}</p>
    <h2>The Problem</h2>
    <p>{e(a["problem"])}</p>
    <h2>The Solution</h2>
    <p>{e(a["solution"])}</p>
    <h2>Platforms</h2>
    <div class="pills">{pills}</div>
    <h2>Get the app</h2>
    <div class="pills"><a class="pill" href="{a["store"]}">{APPLE}App Store</a>{extra}</div>
  </aside>
  <div class="p-main">
    <figure class="poster"><img class="icon" src="/assets/apps/{a["key"]}.png" alt="{e(a["ko"])} 앱 아이콘" width="256" height="256"></figure>
    <div class="cap"><span class="nm">{NAME}</span><span class="r">{cap}</span></div>
    <div class="shots" aria-label="{e(a["ko"])} 스크린샷">
{shots}
    </div>
    <section class="p-index" aria-label="다른 앱">
      <ul class="index">
{index_rows(current=a["key"], peek=False)}
      </ul>
    </section>
  </div>
  <footer class="foot"><div class="l">{links()}</div><div class="r">©{YEAR}</div></footer>
</main>
''' + tail(inapp=True)


def page_about():
    desc = f"{NAME}는 혼자 기획하고 디자인하고 개발하는 1인 앱 스튜디오입니다. 취미가 오래 가도록, 작은 앱을 만듭니다."
    pills = "".join(f'<span class="pill">{e(a["title"])}</span>' for a in APPS)
    return head(f"About — {NAME}", desc, "/about/") + f'''<main class="proj" style="--poster:#0b0b0b">
  <h1 class="p-title">About</h1>
  <aside class="p-side">
    <p class="ko"><span class="nm">{NAME}</span> — 1인 앱 스튜디오</p>
    <p class="lead">혼자 기획하고, 디자인하고, 개발합니다.</p>
    <h2>Contact</h2>
    <p><a href="mailto:{MAIL}">{MAIL}</a></p>
    <h2>Instagram</h2>
    <p><a href="{INSTA}" target="_blank" rel="noopener">@ohtt_anyway</a></p>
    <h2>Privacy</h2>
    <p><a href="/privacy.html">개인정보 처리방침</a></p>
    <h2>Apps</h2>
    <div class="pills">{pills}</div>
  </aside>
  <div class="p-main">
    <figure class="poster">{EYES}</figure>
    <div class="cap"><span class="nm">{NAME}</span><span class="r"><span><b>Apps</b>{len(APPS)}</span><span><b>Since</b>{YEAR}</span><span><b>Made by</b>1명</span></span></div>
    <p class="statement">취미가 오래 가도록,<br>작은 앱을 만듭니다.</p>
    <div class="prose">
      <p>책을 읽고, 밴드 합주를 하고, 밀린 사진을 정리하는 일. 제가 매일 하는 일에 필요한 도구를 직접 만들어 쓰고, 손에 익은 것부터 하나씩 App Store에 올립니다.</p>
      <p>앱에 대한 의견이나 제안은 언제든 메일로 보내 주세요.</p>
    </div>
    <section class="p-index" aria-label="앱 목록">
      <ul class="index">
{index_rows(peek=False)}
      </ul>
    </section>
  </div>
  <footer class="foot"><div class="l">{links()}</div><div class="r">©{YEAR}</div></footer>
</main>
''' + tail()


def write(rel, text):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)
    print("wrote", rel)


def build_og():
    from PIL import Image, ImageDraw, ImageFont
    serif = None
    for path, idx in [("/System/Library/Fonts/Supplemental/Didot.ttc", 0),
                      ("/System/Library/Fonts/Supplemental/Bodoni 72.ttc", 0),
                      ("/System/Library/Fonts/Supplemental/Times New Roman.ttf", 0)]:
        if os.path.exists(path):
            serif = (path, idx); break
    sans = ("/System/Library/Fonts/AppleSDGothicNeo.ttc", 2)
    F = lambda spec, size: ImageFont.truetype(spec[0], size, index=spec[1])

    def eyes(d, cx, cy, s, look=(0.35, 0.3), stroke=True):
        for ox in (-17 * s, 17 * s):
            x, y = cx + ox, cy
            d.ellipse([x - 15 * s, y - 18 * s, x + 15 * s, y + 18 * s], fill="#ffffff",
                      outline="#0b0b0b" if stroke else None, width=max(2, int(2.2 * s)))
            px, py = x + look[0] * 7 * s, y + look[1] * 9 * s
            d.ellipse([px - 6.5 * s, py - 6.5 * s, px + 6.5 * s, py + 6.5 * s], fill="#0b0b0b")

    # 공유 카드 1200×630
    W, H = 1200, 630
    og = Image.new("RGB", (W, H), "#ffffff"); d = ImageDraw.Draw(og)
    d.text((48, 38), NAME, font=F(("/System/Library/Fonts/AppleSDGothicNeo.ttc", 6), 24), fill="#0b0b0b")
    d.text((120, 40), "INDIE APP STUDIO", font=F(sans, 22), fill="#0b0b0b")
    d.text((W - 48, 40), "APPS   ABOUT", font=F(sans, 22), fill="#0b0b0b", anchor="ra")
    eyes(d, W / 2, 52, 1.5)
    y = 170
    for n, a in enumerate(APPS, 1):
        d.text((250, y + 14), f"[{n:02d}]", font=F(sans, 17), fill="#0b0b0b")
        d.text((306, y), a["title"], font=F(serif, 104), fill="#0b0b0b")
        tw = d.textlength(a["title"], font=F(serif, 104))
        ic = Image.open(os.path.join(ROOT, f"assets/apps/{a['key']}.png")).convert("RGBA").resize((44, 44), Image.LANCZOS)
        m = Image.new("L", (44, 44), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, 43, 43], radius=10, fill=255)
        bx = int(306 + tw + 34)
        og.paste(ic, (bx, y + 50), m)
        d.text((bx + 58, y + 50), a["ko"], font=F(("/System/Library/Fonts/AppleSDGothicNeo.ttc", 6), 18), fill="#0b0b0b")
        d.text((bx + 58, y + 74), a["cat"], font=F(sans, 18), fill="#0b0b0b")
        y += 122
    d.text((48, H - 58), "www.ohttne.com", font=F(sans, 20), fill="#0b0b0b")
    d.text((W - 48, H - 58), f"©{YEAR}", font=F(("/System/Library/Fonts/AppleSDGothicNeo.ttc", 6), 20), fill="#0b0b0b", anchor="ra")
    og.save(os.path.join(ROOT, "assets/og.png"), optimize=True)

    # 파비콘 · 터치 아이콘: 흰 바탕에 눈
    for size, name in [(64, "favicon.png"), (180, "apple-touch-icon.png")]:
        S = size * 4
        im = Image.new("RGB", (S, S), "#ffffff"); dd = ImageDraw.Draw(im)
        eyes(dd, S / 2, S / 2, S / 80)
        im.resize((size, size), Image.LANCZOS).save(os.path.join(ROOT, "assets", name), optimize=True)
    print("wrote og.png, favicon.png, apple-touch-icon.png")


if __name__ == "__main__":
    write("index.html", page_home())
    for a in APPS:
        write(f'{a["key"]}/index.html', page_app(a))
    write("about/index.html", page_about())
    if "--og" in sys.argv:
        build_og()
