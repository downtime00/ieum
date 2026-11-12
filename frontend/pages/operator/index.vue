<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
        <div class="flex items-center justify-between mb-5">
          <h1 class="text-2xl font-bold text-white">기관 관리</h1>
          <NuxtLink to="/operators" class="text-sm text-sky-300 hover:underline">
            기관 목록 →
          </NuxtLink>
        </div>

        <div v-if="needLogin" class="text-center py-12">
          <p class="text-white/70 mb-4">기관 관리는 로그인이 필요합니다.</p>
          <NuxtLink to="/" class="bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-900 transition">
            로그인하러 가기
          </NuxtLink>
        </div>

        <div v-else-if="loading" class="text-center py-16 text-white/50 text-lg">
          불러오는 중...
        </div>

        <!-- 기관 없음 -->
        <div v-else-if="!operator" class="text-center py-12">
          <p class="text-white/70 mb-4">등록된 기관이 없습니다.</p>
          <NuxtLink to="/operators/register"
            class="bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-900 transition">
            기관 등록하기
          </NuxtLink>
        </div>

        <!-- 승인 대기/반려 -->
        <div v-else-if="operator.status !== 'APPROVED'" class="text-center py-12">
          <p class="text-xl font-bold text-white mb-2">{{ operator.name }}</p>
          <p v-if="operator.status === 'PENDING'" class="text-amber-200 mb-4">
            ⏳ 관리자 승인 대기 중입니다. 승인되면 프로그램을 등록할 수 있습니다.
          </p>
          <p v-else class="text-red-300 mb-4">등록이 반려되었습니다. 문의해주세요.</p>
        </div>

        <!-- 승인됨: 탭 관리 -->
        <template v-else>
          <div class="flex gap-2 mb-5">
            <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
              :class="activeTab === tab.key ? 'bg-blue-800 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'"
              class="font-semibold py-2.5 px-5 rounded-xl transition text-sm">
              {{ tab.label }}
            </button>
          </div>

          <!-- 프로그램 관리 -->
          <div v-if="activeTab === 'programs'">
            <div class="flex justify-end mb-3">
              <button @click="showProgramForm = !showProgramForm"
                class="bg-sky-500 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-sky-400 transition text-sm">
                {{ showProgramForm ? "닫기" : "+ 프로그램 등록" }}
              </button>
            </div>

            <!-- 프로그램 등록 폼 -->
            <form v-if="showProgramForm" @submit.prevent="createProgram"
              class="bg-white/10 rounded-2xl p-5 mb-5 space-y-3">
              <input v-model="pf.title" required maxlength="200" placeholder="프로그램 제목 *"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
              <div class="grid grid-cols-2 gap-3">
                <select v-model="pf.category"
                  class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none">
                  <option v-for="c in programCategories" :key="c" :value="c" class="bg-slate-800">{{ c }}</option>
                </select>
                <input v-model="pf.eventDate" type="date" required
                  class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
              </div>
              <div class="grid grid-cols-3 gap-3">
                <input v-model="pf.startTime" type="time" placeholder="시작시간"
                  class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
                <input v-model.number="pf.durationMin" type="number" min="1" placeholder="소요(분)"
                  class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
                <input v-model.number="pf.capacity" type="number" min="1" required placeholder="정원 *"
                  class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
              </div>
              <input v-model.number="pf.price" type="number" min="0" required placeholder="1인 참가비(원, 무료면 0) *"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
              <input v-model="pf.address" maxlength="500" placeholder="장소 (비우면 기관 주소)"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
              <input v-model="pf.contactPhone" maxlength="50" placeholder="문의 연락처 (비우면 기관 연락처)"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
              <textarea v-model="pf.description" rows="3" maxlength="5000" placeholder="프로그램 소개"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"></textarea>
              <p v-if="programError" class="text-sm text-red-300">{{ programError }}</p>
              <button type="submit" :disabled="programSaving"
                class="w-full bg-blue-800 text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 transition disabled:opacity-40">
                {{ programSaving ? "등록 중..." : "프로그램 등록" }}
              </button>
            </form>

            <!-- 프로그램 목록 -->
            <div v-if="programs.length === 0" class="text-center py-10 text-white/50">
              등록된 프로그램이 없습니다.
            </div>
            <div v-else class="space-y-3">
              <div v-for="p in programs" :key="p.id" class="bg-white/10 rounded-2xl p-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="bg-amber-400/30 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">{{ p.category }}</span>
                      <span class="text-white/60 text-sm">{{ p.eventDate }}<span v-if="p.startTime"> {{ p.startTime }}</span></span>
                      <span v-if="!p.isActive" class="bg-red-400/30 text-red-200 text-xs px-2 py-1 rounded-full">비공개</span>
                    </div>
                    <h3 class="font-bold text-white mt-1.5">{{ p.title }}</h3>
                    <p class="text-sm text-white/60 mt-1">
                      {{ p.price === 0 ? "무료" : `${p.price.toLocaleString()}원/인` }} · 정원 {{ p.capacity }}명 · 신청 {{ p.bookedCount }}명
                    </p>
                  </div>
                  <div class="flex gap-2 flex-shrink-0">
                    <button @click="toggleProgram(p)"
                      class="bg-white/10 text-white/80 font-semibold py-2 px-4 rounded-xl hover:bg-white/20 transition text-xs">
                      {{ p.isActive ? "숨기기" : "보이기" }}
                    </button>
                    <button @click="deleteProgram(p)"
                      class="bg-red-500/20 text-red-300 font-semibold py-2 px-4 rounded-xl hover:bg-red-500/30 transition text-xs">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 예약 관리 -->
          <div v-else-if="activeTab === 'bookings'">
            <div class="flex gap-2 mb-4 flex-wrap">
              <button v-for="f in bookingFilters" :key="f.value" @click="bookingFilter = f.value; loadBookings()"
                :class="bookingFilter === f.value ? 'bg-blue-800 text-white' : 'bg-white/10 text-white/70'"
                class="font-semibold py-2 px-4 rounded-xl transition text-xs">
                {{ f.label }}
              </button>
            </div>
            <div v-if="bookings.length === 0" class="text-center py-10 text-white/50">
              예약 신청이 없습니다.
            </div>
            <div v-else class="space-y-3">
              <div v-for="b in bookings" :key="b.id" class="bg-white/10 rounded-2xl p-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-bold text-white">{{ b.programTitle || `프로그램 #${b.programId}` }}</p>
                    <p class="text-sm text-white/60 mt-0.5">
                      {{ b.requesterName || `이용자 #${b.requesterUserId}` }} · {{ b.headcount }}명 · {{ b.totalAmount?.toLocaleString() }}원
                    </p>
                    <p v-if="b.message" class="text-sm text-white/50 mt-1">요청: {{ b.message }}</p>
                    <p v-if="b.desiredAddress || b.desiredLat" class="text-sm text-sky-300 mt-1">
                      📍 희망 장소: {{ b.desiredAddress || `${Number(b.desiredLat).toFixed(5)}, ${Number(b.desiredLng).toFixed(5)}` }}
                    </p>
                    <p v-if="b.payerName" class="text-xs text-emerald-300 mt-1">입금자: {{ b.payerName }}</p>
                  </div>
                  <span :class="statusClass(b.status)" class="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">
                    {{ statusLabel(b.status) }}
                  </span>
                </div>
                <div class="flex gap-2 mt-3 flex-wrap">
                  <template v-if="b.status === 'REQUESTED'">
                    <button @click="act(b, 'accept')" :disabled="acting === b.id"
                      class="bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-emerald-500 transition text-sm disabled:opacity-40">
                      수락
                    </button>
                    <button @click="rejectBooking(b)" :disabled="acting === b.id"
                      class="bg-red-500/20 text-red-300 font-semibold py-2 px-4 rounded-xl hover:bg-red-500/30 transition text-sm disabled:opacity-40">
                      거절
                    </button>
                  </template>
                  <button v-if="b.status === 'PAID'" @click="completeBooking(b)" :disabled="acting === b.id"
                    class="bg-blue-800 text-white font-semibold py-2 px-4 rounded-xl hover:bg-blue-900 transition text-sm disabled:opacity-40">
                    운영 완료 처리
                  </button>
                  <button v-if="['REQUESTED','ACCEPTED','PAID'].includes(b.status)" @click="cancelBooking(b)" :disabled="acting === b.id"
                    class="bg-white/10 text-white/70 font-semibold py-2 px-4 rounded-xl hover:bg-white/20 transition text-sm disabled:opacity-40">
                    취소
                  </button>
                </div>
                <p v-if="actionMsg[b.id]" class="text-sm mt-2" :class="actionMsg[b.id].startsWith('!') ? 'text-red-300' : 'text-emerald-300'">
                  {{ actionMsg[b.id].startsWith('!') ? actionMsg[b.id].slice(1) : actionMsg[b.id] }}
                </p>
              </div>
            </div>
          </div>

          <!-- 공연 이력 -->
          <div v-else-if="activeTab === 'history'">
            <div v-if="history.length === 0" class="text-center py-10 text-white/50">
              지난 프로그램이 없습니다.
            </div>
            <div v-else class="space-y-3">
              <div v-for="p in history" :key="p.id" class="bg-white/10 rounded-2xl p-5">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="bg-amber-400/30 text-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">{{ p.category }}</span>
                      <span class="text-white/60 text-sm">{{ formatDate(p.eventDate) }}<span v-if="p.startTime"> {{ p.startTime }}</span></span>
                      <span v-if="p.avgRating" class="bg-yellow-400/30 text-yellow-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        ★ {{ p.avgRating }} ({{ p.reviewCount }})
                      </span>
                    </div>
                    <h3 class="font-bold text-white mt-1.5">{{ p.title }}</h3>
                    <p class="text-sm text-white/60 mt-1">
                      예약 {{ p.bookingCount }}건 · 정산 완료 {{ p.settledCount }}건
                      <template v-if="p.settledAmount"> · 정산액 {{ p.settledAmount.toLocaleString() }}원</template>
                    </p>
                  </div>
                  <span class="bg-slate-400/30 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0">종료</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 기관 정보 -->
          <div v-else-if="activeTab === 'info'">
            <form @submit.prevent="saveInfo" class="space-y-3 max-w-xl">
              <input v-model="infoForm.name" required maxlength="200" placeholder="기관명"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
              <div class="grid grid-cols-2 gap-3">
                <input v-model="infoForm.phone" maxlength="50" placeholder="연락처"
                  class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
                <input v-model="infoForm.address" maxlength="500" placeholder="주소"
                  class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
              </div>
              <textarea v-model="infoForm.description" rows="3" maxlength="2000" placeholder="기관 소개"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400"></textarea>
              <div class="border-t border-white/10 pt-3">
                <p class="text-sm font-semibold text-white/80 mb-2">정산 계좌</p>
                <div class="grid grid-cols-3 gap-3">
                  <input v-model="infoForm.bankName" maxlength="50" placeholder="은행명"
                    class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
                  <input v-model="infoForm.bankAccount" maxlength="100" placeholder="계좌번호"
                    class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
                  <input v-model="infoForm.accountHolder" maxlength="100" placeholder="예금주"
                    class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
                </div>
              </div>
              <p v-if="infoMsg" class="text-sm" :class="infoMsg.startsWith('!') ? 'text-red-300' : 'text-emerald-300'">
                {{ infoMsg.startsWith('!') ? infoMsg.slice(1) : infoMsg }}
              </p>
              <button type="submit" :disabled="infoSaving"
                class="bg-blue-800 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-blue-900 transition disabled:opacity-40">
                {{ infoSaving ? "저장 중..." : "저장" }}
              </button>
            </form>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const tabs = [
  { key: "programs", label: "프로그램 관리" },
  { key: "bookings", label: "예약 관리" },
  { key: "history", label: "공연 이력" },
  { key: "info", label: "기관 정보" },
];
const programCategories = ["공연", "강의", "체험", "요양·간병", "방문서비스", "기타"];
const bookingFilters = [
  { key: "", label: "전체", value: "" },
  { key: "REQUESTED", label: "신청됨", value: "REQUESTED" },
  { key: "ACCEPTED", label: "입금대기", value: "ACCEPTED" },
  { key: "PAID", label: "입금완료", value: "PAID" },
  { key: "COMPLETED", label: "운영완료", value: "COMPLETED" },
  { key: "SETTLED", label: "정산완료", value: "SETTLED" },
];

