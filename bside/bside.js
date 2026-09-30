/* SIDE B — 신청 폼: 펼치기 · 검증 · 전송 · 완료 화면 · 하단 고정 버튼 */
(function(){
  'use strict';
  var API = 'https://bside-apply.ohttangent.workers.dev/apply';
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $('#form'), intro = $('#apply-intro'), done = $('#done'), sticky = $('#sticky'), apply = $('#apply');
  var submitBtn = $('#submit'), submitLabel = $('span', submitBtn), formErr = $('#form-err');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sending = false;
  var closed = document.body.classList.contains('closed');     // 모집 마감: 버튼이 없고 링크로 와도 폼을 열지 않는다

  function scrollToApply(){
    var top = apply.getBoundingClientRect().top + pageYOffset - 20;
    scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ── 폼 펼치기: 같은 페이지에서 그대로 열린다 ── */
  function openForm(scroll){
    if(closed) return;
    if(form.hidden){
      intro.hidden = true; form.hidden = false;
      try{ history.replaceState(null, '', '#apply'); }catch(e){}
    }
    if(scroll !== false) scrollToApply();
    updateSticky();
  }
  $$('[data-open]').forEach(function(b){ b.addEventListener('click', function(){ openForm(true); }); });
  if(location.hash === '#apply' && !closed) openForm(false);   // 링크로 바로 왔으면 열어 둔다

  /* ── 칩(라디오·체크박스) ── */
  form.addEventListener('change', function(e){
    var t = e.target;
    if(t.matches('input[type=checkbox], input[type=radio]')){
      $$('input[name="' + t.name + '"]', form).forEach(function(i){ i.closest('.chip').classList.toggle('on', i.checked); });
    }
    clearError(t.closest('.q'));
  });
  form.addEventListener('input', function(e){ clearError(e.target.closest('.q')); });

  /* ── 글자 수 ── */
  var desc = $('[name=serviceDescription]', form), count = $('.count', form);
  function updateCount(){ count.textContent = desc.value.length + ' / 500'; }
  desc.addEventListener('input', updateCount); updateCount();

  /* ── 검증 (서버와 같은 규칙) ── */
  function val(name){ var el = form.querySelector('[name="' + name + '"]'); return el ? el.value.trim() : ''; }
  function checked(name){ return $$('input[name="' + name + '"]:checked', form).map(function(i){ return i.value; }); }
  function len(s){ return Array.from(s).length; }
  function normalizeUrl(s){
    if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
    try{
      var u = new URL(s);
      if(!/^https?:$/.test(u.protocol) || u.hostname.indexOf('.') < 0) return null;
      return u.toString();
    }catch(e){ return null; }
  }
  function collect(){
    var d = {}, e = {};
    d.name = val('name');
    if(!d.name) e.name = '이름이나 닉네임을 알려주세요.';
    else if(len(d.name) > 30) e.name = '30자 안으로 적어주세요.';

    d.ageGroup = checked('ageGroup')[0] || '';
    if(!d.ageGroup) e.ageGroup = '연령대를 골라주세요.';

    d.developerTypes = checked('developerTypes');
    if(!d.developerTypes.length) e.developerTypes = '하나 이상 골라주세요.';

    d.serviceStatus = checked('serviceStatus')[0] || '';
    if(!d.serviceStatus) e.serviceStatus = '하나 골라주세요.';

    d.serviceDescription = val('serviceDescription');
    if(len(d.serviceDescription) < 10) e.serviceDescription = '10자 이상 적어주세요.';
    else if(len(d.serviceDescription) > 500) e.serviceDescription = '500자 안으로 적어주세요.';

    var url = val('serviceUrl');
    d.serviceUrl = '';
    if(url){ var n = normalizeUrl(url); if(n) d.serviceUrl = n; else e.serviceUrl = '링크 형식을 확인해주세요.'; }

    d.interests = checked('interests');
    if(!d.interests.length) e.interests = '하나 이상 골라주세요.';

    d.offline = checked('offline')[0] || '';
    if(!d.offline) e.offline = '하나 골라주세요.';

    d.location = val('location');
    if(len(d.location) > 60) e.location = '조금만 짧게 적어주세요.';

    d.sns = val('sns');
    if(!d.sns) e.sns = '연락받을 SNS 계정을 알려주세요.';
    else if(len(d.sns) > 100) e.sns = '100자 안으로 적어주세요.';

    var hp = val('company'); if(hp) d.company = hp;             // 허니팟(사람 눈엔 안 보임)
    return { data: d, errors: Object.keys(e).length ? e : null };
  }
  function clearError(q){
    if(!q) return;
    q.classList.remove('bad');
    var p = $('.err', q); if(p){ p.hidden = true; p.textContent = ''; }
  }
  function showErrors(errors){
    $$('.q', form).forEach(clearError);
    var first = null;
    Object.keys(errors).forEach(function(k){
      var q = $('.q[data-field="' + k + '"]', form); if(!q) return;
      q.classList.add('bad');
      var p = $('.err', q); p.textContent = errors[k]; p.hidden = false;
      if(!first) first = q;
    });
    if(first){
      first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      var f = $('input[type=text], input[type=url], textarea', first);
      if(f){ try{ f.focus({ preventScroll: true }); }catch(e){ f.focus(); } }
    }
  }

  /* ── 전송 ── */
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(sending) return;
    formErr.hidden = true;
    var r = collect();
    if(r.errors){ showErrors(r.errors); return; }
    send(r.data);
  });
  function send(data){
    sending = true; submitBtn.disabled = true; submitLabel.textContent = '보내는 중...';
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, 20000) : 0;
    fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined
    })
    .then(function(res){
      return res.json().catch(function(){ return {}; }).then(function(j){ return { status: res.status, body: j }; });
    })
    .then(function(r){
      if(r.status === 200 && r.body.ok){ showDone(); return; }
      if(r.status === 400 && r.body.fields){ showErrors(r.body.fields); fail('입력 내용을 한 번만 확인해주세요.'); return; }
      if(r.status === 429){ fail('조금 전에 이미 보냈어요. 잠시 후 다시 시도해주세요.'); return; }
      if(r.status === 410){ fail('모집이 마감되었어요. 관심 가져줘서 고마워요 :)'); return; }
      fail('전송이 안 됐어요. 잠시 후 다시 시도해주세요.');
    })
    .catch(function(){ fail('네트워크 연결을 확인하고 다시 시도해주세요.'); })
    .then(function(){
      clearTimeout(timer); sending = false;
      submitBtn.disabled = false; submitLabel.textContent = '신청하기';
    });
  }
  function fail(msg){ formErr.textContent = msg; formErr.hidden = false; }
  function showDone(){
    form.hidden = true; done.hidden = false;
    scrollToApply();
    try{ done.focus({ preventScroll: true }); }catch(e){}
    updateSticky();
  }

  /* ── 하단 고정 버튼 ── */
  var heroSeen = true, applySeen = false;
  function updateSticky(){ sticky.classList.toggle('show', !closed && !heroSeen && !applySeen && form.hidden && done.hidden); }
  if('IntersectionObserver' in window && !closed){
    new IntersectionObserver(function(en){
      heroSeen = en[0].isIntersecting || en[0].boundingClientRect.top > 0;   // 아직 안 지나갔으면 본 걸로
      updateSticky();
    }).observe($('#hero-cta'));
    new IntersectionObserver(function(en){ applySeen = en[0].isIntersecting; updateSticky(); },
      { rootMargin: '0px 0px -30% 0px' }).observe(apply);
  }

  window.SideB = { collect: collect, openForm: openForm };     // 점검용
})();
