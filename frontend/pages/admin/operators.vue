<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <header class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">기관·사업자 승인</h1>
          <p class="text-slate-500 mt-1">
            사용자가 설정에서 신청한 기관/개인 사업자 등록을 승인하거나 반려합니다
          </p>
        </div>
        <NuxtLink
          to="/admin/dashboard"
          class="text-sm px-4 py-2 rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition"
        >
          관리자 화면
        </NuxtLink>
      </header>

      <!-- 상태 필터 -->
      <div class="flex gap-2 mb-5 flex-wrap">
        <button
          v-for="t in statusTabs"
          :key="t.key"
          @click="statusFilter = t.key; load()"
          :class="
            statusFilter === t.key
              ? 'bg-blue-700 text-white'
              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
          "
          class="px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          {{ t.label }}
          <span v-if="t.key === 'PENDING' && pendingCount" class="ml-1">({{ pendingCount }})</span>
        </button>
      </div>

      <div v-if="loading" class="text-center py-12 text-slate-500">
        불러오는 중...
      </div>

      <div
        v-else-if="items.length === 0"
        class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-10 text-center text-slate-500"
      >
        {{ statusFilter === "PENDING" ? "승인 대기 중인 신청이 없습니다." : "등록된 기관이 없습니다." }}
      </div>

      <div v-else class="space-y-4">
        <article
          v-for="op in items"
          :key="op.id"
          class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5"
        >
          <div class="flex items-start justify-between gap-4 flex-wrap">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="text-lg font-bold text-slate-900">{{ op.name }}</h2>
                <span
                  class="text-xs font-bold px-2 py-0.5 rounded-full"
                  :class="statusClass(op.status)"
                >
                  {{ statusLabel(op.status) }}
                </span>
                <span class="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {{ op.orgType }}
                </span>
              </div>
              <dl class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div v-if="op.businessNumber" class="flex gap-2">
                  <dt class="text-slate-400 w-20 shrink-0">{{ isCareType(op) ? "자격" : "사업자번호" }}</dt>
                  <dd class="text-slate-700">{{ op.businessNumber }}</dd>
                </div>
                <div v-if="op.phone" class="flex gap-2">
                  <dt class="text-slate-400 w-20 shrink-0">연락처</dt>
                  <dd class="text-slate-700">{{ op.phone }}</dd>
                </div>
                <div v-if="op.address" class="flex gap-2">
                  <dt class="text-slate-400 w-20 shrink-0">{{ isCareType(op) ? "지역" : "주소" }}</dt>
                  <dd class="text-slate-700">{{ op.address }}</dd>
                </div>
                <div class="flex gap-2">
                  <dt class="text-slate-400 w-20 shrink-0">신청자 ID</dt>
                  <dd class="text-slate-700">{{ op.ownerUserId }}</dd>
                </div>
                <div v-if="op.bankName || op.bankAccount" class="flex gap-2 sm:col-span-2">
                  <dt class="text-slate-400 w-20 shrink-0">정산계좌</dt>
                  <dd class="text-slate-700">
                    {{ [op.bankName, op.bankAccount, op.accountHolder].filter(Boolean).join(" ") }}
                  </dd>
                </div>
              </dl>
              <p
                v-if="op.description"
                class="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl p-3 whitespace-pre-line"
              >
                {{ op.description }}
              </p>
              <p class="mt-2 text-xs text-slate-400">
                신청일: {{ formatDate(op.createdAt) }}
              </p>
            </div>

            <div v-if="op.status === 'PENDING'" class="flex gap-2 shrink-0">
              <button
                @click="setStatus(op, 'APPROVED')"
                :disabled="acting === op.id"
                class="bg-emerald-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-emerald-500 transition text-sm disabled:opacity-40"
              >
                승인
              </button>
              <button
                @click="setStatus(op, 'REJECTED')"
                :disabled="acting === op.id"
                class="bg-red-500 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-red-400 transition text-sm disabled:opacity-40"
              >
                반려
              </button>
            </div>
            <div v-else class="flex gap-2 shrink-0">
              <button
                v-if="op.status === 'REJECTED'"
                @click="setStatus(op, 'APPROVED')"
                :disabled="acting === op.id"
                class="bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-emerald-500 transition text-xs disabled:opacity-40"
              >
                승인으로 변경
              </button>
              <button
                v-else
                @click="setStatus(op, 'REJECTED')"
                :disabled="acting === op.id"
                class="bg-slate-100 text-slate-600 font-semibold py-2 px-4 rounded-xl hover:bg-slate-200 transition text-xs disabled:opacity-40"
              >
                반려로 변경
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiFetch } from "~/utils/auth";

const config = useRuntimeConfig();
const apiBase = config.public.apiBase as string;

interface Operator {
  id: string;
  ownerUserId: number;
  name: string;
  orgType: string;
  businessNumber?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  accountHolder?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const statusTabs = [
  { key: "PENDING", label: "승인 대기" },
  { key: "", label: "전체" },
  { key: "APPROVED", label: "승인됨" },
  { key: "REJECTED", label: "반려됨" },
];

const items = ref<Operator[]>([]);
const loading = ref(false);
const acting = ref<string | null>(null);
const statusFilter = ref("PENDING");
const pendingCount = ref(0);

const isCareType = (op: Operator) => ["요양보호사", "간병인"].includes(op.orgType);

const statusLabel = (s: string) =>
  ({ PENDING: "승인 대기", APPROVED: "승인됨", REJECTED: "반려됨" })[s] || s;
const statusClass = (s: string) =>
  ({
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-600",
  })[s] || "bg-slate-100 text-slate-600";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("ko-KR") : "";

const load = async () => {
  loading.value = true;
  try {
    const qs = statusFilter.value ? `?status=${statusFilter.value}` : "";
    const res = await apiFetch(apiBase, `/operators/manage${qs}`);
    if (res.ok) items.value = await res.json();
    // 대기 건수 배지
    const pres = await apiFetch(apiBase, "/operators/manage?status=PENDING");
    if (pres.ok) pendingCount.value = (await pres.json()).length;
  } catch (e) {
    console.error("기관 목록 로딩 실패:", e);
  } finally {
    loading.value = false;
  }
};

const setStatus = async (op: Operator, status: "APPROVED" | "REJECTED") => {
  const msg =
    status === "APPROVED"
      ? `'${op.name}'을(를) 승인할까요? 승인 즉시 기관 관리가 가능합니다.`
      : `'${op.name}'을(를) 반려할까요?`;
  if (!confirm(msg)) return;
  acting.value = op.id;
  try {
    const res = await apiFetch(apiBase, `/operators/${op.id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    if (res.ok) await load();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "처리에 실패했습니다.");
    }
  } catch (e) {
    console.error("상태 변경 실패:", e);
  } finally {
    acting.value = null;
  }
};

onMounted(load);
</script>
