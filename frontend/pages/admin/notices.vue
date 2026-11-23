<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <header class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">공지사항 관리</h1>
          <p class="text-slate-500 mt-1">
            사용자 대시보드 상단에 노출되는 공지를 작성합니다
          </p>
        </div>
        <div class="flex gap-2">
          <NuxtLink
            to="/admin/dashboard"
            class="text-sm px-4 py-2 rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition"
          >
            관리자 화면
          </NuxtLink>
          <button
            @click="openForm()"
            class="text-sm px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition"
          >
            + 공지 작성
          </button>
        </div>
      </header>

      <div v-if="loading" class="text-center py-12 text-slate-500">
        불러오는 중...
      </div>

      <div
        v-else-if="items.length === 0"
        class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-10 text-center text-slate-500"
      >
        등록된 공지사항이 없습니다.
      </div>

      <div v-else class="space-y-3">
        <article
          v-for="n in items"
          :key="n.id"
          class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5"
          :class="{ 'border-amber-300 bg-amber-50/40': n.isPinned }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="font-bold text-slate-900">{{ n.title }}</h2>
                <span
                  v-if="n.isPinned"
                  class="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                  >📌 고정</span
                >
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  :class="
                    n.scope === 'public'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  "
                  >{{ n.scope === "public" ? "전체 공개" : "기관 한정" }}</span
                >
              </div>
              <p class="text-sm text-slate-500 mt-1 whitespace-pre-line">
                {{ n.content }}
              </p>
              <p class="text-xs text-slate-400 mt-2">
                {{ formatDate(n.createdAt) }}
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <button
                @click="togglePin(n)"
                class="text-xs px-3 py-1.5 rounded-lg border font-semibold transition"
                :class="
                  n.isPinned
                    ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                    : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-100'
                "
              >
                {{ n.isPinned ? "고정 해제" : "고정" }}
              </button>
              <button
                @click="openForm(n)"
                class="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white font-semibold hover:bg-slate-100 transition"
              >
                수정
              </button>
              <button
                @click="remove(n)"
                class="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 bg-white font-semibold hover:bg-red-50 transition"
              >
                삭제
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- 작성/수정 모달 -->
      <div
        v-if="showForm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="showForm = false"
      >
        <div
          class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <h2 class="text-xl font-bold text-slate-900 mb-5">
            {{ editingId ? "공지 수정" : "공지 작성" }}
          </h2>
          <form @submit.prevent="save" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1"
                >제목 *</label
              >
              <input
                v-model="form.title"
                required
                maxlength="200"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1"
                >내용 *</label
              >
              <textarea
                v-model="form.content"
                required
                rows="5"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-sm font-semibold text-slate-700 mb-1"
                  >공개 범위</label
                >
                <select
                  v-model="form.scope"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="public">전체 사용자</option>
                  <option value="private">기관 한정</option>
                </select>
              </div>
              <label
                class="flex items-center gap-2 mt-6 px-4 py-3 border border-slate-200 rounded-xl cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="form.isPinned"
                  class="w-5 h-5 accent-amber-500"
                />
                <span class="font-semibold text-slate-700">상단 고정</span>
              </label>
            </div>

            <div
              v-if="formError"
              class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
            >
              {{ formError }}
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="showForm = false"
                class="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-xl hover:bg-slate-200 transition"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-800 transition disabled:bg-slate-300"
              >
                {{ saving ? "저장 중..." : "저장" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "admin" });
import { apiFetch } from "~/utils/auth";

const config = useRuntimeConfig();

interface Notice {
  id: string;
  title: string;
  content: string;
  scope: "public" | "private";
  isPinned: boolean;
  organizationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const items = ref<Notice[]>([]);
const loading = ref(false);
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const formError = ref("");

const emptyForm = () => ({
  title: "",
  content: "",
  scope: "public" as "public" | "private",
  isPinned: false,
});
const form = ref(emptyForm());

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("ko-KR") : "";

const load = async () => {
  loading.value = true;
  try {
    const res = await fetch(
      `${config.public.apiBase}/admin/notices?limit=50`,
    );
    if (res.ok) {
      const data = await res.json();
      items.value = data.items || [];
    }
  } catch (e) {
    console.error("공지 목록 로딩 실패:", e);
  } finally {
    loading.value = false;
  }
};

const openForm = (n?: Notice) => {
  formError.value = "";
  if (n) {
    editingId.value = n.id;
    form.value = {
      title: n.title,
      content: n.content,
      scope: n.scope || "public",
      isPinned: !!n.isPinned,
    };
  } else {
    editingId.value = null;
    form.value = emptyForm();
  }
  showForm.value = true;
};

const save = async () => {
  saving.value = true;
  formError.value = "";
  try {
    const res = editingId.value
      ? await apiFetch(
          config.public.apiBase,
          `/admin/notices/${editingId.value}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title: form.value.title,
              content: form.value.content,
              scope: form.value.scope,
              isPinned: form.value.isPinned,
            }),
          },
        )
      : await apiFetch(config.public.apiBase, "/admin/notices", {
          method: "POST",
          body: JSON.stringify({
            title: form.value.title,
            content: form.value.content,
            scope: form.value.scope,
            isPinned: form.value.isPinned,
          }),
        });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        Array.isArray(data.message) ? data.message[0] : data.message || "저장에 실패했습니다.",
      );
    }
    showForm.value = false;
    await load();
  } catch (e: any) {
    formError.value = e?.message || "저장에 실패했습니다.";
  } finally {
    saving.value = false;
  }
};

const togglePin = async (n: Notice) => {
  try {
    const res = await apiFetch(
      config.public.apiBase,
      `/admin/notices/${n.id}/pin`,
      {
        method: "PUT",
        body: JSON.stringify({ pinned: !n.isPinned }),
      },
    );
    if (res.ok) await load();
  } catch (e) {
    console.error("고정 토글 실패:", e);
  }
};

const remove = async (n: Notice) => {
  if (!confirm(`'${n.title}' 공지를 삭제할까요?`)) return;
  try {
    const res = await apiFetch(
      config.public.apiBase,
      `/admin/notices/${n.id}`,
      { method: "DELETE" },
    );
    if (res.ok) await load();
  } catch (e) {
    console.error("삭제 실패:", e);
  }
};

onMounted(load);
</script>
