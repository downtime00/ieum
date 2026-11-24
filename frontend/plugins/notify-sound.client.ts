// 서비스워커 푸시 수신 시 앱이 열려 있으면 차임음 재생 + 알림 기준시각 갱신
import { playNotifySound, notifySoundEnabled } from "~/utils/sound";

export default defineNuxtPlugin(() => {
  if (!import.meta.client || !("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "IEUM_PUSH") return;
    // 대시보드 폴링이 같은 알림에 다시 차임 울리지 않도록 기준시각 갱신
    localStorage.setItem("ieum:lastNotifCheck", String(Date.now()));
    if (notifySoundEnabled()) playNotifySound();
  });
});
