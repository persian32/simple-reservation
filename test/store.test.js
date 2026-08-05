import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from '../js/store.js'

// localStorage 흉내. 브라우저 없이 테스트하기 위한 가짜 저장소.
function fakeStorage() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, v),
  }
}

// id와 시각을 고정해 테스트 결과가 매번 같게 만든다
function makeStore() {
  let n = 0
  return createStore(fakeStorage(), {
    uid: () => `id${++n}`,
    now: () => '2026-03-17T09:00:00.000Z',
  })
}

test('처음에는 예약이 없다', () => {
  const store = makeStore()
  assert.deepEqual(store.list(), [])
})

test('예약을 추가하면 목록에 들어간다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })

  const rows = store.list()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].customerName, '화선언니')
  assert.equal(rows[0].service, '염색')
})

test('추가할 때 빠진 값은 자동으로 채워진다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', service: '염색' })

  const r = store.list()[0]
  assert.equal(r.id, 'id1')
  assert.equal(r.customerName, '')     // 이름은 없을 수 있다
  assert.equal(r.durationMin, 30)      // 값이 빠졌을 때의 안전망
  assert.equal(r.status, 'active')
  assert.equal(r.source, 'manual')
  assert.equal(r.createdAt, '2026-03-17T09:00:00.000Z')
  assert.equal(r.updatedAt, '2026-03-17T09:00:00.000Z')
})

test('소요 시간을 직접 주면 기본값 대신 그 값을 쓴다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', service: '염색', durationMin: 120 })
  assert.equal(store.list()[0].durationMin, 120)
})

test('취소하면 지워지지 않고 상태만 바뀐다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', service: '염색' })
  store.cancel('id1')

  const rows = store.list()
  assert.equal(rows.length, 1)          // 여전히 남아 있다
  assert.equal(rows[0].status, 'cancelled')
})

test('삭제하면 목록에서 사라진다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', service: '염색' })
  store.remove('id1')
  assert.equal(store.list().length, 0)
})

test('날짜로 찾으면 시간순으로 나온다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '18:00', service: '펌' })
  store.add({ date: '2026-03-17', time: '10:20', service: '염색' })
  store.add({ date: '2026-03-18', time: '11:00', service: '매직' })

  const rows = store.byDate('2026-03-17')
  assert.equal(rows.length, 2)
  assert.equal(rows[0].time, '10:20')
  assert.equal(rows[1].time, '18:00')
})

test('손님 이름으로 찾으면 최근 방문이 먼저 나온다', () => {
  const store = makeStore()
  store.add({ date: '2026-01-20', time: '10:00', customerName: '화선언니', service: '펌' })
  store.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })
  store.add({ date: '2026-03-18', time: '11:00', customerName: '김미영', service: '매직' })

  const rows = store.byCustomer('화선언니')
  assert.equal(rows.length, 2)
  assert.equal(rows[0].date, '2026-03-17')
  assert.equal(rows[1].date, '2026-01-20')
})

test('취소된 예약은 손님 이력에서 빠진다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })
  store.cancel('id1')
  assert.equal(store.byCustomer('화선언니').length, 0)
})

test('내보내기는 예약 전체를 JSON 문자열로 준다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', service: '염색' })

  const parsed = JSON.parse(store.exportJson())
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].service, '염색')
})

test('되살리면 다시 활성 상태가 된다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', service: '염색' })
  store.cancel('id1')
  store.restore('id1')

  const rows = store.list()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].status, 'active')
})

test('되살린 예약은 손님 이력에 다시 나온다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })
  store.cancel('id1')
  assert.equal(store.byCustomer('화선언니').length, 0)

  store.restore('id1')
  assert.equal(store.byCustomer('화선언니').length, 1)
})

test('예약 내용을 고칠 수 있다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })
  store.update('id1', { time: '15:00', durationMin: 120 })

  const r = store.list()[0]
  assert.equal(r.time, '15:00')
  assert.equal(r.durationMin, 120)
  assert.equal(r.customerName, '화선언니')   // 안 건드린 값은 그대로
  assert.equal(r.id, 'id1')                  // 같은 예약이다
})

