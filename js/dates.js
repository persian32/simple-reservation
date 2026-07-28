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
