<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">

        <!-- 헤더 -->
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-white">
            {{ $t("status.title") }}
          </h1>
          <button
            @click="loadStatus"
            :disabled="loading"
            class="bg-sky-500 text-white font-semibold py-2 px-5 rounded-xl hover:bg-sky-400 transition disabled:opacity-40"
          >
            {{ loading ? "..." : $t("status.refresh") }}
          </button>
        </div>

        <!-- 전체 상태 -->
        <div
          v-if="status"
          :class="
            status.status === 'ok'
              ? 'bg-emerald-500/15 border-emerald-400/40'
              : 'bg-amber-500/15 border-amber-400/40'
          "
          class="rounded-2xl border p-5 mb-6 text-center"
        >
          <p class="text-3xl mb-1">{{ status.status === "ok" ? "✅" : "⚠️" }}</p>
          <p class="text-xl font-bold text-white">
            {{ status.status === "ok" ? $t("status.allOk") : $t("status.degraded") }}
          </p>
          <p class="text-sm text-white/60 mt-1">
            {{ $t("status.lastChecked") }}: {{ checkedAt }}
          </p>
        </div>

        <!-- 점검 항목 -->
        <div class="space-y-3">
          <div
            v-for="item in checkItems"
            :key="item.key"
            class="bg-white/10 rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <p class="text-lg font-semibold text-white">{{ item.label }}</p>
              <p v-if="item.detail" class="text-sm text-white/60 mt-1">
                {{ item.detail }}
              </p>
            </div>
            <div class="text-right">
              <span
                :class="
                  item.ok
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                "
                class="inline-block px-4 py-1.5 rounded-full text-sm font-bold"
              >
                {{ item.ok ? $t("status.ok") : $t("status.down") }}
              </span>
              <p v-if="item.latency != null" class="text-xs text-white/50 mt-1">
                {{ item.latency }}ms
              </p>
            </div>
          </div>
        </div>

        <!-- 에러 -->
        <p v-if="error" class="text-red-300 text-center mt-6">
          {{ error }}
        </p>

        <p class="text-white/40 text-sm text-center mt-8">
          {{ $t("status.autoNote") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

const config = useRuntimeConfig();

interface CheckResult {
  status: "ok" | "down";
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    api: CheckResult;
    database: CheckResult;
    redis: CheckResult;
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
  };
}

const status = ref<HealthResponse | null>(null);
const loading = ref(false);
const error = ref("");
const checkedAt = ref("");
let timer: ReturnType<typeof setInterval> | null = null;

const checkItems = computed(() => {
  if (!status.value) return [];
  const c = status.value.checks;
  const up = Math.floor(status.value.uptimeSeconds / 3600);
  const upMin = Math.floor((status.value.uptimeSeconds % 3600) / 60);
  return [
    {
      key: "api",
      label: "API 서버",
      ok: c.api.status === "ok",
      latency: c.api.latencyMs,
      detail: "",
    },
    {
      key: "db",
      label: "데이터베이스",
      ok: c.database.status === "ok",
      latency: c.database.latencyMs,
      detail: c.database.message || "",
    },
    {
      key: "redis",
      label: "캐시 (Redis)",
      ok: c.redis.status === "ok",
      latency: c.redis.latencyMs,
      detail: c.redis.message || "",
    },
    {
      key: "memory",
      label: "메모리 사용량",
      ok: status.value.memory.heapUsedMb < 512,
      latency: null as number | null,
      detail: `Heap ${status.value.memory.heapUsedMb}MB / RSS ${status.value.memory.rssMb}MB`,
    },
    {
      key: "uptime",
      label: "가동 시간",
      ok: true,
      latency: null as number | null,
      detail: up > 0 ? `${up}시간 ${upMin}분` : `${upMin}분`,
    },
  ];
});

const loadStatus = async () => {
  loading.value = true;
  error.value = "";
  try {
    status.value = await $fetch<HealthResponse>(
      `${config.public.apiBase}/health/detailed`,
    );
    checkedAt.value = new Date().toLocaleTimeString("ko-KR");
  } catch {
    error.value = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
    status.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadStatus();
  timer = setInterval(loadStatus, 30000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