test('고쳐도 방문 횟수가 늘지 않는다', () => {
  // 지우고 새로 넣으면 이력에 방문이 하나 더 생겨 숫자가 틀어진다
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })
  store.update('id1', { date: '2026-03-18' })

  assert.equal(store.byCustomer('화선언니').length, 1)
  assert.equal(store.byCustomer('화선언니')[0].date, '2026-03-18')
})

test('없는 예약을 고치려 하면 null 을 돌려준다', () => {
  const store = makeStore()
  assert.equal(store.update('없는id', { time: '11:00' }), null)
})

// ── 백업 불러오기 ──────────────────────────────────────

test('백업 파일을 불러오면 예약이 되살아난다', () => {
  const old = makeStore()
  old.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })
  const backup = old.exportJson()

  // 새 폰 — 비어 있는 저장소
  const fresh = makeStore()
  assert.deepEqual(fresh.importJson(backup), { added: 1, skipped: 0 })
  assert.equal(fresh.byCustomer('화선언니').length, 1)
})

test('같은 파일을 두 번 불러도 예약이 두 배가 되지 않는다', () => {
  const store = makeStore()
  store.add({ date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' })
  const backup = store.exportJson()

  store.importJson(backup)
  assert.deepEqual(store.importJson(backup), { added: 0, skipped: 1 })
  assert.equal(store.list().length, 1)
})

test('불러오기는 이미 있는 예약을 지우지 않는다', () => {
  // 실제 id 는 crypto.randomUUID() 라 폰이 달라도 겹치지 않는다
  const backup = JSON.stringify([
    { id: 'uuid-옛폰', date: '2026-03-17', time: '10:20', customerName: '화선언니', service: '염색' },
  ])

  const store = makeStore()
  store.add({ date: '2026-04-01', time: '14:00', customerName: '박선주', service: '펌' })
  store.importJson(backup)

  assert.equal(store.list().length, 2)
  assert.equal(store.byCustomer('박선주').length, 1)   // 원래 있던 것이 남아 있다
  assert.equal(store.byCustomer('화선언니').length, 1) // 불러온 것도 들어왔다
})

test('예약 파일이 아니면 거부한다', () => {
  const store = makeStore()
  assert.throws(() => store.importJson('{"a":1}'), /백업 파일이 아닙니다/)
  assert.throws(() => store.importJson('그냥 글자'))       // JSON 자체가 아님
  assert.equal(store.list().length, 0)                    // 아무것도 안 들어갔다
})

test('모양이 깨진 줄은 건너뛴다', () => {
  const store = makeStore()
  const 반쪽 = JSON.stringify([
    { id: 'x1', date: '2026-03-17', time: '10:20', service: '염색' },
    { id: 'x2', date: '2026-03-18' },                     // 시각·시술 없음
    null,
  ])

  assert.deepEqual(store.importJson(반쪽), { added: 1, skipped: 2 })
})

// ── 금액 ────────────────────────────────────────────────

test('금액을 넣으면 그대로 저장된다', () => {
  const store = makeStore()
  const row = store.add({ date: '2026-08-01', time: '10:00', service: '펌', price: 80000 })
  assert.equal(row.price, 80000)
})

test('금액을 안 넣으면 null 이다', () => {
  // 예약을 잡는 시점엔 금액을 모를 수 있다. 0 이 아니라 null 이어야
  // 손님 이력에서 '0원' 으로 잘못 보이지 않는다.
  const store = makeStore()
  assert.equal(store.add({ date: '2026-08-01', time: '10:00', service: '펌' }).price, null)
})

test('시술이 끝난 뒤 금액만 채워 넣을 수 있다', () => {
  const store = makeStore()
  const row = store.add({ date: '2026-08-01', time: '10:00', service: '펌' })
  store.update(row.id, { price: 80000 })
  assert.equal(store.list()[0].price, 80000)
})

test('금액 없이 만든 옛 백업을 불러와도 모양이 같다', () => {
  const store = makeStore()
  const { added } = store.importJson(JSON.stringify([
    { id: 'old1', date: '2026-07-02', time: '10:00', service: '염색' },
  ]))
  assert.equal(added, 1)
  assert.equal(store.list()[0].price, null)
})
