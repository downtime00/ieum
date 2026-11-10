<template>
  <div class="bg-stone-50">
    <div class="container mx-auto px-4 py-6">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
      <div class="flex items-center justify-end gap-2 mb-4">
        <div class="flex gap-2 shrink-0">
          <button
            @click="showSearch = !showSearch"
            :class="
              showSearch || activeFilterCount > 0
                ? 'bg-white text-slate-900 border-white'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            "
            class="font-semibold py-2.5 px-5 rounded-xl border transition text-sm relative"
          >
            {{ $t("culture.search") }}
            <span
              v-if="activeFilterCount > 0"
              class="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
              >{{ activeFilterCount }}</span
            >
          </button>
          <NuxtLink
            to="/culture/map"
            class="bg-sky-500 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-sky-400 transition text-sm"
          >
            {{ $t("culture.mapTitle") }}
          </NuxtLink>
        </div>
      </div>

      <!-- 검색 + 조건 (접었다가 버튼으로 펼침, 스크롤 시 상단 고정) -->
      <div
        v-show="showSearch"
        class="bg-white/10 rounded-2xl p-4 mb-4 md:sticky md:top-3 md:z-30 max-h-[70vh] overflow-y-auto"
      >
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="keyword"
            type="text"
            class="flex-1 px-5 py-3.5 border border-white/20 bg-white/10 text-white placeholder-white/40 rounded-xl text-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            :placeholder="$t('culture.searchPlaceholder')"
            @keyup.enter="search"
          />
          <button
            @click="search"
            :disabled="loading"
            class="bg-sky-500 text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-sky-400 transition text-lg disabled:bg-white/20"
          >
            {{ loading ? $t("common.loading") : $t("culture.search") }}
          </button>
          <div class="flex gap-2 flex-wrap">
            <button
              v-if="geoPosition"
              @click="setSort('distance')"
              :class="
                sortBy === 'distance'
                  ? 'bg-sky-500 text-white border-sky-400'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              "
              class="font-semibold py-3.5 px-5 rounded-xl border transition whitespace-nowrap"
            >
              {{ $t("culture.sortNearest") }}
            </button>
            <button
              @click="setSort('date')"
              :class="
                sortBy === 'date'
                  ? 'bg-sky-500 text-white border-sky-400'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              "
              class="font-semibold py-3.5 px-5 rounded-xl border transition whitespace-nowrap"
            >
              {{ $t("culture.sortDate") }}
            </button>
            <button
              @click="setSort('price')"
              :class="
                sortBy === 'price'
                  ? 'bg-sky-500 text-white border-sky-400'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              "
              class="font-semibold py-3.5 px-5 rounded-xl border transition whitespace-nowrap"
            >
              {{ $t("culture.sortPrice") }}
            </button>
          </div>
        </div>

        <!-- 조건 필터 -->
        <div class="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-white/15 items-stretch sm:items-center">
          <select
            v-model="filterCategory"
            @change="applyFilters"
            class="flex-1 px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl text-base focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            :aria-label="$t('culture.filterCategory')"
          >
            <option value="" class="text-slate-900">
              {{ $t("culture.filterCategoryAll") }}
            </option>
            <option
              v-for="cat in categories"
              :key="cat"
              :value="cat"
              class="text-slate-900"
            >
              {{ cat }}
            </option>
          </select>
          <button
            @click="toggleFilter('free')"
            :class="
              filterFree
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            "
            class="font-semibold py-3 px-5 rounded-xl border transition whitespace-nowrap"
          >
            {{ $t("culture.filterFree") }}
          </button>
          <button
            @click="toggleFilter('upcoming')"
            :class="
              filterUpcoming
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            "
            class="font-semibold py-3 px-5 rounded-xl border transition whitespace-nowrap"
          >
            {{ $t("culture.filterUpcoming") }}
          </button>
          <button
            v-if="activeFilterCount > 0"
            @click="resetFilters"
            class="font-semibold py-3 px-5 rounded-xl border border-white/20 bg-white/5 text-white/70 hover:bg-white/15 transition whitespace-nowrap"
          >
            {{ $t("culture.filterReset") }}
          </button>
        </div>
      </div>

      <!-- 결과 -->
      <div
        v-if="loading && items.length === 0"
        class="text-center py-16 text-white/50 text-lg"
      >
        {{ $t("culture.loading") }}
      </div>

      <div
        v-else-if="items.length === 0"
        class="text-center py-16 text-white/50 text-lg"
      >
        {{ $t("culture.empty") }}
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1 pb-4"
      >
        <article
          v-for="(item, idx) in items"
          :key="item.id"
          class="relative overflow-hidden bg-sky-700 hover:bg-sky-600 rounded-2xl p-4 transition cursor-pointer"
          :style="{ animationDelay: `${Math.min(idx, 12) * 60}ms` }"
          @click="goDetail(item.id)"
        >
          <span class="absolute -bottom-3 -right-2 text-6xl opacity-20 select-none pointer-events-none">🎭</span>
          <!-- 상단: 이미지 + 제목/배지 한 줄 -->
          <div class="flex gap-4">
            <img
              v-if="item.thumbnailUrl"
              :src="item.thumbnailUrl"
              :alt="item.title"
              class="w-24 h-24 object-cover rounded-xl flex-shrink-0 bg-white/15"
              loading="lazy"
            />
            <div class="flex-1 min-w-0">
              <NuxtLink
                :to="`/culture/${item.id}`"
                class="hover:text-sky-200 transition block"
              >
                <h3 class="text-base font-semibold text-white leading-snug">
                  <template
                    v-for="(seg, si) in highlightParts(item.title)"
                    :key="si"
                  >
                    <mark v-if="seg.hit">{{ seg.text }}</mark
                    ><template v-else>{{ seg.text }}</template>
                  </template>
                </h3>
              </NuxtLink>
              <div class="flex gap-1.5 mt-1.5">
                <span
                  v-if="freeFlags[item.id] === true"
                  class="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full"
                >
                  {{ $t("culture.free") }}
                </span>
                <span
                  v-if="item.categoryCd"
                  class="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {{ item.categoryCd }}
                </span>
              </div>
            </div>
          </div>
          <!-- 하단: 장소/날짜/링크 전체 폭 -->
          <div class="mt-3">
            <div class="space-y-0.5 text-sm text-white/80">
              <p
                v-if="distanceText(item)"
                class="text-amber-300 font-semibold"
              >
                {{ distanceText(item) }}
              </p>
              <p v-if="item.location">{{ item.location }}</p>
              <p v-if="item.eventDate">{{ formatDate(item.eventDate) }}</p>
            </div>
            <div class="mt-2 flex gap-4">
              <NuxtLink
                :to="`/culture/${item.id}`"
                class="text-white font-semibold hover:text-amber-200 transition text-sm"
              >
                {{ $t("culture.viewDetail") }} →
              </NuxtLink>
              <a
                v-if="item.contentUrl"
                :href="item.contentUrl"
                target="_blank"
                rel="noopener"
                class="text-amber-300 font-semibold hover:underline text-sm"
                @click.stop
              >
                {{ $t("culture.detail") }} →
              </a>
            </div>
          </div>
        </article>
      </div>

      <!-- 로딩/개수 표시 -->
      <div class="py-3 text-center">
        <p v-if="loading" class="text-white/50">{{ $t("culture.loading") }}</p>
        <p
          v-else-if="items.length >= total && items.length > 0"
          class="text-sm text-white/40"
        >
          {{ items.length }} / {{ total }}
        </p>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const { t } = useI18n();

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
}

