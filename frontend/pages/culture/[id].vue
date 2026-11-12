<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
      <div v-if="loading" class="text-center py-16 text-white/50 text-lg">
        {{ $t("culture.loading") }}
      </div>

      <div v-else-if="error" class="text-center py-16 text-red-300">
        {{ error }}
      </div>

      <article
        v-else-if="item"
        class="bg-white/10 rounded-2xl overflow-hidden"
      >
        <img
          v-if="item.thumbnailUrl"
          :src="item.thumbnailUrl"
          :alt="item.title"
          class="w-full h-64 object-cover bg-white/10"
        />
        <div class="p-6 sm:p-8">
          <h1 class="text-2xl font-bold text-white leading-snug break-words mb-3">
            {{ item.title }}
          </h1>
          <div class="flex flex-wrap gap-2 mb-4">
            <span
              v-if="isFree"
              class="bg-emerald-400/30 text-emerald-200 text-sm font-bold px-3 py-1.5 rounded-full"
            >
              {{ $t("culture.free") }}
            </span>
            <span
              v-if="item.categoryCd"
              class="bg-sky-400/30 text-sky-200 text-sm font-semibold px-3 py-1.5 rounded-full"
            >
              {{ item.categoryCd }}
            </span>
          </div>

          <dl class="space-y-3 text-white/80">
            <div v-if="item.location" class="flex gap-3">
              <dt class="w-20 flex-shrink-0 font-semibold text-white/50">
                {{ $t("culture.location") }}
              </dt>
              <dd>{{ item.location }}</dd>
            </div>
            <div v-if="item.eventDate" class="flex gap-3">
              <dt class="w-20 flex-shrink-0 font-semibold text-white/50">
                {{ $t("culture.date") }}
              </dt>
              <dd>{{ formatDate(item.eventDate) }}</dd>
            </div>
            <div v-if="item.detail?.price" class="flex gap-3">
              <dt class="w-20 flex-shrink-0 font-semibold text-white/50">
                {{ $t("culture.price") }}
              </dt>
              <dd>{{ item.detail.price }}</dd>
            </div>
            <div v-if="item.detail?.phone" class="flex gap-3">
              <dt class="w-20 flex-shrink-0 font-semibold text-white/50">
                {{ $t("culture.phone") }}
              </dt>
              <dd>
                <a
                  :href="`tel:${item.detail.phone.replace(/[^0-9+]/g, '')}`"
                  class="text-sky-300 font-semibold hover:underline"
                >
                  {{ item.detail.phone }}
                </a>
              </dd>
            </div>
            <div v-if="item.detail?.address" class="flex gap-3">
              <dt class="w-20 flex-shrink-0 font-semibold text-white/50">
                {{ $t("culture.address") }}
              </dt>
              <dd>{{ item.detail.address }}</dd>
            </div>
            <div v-if="item.detail?.placeUrl" class="flex gap-3">
              <dt class="w-20 flex-shrink-0 font-semibold text-white/50">
                {{ $t("culture.placeInfo") }}
              </dt>
              <dd>
                <a
                  :href="item.detail.placeUrl"
                  target="_blank"
                  rel="noopener"
                  class="text-sky-300 font-semibold hover:underline"
                >
                  {{ $t("culture.placeInfo") }} →
                </a>
              </dd>
            </div>
            <div v-if="cleanDescription" class="flex gap-3">
              <dt class="w-20 flex-shrink-0 font-semibold text-white/50">
                {{ $t("culture.description") }}
              </dt>
              <dd class="whitespace-pre-line">{{ cleanDescription }}</dd>
            </div>
          </dl>

          <!-- 위치 지도 -->
          <div v-if="hasLocation || mapError" class="mt-6">
            <h3 class="font-semibold text-white mb-2">
              {{ $t("culture.mapTitle") }}
            </h3>
            <p v-if="mapError" class="text-sm text-amber-300">{{ mapError }}</p>
            <div class="relative">
              <div
                ref="mapEl"
                class="w-full h-72 sm:h-96 rounded-xl overflow-hidden"
              ></div>
              <!-- 큰 줌 버튼 -->
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
          </div>

          <div class="mt-8 flex gap-3">
            <a
              v-if="item.contentUrl"
              :href="item.contentUrl"
              target="_blank"
              rel="noopener"
              class="bg-sky-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-sky-400 transition"
            >
              {{ $t("culture.detail") }} →
            </a>
            <a
              v-if="naverDirectionsUrl"
              :href="naverDirectionsUrl"
              target="_blank"
              rel="noopener"
              class="bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-emerald-400 transition"
            >
              {{ $t("culture.directions") }}
            </a>
          </div>
        </div>
      </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadNaverMaps } from "~/utils/naver-maps";

const route = useRoute();
const config = useRuntimeConfig();
const { t } = useI18n();

declare global {
  interface Window {
    naver: any;
  }
}