const needLogin = ref(false);
const loading = ref(true);
const userId = ref<number | null>(null);
const operator = ref<any>(null);
const activeTab = ref("programs");

// 프로그램
const programs = ref<any[]>([]);
const showProgramForm = ref(false);
const programSaving = ref(false);
const programError = ref("");
const pf = reactive({
  title: "", category: "공연", eventDate: "", startTime: "", durationMin: null as number | null,
  price: 0, capacity: 30, address: "", contactPhone: "", description: "",
});

// 예약
const bookings = ref<any[]>([]);
const bookingFilter = ref("");
const acting = ref<string | null>(null);
const actionMsg = reactive<Record<string, string>>({});

// 공연 이력
const history = ref<any[]>([]);

// 기관 정보
const infoForm = reactive({ name: "", phone: "", address: "", description: "", bankName: "", bankAccount: "", accountHolder: "" });
const infoSaving = ref(false);
const infoMsg = ref("");

const statusLabel = (s: string) => ({
  REQUESTED: "신청됨", ACCEPTED: "수락·입금대기", PAID: "입금완료",
  COMPLETED: "운영완료", SETTLED: "정산완료", REJECTED: "거절됨",
  CANCELLED: "취소됨", REFUNDED: "환불됨",
}[s] || s);
const statusClass = (s: string) => ({
  REQUESTED: "bg-amber-400/30 text-amber-200", ACCEPTED: "bg-sky-400/30 text-sky-200",
  PAID: "bg-emerald-400/30 text-emerald-200", COMPLETED: "bg-violet-400/30 text-violet-200",
  SETTLED: "bg-emerald-400/30 text-emerald-200", REJECTED: "bg-red-400/30 text-red-200",
  CANCELLED: "bg-slate-400/30 text-slate-300", REFUNDED: "bg-orange-400/30 text-orange-200",
}[s] || "bg-slate-400/30 text-slate-200");

