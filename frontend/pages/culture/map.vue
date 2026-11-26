<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <!-- 헤더 -->
    <div class="ieum-panel px-4 py-4 sticky top-0 z-40">
      <div
        class="container mx-auto flex flex-wrap items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-white leading-tight">
              {{ $t("culture.mapTitle") }}
            </h1>
            <p class="text-sm sm:text-base text-white/60 mt-0.5">
              {{ $t("culture.mapSubtitle") }}
            </p>
          </div>
        </div>
        <div class="flex gap-2 shrink-0 ml-auto">
          <button
            @click="locateMe"
            :disabled="geoStatus === 'requesting'"
            class="inline-flex items-center justify-center bg-sky-500 text-white font-semibold py-3 px-5 rounded-xl hover:bg-sky-400 transition text-base leading-none disabled:bg-white/20"
          >
            {{
              geoStatus === "requesting"
                ? $t("common.loading")
                : $t("culture.locateMe")
            }}
          </button>
        </div>
      </div>

      <!-- 지역 검색 -->
      <div class="container mx-auto mt-3 relative px-4 sm:max-w-3xl sm:ml-auto sm:mr-0">
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            @keyup.enter="searchRegion"
            :placeholder="$t('culture.regionSearchPlaceholder')"
            class="flex-1 min-w-0 border-2 border-white/20 bg-white/10 text-white placeholder-white/40 rounded-full px-5 py-3 text-base focus:outline-none focus:border-sky-400"
          />
          <button
            @click="searchRegion"
            :disabled="searchLoading"
            class="inline-flex items-center justify-center bg-sky-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-sky-400 transition text-base leading-none disabled:opacity-40 shrink-0"
          >
            {{
              searchLoading ? $t("common.loading") : $t("culture.regionSearch")
            }}
          </button>
        </div>
        <!-- 검색 결과 -->
        <div
          v-if="searchResults.length > 0"
          class="absolute left-0 right-0 top-full mt-2 bg-slate-700 border border-white/10 rounded-2xl shadow-lg z-50 overflow-hidden"
        >
          <button
            v-for="(r, i) in searchResults"
            :key="i"
            @click="selectRegion(r)"
            class="w-full text-left px-5 py-3.5 hover:bg-white/10 transition border-b border-white/10 last:border-0"
          >
            <p class="font-semibold text-white text-base">{{ r.name }}</p>
            <p class="text-sm text-white/50 truncate">{{ r.address }}</p>
          </button>
        </div>
      </div>
    </div>

    <!-- 지도 (전체 화면) -->
    <div class="flex-1 flex flex-col min-h-0">
      <div class="relative flex-1 bg-stone-200 min-h-[320px]">
        <div ref="mapEl" class="absolute inset-0"></div>
        <!-- 큰 줌 버튼 (어르신용 상시 노출) -->
        <div class="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            @click="zoomIn"
            class="w-14 h-14 rounded-full bg-white border-2 border-slate-300 shadow-lg text-3xl font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center"
            aria-label="확대"
          >
            +
          </button>
          <button
            @click="zoomOut"
            class="w-14 h-14 rounded-full bg-white border-2 border-slate-300 shadow-lg text-3xl font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center"
            aria-label="축소"
          >
            −
          </button>
        </div>
      </div>
      <!-- 지도 아래 상태 영역 -->
      <div class="ieum-panel px-4 py-3">
        <div class="container mx-auto">
          <p
            v-if="!geoPosition"
            class="text-base text-white/50 mt-3 text-center"
          >
            {{ $t("culture.setLocationHint") }}
          </p>
          <p v-if="geoError" class="text-base text-red-300 mt-3 text-center">
            {{ geoError }}
          </p>
          <p
            v-if="geoStatus === 'denied'"
            class="text-sm text-white/60 mt-2 text-center leading-relaxed px-4"
          >
            {{ $t("location.deniedGuide") }}
          </p>
          <p v-if="mapError" class="text-base text-amber-300 mt-3 text-center">
            {{ mapError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadNaverMaps } from "~/utils/naver-maps";

const config = useRuntimeConfig();
const { t } = useI18n();
const {
  status: geoStatus,
  position: geoPosition,
  errorMessage: geoError,
  loadStoredPosition,
  requestLocation,
} = useGeolocation();

declare global {
  interface Window {
    naver: any;
  }
}

const mapEl = ref<HTMLElement | null>(null);
const mapError = ref("");
let map: any = null;
let userMarker: any = null;
let userInfoWindow: any = null;

// 지역 검색
const searchQuery = ref("");
const searchResults = ref<
  { name: string; address: string; lng: number; lat: number }[]
>([]);
const searchLoading = ref(false);

const naver = () => window.naver;

const zoomIn = () => map?.setZoom(map.getZoom() + 1);
const zoomOut = () => map?.setZoom(map.getZoom() - 1);

const locateMe = async () => {
  const pos = await requestLocation();
  if (pos && map) centerOn(pos.latitude, pos.longitude, 14);
};

const centerOn = (lat: number, lng: number, zoom = 14) => {
  if (!map) return;
  const naverMaps = naver().maps;
  map.setCenter(new naverMaps.LatLng(lat, lng));
  map.setZoom(zoom);
  showUserMarker(lat, lng);
};

const showUserMarker = (lat: number, lng: number) => {
  if (!map) return;
  const naverMaps = naver().maps;
  if (userMarker) userMarker.setMap(null);
  userMarker = new naverMaps.Marker({
    position: new naverMaps.LatLng(lat, lng),
    map,
    title: t("culture.youAreHere"),
  });
  if (userInfoWindow) userInfoWindow.close();
  userInfoWindow = new naverMaps.InfoWindow({
    content: `<div style="padding:8px;font-size:16px"><b>${t("culture.youAreHere")}</b></div>`,
  });
  userInfoWindow.open(map, userMarker);
};

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
  if (map) {
    map.setCenter(new (naver().maps.LatLng)(r.lat, r.lng));
    map.setZoom(12);
  }
};

onMounted(async () => {
  loadStoredPosition();

  try {
    await loadNaverMaps(config.public.naverMapsClientId);
  } catch (e: any) {
    mapError.value = e.message || "지도를 불러올 수 없습니다.";
    return;
  }

  if (!mapEl.value) return;

  map = new (naver().maps.Map)(mapEl.value, {
    center: new (naver().maps.LatLng)(36.5, 127.8),
    zoom: 7,
  });

  // 레이아웃 확정 후 재렌더 (상세 페이지와 동일 패턴)
  setTimeout(() => map?.refresh?.(), 400);
  setTimeout(() => map?.refresh?.(), 1500);

  // 저장된 내 위치가 있으면 바로 이동 + 마커
  const stored = geoPosition.value;
  if (stored) {
    centerOn(stored.latitude, stored.longitude, 14);
  }
});

onBeforeUnmount(() => {
  if (userMarker) userMarker.setMap(null);
  if (userInfoWindow) userInfoWindow.close();
  map = null;
});
</script>
