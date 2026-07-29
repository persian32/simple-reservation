import { createStore } from './store.js'
import { createServices } from './services.js'

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

// ── 시술 목록 관리 ──────────────────────────────────────

const services = createServices(localStorage)
const serviceList = document.getElementById('serviceList')

function renderServices() {
  serviceList.textContent = ''
  for (const s of services.list()) {
    const row = document.createElement('div')
    row.className = 'service-row'

    const label = document.createElement('span')
    label.textContent = `${s.name}  ${s.defaultMin}분`

    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'service-del'
    del.textContent = '지우기'
    del.addEventListener('click', () => {
      if (!confirm(`'${s.name}'을(를) 목록에서 지울까요?\n이미 저장된 예약은 그대로 남습니다.`)) return
      if (!services.remove(s.name)) {
        alert('마지막 하나는 지울 수 없습니다.')
        return
      }
      renderServices()
    })

    row.append(label, del)
    serviceList.append(row)
  }
}

document.getElementById('s-add').addEventListener('click', () => {
  const nameInput = document.getElementById('s-name')
  const minInput = document.getElementById('s-min')

  const name = nameInput.value.trim()
  if (!name) return

  const minutes = Number(minInput.value)
  if (!Number.isFinite(minutes) || minutes < 10) {
    alert('기본 시간은 10분 이상으로 적어주세요.')
    return
  }

  const result = services.add(name, minutes)
  if (result !== true) {
    // 별칭이면 어느 시술과 같은 것인지 알려준다 — "파마"를 넣으려 하면 "펌"이 있다고
    alert(result === name
      ? '이미 목록에 있는 시술입니다.'
      : `'${name}'은(는) '${result}'과(와) 같은 시술로 되어 있습니다.`)
    return
  }

  nameInput.value = ''
  minInput.value = '30'
  renderServices()
})

renderServices()
