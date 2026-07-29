# 예약

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

- `js/services.js` 시술 목록과 기본 소요 시간
- `js/store.js` 예약 저장·조회 (localStorage)
- `js/stats.js` 손님 방문 이력 계산
- `js/dates.js` 날짜 표시 형식 변환
- `js/home.js` / `customer.js` / `customers.js` / `settings.js` 각 화면 동작

앞의 네 파일은 순수 로직이고 `test/`에서 테스트한다. 뒤의 네 파일은 DOM만 다룬다.

## 데이터

브라우저 `localStorage`의 `reservations` 키에 JSON 배열로 저장된다.
서버·계정·네트워크 요청이 없다. 설정 화면에서 파일로 내보낼 수 있다.

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
