import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SERVICES, defaultMinutes } from '../js/services.js'

test('시술 목록은 7개다', () => {
  assert.equal(SERVICES.length, 7)
})

test('시술 목록의 첫 항목은 남자커트다', () => {
  // 언니가 많이 하는 순서대로 정렬되어 있어야 입력할 때 위쪽에서 바로 고른다
  assert.equal(SERVICES[0].name, '남자커트')
})

test('확인된 기본 소요 시간을 돌려준다', () => {
  assert.equal(defaultMinutes('남자커트'), 30)
  assert.equal(defaultMinutes('펌'), 150)
})

test('목록에 없는 시술은 30분으로 처리한다', () => {
  assert.equal(defaultMinutes('없는시술'), 30)
})
