import { locale, translate, setLocale, initLocale, type AppLocale } from '~/utils/i18n'

export const useI18n = () => {
  return {
    locale,
    setLocale: (l: AppLocale | string) => setLocale(l as AppLocale),
    t: (key: string, params?: Record<string, string | number>) => translate(key, params),
  }
}
