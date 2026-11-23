<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-slate-800">
          {{ $t("directions.title") }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      <p class="text-sm text-slate-500 mb-4">{{ $t("directions.hint") }}</p>
      <div class="flex gap-2">
        <input
          v-model="dirDest"
          type="text"
          :placeholder="$t('directions.placeholder')"
          class="flex-1 min-w-0 px-4 py-3.5 border border-slate-300 rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          @keyup.enter="goDirections"
        />
        <button
          v-if="dirVoice.supported.value"
          type="button"
          @click="dirVoice.toggle"
          class="flex items-center justify-center self-stretch gap-1.5 px-4 rounded-xl font-semibold text-sm whitespace-nowrap transition shrink-0 border"
          :class="
            dirVoice.listening.value
              ? 'bg-red-500 border-red-500 text-white animate-pulse'
              : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
          "
          :title="$t('directions.voice')"
          :aria-label="$t('directions.voice')"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          <span>{{
            dirVoice.listening.value
              ? $t("common.listening")
              : $t("common.mic")
          }}</span>
        </button>
      </div>
      <p
        v-if="dirVoice.listening.value"
        class="text-sm text-red-500 mt-2"
      >
        {{ $t("directions.listening") }}
      </p>
      <p v-if="dirVoice.error.value" class="text-sm text-red-500 mt-2">
        {{ voiceErrorText(dirVoice.error.value) }}
      </p>
      <p v-if="dirError" class="text-sm text-red-500 mt-3">{{ dirError }}</p>
      <button
        @click="goDirections"
        :disabled="dirLoading || !dirDest.trim()"
        class="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-lg rounded-2xl py-4 transition"
      >
        {{ dirLoading ? $t("common.loading") : $t("directions.submit") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; initialDest?: string }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();

const dirDest = ref("");
const dirLoading = ref(false);
const dirError = ref("");
const dirVoice = useVoiceInput(dirDest);

// 병원 길찾기 등 외부에서 목적지를 지정해 열 때 입력창에 미리 채움
watch(
  () => props.open,
  (open) => {
    if (open && props.initialDest) dirDest.value = props.initialDest;
  },
);
const voiceErrorText = (code: string) => {
  if (code === "microphone_permission" || code === "service-not-allowed")
    return t("board.voiceErrorPermission");
  if (code === "network") return t("board.voiceErrorNetwork");
  return t("board.voiceErrorGeneric");
};

const geocodeAddress = async (
  address: string,
): Promise<{ lat: number; lng: number; name: string } | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ko&q=${encodeURIComponent(address)}`,
    );
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      name: data[0].display_name || address,
    };
  } catch {
    return null;
  }
};

const getCurrentPosition = (): Promise<{ latitude: number; longitude: number } | null> =>
  new Promise((resolve) => {
    if (!import.meta.client || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });

const goDirections = async () => {
  const dest = dirDest.value.trim();
  if (!dest || dirLoading.value) return;
  dirLoading.value = true;
  dirError.value = "";
  // 출발지는 항상 현재 GPS 위치 (실패 시 도착지만 지정)
  const geoPromise = geocodeAddress(dest);
  const origin = await getCurrentPosition();
  const geo = await geoPromise;
  if (!geo) {
    // 좌표 변환 실패 시 네이버 지도 검색으로 폴백
    window.open(
      `https://map.naver.com/p/search/${encodeURIComponent(dest)}`,
      "_blank",
      "noopener",
    );
    emit("close");
    dirLoading.value = false;
    return;
  }
  const url = origin
    ? `https://map.naver.com/index.nhn?slat=${origin.latitude}&slng=${origin.longitude}&stext=${encodeURIComponent(t("directions.fromHere"))}&elat=${geo.lat}&elng=${geo.lng}&etext=${encodeURIComponent(dest)}&menu=route&pathType=1`
    : `https://map.naver.com/index.nhn?elat=${geo.lat}&elng=${geo.lng}&etext=${encodeURIComponent(dest)}&menu=route&pathType=1`;
  window.open(url, "_blank", "noopener");
  emit("close");
  dirLoading.value = false;
};
</script>
