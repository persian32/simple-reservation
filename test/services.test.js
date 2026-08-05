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
  // 중복이면 false 가 아니라 부딪힌 시술의 정식 이름을 돌려준다
  assert.equal(services.add('세팅', 90), '세팅')

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

test('별칭으로도 같은 시술을 찾는다', () => {
  // 말로는 "펌"이라 해도 종이에는 "파마"라고 쓴다. 둘이 갈라지면 이력이 쪼개진다.
  const services = createServices(fakeStorage())
  assert.equal(services.resolve('파마'), '펌')
  assert.equal(services.resolve('펌'), '펌')
  assert.equal(services.resolve('없는시술'), null)
})

test('별칭으로 물어도 기본 시간이 나온다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.defaultMinutes('파마'), 150)
})

test('별칭을 새 시술로 추가하려 하면 정식 이름을 알려준다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.add('파마', 100), '펌')
  assert.equal(services.list().length, 7)          // 늘어나지 않는다
  assert.equal(services.defaultMinutes('펌'), 150)  // 기존 값이 유지된다
})

test('같은 이름을 다시 넣으면 그 이름을 돌려준다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.add('염색', 60), '염색')
  assert.equal(services.list().length, 7)
})

test('시술을 한 칸 위로 올린다', () => {
  const services = createServices(fakeStorage())
  // 기본 목록: 남자커트, 펌, 여자커트, ...
  assert.equal(services.moveUp('여자커트'), true)
  assert.deepEqual(services.list().slice(0, 3).map((s) => s.name), ['남자커트', '여자커트', '펌'])
})

test('맨 위 시술은 더 올라가지 않는다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.moveUp('남자커트'), false)
  assert.equal(services.list()[0].name, '남자커트')
})

test('없는 시술을 올리려 하면 아무 일도 없다', () => {
  const services = createServices(fakeStorage())
  assert.equal(services.moveUp('없는시술'), false)
  assert.equal(services.list().length, 7)
})

test('여러 번 올리면 맨 위까지 간다', () => {
  // 언니가 매직셋팅 같은 걸 나중에 추가해도 위로 끌어올릴 수 있어야 한다
  const services = createServices(fakeStorage())
  services.add('매직셋팅', 180)
  for (let i = 0; i < 7; i++) services.moveUp('매직셋팅')
  assert.equal(services.list()[0].name, '매직셋팅')
})
