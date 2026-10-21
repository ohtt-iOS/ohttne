#!/usr/bin/env python3
"""네몽 받기 링크 — 크리에이터마다 다른 /nemong/get/<이름>/ 를 굽는다(2026-10-21).

    python3 _build/nemong_get.py        # _build/nemong_get.txt 의 이름마다 다시 굽기

링크 하나 = 이름 하나. 새 크리에이터는 nemong_get.txt 에 한 줄 더하고 다시 굽고 커밋·push.
이름은 영문 소문자·숫자·-·_ 로 32자까지(App Store 캠페인 이름 ct 와 GA utm_source 에 그대로 들어간다).
/nemong/get/ (이름 없음)은 'direct', /nemong/get/?c=<이름> 처럼 붙여도 그 이름으로 센다(페이지를 안 구운 임시 링크).

어디서 세나:
  · 페이지 열림·스토어로 간 수  → nemong.ohttne.com/links (share-api Worker, D1 get_hits)
  · 아이폰 설치                → App Store Connect › 앱 분석 › 획득 › 캠페인 (pt·ct, 서로 다른 Apple 계정 5명부터 보임)
  · 안드 설치                  → GA '첫 사용자 소스'(Play 설치 리퍼러 utm_source) — /links 에도 같이 뜬다
"""
import html, os, re, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "nemong", "get")
LIST = os.path.join(ROOT, "_build", "nemong_get.txt")
CODE_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,31}$")

APP_ID = "6817196863"
PT = "128766441"            # App Store Connect 캠페인 링크의 제공자 토큰(앱 분석 › 캠페인 › 캠페인 링크 생성에서 확인)
PACKAGE = "com.ohtt.nemong"
HIT = "https://nemong.ohttne.com/api/get-hit"

PAGE = r"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>네몽 받기 · Ohtt</title>
<meta name="robots" content="noindex">
<meta name="description" content="카드뉴스 캐러셀 앱 네몽 — 아이폰은 App Store, 안드로이드는 Google Play로 바로 이동해요.">
<meta property="og:title" content="네몽 — 카드뉴스 캐러셀 앱">
<meta property="og:description" content="사진 하나 고르고, 글만 톡. 인스타 카드뉴스가 1분이면 돼요">
<meta property="og:image" content="https://www.ohttne.com/assets/og.png">
<meta property="og:url" content="https://www.ohttne.com/nemong/get/__PATH__">
<meta property="og:type" content="website">
<link rel="canonical" href="https://www.ohttne.com/nemong/">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0b0b" media="(prefers-color-scheme: dark)">
<script>
/* 받기 갈림길 — _build/nemong_get.py 가 굽는다(손으로 고치지 말 것). 시오리 /siori/get/ 과 같은 움직임에 링크별 세기를 더했다.
   일반 브라우저: 기기에 맞는 스토어로 바로 넘긴다. 인앱 브라우저(인스타·카톡 등) 아이폰: 버튼을 보여 주고 inapp-browser.js 가 탈출시킨다.
   스토어 주소에 링크 이름을 싣는다 — App Store 는 ct(캠페인), Play 는 referrer 의 utm_source(Firebase 가 첫 사용자 소스로 남긴다).
   열림·넘어감은 sendBeacon 으로 nemong.ohttne.com 에 센다(이름·일·기기 종류만, 페이지를 떠나도 보내진다). */
