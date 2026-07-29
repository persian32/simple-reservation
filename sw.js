// 앱 파일을 폰에 저장해두어 인터넷이 끊겨도 열리게 한다.
// 파일을 고칠 때마다 CACHE 이름의 숫자를 올려야 새 버전이 반영된다.
const CACHE = 'reservation-v10'

const FILES = [
  './', 'index.html', 'customer.html', 'customers.html', 'settings.html', 'style.css',
  'js/services.js', 'js/store.js', 'js/stats.js', 'js/dates.js', 'js/calendar.js',
  'js/home.js', 'js/customer.js', 'js/customers.js', 'js/settings.js',
  'manifest.json', 'icon-192.png', 'icon-512.png',
]

self.addEventListener('install', (e) => {
  self.skipWaiting()                                    // 새 버전을 바로 활성화한다

  // { cache: 'reload' } 가 핵심이다. 이게 없으면 브라우저에 남아 있던 옛 사본을
  // 그대로 저장해버려서, 새 파일과 옛 파일이 섞인 채로 캐시가 만들어진다.
  // 그러면 새 코드가 옛 파일에 없는 함수를 찾다가 앱이 통째로 죽는다.
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))
    )
  )
})

// 이름이 다른 옛 캐시는 지운다
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())                  // 열려 있는 화면에도 즉시 적용한다
  )
})

// 저장해둔 파일이 있으면 그걸 주고, 없으면 인터넷에서 가져온다
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)))
})
