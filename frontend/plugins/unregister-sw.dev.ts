// 개발 모드에서 이전 프로덕션 서비스 워커가 남아 있으면
// 페이지 네비게이션을 가로채 구버전 앱을 서빙할 수 있으므로 해제한다.
export default defineNuxtPlugin(() => {
  if (!import.meta.dev || !import.meta.client) return
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister())
    })
  }
})
