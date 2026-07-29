import { createStore } from './store.js'
import { todayISO, formatDay, endTime } from './dates.js'
import { createServices } from './services.js'
import { monthGrid, addMonths, countByDate } from './calendar.js'

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
  // 끝나는 시각까지 보여준다. 다음 예약을 언제 잡을 수 있는지가
  // 종이 달력에는 없던 정보다 — 지금까지는 머릿속으로 계산해야 했다.
  if (r.durationMin) {
    const end = document.createElement('span')
    end.className = 'end'
    end.textContent = `~${endTime(r.time, r.durationMin)}`
    time.append(end)
  }

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

// ── 달력과 목록 ────────────────────────────────────────

// 지금 보고 있는 날짜와 달. 앱을 열면 오늘이다.
let selected = todayISO()
let view = { year: Number(selected.slice(0, 4)), month: Number(selected.slice(5, 7)) }

// 달력을 그린다. 날짜 밑 점이 그날 예약 건수다 —
// 종이 달력에 글씨가 적혀 있는 것과 같은 신호.
function renderCalendar() {
  const today = todayISO()
  const counts = countByDate(store.list())

  document.getElementById('calTitle').textContent = `${view.year}년 ${view.month}월`

  const grid = document.getElementById('calGrid')
  grid.textContent = ''

  for (const cell of monthGrid(view.year, view.month)) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cal-day'
    btn.dataset.date = cell.date
    if (!cell.inMonth) btn.classList.add('other')
    if (cell.date === today) btn.classList.add('is-today')
    if (cell.date === selected) btn.classList.add('is-selected')

    const num = document.createElement('span')
    num.className = 'cal-num'
    num.textContent = Number(cell.date.slice(8))
    btn.append(num)

    // 점은 최대 3개까지만. 그 이상은 눈으로 세지 않는다.
    const n = counts.get(cell.date) || 0
    const dots = document.createElement('span')
    dots.className = 'cal-dots'
    dots.textContent = n === 0 ? '' : '·'.repeat(Math.min(n, 3))
    btn.append(dots)

    grid.append(btn)
  }
}

// 고른 날짜의 예약만 시간순으로 보여준다
function renderList() {
  const today = todayISO()
  const tomorrow = todayISO(new Date(Date.now() + 86400000))
  const rows = store.byDate(selected)

  const list = document.getElementById('list')
  list.textContent = ''

  const head = document.createElement('div')
  head.className = selected === today ? 'day today' : 'day'
  const label = document.createElement('span')
  label.textContent = dayLabel(selected, today, tomorrow)
  const count = document.createElement('span')
  count.className = 'day-count'
  count.textContent = rows.length ? `${rows.length}건` : ''
  head.append(label, count)
  list.append(head)

  if (rows.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'empty'
    empty.textContent = '이 날은 예약이 없습니다'
    list.append(empty)
    return
  }

  for (const r of rows) list.append(renderRow(r))
}

function render() {
  renderCalendar()
  renderList()
}

// 날짜를 누르면 아래 목록이 그날로 바뀐다
document.getElementById('calGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('.cal-day')
  if (!btn) return
  selected = btn.dataset.date
  // 지난달·다음달 칸을 누르면 그 달로 넘어간다
  view = { year: Number(selected.slice(0, 4)), month: Number(selected.slice(5, 7)) }
  render()
})

function moveMonth(delta) {
  view = addMonths(view.year, view.month, delta)
  renderCalendar()
}
document.getElementById('prevMonth').addEventListener('click', () => moveMonth(-1))
document.getElementById('nextMonth').addEventListener('click', () => moveMonth(1))

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

// 지금 고치고 있는 예약 id. 새로 넣는 중이면 null.
let editingId = null

// 폼을 연다. row 를 주면 그 예약을 고치는 모드가 된다.
function openForm(row) {
  editingId = row ? row.id : null
  const now = new Date()

  // 달력에서 고른 날짜로 채운다 — 그 날을 보고 있으니 거기에 넣으려는 것이다
  document.getElementById('f-date').value = row ? row.date : selected
  document.getElementById('f-time').value = row
    ? row.time
    : `${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`

  // 시술 목록을 새로 채운다 — 설정에서 추가·삭제한 것이 바로 반영되게
  fillServices(row ? row.service : undefined)
  durationMin = row ? row.durationMin : services.defaultMinutes(serviceSelect.value)
  showDuration()
  document.getElementById('f-name').value = row ? row.customerName : ''
  document.getElementById('f-save').textContent = row ? '고치기' : '저장'

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
}

document.getElementById('addBtn').addEventListener('click', () => openForm(null))

document.getElementById('f-cancel').addEventListener('click', () => dialog.close())

document.getElementById('addForm').addEventListener('submit', () => {
  const input = {
    date: document.getElementById('f-date').value,
    time: document.getElementById('f-time').value,
    service: serviceSelect.value,
    durationMin,
    customerName: document.getElementById('f-name').value.trim(),
  }
  // 고치는 중이면 같은 예약을 갱신한다. 지우고 새로 넣으면
  // 손님 이력에 방문이 하나 더 생겨 숫자가 틀어진다.
  const saved = editingId ? store.update(editingId, input) : store.add(input)
  editingId = null
  // 저장한 날짜로 옮겨 보여준다 — 넣은 것이 눈앞에 보여야 저장된 줄 안다
  selected = saved.date
  view = { year: Number(selected.slice(0, 4)), month: Number(selected.slice(5, 7)) }
  render()
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

document.getElementById('actEdit').addEventListener('click', () => {
  const row = store.list().find((r) => r.id === actionId)
  actionId = null
  actionDialog.close()
  if (row) openForm(row)
})

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
