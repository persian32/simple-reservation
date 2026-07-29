const KEY = 'reservations'

// 저장소를 만든다.
// storage: localStorage와 같은 모양의 객체 (getItem / setItem)
// deps: 테스트에서 결과를 고정하기 위해 id 생성기와 시계를 갈아끼울 수 있게 열어둔다
export function createStore(storage, deps = {}) {
  const uid = deps.uid || (() => crypto.randomUUID())
  const now = deps.now || (() => new Date().toISOString())

  const load = () => JSON.parse(storage.getItem(KEY) || '[]')
  const save = (rows) => storage.setItem(KEY, JSON.stringify(rows))

  return {
    // 전체 예약 (취소된 것 포함)
    list() {
      return load()
    },

    // 예약 추가. 빠진 값은 기본값으로 채운다.
    // id와 updatedAt은 지금 쓰지 않지만, 나중에 서버를 붙일 때 없으면
    // 데이터를 갈아엎어야 하므로 미리 넣어둔다.
    add(input) {
      const rows = load()
      const stamp = now()
      const row = {
        id: uid(),
        date: input.date,
        time: input.time,
        customerName: input.customerName || '',
        service: input.service,
        // 화면이 항상 값을 넘긴다. 이 30분은 값이 빠진 경우의 마지막 안전망이다.
        durationMin: input.durationMin ?? 30,
        status: 'active',
        source: input.source || 'manual',
        createdAt: stamp,
        updatedAt: stamp,
      }
      rows.push(row)
      save(rows)
      return row
    },

    // 예약 내용을 고친다. 손님이 시간을 바꾸는 일이 주 4~5회 있다.
    // 지우고 새로 넣으면 손님 이력에 방문이 하나 더 생겨 숫자가 틀어진다.
    update(id, patch) {
      const rows = load()
      const row = rows.find((r) => r.id === id)
      if (!row) return null
      Object.assign(row, patch, { updatedAt: now() })
      save(rows)
      return row
    },

    // 취소. 지우지 않고 상태만 바꾼다 —
    // 이 손님이 지난달에도 취소했는지 알 수 있어야 하기 때문.
    cancel(id) {
      const rows = load()
      const row = rows.find((r) => r.id === id)
      if (!row) return
      row.status = 'cancelled'
      row.updatedAt = now()
      save(rows)
    },

    // 취소를 되돌린다. 손님이 마음을 바꾸는 일이 흔하다.
    restore(id) {
      const rows = load()
      const row = rows.find((r) => r.id === id)
      if (!row) return
      row.status = 'active'
      row.updatedAt = now()
      save(rows)
    },

    // 완전 삭제. 잘못 넣은 예약을 지울 때만 쓴다.
    remove(id) {
      save(load().filter((r) => r.id !== id))
    },

    // 특정 날짜의 예약을 시간순으로
    byDate(date) {
      return load()
        .filter((r) => r.date === date)
        .sort((a, b) => a.time.localeCompare(b.time))
    },

    // 특정 손님의 방문 기록을 최근순으로 (취소된 것 제외)
    byCustomer(name) {
      return load()
        .filter((r) => r.customerName === name && r.status === 'active')
        .sort((a, b) => b.date.localeCompare(a.date))
    },

    // 백업용 내보내기
    exportJson() {
      return JSON.stringify(load(), null, 2)
    },
  }
}
