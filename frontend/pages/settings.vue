<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">

      <!-- 알림 받기 (웹 푸시) -->
      <section
        v-if="pushSupported"
        class="bg-white/10 rounded-2xl p-6 mb-4"
      >
        <h2 class="font-semibold text-white mb-1">
          {{ $t("push.title") }}
        </h2>
        <p class="text-sm text-white/60 mb-4">
          {{ pushSubscribed ? $t("push.enabled") : $t("push.desc") }}
        </p>
        <p v-if="pushError" class="text-sm text-red-300 mb-3">
          {{ pushError }}
        </p>
        <button
          @click="pushSubscribed ? disablePush() : enablePush()"
          :disabled="pushLoading"
          :class="
            pushSubscribed
              ? 'bg-white/15 text-white/70 hover:bg-white/25'
              : 'bg-sky-500 text-white hover:bg-sky-400'
          "
          class="font-semibold py-3 px-6 rounded-xl transition disabled:opacity-40"
        >
          {{
            pushLoading
              ? "..."
              : pushSubscribed
                ? $t("push.disable")
                : $t("push.enable")
          }}
        </button>
      </section>

      <!-- 진동 설정 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">
          {{ $t("settings.vibration") }}
        </h2>
        <p class="text-sm text-white/60 mb-5">
          {{ $t("settings.vibrationDesc") }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button
            @click="toggleVibration"
            :class="
              vibrationOn
                ? 'bg-sky-500 text-white'
                : 'bg-white/10 text-white/70'
            "
            class="font-semibold py-3 px-8 rounded-xl transition text-lg"
          >
            {{
              vibrationOn
                ? $t("settings.vibrationOn")
                : $t("settings.vibrationOff")
            }}
          </button>
          <button
            v-if="vibrationOn && canVibrate"
            @click="testVibrate"
            class="bg-white/10 text-sky-300 border border-sky-400/40 font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition"
          >
            {{ $t("settings.testVibration") }}
          </button>
        </div>
        <p
          v-if="vibrationOn && !canVibrate"
          class="mt-3 text-xs text-white/40"
        >
          {{ $t("settings.vibrationUnsupported") }}
        </p>
      </section>

      <!-- 알림 표시 개수 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">
          {{ $t("settings.notificationCount") }}
        </h2>
        <p class="text-sm text-white/60 mb-5">
          {{ $t("settings.notificationCountDesc") }}
        </p>

        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <button
            v-for="n in countOptions"
            :key="n"
            @click="selectCount(n)"
            :class="
              count === n
                ? 'bg-sky-500 text-white border-sky-400'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            "
            class="py-4 rounded-xl border-2 text-xl font-bold transition"
          >
            {{ n }}
          </button>
        </div>
        <p class="mt-4 text-sm text-white/60">
          {{ $t("settings.currentSetting") }}:
          <span class="font-semibold text-white"
            >{{ count }}{{ $t("settings.countUnit") }}</span
          >
        </p>
      </section>

      <!-- 시스템 점검 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">
          {{ $t("status.title") }}
        </h2>
        <p class="text-sm text-white/60 mb-5">
          {{ $t("status.desc") }}
        </p>
        <button
          @click="router.push('/status')"
          class="bg-white/15 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/25 transition"
        >
          {{ $t("status.open") }}
        </button>
      </section>

      <!-- 개인정보처리방침 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">개인정보처리방침</h2>
        <p class="text-sm text-white/60 mb-5">
          수집하는 정보와 이용 목적을 확인합니다.
        </p>
        <button
          @click="router.push('/privacy')"
          class="bg-white/15 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/25 transition"
        >
          보기
        </button>
      </section>

      <!-- 저장 안내 -->
      <div
        class="bg-sky-500/20 border border-sky-400/30 rounded-2xl p-5 text-sm text-sky-200"
      >
        {{ $t("settings.autoSaveNotice") }}
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const STORAGE_KEY = "notificationDisplayCount";
const VIBRATION_KEY = "ieum_vibration";
const DEFAULT_COUNT = 2;
const MAX_COUNT = 10;

const countOptions = Array.from({ length: MAX_COUNT - 1 }, (_, i) => i + 2); // 2~10

const count = ref(DEFAULT_COUNT);

// 웹 푸시 구독
const {
  supported: pushSupported,
  subscribed: pushSubscribed,
  loading: pushLoading,
  error: pushError,
  subscribe: subscribePush,
  unsubscribe: unsubscribePush,
} = usePushNotifications();

const enablePush = () => subscribePush();
const disablePush = () => unsubscribePush();

// 진동 설정 (localStorage + 쿠키 — 서비스 워커가 쿠키를 읽어 알림 진동 적용)
const vibrationOn = ref(true);
const canVibrate = ref(false);

const VIBRATION_PATTERN = [200, 100, 200];

const applyVibrationCookie = (on: boolean) => {
  document.cookie = `${VIBRATION_KEY}=${on ? 1 : 0};path=/;max-age=31536000;SameSite=Lax`;
};

const toggleVibration = () => {
  vibrationOn.value = !vibrationOn.value;
  localStorage.setItem(VIBRATION_KEY, vibrationOn.value ? "1" : "0");
  applyVibrationCookie(vibrationOn.value);
};

const testVibrate = () => {
  if (canVibrate.value) navigator.vibrate(VIBRATION_PATTERN);
};

const selectCount = (n: number) => {
  count.value = n;
  localStorage.setItem(STORAGE_KEY, String(n));
};

onMounted(() => {
  // 설정은 로컬 저장소 기반이라 로그인 없이도 사용 가능
  const saved = parseInt(localStorage.getItem(STORAGE_KEY) || "", 10);
  if (!isNaN(saved)) {
    count.value = Math.min(Math.max(saved, 2), MAX_COUNT);
  }

  // 진동 설정 복원 (localStorage 우선, 없으면 쿠키)
  const vibSaved = localStorage.getItem(VIBRATION_KEY);
  if (vibSaved !== null) {
    vibrationOn.value = vibSaved === "1";
  } else {
    vibrationOn.value = !document.cookie.includes(`${VIBRATION_KEY}=0`);
  }
  applyVibrationCookie(vibrationOn.value);
  canVibrate.value = typeof navigator !== "undefined" && "vibrate" in navigator;
});
</script>
