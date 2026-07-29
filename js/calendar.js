import { todayISO } from './dates.js'

// 월간 격자를 만든다. 일요일 시작, 6주(42칸) 고정.
// 6주로 고정하는 이유: 달마다 줄 수가 바뀌면 아래 목록이 위아래로 흔들려서
// 누르려던 자리가 움직인다. 종이 달력도 칸 수가 늘 같다.
// month 는 1~12 (자바스크립트의 0~11 이 아니라 사람이 읽는 숫자)
export function monthGrid(year, month) {
  const first = new Date(year, month - 1, 1)
  const cells = []
  for (let i = 0; i < 42; i++) {
    // 그 달 1일이 속한 주의 일요일부터 세어 나간다
    const d = new Date(year, month - 1, 1 - first.getDay() + i)
    cells.push({ date: todayISO(d), inMonth: d.getMonth() === month - 1 })
  }
  return cells
}

// 달을 앞뒤로 옮긴다. 12월 다음은 다음 해 1월이 되어야 한다.
export function addMonths(year, month, delta) {
  const total = (year * 12 + (month - 1)) + delta
  return { year: Math.floor(total / 12), month: (total % 12) + 1 }
}

// 날짜별 예약 건수를 센다. 취소된 예약도 달력에는 표시한다 —
// 그 자리에 무언가 있었다는 사실 자체가 정보다.
export function countByDate(rows) {
  const counts = new Map()
  for (const r of rows) {
    counts.set(r.date, (counts.get(r.date) || 0) + 1)
  }
  return counts
}
