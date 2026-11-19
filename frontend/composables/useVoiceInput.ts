import type { Ref } from "vue";

// Web Speech API 기반 음성 받아쓰기.
// target은 Ref 또는 Ref를 반환하는 함수(입력 중인 필드에 따라 대상 전환 가능).
export const useVoiceInput = (target: Ref<string> | (() => Ref<string>)) => {
  const supported = ref(false);
  const listening = ref(false);
  const error = ref("");
  const getTarget = () => (typeof target === "function" ? target() : target);
  let recognition: any = null;
  let wantListening = false;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;

  const appendText = (text: string) => {
    const t = getTarget();
    if (text && t) {
      t.value = t.value ? `${t.value} ${text}` : text;
    }
  };

  const startRecognition = () => {
    if (!recognition || !wantListening) return;
    try {
      recognition.start();
      listening.value = true;
      error.value = "";
    } catch {
      // 이미 시작된 상태 등 — onend/onerror에서 정리됨
    }
  };

  onMounted(() => {
    if (!import.meta.client) return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    supported.value = true;
    recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      // 최종 확정된 결과만 누적 (interimResults=true라 resultIndex 이후가 새 결과)
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        const text = (e.results[i][0]?.transcript || "").trim();
        if (text) appendText(text);
      }
    };
    recognition.onend = () => {
      listening.value = false;
      // 사용자가 끄지 않았는데 브라우저가 자동 종료한 경우 재시작 (연속 받아쓰기)
      if (wantListening) {
        restartTimer = setTimeout(startRecognition, 300);
      }
    };
    recognition.onerror = (e: any) => {
      listening.value = false;
      wantListening = false;
      if (restartTimer) clearTimeout(restartTimer);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        error.value = "microphone_permission";
      } else if (e?.error === "network") {
        error.value = "network";
      } else if (e?.error && e.error !== "aborted" && e.error !== "no-speech") {
        error.value = e.error;
      }
    };
  });

  const toggle = () => {
    if (!recognition) return;
    if (wantListening) {
      wantListening = false;
      if (restartTimer) clearTimeout(restartTimer);
      try {
        recognition.stop();
      } catch {
        /* noop */
      }
      listening.value = false;
    } else {
      wantListening = true;
      error.value = "";
      startRecognition();
    }
  };

  onBeforeUnmount(() => {
    wantListening = false;
    if (restartTimer) clearTimeout(restartTimer);
    try {
      recognition?.stop();
    } catch {
      /* noop */
    }
  });

  return { supported, listening, error, toggle };
};
