import { createStore } from './store.js'
import { todayISO, formatDay } from './dates.js'
import { SERVICES, defaultMinutes } from './services.js'

const store = createStore(localStorage)

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

// 시술 목록을 선택칸에 채운다
for (const s of SERVICES) {
  const opt = document.createElement('option')
  opt.value = s.name
  opt.textContent = s.name
  serviceSelect.append(opt)
}

// 현재 표시 중인 소요 시간(분)
let durationMin = defaultMinutes(SERVICES[0].name)

function showDuration() {
  durationOut.textContent = `${durationMin}분`
}

// 시술을 바꾸면 기본 시간이 자동으로 들어간다.
// 언니가 이 칸에 손을 안 대고도 저장할 수 있어야 한다.
serviceSelect.addEventListener('change', () => {
  durationMin = defaultMinutes(serviceSelect.value)
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
  serviceSelect.selectedIndex = 0
  durationMin = defaultMinutes(SERVICES[0].name)
  showDuration()
  document.getElementById('f-name').value = ''
  dialog.showModal()
})

document.getElementById('f-cancel').addEventListener('click', () => dialog.close())

document.getElementById('addForm').addEventListener('submit', () => {
  store.add({
    date: document.getElementById('f-date').value,
    time: document.getElementById('f-time').value,
    service: serviceSelect.value,
    durationMin,
    customerName: document.getElementById('f-name').value.trim(),
  })
  render()
})

// ── 예약 취소 / 삭제 ────────────────────────────────────

// 예약 줄을 누르면 무엇을 할지 묻는다.
// 이름 링크를 누른 경우는 손님 이력으로 가야 하므로 여기서 처리하지 않는다.
document.getElementById('list').addEventListener('click', (e) => {
  if (e.target.closest('a')) return

  const row = e.target.closest('.row')
  if (!row) return

  const id = row.dataset.id
  const target = store.list().find((r) => r.id === id)
  if (!target) return

  const label = `${target.time} ${target.customerName || ''} ${target.service}`.trim()

  if (target.status === 'active') {
    if (confirm(`${label}\n\n취소로 표시할까요?`)) {
      store.cancel(id)
      render()
    }
    return
  }

  // 이미 취소된 예약을 다시 누르면 완전히 지울지 묻는다
  if (confirm(`${label}\n\n이 예약을 완전히 지울까요?`)) {
    store.remove(id)
    render()
  }
})
