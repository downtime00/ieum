<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-2xl font-bold text-slate-800">
          {{ $t("taxi.title") }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 text-3xl leading-none px-3"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      <p class="text-base text-slate-500 mb-6">{{ $t("taxi.note") }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          v-for="svc in visibleTaxiServices"
          :key="svc.tel"
          :href="`tel:${svc.tel}`"
          class="relative rounded-2xl py-5 px-4 text-center transition"
          :class="[svc.cls, isMyTaxi(svc) && 'ring-4 ring-white/70']"
        >
          <span
            v-if="isMyTaxi(svc)"
            class="absolute -top-2.5 left-1/2 -translate-x-1/2 text-sm font-bold bg-white text-slate-800 px-3 py-1 rounded-full whitespace-nowrap shadow"
            >{{ $t("taxi.myRegion") }}</span
          >
          <span class="block text-white font-bold text-xl leading-tight">{{
            $t(svc.nameKey)
          }}</span>
          <span class="block text-white/95 text-lg font-semibold mt-1.5">{{
            svc.display
          }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>();
defineEmits<{ close: [] }>();

const { t } = useI18n();
const { position: geoPosition, loadStoredPosition } = useGeolocation();

// 지역별 콜택시 대표번호
const taxiServices = [
  { nameKey: "taxi.nationwide", tel: "02114", display: "02-114", cls: "bg-sky-500 hover:bg-sky-400" },
  { nameKey: "taxi.seoul", tel: "15884388", display: "1588-4388", cls: "bg-sky-700 hover:bg-sky-600" },
  { nameKey: "taxi.gyeonggi", tel: "16660420", display: "1666-0420", cls: "bg-emerald-600 hover:bg-emerald-500" },
  { nameKey: "taxi.incheon", tel: "15770320", display: "1577-0320", cls: "bg-amber-500 hover:bg-amber-400" },
  { nameKey: "taxi.gangwon", tel: "15772014", display: "1577-2014", cls: "bg-teal-600 hover:bg-teal-500" },
  { nameKey: "taxi.busan", tel: "15551114", display: "1555-1114", cls: "bg-rose-600 hover:bg-rose-500" },
  { nameKey: "taxi.chungbuk", tel: "15330220", display: "1533-0220", cls: "bg-violet-600 hover:bg-violet-500" },
  { nameKey: "taxi.chungnam", tel: "16445588", display: "1644-5588", cls: "bg-indigo-600 hover:bg-indigo-500" },
  { nameKey: "taxi.daegu", tel: "15776776", display: "1577-6776", cls: "bg-cyan-600 hover:bg-cyan-500" },
  { nameKey: "taxi.jeonbuk", tel: "0632270002", display: "063-227-0002", cls: "bg-orange-600 hover:bg-orange-500" },
  { nameKey: "taxi.jeonnam", tel: "18991110", display: "1899-1110", cls: "bg-lime-600 hover:bg-lime-500" },
  { nameKey: "taxi.daejeon", tel: "0426121050", display: "042-612-1050", cls: "bg-fuchsia-600 hover:bg-fuchsia-500" },
  { nameKey: "taxi.sejong", tel: "18999042", display: "1899-9042", cls: "bg-pink-600 hover:bg-pink-500" },
  { nameKey: "taxi.gyeongbuk", tel: "18997770", display: "1899-7770", cls: "bg-blue-700 hover:bg-blue-600" },
  { nameKey: "taxi.gyeongnam", tel: "15664488", display: "1566-4488", cls: "bg-red-600 hover:bg-red-500" },
  { nameKey: "taxi.gwangju", tel: "16682222", display: "1668-2222", cls: "bg-yellow-600 hover:bg-yellow-500" },
  { nameKey: "taxi.ulsan", tel: "0522928253", display: "052-292-8253", cls: "bg-stone-600 hover:bg-stone-500" },
  { nameKey: "taxi.jeju", tel: "18996888", display: "1899-6888", cls: "bg-slate-700 hover:bg-slate-600" },
];

// 내 위치 기준 지역 콜택시 자동 선택 (역지오코딩)
const taxiRegionKey = ref<string | null>(null);

const normRegion = (s: string) =>
  s
    .replace(/[\s()]/g, "")
    .replace(/(특별자치도|특별자치시|특별시|광역시|도|시)+$/, "");

// API가 구 명칭(전라북도 등)을 반환할 때 대비 별칭
const REGION_ALIASES: Record<string, string[]> = {
  jeonbuk: ["전라북"],
  jeonnam: ["전라남"],
  chungbuk: ["충북"],
  chungnam: ["충남"],
  gyeongbuk: ["경북"],
  gyeongnam: ["경남"],
};

const isMyTaxi = (svc: (typeof taxiServices)[number]) =>
  taxiRegionKey.value != null && svc.nameKey === `taxi.${taxiRegionKey.value}`;

// 전국(114) + 내 지역 2개만 표시
const visibleTaxiServices = computed(() => {
  const nationwide = taxiServices.filter((s) => s.nameKey === "taxi.nationwide");
  const mine = taxiServices.filter(isMyTaxi);
  return [...nationwide, ...mine];
});

const detectTaxiRegion = async () => {
  const pos = geoPosition.value;
  if (!pos || taxiRegionKey.value) return;
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.latitude}&longitude=${pos.longitude}&localityLanguage=ko`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const target = normRegion(String(data.principalSubdivision || data.city || ""));
    if (!target) return;
    for (const svc of taxiServices) {
      const key = svc.nameKey.replace("taxi.", "");
      const names = [normRegion(t(svc.nameKey)), ...(REGION_ALIASES[key] || [])];
      if (names.includes(target)) {
        taxiRegionKey.value = key;
        return;
      }
    }
  } catch {
    /* 위치→지역 변환 실패 시 전체 목록 그대로 */
  }
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      loadStoredPosition();
      detectTaxiRegion();
    }
  },
);
</script>
