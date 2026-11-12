/**
 * API 요청에 Authorization 헤더를 자동 첨부하고,
 * 401 응답 시 refresh token으로 1회 재시도한다.
 * 백엔드 UserAuthGuard가 Bearer JWT를 요구하는 엔드포인트 대응.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const apiBase = String(config.public.apiBase || "");
  if (!apiBase || !import.meta.client) return;

  const origFetch = window.fetch.bind(window);
  let refreshing: Promise<string | null> | null = null;

  const refresh = (): Promise<string | null> => {
    if (!refreshing) {
      refreshing = (async () => {
        const rt = localStorage.getItem("refreshToken");
        if (!rt) return null;
        try {
          const res = await origFetch(`${apiBase}/auth/token/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rt }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (data?.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
            if (data.refreshToken)
              localStorage.setItem("refreshToken", data.refreshToken);
            return data.accessToken as string;
          }
        } catch {
          /* ignore */
        }
        return null;
      })().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  };

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (!url.startsWith(apiBase)) return origFetch(input, init);

    const doFetch = (token: string | null) => {
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      if (token && !headers.has("Authorization"))
        headers.set("Authorization", `Bearer ${token}`);
      return origFetch(input, { ...init, headers });
    };

    return (async () => {
      const token = localStorage.getItem("accessToken");
      const res = await doFetch(token);
      if (
        res.status === 401 &&
        token &&
        localStorage.getItem("refreshToken") &&
        !url.includes("/auth/")
      ) {
        const newToken = await refresh();
        if (newToken) return doFetch(newToken);
      }
      return res;
    })();
  };
});
