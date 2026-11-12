// https://nuxt.com/docs/api/configuration/nuxt-config
const base = process.env.APP_BASE_URL || '/'
const apiOrigin = process.env.API_BASE_URL
  ? new URL(process.env.API_BASE_URL).origin.replace(/\./g, '\\.')
  : ''

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
  ],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '이음 - 지역생활 정보 플랫폼',
      short_name: '이음',
      description: '지역 주민이 공지, 행사, 프로그램, 문화정보 등을 한곳에서 확인할 수 있는 지역생활 정보 플랫폼',
      lang: 'ko',
      theme_color: '#2563eb',
      background_color: '#f8fafc',
      display: 'standalone',
      dir: 'ltr',
      lang: 'ko',
      categories: ['lifestyle', 'utilities'],
      prefer_related_applications: false,
      start_url: base,
      scope: base,
      icons: [
        { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
        { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: base,
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
      importScripts: ['push-handler.js'],
      runtimeCaching: [
        {
          // 공개 문화정보 API — 네트워크 우선, 실패/지연 시 캐시 (최대 24시간)
          urlPattern: new RegExp(`^${apiOrigin}/contents`),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-contents',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 100, maxAgeSeconds: 24 * 3600 },
          },
        },
        {
          // 외부 이미지(문화 포스터 등) — 캐시 우선, 오래된 것 자동 삭제
          urlPattern: /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'external-images',
            cacheableResponse: { statuses: [0, 200] },
            expiration: { maxEntries: 150, maxAgeSeconds: 30 * 24 * 3600 },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  },

  css: ['~/assets/css/main.css'],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  app: {
    baseURL: base,
    head: {
      title: '이음 - 지역생활 정보 플랫폼',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '지역 주민이 자신이 관심 있는 지역기관의 공지, 행사, 프로그램, 문화정보 등을 한곳에서 확인할 수 있는 지역생활 정보 플랫폼' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: `${base}favicon.ico` },
        { rel: 'manifest', href: `${base}manifest.webmanifest` },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001',
      naverMapsClientId: process.env.NAVER_MAPS_CLIENT_ID || '',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    },
  },
})
