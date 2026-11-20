<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <header class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">기관 유형 관리</h1>
          <p class="text-slate-500 mt-1">
            기관·사업자 등록 신청 시 선택할 수 있는 유형을 관리합니다.
            비활성화한 유형은 신규 신청에서 선택할 수 없습니다.
          </p>
        </div>
        <NuxtLink
          to="/admin/dashboard"
          class="text-sm px-4 py-2 rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition"
        >
          관리자 화면
        </NuxtLink>
      </header>

      <!-- 유형 추가 -->
      <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 mb-6">
        <h2 class="font-bold text-slate-800 mb-3">유형 추가</h2>
        <form @submit.prevent="create" class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[160px]">
            <label class="block text-xs text-slate-500 mb-1">유형명 *</label>
            <input
              v-model="form.name"
              required
              maxlength="50"
              placeholder="예: 재가복지시설"
              class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">구분 *</label>
            <select
              v-model="form.group"
              class="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="institution">기관</option>
              <option value="individual">개인</option>
            </select>
          </div>
          <div class="w-24">
            <label class="block text-xs text-slate-500 mb-1">정렬</label>
            <input
              v-model.number="form.sortOrder"
              type="number"
              min="0"
              max="999"
              class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            :disabled="saving"
            class="bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl hover:bg-blue-800 transition text-sm disabled:opacity-40"
          >
            {{ saving ? "추가 중..." : "추가" }}
          </button>
        </form>
        <p v-if="formError" class="text-sm text-red-600 mt-2">{{ formError }}</p>
        <p v-if="formSuccess" class="text-sm text-emerald-600 mt-2">{{ formSuccess }}</p>
      </section>

      <!-- 유형 목록 -->
      <div v-if="loading" class="text-center py-12 text-slate-500">불러오는 중...</div>

      <template v-else>
        <section v-for="g in groups" :key="g.key" class="mb-6">
          <h2 class="font-bold text-slate-700 mb-3">
            {{ g.label }}
            <span class="text-sm font-normal text-slate-400">({{ g.items.length }})</span>
          </h2>
          <div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm divide-y divide-slate-100">
            <div
              v-for="t in g.items"
              :key="t.id"
              class="flex items-center justify-between gap-3 px-5 py-3.5"
            >
              <div class="min-w-0 flex items-center gap-2">
                <span class="font-semibold text-slate-800">{{ t.name }}</span>
                <span
                  v-if="!t.isActive"
                  class="text-xs font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full"
                >
                  비활성
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs text-slate-400">정렬 {{ t.sortOrder }}</span>
                <button
                  @click="toggleActive(t)"
                  :disabled="acting === t.id"
                  class="text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-40"
                  :class="t.isActive
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
                >
                  {{ t.isActive ? "비활성화" : "활성화" }}
                </button>
                <button
                  @click="rename(t)"
                  :disabled="acting === t.id"
                  class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition disabled:opacity-40"
                >
                  이름 변경
                </button>
                <button
                  v-if="t.isActive"
                  @click="deactivate(t)"
                  :disabled="acting === t.id"
                  class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-40"
                >
                  삭제
                </button>
              </div>
            </div>
            <p v-if="g.items.length === 0" class="px-5 py-6 text-sm text-slate-400 text-center">
              등록된 유형이 없습니다.
            </p>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiFetch } from "~/utils/auth";

const config = useRuntimeConfig();
const apiBase = config.public.apiBase as string;

interface OrgType {
  id: string;
  name: string;
  group: "institution" | "individual";
  sortOrder: number;
  isActive: boolean;
}

const items = ref<OrgType[]>([]);
const loading = ref(false);
const saving = ref(false);
const acting = ref<string | null>(null);
const formError = ref("");
const formSuccess = ref("");
const form = reactive({ name: "", group: "institution", sortOrder: 99 });

const groups = computed(() => [
  { key: "institution", label: "기관", items: items.value.filter((t) => t.group === "institution") },
  { key: "individual", label: "개인", items: items.value.filter((t) => t.group === "individual") },
]);

const load = async () => {
  loading.value = true;
  try {
    const res = await apiFetch(apiBase, "/operators/org-types/all");
    if (res.ok) items.value = await res.json();
  } catch (e) {
    console.error("기관 유형 로딩 실패:", e);
  } finally {
    loading.value = false;
  }
};

const create = async () => {
  formError.value = "";
  formSuccess.value = "";
  saving.value = true;
  try {
    const res = await apiFetch(apiBase, "/operators/org-types", {
      method: "POST",
      body: JSON.stringify({
        name: form.name.trim(),
        group: form.group,
        sortOrder: form.sortOrder,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || "추가에 실패했습니다.");
    }
    formSuccess.value = `'${data.name}' 유형이 추가되었습니다.`;
    form.name = "";
    form.sortOrder = 99;
    await load();
  } catch (e: any) {
    formError.value = e?.message || "추가에 실패했습니다.";
  } finally {
    saving.value = false;
  }
};

const toggleActive = async (t: OrgType) => {
  acting.value = t.id;
  try {
    const res = await apiFetch(apiBase, `/operators/org-types/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    if (res.ok) await load();
    else alert("변경에 실패했습니다.");
  } finally {
    acting.value = null;
  }
};

const rename = async (t: OrgType) => {
  const name = prompt("새 유형명을 입력하세요:", t.name);
  if (!name || name.trim() === t.name) return;
  acting.value = t.id;
  try {
    const res = await apiFetch(apiBase, `/operators/org-types/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) await load();
    else alert(data.message || "이름 변경에 실패했습니다.");
  } finally {
    acting.value = null;
  }
};

const deactivate = async (t: OrgType) => {
  if (!confirm(`'${t.name}' 유형을 삭제(비활성화)할까요?\n이미 이 유형으로 등록된 기관은 그대로 유지됩니다.`)) return;
  acting.value = t.id;
  try {
    const res = await apiFetch(apiBase, `/operators/org-types/${t.id}`, { method: "DELETE" });
    if (res.ok) await load();
    else alert("삭제에 실패했습니다.");
  } finally {
    acting.value = null;
  }
};

onMounted(load);
</script>
