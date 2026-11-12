import { translate, initLocale } from '~/utils/i18n'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.globalProperties.$t = translate
  // 저장된 로케일은 마운트 후 적용 — SSR(ko)과 CSR 첫 렌더가 일치해야 hydration mismatch가 없음
  nuxtApp.hook('app:mounted', () => {
    initLocale()
  })
})
