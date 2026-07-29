// 하루를 밀리초로. 날짜 차이를 일수로 바꿀 때 쓴다.
const DAY_MS = 24 * 60 * 60 * 1000

// 'YYYY-MM-DD' 두 개 사이의 일수. 시간대 문제를 피하려고 UTC 정오로 고정해서 뺀다.
function daysBetween(fromDate, toDate) {
  const from = Date.parse(`${fromDate}T12:00:00Z`)
  const to = Date.parse(`${toDate}T12:00:00Z`)
  return Math.round((to - from) / DAY_MS)
}

// 한 손님의 방문 기록에서 요약을 뽑는다.
// visits: [{ date: 'YYYY-MM-DD', ... }] — 순서는 상관없다.
export function customerStats(visits) {
  if (visits.length === 0) {
    return { count: 0, lastVisit: null, avgIntervalDays: null }
  }

  // 날짜만 뽑아 오래된 순으로 정렬
  const dates = visits.map((v) => v.date).sort()
  const first = dates[0]
  const last = dates[dates.length - 1]

  // 방문이 한 번뿐이면 간격을 잴 수 없다
  const avgIntervalDays =
    dates.length < 2 ? null : Math.round(daysBetween(first, last) / (dates.length - 1))

  return { count: dates.length, lastVisit: last, avgIntervalDays }
}

// 전체 예약에서 손님별 요약 목록을 만든다. 최근에 온 손님이 먼저 나온다.
// 취소된 예약과 이름 없는 예약은 방문으로 세지 않는다.
export function customerList(rows) {
  const byName = new Map()
  for (const r of rows) {
    if (!r.customerName || r.status !== 'active') continue
    const visits = byName.get(r.customerName) || []
    visits.push(r)
    byName.set(r.customerName, visits)
  }

  return [...byName.entries()]
    .map(([name, visits]) => ({ name, ...customerStats(visits) }))
    .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
}
