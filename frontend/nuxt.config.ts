// https://nuxt.com/docs/api/configuration/nuxt-config
const base = process.env.APP_BASE_URL || '/'

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