const keyword = ref("");
const showSearch = ref(false);
const items = ref<ContentItem[]>([]);
const total = ref(0);
const page = ref(1);
// 화면에 보이는 열 수 기준으로 한 번에 가져올 개수 결정 (세로 3줄 분량)
const limit = computed(() => {
  if (!import.meta.client) return 20;
  const cols = Math.max(1, Math.ceil((window.innerWidth - 48) / 300));
  return Math.max(8, cols * 3);
});
const loading = ref(false);
const sortBy = ref<"date" | "distance" | "price">("date");
const freeFlags = ref<Record<number, boolean | null>>({});

// 조건 필터 (검색 패널 안에 통합)
const filterFree = ref(false);
const filterUpcoming = ref(false);
const filterCategory = ref("");
const categories = ref<string[]>([]);
const activeFilterCount = computed(
  () =>
    (filterFree.value ? 1 : 0) +
    (filterUpcoming.value ? 1 : 0) +
    (filterCategory.value ? 1 : 0),
);

const toggleFilter = (kind: "free" | "upcoming") => {
  if (kind === "free") filterFree.value = !filterFree.value;
  else filterUpcoming.value = !filterUpcoming.value;
  applyFilters();
};

const applyFilters = () => fetchContents(true);

const resetFilters = () => {
  filterFree.value = false;
  filterUpcoming.value = false;
  filterCategory.value = "";
  fetchContents(true);
};

const loadCategories = async () => {
  try {
    const res = await fetch(`${config.public.apiBase}/contents/categories`);
    if (res.ok) categories.value = await res.json();
  } catch {}
};

// 목록 캐시: 상세→목록 복귀 시 로딩 없이 즉시 표시 (스크롤 복원도 부드러워짐)
const CACHE_KEY = "cultureListCache";
let justRestored = false;

const saveCache = () => {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        items: items.value.slice(0, 300),
        total: total.value,
        page: page.value,
        keyword: keyword.value,
        sortBy: sortBy.value,
        filterFree: filterFree.value,
        filterUpcoming: filterUpcoming.value,
        filterCategory: filterCategory.value,
      }),
    );
  } catch {}
};

const restoreCache = () => {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (!cached?.items?.length) return false;
    items.value = cached.items;
    total.value = cached.total || 0;
    page.value = cached.page || 1;
    keyword.value = cached.keyword || "";
    sortBy.value = cached.sortBy || "date";
    filterFree.value = !!cached.filterFree;
    filterUpcoming.value = !!cached.filterUpcoming;
    filterCategory.value = cached.filterCategory || "";
    loadFreeFlags(items.value);
    justRestored = true;
    return true;
  } catch {
    return false;
  }
};

