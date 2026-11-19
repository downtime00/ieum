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

// 로그아웃 — 서버에 refresh token 무효화 요청 후 로컬 세션 제거.
// 서버 호출 실패해도 로컬은 항상 정리한다.
export const logout = async (apiBase: string): Promise<void> => {
  if (!import.meta.client) return
  const accessToken = getAccessToken()
  const refreshToken = localStorage.getItem('refreshToken')

  if (accessToken && refreshToken) {
    // 만료된 access token이면 먼저 갱신 시도
    await ensureSession(apiBase)
    const token = getAccessToken()
    if (token) {
      try {
        await fetch(`${apiBase}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        })
      } catch {
        // 네트워크 오류 무시 — 어차피 로컬 세션은 제거
      }
    }
  }

  clearSession()
}

/**
 * 인증이 필요한 API 호출 — Authorization 헤더 자동 첨부,
 * 401 시 토큰 갱신 후 1회 재시도.
 */
export const apiFetch = async (
  apiBase: string,
  path: string,
  options: RequestInit = {},
): Promise<Response> => {
  const doFetch = (token: string | null) =>
    fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })

  let res = await doFetch(getAccessToken())
  if (res.status === 401 && (await ensureSession(apiBase))) {
    res = await doFetch(getAccessToken())
  }
  return res
}
