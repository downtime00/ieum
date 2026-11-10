import { ref } from 'vue'

export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'unsupported'

const STORAGE_KEY = 'userLocation'

export const useGeolocation = () => {
  const status = ref<GeoStatus>('idle')
  const position = ref<GeoPosition | null>(null)
  const errorMessage = ref('')

  const loadStoredPosition = () => {
    if (!import.meta.client) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        position.value = JSON.parse(stored)
        status.value = 'granted'
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  const requestLocation = (): Promise<GeoPosition | null> => {
    return new Promise((resolve) => {
      if (!import.meta.client || !navigator.geolocation) {
        status.value = 'unsupported'
        errorMessage.value = '이 브라우저는 위치 정보를 지원하지 않습니다.'
        resolve(null)
        return
      }

      status.value = 'requesting'
      errorMessage.value = ''

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const geo: GeoPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          }
          position.value = geo
          status.value = 'granted'
          localStorage.setItem(STORAGE_KEY, JSON.stringify(geo))
          resolve(geo)
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            status.value = 'denied'
            errorMessage.value = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.'
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            status.value = 'unavailable'
            errorMessage.value = '현재 위치를 확인할 수 없습니다.'
          } else {
            status.value = 'unavailable'
            errorMessage.value = '위치 정보를 가져오는 데 시간이 초과되었습니다.'
          }
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
    })
  }

  const clearLocation = () => {
    position.value = null
    status.value = 'idle'
    errorMessage.value = ''
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    status,
    position,
    errorMessage,
    loadStoredPosition,
    requestLocation,
    clearLocation,
  }
}
