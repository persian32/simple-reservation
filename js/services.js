// 시술 목록. 언니가 많이 하는 순서대로 둔다 — 입력할 때 위에서 바로 고를 수 있게.
// defaultMin은 기본 소요 시간(분). 앱에서 10분 단위로 조절 가능하므로
// 틀려도 치명적이지 않지만, 실제와 가까울수록 손대는 횟수가 줄어든다.
export const SERVICES = [
  { name: '남자커트', defaultMin: 30 },  // 확인됨
  { name: '펌', defaultMin: 150 },       // 확인됨 (120~180분)
  { name: '여자커트', defaultMin: 40 },  // 임시값 — 언니 확인 필요
  { name: '염색', defaultMin: 90 },      // 임시값
  { name: '매직', defaultMin: 150 },     // 임시값
  { name: '클리닉', defaultMin: 40 },    // 임시값
  { name: '기타', defaultMin: 30 },
]

// 시술 이름으로 기본 소요 시간을 찾는다. 모르는 이름은 30분으로 둔다.
export function defaultMinutes(name) {
  const found = SERVICES.find((s) => s.name === name)
  return found ? found.defaultMin : 30
}
