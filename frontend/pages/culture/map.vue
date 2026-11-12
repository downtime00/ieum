<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <!-- 헤더 -->
    <div class="bg-slate-800 px-4 py-4 sticky top-0 z-40">
      <div
        class="container mx-auto flex items-center justify-between
      >">
        <div class="flex items-center gap-3">
          <div>
            <h1 class="text-xl font-bold text-white">
              {{ $t("culture.mapTitle") }}
            </h1>
            <p class="text-sm text-white/60">
              {{ $t("culture.mapSubtitle") }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="locateMe"
            :disabled="geoStatus === 'requesting'"
            class="bg-sky-500 text-white font-semibold py-2 px-4 rounded-xl hover:bg-sky-400 transition text-sm disabled:bg-white/20"
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
      <div class="container mx-auto mt-3 relative px-4">
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            @keyup.enter="searchRegion"
            :placeholder="$t('culture.regionSearchPlaceholder')"
            class="flex-1 border-2 border-white/20 bg-white/10 text-white placeholder-white/40 rounded-full px-5 py-2.5 text-base focus:outline-none focus:border-sky-400"
          />
          <button
            @click="searchRegion"
            :disabled="searchLoading"
            class="bg-sky-500 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-sky-400 transition text-sm disabled:opacity-40 shrink-0"
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
            class="w-full text-left px-5 py-3 hover:bg-white/10 transition border-b border-white/10 last:border-0"
          >
            <p class="font-semibold text-white text-sm">{{ r.name }}</p>
            <p class="text-xs text-white/50 truncate">{{ r.address }}</p>
          </button>
        </div>
      </div>
    </div>

    <!-- 지도 -->
    <div class="flex-1 container mx-auto p-4">
      <div
        class="relative bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-white/10"
        style="height: calc(100vh - 220px); min-height: 400px"
      >
        <div ref="mapEl" class="w-full h-full"></div>
        <!-- 큰 줌 버튼 (어르신용 상시 노출) -->
        <div class="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            @click="zoomIn"
            class="w-14 h-14 rounded-full bg-white border-2 border-slate-300 shadow-lg text-3xl font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            aria-label="확대"
          >
            +
          </button>
          <button
            @click="zoomOut"
            class="w-14 h-14 rounded-full bg-white border-2 border-slate-300 shadow-lg text-3xl font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            aria-label="축소"
          >
            −
          </button>
        </div>
      </div>
      <p
        v-if="visibleCount > 0"
        class="text-sm text-white/60 mt-3 text-center"
      >
        {{
          centerPosition
            ? $t("culture.withinKm", { count: visibleCount, km: MAX_KM })
            : $t("culture.allMarkers", { count: visibleCount })
        }}
      </p>
      <p
        v-if="centerPosition && visibleCount === 0"
        class="text-sm text-amber-300 mt-3 text-center"
      >
        {{ $t("culture.noNearby") }}
      </p>
      <p
        v-if="!geoPosition && !searchCenter"
        class="text-sm text-white/40 mt-3 text-center"
      >
        {{ $t("culture.setLocationHint") }}
      </p>
      <p v-if="geoError" class="text-sm text-red-300 mt-3 text-center">
        {{ geoError }}
      </p>
      <p
        v-if="geoStatus === 'denied'"
        class="text-xs text-white/60 mt-2 text-center leading-relaxed px-4"
      >
        {{ $t("location.deniedGuide") }}
      </p>
      <p v-if="mapError" class="text-sm text-amber-300 mt-3 text-center">
        {{ mapError }}
      </p>

      <!-- 검색한 지역의 문화정보 목록 -->
      <div
        v-if="searchCenter && visibleItems.length > 0"
        class="mt-4 bg-white/10 rounded-2xl p-4"
      >
        <h2 class="font-semibold text-white mb-3">
          {{ searchCenter.name }}
          {{ $t("culture.regionItems", { count: visibleItems.length }) }}
        </h2>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto"
        >
          <NuxtLink
            v-for="item in visibleItems"
            :key="item.id"
            :to="`/culture/${item.id}`"
            class="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition"
          >
            <div class="min-w-0">
              <p class="font-medium text-white text-sm truncate">
                {{ item.title }}
              </p>
              <p class="text-xs text-white/50 truncate">
                {{ item.location || ""
                }}<span v-if="item.eventDate">
                  · {{ formatEventDate(item.eventDate) }}</span
                >
              </p>
            </div>
            <span class="text-sky-300 shrink-0">›</span>
          </NuxtLink>
        </div>
      </div>
      <div
        v-else-if="searchCenter && visibleItems.length === 0"
        class="mt-4 bg-amber-400/20 border border-amber-400/30 rounded-2xl p-4 text-center text-sm text-amber-200"
      >
        {{ $t("culture.noNearby") }}
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

interface MapContent {
  id: number;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
  categoryCd?: string;
  eventDate?: string;
}

declare global {
  interface Window {
    naver: any;
  }
}

const mapEl = ref<HTMLElement | null>(null);
const mapError = ref("");
const visibleCount = ref(0);
const visibleItems = ref<MapContent[]>([]);
const MAX_KM = 5;
let map: any = null;
let userMarker: any = null;
const overlays: any[] = [];
let allItems: MapContent[] = [];

// 지역 검색
const searchQuery = ref("");
const searchResults = ref<
  { name: string; address: string; lng: number; lat: number }[]
>([]);
const searchLoading = ref(false);
const searchCenter = ref<{ name: string; lat: number; lng: number } | null>(
  null,
);

const naver = () => window.naver;

// 현재 기준 중심 (검색 지역 우선, 없으면 내 위치) — 좌표 키를 latitude/longitude로 통일
const centerPosition = computed<{ latitude: number; longitude: number } | null>(
  () => {
    const sc = searchCenter.value;
    return sc
      ? { latitude: sc.lat, longitude: sc.lng }
      : geoPosition.value;
  },
);

// 중심 기준 거리 (km)
const distanceKm = (lat: number, lng: number): number | null => {
  const pos = centerPosition.value;
  if (!pos) return null;
  const R = 6371;
  const dLat = ((lat - pos.latitude) * Math.PI) / 180;
  const dLng = ((lng - pos.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((pos.latitude * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const zoomIn = () => map?.setZoom(map.getZoom() + 1);
const zoomOut = () => map?.setZoom(map.getZoom() - 1);

// 줌 레벨에 따라 마커 지름 자동 조절 (20~52px)
const markerSize = () => {
  const z = map?.getZoom() ?? 10;
  return Math.min(52, Math.max(20, Math.round(z * 3.2)));
};

const locateMe = async () => {
  searchCenter.value = null;
  searchResults.value = [];
  const pos = await requestLocation();
  if (pos && map) {
    renderMarkers();
    const latlng = new (naver().maps.LatLng)(pos.latitude, pos.longitude);
    map.setCenter(latlng);
    map.setZoom(14);
    addUserMarker(pos.latitude, pos.longitude);
  }
};

const formatEventDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("ko-KR", {
        month: "numeric",
        day: "numeric",
      })
    : "";

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
  searchCenter.value = { name: r.name, lat: r.lat, lng: r.lng };
  searchResults.value = [];
  searchQuery.value = r.name;
  renderMarkers();
  map?.setCenter(new (naver().maps.LatLng)(r.lat, r.lng));
  map?.setZoom(12);
};

const addUserMarker = (lat: number, lng: number) => {
  if (!map) return;
  if (userMarker) userMarker.setMap(null);
  userMarker = new (naver().maps.Marker)({
    position: new (naver().maps.LatLng)(lat, lng),
    map,
    title: t("culture.youAreHere"),
  });
  const infoWindow = new (naver().maps.InfoWindow)({
    content: `<div style="padding:8px;font-size:16px"><b> ${t("culture.youAreHere")}</b></div>`,
  });
  infoWindow.open(map, userMarker);
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

  // 지도 초기화 (한국 중심)
  map = new (naver().maps.Map)(mapEl.value, {
    center: new (naver().maps.LatLng)(36.5, 127.8),
    zoom: 7,
  });

  // 줌 레벨에 따라 마커 크기 자동 조절
  naver().maps.Event.addListener(map, "zoom_changed", () => renderMarkers());

  // 콘텐츠 로드
  try {
    const res = await fetch(`${config.public.apiBase}/contents?limit=600`);
    const data = await res.json();
    allItems = (data.items || []).filter(
      (c: MapContent) => c.latitude != null && c.longitude != null,
    );
    renderMarkers();
  } catch (e) {
    console.error("지도 데이터 로드 실패:", e);
  }
});

// 마커 렌더링 — 내 위치가 있으면 5km 이내만 표시
const renderMarkers = () => {
  if (!map) return;
  overlays.forEach((o) => o.setMap(null));
  overlays.length = 0;

  // 중심(검색 지역 또는 내 위치)이 있으면 5km 이내만, 없으면 전체 표시
  const center = centerPosition.value;
  const items = center
    ? allItems.filter((c) => {
        const d = distanceKm(Number(c.latitude), Number(c.longitude));
        return d != null && d <= MAX_KM;
      })
    : allItems;
  visibleCount.value = items.length;
  visibleItems.value = items;

  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;
  const infoWindow = new (naver().maps.InfoWindow)({});

  for (const item of items) {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;

    // 화면 좌표계 원형 마커 — 줌에 따라 크기 자동 조절 (지리 좌표 Circle는 메르카토르 투영으로 세로로 늘어나는 문제 방지)
    const size = markerSize();
    const marker = new (naver().maps.Marker)({
      map,
      position: new (naver().maps.LatLng)(lat, lng),
      icon: {
        content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#f59e0b;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box"></div>`,
        anchor: new (naver().maps.Point)(size / 2, size / 2),
      },
    });
    overlays.push(marker);

    // 클릭 시 정보창
    naver().maps.Event.addListener(marker, "click", () => {
      infoWindow.setContent(
        `<div style="width:240px;padding:4px;word-break:keep-all;line-height:1.5">
<b style="font-size:17px">${item.title}</b><br/>
          ${item.location ? ` ${item.location}<br/>` : ""}
          ${item.eventDate ? ` ${new Date(item.eventDate).toLocaleDateString("ko-KR")}<br/>` : ""}
<a href="/culture/${item.id}" style="color:#2563eb;font-weight:600">${t("culture.viewDetail")} →</a>
</div>`,
      );
      infoWindow.setPosition(new (naver().maps.LatLng)(lat, lng));
      infoWindow.open(map);
    });

    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  // 저장된 내 위치가 있으면 마커 추가
  if (geoPosition.value) {
    addUserMarker(geoPosition.value.latitude, geoPosition.value.longitude);
    minLat = Math.min(minLat, geoPosition.value.latitude);
    maxLat = Math.max(maxLat, geoPosition.value.latitude);
    minLng = Math.min(minLng, geoPosition.value.longitude);
    maxLng = Math.max(maxLng, geoPosition.value.longitude);
  }

  if (center && items.length > 0) {
    // 중심(검색 지역/내 위치) 기준으로 확대 (5km 반경이 보이도록)
    const c: any = center;
    const latlng = new (naver().maps.LatLng)(
      c.latitude ?? c.lat,
      c.longitude ?? c.lng,
    );
    map.setCenter(latlng);
    map.setZoom(searchCenter.value ? 12 : 13);
  } else if (items.length > 0) {
    const bounds = new (naver().maps.LatLngBounds)(
      new (naver().maps.LatLng)(minLat, minLng),
      new (naver().maps.LatLng)(maxLat, maxLng),
    );
    map.fitBounds(bounds);
  }
};

onBeforeUnmount(() => {
  if (userMarker) userMarker.setMap(null);
  overlays.forEach((o) => o.setMap(null));
  map = null;
});
</script>
