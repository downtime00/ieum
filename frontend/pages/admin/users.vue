<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-5xl">

      <header class="mb-8">
        <NuxtLink to="/admin/dashboard" class="text-sm text-slate-500 hover:text-slate-800">
          ← 관리자 대시보드
        </NuxtLink>
        <h1 class="text-3xl font-bold text-slate-900 mt-2">사용자 메뉴 관리</h1>
        <p class="text-slate-500 mt-1">
          사용자가 대시보드에서 볼 수 있는 메뉴를 개별로 설정합니다
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 사용자 목록 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <div class="flex gap-2 mb-4">
            <input
              v-model="keyword"
              type="text"
              placeholder="이름 또는 이메일로 검색"
              class="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              @keyup.enter="searchUsers"
            />
            <button
              @click="searchUsers"
              class="bg-slate-900 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-700 transition"
            >
              검색
            </button>
          </div>

          <div class="border border-slate-200 rounded-xl max-h-[480px] overflow-y-auto">
            <button
              v-for="u in users"
              :key="u.id"
              @click="selectUser(u)"
              class="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-stone-50 text-left transition"
              :class="selected?.id === u.id ? 'bg-blue-50' : ''"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-800 truncate">
                  {{ u.name || "(이름 없음)" }}
                  <span class="text-xs text-slate-400">#{{ u.id }}</span>
                </p>
                <p class="text-sm text-slate-500 truncate">
                  {{ u.email || "-" }} · {{ u.role }}
                </p>
              </div>
              <span
                v-if="u.menuKeys"
                class="text-xs px-2 py-1 rounded-full bg-violet-100 text-violet-700 shrink-0"
              >
                메뉴 {{ u.menuKeys.length }}개 지정
              </span>
              <span
                v-else
                class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500 shrink-0"
              >
                자동
              </span>
            </button>
            <p v-if="users.length === 0" class="px-4 py-6 text-center text-sm text-slate-400">
              {{ loadingUsers ? "불러오는 중..." : "사용자가 없습니다." }}
            </p>
          </div>

          <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-4">
            <button
              v-for="p in totalPages"
              :key="p"
              @click="page = p; loadUsers()"
              class="w-9 h-9 rounded-lg text-sm font-semibold transition"
              :class="p === page ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            >
              {{ p }}
            </button>
          </div>
        </section>

        <!-- 메뉴 설정 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <template v-if="selected">
            <h2 class="font-semibold text-slate-800 mb-1">
              {{ selected.name || "(이름 없음)" }}
              <span class="text-sm font-normal text-slate-500">#{{ selected.id }}</span>
            </h2>
            <p class="text-sm text-slate-500 mb-5">
              {{ selected.email || "-" }} · {{ selected.role }}
            </p>

            <p class="text-sm font-semibold text-slate-700 mb-3">표시할 메뉴 선택</p>
            <div class="space-y-2 mb-6">
              <label
                v-for="opt in menuOptions"
                :key="opt.key"
                class="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-stone-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="opt.key"
                  v-model="editKeys"
                  class="w-4 h-4 accent-blue-600"
                />
                <span class="flex-1 font-medium text-slate-800">{{ opt.label }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full"
                  :class="opt.provider ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-slate-100 text-slate-500'"
                >{{ opt.provider ? "제공자" : "사용자" }}</span>
              </label>
            </div>

            <p v-if="result" class="text-sm mb-4" :class="result.ok ? 'text-emerald-600' : 'text-red-600'">
              {{ result.message }}
            </p>

            <div class="flex gap-3">
              <button
                @click="saveMenus"
                :disabled="saving"
                class="flex-1 bg-blue-700 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition disabled:opacity-40"
              >
                {{ saving ? "저장 중..." : "메뉴 저장" }}
              </button>
              <button
                @click="resetMenus"
                :disabled="saving"
                class="bg-slate-100 text-slate-600 font-semibold py-3 px-5 rounded-xl hover:bg-slate-200 transition disabled:opacity-40"
              >
                자동으로 복원
              </button>
            </div>
            <p class="text-xs text-slate-400 mt-3">
              * 자동 복원 시 기관 등록 여부에 따라 메뉴가 자동 결정됩니다.
            </p>
          </template>
          <p v-else class="text-sm text-slate-400 py-10 text-center">
            왼쪽 목록에서 사용자를 선택하세요.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import { apiFetch } from "~/utils/auth";

const config = useRuntimeConfig();

const users = ref<any[]>([]);
const selected = ref<any | null>(null);
const keyword = ref("");
const page = ref(1);
const totalPages = ref(1);
const loadingUsers = ref(false);
const editKeys = ref<string[]>([]);
const saving = ref(false);
const result = ref<{ ok: boolean; message: string } | null>(null);

// 표시 순서 = 저장 순서 (대시보드 타일 순서)
const menuOptions = [
  { key: "operator", label: "기관 관리", provider: true },
  { key: "programs", label: "공연·강의/서비스", provider: false },
  { key: "bookings", label: "내 예약", provider: false },
  { key: "medications", label: "약·병원", provider: false },
  { key: "culture", label: "문화정보", provider: false },
  { key: "board", label: "게시판", provider: false },
];

const loadUsers = async () => {
  loadingUsers.value = true;
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      limit: "20",
    });
    if (keyword.value) params.set("keyword", keyword.value);
    const res = await fetch(`${config.public.apiBase}/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      users.value = data.items;
      totalPages.value = Math.max(1, Math.ceil(data.total / data.limit));
    }
  } catch (e) {
    console.error("사용자 목록 로딩 실패:", e);
  } finally {
    loadingUsers.value = false;
  }
};

const searchUsers = () => {
  page.value = 1;
  loadUsers();
};

const selectUser = (u: any) => {
  selected.value = u;
  // 저장된 순서 그대로 표시 순서로 사용
  editKeys.value = Array.isArray(u.menuKeys) ? [...u.menuKeys] : [];
  result.value = null;
};

const saveMenus = async () => {
  if (!selected.value) return;
  saving.value = true;
  result.value = null;
  try {
    const res = await apiFetch(
      config.public.apiBase,
      `/admin/users/${selected.value.id}/menus`,
      {
        method: "PUT",
        body: JSON.stringify({ menuKeys: editKeys.value }),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      result.value = { ok: true, message: "메뉴 설정이 저장되었습니다." };
      selected.value.menuKeys = [...editKeys.value];
      const u = users.value.find((x) => x.id === selected.value.id);
      if (u) u.menuKeys = [...editKeys.value];
    } else {
      result.value = { ok: false, message: data.message || "저장에 실패했습니다." };
    }
  } catch (e: any) {
    result.value = { ok: false, message: e?.message || "저장에 실패했습니다." };
  } finally {
    saving.value = false;
  }
};

const resetMenus = async () => {
  if (!selected.value) return;
  saving.value = true;
  result.value = null;
  try {
    const res = await apiFetch(
      config.public.apiBase,
      `/admin/users/${selected.value.id}/menus`,
      {
        method: "PUT",
        body: JSON.stringify({ menuKeys: null }),
      },
    );
    if (res.ok) {
      result.value = { ok: true, message: "자동 메뉴로 복원되었습니다." };
      selected.value.menuKeys = null;
      editKeys.value = [];
      const u = users.value.find((x) => x.id === selected.value.id);
      if (u) u.menuKeys = null;
    } else {
      const data = await res.json().catch(() => ({}));
      result.value = { ok: false, message: data.message || "복원에 실패했습니다." };
    }
  } catch (e: any) {
    result.value = { ok: false, message: e?.message || "복원에 실패했습니다." };
  } finally {
    saving.value = false;
  }
};

onMounted(loadUsers);
</script>
