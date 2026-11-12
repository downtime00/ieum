<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
        <div class="flex items-center justify-between mb-5">
          <h1 class="text-2xl font-bold text-white">내 예약</h1>
          <NuxtLink to="/operators" class="text-sm text-sky-300 hover:underline">
            프로그램 보러가기 →
          </NuxtLink>
        </div>

        <div v-if="needLogin" class="text-center py-12">
          <p class="text-white/70 mb-4">내 예약을 보려면 로그인이 필요합니다.</p>
          <NuxtLink to="/" class="bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-900 transition">
            로그인하러 가기
          </NuxtLink>
        </div>

        <div v-else-if="loading" class="text-center py-16 text-white/50 text-lg">
          불러오는 중...
        </div>
        <div v-else-if="bookings.length === 0" class="text-center py-16 text-white/50 text-lg">
          예약 내역이 없습니다.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="b in bookings"
            :key="b.id"
            class="bg-white/10 rounded-2xl p-5"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0">
                <h2 class="font-bold text-white">{{ b.programTitle || `프로그램 #${b.programId}` }}</h2>
                <p class="text-sm text-white/60 mt-0.5">
                  {{ formatDate(b.eventDate) }}<span v-if="b.startTime"> {{ b.startTime }}</span>
                  · {{ b.headcount }}명 · {{ b.totalAmount?.toLocaleString() }}원
                </p>
              </div>
              <span
                :class="statusClass(b.status)"
                class="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 whitespace-nowrap"
              >
                {{ statusLabel(b.status) }}
              </span>
            </div>

            <!-- 상태별 안내/액션 -->
            <div class="mt-3 space-y-2">
              <p v-if="b.status === 'REQUESTED'" class="text-sm text-white/60">
                기관의 수락을 기다리고 있습니다.
              </p>
              <p v-else-if="b.status === 'ACCEPTED'" class="text-sm text-amber-200">
                ✅ 기관이 수락했습니다. 아래 계좌로 입금 후 '입금 완료 신고'를 눌러주세요.
              </p>
              <p v-else-if="b.status === 'PAID'" class="text-sm text-emerald-200">
                💰 입금 확인되었습니다. 프로그램이 끝나면 기관이 완료 처리합니다.
              </p>
              <p v-else-if="b.status === 'COMPLETED'" class="text-sm text-sky-200">
                🎉 프로그램이 완료되었습니다. 이용하셨다면 '확인 및 정산'을 눌러주세요.
              </p>
              <p v-else-if="b.status === 'SETTLED'" class="text-sm text-white/60">
                정산이 완료되었습니다. 이용해 주셔서 감사합니다.
              </p>
              <p v-else-if="b.status === 'REJECTED'" class="text-sm text-red-300">
                기관에서 신청을 거절했습니다.{{ b.cancelReason ? ` (${b.cancelReason})` : "" }}
              </p>
              <p v-else class="text-sm text-white/60">
                {{ b.status === 'REFUNDED' ? '취소 및 환불 처리되었습니다.' : '취소되었습니다.' }}
              </p>
            </div>

            <!-- 입금 안내 (ACCEPTED 상태) -->
            <div
              v-if="b.status === 'ACCEPTED'"
              class="mt-3 bg-amber-500/10 border border-amber-400/30 rounded-xl p-4"
            >
              <p class="text-sm font-semibold text-amber-200 mb-1">입금 계좌</p>
              <p class="text-white/80 text-sm">
                {{ paymentInfo || "플랫폼 운영 계좌는 관리자에게 문의해주세요." }}
              </p>
              <p class="text-white/50 text-xs mt-1">
                입금자명은 예약자 이름과 동일하게 해주세요. 금액: {{ b.totalAmount?.toLocaleString() }}원
              </p>
            </div>

            <!-- 액션 버튼 -->
            <div class="flex gap-2 mt-4 flex-wrap">
              <button
                v-if="b.status === 'ACCEPTED'"
                @click="submitPayment(b)"
                :disabled="acting === b.id"
                class="bg-emerald-600 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-emerald-500 transition text-sm disabled:opacity-40"
              >
                입금 완료 신고
              </button>
              <button
                v-if="b.status === 'COMPLETED'"
                @click="confirmBooking(b)"
                :disabled="acting === b.id"
                class="bg-blue-800 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-900 transition text-sm disabled:opacity-40"
              >
                확인 및 정산
              </button>
              <button
                v-if="['REQUESTED', 'ACCEPTED'].includes(b.status)"
                @click="cancelBooking(b)"
                :disabled="acting === b.id"
                class="bg-white/10 text-white/70 font-semibold py-2.5 px-5 rounded-xl hover:bg-white/20 transition text-sm disabled:opacity-40"
              >
                예약 취소
              </button>
            </div>
            <p v-if="actionMsg[b.id]" class="text-sm text-emerald-300 mt-2">{{ actionMsg[b.id] }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
const config = runtimeConfig;

interface Booking {
  id: string;
  programId: string;
  status: string;
  headcount: number;
  totalAmount: number;
  programTitle?: string;
  eventDate?: string;
  startTime?: string | null;
  cancelReason?: string | null;
}

const bookings = ref<Booking[]>([]);
const loading = ref(false);
const needLogin = ref(false);
const acting = ref<string | null>(null);
const actionMsg = reactive<Record<string, string>>({});
const paymentInfo = (runtimeConfig.public as any).paymentInfo || "";

const statusLabel = (s: string) => ({
  REQUESTED: "신청됨", ACCEPTED: "수락됨·입금대기", PAID: "입금완료",
  COMPLETED: "운영완료·확인대기", SETTLED: "정산완료", REJECTED: "거절됨",
  CANCELLED: "취소됨", REFUNDED: "환불됨",
}[s] || s);

const statusClass = (s: string) => ({
  REQUESTED: "bg-slate-400/30 text-slate-200",
  ACCEPTED: "bg-amber-400/30 text-amber-200",
  PAID: "bg-emerald-400/30 text-emerald-200",
  COMPLETED: "bg-sky-400/30 text-sky-200",
  SETTLED: "bg-emerald-400/30 text-emerald-200",
  REJECTED: "bg-red-400/30 text-red-200",
  CANCELLED: "bg-slate-400/30 text-slate-300",
  REFUNDED: "bg-orange-400/30 text-orange-200",
}[s] || "bg-slate-400/30 text-slate-200");

const formatDate = (d?: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
};

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

const load = async () => {
  const uid = getUserId();
  if (!uid) {
    needLogin.value = true;
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(`${config.public.apiBase}/bookings/my?userId=${uid}`);
    const list: any[] = res.ok ? await res.json() : [];
    // 프로그램 제목/일시 보강
    bookings.value = await Promise.all(
      list.map(async (b) => {
        try {
          const pres = await fetch(`${config.public.apiBase}/programs/${b.programId}`);
          const p = pres.ok ? await pres.json() : null;
          return { ...b, programTitle: p?.title, eventDate: p?.eventDate, startTime: p?.startTime };
        } catch {
          return b;
        }
      }),
    );
  } catch {
    bookings.value = [];
  } finally {
    loading.value = false;
  }
};

const act = async (b: Booking, action: string, extra: any = {}) => {
  const uid = getUserId();
  if (!uid) return;
  acting.value = b.id;
  try {
    const res = await fetch(`${config.public.apiBase}/bookings/${b.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "처리에 실패했습니다");
    actionMsg[b.id] = "처리되었습니다.";
    await load();
  } catch (e: any) {
    actionMsg[b.id] = e.message;
  } finally {
    acting.value = null;
  }
};

const submitPayment = (b: Booking) => {
  const payerName = prompt("입금자명을 입력해주세요 (예: 홍길동):");
  if (payerName === null) return;
  act(b, "payment", { payerName: payerName || undefined });
};
const confirmBooking = (b: Booking) => {
  if (!confirm("프로그램을 이용하셨나요? 확인하시면 기관에 정산됩니다.")) return;
  act(b, "confirm");
};
const cancelBooking = (b: Booking) => {
  const reason = prompt("취소 사유 (선택):") ?? undefined;
  if (reason === null) return;
  act(b, "cancel", { reason });
};

onMounted(load);
</script>
