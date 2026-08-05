import { createStore } from './store.js'
import { createServices } from './services.js'

const store = createStore(localStorage)

// 저장된 예약이 몇 건인지 보여준다 — 백업이 비어 있지 않은지 눈으로 확인할 수 있게
function renderCount() {
  document.getElementById('count').textContent = `현재 ${store.list().length}건이 저장되어 있습니다.`
}
renderCount()

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

// 백업 파일 불러오기. 파일을 고르는 순간 바로 읽는다.
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return

  try {
    const { added, skipped } = store.importJson(await file.text())
    alert(added === 0
      ? `새로 들어온 예약이 없습니다. (이미 있는 예약 ${skipped}건)`
      : `예약 ${added}건을 불러왔습니다.${skipped ? ` (이미 있던 ${skipped}건은 건너뜀)` : ''}`)
    renderCount()
  } catch {
    alert('이 파일은 읽을 수 없습니다. 앱에서 내려받은 백업 파일인지 확인해주세요.')
  }

  e.target.value = ''   // 같은 파일을 다시 고를 수 있게 비운다
})

// ── 시술 목록 관리 ──────────────────────────────────────

const services = createServices(localStorage)
const serviceList = document.getElementById('serviceList')

function renderServices() {
  serviceList.textContent = ''
  for (const [i, s] of services.list().entries()) {
    const row = document.createElement('div')
    row.className = 'service-row'

    const label = document.createElement('span')
    label.textContent = `${s.name}  ${s.defaultMin}분`

    const actions = document.createElement('span')
    actions.className = 'service-actions'

    // 맨 위 줄에는 올릴 곳이 없으므로 안 그린다.
    // 아래로 내리려면 그 아래 줄의 ↑ 를 누르면 되므로 버튼은 하나면 된다 —
    // 좁은 폰 화면에 ↑↓ 를 둘 다 두면 '지우기' 와 함께 세 개가 몰린다.
    if (i > 0) {
      const up = document.createElement('button')
      up.type = 'button'
      up.className = 'service-up'
      up.textContent = '↑'
      up.setAttribute('aria-label', `${s.name} 위로 올리기`)
      up.addEventListener('click', () => {
        services.moveUp(s.name)
        renderServices()
      })
      actions.append(up)
    }

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

    actions.append(del)
    row.append(label, actions)
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
