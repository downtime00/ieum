<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
        <div v-if="loading" class="text-center py-16 text-white/50 text-lg">
          불러오는 중...
        </div>
        <template v-else-if="program">
          <NuxtLink to="javascript:history.back()" class="text-sm text-sky-300 hover:underline">
            ← 뒤로가기
          </NuxtLink>

          <div class="mt-3 mb-6">
            <div class="flex items-center gap-2 flex-wrap mb-2">
              <span class="bg-amber-400/30 text-amber-200 text-sm font-semibold px-3 py-1 rounded-full">
                {{ program.category }}
              </span>
              <span class="text-white/70 text-sm">
                {{ formatDate(program.eventDate) }}<span v-if="program.startTime"> {{ program.startTime }}</span>
                <span v-if="program.durationMin"> · 약 {{ program.durationMin }}분</span>
              </span>
            </div>
            <h1 class="text-2xl font-bold text-white leading-snug">{{ program.title }}</h1>
            <p class="text-white/60 mt-1">
              주최: {{ operatorName }}
            </p>
            <p v-if="program.address" class="text-white/70 mt-2">📍 {{ program.address }}</p>
            <p v-if="program.contactPhone" class="text-white/70">📞 {{ program.contactPhone }}</p>
          </div>

          <div v-if="program.description" class="bg-white/10 rounded-2xl p-5 mb-6">
            <p class="text-white/85 leading-relaxed whitespace-pre-line">{{ program.description }}</p>
          </div>

          <div class="bg-white/10 rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p class="text-white/60 text-sm">참가비</p>
              <p class="text-2xl font-bold text-white">
                {{ program.price === 0 ? "무료" : `${program.price.toLocaleString()}원` }}
                <span class="text-base font-normal text-white/60">/인</span>
              </p>
            </div>
            <div class="text-right">
              <p class="text-white/60 text-sm">잔여 좌석</p>
              <p class="text-2xl font-bold text-white">{{ remaining }}석</p>
            </div>
          </div>

          <!-- 예약 신청 -->
          <div v-if="isPast" class="bg-white/10 rounded-2xl p-5 text-center text-white/60">
            종료된 프로그램입니다.
          </div>
          <div v-else-if="remaining > 0" class="bg-white/10 rounded-2xl p-5">
            <h2 class="font-semibold text-white mb-3">예약 신청</h2>
            <div v-if="needLogin" class="text-center py-4">
              <p class="text-white/70 mb-3">예약 신청은 로그인이 필요합니다.</p>
              <NuxtLink to="/" class="bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-900 transition">
                로그인하러 가기
              </NuxtLink>
            </div>
            <form v-else @submit.prevent="submit" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-white/70 mb-1">인원 (1~{{ Math.min(remaining, 10) }}명)</label>
                  <input v-model.number="headcount" type="number" min="1" :max="Math.min(remaining, 10)" required
                    class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400" />
                </div>
                <div>
                  <label class="block text-sm text-white/70 mb-1">예상 금액</label>
                  <p class="text-xl font-bold text-white py-3">
                    {{ (program.price * headcount).toLocaleString() }}원
                  </p>
                </div>
              </div>
              <!-- 그룹(가족) 예약 선택 — 그룹장은 HEAD만, 요양·간병은 필수 -->
              <div v-if="headFamilies.length > 0 || isCareService">
                <label class="block text-sm text-white/70 mb-1">
                  {{ isCareService ? "예약 가족 (필수)" : "예약 대상" }}
                </label>
                <select v-model="selectedFamilyId"
                  class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400">
                  <option :value="null" class="bg-slate-800" :disabled="isCareService">
                    {{ isCareService ? "가족을 선택해주세요" : "개인 예약" }}
                  </option>
                  <option v-for="f in headFamilies" :key="f.id" :value="f.id" class="bg-slate-800">
                    {{ f.name }} (그룹 예약)
                  </option>
                </select>
                <p v-if="isCareService" class="text-xs text-sky-300 mt-1">
                  요양·간병/방문서비스는 가족장만 예약할 수 있으며, 예약이 가족 전체에 적용됩니다.
                </p>
              </div>
              <div>
                <label class="block text-sm text-white/70 mb-1">요청 사항 (선택)</label>
                <textarea v-model="message" rows="2" maxlength="1000" placeholder="휠체어 이용, 보호자 동반 등"
                  class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"></textarea>
              </div>
              <p class="text-xs text-white/50 leading-relaxed">
                신청 후 기관이 수락하면 예약금 입금 안내가 표시됩니다.
                입금은 플랫폼이 보관하며, 프로그램 종료 후 확인하시면 기관에 정산됩니다.
              </p>
              <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
              <p v-if="success" class="text-sm text-emerald-300">{{ success }}</p>
              <button type="submit" :disabled="submitting || !!success || (isCareService && !selectedFamilyId)"
                class="w-full bg-blue-800 text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition text-lg disabled:opacity-40">
                {{ submitting ? "신청 중..." : "예약 신청하기" }}
              </button>
            </form>
          </div>
          <div v-else class="bg-white/10 rounded-2xl p-5 text-center text-white/60">
            마감된 프로그램입니다.
          </div>
        </template>
        <div v-else class="text-center py-16 text-red-300">프로그램을 찾을 수 없습니다.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const route = useRoute();

const program = ref<any>(null);
const operatorName = ref("");
const loading = ref(true);
const needLogin = ref(false);
const headcount = ref(1);
const message = ref("");
const error = ref("");
const success = ref("");
const submitting = ref(false);
const headFamilies = ref<any[]>([]);
const selectedFamilyId = ref<number | null>(null);

const isCareService = computed(() =>
  ["요양·간병", "방문서비스"].includes(program.value?.category || ""),
);

const remaining = computed(() =>
  program.value ? Math.max(0, program.value.capacity - program.value.bookedCount) : 0,
);

const isPast = computed(() => {
  if (!program.value?.eventDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(program.value.eventDate) < today;
});

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

const submit = async () => {
  const uid = getUserId();
  if (!uid) return;
  submitting.value = true;
  error.value = "";
  success.value = "";
  try {
    const res = await fetch(
      `${config.public.apiBase}/programs/${route.params.id}/bookings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: uid,
          headcount: headcount.value,
          message: message.value || undefined,
          familyId: selectedFamilyId.value || undefined,
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "신청에 실패했습니다");
    success.value = "예약 신청이 완료되었습니다. 기관의 수락을 기다려주세요.";
  } catch (e: any) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    const res = await fetch(`${config.public.apiBase}/programs/${route.params.id}`);
    program.value = res.ok ? await res.json() : null;
    if (program.value) {
      const ores = await fetch(`${config.public.apiBase}/operators/${program.value.operatorId}`);
      const op = ores.ok ? await ores.json() : null;
      operatorName.value = op?.name || "";
      // 내가 그룹장(HEAD)인 가족 목록 — 그룹 예약 옵션
      const uid = getUserId();
      if (uid) {
        const fres = await fetch(`${config.public.apiBase}/board/families?userId=${uid}`);
        const fams: any[] = fres.ok ? await fres.json() : [];
        headFamilies.value = fams.filter((f) => f.role === "HEAD");
        if (isCareService.value && headFamilies.value.length > 0) {
          selectedFamilyId.value = headFamilies.value[0].id;
        }
      }
    }
    if (!getUserId()) needLogin.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
