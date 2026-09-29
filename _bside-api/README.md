# bside-apply — SIDE B 신청 폼 메일 전송 Worker

`www.ohttne.com/bside/` 의 폼이 `POST https://bside-apply.ohttangent.workers.dev/apply` 로 JSON을 보내면
검증하고 운영자 메일로 전달한다. 관리자 페이지·DB 없음(기획서 MVP 범위).

    cd _bside-api
    npx wrangler deploy          # 배포 (Cloudflare 계정 로그인: npx wrangler login)
    npx wrangler tail            # 실시간 로그

## 메일이 가는 곳

Cloudflare Workers **무료 플랜**의 메일 전송(`send_email` 바인딩)은 Email Routing에 **인증된 대상 주소**로만 보낼 수 있다.
`contact@ohttne.com` 은 라우팅 주소(→ `ohttangent@gmail.com` 포워딩)라 그대로는 거부된다(`E_RECIPIENT_NOT_ALLOWED`).

그래서 Worker는 `MAIL_TO`(contact@ohttne.com)로 먼저 보내 보고, 거부되면 `MAIL_FALLBACK_TO`(ohttangent@gmail.com)로 보낸다.
2026-09-29에 `contact@ohttne.com` 을 대상 주소로 등록해 두었고(인증 메일이 Gmail로 감), **인증 링크를 누르면 그때부터 자동으로
contact@ohttne.com 으로 간다**(재배포 불필요, 거부 결과는 10분 캐시).

    npx wrangler email routing addresses list      # verified 열이 pending 인지 확인

보내는 사람은 `SIDE B <bside@ohttne.com>`, 제목 `[SIDE B] 새로운 모임 신청이 도착했어요 👩🏻‍💻`, 본문은 기획서 9번 형식(평문).

## 스팸 방지

1. 허용 출처만(CORS): `ALLOWED_ORIGINS` — www.ohttne.com, ohttne.com
2. 서버 검증: 필수값·길이·선택지·URL 형식(폼과 같은 규칙, `validate()`)
3. IP당 60초에 3번: Rate Limit 바인딩(`RATE`) + 아이솔레이트 메모리. 느슨하고 최종 일관이라 정확한 계수기는 아님
4. 허니팟: `company` 필드가 차 있으면 조용히 성공 응답

그래도 스팸이 오면 Cloudflare Turnstile을 붙인다(기획서 13).

## 응답

- `200 {ok:true}`
- `400 {ok:false, error:"validation", fields:{name:"…"}}` — 폼이 항목별 메시지로 보여 준다
- `429 {ok:false, error:"rate_limit"}`
- `502 {ok:false, error:"mail"}` — 메일 전송 실패(`wrangler tail`로 원인 확인)

로컬 시험: `npx wrangler dev --var DEV:1` 을 띄우면 localhost 출처도 허용. 배포본에 `--var DEBUG:1` 을 주면 응답에 `sentTo`·오류 상세가 실린다.
