<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-6 max-w-3xl">
      <h1 class="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
        {{ $t("culture.mapTitle") }}
      </h1>

      <!-- 지역 검색 -->
      <div class="relative mb-4">
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            @keyup.enter="searchRegion"
            :placeholder="$t('culture.regionSearchPlaceholder')"
            class="flex-1 min-w-0 border-2 border-slate-300 rounded-full px-5 py-3 text-base focus:outline-none focus:border-sky-400"
          />
          <button
            @click="searchRegion"
            :disabled="searchLoading"
            class="inline-flex items-center justify-center bg-sky-500 text-white font-semibold py-3 px-6 rounded-full hover:bg-sky-400 transition text-base leading-none disabled:opacity-40 shrink-0"
          >
            {{
              searchLoading ? $t("common.loading") : $t("culture.regionSearch")
            }}
          </button>
        </div>
        <div
          v-if="searchResults.length > 0"
          class="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden"
        >
          <button
            v-for="(r, i) in searchResults"
            :key="i"
            @click="selectRegion(r)"
            class="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition border-b border-slate-100 last:border-0"
          >
            <p class="font-semibold text-slate-800 text-base">{{ r.name }}</p>
            <p class="text-sm text-slate-500 truncate">{{ r.address }}</p>
          </button>
        </div>
      </div>

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
const { t } = useI18n();
const mapEl = ref<HTMLElement | null>(null);
const mapError = ref("");
let map: any = null;
let marker: any = null;
let infoWindow: any = null;
declare global {
  interface Window {
    naver: any;
  }
}

const searchQuery = ref("");
const searchResults = ref<
  { name: string; address: string; lng: number; lat: number }[]
>([]);
const searchLoading = ref(false);

const searchRegion = async () => {
  const q = searchQuery.value.trim();
  if (!q) return;
  searchLoading.value = true;
  searchResults.value = [];
  try {
    const res = await fetch(
      `${config.public.apiBase}/contents/geocode?query=${encodeURIComponent(q)}`,
    );
    if (res.ok) searchResults.value = await res.json();
  } finally {
    searchLoading.value = false;
  }
};

const selectRegion = (r: {
  name: string;
  address: string;
  lng: number;
  lat: number;
}) => {
  searchResults.value = [];
  searchQuery.value = r.name;
  if (!map) return;
  const naverMaps = window.naver.maps;
  const latlng = new naverMaps.LatLng(r.lat, r.lng);
  map.setCenter(latlng);
  map.setZoom(15);
  if (marker) marker.setMap(null);
  marker = new naverMaps.Marker({ position: latlng, map });
  if (infoWindow) infoWindow.close();
  infoWindow = new naverMaps.InfoWindow({
    content: `<div style="padding:8px 12px;font-size:15px;max-width:220px;word-break:keep-all"><b>${r.name}</b><br/><span style="color:#64748b;font-size:13px">${r.address}</span></div>`,
  });
  infoWindow.open(map, marker);
};

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

onBeforeUnmount(() => {
  if (marker) marker.setMap(null);
  if (infoWindow) infoWindow.close();
  map = null;
});
</script>
