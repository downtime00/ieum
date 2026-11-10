// 게스트 모드: 로그인 없이 로컬 ID로 데이터 사용 (가족 기능은 계정 필요)
const GUEST_KEY = 'guestUserId'

export const getGuestUserId = (): number => {
  if (!import.meta.client) return 0
  let id = localStorage.getItem(GUEST_KEY)
  if (!id) {
    // 실제 사용자 ID와 겹치지 않도록 9억번대 사용
    id = String(900000000 + Math.floor(Math.random() * 99999999))
    localStorage.setItem(GUEST_KEY, id)
  }
  return Number(id)
}

export const isGuestMode = (): boolean =>
  import.meta.client && !localStorage.getItem('accessToken')
