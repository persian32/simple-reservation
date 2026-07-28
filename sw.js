// 앱 파일을 폰에 저장해두어 인터넷이 끊겨도 열리게 한다.
// 파일을 고칠 때마다 CACHE 이름의 숫자를 올려야 새 버전이 반영된다.
const CACHE = 'reservation-v1'

const FILES = [
  'index.html', 'customer.html', 'settings.html', 'style.css',
  'js/services.js', 'js/store.js', 'js/stats.js', 'js/dates.js',
  'js/home.js', 'js/customer.js', 'js/settings.js',
  'manifest.json', 'icon-192.png', 'icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)))
})

// 이름이 다른 옛 캐시는 지운다
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
})

// 저장해둔 파일이 있으면 그걸 주고, 없으면 인터넷에서 가져온다
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)))
})
