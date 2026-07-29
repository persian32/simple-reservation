import { createStore } from './store.js'
import { todayISO, formatDay } from './dates.js'
import { createServices } from './services.js'

const store = createStore(localStorage)
const services = createServices(localStorage)

// 오늘·내일에는 이름을 붙여 눈에 띄게 한다
function dayLabel(iso, today, tomorrow) {
  if (iso === today) return `오늘  ${formatDay(iso)}`
  if (iso === tomorrow) return `내일  ${formatDay(iso)}`
  return formatDay(iso)
}

// 예약 한 줄을 그린다
function renderRow(r) {
  const el = document.createElement('div')
  el.className = r.status === 'cancelled' ? 'row cancelled' : 'row'
  el.dataset.id = r.id

  const time = document.createElement('span')
  time.className = 'time'
  time.textContent = r.time

  const name = document.createElement('span')
  name.className = 'name'
  // 이름이 있으면 눌러서 이력으로 갈 수 있게 한다.
  // 언니가 종이에 이름을 안 적는 경우가 많으므로 없으면 그냥 비워둔다.
  if (r.customerName) {
    const link = document.createElement('a')
    link.href = `customer.html?name=${encodeURIComponent(r.customerName)}`
    link.textContent = r.customerName
    name.append(link)
  }

  const service = document.createElement('span')
  service.className = 'service'
  service.textContent = r.service

  el.append(time, name, service)
  return el
}

