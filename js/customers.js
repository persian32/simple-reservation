import { createStore } from './store.js'
import { customerList } from './stats.js'
import { formatDay, todayISO } from './dates.js'

const store = createStore(localStorage)

const list = document.getElementById('list')
const search = document.getElementById('search')
const customers = customerList(store.list(), todayISO())

if (customers.length === 0) {
  const empty = document.createElement('p')
  empty.className = 'empty'
  empty.textContent = '아직 이름이 적힌 예약이 없습니다'
  list.append(empty)
  search.hidden = true
} else {
  const rows = customers.map((c) => {
    const row = document.createElement('a')
    row.className = 'person'
    row.href = `customer.html?name=${encodeURIComponent(c.name)}`

    const top = document.createElement('span')
    top.className = 'person-top'

    const name = document.createElement('span')
    name.className = 'person-name'
    name.textContent = c.name

    // 아직 안 온 예약이 있으면 '2회 · 예약 8/14', 없으면 '3회'.
    // 미래 날짜에 '마지막' 을 붙이면 다음 예약이 마지막 방문처럼 읽힌다.
    const meta = document.createElement('span')
    meta.className = 'person-meta'
    meta.textContent = c.nextVisit
      ? [c.count && `${c.count}회`, `예약 ${formatDay(c.nextVisit)}`].filter(Boolean).join(' · ')
      : `${c.count}회`

    top.append(name, meta)
    row.append(top)

    // 마지막으로 다녀간 날과 그날 한 시술. 이름을 눌러 이력에 들어가기 전에
    // 여기서 먼저 보인다. 아직 안 온 손님은 보여줄 게 없어 줄을 안 그린다.
    if (c.lastVisit) {
      const last = document.createElement('span')
      last.className = 'person-last'
      last.textContent = [formatDay(c.lastVisit), c.lastService].filter(Boolean).join('  ')
      row.append(last)
    }

    list.append(row)
    return { name: c.name, row }
  })

  const noHit = document.createElement('p')
  noHit.className = 'empty'
  noHit.textContent = '그런 이름의 손님이 없습니다'
  noHit.hidden = true
  list.append(noHit)

  // 손님이 쌓이면 스크롤로 찾는 게 느려진다. 이름 일부만 쳐도 남게 한다.
  search.addEventListener('input', () => {
    const q = search.value.trim()
    let hits = 0
    for (const { name, row } of rows) {
      row.hidden = q !== '' && !name.includes(q)
      if (!row.hidden) hits++
    }
    noHit.hidden = hits > 0
  })
}
