<template>
  <div class="min-h-screen book-bg" :class="{ 'pb-28': showHomeFab }">
    <!-- 책 양쪽 페이지 가장자리 장식 -->
    <div class="book-edge book-edge-left" aria-hidden="true"></div>
    <div class="book-edge book-edge-right" aria-hidden="true"></div>

    <Transition name="page" mode="out-in">
      <NuxtPage />
    </Transition>

    <!-- 하단 플로팅 처음으로 버튼 (스크롤해도 항상 표시) -->
    <div
      v-if="showHomeFab"
      class="fixed left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2"
      style="bottom: max(1.5rem, env(safe-area-inset-bottom))"
    >
      <NuxtLink
        v-if="contextTarget"
        :to="contextTarget"
        class="inline-flex items-center gap-2 bg-white text-slate-700 border border-slate-200 font-bold py-2.5 px-6 rounded-full hover:bg-stone-50 transition text-base shadow-lg active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-5 h-5"
          aria-hidden="true"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        {{ t("culture.backToListShort") }}
      </NuxtLink>
      <NuxtLink
        :to="homeTarget"
        class="inline-flex items-center gap-2 bg-blue-800 text-white font-bold py-3.5 px-8 rounded-full hover:bg-blue-900 transition text-lg shadow-lg active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="w-6 h-6"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        {{ t("medications.backToDashboard") }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// 하단 플로팅 처음으로 버튼 — 로그인/시작 화면을 제외한 모든 페이지에 표시
const showHomeFab = computed(
  () => route.path !== "/" && route.path !== "/dashboard",
);
const homeTarget = computed(() =>
  route.path.startsWith("/admin") ? "/admin/dashboard" : "/dashboard",
);
// 문화 상세/지도에서는 목록으로 가는 보조 버튼도 함께 표시
const contextTarget = computed(() =>
  route.path === "/culture/map" || route.path.startsWith("/culture/")
    ? "/culture"
    : null,
);

// 페이지 간 이동 시 스크롤 위치 기억 — 목록→상세→목록 복귀 시 원래 위치 유지
const scrollPositions = useState<Record<string, number>>(
  "scrollPositions",
  () => ({}),
);

router.beforeEach((to, from) => {
  if (import.meta.client && from.fullPath) {
    scrollPositions.value[from.fullPath] = window.scrollY;
  }
});

router.afterEach((to) => {
  if (!import.meta.client) return;
  const y = scrollPositions.value[to.fullPath];
  if (y == null) return;
  delete scrollPositions.value[to.fullPath];
  // 콘텐츠 비동기 로딩 후 높이가 잡히므로 여러 시점에 복원 시도
  nextTick(() => {
    requestAnimationFrame(() => window.scrollTo(0, y));
    setTimeout(() => window.scrollTo(0, y), 300);
    setTimeout(() => window.scrollTo(0, y), 1000);
  });
});

useHead({
  htmlAttrs: {
    lang: "ko",
  },
});

// 음성 안내: 탭/키보드 포커스가 이동할 때 해당 요소의 이름을 읽어줌 (스크린리더처럼 동작)
const { enabled: voiceOn, speak: speakText } = useSpeech();

const announceFocus = (e: FocusEvent) => {
  if (!voiceOn.value || !import.meta.client) return;
  const el = e.target as HTMLElement | null;
  if (!el || el === document.body || el === document.documentElement) return;
  const label =
    el.getAttribute("aria-label") ||
    el.getAttribute("placeholder") ||
    (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 80) ||
    el.getAttribute("title") ||
    "";
  if (label) speakText(label);
};

onMounted(() => {
  document.addEventListener("focusin", announceFocus);
});
onUnmounted(() => {
  document.removeEventListener("focusin", announceFocus);
});
</script>
