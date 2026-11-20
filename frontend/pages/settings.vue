<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8">
      <div class="ieum-panel rounded-3xl p-4 sm:p-6">

      <!-- 알림 받기 (웹 푸시) -->
      <section
        v-if="pushSupported"
        class="bg-white/10 rounded-2xl p-6 mb-4"
      >
        <h2 class="font-semibold text-white mb-1">
          {{ $t("push.title") }}
        </h2>
        <p class="text-sm text-white/60 mb-4">
          {{ pushSubscribed ? $t("push.enabled") : $t("push.desc") }}
        </p>
        <p v-if="pushError" class="text-sm text-red-300 mb-3">
          {{ pushError }}
        </p>
        <button
          @click="pushSubscribed ? disablePush() : enablePush()"
          :disabled="pushLoading"
          :class="
            pushSubscribed
              ? 'bg-white/15 text-white/70 hover:bg-white/25'
              : 'bg-sky-500 text-white hover:bg-sky-400'
          "
          class="font-semibold py-3 px-6 rounded-xl transition disabled:opacity-40"
        >
          {{
            pushLoading
              ? "..."
              : pushSubscribed
                ? $t("push.disable")
                : $t("push.enable")
          }}
        </button>
      </section>

      <!-- 진동 설정 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">
          {{ $t("settings.vibration") }}
        </h2>
        <p class="text-sm text-white/60 mb-5">
          {{ $t("settings.vibrationDesc") }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button
            @click="toggleVibration"
            :class="
              vibrationOn
                ? 'bg-sky-500 text-white'
                : 'bg-white/10 text-white/70'
            "
            class="font-semibold py-3 px-8 rounded-xl transition text-lg"
          >
            {{
              vibrationOn
                ? $t("settings.vibrationOn")
                : $t("settings.vibrationOff")
            }}
          </button>
          <button
            v-if="vibrationOn && canVibrate"
            @click="testVibrate"
            class="bg-white/10 text-sky-300 border border-sky-400/40 font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition"
          >
            {{ $t("settings.testVibration") }}
          </button>
        </div>
        <p
          v-if="vibrationOn && !canVibrate"
          class="mt-3 text-xs text-white/40"
        >
          {{ $t("settings.vibrationUnsupported") }}
        </p>
      </section>

      <!-- 알림 표시 개수 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">
          {{ $t("settings.notificationCount") }}
        </h2>
        <p class="text-sm text-white/60 mb-5">
          {{ $t("settings.notificationCountDesc") }}
        </p>

        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <button
            v-for="n in countOptions"
            :key="n"
            @click="selectCount(n)"
            :class="
              count === n
                ? 'bg-sky-500 text-white border-sky-400'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            "
            class="py-4 rounded-xl border-2 text-xl font-bold transition"
          >
            {{ n }}
          </button>
        </div>
        <p class="mt-4 text-sm text-white/60">
          {{ $t("settings.currentSetting") }}:
          <span class="font-semibold text-white"
            >{{ count }}{{ $t("settings.countUnit") }}</span
          >
        </p>
      </section>

      <!-- 시스템 점검 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">
          {{ $t("status.title") }}
        </h2>
        <p class="text-sm text-white/60 mb-5">
          {{ $t("status.desc") }}
        </p>
        <button
          @click="router.push('/status')"
          class="bg-white/15 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/25 transition"
        >
          {{ $t("status.open") }}
        </button>
      </section>

      <!-- 개인정보처리방침 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">개인정보처리방침</h2>
        <p class="text-sm text-white/60 mb-5">
          수집하는 정보와 이용 목적을 확인합니다.
        </p>
        <button
          @click="router.push('/privacy')"
          class="bg-white/15 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/25 transition"
        >
          보기
        </button>
      </section>

      <!-- 기관·사업자 등록 신청 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">기관·사업자 등록 신청</h2>
        <p class="text-sm text-white/60 mb-5">
          행복복지센터·실버타운·요양보호사·간병인 등 기관/개인 사업자를
          등록하면 프로그램 등록과 예약 관리가 가능합니다. 관리자 승인 후
          이용할 수 있습니다.
        </p>

        <!-- 로그인 필요 -->
        <div v-if="!loggedIn" class="text-center py-4">
          <button
            @click="router.push('/')"
            class="bg-sky-500 text-white font-semibold py-3 px-8 rounded-xl hover:bg-sky-400 transition"
          >
            로그인 후 신청하기
          </button>
        </div>

        <div v-else-if="opLoading" class="text-white/50 text-sm py-2">
          확인 중...
        </div>

        <!-- 승인 대기 -->
        <div
          v-else-if="myOperator && myOperator.status === 'PENDING'"
          class="bg-amber-400/15 border border-amber-400/40 rounded-xl p-4"
        >
          <p class="font-bold text-amber-200">⏳ 승인 대기 중</p>
          <p class="text-sm text-white/70 mt-1">
            '{{ myOperator.name }}' 등록 신청이 관리자 승인 대기 중입니다.
            승인되면 프로그램 등록과 예약 관리가 가능합니다.
          </p>
          <NuxtLink
            to="/operator"
            class="inline-block mt-3 text-sm text-sky-300 underline"
            >기관 관리 페이지 보기</NuxtLink
          >
        </div>

        <!-- 승인 완료 -->
        <div
          v-else-if="myOperator && myOperator.status === 'APPROVED'"
          class="bg-emerald-400/15 border border-emerald-400/40 rounded-xl p-4"
        >
          <p class="font-bold text-emerald-200">✅ 등록 완료</p>
          <p class="text-sm text-white/70 mt-1">
            '{{ myOperator.name }}'({{ myOperator.orgType }}) — 프로그램 등록과
            예약 관리가 가능합니다.
          </p>
          <NuxtLink
            to="/operator"
            class="inline-block mt-3 text-sm text-sky-300 underline"
            >기관 관리로 이동</NuxtLink
          >
        </div>

        <!-- 반려 -->
        <div
          v-else-if="myOperator && myOperator.status === 'REJECTED'"
          class="bg-red-400/15 border border-red-400/40 rounded-xl p-4"
        >
          <p class="font-bold text-red-200">❌ 등록 반려됨</p>
          <p class="text-sm text-white/70 mt-1">
            '{{ myOperator.name }}' 등록이 반려되었습니다. 자세한 내용은
            관리자에게 문의해주세요.
          </p>
        </div>

        <!-- 신청 폼 (미등록) -->
        <form
          v-else
          @submit.prevent="submitOperator"
          class="space-y-4"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="opForm.name"
              required
              maxlength="200"
              placeholder="기관명 또는 이름 *"
              class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
            />
            <select
              v-model="opForm.orgType"
              required
              class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-400"
            >
              <option value="" disabled class="ieum-panel">유형 선택 *</option>
              <option
                v-for="t in orgTypes"
                :key="t"
                :value="t"
                class="ieum-panel"
              >
                {{ t }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              v-model="opForm.businessNumber"
              maxlength="50"
              :placeholder="isCareType ? '자격증/자격 (선택)' : '사업자등록번호'"
              class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
            />
            <input
              v-model="opForm.phone"
              maxlength="50"
              placeholder="대표 연락처"
              class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
            />
          </div>
          <input
            v-model="opForm.address"
            maxlength="500"
            :placeholder="isCareType ? '서비스 지역' : '주소'"
            class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
          />
          <textarea
            v-model="opForm.description"
            rows="2"
            maxlength="2000"
            :placeholder="isCareType ? '자기소개·경력·서비스 안내' : '기관 소개'"
            class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
          ></textarea>

          <div class="border-t border-white/10 pt-3">
            <p class="text-xs text-white/50 mb-2">
              정산 계좌 (선택) — 예약 대금에서 수수료를 제외한 금액이 입금됩니다
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                v-model="opForm.bankName"
                maxlength="50"
                placeholder="은행명"
                class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
              />
              <input
                v-model="opForm.bankAccount"
                maxlength="100"
                placeholder="계좌번호"
                class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
              />
              <input
                v-model="opForm.accountHolder"
                maxlength="100"
                placeholder="예금주"
                class="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <p v-if="opError" class="text-sm text-red-300">{{ opError }}</p>
          <p v-if="opSuccess" class="text-sm text-emerald-300">{{ opSuccess }}</p>

          <button
            type="submit"
            :disabled="opLoading"
            class="w-full bg-sky-500 text-white font-bold py-3.5 rounded-xl hover:bg-sky-400 transition disabled:opacity-40"
          >
            {{ opLoading ? "신청 중..." : "등록 신청하기" }}
          </button>
        </form>
      </section>

      <!-- 계정 / 로그아웃 -->
      <section class="bg-white/10 rounded-2xl p-6 mb-4">
        <h2 class="font-semibold text-white mb-1">
          {{ $t("settings.account") }}
        </h2>
        <p class="text-sm text-white/60 mb-5">
          {{
            loggedIn
              ? userEmail || $t("settings.loggedIn")
              : $t("settings.notLoggedIn")
          }}
        </p>
        <button
          v-if="loggedIn"
          @click="doLogout"
          :disabled="logoutLoading"
          class="bg-red-500/80 text-white font-semibold py-3 px-8 rounded-xl hover:bg-red-500 transition disabled:opacity-40"
        >
          {{ logoutLoading ? "..." : $t("settings.logout") }}
        </button>
        <button
          v-else
          @click="router.push('/')"
          class="bg-sky-500 text-white font-semibold py-3 px-8 rounded-xl hover:bg-sky-400 transition"
        >
          {{ $t("settings.goLogin") }}
        </button>
      </section>

      <!-- 저장 안내 -->
      <div
        class="bg-sky-500/20 border border-sky-400/30 rounded-2xl p-5 text-sm text-sky-200"
      >
        {{ $t("settings.autoSaveNotice") }}
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiFetch } from "~/utils/auth";

const router = useRouter();
const runtimeConfig = useRuntimeConfig();
const apiBase = runtimeConfig.public.apiBase as string;
const STORAGE_KEY = "notificationDisplayCount";
const VIBRATION_KEY = "ieum_vibration";
const DEFAULT_COUNT = 2;
const MAX_COUNT = 10;

const countOptions = Array.from({ length: MAX_COUNT - 1 }, (_, i) => i + 2); // 2~10

const count = ref(DEFAULT_COUNT);

// 웹 푸시 구독
const {
  supported: pushSupported,
  subscribed: pushSubscribed,
  loading: pushLoading,
  error: pushError,
  subscribe: subscribePush,
  unsubscribe: unsubscribePush,
} = usePushNotifications();

const enablePush = () => subscribePush();
const disablePush = () => unsubscribePush();

// 계정 / 로그아웃
const loggedIn = ref(false);
const userEmail = ref("");
const logoutLoading = ref(false);

const doLogout = async () => {
  logoutLoading.value = true;
  try {
    await logout(runtimeConfig.public.apiBase as string);
  } finally {
    logoutLoading.value = false;
    await navigateTo("/");
  }
};

// 진동 설정 (localStorage + 쿠키 — 서비스 워커가 쿠키를 읽어 알림 진동 적용)
const vibrationOn = ref(true);
const canVibrate = ref(false);

const VIBRATION_PATTERN = [200, 100, 200];

const applyVibrationCookie = (on: boolean) => {
  document.cookie = `${VIBRATION_KEY}=${on ? 1 : 0};path=/;max-age=31536000;SameSite=Lax`;
};

const toggleVibration = () => {
  vibrationOn.value = !vibrationOn.value;
  localStorage.setItem(VIBRATION_KEY, vibrationOn.value ? "1" : "0");
  applyVibrationCookie(vibrationOn.value);
};

const testVibrate = () => {
  if (canVibrate.value) navigator.vibrate(VIBRATION_PATTERN);
};

const selectCount = (n: number) => {
  count.value = n;
  localStorage.setItem(STORAGE_KEY, String(n));
};

// 기관·사업자 등록 신청
const orgTypes = [
  "행복복지센터",
  "실버타운",
  "노인회관",
  "복지관",
  "요양보호사",
  "간병인",
  "기타",
];
const isCareType = computed(() =>
  ["요양보호사", "간병인"].includes(opForm.orgType),
);
const opForm = reactive({
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
const myOperator = ref<any>(null);
const opLoading = ref(false);
const opError = ref("");
const opSuccess = ref("");
const userId = ref<number | null>(null);

const loadMyOperator = async () => {
  if (!userId.value) return;
  try {
    const res = await apiFetch(apiBase, `/operators/me/${userId.value}`);
    if (res.ok) myOperator.value = await res.json();
  } catch {
    /* 조회 실패 시 신청 폼 표시 */
  }
};

const submitOperator = async () => {
  if (!userId.value) return;
  opLoading.value = true;
  opError.value = "";
  opSuccess.value = "";
  try {
    const res = await apiFetch(apiBase, "/operators", {
      method: "POST",
      body: JSON.stringify({
        userId: userId.value,
        name: opForm.name,
        orgType: opForm.orgType,
        businessNumber: opForm.businessNumber || undefined,
        phone: opForm.phone || undefined,
        address: opForm.address || undefined,
        description: opForm.description || undefined,
        bankName: opForm.bankName || undefined,
        bankAccount: opForm.bankAccount || undefined,
        accountHolder: opForm.accountHolder || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        Array.isArray(data.message)
          ? data.message[0]
          : data.message || "신청에 실패했습니다.",
      );
    }
    opSuccess.value = "등록 신청이 완료되었습니다. 관리자 승인 후 이용할 수 있습니다.";
    await loadMyOperator();
  } catch (e: any) {
    opError.value = e?.message || "신청에 실패했습니다.";
  } finally {
    opLoading.value = false;
  }
};

onMounted(() => {
  // 로그인 상태 확인
  const token = localStorage.getItem("accessToken");
  loggedIn.value = !!token;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId.value = payload.sub ? Number(payload.sub) : null;
      const user = JSON.parse(localStorage.getItem("user") || "null");
      userEmail.value = user?.email || user?.name || "";
    } catch {}
    loadMyOperator();
  }

  // 설정은 로컬 저장소 기반이라 로그인 없이도 사용 가능
  const saved = parseInt(localStorage.getItem(STORAGE_KEY) || "", 10);
  if (!isNaN(saved)) {
    count.value = Math.min(Math.max(saved, 2), MAX_COUNT);
  }

  // 진동 설정 복원 (localStorage 우선, 없으면 쿠키)
  const vibSaved = localStorage.getItem(VIBRATION_KEY);
  if (vibSaved !== null) {
    vibrationOn.value = vibSaved === "1";
  } else {
    vibrationOn.value = !document.cookie.includes(`${VIBRATION_KEY}=0`);
  }
  applyVibrationCookie(vibrationOn.value);
  canVibrate.value = typeof navigator !== "undefined" && "vibrate" in navigator;
});
</script>
