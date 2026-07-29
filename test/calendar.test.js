import { test } from 'node:test'
import assert from 'node:assert/strict'
import { monthGrid, addMonths, countByDate } from '../js/calendar.js'

test('격자는 항상 42칸이다', () => {
  // 달마다 줄 수가 바뀌면 아래 목록이 흔들린다
  assert.equal(monthGrid(2026, 7).length, 42)
  assert.equal(monthGrid(2026, 2).length, 42)
  assert.equal(monthGrid(2026, 8).length, 42)
})

test('그 달 1일이 속한 주의 일요일부터 시작한다', () => {
  // 2026년 7월 1일은 수요일 → 그 주 일요일은 6월 28일
  const cells = monthGrid(2026, 7)
  assert.equal(cells[0].date, '2026-06-28')
  assert.equal(cells[41].date, '2026-08-08')
})

test('그 달에 속한 날만 inMonth 가 참이다', () => {
  const cells = monthGrid(2026, 7)
  assert.equal(cells.filter((c) => c.inMonth).length, 31)
  assert.equal(cells[0].inMonth, false)   // 6/28
  assert.equal(cells[3].inMonth, true)    // 7/1
})

test('2월 같은 짧은 달도 42칸을 채운다', () => {
  const cells = monthGrid(2026, 2)
  assert.equal(cells.filter((c) => c.inMonth).length, 28)
  assert.equal(cells.length, 42)
})

test('다음 달로 옮긴다', () => {
  assert.deepEqual(addMonths(2026, 7, 1), { year: 2026, month: 8 })
})

test('12월 다음은 다음 해 1월이다', () => {
  assert.deepEqual(addMonths(2026, 12, 1), { year: 2027, month: 1 })
})

test('1월 이전은 지난 해 12월이다', () => {
  assert.deepEqual(addMonths(2026, 1, -1), { year: 2025, month: 12 })
})

test('날짜별로 예약 건수를 센다', () => {
  const counts = countByDate([
    { date: '2026-07-29' },
    { date: '2026-07-29' },
    { date: '2026-07-30' },
  ])
  assert.equal(counts.get('2026-07-29'), 2)
  assert.equal(counts.get('2026-07-30'), 1)
  assert.equal(counts.get('2026-07-31'), undefined)
})

test('예약이 없으면 빈 목록이다', () => {
  assert.equal(countByDate([]).size, 0)
})
