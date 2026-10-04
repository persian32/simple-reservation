const KEY = 'reservations'

// 예약 한 줄을 지금 모양으로 맞춘다. 저장소에서 읽을 때, 새로 넣을 때, 백업을 불러올 때
// 모두 여기를 지나므로 화면 코드는 지금 모양 하나만 알면 된다.
//
// 품목(items): 한 예약에 시술 여러 개와 제품을 담는다. 금액은 품목마다 따로.
//   [{ kind: 'service' | 'product', name: '염색', price: 55000 | null }]
// 2026-10 이전 예약은 시술 하나(service)와 금액 하나(price)였다 — 그걸 품목 한 줄로 옮긴다.
// 옛 칸은 지운다. 같은 정보를 두 군데 두면 언젠가 서로 어긋난다.
function normalize(r) {
  const { service, price, ...rest } = r
  const items = Array.isArray(r.items)
    ? r.items
    : service ? [{ kind: 'service', name: service, price: price ?? null }] : []
  return {
    ...rest,
    time: r.time || '',              // 제품만 판 기록은 시각이 없다
    customerName: r.customerName || '',
    items,
    memo: r.memo || '',
    status: r.status === 'cancelled' ? 'cancelled' : 'active',
    source: r.source || 'manual',
  }
}

// 저장소를 만든다.
// storage: localStorage와 같은 모양의 객체 (getItem / setItem)
// deps: 테스트에서 결과를 고정하기 위해 id 생성기와 시계를 갈아끼울 수 있게 열어둔다
export function createStore(storage, deps = {}) {
  const uid = deps.uid || (() => crypto.randomUUID())
  const now = deps.now || (() => new Date().toISOString())

  // ponytail: 읽을 때마다 전부 normalize 한다. 수천 건까지는 체감 지연이 없다.
  const load = () => JSON.parse(storage.getItem(KEY) || '[]').map(normalize)
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
      // 금액은 품목마다 선택. 예약을 잡는 시점엔 모를 수 있어 비워두고
      // 시술이 끝난 뒤 '시간·내용 바꾸기' 로 채우는 길도 열어둔다.
      // 메모는 비고 — 언니가 손님·시술에 대해 적어두고 싶은 말 (예: 뿌리만, 두피 예민)
      const row = normalize({
        ...input,
        id: uid(),
        // 화면에서 소요 시간 칸은 뺐다(2026-10). 옛 데이터와 모양을 맞추려 기본값만 넣는다.
        durationMin: input.durationMin ?? 30,
        status: 'active',
        createdAt: stamp,
        updatedAt: stamp,
      })
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
      return normalize(row)
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

    // 특정 날짜의 예약을 시간순으로. 시각 없는 제품 판매는 맨 뒤.
    byDate(date) {
      return load()
        .filter((r) => r.date === date)
        .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
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

    // 백업 파일 불러오기.
    // 덮어쓰지 않고 합친다 — 이미 있는 id 는 건너뛰므로 같은 파일을 두 번 넣어도
    // 예약이 두 배가 되지 않고, 데이터가 들어 있는 폰에 넣어도 기존 예약이 안 사라진다.
    // 파일은 바깥에서 온 것이므로 모양을 확인하고 받는다.
    importJson(text) {
      const incoming = JSON.parse(text)
      if (!Array.isArray(incoming)) throw new Error('예약 백업 파일이 아닙니다.')

      const rows = load()
      const known = new Set(rows.map((r) => r.id))
      // 빠진 값은 normalize 가 add 와 똑같이 채운다. 특히 status 가 없으면 손님 이력이
      // active 만 세기 때문에 불러온 예약이 이력에서 조용히 사라진다.
      // 품목이 하나도 없는 줄은 깨진 줄로 보고 건너뛴다.
      const added = incoming
        .filter((r) => r && r.id && r.date && !known.has(r.id))
        .map((r) => normalize({ ...r, durationMin: r.durationMin ?? 30 }))
        .filter((r) => r.items.length > 0)

      save(rows.concat(added))
      return { added: added.length, skipped: incoming.length - added.length }
    },
  }
}
