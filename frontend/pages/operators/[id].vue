<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
        <div v-if="loading" class="text-center py-16 text-white/50 text-lg">
          불러오는 중...
        </div>
        <template v-else-if="operator">
          <!-- 기관 정보 -->
          <div class="mb-6">
            <div class="flex items-center gap-2 flex-wrap mb-2">
              <h1 class="text-2xl font-bold text-white">{{ operator.name }}</h1>
              <span class="bg-sky-400/30 text-sky-200 text-sm font-semibold px-3 py-1 rounded-full">
                {{ operator.orgType }}
              </span>
              <span
                v-if="reviews.count > 0"
                class="bg-amber-400/30 text-amber-200 text-sm font-semibold px-3 py-1 rounded-full"
              >
                ★ {{ reviews.avgRating }} ({{ reviews.count }})
              </span>
            </div>
            <p v-if="operator.address" class="text-white/70">📍 {{ operator.address }}</p>
            <p v-if="operator.phone" class="text-white/70 mt-1">📞 {{ operator.phone }}</p>
            <p v-if="operator.description" class="text-white/80 mt-3 leading-relaxed">
              {{ operator.description }}
            </p>
          </div>

          <!-- 프로그램 목록 -->
          <h2 class="text-lg font-bold text-white mb-3">예정된 프로그램</h2>
          <div v-if="upcomingPrograms.length === 0" class="text-white/50 py-8 text-center">
            예정된 프로그램이 없습니다.
          </div>
          <div v-else class="space-y-3">
            <NuxtLink
              v-for="p in upcomingPrograms"
              :key="p.id"
              :to="`/programs/${p.id}`"
              class="block bg-white/10 hover:bg-white/15 rounded-2xl p-5 transition"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="bg-amber-400/30 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {{ p.category }}
                    </span>
                    <span class="text-white/60 text-sm">
                      {{ formatDate(p.eventDate) }}<span v-if="p.startTime"> {{ p.startTime }}</span>
                    </span>
                  </div>
                  <h3 class="text-base font-bold text-white mt-2">{{ p.title }}</h3>
                  <p class="text-sm text-white/60 mt-1">
                    {{ p.price === 0 ? "무료" : `${p.price.toLocaleString()}원/인` }}
                    · 잔여 {{ p.capacity - p.bookedCount }}석
                  </p>
                </div>
                <span class="text-white/40 text-lg flex-shrink-0">›</span>
              </div>
            </NuxtLink>
          </div>

          <!-- 지난 프로그램 -->
          <template v-if="pastPrograms.length > 0">
            <h2 class="text-lg font-bold text-white mt-8 mb-3">지난 프로그램</h2>
            <div class="space-y-3">
              <div
                v-for="p in pastPrograms"
                :key="p.id"
                class="bg-white/5 rounded-2xl p-5 opacity-70"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="bg-slate-400/30 text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {{ p.category }}
                      </span>
                      <span class="text-white/50 text-sm">
                        {{ formatDate(p.eventDate) }}<span v-if="p.startTime"> {{ p.startTime }}</span>
                      </span>
                      <span class="bg-slate-400/30 text-slate-300 text-xs font-bold px-2 py-1 rounded-full">종료</span>
                    </div>
                    <h3 class="text-base font-bold text-white/80 mt-2">{{ p.title }}</h3>
                    <p class="text-sm text-white/50 mt-1">
                      {{ p.price === 0 ? "무료" : `${p.price.toLocaleString()}원/인` }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 후기 -->
          <div v-if="reviews.items.length > 0" class="mt-8">
            <h2 class="text-lg font-bold text-white mb-3">
              이용자 후기
              <span class="text-sm font-normal text-white/50">(평균 ★{{ reviews.avgRating }}, {{ reviews.count }}개)</span>
            </h2>
            <div class="space-y-3">
              <div
                v-for="r in reviews.items"
                :key="r.id"
                class="bg-white/10 rounded-2xl p-4"
              >
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-amber-300">{{ "★".repeat(r.rating) }}{{ "☆".repeat(5 - r.rating) }}</span>
                  <span class="text-xs text-white/50">{{ r.reviewerName || "이용자" }}</span>
                  <span class="text-xs text-white/40 ml-auto">{{ formatDate(r.createdAt) }}</span>
                </div>
                <p v-if="r.comment" class="text-sm text-white/80 leading-relaxed">{{ r.comment }}</p>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-center py-16 text-red-300">기관을 찾을 수 없습니다.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const route = useRoute();

const operator = ref<any>(null);
const programs = ref<any[]>([]);
const loading = ref(true);

const isPast = (d?: string) => {
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(d) < today;
};
const upcomingPrograms = computed(() => programs.value.filter((p) => !isPast(p.eventDate)));
const pastPrograms = computed(() => programs.value.filter((p) => isPast(p.eventDate)));
const reviews = ref<{ items: any[]; avgRating: number | null; count: number }>({
  items: [],
  avgRating: null,
  count: 0,
});

const formatDate = (d?: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

onMounted(async () => {
  try {
    const res = await fetch(`${config.public.apiBase}/operators/${route.params.id}`);
    operator.value = res.ok ? await res.json() : null;
    const pres = await fetch(
      `${config.public.apiBase}/operators/${route.params.id}/programs`,
    );
    programs.value = pres.ok ? await pres.json() : [];
    const rres = await fetch(`${config.public.apiBase}/operators/${route.params.id}/reviews`);
    if (rres.ok) {
      const rdata = await rres.json();
      reviews.value = rdata || reviews.value;
    }
  } finally {
    loading.value = false;
  }
});
</script>
