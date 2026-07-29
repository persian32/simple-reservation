import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SERVICES, createServices } from '../js/services.js'

// localStorage 흉내
function fakeStorage() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, v),
  }
}

test('기본 시술 목록은 7개다', () => {
  assert.equal(DEFAULT_SERVICES.length, 7)
})

test('기본 목록의 첫 항목은 남자커트다', () => {
  // 언니가 많이 하는 순서대로 정렬되어 있어야 입력할 때 위쪽에서 바로 고른다
  assert.equal(DEFAULT_SERVICES[0].name, '남자커트')
})

test('아무것도 저장된 게 없으면 기본 목록을 쓴다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.list().length, 7)
})

test('확인된 기본 소요 시간을 돌려준다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.defaultMinutes('남자커트'), 30)
  assert.equal(services.defaultMinutes('펌'), 150)
})

test('목록에 없는 시술은 30분으로 처리한다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.defaultMinutes('없는시술'), 30)
})

test('시술을 추가하면 목록에 들어간다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.add('세팅', 60), true)

  assert.equal(services.list().length, 8)
  assert.equal(services.defaultMinutes('세팅'), 60)
})

test('같은 이름은 두 번 추가되지 않는다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.add('세팅', 60), true)
  assert.equal(services.add('세팅', 90), false)

  assert.equal(services.list().length, 8)
  assert.equal(services.defaultMinutes('세팅'), 60)   // 먼저 넣은 값이 남는다
})

test('시술을 지우면 목록에서 빠진다', () => {
  const services = createServices(fakeStorage())
  services.remove('매직')

  assert.equal(services.list().length, 6)
  assert.equal(services.list().some((s) => s.name === '매직'), false)
})

test('마지막 한 개는 지울 수 없다', () => {
  // 목록이 비면 예약을 아예 못 넣게 된다
  const storage = fakeStorage()
  const services = createServices(storage)
  for (const s of [...services.list()].slice(1)) services.remove(s.name)

  assert.equal(services.list().length, 1)
  assert.equal(services.remove(services.list()[0].name), false)
  assert.equal(services.list().length, 1)
})

test('한 저장소를 공유하면 변경이 보인다', () => {
  const storage = fakeStorage()
  createServices(storage).add('세팅', 60)

  assert.equal(createServices(storage).list().length, 8)
})
