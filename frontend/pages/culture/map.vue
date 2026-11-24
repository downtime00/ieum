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

        <div ref="mapEl" class="w-full h-full"></div>
        <!-- 지도 로딩 오버레이: 타일 로드 전까지 표시 -->
        <div
          v-if="mapLoading"
          class="absolute inset-0 z-[900] flex items-center justify-center bg-stone-200"
        >
          <div class="text-center">
            <div
              class="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            ></div>
            <p class="text-slate-500 font-medium">{{ $t("common.loading") }}</p>
          </div>
        </div>
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
      <!-- 지도 아래 상태/목록 영역 -->
      <div class="ieum-panel px-4 py-3">
      <div class="container mx-auto">
      <p
        v-if="visibleCount > 0"
        class="text-base text-white/70 mt-3 text-center"
      >
        {{
          centerPosition
            ? $t("culture.withinKm", { count: visibleCount, km: MAX_KM })
            : $t("culture.allMarkers", { count: visibleCount })
        }}
      </p>
      <p
        v-if="centerPosition && visibleCount === 0"
        class="text-base text-amber-300 mt-3 text-center"
      >
        {{ $t("culture.noNearby") }}
      </p>
      <p
        v-if="!geoPosition && !searchCenter"
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

      <!-- 검색한 지역의 문화정보 목록 -->
      <div
        v-if="searchCenter && visibleItems.length > 0"
        class="mt-4 bg-white/10 rounded-2xl p-4"
      >
        <h2 class="font-semibold text-white text-lg mb-3">
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
            class="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3.5 transition"
          >
            <div class="min-w-0">
              <p class="font-medium text-white text-base truncate">
                {{ item.title }}
              </p>
              <p class="text-sm text-white/50 truncate">
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
        class="mt-4 bg-amber-400/20 border border-amber-400/30 rounded-2xl p-4 text-center text-base text-amber-200"
      >
        {{ $t("culture.noNearby") }}
      </div>
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
const mapLoading = ref(true);
const visibleCount = ref(0);
const visibleItems = ref<MapContent[]>([]);
const MAX_KM = 5;
let map: any = null;
let userMarker: any = null;
const overlays: any[] = [];
let allItems: MapContent[] = [];
let didFitBounds = false;
let lastCenterKey = '';

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

// 줌 레벨에 따라 마커 지름 자동 조절 (24~56px 너비)
const markerSize = () => {
  const z = map?.getZoom() ?? 10;
  return Math.min(56, Math.max(24, Math.round(z * 3.6)));
};

