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