(function () {
  var code = "__CODE__";
  if (code === "direct") {
    var q = (location.search.match(/[?&]c=([^&#]*)/) || [])[1];
    q = q ? decodeURIComponent(q).toLowerCase() : "";
    if (/^[a-z0-9][a-z0-9_-]{0,31}$/.test(q)) code = q;
  }
  var IOS = "https://apps.apple.com/app/id__APP_ID__?pt=__PT__&ct=" + encodeURIComponent(code) + "&mt=8";
  var AND = "https://play.google.com/store/apps/details?id=__PACKAGE__&referrer=" +
    encodeURIComponent("utm_source=" + code + "&utm_medium=creator&utm_campaign=get");
  function hit(e) {
    try { navigator.sendBeacon("__HIT__", JSON.stringify({ c: code, e: e })); } catch (_) {}
  }
  var ua = navigator.userAgent || "";
  var ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  var inApp = /Instagram|Barcelona|Threads|FBAN|FBAV|FB_IAB|FBIOS|Messenger|KAKAOTALK|NAVER\(inapp|\bLine\//i.test(ua);
  document.documentElement.className = ios ? "ios" : android ? "android" : "desktop";
  window.NEMONG_GET = { ios: IOS, and: AND, hit: hit };
  hit("view");
  if (android) {
    hit("android");
    location.replace(AND);
  } else if (ios && !inApp) {
    hit("ios");
    location.replace(IOS);
  }
})();
</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
:root{--bg:#ffffff;--ink:#0b0b0b;--ink-2:#6f6f6f;--line:#e9e9e9}
@media (prefers-color-scheme:dark){:root{--bg:#0b0b0b;--ink:#f4f4f2;--ink-2:#9b9b9b;--line:#222}}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Pretendard Variable",Pretendard,-apple-system,system-ui,sans-serif;
  letter-spacing:-.01em;display:flex;align-items:center;justify-content:center;padding:24px 16px}
main{width:100%;max-width:340px;text-align:center}
.icon{width:96px;height:96px;border-radius:22px;box-shadow:0 0 0 1px var(--line);display:block;margin:0 auto 18px}
h1{margin:0;font-size:22px;font-weight:700}
p{margin:6px 0 28px;font-size:14px;color:var(--ink-2);line-height:1.6;word-break:keep-all}
.btns{display:flex;flex-direction:column;gap:10px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:14px;text-decoration:none;
  font-size:15px;font-weight:600;background:var(--ink);color:var(--bg);transition:opacity .2s}
.btn:active,.btn:hover{opacity:.75}
.btn svg{width:18px;height:18px;fill:currentColor}
.android .btns{flex-direction:column-reverse}
.android .btn.ios,.ios .btn.and{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
.back{display:inline-block;margin-top:28px;font-size:12px;color:var(--ink-2)}
</style>
</head>
<body>
<main>
  <img class="icon" src="/assets/apps/nemong.png" alt="" width="96" height="96">
  <h1>네몽</h1>
  <p>사진 하나 고르고, 글만 톡.<br>인스타 카드뉴스가 1분이면 돼요</p>
  <div class="btns">
    <a class="btn ios" href="https://apps.apple.com/app/id__APP_ID__?pt=__PT__&amp;ct=__CODE__&amp;mt=8"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>App Store에서 받기</a>
    <a class="btn and" href="https://play.google.com/store/apps/details?id=__PACKAGE__" data-breakout><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z"/></svg>Google Play에서 받기</a>
  </div>
  <a class="back" href="/nemong/">네몽 더 알아보기</a>
</main>
<script>
/* 버튼 주소를 링크 이름이 실린 것으로 바꾸고, 누르면 센다. 캡처 단계라 inapp-browser.js 의 탈출보다 먼저 돈다 */
(function () {
  var g = window.NEMONG_GET;
  var ios = document.querySelector(".btn.ios"), and = document.querySelector(".btn.and");
  ios.href = g.ios; and.href = g.and;
  ios.addEventListener("click", function () { g.hit("ios"); }, true);
  and.addEventListener("click", function () { g.hit("android"); }, true);
})();
</script>
<script src="/assets/inapp-browser.js" defer></script>
</body>
</html>
"""


def page(code: str, path: str) -> str:
    out = PAGE
    for k, v in {"__CODE__": code, "__PATH__": path, "__APP_ID__": APP_ID, "__PT__": PT, "__PACKAGE__": PACKAGE, "__HIT__": HIT}.items():
        out = out.replace(k, html.escape(v, quote=True) if k == "__PATH__" else v)
    return out


def codes() -> list:
    seen, out = set(), []
    for n, line in enumerate(open(LIST, encoding="utf-8"), 1):
        code = line.split("#", 1)[0].strip()
        if not code:
            continue
        if not CODE_RE.match(code) or code == "direct":
            raise SystemExit(f"✗ {LIST}:{n} '{code}' — 영문 소문자·숫자·-·_ 32자까지('direct' 는 이름 없는 링크용)")
        if code in seen:
            raise SystemExit(f"✗ {LIST}:{n} '{code}' 가 두 번 있어요")
        seen.add(code)
        out.append(code)
    return out


def main() -> None:
    names = codes()
    os.makedirs(OUT, exist_ok=True)
    # 목록에서 빠진 이름의 폴더는 지운다(index.html 하나만 든, 이 스크립트가 만든 폴더만)
    for d in os.listdir(OUT):
        p = os.path.join(OUT, d)
        if os.path.isdir(p) and d not in names and os.listdir(p) == ["index.html"]:
            shutil.rmtree(p)
            print(f"· 지움 /nemong/get/{d}/")
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
        f.write(page("direct", ""))
    for code in names:
        os.makedirs(os.path.join(OUT, code), exist_ok=True)
        with open(os.path.join(OUT, code, "index.html"), "w", encoding="utf-8") as f:
            f.write(page(code, code + "/"))
    print(f"✓ /nemong/get/ + 링크 {len(names)}개: " + ", ".join(f"/nemong/get/{c}/" for c in names))


if __name__ == "__main__":
    main()