interface ContentItem {
  id: number;
  title: string;
  description?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  categoryCd?: string;
  areaCode?: string;
  location?: string;
  eventDate?: string;
  latitude?: number | null;
  longitude?: number | null;
  detail?: {
    price?: string;
    phone?: string;
    address?: string;
    placeUrl?: string;
    locationName?: string;
    thumbnail?: string;
    url?: string;
  };
}

const item = ref<ContentItem | null>(null);
const loading = ref(true);
const error = ref("");

const mapEl = ref<HTMLElement | null>(null);
const mapError = ref("");
let map: any = null;

const hasLocation = computed(() => {
  const lat = Number(item.value?.latitude);
  const lng = Number(item.value?.longitude);
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    item.value?.latitude != null &&
    item.value?.longitude != null
  );
});

// 네이버 지도 길찾기 — 내 위치가 저장되어 있으면 출발지를 내 위치로 지정
const { position: geoPosition, loadStoredPosition } = useGeolocation();

const naverDirectionsUrl = computed(() => {
  if (!hasLocation.value) return "";
  const lat = Number(item.value!.latitude);
  const lng = Number(item.value!.longitude);
  const name = encodeURIComponent(
    item.value!.title || item.value!.location || "",
  );
  const base = `https://map.naver.com/index.nhn?elng=${lng}&elat=${lat}&etext=${name}&menu=route&pathType=1`;
  const pos = geoPosition.value;
  if (pos) {
    return `https://map.naver.com/index.nhn?slat=${pos.latitude}&slng=${pos.longitude}&stext=${encodeURIComponent("내 위치")}&elng=${lng}&elat=${lat}&etext=${name}&menu=route&pathType=1`;
  }
  return base;
});

const initMap = async () => {
  if (!hasLocation.value || !mapEl.value || map) return;
  try {
    await loadNaverMaps(config.public.naverMapsClientId);
  } catch (e: any) {
    mapError.value = e.message || "지도를 불러올 수 없습니다.";
    return;
  }

  const lat = Number(item.value!.latitude);
  const lng = Number(item.value!.longitude);
  if (isNaN(lat) || isNaN(lng)) return;
  const naver = window.naver;

  map = new naver.maps.Map(mapEl.value, {
    center: new naver.maps.LatLng(lat, lng),
    zoom: 16,
  });

  // 화면 좌표계 원형 마커 (지리 좌표 Circle는 세로로 늘어나는 문제 방지)
  const size = 36;
  const marker = new naver.maps.Marker({
    map,
    position: new naver.maps.LatLng(lat, lng),
    icon: {
      content: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#dc2626;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);box-sizing:border-box"></div>`,
      anchor: new naver.maps.Point(size / 2, size / 2),
    },
  });

  const infoWindow = new naver.maps.InfoWindow({
    content: `<div style="width:240px;padding:8px;word-break:keep-all;line-height:1.5"><b style="font-size:17px">${item.value!.title}</b><br/>${item.value!.location || ""}</div>`,
  });
  infoWindow.setPosition(new naver.maps.LatLng(lat, lng));
  naver.maps.Event.addListener(marker, "click", () => infoWindow.open(map));
  // 레이아웃 확정 후 크기 재계산 + InfoWindow 표시 (즉시 open 시 insertBefore 오류 가능)
  setTimeout(() => {
    try {
      map?.refresh?.();
      infoWindow.open(map);
    } catch {
      // InfoWindow 표시 실패는 무시 (마커 클릭으로 다시 열 수 있음)
    }
  }, 400);
};

const isFree = computed(() => {
  const price = item.value?.detail?.price;
  if (!price) return false;
  const p = price.replace(/\s/g, "");
  const amounts = [...p.matchAll(/(\d[\d,]*)원/g)].map((m) =>
    parseInt(m[1].replace(/,/g, ""), 10),
  );
  if (amounts.some((n) => n > 0)) return false;
  return p.includes("무료") || amounts.includes(0);
});

const cleanDescription = computed(() => {
  if (!item.value?.description) return "";
  // "[thumbnail] url" 형태의 내부 메모는 표시하지 않음
  return item.value.description.replace(/^\[thumbnail\]\s*\S+\s*/i, "").trim();
});

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

onMounted(async () => {
  loadStoredPosition();
  try {
    const res = await fetch(
      `${config.public.apiBase}/contents/${route.params.id}/detail`,
    );
    if (!res.ok) throw new Error("not found");
    item.value = await res.json();
    loading.value = false;
  } catch (e) {
    console.error("[detail] load failed:", e);
    error.value = t("culture.notFound");
    loading.value = false;
    return;
  }
  await nextTick();
  try {
    await initMap();
  } catch (e: any) {
    mapError.value = e?.message || "지도를 불러올 수 없습니다.";
  }
});

onBeforeUnmount(() => {
  map = null;
});
</script>