// 전체 목록을 다시 그린다.
// 오늘 이후만 보여준다 — 지나간 예약은 손님 이력 화면에서 본다.
function render() {
  const today = todayISO()
  const tomorrow = todayISO(new Date(Date.now() + 86400000))

  const upcoming = store
    .list()
    .filter((r) => r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const list = document.getElementById('list')
  list.textContent = ''

  if (upcoming.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'empty'
    empty.textContent = '예약이 없습니다'
    list.append(empty)
    return
  }

  // 날짜가 바뀔 때마다 구분 줄을 넣는다
  let currentDate = null
  for (const r of upcoming) {
    if (r.date !== currentDate) {
      currentDate = r.date
      const head = document.createElement('div')
      head.className = 'day'
      head.textContent = dayLabel(r.date, today, tomorrow)
      list.append(head)
    }
    list.append(renderRow(r))
  }
}

// 제목에 이번 달을 표시
const nowDate = new Date()
document.getElementById('monthTitle').textContent =
  `${nowDate.getMonth() + 1}월 ${nowDate.getFullYear()}`

render()

// ── 예약 추가 ──────────────────────────────────────────

const dialog = document.getElementById('addDialog')
const serviceSelect = document.getElementById('f-service')
const durationOut = document.getElementById('f-duration')

// 현재 표시 중인 소요 시간(분)
let durationMin = 30

function showDuration() {
  durationOut.textContent = `${durationMin}분`
}

// 시술 선택칸을 채운다. 맨 끝에 "새 시술 추가"를 붙인다 —
// 시술을 고르다가 목록에 없는 걸 발견하는 곳이 바로 여기라서,
// 설정 화면까지 두 번 이동하게 만들면 아무도 안 쓴다.
const ADD_NEW = '__add_new__'

function fillServices(selected) {
  serviceSelect.textContent = ''
  for (const s of services.list()) {
    const option = document.createElement('option')
    option.value = s.name
    option.textContent = s.name
    serviceSelect.append(option)
  }
  const addOption = document.createElement('option')
  addOption.value = ADD_NEW
  addOption.textContent = '+ 새 시술 추가…'
  serviceSelect.append(addOption)

  serviceSelect.value = selected && services.list().some((s) => s.name === selected)
    ? selected
    : services.list()[0].name
}

// 시술을 바꾸면 기본 시간이 자동으로 들어간다.
// 언니가 이 칸에 손을 안 대고도 저장할 수 있어야 한다.
serviceSelect.addEventListener('change', () => {
  if (serviceSelect.value === ADD_NEW) {
    const name = (prompt('새 시술 이름을 적어주세요\n(예: 세팅)') || '').trim()
    // 지금 화면에 보이는 예상 시간을 그 시술의 기본값으로 삼는다
    if (name) services.add(name, durationMin)
    fillServices(name)
  }
  durationMin = services.defaultMinutes(serviceSelect.value)
  showDuration()
})

// 10분 단위 조절. 같은 시술이라도 머리숱·기장에 따라 시간이 다르다.
document.getElementById('f-minus').addEventListener('click', () => {
  durationMin = Math.max(10, durationMin - 10)
  showDuration()
})
document.getElementById('f-plus').addEventListener('click', () => {
  durationMin += 10
  showDuration()
})

// 폼을 열 때마다 오늘 날짜와 다음 정시로 초기화한다
document.getElementById('addBtn').addEventListener('click', () => {
  const now = new Date()
  document.getElementById('f-date').value = todayISO(now)
  document.getElementById('f-time').value =
    `${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`

  // 시술 목록을 새로 채운다 — 설정에서 추가·삭제한 것이 바로 반영되게
  fillServices()
  durationMin = services.defaultMinutes(serviceSelect.value)
  showDuration()
  document.getElementById('f-name').value = ''

  // 이미 있는 손님 이름을 제안한다 — 오타 하나로 이력이 쪼개지는 걸 막는다
  const knownNames = document.getElementById('knownNames')
  knownNames.textContent = ''
  const names = [...new Set(store.list().map((r) => r.customerName).filter(Boolean))]
  knownNames.append(...names.map((n) => {
    const option = document.createElement('option')
    option.value = n
    return option
  }))

  dialog.showModal()
})

document.getElementById('f-cancel').addEventListener('click', () => dialog.close())

document.getElementById('addForm').addEventListener('submit', () => {
  const saved = store.add({
    date: document.getElementById('f-date').value,
    time: document.getElementById('f-time').value,
    service: serviceSelect.value,
    durationMin,
    customerName: document.getElementById('f-name').value.trim(),
  })
  render()
  // 지난 날짜는 홈 목록에서 걸러지므로, 저장이 안 된 줄 알고 다시 넣는 걸 막는다
  if (saved.date < todayISO()) {
    alert('저장했습니다. 지난 날짜라 목록에는 안 보이고 손님 이력에만 남습니다.')
  }
})

// ── 예약 동작 메뉴 ──────────────────────────────────────

const actionDialog = document.getElementById('actionDialog')
const actionTarget = document.getElementById('actionTarget')
const actCancel = document.getElementById('actCancel')
const actRestore = document.getElementById('actRestore')
const actDelete = document.getElementById('actDelete')

// 지금 메뉴가 가리키는 예약 id
let actionId = null

// 예약 줄을 누르면 무엇을 할지 고르는 메뉴를 연다.
// 이름 링크를 누른 경우는 손님 이력으로 가야 하므로 여기서 처리하지 않는다.
document.getElementById('list').addEventListener('click', (e) => {
  if (e.target.closest('a')) return

  const row = e.target.closest('.row')
  if (!row) return

  const target = store.list().find((r) => r.id === row.dataset.id)
  if (!target) return

  actionId = target.id
  actionTarget.textContent =
    `${target.time} ${target.customerName || ''} ${target.service}`.replace(/\s+/g, ' ').trim()

  // 상태에 따라 보여줄 버튼이 다르다
  const cancelled = target.status === 'cancelled'
  actCancel.hidden = cancelled
  actRestore.hidden = !cancelled

  actionDialog.showModal()
})

// 메뉴에서 고른 동작을 실행하고 목록을 다시 그린다
function runAction(fn) {
  if (actionId) fn(actionId)
  actionId = null
  actionDialog.close()
  render()
}

actCancel.addEventListener('click', () => runAction((id) => store.cancel(id)))
actRestore.addEventListener('click', () => runAction((id) => store.restore(id)))

actDelete.addEventListener('click', () => {
  // 삭제만 되돌릴 수 없으므로 한 번 더 묻는다
  if (!confirm('이 예약을 완전히 지울까요? 되돌릴 수 없습니다.')) return
  runAction((id) => store.remove(id))
})

document.getElementById('actClose').addEventListener('click', () => {
  actionId = null
  actionDialog.close()
})
