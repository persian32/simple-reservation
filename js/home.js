import { createStore } from './store.js'
import { todayISO, formatDay } from './dates.js'
import { createServices } from './services.js'
import { monthGrid, addMonths, countByDate, mondayOf } from './calendar.js'
import { itemsLabel, salesTotal } from './stats.js'

const store = createStore(localStorage)
const services = createServices(localStorage)

// 예약 폼을 열 때 미리 채워두는 시각. 항상 오전으로 둔다.
// "지금+1시간" 으로 했더니 11시 넘어 폼을 열면 12:00 이 들어가고,
// 갤럭시 시계창이 '오후' 가 선택된 채로 열려서 시계판의 10 을 누르면
// 오전 10시가 아니라 오후 10시(22:00)로 저장됐다.
// 비워두면 시계창이 '지금 시각'으로 열려 같은 문제가 되돌아오므로 값은 넣어야 한다.
// 시각 자체는 어차피 대부분 바꾸니, 가장 흔한 오전 10시로 둔다. (영업 시간과는 무관)
const DEFAULT_TIME = '10:00'

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
  // 제품만 판 기록은 시각이 없다 — 그 자리에 '제품' 이라고 적는다
  time.textContent = r.time || '제품'

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
  service.textContent = itemsLabel(r.items)

  el.append(time, name, service)

  // 메모는 있을 때만 이름 아래 한 줄로
  if (r.memo) {
    const memo = document.createElement('span')
    memo.className = 'memo'
    memo.textContent = r.memo
    el.append(memo)
  }
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

  renderSales()
}

