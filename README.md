# 심플예약 (Simple Reservation)

**▶ Live site / 앱:** https://persian32.github.io/simple-reservation/ (the app is in Korean)

**English summary**

Simple Reservation is a booking app for a one-person hair salon. The owner takes bookings on her own phone and writes them on a paper calendar on the wall.

- **Asking before building:** I watched how she worked, then asked her about my assumptions. Five of them were wrong. She rarely forgot bookings, did not mind copying them, and did not want reminders. The paper calendar could not be replaced either, because she cannot see her phone screen during a call. The lesson that shaped the design: a person who is not inconvenienced will stop opening an app that adds even a little work.
- **What it does:** She keeps writing on paper and copies bookings into a calendar that looks like her wall calendar. The one thing paper cannot do is remember each customer: tapping a name shows past visits, services, and how often the customer comes.
- **Privacy and cost:** No server, no account, no fee. Data stays on her phone, and she can export a backup file.
- **My role:** I observed and interviewed the owner, decided what to build and what to leave out, delivered each version to her phone, and collected her feedback. The code was written with AI coding tools (Claude Code), with 92 automated tests.
- **Status:** Developed in late July 2026 and in use since August 2026, with 246 bookings recorded as of October 2026. After about seven weeks of use she sent six requests (a memo field, product sales, several services per booking, sales totals, and more); five have been added.
- **Open question:** Customers who do not show up are still counted as visits. I have not fixed this yet, because asking her "Did they come?" every day would add work, which is what this app tries hardest to avoid.

---

**한국어 설명**

미용실 예약 관리 웹앱. 서버 없이 폰 안에서만 동작한다.

## 실행

```bash
python3 -m http.server 8000
```

http://localhost:8000

## 테스트

```bash
npm test
```

## 구조

- `js/services.js` 시술 목록과 별칭
- `js/store.js` 예약 저장·조회 (localStorage)
- `js/stats.js` 손님 방문 이력 계산
- `js/dates.js` 날짜 표시 형식 변환
- `js/home.js` / `customer.js` / `customers.js` / `settings.js` 각 화면 동작

앞의 네 파일은 순수 로직이고 `test/`에서 테스트한다. 뒤의 네 파일은 DOM만 다룬다.

## 데이터

브라우저 `localStorage`의 `reservations` 키에 JSON 배열로 저장된다.
서버·계정·네트워크 요청이 없다. 설정 화면에서 파일로 내보내고 다시 불러올 수 있다.

## 문서

| | |
|---|---|
| [홈](docs/wiki/Home.md) | 개요 |
| [왜 만들었나](docs/wiki/Background.md) | 관찰, 그리고 관찰이 틀렸던 것들 |
| [설계 결정](docs/wiki/Design.md) | 성공 기준, 원칙, 비용 문제를 푼 방법 |
| [기능](docs/wiki/Features.md) | 화면별로 무엇이 되는가 |
| [기술 구조](docs/wiki/Architecture.md) | 파일 구조와 그렇게 나눈 이유 |
| [개발 기록](docs/wiki/Devlog.md) | 실제로 잡힌 버그와 교훈 |
| [남은 일](docs/wiki/Roadmap.md) | 갈림길과 2단계 |

원본 설계·계획서: `docs/specs/`, `docs/plans/`
