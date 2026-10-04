import { createStore } from './store.js'
import { customerStats, itemsLabel } from './stats.js'
import { formatDay, todayISO } from './dates.js'

const store = createStore(localStorage)
const today = todayISO()

// 주소에서 손님 이름을 꺼낸다 (customer.html?name=화선언니)
const name = new URLSearchParams(location.search).get('name') || ''
document.getElementById('name').textContent = name

const visits = store.byCustomer(name)   // 최근 방문이 먼저
const visitsEl = document.getElementById('visits')

// 금액은 선택 입력이라 없는 경우가 많다. 없으면 칸을 비워둔다 —
// '0원' 이나 '금액 없음' 으로 채우면 안 받은 것처럼 읽힌다.
const won = (n) => (n != null ? `${n.toLocaleString('ko-KR')}원` : '')

// 품목 금액의 합. 하나도 안 적었으면 null (0원이 아니다).
function total(items) {
  const prices = items.map((i) => i.price).filter((p) => p != null)
  return prices.length ? prices.reduce((a, b) => a + b, 0) : null
}

function span(className, text) {
  const el = document.createElement('span')
  el.className = className
  el.textContent = text
  return el
}

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

    // 윗줄: 날짜 / 품목 / 그날 합계
    row.append(date, span('service', itemsLabel(v.items)), span('price', won(total(v.items))))

    // 품목이 둘 이상이면 아랫줄에 품목별 금액. 하나면 윗줄과 같은 말이라 안 그린다.
    if (v.items.length > 1) {
      for (const i of v.items) {
        const line = document.createElement('span')
        line.className = 'item'
        line.append(span('item-name', i.kind === 'product' ? `${i.name} (제품)` : i.name), span('price', won(i.price)))
        row.append(line)
      }
    }

    // 메모는 있을 때만 아랫줄에
    if (v.memo) {
      const memo = document.createElement('span')
      memo.className = 'memo'
      memo.textContent = v.memo
      row.append(memo)
    }
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