// 매출 — 달력에 보이는 달의 합계와 이번 주(월요일~오늘) 합계.
// 달력을 넘기면 그 달 매출로 바뀐다. 아직 안 온 예약은 받은 돈이 아니므로 오늘까지만 센다.
function renderSales() {
  const today = todayISO()
  const rows = store.list()
  const ym = `${view.year}-${String(view.month).padStart(2, '0')}`
  // 'YYYY-MM-31' 은 30일까지인 달에도 문자열 비교로 그 달 끝까지를 덮는다
  const monthEnd = `${ym}-31` < today ? `${ym}-31` : today
  const won = (n) => `${n.toLocaleString('ko-KR')}원`

  document.getElementById('salesMonthLabel').textContent = `${view.month}월 전체`
  document.getElementById('salesMonth').textContent = won(salesTotal(rows, `${ym}-01`, monthEnd))
  document.getElementById('salesWeek').textContent = won(salesTotal(rows, mondayOf(today), today))
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
const timeField = document.getElementById('f-time-field')
const timeInput = document.getElementById('f-time')
const servicesField = document.getElementById('f-services-field')
const serviceLines = document.getElementById('f-services')
const productLines = document.getElementById('f-products')

// 시술 선택칸 맨 끝에 "새 시술 추가"를 붙인다 —
// 시술을 고르다가 목록에 없는 걸 발견하는 곳이 바로 여기라서,
// 설정 화면까지 두 번 이동하게 만들면 아무도 안 쓴다.
const ADD_NEW = '__add_new__'

// 시술 선택칸 하나를 채운다
function fillServiceSelect(select, chosen) {
  select.textContent = ''
  for (const s of services.list()) {
    const option = document.createElement('option')
    option.value = s.name
    option.textContent = s.name
    select.append(option)
  }
  // 목록에서 지운 시술로 저장된 옛 예약을 고칠 때도 그 이름이 보여야 한다
  if (chosen && !services.list().some((s) => s.name === chosen)) {
    const option = document.createElement('option')
    option.value = chosen
    option.textContent = chosen
    select.append(option)
  }
  const addOption = document.createElement('option')
  addOption.value = ADD_NEW
  addOption.textContent = '+ 새 시술 추가…'
  select.append(addOption)

  select.value = chosen || services.list()[0].name
}

// 금액 칸. 숫자 칸(type=number)은 ▲▼ 화살표가 붙고 step 단위가 아니면 저장을 막아서
// 글자 칸으로 둔다. 폰에선 숫자 키패드가 뜬다.
function priceInput(price) {
  const input = document.createElement('input')
  input.type = 'text'
  input.inputMode = 'numeric'
  input.autocomplete = 'off'
  input.className = 'line-price'
  input.placeholder = '금액'
  input.setAttribute('aria-label', '금액')
  input.value = price != null ? price : ''
  return input
}

// 비워두면 null. 0원을 받는 경우는 없으므로 빈칸과 0을 굳이 구분하지 않는다.
// '55,000' 처럼 쉼표나 '원'을 붙여도 숫자만 골라 쓴다.
function readPrice(input) {
  const n = Number(input.value.replace(/[^0-9]/g, ''))
  return n > 0 ? n : null
}

// 품목 한 줄: 이름칸 + 금액칸 + ✕
function addLine(container, nameEl, price) {
  const line = document.createElement('div')
  line.className = 'line'
  const del = document.createElement('button')
  del.type = 'button'
  del.className = 'line-del'
  del.textContent = '✕'
  del.setAttribute('aria-label', '이 줄 지우기')
  del.addEventListener('click', () => line.remove())
  line.append(nameEl, priceInput(price), del)
  container.append(line)
}

function addServiceLine(item) {
  const select = document.createElement('select')
  select.setAttribute('aria-label', '시술')
  fillServiceSelect(select, item && item.name)
  addLine(serviceLines, select, item && item.price)
}

function addProductLine(item) {
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'line-name'
  input.placeholder = '제품 이름'
  input.setAttribute('aria-label', '제품 이름')
  input.setAttribute('list', 'knownProducts')
  input.autocomplete = 'off'
  input.value = item ? item.name : ''
  addLine(productLines, input, item && item.price)
}

// 어느 시술 칸에서든 "새 시술 추가"를 고르면 이름을 받아 목록에 넣고,
// 다른 줄의 선택칸에도 새 시술이 보이게 전부 다시 채운다.
serviceLines.addEventListener('change', (e) => {
  const select = e.target.closest('select')
  if (!select || select.value !== ADD_NEW) return
  const name = (prompt('새 시술 이름을 적어주세요\n(예: 세팅)') || '').trim()
  if (name) services.add(name)
  for (const other of serviceLines.querySelectorAll('select')) {
    fillServiceSelect(other, other === select ? name || undefined : other.value)
  }
})

document.getElementById('f-add-service').addEventListener('click', () => addServiceLine(null))
document.getElementById('f-add-product').addEventListener('click', () => addProductLine(null))

// 이미 쓴 이름을 제안한다 — 오타 하나로 이력이 쪼개지는 걸 막는다
function fillDatalist(id, values) {
  const list = document.getElementById(id)
  list.textContent = ''
  list.append(...[...new Set(values.filter(Boolean))].map((v) => {
    const option = document.createElement('option')
    option.value = v
    return option
  }))
}

// 제품만 판 기록인가 — 시술이 없고 시각도 없다
const isProductOnly = (row) => !row.time && !row.items.some((i) => i.kind === 'service')

// 지금 고치고 있는 예약 id. 새로 넣는 중이면 null.
let editingId = null

// 폼을 연다. row 를 주면 그 예약을 고치는 모드가 된다.
// productOnly 면 시각·시술 칸을 감추고 제품 줄 하나로 시작한다 (제품만 사러 온 손님).
function openForm(row, productOnly = row ? isProductOnly(row) : false) {
  editingId = row ? row.id : null

  // 달력에서 고른 날짜로 채운다 — 그 날을 보고 있으니 거기에 넣으려는 것이다
  document.getElementById('f-date').value = row ? row.date : selected
  timeInput.value = row && row.time ? row.time : DEFAULT_TIME
  timeField.hidden = productOnly
  timeInput.required = !productOnly
  servicesField.hidden = productOnly

  // 품목 줄을 새로 그린다. 시술 목록도 새로 읽어 설정에서 바꾼 것이 바로 반영되게.
  serviceLines.textContent = ''
  productLines.textContent = ''
  const items = row ? row.items : []
  for (const i of items.filter((i) => i.kind === 'service')) addServiceLine(i)
  for (const i of items.filter((i) => i.kind === 'product')) addProductLine(i)
  // 새 예약은 시술 한 줄, 제품 판매는 제품 한 줄을 미리 열어둔다 — 바로 고르면 끝나게
  if (!productOnly && !serviceLines.children.length) addServiceLine(null)
  if (productOnly && !productLines.children.length) addProductLine(null)

  document.getElementById('f-name').value = row ? row.customerName : ''
  document.getElementById('f-memo').value = row ? row.memo : ''
  document.getElementById('f-save').textContent = row ? '고치기' : '저장'

  const all = store.list()
  fillDatalist('knownNames', all.map((r) => r.customerName))
  fillDatalist('knownProducts', all.flatMap((r) => r.items.filter((i) => i.kind === 'product').map((i) => i.name)))

  dialog.showModal()
}

document.getElementById('addBtn').addEventListener('click', () => openForm(null, false))
document.getElementById('saleBtn').addEventListener('click', () => openForm(null, true))

document.getElementById('f-cancel').addEventListener('click', () => dialog.close())

// 줄들을 품목 목록으로 모은다. 감춘 칸(제품 판매의 시술)과 이름 없는 제품 줄은 뺀다.
function readItems() {
  const items = []
  if (!servicesField.hidden) {
    for (const line of serviceLines.children) {
      const name = line.querySelector('select').value
      if (name !== ADD_NEW) items.push({ kind: 'service', name, price: readPrice(line.querySelector('.line-price')) })
    }
  }
  for (const line of productLines.children) {
    const name = line.querySelector('.line-name').value.trim()
    if (name) items.push({ kind: 'product', name, price: readPrice(line.querySelector('.line-price')) })
  }
  return items
}

document.getElementById('addForm').addEventListener('submit', (e) => {
  const items = readItems()
  if (items.length === 0) {
    e.preventDefault()   // 폼을 닫지 않는다
    alert('시술이나 제품을 하나 이상 넣어주세요.')
    return
  }
  const input = {
    date: document.getElementById('f-date').value,
    time: timeField.hidden ? '' : timeInput.value,
    items,
    customerName: document.getElementById('f-name').value.trim(),
    memo: document.getElementById('f-memo').value.trim(),
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
    `${target.time} ${target.customerName} ${itemsLabel(target.items)}`.replace(/\s+/g, ' ').trim()

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
