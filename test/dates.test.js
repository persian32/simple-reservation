import { test } from 'node:test'
import assert from 'node:assert/strict'
import { endTime } from '../js/dates.js'

test('시작 시각에 소요 시간을 더해 끝나는 시각을 구한다', () => {
  assert.equal(endTime('10:20', 90), '11:50')
  assert.equal(endTime('13:00', 30), '13:30')
})

test('시간 단위를 넘어가도 맞게 계산한다', () => {
  assert.equal(endTime('15:30', 150), '18:00')
  assert.equal(endTime('09:50', 20), '10:10')
})

test('자정을 넘기면 24시간으로 되돌린다', () => {
  assert.equal(endTime('23:30', 60), '00:30')
})
