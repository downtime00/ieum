// JWT 세션 유틸 — localStorage 기반, 만료 시 refresh token으로 갱신

const decodePayload = (token: string): any | null => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export const getAccessToken = (): string | null =>
  import.meta.client ? localStorage.getItem('accessToken') : null

export const isLoggedIn = (): boolean => !!getAccessToken()

const isExpired = (token: string): boolean => {
  const payload = decodePayload(token)
  if (!payload?.exp) return true
  // 30초 여유
  return payload.exp * 1000 < Date.now() + 30_000
}

const clearSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

// 만료됐으면 refresh token으로 재발급. 실패 시 세션 제거 후 false.
export const ensureSession = async (apiBase: string): Promise<boolean> => {
  if (!import.meta.client) return false
  const token = getAccessToken()
  if (!token) return false
  if (!isExpired(token)) return true

  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    clearSession()
    return false
  }

  try {
    const res = await fetch(`${apiBase}/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      clearSession()
      return false
    }
    const data = await res.json()
    localStorage.setItem('accessToken', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
    return true
  } catch {
    // 네트워크 오류 시 기존 토큰 유지 (일시적 오프라인 대응)
    return true
  }
}