const getTokenUserId = (): number | null => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ? Number(payload.sub) : null;
  } catch {
    return null;
  }
};

const loadOperator = async () => {
  const res = await fetch(`${config.public.apiBase}/operators/me/${userId.value}`);
  operator.value = res.ok ? await res.json() : null;
  if (operator.value) {
    Object.assign(infoForm, {
      name: operator.value.name || "",
      phone: operator.value.phone || "",
      address: operator.value.address || "",
      description: operator.value.description || "",
      bankName: operator.value.bankName || "",
      bankAccount: operator.value.bankAccount || "",
      accountHolder: operator.value.accountHolder || "",
    });
    loadPrograms();
    loadBookings();
    loadHistory();
  }
};

const loadHistory = async () => {
  const res = await fetch(`${config.public.apiBase}/operators/${operator.value.id}/history?userId=${userId.value}`);
  history.value = res.ok ? await res.json() : [];
};

const formatDate = (d?: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });
};

const loadPrograms = async () => {
  const res = await fetch(`${config.public.apiBase}/operators/${operator.value.id}/programs/manage?userId=${userId.value}`);
  programs.value = res.ok ? await res.json() : [];
};

const loadBookings = async () => {
  const params = bookingFilter.value ? `&status=${bookingFilter.value}` : "";
  const res = await fetch(`${config.public.apiBase}/operators/${operator.value.id}/bookings?userId=${userId.value}${params}`);
  bookings.value = res.ok ? await res.json() : [];
};

