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
// today: 주면 아직 오지 않은 예약을 방문으로 세지 않는다.
//   안 주면 전부 센다 — 손님 이력 화면은 다가올 예약도 줄로 보여주므로 그쪽은 그대로 둔다.
export function customerStats(visits, today) {
  // 날짜만 뽑아 오래된 순으로 정렬
  const dates = visits
    .map((v) => v.date)
    .filter((d) => !today || d <= today)
    .sort()

  if (dates.length === 0) {
    return { count: 0, lastVisit: null, avgIntervalDays: null }
  }

  const first = dates[0]
  const last = dates[dates.length - 1]

  // 방문이 한 번뿐이면 간격을 잴 수 없다
  const avgIntervalDays =
    dates.length < 2 ? null : Math.round(daysBetween(first, last) / (dates.length - 1))

  return { count: dates.length, lastVisit: last, avgIntervalDays }
}

// 전체 예약에서 손님별 요약 목록을 만든다. 날짜가 늦은 손님이 먼저 나온다.
// 취소된 예약과 이름 없는 예약은 방문으로 세지 않는다.
export function customerList(rows, today) {
  const byName = new Map()
  for (const r of rows) {
    if (!r.customerName || r.status !== 'active') continue
    const visits = byName.get(r.customerName) || []
    visits.push(r)
    byName.set(r.customerName, visits)
  }

  return [...byName.entries()]
    .map(([name, visits]) => {
      const dates = visits.map((v) => v.date).sort()
      // 지난 방문 중 가장 늦은 줄. 날짜만으로는 같은 날 두 건을 못 가르므로 시각까지 본다.
      const past = visits
        .filter((v) => !today || v.date <= today)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
      return {
        name,
        ...customerStats(visits, today),
        // 마지막으로 무슨 시술을 했는지. 이름을 눌러 이력에 들어가지 않아도
        // 목록에서 바로 보이게 하려고 같이 들고 나온다.
        lastService: past.length ? past[past.length - 1].service : null,
        // 아직 오지 않은 예약 중 가장 이른 것. 지난 방문과 섞어서 '마지막' 이라고
        // 쓰면 8/14 예약이 마지막 방문으로 보인다 — 그래서 따로 뽑는다.
        nextVisit: dates.find((d) => d > today) || null,
        // 정렬용. 과거·미래를 가리지 않은 가장 늦은 날짜 — 예전과 같은 순서를 유지한다.
        latestDate: dates[dates.length - 1],
      }
    })
    .sort((a, b) => b.latestDate.localeCompare(a.latestDate))
}
