# Ohtt 홈페이지 (www.ohttne.com)

## 기획 (2026-09-19 개편)

레퍼런스: estherramon.com — 흰 바탕, 큰 세리프 제목, 아주 작은 그로테스크 메타, 번호 붙은 작업 인덱스,
스크롤하면 제목이 왼쪽 위로 줄어들며 고정되는 상세 페이지. 구조만 빌리고 Ohtt의 것으로 바꿨다.

| 레퍼런스 | Ohtt |
|---|---|
| 가운데 로고(나비 장식) | **눈 한 쌍** — 포인터를 따라오고, 깜빡이고, 누르면 놀란다. 첫 방문 땐 화면 가운데서 크게 나타났다가 상단으로 올라간다 |
| `[01] Chain Of Truth` + 수상 배지 | `[01] Siori` + **앱 아이콘·한글 이름·분류** 배지 (신작은 NEW) |
| 작업 상세: Brief / Problem / Solution / Roles | 앱 상세: 한 줄 소개 / The Problem / The Solution / Platforms / Get the app |
| 검은 영상 블록 + 크레딧 줄 | 앱 색 포스터(아이콘) + Released · Platform · Price, 아래로 스크린샷 3열 |
| 상세 끝의 회색 인덱스 | 같음 — 현재 앱만 검정, 나머지는 회색 |
| 좌하단 SNS · 우하단 ©연도 | Instagram(@ohtt_anyway) · Mail · Privacy / ©2026 |

추가한 것: 홈 인덱스에 마우스를 올리면 목록 오른쪽에서 스크린샷 미리보기가 커서를 따라온다(터치 기기 제외),
About 포스터는 큰 눈, 다크 모드, 960px 미만은 고정 안무 없이 위에서 아래로 흐르는 레이아웃.

## 구조

    /                  앱 인덱스 (홈)
    /siori/ /forband/ /photodesk/   앱 상세
    /siori/tour/       옛 시오리 스크롤리텔링 랜딩 (시오리 상세의 "기능 둘러보기")
    /about/            소개 · 연락
    /privacy.html      그대로 (App Store · Play Console이 참조)
    /forband/app-store/ 그대로 (인앱 브라우저 탈출 리다이렉트)
    _drafts/mac-desktop.html   9/16의 맥 바탕화면 버전 보관본 (배포 안 됨)

## 고치는 법

페이지 HTML은 손으로 고치지 않는다. `_build/build.py`의 `APPS`·문구를 고치고 다시 굽는다.

    python3 _build/build.py          # 페이지
    python3 _build/build.py --og     # + og.png · 파비콘

모양은 `assets/site.css`, 움직임은 `assets/site.js`.
