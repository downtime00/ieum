<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <div class="container mx-auto px-4 py-8 flex-1 flex flex-col">
      <!-- 상단 설정: 언어 / 어르신 모드 / 음성 안내 -->
      <div class="flex justify-end items-center gap-2 mb-10">
        <button
          @click="toggleVoice"
          :class="
            voiceEnabled
              ? 'bg-blue-800 text-white'
              : 'bg-white text-slate-700 border border-slate-300'
          "
          class="text-xs px-3 py-1.5 rounded-xl hover:opacity-90 transition"
        >
          {{ voiceEnabled ? $t("senior.voiceOff") : $t("senior.voiceOn") }}
        </button>
        <button
          @click="toggleSenior"
          :class="
            seniorEnabled
              ? 'bg-blue-800 text-white'
              : 'bg-white text-slate-700 border border-slate-300'
          "
          class="text-xs px-3 py-1.5 rounded-xl hover:opacity-90 transition"
        >
          {{ seniorEnabled ? $t("senior.disable") : $t("senior.enable") }}
        </button>
        <button
          @click="switchLocale"
          class="text-xs px-3 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition"
        >
          {{ locale === "ko" ? "EN" : "한" }}
        </button>
      </div>

      <div class="flex-1 flex flex-col justify-center">
        <div class="text-center mb-10">
          <h1
            class="text-5xl font-bold tracking-tight bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 bg-clip-text text-transparent"
          >
            {{ $t("app.name") }}
          </h1>
          <div
            class="mx-auto mt-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-800 to-indigo-500"
          ></div>
        </div>

        <div
          class="bg-white rounded-3xl border border-slate-200/70 shadow-[0_24px_60px_-24px_rgba(30,41,59,0.25)] p-8 sm:p-10"
        >
        <h2 class="text-xl font-semibold text-center text-slate-800 mb-6">
          {{ $t("auth.login") }}
        </h2>

        <!-- 이메일 로그인 폼 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">{{
              $t("auth.email")
            }}</label>
            <input
              v-model="email"
              type="email"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              :placeholder="$t('auth.emailPlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1.5">{{
              $t("auth.password")
            }}</label>
            <input
              v-model="password"
              type="password"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              :placeholder="$t('auth.passwordPlaceholder')"
            />
          </div>
          <button
            @click="emailLogin"
            :disabled="loading"
            class="w-full bg-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-blue-900 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {{ loading ? $t("auth.loggingIn") : $t("auth.loginWithEmail") }}
          </button>
        </div>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-white text-slate-400">{{
              $t("auth.or")
            }}</span>
          </div>
        </div>

        <!-- SNS 로그인 -->
        <div class="space-y-3">
          <button
            @click="loginWithKakao"
            class="w-full bg-[#FEE500] text-[#191600] font-semibold py-3.5 px-6 rounded-xl hover:opacity-90 transition"
          >
            {{ $t("auth.loginWithKakao") }}
          </button>

          <button
            @click="loginWithNaver"
            class="w-full bg-[#03C75A] text-white font-semibold py-3.5 px-6 rounded-xl hover:opacity-90 transition"
          >
            {{ $t("auth.loginWithNaver") }}
          </button>

          <button
            @click="loginWithGoogle"
            class="w-full bg-white border border-slate-300 text-slate-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-stone-50 transition"
          >
            {{ $t("auth.loginWithGoogle") }}
          </button>
        </div>

        <!-- 게스트 모드: 로그인 없이 이용 -->
        <NuxtLink
          to="/dashboard"
          class="mt-4 w-full block text-center bg-slate-100 text-slate-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-slate-200 transition"
        >
          {{ $t("auth.guestStart") }}
        </NuxtLink>

        <div class="mt-6 text-center">
          <p class="text-slate-500">
            {{ $t("auth.noAccount") }}
            <button
              @click="showRegister = true"
              class="text-blue-700 hover:text-blue-800 font-semibold"
            >
              {{ $t("auth.register") }}
            </button>
          </p>
        </div>

        <div
          v-if="error"
          class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
        >
          {{ error }}
        </div>
        </div>
      </div>

      <!-- 회원가입 모달 -->
      <div
        v-if="showRegister"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-2xl p-8 max-w-md w-full">
          <h2 class="text-xl font-semibold mb-6 text-center text-slate-800">
            {{ $t("auth.registerTitle") }}
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{
                $t("auth.name")
              }}</label>
              <input
                v-model="registerName"
                type="text"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                :placeholder="$t('auth.namePlaceholder')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{
                $t("auth.email")
              }}</label>
              <input
                v-model="registerEmail"
                type="email"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                :placeholder="$t('auth.emailPlaceholder')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{
                $t("auth.password")
              }}</label>
              <input
                v-model="registerPassword"
                type="password"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                :placeholder="$t('auth.passwordHint')"
              />
            </div>
            <button
              @click="emailRegister"
              :disabled="registerLoading"
              class="w-full bg-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-blue-900 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {{
                registerLoading ? $t("auth.registering") : $t("auth.register")
              }}
            </button>
            <button
              @click="showRegister = false"
              class="w-full bg-slate-100 text-slate-600 font-semibold py-3.5 px-6 rounded-xl hover:bg-slate-200 transition"
            >
              {{ $t("auth.cancel") }}
            </button>
          </div>
          <div
            v-if="registerError"
            class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
          >
            {{ registerError }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const { locale, setLocale, t } = useI18n();
const { enabled: seniorEnabled, toggle: toggleSenior } = useSeniorMode();
const { enabled: voiceEnabled, toggle: toggleVoice } = useSpeech();

const switchLocale = () => {
  setLocale(locale.value === "ko" ? "en" : "ko");
};

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const showRegister = ref(false);
const registerName = ref("");
const registerEmail = ref("");
const registerPassword = ref("");
const registerLoading = ref(false);
const registerError = ref("");

const emailLogin = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch(`${config.public.apiBase}/auth/email/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || t("auth.loginFailed"));
    }

    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/dashboard";
  } catch (err: any) {
    error.value = err.message || t("auth.loginFailed");
  } finally {
    loading.value = false;
  }
};

const emailRegister = async () => {
  registerLoading.value = true;
  registerError.value = "";

  try {
    const response = await fetch(
      `${config.public.apiBase}/auth/email/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerEmail.value,
          password: registerPassword.value,
          name: registerName.value,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || t("auth.registerFailed"));
    }

    const data = await response.json();
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    showRegister.value = false;
    window.location.href = "/dashboard";
  } catch (err: any) {
    registerError.value = err.message || t("auth.registerFailed");
  } finally {
    registerLoading.value = false;
  }
};

const loginWithKakao = () => {
  window.location.href = `${config.public.apiBase}/auth/kakao`;
};

const loginWithNaver = () => {
  window.location.href = `${config.public.apiBase}/auth/naver`;
};

const loginWithGoogle = () => {
  window.location.href = `${config.public.apiBase}/auth/google`;
};
</script>