// InfoWindow/마커 HTML에 삽입할 문자열 이스케이프
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 핀 모양 마커 — 반드시 HTML 콘텐츠로 전달해야 함.
// data:image/svg+xml URI로 주면 네이버가 이미지 아이콘으로 처리해
// _icon_loaded 내부 cursor 설정에서 TypeError가 발생한다.
const pinIcon = (color: string, w: number, h: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 36 48" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><path d="M18 1C8.7 1 1 8.7 1 18c0 13.4 17 29 17 29s17-15.6 17-29C35 8.7 27.3 1 18 1z" fill="${color}" stroke="#ffffff" stroke-width="2.5"/><circle cx="18" cy="17.5" r="6.5" fill="#ffffff"/></svg>`;

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

// 마커가 첫 렌더(드로우)되기 전 클릭 리스너를 달면 네이버 내부에서
// 아이콘 요소가 아직 없어 TypeError(cursor)가 발생할 수 있어 지연 등록한다.
const addMarkerClickListener = (marker: any, fn: () => void, retries = 10) => {
  const tryAdd = () => {
    try {
      naver().maps.Event.addListener(marker, "click", fn);
    } catch {
      if (retries > 0) setTimeout(tryAdd, 100);
    }
  };
  setTimeout(tryAdd, 0);
};

const addUserMarker = (lat: number, lng: number) => {
  if (!map) return;
  if (userMarker) userMarker.setMap(null);
  const w = 40;
  const h = 54;
  userMarker = new (naver().maps.Marker)({
    position: new (naver().maps.LatLng)(lat, lng),
    map,
    title: t("culture.youAreHere"),
    icon: {
      content: pinIcon("#0ea5e9", w, h),
      anchor: new (naver().maps.Point)(w / 2, h),
    },
  });
  const infoWindow = new (naver().maps.InfoWindow)({
    content: `<div style="padding:12px 16px;font-size:16px;font-weight:700;color:#0f172a">📍 ${escapeHtml(t("culture.youAreHere"))}</div>`,
  });
  // 마커가 화면에 그려진 뒤 정보창 오픈 (즉시 open 시 내부 cursor 설정 오류 가능)
  setTimeout(() => {
    try {
      infoWindow.open(map, userMarker);
    } catch {}
  }, 400);
};

onMounted(async () => {
  loadStoredPosition();

  try {
    await loadNaverMaps(config.public.naverMapsClientId);
    if (!window.naver?.maps) throw new Error("naver.maps를 초기화하지 못했습니다.");
  } catch (e: any) {
    mapError.value = e.message || "지도를 불러올 수 없습니다.";
    mapLoading.value = false;
    return;
  }

  if (!mapEl.value) {
    mapLoading.value = false;
    return;
  }

  try {
    // 지도 초기화 (한국 중심)
    map = new (naver().maps.Map)(mapEl.value, {
      center: new (naver().maps.LatLng)(36.5, 127.8),
      zoom: 7,
    });

    // 타일이 처음 그려지면 로딩 오버레이 제거
    naver().maps.Event.addListener(map, "idle", () => {
      mapLoading.value = false;
    });
    // idle 이벤트가 안 오는 환경 대비 타임아웃
    setTimeout(() => (mapLoading.value = false), 8000);

    // 줌 레벨에 따라 마커 크기 자동 조절
    naver().maps.Event.addListener(map, "zoom_changed", () => renderMarkers());
  } catch (e: any) {
    console.error("지도 초기화 실패:", e);
    mapError.value = "지도를 초기화하지 못했습니다.";
    mapLoading.value = false;
    return;
  }

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

// 마커 렌더링 — 내 위치가 있으면 5km 이내만 표시, 줌 아웃 시 지역별 클러스터
const CLUSTER_ZOOM = 9; // 이 이하 줌에서는 개별 마커 대신 권역 클러스터 표시
const CLUSTER_CELL = 0.4; // 클러스터 셀 크기 (도 단위, 약 40km)

interface Cluster {
  lat: number;
  lng: number;
  count: number;
  items: MapContent[];
}

const clusterItems = (items: MapContent[]): Cluster[] => {
  const map = new Map<string, Cluster>();
  for (const item of items) {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;
    const key = `${Math.round(lat / CLUSTER_CELL)}:${Math.round(lng / CLUSTER_CELL)}`;
    let c = map.get(key);
    if (!c) {
      c = { lat: 0, lng: 0, count: 0, items: [] };
      map.set(key, c);
    }
    c.lat += lat;
    c.lng += lng;
    c.count += 1;
    c.items.push(item);
  }
  return [...map.values()].map((c) => ({
    ...c,
    lat: c.lat / c.count,
    lng: c.lng / c.count,
  }));
};

// 마커 아래에 상시 표시되는 제목 라벨 (줌 충분히 확대 + 마커 적을 때만)
const LABEL_ZOOM = 12;
const LABEL_MAX_ITEMS = 25;

// naver.maps 로드 후에만 호출 — OverlayView를 호출 시점에 상속
const createLabelOverlay = (latlng: any, text: string) => {
  const Base = (window.naver as any).maps.OverlayView;
  class LabelOverlay extends Base {
    private el: HTMLElement;
    private latlng: any;
    constructor(l: any, t: string) {
      super();
      this.latlng = l;
      this.el = document.createElement("div");
      this.el.textContent = t;
      this.el.style.cssText =
        "position:absolute;transform:translate(-50%,0);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
        "background:rgba(255,255,255,.94);border:1px solid rgba(15,23,42,.15);border-radius:999px;" +
        "padding:3px 10px;font-size:12px;font-weight:600;color:#1e293b;box-shadow:0 1px 4px rgba(0,0,0,.18);pointer-events:none;";
    }
    onAdd() {
      this.getPanes().overlayLayer.appendChild(this.el);
    }
    draw() {
      const point = this.getProjection().fromCoordToOffset(this.latlng);
      this.el.style.left = `${Math.round(point.x)}px`;
      this.el.style.top = `${Math.round(point.y) + 8}px`;
    }
    onRemove() {
      this.el.remove();
    }
  }
  return new LabelOverlay(latlng, text);
};

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
  const zoom = map.getZoom() ?? 10;

  if (zoom <= CLUSTER_ZOOM && items.length > 0) {
    // 줌 아웃: 권역별 클러스터 마커 (개수 표시)
    for (const c of clusterItems(items)) {
      const size = Math.min(64, 34 + Math.round(Math.log2(c.count + 1) * 8));
      const marker = new (naver().maps.Marker)({
        map,
        position: new (naver().maps.LatLng)(c.lat, c.lng),
        icon: {
          content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#4f46e5;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${Math.max(12, size / 3)}px">${c.count}</div>`,
          anchor: new (naver().maps.Point)(size / 2, size / 2),
        },
      });
      overlays.push(marker);

      addMarkerClickListener(marker, () => {
        map.setCenter(new (naver().maps.LatLng)(c.lat, c.lng));
        map.setZoom(CLUSTER_ZOOM + 2);
      });

      minLat = Math.min(minLat, c.lat);
      maxLat = Math.max(maxLat, c.lat);
      minLng = Math.min(minLng, c.lng);
      maxLng = Math.max(maxLng, c.lng);
    }
  } else {
    // 줌 인: 개별 마커 — 충분히 확대되고 마커가 적으면 제목 라벨 상시 표시
    const showLabels = zoom >= LABEL_ZOOM && items.length <= LABEL_MAX_ITEMS;
    for (const item of items) {
      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      if (isNaN(lat) || isNaN(lng)) continue;

      const w = markerSize();
      const h = Math.round(w * 1.34);
      const marker = new (naver().maps.Marker)({
        map,
        position: new (naver().maps.LatLng)(lat, lng),
        title: item.title,
        icon: {
          content: pinIcon("#f59e0b", w, h),
          anchor: new (naver().maps.Point)(w / 2, h),
        },
      });
      overlays.push(marker);
      if (showLabels) {
        const label = createLabelOverlay(
          new (naver().maps.LatLng)(lat, lng),
          item.title,
        );
        label.setMap(map);
        overlays.push(label);
      }

      // 클릭 시 카드형 정보창
      addMarkerClickListener(marker, () => {
        const dateStr = item.eventDate
          ? new Date(item.eventDate).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "";
        infoWindow.setContent(
          `<div style="width:270px;padding:14px 16px 16px;font-family:inherit;line-height:1.5">
<div style="font-size:17px;font-weight:700;color:#1e293b;margin-bottom:6px;word-break:keep-all">${escapeHtml(item.title)}</div>
${item.location ? `<div style="font-size:14px;color:#475569;margin-bottom:4px;word-break:keep-all">📍 ${escapeHtml(item.location)}</div>` : ""}
${dateStr ? `<div style="display:inline-block;font-size:13px;font-weight:600;color:#0369a1;background:#e0f2fe;border-radius:999px;padding:3px 10px;margin-top:2px">${dateStr}</div>` : ""}
<a href="/culture/${item.id}" style="display:block;margin-top:12px;text-align:center;font-size:15px;font-weight:700;color:#fff;background:#1d4ed8;border-radius:10px;padding:9px 0;text-decoration:none">${escapeHtml(t("culture.viewDetail"))} →</a>
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
  }

  // 저장된 내 위치가 있으면 마커 추가
  if (geoPosition.value) {
    addUserMarker(geoPosition.value.latitude, geoPosition.value.longitude);
    minLat = Math.min(minLat, geoPosition.value.latitude);
    maxLat = Math.max(maxLat, geoPosition.value.latitude);
    minLng = Math.min(minLng, geoPosition.value.longitude);
    maxLng = Math.max(maxLng, geoPosition.value.longitude);
  }

  if (center && items.length > 0 && zoom > CLUSTER_ZOOM) {
    // 중심(검색 지역/내 위치)이 바뀐 경우에만 재중심 — 줌 변경 시 되돌리지 않음
    const c: any = center;
    const centerKey = `${c.latitude ?? c.lat},${c.longitude ?? c.lng}`;
    if (centerKey !== lastCenterKey) {
      lastCenterKey = centerKey;
      const latlng = new (naver().maps.LatLng)(
        c.latitude ?? c.lat,
        c.longitude ?? c.lng,
      );
      map.setCenter(latlng);
      map.setZoom(searchCenter.value ? 12 : 13);
    }
  } else if (items.length > 0 && !center && !didFitBounds) {
    didFitBounds = true;
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
