// 알림 차임음 — WebAudio로 생성 (별도 오디오 파일 불필요)
// 두 번의 짧은 음: "띵-띵"
let audioCtx: AudioContext | null = null;

export const playNotifySound = () => {
  if (typeof window === "undefined") return;
  try {
    audioCtx = audioCtx || new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const now = audioCtx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // AudioContext 미지원/차단 시 무시
  }
};

export const notifySoundEnabled = () =>
  typeof localStorage !== "undefined" &&
  localStorage.getItem("ieum_sound") !== "0";
