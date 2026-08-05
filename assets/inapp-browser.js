/*!
 * inapp-browser.js — 인앱 브라우저에서 App Store로 빠져나가기
 *
 * 인스타그램·페이스북의 인앱 브라우저는 iOS App Store 링크를 조용히 막는다.
 * 링크를 눌러도 아무 일도 일어나지 않는다(흰 화면조차 아니고, 그냥 무반응).
 *
 * 해법: 클릭 안에서 "동기적으로" 각 앱의 탈출 스킴을 호출해 기본 브라우저를 연다.
 * 비동기(setTimeout·await·fetch 후)로 미루면 iOS가 사용자 제스처 컨텍스트를 잃고 무시한다.
 *
 *   인스타그램/스레드 (iOS)  instagram://extbrowser/?url=<encoded>
 *                            ↳ IG 앱이 가로채 Safari로 연다. 이게 핵심.
 *                              x-safari-를 location.href로 넣는 방식은 IG 웹뷰가 조용히 삼킨다.
 *   페이스북/메신저 (iOS)     window.open('x-safari-' + url, '_blank')
 *   안드로이드                intent://<scheme 뺀 url>#Intent;scheme=https;end
 *
 * 일반 브라우저에서는 아무것도 하지 않는다 — CTA는 그냥 <a href>로 App Store에 간다.
 *
 * 사용법:
 *   <a class="btn" href="https://apps.apple.com/kr/app/id...">App Store에서 받기</a>
 *   <script src="assets/inapp-browser.js" defer></script>
 *   → apps.apple.com 링크를 자동으로 찾아 위임 처리한다(data-breakout 로 명시 지정도 가능).
 */