// 목록 카드의 무료 여부 조회 (백엔드가 detail2로 판정·저장)
const loadFreeFlags = async (list: ContentItem[]) => {
  const unknown = list.filter((i) => freeFlags.value[i.id] === undefined);
  if (unknown.length === 0) return;
  try {
    const ids = unknown.map((i) => i.id).join(",");
    const res = await fetch(
      `${config.public.apiBase}/contents/free-status?ids=${ids}`,
    );
    if (!res.ok) return;
    const data: { id: number; isFree: boolean | null }[] = await res.json();
    for (const d of data) freeFlags.value[d.id] = d.isFree;
  } catch {}
};

const { position: geoPosition, loadStoredPosition } = useGeolocation();

const setSort = (s: "date" | "distance" | "price") => {
  sortBy.value = s;
  fetchContents(true);
};

// 사용자 위치까지의 거리 계산 (km)
const distanceKm = (item: ContentItem): number | null => {
  if (!geoPosition.value || item.latitude == null || item.longitude == null)
    return null;
  const R = 6371;
  const dLat =
    ((Number(item.latitude) - geoPosition.value.latitude) * Math.PI) / 180;
  const dLng =
    ((Number(item.longitude) - geoPosition.value.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((geoPosition.value.latitude * Math.PI) / 180) *
      Math.cos((Number(item.latitude) * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const distanceText = (item: ContentItem): string => {
  const km = distanceKm(item);
  if (km == null) return "";
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
};

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fetchContents = async (reset = false) => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(reset ? 1 : page.value),
      limit: String(limit.value),
    });
    if (keyword.value) params.set("keyword", keyword.value);
    if (filterFree.value) params.set("free", "true");
    if (filterUpcoming.value) params.set("upcoming", "true");
    if (filterCategory.value) params.set("category", filterCategory.value);
    if (sortBy.value === "distance" && geoPosition.value) {
      params.set("lat", String(geoPosition.value.latitude));
      params.set("lng", String(geoPosition.value.longitude));
      params.set("sort", "distance");
    } else {
      params.set("sort", sortBy.value);
    }

    const res = await fetch(`${config.public.apiBase}/contents?${params}`);
    const data = await res.json();

    if (reset) {
      const fresh = data.items || [];
      if (justRestored && items.value.length > fresh.length) {
        // 캐시된 뒷 페이지를 유지해 스크롤 위치가 안 끊기게 함 (id 중복 제거)
        const seen = new Set(fresh.map((i: ContentItem) => i.id));
        const tail = items.value.filter((i) => !seen.has(i.id));
        items.value = [...fresh, ...tail];
        page.value = Math.max(1, Math.ceil(items.value.length / limit));
      } else {
        items.value = fresh;
        page.value = 1;
      }
      justRestored = false;
    } else {
      items.value = [...items.value, ...(data.items || [])];
    }
    total.value = data.total || 0;
    loadFreeFlags(data.items || []);
    saveCache();
  } catch (e) {
    console.error("문화정보 조회 실패:", e);
  } finally {
    loading.value = false;
  }
};

const router = useRouter();

const goDetail = (id: number) => {
  router.push(`/culture/${id}`);
};

const search = () => fetchContents(true);

// 검색어 강조 — 제목에서 검색 키워드를 mark로 표시 (맥락 단서)
const highlightParts = (text: string) => {
  const kw = keyword.value.trim();
  if (!kw) return [{ text, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  const lower = text.toLowerCase();
  const k = kw.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(k, i);
    if (idx === -1) {
      parts.push({ text: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), hit: false });
    parts.push({ text: text.slice(idx, idx + kw.length), hit: true });
    i = idx + kw.length;
  }
  return parts;
};

// 세로 스크롤이 아래쪽에 가까워지면 다음 페이지 자동 로드
const onWindowScroll = () => {
  if (!import.meta.client || loading.value || items.value.length >= total.value)
    return;
  if (window.scrollY + window.innerHeight * 2 >= document.body.scrollHeight) {
    page.value += 1;
    fetchContents(false);
  }
};

const route = useRoute();

onMounted(() => {
  loadStoredPosition();
  // 캐시된 목록을 먼저 표시 → 스크롤 위치 복원이 부드럽게 동작
  restoreCache();
  // 대시보드 검색창 등에서 넘어온 키워드가 있으면 검색 상태로 표시
  const q = route.query.keyword;
  if (typeof q === "string" && q.trim()) {
    keyword.value = q.trim();
    showSearch.value = true;
  }
  // 저장된 위치가 있으면 기본적으로 가까운 순 정렬
  if (geoPosition.value) sortBy.value = "distance";
  loadCategories();
  fetchContents(true);
  window.addEventListener("scroll", onWindowScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onWindowScroll);
});
</script>
