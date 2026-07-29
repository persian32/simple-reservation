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
  assert.equal(r.durationMin, 90)      // 염색 기본값
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
