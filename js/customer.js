import { createStore } from './store.js'
import { customerStats } from './stats.js'
import { formatDay, todayISO } from './dates.js'

const store = createStore(localStorage)
const today = todayISO()

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

    // 아직 안 온 예약은 '예약' 이라고 밝힌다. 표시가 없으면 다녀간 것처럼 읽히고,
    // 아래 '총 N회 방문' 에서는 빠지므로 줄 수와 숫자가 안 맞아 보인다.
    const date = document.createElement('span')
    date.className = 'date'
    date.textContent = v.date > today ? `${formatDay(v.date)} 예약` : formatDay(v.date)

    const service = document.createElement('span')
    service.className = 'service'
    service.textContent = v.service

    // 금액은 선택 입력이라 없는 예약이 많다. 없으면 칸을 비워둔다 —
    // '0원' 이나 '금액 없음' 으로 채우면 안 받은 것처럼 읽힌다.
    const price = document.createElement('span')
    price.className = 'price'
    price.textContent = v.price != null ? `${v.price.toLocaleString('ko-KR')}원` : ''

    row.append(date, service, price)
    visitsEl.append(row)
  }
}

// 요약 — 총 몇 번 왔고, 얼마 만에 한 번씩 오는지
const stats = customerStats(visits, today)
const lines = [stats.count ? `총 ${stats.count}회 방문` : '아직 방문 없음']
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
