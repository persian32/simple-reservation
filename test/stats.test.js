import { test } from 'node:test'
import assert from 'node:assert/strict'
import { customerStats, customerList } from '../js/stats.js'

test('방문 기록이 없으면 0회', () => {
  const s = customerStats([])
  assert.equal(s.count, 0)
  assert.equal(s.lastVisit, null)
  assert.equal(s.avgIntervalDays, null)
})

test('한 번만 방문했으면 평균 간격은 알 수 없다', () => {
  const s = customerStats([{ date: '2026-03-17' }])
  assert.equal(s.count, 1)
  assert.equal(s.lastVisit, '2026-03-17')
  assert.equal(s.avgIntervalDays, null)  // 간격을 잴 두 점이 없다
})

test('두 번 방문하면 그 사이 일수가 평균 간격', () => {
  // 1/20 → 3/17 은 56일
  const s = customerStats([{ date: '2026-03-17' }, { date: '2026-01-20' }])
  assert.equal(s.count, 2)
  assert.equal(s.avgIntervalDays, 56)
})

test('세 번 이상이면 처음부터 마지막까지를 간격 수로 나눈다', () => {
  // 1/1 → 1/11 → 1/21 : 총 20일을 2번의 간격으로 나눠 10일
  const s = customerStats([
    { date: '2026-01-21' },
    { date: '2026-01-11' },
    { date: '2026-01-01' },
  ])
  assert.equal(s.count, 3)
  assert.equal(s.avgIntervalDays, 10)
})

test('입력 순서가 뒤죽박죽이어도 결과는 같다', () => {
  const s = customerStats([
    { date: '2026-01-11' },
    { date: '2026-01-21' },
    { date: '2026-01-01' },
  ])
  assert.equal(s.lastVisit, '2026-01-21')
  assert.equal(s.avgIntervalDays, 10)
})

test('평균 간격은 반올림한 정수', () => {
  // 1/1 → 1/08 → 1/09 : 총 8일 / 2번 = 4일
  const s = customerStats([
    { date: '2026-01-01' },
    { date: '2026-01-08' },
    { date: '2026-01-09' },
  ])
  assert.equal(s.avgIntervalDays, 4)
})

test('손님이 없으면 빈 목록', () => {
  assert.deepEqual(customerList([]), [])
})

test('이름별로 묶어서 방문 횟수를 센다', () => {
  const list = customerList([
    { customerName: '화선언니', date: '2026-03-17', status: 'active' },
    { customerName: '화선언니', date: '2026-01-20', status: 'active' },
    { customerName: '김미영', date: '2026-02-10', status: 'active' },
  ])
  assert.equal(list.length, 2)
  assert.equal(list[0].name, '화선언니')
  assert.equal(list[0].count, 2)
})

test('마지막 방문이 최근인 손님이 먼저 나온다', () => {
  const list = customerList([
    { customerName: '김미영', date: '2026-02-10', status: 'active' },
    { customerName: '화선언니', date: '2026-03-17', status: 'active' },
  ])
  assert.equal(list[0].name, '화선언니')
  assert.equal(list[1].name, '김미영')
})

test('이름 없는 예약은 목록에 안 들어간다', () => {
  const list = customerList([
    { customerName: '', date: '2026-03-17', status: 'active' },
    { customerName: '화선언니', date: '2026-03-17', status: 'active' },
  ])
  assert.equal(list.length, 1)
  assert.equal(list[0].name, '화선언니')
})

test('취소된 예약은 방문으로 세지 않는다', () => {
  const list = customerList([
    { customerName: '화선언니', date: '2026-03-17', status: 'cancelled' },
    { customerName: '화선언니', date: '2026-01-20', status: 'active' },
  ])
  assert.equal(list.length, 1)
  assert.equal(list[0].count, 1)
  assert.equal(list[0].lastVisit, '2026-01-20')
})

test('모든 예약이 취소된 손님은 목록에 안 나온다', () => {
  const list = customerList([
    { customerName: '화선언니', date: '2026-03-17', status: 'cancelled' },
  ])
  assert.deepEqual(list, [])
})

// ── 다가올 예약과 지난 방문 구분 ──────────────────────────