(function (global) {
  'use strict';

  var UA = (global.navigator && global.navigator.userAgent) || '';

  /* ── 환경 판별 ───────────────────────────────────────────── */

  var IN_APP = {
    // 스레드 웹뷰의 UA 코드명이 Barcelona다. IG 계열이라 같은 스킴이 통한다.
    instagram: /Instagram|Barcelona|Threads/i,
    facebook: /FBAN|FBAV|FB_IAB|FBIOS|Messenger/i,
    kakao: /KAKAOTALK/i,
    naver: /NAVER\(inapp/i,
    line: /\bLine\//i
  };

  function ua(override) { return override || UA; }

  function isIOS(o) {
    var s = ua(o);
    if (/iPad|iPhone|iPod/.test(s)) return true;
    // iPadOS 13+ 는 데스크톱 UA를 쓴다.
    var nav = global.navigator;
    return !!(nav && nav.platform === 'MacIntel' && nav.maxTouchPoints > 1 && !/Android/i.test(s));
  }

  function isAndroid(o) { return /Android/i.test(ua(o)); }
  function isInstagram(o) { return IN_APP.instagram.test(ua(o)); }
  function isFacebook(o) { return IN_APP.facebook.test(ua(o)); }

  /** 인앱 브라우저면 그 이름, 아니면 null. */
  function detect(o) {
    var s = ua(o);
    for (var name in IN_APP) {
      if (Object.prototype.hasOwnProperty.call(IN_APP, name) && IN_APP[name].test(s)) return name;
    }
    return null;
  }

  function isInApp(o) { return detect(o) !== null; }

  /* ── 탈출 경로 계산 (순수 함수 — 테스트 가능) ────────────── */

  /**
   * @returns {null|{app:string, via:string, target:string}}
   *   null = 일반 브라우저. 링크를 건드리지 말 것.
   *   via  = 'location' | 'window.open'
   */
  function routeFor(url, o) {
    var app = detect(o);
    if (!app) return null;

    if (isAndroid(o)) {
      return {
        app: app,
        via: 'location',
        target: 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;end'
      };
    }

    if (app === 'instagram') {
      return { app: app, via: 'location', target: 'instagram://extbrowser/?url=' + encodeURIComponent(url) };
    }
    if (app === 'kakao') {
      return { app: app, via: 'location', target: 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url) };
    }
    // 페이스북·메신저, 그 밖의 iOS 인앱 브라우저.
    // x-safari-는 window.open으로 열 때만 통하는 경우가 있다(location.href는 대개 막힘).
    return { app: app, via: 'window.open', target: 'x-safari-' + url };
  }

  var LABEL = {
    instagram: '인스타그램',
    facebook: '페이스북',
    kakao: '카카오톡',
    naver: '네이버',
    line: '라인'
  };

  /* ── 실행 ────────────────────────────────────────────────── */

  var watching = null;

  /**
   * 인앱 브라우저면 탈출을 시도하고 true, 일반 브라우저면 아무것도 안 하고 false.
   * 반드시 클릭 핸들러 안에서 동기적으로 호출할 것.
   */
  function breakOut(url) {
    var route = routeFor(url);
    if (!route) return false;

    if (route.via === 'window.open') {
      global.open(route.target, '_blank');
    } else {
      global.location.href = route.target;
    }

    watch(url, route);
    return true;
  }

  /**
   * 탈출이 먹혔는지 지켜본다.
   * 앱이 백그라운드로 내려가면(visibilitychange/pagehide/blur) 성공.
   * 1.5초 안에 아무 신호도 없으면 수동 안내를 띄운다.
   */
  function watch(url, route) {
    if (!global.document) return;
    if (watching) watching.cancel();

    var events = ['visibilitychange', 'pagehide', 'blur'];
    var timer = global.setTimeout(function () {
      cleanup();
      if (!global.document.hidden) openSheet(url, route);
    }, 1500);

    function onLeave() { cleanup(); }
    function cleanup() {
      global.clearTimeout(timer);
      events.forEach(function (e) { global.removeEventListener(e, onLeave); });
      global.document.removeEventListener('visibilitychange', onLeave);
      watching = null;
    }

    events.forEach(function (e) { global.addEventListener(e, onLeave); });
    global.document.addEventListener('visibilitychange', onLeave);
    watching = { cancel: cleanup };
  }

  /* ── 수동 안내 시트 ──────────────────────────────────────── */

  var CSS = [
    '.iab-sheet{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;',
    'font-family:inherit;line-height:1.7;letter-spacing:-.01em}',
    '.iab-sheet[hidden]{display:none}',
    '.iab-veil{position:absolute;inset:0;background:rgba(0,0,0,.42);opacity:0;transition:opacity .24s ease}',
    '.iab-sheet.on .iab-veil{opacity:1}',
    '.iab-card{position:relative;width:100%;max-width:460px;',
    'background:var(--bg,#fff);color:var(--ink,#1c1c1e);',
    'border-radius:var(--r-btn,8px) var(--r-btn,8px) 0 0;',
    'padding:26px 22px calc(22px + env(safe-area-inset-bottom));',
    'transform:translateY(16px);opacity:0;transition:transform .26s cubic-bezier(.25,.6,.2,1),opacity .26s ease}',
    '.iab-sheet.on .iab-card{transform:none;opacity:1}',
    '.iab-card h2{margin:0 0 8px;font-size:17px;font-weight:600;letter-spacing:-.01em;line-height:1.5}',
    '.iab-card p{margin:0 0 18px;font-size:14px;color:var(--ink-2,#6e6e73)}',
    '.iab-go{display:block;width:100%;padding:14px 18px;border:0;cursor:pointer;',
    // 페이지가 --iab-accent 를 정의하면 그 색을, 아니면 본문 잉크색을 쓴다.
    'border-radius:var(--r-btn,8px);background:var(--iab-accent,var(--ink,#1c1c1e));color:var(--bg,#fff);',
    'font-family:inherit;font-size:15px;font-weight:600;letter-spacing:-.01em}',
    '.iab-go:active{opacity:.82}',
    '.iab-or{margin:20px 0 10px;font-size:12px;letter-spacing:.16em;',
    'color:var(--ink-3,#aeaeb2);font-family:var(--mono,ui-monospace,Menlo,monospace)}',
    '.iab-steps{margin:0;padding:0 0 0 1.15em;font-size:13.5px;color:var(--ink-2,#6e6e73)}',
    '.iab-steps li{margin:0 0 4px}',
    '.iab-steps b{color:var(--ink,#1c1c1e);font-weight:600}',
    '.iab-url{margin:12px 0 0;padding:11px 12px;font-size:12.5px;word-break:break-all;',
    'font-family:var(--mono,ui-monospace,Menlo,monospace);color:var(--ink-2,#6e6e73);',
    'background:var(--paper,#fafafa);border:1px solid var(--line,#e5e5ea);border-radius:var(--r-chip,6px);',
    '-webkit-user-select:all;user-select:all}',
    '.iab-url[hidden]{display:none}',
    '.iab-copy{margin-top:16px;width:100%;padding:12px 16px;cursor:pointer;',
    'border:1px solid var(--line,#e5e5ea);border-radius:var(--r-btn,8px);',
    'background:transparent;color:var(--ink,#1c1c1e);font-family:inherit;font-size:13.5px;font-weight:500}',
    '.iab-copy:active{opacity:.7}',
    '.iab-close{margin:14px auto 0;display:block;border:0;background:none;cursor:pointer;',
    'color:var(--ink-3,#aeaeb2);font-family:inherit;font-size:13px;padding:6px 10px}',
    '@media (prefers-reduced-motion:reduce){.iab-veil,.iab-card{transition:none}}'
  ].join('');

  var sheet = null;
  var hideTimer = null;

  function buildSheet() {
    var doc = global.document;
    var style = doc.createElement('style');
    style.textContent = CSS;
    doc.head.appendChild(style);

    var el = doc.createElement('div');
    el.className = 'iab-sheet';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'iab-title');
    el.innerHTML =
      '<div class="iab-veil"></div>' +
      '<div class="iab-card">' +
        '<h2 id="iab-title">App Store가 열리지 않나요?</h2>' +
        '<p class="iab-lead"></p>' +
        '<button type="button" class="iab-go">기본 브라우저로 열기</button>' +
        '<p class="iab-or">직접 여는 법</p>' +
        '<ol class="iab-steps">' +
          '<li>화면 오른쪽 위 <b>···</b> 를 누르세요</li>' +
          '<li><b>외부 브라우저에서 열기</b>를 선택하세요</li>' +
        '</ol>' +
        '<p class="iab-url" hidden></p>' +
        '<button type="button" class="iab-copy">링크 복사</button>' +
        '<button type="button" class="iab-close">닫기</button>' +
      '</div>';
    doc.body.appendChild(el);

    el.querySelector('.iab-veil').addEventListener('click', closeSheet);
    el.querySelector('.iab-close').addEventListener('click', closeSheet);
    return el;
  }

  function openSheet(url, route) {
    if (!global.document || !global.document.body) return;
    if (!sheet) sheet = buildSheet();

    var name = LABEL[(route && route.app) || detect()] || '이 앱';
    sheet.querySelector('.iab-lead').textContent =
      name + ' 안의 브라우저는 App Store 링크를 막아둡니다. 기본 브라우저로 열면 바로 받을 수 있어요.';

    var go = sheet.querySelector('.iab-go');
    go.onclick = function () { breakOut(url); };

    var copy = sheet.querySelector('.iab-copy');
    copy.textContent = '링크 복사';
    copy.onclick = function () { copyLink(url, copy); };

    // 이전에 복사가 막혀 주소를 펼쳐놨다면 되돌린다.
    sheet.querySelector('.iab-url').hidden = true;

    // 닫는 중이었다면 예약된 hidden 처리를 취소한다.
    // (닫자마자 다시 열면 240ms 뒤에 도로 숨겨지던 문제)
    global.clearTimeout(hideTimer);

    sheet.hidden = false;
    // 리플로우를 강제해 트랜지션 시작점을 확정한 뒤 클래스를 붙인다.
    // requestAnimationFrame으로 미루면 웹뷰가 rAF를 스로틀할 때 시트가 늦게 뜬다.
    void sheet.offsetHeight;
    sheet.classList.add('on');
    go.focus();
  }

  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('on');
    global.clearTimeout(hideTimer);
    hideTimer = global.setTimeout(function () { if (sheet) sheet.hidden = true; }, 240);
  }

  function copyLink(url, btn) {
    var done = function () {
      btn.textContent = '복사됨 — Safari 주소창에 붙여넣기';
      global.setTimeout(function () { btn.textContent = '링크 복사'; }, 2400);
    };
    var manual = function () {
      // 클립보드가 막힌 환경 — 주소를 길게 눌러 직접 복사하도록 펼쳐 보인다.
      // 안내 단계는 그대로 둔다(예전엔 여기를 덮어써서 되돌릴 수 없었다).
      var field = sheet.querySelector('.iab-url');
      field.textContent = url;
      field.hidden = false;
      btn.textContent = '길게 눌러 복사하세요';
    };

    if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(url).then(done, function () { execCopy(url) ? done() : manual(); });
    } else {
      execCopy(url) ? done() : manual();
    }
  }

  function execCopy(text) {
    var doc = global.document;
    var t = doc.createElement('textarea');
    t.value = text;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:absolute;left:-9999px;top:0';
    doc.body.appendChild(t);
    t.select();
    t.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
    doc.body.removeChild(t);
    return ok;
  }

  /* ── 링크 자동 연결 ──────────────────────────────────────── */

  var SELECTOR = 'a[data-breakout], a[href*="apps.apple.com"], a[href*="itunes.apple.com"]';

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var a = e.target && e.target.closest && e.target.closest(SELECTOR);
    if (!a) return;

    var url = a.getAttribute('data-breakout') || a.href;
    if (!url) return;

    // 일반 브라우저면 breakOut이 false를 돌려주고, <a>는 평소대로 동작한다.
    if (breakOut(url)) e.preventDefault();
  }

  var bound = false;

  function bind(root) {
    if (!root && bound) return; // 스크립트가 두 번 실려도 한 번만 붙는다
    if (!root) bound = true;
    (root || global.document).addEventListener('click', onClick, false);
  }

  var api = {
    isIOS: isIOS,
    isAndroid: isAndroid,
    isInApp: isInApp,
    isInstagram: isInstagram,
    isFacebook: isFacebook,
    detect: detect,
    routeFor: routeFor,
    breakOut: breakOut,
    bind: bind,
    _openSheet: openSheet
  };

  global.InAppBreakout = api;
  if (typeof module === 'object' && module.exports) module.exports = api;

  if (global.document) bind();
})(typeof window !== 'undefined' ? window : this);
