<template>
  <div class="min-h-screen bg-stone-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <div class="bg-white rounded-xl shadow-md p-8">
        <h1 class="text-3xl font-bold mb-8">로그 히스토리</h1>

        <!-- 필터 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >로그 레벨</label
            >
            <select
              v-model="filters.level"
              class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
            >
              <option value="">전체</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >컨텍스트</label
            >
            <input
              v-model="filters.context"
              type="text"
              class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
              placeholder="검색어"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >시작일</label
            >
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >종료일</label
            >
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
            />
          </div>
        </div>

        <button
          @click="loadLogs"
          class="w-full bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-900 transition-colors mb-6"
        >
          검색
        </button>

        <!-- 통계 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-red-50 p-4 rounded-xl">
            <h3 class="text-lg font-semibold text-red-700">Error</h3>
            <p class="text-2xl font-bold text-red-900">
              {{ stats.error || 0 }}
            </p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-xl">
            <h3 class="text-lg font-semibold text-yellow-700">Warning</h3>
            <p class="text-2xl font-bold text-yellow-900">
              {{ stats.warn || 0 }}
            </p>
          </div>
          <div class="bg-blue-50 p-4 rounded-xl">
            <h3 class="text-lg font-semibold text-blue-700">Info</h3>
            <p class="text-2xl font-bold text-blue-900">
              {{ stats.info || 0 }}
            </p>
          </div>
          <div class="bg-stone-50 p-4 rounded-xl">
            <h3 class="text-lg font-semibold text-slate-700">Debug</h3>
            <p class="text-2xl font-bold text-slate-900">
              {{ stats.debug || 0 }}
            </p>
          </div>
        </div>

        <!-- 로그 목록 -->
        <div v-if="loading" class="text-center py-8">
          <p class="text-slate-600">로딩 중...</p>
        </div>

        <div v-else-if="logs.length === 0" class="text-center py-8">
          <p class="text-slate-600">로그가 없습니다.</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="log in logs"
            :key="log.id"
            class="p-4 border rounded-xl hover:bg-stone-50 cursor-pointer"
            :class="{
              'border-red-300 bg-red-50': log.level === 'error',
              'border-yellow-300 bg-yellow-50': log.level === 'warn',
              'border-blue-400 bg-blue-50': log.level === 'info',
              'border-slate-300': log.level === 'debug',
            }"
            @click="selectedLog = log"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="px-2 py-1 text-xs font-semibold rounded"
                    :class="{
                      'bg-red-100 text-red-800': log.level === 'error',
                      'bg-yellow-100 text-yellow-800': log.level === 'warn',
                      'bg-blue-100 text-blue-800': log.level === 'info',
                      'bg-slate-100 text-slate-800': log.level === 'debug',
                    }"
                  >
                    {{ log.level.toUpperCase() }}
                  </span>
                  <span class="text-sm text-slate-600">{{
                    log.context || "App"
                  }}</span>
                  <span class="text-sm text-slate-500">{{
                    formatDate(log.createdAt)
                  }}</span>
                </div>
                <p class="text-slate-800">{{ log.message }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="
              currentPage = page;
              loadLogs();
            "
            class="px-4 py-2 rounded-xl"
            :class="
              currentPage === page
                ? 'bg-blue-800 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            "
          >
            {{ page }}
          </button>
        </div>

        <!-- 로그 상세 모달 -->
        <div
          v-if="selectedLog"
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          @click="selectedLog = null"
        >
          <div
            class="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            @click.stop
          >
            <h2 class="text-2xl font-bold mb-4">로그 상세</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >ID</label
                >
                <p class="text-slate-900">{{ selectedLog.id }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >레벨</label
                >
                <p class="text-slate-900">{{ selectedLog.level }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >컨텍스트</label
                >
                <p class="text-slate-900">{{ selectedLog.context || "-" }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >메시지</label
                >
                <p class="text-slate-900">{{ selectedLog.message }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700"
                  >생성일</label
                >
                <p class="text-slate-900">
                  {{ formatDate(selectedLog.createdAt) }}
                </p>
              </div>
              <div v-if="selectedLog.meta">
                <label class="block text-sm font-medium text-slate-700"
                  >메타데이터</label
                >
                <pre class="bg-slate-100 p-4 rounded-xl overflow-x-auto">{{
                  JSON.stringify(selectedLog.meta, null, 2)
                }}</pre>
              </div>
              <div v-if="selectedLog.userId">
                <label class="block text-sm font-medium text-slate-700"
                  >사용자 ID</label
                >
                <p class="text-slate-900">{{ selectedLog.userId }}</p>
              </div>
              <div v-if="selectedLog.ip">
                <label class="block text-sm font-medium text-slate-700"
                  >IP</label
                >
                <p class="text-slate-900">{{ selectedLog.ip }}</p>
              </div>
            </div>
            <button
              @click="selectedLog = null"
              class="mt-6 w-full bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const filters = ref({
  level: "",
  context: "",
  startDate: "",
  endDate: "",
});

const logs = ref([]);
const stats = ref({});
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const selectedLog = ref(null);

const loadLogs = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      ...Object.fromEntries(
        Object.entries(filters.value).filter(([_, v]) => v !== ""),
      ),
    });

    const response = await fetch(`${config.public.apiBase}/logs?${params}`);
    const data = await response.json();

    logs.value = data.items;
    totalPages.value = data.totalPages;
  } catch (error) {
    console.error("로그 로딩 실패:", error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await fetch(`${config.public.apiBase}/logs/stats/level`);
    const data = await response.json();
    stats.value = data;
  } catch (error) {
    console.error("통계 로딩 실패:", error);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("ko-KR");
};

onMounted(() => {
  loadLogs();
  loadStats();
});
</script>
