const KEY = 'services'

// 기본 시술 목록. 언니가 많이 하는 순서대로 둔다 — 입력할 때 위에서 바로 고를 수 있게.
// defaultMin은 기본 소요 시간(분). 예약을 넣을 때 10분 단위로 조절 가능하므로
// 틀려도 치명적이지 않지만, 실제와 가까울수록 손대는 횟수가 줄어든다.
export const DEFAULT_SERVICES = [
  { name: '남자커트', defaultMin: 30 },  // 확인됨
  { name: '펌', defaultMin: 150 },       // 확인됨 (120~180분)
  { name: '여자커트', defaultMin: 40 },  // 임시값 — 언니 확인 필요
  { name: '염색', defaultMin: 90 },      // 임시값
  { name: '매직', defaultMin: 150 },     // 임시값
  { name: '클리닉', defaultMin: 40 },    // 임시값
  { name: '기타', defaultMin: 30 },
]

// 시술 목록을 관리한다. 언니가 직접 추가·삭제할 수 있어야 하므로
// 코드에 고정하지 않고 저장소에 둔다. 저장된 게 없으면 기본 목록을 쓴다.
// storage: localStorage와 같은 모양의 객체 (getItem / setItem)
export function createServices(storage) {
  const load = () => {
    const raw = storage.getItem(KEY)
    return raw ? JSON.parse(raw) : [...DEFAULT_SERVICES]
  }
  const save = (rows) => storage.setItem(KEY, JSON.stringify(rows))

  return {
    list() {
      return load()
    },

    // 추가에 성공하면 true, 이미 있는 이름이면 false
    add(name, defaultMin) {
      const rows = load()
      if (rows.some((s) => s.name === name)) return false
      rows.push({ name, defaultMin })
      save(rows)
      return true
    },

    // 삭제에 성공하면 true. 목록이 비면 예약을 못 넣게 되므로 마지막 하나는 남긴다.
    remove(name) {
      const rows = load()
      if (rows.length <= 1) return false
      save(rows.filter((s) => s.name !== name))
      return true
    },

    // 시술 이름으로 기본 소요 시간을 찾는다. 모르는 이름은 30분으로 둔다.
    defaultMinutes(name) {
      const found = load().find((s) => s.name === name)
      return found ? found.defaultMin : 30
    },
  }
}
