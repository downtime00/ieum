import { translate, initLocale } from '~/utils/i18n'

export default defineNuxtPlugin((nuxtApp) => {
  initLocale()
  nuxtApp.vueApp.config.globalProperties.$t = translate
})
