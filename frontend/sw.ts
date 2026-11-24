/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}
declare const __API_ORIGIN__: string

// 앱 baseURL(/ieum/ 등)은 SW 스코프에서 유도 — 어떤 배포 경로든 정확
const scopePath = new URL(self.registration.scope).pathname
const base = scopePath.endsWith('/') ? scopePath : `${scopePath}/`

precacheAndRoute(self.__WB_MANIFEST)

// autoUpdate: 새 SW 즉시 활성화
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// SPA 네비게이션 fallback
registerRoute(new NavigationRoute(createHandlerBoundToURL(base)))

// 공개 문화정보 API — 네트워크 우선, 실패/지연 시 캐시 (최대 24시간)
const contentsPattern = __API_ORIGIN__
  ? new RegExp(`^${__API_ORIGIN__.replace(/\./g, '\\.')}/contents`)
  : /\/contents/
registerRoute(
  contentsPattern,
  new NetworkFirst({
    cacheName: 'api-contents',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 3600 }),
    ],
  }),
)

// 외부 이미지(문화 포스터 등) — 캐시 우선, 오래된 것 자동 삭제
registerRoute(
  /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/,
  new CacheFirst({
    cacheName: 'external-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 30 * 24 * 3600 }),
    ],
  }),
)

// ── Web Push 핸들러 (구 public/push-handler.js 이관) ──
self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; tag?: string; url?: string } = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || '이음'
  event.waitUntil(
    (async () => {
      // 진동 설정 확인 (쿠키 ieum_vibration=0 이면 끔, 기본 켬)
      // cookieStore 미지원 환경 대비 Cache API(ieum-prefs)도 함께 확인
      let vibrate: number[] | undefined = [200, 100, 200]
      try {
        let prefOff = false
        const cookieStore = (self as unknown as { cookieStore?: { get(name: string): Promise<{ value: string } | undefined> } }).cookieStore
        const cookie = cookieStore ? await cookieStore.get('ieum_vibration') : undefined
        if (cookie) {
          prefOff = cookie.value === '0'
        } else {
          const cache = await caches.open('ieum-prefs')
          const res = await cache.match('/__prefs/vibration')
          if (res && (await res.text()) === '0') prefOff = true
        }
        if (prefOff) vibrate = undefined
      } catch {}

      const shown = await self.registration.showNotification(title, {
        body: data.body || '',
        icon: `${base}icons/icon-192.png`,
        badge: `${base}icons/icon-192.png`,
        tag: data.tag || 'ieum-notification',
        renotify: true,
        vibrate,
        data: { url: data.url || '/' },
      })
      // 앱이 열려 있으면 차임음 재생을 위해 클라이언트에 알림
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      clients.forEach((c) => c.postMessage({ type: 'IEUM_PUSH', data }))
      return shown
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const rawUrl = (event.notification.data?.url as string | undefined) || '/'
  // 상대 경로는 앱 baseURL 기준으로 정규화 (/ieum/ 배포 대응)
  let url = rawUrl
  if (!/^https?:/i.test(rawUrl)) {
    const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`
    url = path.startsWith(base) ? path : `${base}${path.replace(/^\/+/, '')}`
  }
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      }),
  )
})
