<template>
  <div class="h-screen flex flex-col">
    <div class="ieum-panel px-4 py-3 shrink-0">
      <div class="container mx-auto">
        <h1 class="text-lg sm:text-xl font-bold text-white leading-tight">
          {{ $t("culture.mapTitle") }}
        </h1>
      </div>
    </div>
    <div class="flex-1 relative bg-stone-200 min-h-0">
      <div ref="mapEl" class="absolute inset-0"></div>
      <p v-if="mapError" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-4 py-2 rounded-full">
        {{ mapError }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadNaverMaps } from "~/utils/naver-maps";

const config = useRuntimeConfig();
const mapEl = ref<HTMLElement | null>(null);
const mapError = ref("");
declare global {
  interface Window {
    naver: any;
  }
}

onMounted(async () => {
  try {
    await loadNaverMaps(config.public.naverMapsClientId);
  } catch (e: any) {
    mapError.value = e.message || "지도를 불러올 수 없습니다.";
    return;
  }
  if (!mapEl.value) return;
  const map = new (window.naver.maps.Map)(mapEl.value, {
    center: new window.naver.maps.LatLng(36.5, 127.8),
    zoom: 7,
  });
  setTimeout(() => map.refresh?.(), 400);
  setTimeout(() => map.refresh?.(), 1500);
});
</script>
