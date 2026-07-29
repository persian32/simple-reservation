const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 오늘 날짜를 'YYYY-MM-DD'로. 시간대 문제를 피하려고 직접 조립한다.
// (toISOString()을 쓰면 UTC 기준이라 한국 시간 오전 9시 이전에 날짜가 하루 밀린다)
export function todayISO(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 'YYYY-MM-DD' → '3/17 (화)'
export function formatDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  return `${m}/${d} (${weekday})`
}

// 시작 시각과 소요 시간으로 끝나는 시각을 구한다. '10:20' + 90 → '11:50'
// 자정을 넘기면 24시간으로 되돌린다(밤 늦은 예약은 없지만 숫자가 깨지지 않게).
export function endTime(start, minutes) {
  const [h, m] = start.split(':').map(Number)
  const total = (h * 60 + m + minutes) % (24 * 60)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`
}
