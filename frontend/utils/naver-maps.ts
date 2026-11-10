// 네이버 지도 JS API 스크립트 로더 (한 번만 로드)
let loadPromise: Promise<void> | null = null

export const loadNaverMaps = (clientId: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if ((window as any).naver?.maps) return Promise.resolve()
  if (!clientId) return Promise.reject(new Error('NAVER_MAPS_CLIENT_ID가 설정되지 않았습니다.'))
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'))
    document.head.appendChild(script)
  })

  return loadPromise
}
