/* SIDE B 모임 신청 API — POST /apply
   www.ohttne.com/bside/ 의 폼이 JSON을 보내면 검증하고 운영자 메일로 전달한다.
   스팸 방지: 허용 출처(CORS) · IP 기준 rate limit · 허니팟(company) · 서버 검증 */
import { EmailMessage } from "cloudflare:email";

const AGE = ["20대", "30대"];
const DEV = ["iOS", "Android", "Web Frontend", "Backend", "Full-stack", "AI", "기타"];
const STATUS = ["출시해서 운영 중이에요", "곧 출시 예정이에요", "아직 개발 중이에요"];
const INTERESTS = ["개발 이야기", "서비스 운영 이야기", "마케팅 / 홍보", "수익화", "AI 활용",
  "온라인 모각코", "오프라인 모각코", "비슷한 사람들과 친해지고 싶어요", "기타"];
const OFFLINE = ["좋아요!", "일정이 맞으면 참여하고 싶어요", "온라인만 참여하고 싶어요"];
const SUBJECT = "[SIDE B] 새로운 모임 신청이 도착했어요 👩🏻‍💻";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors || {} });
    if (origin && !cors) return json({ ok: false, error: "origin" }, 403, {});
    const path = new URL(request.url).pathname.replace(/\/+$/, "");
    if (env.DEBUG === "1" && request.method === "GET" && path === "/rl") {      // 디버그: 레이트 리밋 바인딩 확인
      const out = [];
      for (let i = 0; i < 5; i++) out.push(env.RATE ? (await env.RATE.limit({ key: "rl-test" })).success : "no-binding");
      return json({ colo: request.cf && request.cf.colo, out }, 200, {});
    }
    if (request.method !== "POST" || path !== "/apply") return json({ ok: false, error: "not_found" }, 404, cors);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!(await allow(ip, env))) return json({ ok: false, error: "rate_limit" }, 429, cors);

    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400, cors); }
    if (!body || typeof body !== "object") return json({ ok: false, error: "bad_json" }, 400, cors);
    if (str(body.company)) return json({ ok: true }, 200, cors);        // 허니팟: 봇이면 조용히 성공 처리

    const { data, errors } = validate(body);
    if (errors) return json({ ok: false, error: "validation", fields: errors }, 400, cors);

    let sentTo;
    try {
      sentTo = await sendMail(env, data);
    } catch (e) {
      console.error("mail failed", e && e.code, e && e.message);
      const out = { ok: false, error: "mail" };
      if (env.DEBUG === "1") out.detail = String((e && (e.code + " " + e.message)) || e);
      return json(out, 502, cors);
    }
    return json(env.DEBUG === "1" ? { ok: true, sentTo } : { ok: true }, 200, cors);
  },
};

/* ── IP당 60초에 3번: Rate Limit 바인딩(느슨·최종 일관) + 아이솔레이트 안 메모리(즉시) ── */
const RL_LIMIT = 3, RL_WINDOW = 60_000;
const recent = new Map();                       // ip → [timestamp...]
async function allow(ip, env) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now - t < RL_WINDOW);
  if (hits.length >= RL_LIMIT) return false;
  hits.push(now); recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();       // 메모리 상한
  if (env.RATE) {
    try { const { success } = await env.RATE.limit({ key: ip }); if (!success) return false; }
    catch (e) { console.error("ratelimit binding", e && e.message); }
  }
  return true;
}

/* ── 검증 ── */
function str(v) { return typeof v === "string" ? v.trim() : ""; }
function len(s) { return Array.from(s).length; }
function pickList(v, allowed) {
  if (!Array.isArray(v)) return null;
  const out = [];
  for (const x of v) if (typeof x === "string" && allowed.includes(x) && !out.includes(x)) out.push(x);
  return out.length ? out : null;
}
function normalizeUrl(s) {
  if (!s) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return null;
  return u.toString();
}

