// 마스터 데이터(기관 유형·프로그램 분류 등) 공용 조회
// localStorage에 TTL 캐시 — TTL 이내 재방문 시 API 호출 생략 (오프라인 폴백도)
const TTL_MS = 10 * 60 * 1000; // 10분

export async function fetchMasterData<T = any>(
  apiBase: string,
  path: string,
  storageKey: string,
): Promise<T[] | null> {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const { data, fetchedAt } = JSON.parse(raw);
        if (Array.isArray(data) && Date.now() - fetchedAt < TTL_MS) return data;
      }
    } catch {
      /* 캐시 파손 시 무시 */
    }
  }
  try {
    const res = await fetch(`${apiBase}${path}`);
    if (!res.ok) return null;
    const data = (await res.json()) as T[];
    if (!Array.isArray(data)) return null;
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ data, fetchedAt: Date.now() }),
        );
      } catch {
        /* 저장 실패 무시 */
      }
    }
    return data;
  } catch {
    return null;
  }
}
