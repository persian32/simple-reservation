# 심플예약

미용실 예약 관리 웹앱. **서버·의존성·비용 0원.** 데이터는 폰 안에만 있다.

**앱** https://persian32.github.io/simple-reservation/

---

## 한 줄로

> 단골 헤어샵 사장님이 벽 달력에 볼펜으로 적는 예약을, **손님별 기억으로 바꿔주는 앱.**

일반 캘린더가 못 하는 일이 딱 하나 있다 — **"이 손님 지난번에 뭐 했더라"**. 그 하나를 위해 만들었다.

---

## 문서

| | |
|---|---|
| [왜 만들었나](Background) | 관찰, 그리고 관찰이 틀렸던 것들 |
| [설계 결정](Design) | 성공 기준, 원칙, 비용 문제를 푼 방법 |
| [기능](Features) | 화면별로 무엇이 되는가 |
| [기술 구조](Architecture) | 파일 구조와 그렇게 나눈 이유 |
| [개발 기록](Devlog) | 실제로 잡힌 버그와 교훈 |
| [남은 일](Roadmap) | 갈림길과 2단계 |

---

## 지금 상태

- 1단계(손 입력 앱) **완성·배포**
- 테스트 **53개** 통과, 의존성 **0개**
- 2단계(사진 판독)는 **조건부 보류** — [남은 일](Roadmap) 참고

## 써보기

```bash
git clone https://github.com/persian32/simple-reservation.git
cd simple-reservation
python3 -m http.server 8000   # http://localhost:8000
npm test                       # 53개
```

빌드도, `npm install` 도 없다.