function validate(b) {
  const e = {};
  const d = {};
  d.name = str(b.name);
  if (!d.name) e.name = "이름이나 닉네임을 알려주세요.";
  else if (len(d.name) > 30) e.name = "30자 안으로 적어주세요.";

  d.ageGroup = str(b.ageGroup);
  if (!AGE.includes(d.ageGroup)) e.ageGroup = "연령대를 골라주세요.";

  d.developerTypes = pickList(b.developerTypes, DEV);
  if (!d.developerTypes) e.developerTypes = "하나 이상 골라주세요.";

  d.serviceStatus = str(b.serviceStatus);
  if (!STATUS.includes(d.serviceStatus)) e.serviceStatus = "하나 골라주세요.";

  d.serviceDescription = str(b.serviceDescription);
  if (len(d.serviceDescription) < 10) e.serviceDescription = "10자 이상 적어주세요.";
  else if (len(d.serviceDescription) > 500) e.serviceDescription = "500자 안으로 적어주세요.";

  const rawUrl = str(b.serviceUrl);
  if (rawUrl) {
    if (len(rawUrl) > 500) e.serviceUrl = "링크가 너무 길어요.";
    else {
      const u = normalizeUrl(rawUrl);
      if (!u) e.serviceUrl = "링크 형식을 확인해주세요.";
      else d.serviceUrl = u;
    }
  } else d.serviceUrl = "";

  d.interests = pickList(b.interests, INTERESTS);
  if (!d.interests) e.interests = "하나 이상 골라주세요.";

  d.offline = str(b.offline);
  if (!OFFLINE.includes(d.offline)) e.offline = "하나 골라주세요.";

  d.location = str(b.location);
  if (len(d.location) > 60) e.location = "조금만 짧게 적어주세요.";

  d.sns = str(b.sns);
  if (!d.sns) e.sns = "연락받을 SNS 계정을 알려주세요.";
  else if (len(d.sns) > 100) e.sns = "100자 안으로 적어주세요.";

  return Object.keys(e).length ? { errors: e } : { data: d };
}

/* ── 메일 ── */
function kstNow() {
  const p = {};
  new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

function mailText(d) {
  const or = (v) => v || "—";
  return [
    "새로운 신청이 도착했습니다.", "",
    "이름 / 닉네임", d.name, "",
    "연령대", d.ageGroup, "",
    "개발 분야", d.developerTypes.join(", "), "",
    "서비스 상태", d.serviceStatus, "",
    "서비스 소개", d.serviceDescription, "",
    "서비스 링크", or(d.serviceUrl), "",
    "관심 분야", d.interests.join(", "), "",
    "오프라인 참여", d.offline, "",
    "지역", or(d.location), "",
    "SNS", d.sns, "",
    "----------------", "",
    "신청일", kstNow(), "",
  ].join("\n");
}

let primaryBlockedUntil = 0;                    // MAIL_TO가 '인증 안 된 주소'로 거부되면 10분간 폴백으로 바로 보낸다
async function sendMail(env, d) {
  const from = env.MAIL_FROM;
  const text = mailText(d);
  const targets = [env.MAIL_TO, env.MAIL_FALLBACK_TO].filter(Boolean);
  let lastErr;
  for (const to of targets) {
    if (to === env.MAIL_TO && to !== targets[targets.length - 1] && Date.now() < primaryBlockedUntil) continue;
    const raw = buildRaw({ from, fromName: env.MAIL_FROM_NAME, to, subject: SUBJECT, text });
    try {
      await env.EMAIL.send(new EmailMessage(from, to, raw));
      return to;
    } catch (e) {
      lastErr = e;
      console.error("mail to", to, "failed:", e && e.code, e && e.message);
      if (e && e.code === "E_RECIPIENT_NOT_ALLOWED" && to === env.MAIL_TO) primaryBlockedUntil = Date.now() + 10 * 60_000;
      // 어떤 이유로든 실패하면 다음 주소로 (마지막 주소까지 실패해야 오류)
    }
  }
  throw lastErr || new Error("no recipient");
}

/* RFC 5322 평문 메일. 제목은 RFC 2047 base64, 본문은 base64 */
function buildRaw({ from, fromName, to, subject, text }) {
  const domain = from.split("@")[1];
  return [
    `Date: ${rfcDate(new Date())}`,
    `From: ${fromName ? `${fromName} <${from}>` : from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap76(b64(text)),
    "",
  ].join("\r\n");
}
function rfcDate(d) { return d.toUTCString().replace(/GMT$/, "+0000"); }
function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x2000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x2000));
  return btoa(bin);
}
function wrap76(s) { return s.replace(/(.{76})/g, "$1\r\n").replace(/\r\n$/, ""); }
function encodeHeader(s) {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  const words = []; let chunk = "";
  for (const ch of s) {                      // 한 encoded-word는 UTF-8 45바이트 이하로 (75자 제한)
    if (new TextEncoder().encode(chunk + ch).length > 45) { words.push(chunk); chunk = ""; }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map(w => `=?UTF-8?B?${b64(w)}?=`).join("\r\n ");
}

/* ── 공통 ── */
function corsHeaders(origin, env) {
  if (!origin) return {};
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  let ok = allowed.includes(origin);
  if (!ok && env.DEV === "1" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) ok = true;
  if (!ok) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(headers || {}) },
  });
}
