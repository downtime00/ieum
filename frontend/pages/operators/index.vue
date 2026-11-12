<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
        <!-- 헤더 -->
        <div class="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h1 class="text-2xl font-bold text-white">공영자·복지기관</h1>
            <p class="text-sm text-white/60 mt-1">
              행복복지센터, 실버타운, 노인회관 등의 공연·강의·체험 프로그램을
              예약하고 신청할 수 있습니다.
            </p>
          </div>
          <div class="flex gap-2">
            <NuxtLink
              v-if="isOperator"
              to="/operator"
              class="bg-emerald-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-emerald-500 transition text-sm"
            >
              기관 관리
            </NuxtLink>
            <NuxtLink
              to="/operators/register"
              class="bg-blue-800 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-900 transition text-sm"
            >
              기관 등록
            </NuxtLink>
          </div>
        </div>

        <!-- 검색/필터 -->
        <div class="flex gap-2 mb-5">
          <input
            v-model="keyword"
            type="text"
            placeholder="기관명, 지역, 소개 검색"
            class="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-base focus:outline-none focus:border-sky-400"
            @keyup.enter="fetchOperators"
          />
          <select
            v-model="orgType"
            class="bg-white/10 border border-white/20 rounded-xl px-3 py-3 text-white text-base focus:outline-none"
            @change="fetchOperators"
          >
            <option value="">전체 유형</option>
            <option v-for="t in orgTypes" :key="t" :value="t">{{ t }}</option>
          </select>
          <button
            @click="fetchOperators"
            class="bg-sky-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-sky-400 transition whitespace-nowrap"
          >
            검색
          </button>
        </div>

        <!-- 목록 -->
        <div v-if="loading" class="text-center py-16 text-white/50 text-lg">
          불러오는 중...
        </div>
        <div
          v-else-if="operators.length === 0"
          class="text-center py-16 text-white/50 text-lg"
        >
          등록된 기관이 없습니다.
        </div>
        <div v-else class="space-y-3">
          <NuxtLink
            v-for="op in operators"
            :key="op.id"
            :to="`/operators/${op.id}`"
            class="block bg-white/10 hover:bg-white/15 rounded-2xl p-5 transition"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-lg font-bold text-white">{{ op.name }}</h2>
                  <span
                    class="bg-sky-400/30 text-sky-200 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    {{ op.orgType }}
                  </span>
                  <span
                    v-if="op.reviewCount"
                    class="bg-amber-400/30 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full"
                  >
                    ★ {{ op.avgRating }} ({{ op.reviewCount }})
                  </span>
                </div>
                <p v-if="op.address" class="text-sm text-white/60 mt-1">
                  📍 {{ op.address }}
                </p>
                <p
                  v-if="op.description"
                  class="text-sm text-white/70 mt-2 line-clamp-2"
                >
                  {{ op.description }}
                </p>
              </div>
              <span class="text-white/40 text-lg flex-shrink-0">›</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

interface Operator {
  id: string;
  name: string;
  orgType: string;
  address: string | null;
  description: string | null;
  status: string;
  avgRating?: number | null;
  reviewCount?: number;
}

const orgTypes = ["행복복지센터", "실버타운", "노인회관", "복지관", "요양보호사", "간병인", "기타"];
const operators = ref<Operator[]>([]);
const loading = ref(false);
const keyword = ref("");
const orgType = ref("");
const isOperator = ref(false);

const getUserId = (): number | null => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
};

const fetchOperators = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (keyword.value.trim()) params.set("keyword", keyword.value.trim());
    if (orgType.value) params.set("type", orgType.value);
    const res = await fetch(
      `${config.public.apiBase}/operators?${params.toString()}`,
    );
    operators.value = res.ok ? await res.json() : [];
  } catch {
    operators.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  fetchOperators();
  const uid = getUserId();
  if (uid) {
    try {
      const res = await fetch(
        `${config.public.apiBase}/operators/me/${uid}`,
      );
      isOperator.value = res.ok && !!(await res.json());
    } catch {}
  }
});
</script>
