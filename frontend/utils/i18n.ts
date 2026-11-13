import { ref } from 'vue'
import ko from '~/i18n/locales/ko.json'
import en from '~/i18n/locales/en.json'

export type AppLocale = 'ko' | 'en'

export const messages: Record<AppLocale, Record<string, any>> = { ko, en }

// 모듈 레벨 반응형 로케일 (클라이언트에서 localStorage 복원)
export const locale = ref<AppLocale>('ko')

const LOCALE_KEY = 'app_locale'

export const resolveKey = (key: string, dict: Record<string, any> = messages[locale.value]): string => {
  if (typeof key !== 'string') return ''
  const parts = key.split('.')
  let value: any = dict
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return key
    value = value[part]
  }
  return typeof value === 'string' ? value : key
}

export const translate = (key: string, params?: Record<string, string | number>): string => {
  let text = resolveKey(key)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}

export const setLocale = (next: AppLocale) => {
  locale.value = next
  if (import.meta.client) {
    localStorage.setItem(LOCALE_KEY, next)
    document.documentElement.lang = next
  }
}

export const initLocale = () => {
  if (!import.meta.client) return
  const saved = localStorage.getItem(LOCALE_KEY) as AppLocale | null
  if (saved && saved in messages) {
    locale.value = saved
  }
  document.documentElement.lang = locale.value
}
