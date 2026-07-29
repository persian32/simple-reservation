import { createStore } from './store.js'
import { customerStats } from './stats.js'
import { formatDay } from './dates.js'

const store = createStore(localStorage)

// 주소에서 손님 이름을 꺼낸다 (customer.html?name=화선언니)
const name = new URLSearchParams(location.search).get('name') || ''
document.getElementById('name').textContent = name

const visits = store.byCustomer(name)   // 최근 방문이 먼저
const visitsEl = document.getElementById('visits')

if (visits.length === 0) {
  const empty = document.createElement('p')
  empty.className = 'empty'
  empty.textContent = '방문 기록이 없습니다'
  visitsEl.append(empty)
} else {
  for (const v of visits) {
    const row = document.createElement('div')
    row.className = 'visit'

    const date = document.createElement('span')
    date.className = 'date'
    date.textContent = formatDay(v.date)

    const service = document.createElement('span')
    service.className = 'service'
    service.textContent = v.service

    row.append(date, service)
    visitsEl.append(row)
  }
}

// 요약 — 총 몇 번 왔고, 얼마 만에 한 번씩 오는지
const stats = customerStats(visits)
const lines = [`총 ${stats.count}회 방문`]
if (stats.avgIntervalDays) {
  const weeks = Math.round(stats.avgIntervalDays / 7)
  lines.push(weeks >= 1 ? `평균 ${weeks}주마다 오심` : `평균 ${stats.avgIntervalDays}일마다 오심`)
}

const summaryEl = document.getElementById('summary')
for (const line of lines) {
  const p = document.createElement('div')
  p.textContent = line
  summaryEl.append(p)
}
