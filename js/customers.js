import { createStore } from './store.js'
import { customerList } from './stats.js'
import { formatDay, todayISO } from './dates.js'

const store = createStore(localStorage)

const list = document.getElementById('list')
const customers = customerList(store.list(), todayISO())

if (customers.length === 0) {
  const empty = document.createElement('p')
  empty.className = 'empty'
  empty.textContent = '아직 이름이 적힌 예약이 없습니다'
  list.append(empty)
} else {
  for (const c of customers) {
    const row = document.createElement('a')
    row.className = 'person'
    row.href = `customer.html?name=${encodeURIComponent(c.name)}`

    const name = document.createElement('span')
    name.className = 'person-name'
    name.textContent = c.name

    // 아직 안 온 예약이 있으면 '예약 8/14', 없으면 '3회 · 8/1'.
    // 미래 날짜에 '마지막' 을 붙이면 다음 예약이 마지막 방문처럼 읽힌다.
    const meta = document.createElement('span')
    meta.className = 'person-meta'
    meta.textContent = c.nextVisit
      ? [c.count && `${c.count}회`, `예약 ${formatDay(c.nextVisit)}`].filter(Boolean).join(' · ')
      : `${c.count}회 · ${formatDay(c.lastVisit)}`

    row.append(name, meta)
    list.append(row)
  }
}
