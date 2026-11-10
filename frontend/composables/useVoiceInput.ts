import type { Ref } from "vue";

// Web Speech API 기반 음성 받아쓰기.
// target은 Ref 또는 Ref를 반환하는 함수(입력 중인 필드에 따라 대상 전환 가능).
export const useVoiceInput = (target: Ref<string> | (() => Ref<string>)) => {
  const supported = ref(false);
  const listening = ref(false);
  const getTarget = () => (typeof target === "function" ? target() : target);
  let recognition: any = null;

  onMounted(() => {
    if (!import.meta.client) return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    supported.value = true;
    recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      text = text.trim();
      const t = getTarget();
      if (text && t) {
        t.value = t.value ? `${t.value} ${text}` : text;
      }
    };
    recognition.onend = () => {
      listening.value = false;
    };
    recognition.onerror = () => {
      listening.value = false;
    };
  });

  const toggle = () => {
    if (!recognition) return;
    if (listening.value) {
      recognition.stop();
      listening.value = false;
    } else {
      try {
        recognition.start();
        listening.value = true;
      } catch {
        listening.value = false;
      }
    }
  };

  onBeforeUnmount(() => {
    try {
      recognition?.stop();
    } catch {
      /* noop */
    }
  });

  return { supported, listening, toggle };
};
