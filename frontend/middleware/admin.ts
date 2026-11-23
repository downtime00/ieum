// /admin/* 페이지 공통 가드 — 관리자 역할이 아니면 대시보드로 이동
export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return;
  const token = localStorage.getItem("accessToken");
  let allowed = false;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    allowed =
      !!token &&
      !!user &&
      ["ADMIN", "SUPER_ADMIN"].includes(user.role);
  } catch {}
  if (!allowed) return navigateTo("/dashboard");
});
