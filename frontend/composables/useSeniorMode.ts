import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'seniorMode'
const enabled = ref(false)

const applySeniorMode = (value: boolean) => {
  if (!import.meta.client) return
  document.documentElement.classList.toggle('senior-mode', value)
}

export const useSeniorMode = () => {
  // localStorage는 마운트 후에 읽어야 SSR/CSR 첫 렌더가 일치함 (hydration mismatch 방지)
  onMounted(() => {
    if (import.meta.client && !enabled.value && localStorage.getItem(STORAGE_KEY) === 'true') {
      enabled.value = true
      applySeniorMode(true)
    }
  })

  const toggle = () => {
    enabled.value = !enabled.value
    localStorage.setItem(STORAGE_KEY, String(enabled.value))
    applySeniorMode(enabled.value)
  }

  watch(enabled, (value) => applySeniorMode(value))

  return { enabled, toggle }
}
