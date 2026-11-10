<template>
  <div class="min-h-screen bg-stone-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <div class="bg-white rounded-xl shadow-md p-8">
        <h1 class="text-3xl font-bold text-center mb-8">관리자 등록</h1>

        <form @submit.prevent="registerAdmin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >이름</label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              placeholder="관리자 이름"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >이메일</label
            >
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >비밀번호</label
            >
            <input
              v-model="form.password"
              type="password"
              required
              minlength="8"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              placeholder="최소 8자 이상"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >역할</label
            >
            <select
              v-model="form.role"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
            >
              <option value="ADMIN">관리자</option>
              <option value="SUPER_ADMIN">슈퍼 관리자</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >생년월일 (선택)</label
            >
            <input
              v-model="form.birthDate"
              type="date"
              class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-800 text-white font-semibold py-4 px-6 rounded-xl hover:bg-blue-900 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {{ loading ? "등록 중..." : "관리자 등록" }}
          </button>
        </form>

        <div
          v-if="error"
          class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
        >
          {{ error }}
        </div>

        <div
          v-if="success"
          class="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
        >
          {{ success }}
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();

const form = ref({
  name: "",
  email: "",
  password: "",
  role: "ADMIN",
  birthDate: "",
});

const loading = ref(false);
const error = ref("");
const success = ref("");

const registerAdmin = async () => {
  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const response = await fetch(`${config.public.apiBase}/admin/admins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form.value),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "관리자 등록에 실패했습니다.");
    }

    success.value = "관리자가 성공적으로 등록되었습니다.";
    form.value = {
      name: "",
      email: "",
      password: "",
      role: "ADMIN",
      birthDate: "",
    };
  } catch (err: any) {
    error.value = err.message || "관리자 등록에 실패했습니다.";
  } finally {
    loading.value = false;
  }
};
</script>
