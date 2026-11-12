<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
        <h1 class="text-2xl font-bold text-white mb-2">기관·서비스 제공자 등록</h1>
        <p class="text-sm text-white/60 mb-6">
          행복복지센터, 실버타운, 노인회관 등 공공·복지 기관과
          요양보호사, 간병인 등 개인 서비스 제공자를 등록할 수 있습니다.
          등록 후 관리자 승인 시 이용할 수 있습니다.
        </p>

        <div v-if="needLogin" class="text-center py-10">
          <p class="text-white/70 mb-4">기관 등록은 로그인이 필요합니다.</p>
          <NuxtLink
            to="/"
            class="bg-blue-800 text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-900 transition"
          >
            로그인하러 가기
          </NuxtLink>
        </div>

        <form v-else @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-white/80 mb-1.5">
              {{ isCaregiver ? "이름 또는 상호" : "기관명" }} <span class="text-red-300">*</span>
            </label>
            <input v-model="form.name" required maxlength="200"
              :placeholder="isCaregiver ? '예: 김요양' : ''"
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-white/80 mb-1.5">
              {{ isCaregiver ? "제공 유형" : "기관 유형" }} <span class="text-red-300">*</span>
            </label>
            <select v-model="form.orgType" required
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400">
              <option value="" disabled class="bg-slate-800">선택해주세요</option>
              <option v-for="t in orgTypes" :key="t" :value="t" class="bg-slate-800">{{ t }}</option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-white/80 mb-1.5">{{ isCaregiver ? "자격증/자격 (선택)" : "사업자등록번호" }}</label>
              <input v-model="form.businessNumber" maxlength="50"
                :placeholder="isCaregiver ? '예: 요양보호사 자격증' : ''"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-white/80 mb-1.5">대표 연락처</label>
              <input v-model="form.phone" maxlength="50" placeholder="010-0000-0000"
                class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-white/80 mb-1.5">{{ isCaregiver ? "서비스 지역" : "주소" }}</label>
            <input v-model="form.address" maxlength="500"
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-white/80 mb-1.5">{{ isCaregiver ? "자기소개·경력·서비스 안내" : "기관 소개" }}</label>
            <textarea v-model="form.description" rows="3" maxlength="2000"
              :placeholder="isCaregiver ? '예: 요양보호사 5년 경력, 방문 요양·간병 서비스 가능 지역 등' : ''"
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"></textarea>
            <p v-if="isCaregiver" class="text-xs text-sky-300 mt-1.5">
              승인 후 '요양·간병' 또는 '방문서비스' 분류로 서비스를 등록하면 이용자가 예약할 수 있습니다.
              가격은 1회/시간당 단가, 소요 시간은 서비스 시간으로 입력해주세요.
            </p>
          </div>

          <div class="border-t border-white/10 pt-4">
            <h2 class="font-semibold text-white mb-1">정산 계좌 (선택)</h2>
            <p class="text-xs text-white/50 mb-3">
              예약 대금에서 플랫폼 수수료를 제외한 금액이 이 계좌로 정산됩니다.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input v-model="form.bankName" maxlength="50" placeholder="은행명 (예: 국민은행)"
                class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
              <input v-model="form.bankAccount" maxlength="100" placeholder="계좌번호"
                class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
              <input v-model="form.accountHolder" maxlength="100" placeholder="예금주"
                class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400" />
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
          <p v-if="success" class="text-sm text-emerald-300">{{ success }}</p>

          <button type="submit" :disabled="loading"
            class="w-full bg-blue-800 text-white font-bold py-4 rounded-xl hover:bg-blue-900 transition text-lg disabled:opacity-40">
            {{ loading ? "등록 중..." : "등록 신청" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const router = useRouter();

const orgTypes = ["행복복지센터", "실버타운", "노인회관", "복지관", "요양보호사", "간병인", "기타"];
const isCaregiver = computed(() => ["요양보호사", "간병인"].includes(form.orgType));
const needLogin = ref(false);
const loading = ref(false);
const error = ref("");
const success = ref("");
const userId = ref<number | null>(null);

const form = reactive({
  name: "",
  orgType: "",
  businessNumber: "",
  phone: "",
  address: "",
  description: "",
  bankName: "",
  bankAccount: "",
  accountHolder: "",
});

onMounted(() => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      needLogin.value = true;
      return;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId.value = payload.sub ? Number(payload.sub) : null;
    if (!userId.value) needLogin.value = true;
  } catch {
    needLogin.value = true;
  }
});

const submit = async () => {
  if (!userId.value) return;
  loading.value = true;
  error.value = "";
  success.value = "";
  try {
    const res = await fetch(`${config.public.apiBase}/operators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId.value,
        name: form.name,
        orgType: form.orgType,
        businessNumber: form.businessNumber || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        description: form.description || undefined,
        bankName: form.bankName || undefined,
        bankAccount: form.bankAccount || undefined,
        accountHolder: form.accountHolder || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "등록에 실패했습니다");
    success.value = "기관 등록 신청이 완료되었습니다. 관리자 승인 후 이용할 수 있습니다.";
    setTimeout(() => router.push("/operator"), 1500);
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>
