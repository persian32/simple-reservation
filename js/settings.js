import { createStore } from './store.js'

const store = createStore(localStorage)

// 저장된 예약이 몇 건인지 보여준다 — 백업이 비어 있지 않은지 눈으로 확인할 수 있게
document.getElementById('count').textContent = `현재 ${store.list().length}건이 저장되어 있습니다.`

// 예약 전체를 JSON 파일로 내려받는다.
// 브라우저에 임시 주소를 만들어 가짜 링크를 누르는 방식 — 서버 없이 파일을 만드는 표준 방법이다.
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([store.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const today = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `예약백업-${today}.json`
  a.click()

  URL.revokeObjectURL(url)   // 다 쓴 임시 주소는 바로 정리한다
})
