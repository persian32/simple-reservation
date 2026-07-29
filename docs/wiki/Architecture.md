# 기술 구조

## 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 형태 | 웹앱(PWA) | 아이폰·갤럭시 한 벌, 심사 불필요, **고치면 즉시 반영** |
| 프론트 | 순수 HTML/CSS/JS | 프레임워크 없이 구조를 전부 이해하려는 학습 목적 |
| 저장 | `localStorage` | 서버 없음 |
| 테스트 | `node --test` | 의존성 0. `npm install` 할 것이 없다 |
| 배포 | GitHub Pages | 무료, `git push` 하면 자동 반영 |

**`package.json` 의 `dependencies` 와 `devDependencies` 는 끝까지 비어 있다.**

---

## 파일 구조

```
js/services.js   시술 목록·별칭          ┐
js/store.js      예약 저장·조회·수정      │ 순수 로직
js/stats.js      손님 이력 계산           │ 저장소를 주입받아 DOM과 분리
js/dates.js      날짜 형식·종료 시각      │ → node --test 로 검증 (53개)
js/calendar.js   월간 격자                ┘

js/home.js       홈(달력+목록+폼+메뉴)    ┐
js/customer.js   손님 이력                │ DOM만 다룸
js/customers.js  손님 목록                │ → 눈으로 확인
js/settings.js   설정                     ┘

sw.js            오프라인 캐시
manifest.json    홈 화면 설치 정보
```

### 왜 이렇게 나눴나

**화면 코드는 자동 테스트 비용이 실익보다 크다.** 대신 계산은 전부 테스트로 잡는다. 앞의 다섯 파일은 `document`·`window`·`localStorage` 를 **직접 참조하지 않는다.** 저장소를 인자로 받는다.

```js
// 브라우저
const store = createStore(localStorage)

// 테스트 — 가짜 저장소를 넣는다
const store = createStore(fakeStorage(), { uid: () => 'id1', now: () => '...' })
```

id 생성기와 시계도 주입한다. 그래야 테스트 결과가 매번 같다.

---

## 데이터

브라우저 `localStorage` 에 키 두 개.

**`reservations`** — 예약 배열

| 필드 | |
|---|---|
| `id` | 고유 번호 |
| `date` / `time` | `'2026-07-29'` / `'10:20'` — **문자열.** `Date` 객체를 저장하지 않는다(직렬화 문제와 시간대 함정을 피한다) |
| `customerName` | 없을 수 있다 |
| `service` / `durationMin` | 시술명 문자열 / 분 |
| `status` | `active` \| `cancelled` |
| `source` | `manual` \| `photo` — 2단계에서 덮어쓰기 규칙에 쓴다 |
| `createdAt` / `updatedAt` | ISO 문자열 |

**`services`** — 시술 목록. 저장된 게 없으면 기본 7종을 쓴다.

### 지금 안 쓰는데 넣어둔 것

`id` 와 `updatedAt` 은 현재 화면에서 쓰지 않는다. **몇 년 뒤 서버를 붙여 직원과 공유할 때 이 둘이 없으면 데이터를 통째로 갈아엎어야 한다.** 지금 넣는 비용은 0이다.

`source` 도 마찬가지 — 2단계에서 "사진은 사진이 넣은 것만 갈아엎는다"는 규칙에 쓴다.

### 용량

예약 1건 약 100바이트 × 연 3,000건 = 연 300KB. 5년 써도 1.5MB로 `localStorage` 한도(약 5MB) 안에 들어온다.

> `ponytail: localStorage 전체를 매번 읽고 쓴다. 수천 건까지는 체감 지연이 없다. 느려지면 IndexedDB 로 옮긴다.`

---

## 오프라인 동작

`sw.js` 가 앱 파일 18개를 폰에 저장한다. 데이터는 원래 폰 안에 있으므로, **파일만 캐시되면 완전히 오프라인으로 동작한다.**

두 가지가 핵심이다. 둘 다 **실제로 사고를 낸 뒤에** 넣었다.

```js
self.addEventListener('install', (e) => {
  self.skipWaiting()                                   // ① 새 버전을 바로 활성화
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))   // ② 서버에서 새로 받는다
    )
  )
})
```

**① `skipWaiting`** — 없으면 앱을 완전히 종료할 때까지 새 버전이 대기한다. 홈 화면 PWA는 몇 주씩 안 죽으므로 그동안 구버전이 계속 뜬다. **웹앱을 고른 이유("고치면 즉시 반영")를 무력화한다.**

**② `{ cache: 'reload' }`** — 없으면 브라우저에 남아 있던 옛 사본을 그대로 캐시에 저장한다. 새 파일과 옛 파일이 섞여 **앱이 통째로 죽는다.**

그리고 서비스워커 등록은 `js/home.js` 가 아니라 **`index.html` 인라인 스크립트**에 있다.

```html
<script>
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js')
</script>
```

`home.js` 안에 두면, `home.js` 가 오류로 죽었을 때 등록도 안 된다. **한 번 깨진 기기는 새 버전을 영영 못 받는다.** 자세한 경위는 [개발 기록](Devlog#서비스워커-두-버그) 참고.

**파일을 고칠 때마다 `sw.js` 의 `CACHE` 이름을 올려야 한다.**

---

## 테스트

```bash
npm test    # 53개
```

| 파일 | 개수 |
|---|---|
| `test/services.test.js` | 14 |
| `test/store.test.js` | 15 |
| `test/stats.test.js` | 12 |
| `test/calendar.test.js` | 9 |
| `test/dates.test.js` | 3 |

화면 코드에는 테스트를 만들지 않는다. 대신 브라우저에서 눈으로 확인한다.

> 개발 중에는 헤드리스 Chrome 을 CDP 로 직접 몰아서 클릭·입력·화면 캡처까지 자동 확인했다. 의존성을 늘리지 않으려고 Puppeteer 없이 WebSocket 으로 붙였다.
