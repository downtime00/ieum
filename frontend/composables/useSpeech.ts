import { ref, onMounted } from 'vue'
import { translate } from '~/utils/i18n'

const STORAGE_KEY = 'voiceGuide'
const enabled = ref(false)
let voice: SpeechSynthesisVoice | null = null
let listenerAdded = false

const pickKoreanVoice = () => {
  if (!import.meta.client || !window.speechSynthesis) return
  const voices = window.speechSynthesis.getVoices()
  voice =
    voices.find((v) => v.lang === 'ko-KR') ||
    voices.find((v) => v.lang.startsWith('ko')) ||
    null
}

export const useSpeech = () => {
  if (import.meta.client) {
    pickKoreanVoice()
    if (!listenerAdded && window.speechSynthesis?.addEventListener) {
      listenerAdded = true
      window.speechSynthesis.addEventListener('voiceschanged', pickKoreanVoice)
    }
  }

  // localStorage는 마운트 후에 읽어야 SSR/CSR 첫 렌더가 일치함 (hydration mismatch 방지)
  onMounted(() => {
    if (import.meta.client) {
      enabled.value = localStorage.getItem(STORAGE_KEY) === 'true'
    }
  })

  const speak = (text: string) => {
    if (!enabled.value || !import.meta.client || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.85
    utterance.pitch = 1
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }

  const toggle = () => {
    enabled.value = !enabled.value
    localStorage.setItem(STORAGE_KEY, String(enabled.value))
    if (!enabled.value) {
      if (import.meta.client) window.speechSynthesis?.cancel()
      return
    }
    // 켜는 순간 사용자 제스처 안에서 확인 멘트를 읽어줌 (브라우저 자동재생 정책 대응)
    speak(translate('senior.voiceOnDone'))
  }

  return { enabled, speak, toggle }
}