test('오늘 이후 예약은 다음 예약으로 따로 나온다', () => {
  const list = customerList([
    { customerName: '재민이', date: '2026-08-14', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].nextVisit, '2026-08-14')
  assert.equal(list[0].count, 0)          // 아직 안 왔으므로 방문 0회
  assert.equal(list[0].lastVisit, null)
})

test('오늘 예약은 방문으로 센다', () => {
  // 오늘 10시 예약인지 5시 예약인지 날짜만으로는 못 가른다. 온 것으로 친다.
  const list = customerList([
    { customerName: '박민혜', date: '2026-08-05', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].count, 1)
  assert.equal(list[0].nextVisit, null)
})

test('지난 방문과 다가올 예약이 같이 있으면 둘 다 나온다', () => {
  const list = customerList([
    { customerName: '정화선', date: '2026-07-02', status: 'active' },
    { customerName: '정화선', date: '2026-08-14', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].count, 1)              // 지난 방문만
  assert.equal(list[0].lastVisit, '2026-07-02')
  assert.equal(list[0].nextVisit, '2026-08-14')
})

test('다가올 예약이 여럿이면 가장 이른 것이 다음 예약', () => {
  const list = customerList([
    { customerName: '정화선', date: '2026-08-20', status: 'active' },
    { customerName: '정화선', date: '2026-08-08', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].nextVisit, '2026-08-08')
})

test('정렬은 예전 그대로 — 가장 늦은 날짜가 위로', () => {
  const list = customerList([
    { customerName: '정화선', date: '2026-07-02', status: 'active' },
    { customerName: '재민이', date: '2026-08-14', status: 'active' },
  ], '2026-08-05')
  assert.deepEqual(list.map((c) => c.name), ['재민이', '정화선'])
})

test('오늘을 안 넘기면 예전처럼 전부 센다', () => {
  // 손님 이력 화면은 다가올 예약도 줄로 보여주므로 그대로 둔다
  const s = customerStats([{ date: '2026-08-14' }])
  assert.equal(s.count, 1)
  assert.equal(s.lastVisit, '2026-08-14')
})

test('평균 주기에 다가올 예약은 안 섞인다', () => {
  // 1/20 → 3/17 은 56일. 8/14 예약이 섞이면 값이 늘어난다
  const s = customerStats(
    [{ date: '2026-01-20' }, { date: '2026-03-17' }, { date: '2026-08-14' }],
    '2026-08-05'
  )
  assert.equal(s.count, 2)
  assert.equal(s.avgIntervalDays, 56)
})

// ── 목록에 보여줄 마지막 시술 ────────────────────────────

test('마지막으로 다녀간 날의 시술이 나온다', () => {
  const list = customerList([
    { customerName: '정화선', date: '2026-01-20', time: '10:00', service: '펌', status: 'active' },
    { customerName: '정화선', date: '2026-03-17', time: '10:00', service: '염색', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].lastVisit, '2026-03-17')
  assert.equal(list[0].lastService, '염색')
})

test('다가올 예약의 시술은 최근 시술이 아니다', () => {
  // 8/20 매직셋팅은 아직 안 한 것. 이걸 보여주면 한 것처럼 읽힌다
  const list = customerList([
    { customerName: '정화선', date: '2026-08-01', time: '10:00', service: '염색', status: 'active' },
    { customerName: '정화선', date: '2026-08-20', time: '10:00', service: '매직셋팅', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].lastService, '염색')
})

test('같은 날 두 건이면 늦은 시각의 시술', () => {
  const list = customerList([
    { customerName: '정화선', date: '2026-08-01', time: '15:00', service: '펌', status: 'active' },
    { customerName: '정화선', date: '2026-08-01', time: '10:00', service: '남자커트', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].lastService, '펌')
})

test('아직 안 온 손님은 보여줄 시술이 없다', () => {
  const list = customerList([
    { customerName: '재민이', date: '2026-08-14', time: '10:00', service: '펌', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].lastService, null)
})

test('취소된 예약의 시술은 안 나온다', () => {
  const list = customerList([
    { customerName: '정화선', date: '2026-03-17', time: '10:00', service: '염색', status: 'cancelled' },
    { customerName: '정화선', date: '2026-01-20', time: '10:00', service: '펌', status: 'active' },
  ], '2026-08-05')
  assert.equal(list[0].lastService, '펌')
})
