import { createStore } from './store.js'
import { customerList } from './stats.js'
import { formatDay } from './dates.js'

const store = createStore(localStorage)

const list = document.getElementById('list')
const customers = customerList(store.list())

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

    const meta = document.createElement('span')
    meta.className = 'person-meta'
    meta.textContent = `${c.count}회 · 마지막 ${formatDay(c.lastVisit)}`

    row.append(name, meta)
    list.append(row)
  }
}
