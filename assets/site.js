/* Ohtt — 눈 따라오기 · 홈 인트로 · 인덱스 미리보기 · 상세 페이지 제목 안무 */
(function(){
  'use strict';
  var root = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = matchMedia('(hover: hover)').matches;
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ease(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }

  /* ── 눈: 포인터를 따라오고, 깜빡이고, 누르면 놀란다 ── */
  var svgs = Array.prototype.slice.call(document.querySelectorAll('.eyes'));
  var eyes = [];
  svgs.forEach(function(svg){
    svg.querySelectorAll('.eye').forEach(function(e){
      eyes.push({ white: e.querySelector('.white'), pp: e.querySelector('.pp') });
    });
  });
  var tx = innerWidth * .5, ty = innerHeight * .62, px = tx, py = ty, lastMove = 0, nextIdle = 0;
  addEventListener('pointermove', function(e){ tx = e.clientX; ty = e.clientY; lastMove = performance.now(); }, {passive:true});
  addEventListener('touchstart', function(e){ var t = e.touches[0]; tx = t.clientX; ty = t.clientY; lastMove = performance.now(); }, {passive:true});
  var MAX_X = 7, MAX_Y = 9;                       // SVG 사용자 좌표 단위
  function eyesTick(now){
    if(now - lastMove > 4200 && now > nextIdle){   // 가만히 두면 두리번
      tx = innerWidth * (.12 + Math.random() * .76); ty = innerHeight * (.12 + Math.random() * .76);
      nextIdle = now + 1800 + Math.random() * 2600;
    }
    px += (tx - px) * .16; py += (ty - py) * .16;
    for(var i = 0; i < eyes.length; i++){
      var r = eyes[i].white.getBoundingClientRect(); if(!r.width) continue;
      var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
      var k = Math.min(1, d / (r.width * 2.2));    // 가까우면 조금, 멀면 끝까지
      eyes[i].pp.style.transform = 'translate(' + (dx / d * MAX_X * k).toFixed(2) + 'px,' + (dy / d * MAX_Y * k).toFixed(2) + 'px)';
    }
    requestAnimationFrame(eyesTick);
  }
  if(eyes.length && !reduced) requestAnimationFrame(eyesTick);

  function setAll(cls, on){ svgs.forEach(function(s){ s.classList.toggle(cls, on); }); }
  (function blink(){
    setTimeout(function(){
      setAll('blink', true);
      setTimeout(function(){
        setAll('blink', false);
        if(Math.random() < .22) setTimeout(function(){ setAll('blink', true); setTimeout(function(){ setAll('blink', false); }, 110); }, 170);
      }, 110);
      blink();
    }, 2300 + Math.random() * 3900);
  })();
  var oT;
  addEventListener('pointerdown', function(){ setAll('o', true); clearTimeout(oT); oT = setTimeout(function(){ setAll('o', false); }, 420); }, {passive:true});

  /* ── 홈 인트로 ── */
  if(root.classList.contains('intro')){
    setTimeout(function(){
      root.classList.remove('intro');
      try{ sessionStorage.setItem('ohtt-intro', '1'); }catch(e){}
    }, 1250);
  }

  /* ── 인덱스 미리보기 (마우스가 있을 때만) ── */
  var peek = document.querySelector('.peek');
  if(peek && canHover){
    var list = document.querySelector('.home .index');
    var img = peek.querySelector('img'), gx = 0, gy = 0, cx = 0, cy = 0, lastX = 0, rot = 0, on = false;
    document.querySelectorAll('.row[data-peek]').forEach(function(row){
      new Image().src = row.dataset.peek;          // 미리 받아 두기
      row.addEventListener('pointerenter', function(e){
        if(img.getAttribute('src') !== row.dataset.peek) img.src = row.dataset.peek;
        if(!on){ cx = e.clientX; cy = e.clientY; }
        on = true; peek.classList.add('on');
      });
      row.addEventListener('pointerleave', function(){ on = false; peek.classList.remove('on'); });
    });
    addEventListener('pointermove', function(e){ gx = e.clientX; gy = e.clientY; }, {passive:true});
    (function peekTick(){
      cx += (gx - cx) * .14; cy += (gy - cy) * .14;
      var v = cx - lastX; lastX = cx; rot += (clamp(v * .9, -9, 9) - rot) * .12;
      var w = 200, h = w * 1434 / 660;
      var edge = list ? list.getBoundingClientRect().right + 36 : 0;      // 제목을 가리지 않게 목록 오른쪽 바깥에서
      var x = clamp(Math.max(cx + 28, edge), 8, innerWidth - w - 8), y = clamp(cy - h * .5, 8, innerHeight - h - 8);
      peek.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (reduced ? 0 : rot).toFixed(2) + 'deg)';
      requestAnimationFrame(peekTick);
    })();
  }

  /* ── 상세 페이지: 큰 제목 → 왼쪽 위 작은 제목 ── */
  var title = document.querySelector('.p-title'), side = document.querySelector('.p-side');
  if(title && side){
    var mq = matchMedia('(min-width: 960px)'), F = 0, cur = -1;
    function measure(){ title.style.transform = ''; F = parseFloat(getComputedStyle(title).fontSize) || 120; cur = -1; }
    measure(); addEventListener('resize', measure);
    (function frame(){
      if(mq.matches){
        var vh = innerHeight, vw = innerWidth;
        var target = clamp(scrollY / (vh * .6), 0, 1);
        cur = (cur < 0 || reduced) ? target : cur + (target - cur) * .2;
        if(Math.abs(target - cur) < .0004) cur = target;
        var e = ease(cur);
        title.style.transform = 'translate(' + lerp(vw * .27, 24, e).toFixed(1) + 'px,' + lerp(vh * .27, 72, e).toFixed(1) + 'px) scale(' + lerp(1, 46 / F, e).toFixed(4) + ')';
        var o = clamp((cur - .6) / .4, 0, 1);
        side.style.opacity = o.toFixed(3);
        side.style.transform = 'translateY(' + ((1 - o) * 14).toFixed(1) + 'px)';
        side.style.pointerEvents = o > .6 ? 'auto' : 'none';
      } else if(side.style.opacity !== ''){
        title.style.transform = ''; side.style.opacity = ''; side.style.transform = ''; side.style.pointerEvents = ''; cur = -1;
      }
      requestAnimationFrame(frame);
    })();
  }
})();
