<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-6 max-w-3xl">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
        {{ $t("culture.mapTitle") }}
      </h1>
      <div class="relative">
        <div
          ref="mapEl"
          class="w-full h-72 sm:h-96 rounded-xl overflow-hidden bg-stone-200"
        ></div>
        <div class="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
          <button
            @click="map && map.setZoom(map.getZoom() + 1)"
            class="w-12 h-12 rounded-full bg-white border-2 border-slate-300 shadow-lg text-2xl font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            aria-label="확대"
          >
            +
          </button>
          <button
            @click="map && map.setZoom(map.getZoom() - 1)"
            class="w-12 h-12 rounded-full bg-white border-2 border-slate-300 shadow-lg text-2xl font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            aria-label="축소"
          >
            −
          </button>
        </div>
      </div>
      <p v-if="mapError" class="text-sm text-amber-600 mt-3">{{ mapError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadNaverMaps } from "~/utils/naver-maps";

const config = useRuntimeConfig();
const mapEl = ref<HTMLElement | null>(null);
const mapError = ref("");
let map: any = null;
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
  if (!mapEl.value || !window.naver?.maps) return;
  map = new window.naver.maps.Map(mapEl.value, {
    center: new window.naver.maps.LatLng(36.5, 127.8),
    zoom: 10,
  });
});
</script>