const createProgram = async () => {
  programSaving.value = true;
  programError.value = "";
  try {
    const res = await fetch(`${config.public.apiBase}/operators/${operator.value.id}/programs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId.value,
        title: pf.title,
        category: pf.category,
        eventDate: pf.eventDate,
        startTime: pf.startTime || undefined,
        durationMin: pf.durationMin || undefined,
        price: pf.price,
        capacity: pf.capacity,
        address: pf.address || undefined,
        contactPhone: pf.contactPhone || undefined,
        description: pf.description || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "등록 실패");
    showProgramForm.value = false;
    Object.assign(pf, { title: "", category: "공연", eventDate: "", startTime: "", durationMin: null, price: 0, capacity: 30, address: "", contactPhone: "", description: "" });
    await loadPrograms();
  } catch (e: any) {
    programError.value = e.message;
  } finally {
    programSaving.value = false;
  }
};

const toggleProgram = async (p: any) => {
  const res = await fetch(`${config.public.apiBase}/programs/${p.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: userId.value, isActive: !p.isActive }),
  });
  if (res.ok) await loadPrograms();
};

const deleteProgram = async (p: any) => {
  if (!confirm(`"${p.title}" 프로그램을 삭제할까요?`)) return;
  await fetch(`${config.public.apiBase}/programs/${p.id}?userId=${userId.value}`, { method: "DELETE" });
  await loadPrograms();
};

const act = async (b: any, action: string, extra: any = {}) => {
  acting.value = b.id;
  actionMsg[b.id] = "";
  try {
    const res = await fetch(`${config.public.apiBase}/bookings/${b.id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.value, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "처리 실패");
    actionMsg[b.id] = "처리되었습니다.";
    await loadBookings();
  } catch (e: any) {
    actionMsg[b.id] = `!${e.message}`;
  } finally {
    acting.value = null;
  }
};

const rejectBooking = (b: any) => {
  const reason = prompt("거절 사유 (선택):");
  if (reason === null) return;
  act(b, "reject", { reason: reason || undefined });
};
const completeBooking = (b: any) => {
  if (!confirm("프로그램 운영이 완료되었나요? 이용자 확인 후 정산됩니다.")) return;
  act(b, "complete");
};
const cancelBooking = (b: any) => {
  const reason = prompt("취소 사유 (선택):");
  if (reason === null) return;
  act(b, "cancel", { reason: reason || undefined });
};

const saveInfo = async () => {
  infoSaving.value = true;
  infoMsg.value = "";
  try {
    const res = await fetch(`${config.public.apiBase}/operators/${operator.value.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.value, ...infoForm }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "저장 실패");
    operator.value = data;
    infoMsg.value = "저장되었습니다.";
  } catch (e: any) {
    infoMsg.value = `!${e.message}`;
  } finally {
    infoSaving.value = false;
  }
};

onMounted(async () => {
  userId.value = getTokenUserId();
  if (!userId.value) {
    needLogin.value = true;
    loading.value = false;
    return;
  }
  await loadOperator();
  loading.value = false;
});
</script>
