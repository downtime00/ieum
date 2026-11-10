<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-4xl">

      <header class="mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">알림 보내기</h1>
          <p class="text-slate-500 mt-1">
            특정 사용자, 그룹 또는 전체에게 알림을 발송합니다
          </p>
        </div>
      </header>

      <div class="space-y-6">
        <!-- 발송 대상 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-slate-800">발송 대상</h2>
            <label
              class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="sendToAll"
                class="w-4 h-4 accent-blue-600"
              />
              전체 사용자에게 보내기
            </label>
          </div>

          <template v-if="!sendToAll">
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

            <div
              class="border border-slate-200 rounded-xl max-h-72 overflow-y-auto"
            >
              <label
                v-for="u in users"
                :key="u.id"
                class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-stone-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="u.id"
                  v-model="selectedIds"
                  class="w-4 h-4 accent-blue-600"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-800 truncate">
                    {{ u.name || "(이름 없음)" }}
                  </p>
                  <p class="text-sm text-slate-500 truncate">
                    {{ u.email || "-" }} · {{ u.role }}
                  </p>
                </div>
              </label>
              <p
                v-if="users.length === 0"
                class="px-4 py-6 text-center text-sm text-slate-400"
              >
                {{ loadingUsers ? "불러오는 중..." : "사용자가 없습니다." }}
              </p>
            </div>

            <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-4">
              <button
                v-for="p in totalPages"
                :key="p"
                @click="
                  page = p;
                  loadUsers();
                "
                class="px-3 py-1.5 rounded-xl text-sm"
                :class="
                  page === p
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                "
              >
                {{ p }}
              </button>
            </div>

            <p class="mt-3 text-sm text-slate-500">
              {{
                sendToAll ? "전체 사용자" : `선택됨: ${selectedIds.length}명`
              }}
            </p>
          </template>
        </section>

        <!-- 알림 내용 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6">
          <h2 class="font-semibold text-slate-800 mb-4">알림 내용</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2"
                >제목</label
              >
              <input
                v-model="form.title"
                type="text"
                maxlength="200"
                placeholder="알림 제목"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2"
                >내용</label
              >
              <textarea
                v-model="form.body"
                rows="4"
                maxlength="1000"
                placeholder="알림 내용을 입력하세요"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2"
                >유형</label
              >
              <select
                v-model="form.type"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
              >
                <option value="ANNOUNCEMENT">공지</option>
                <option value="INFO">정보</option>
                <option value="ALERT">긴급</option>
                <option value="CONTENT">콘텐츠</option>
                <option value="FAMILY">가족</option>
              </select>
            </div>
          </div>
        </section>

        <button
          @click="send"
          :disabled="
            sending ||
            !form.title ||
            !form.body ||
            (!sendToAll && selectedIds.length === 0)
          "
          class="w-full bg-blue-800 text-white font-semibold py-4 px-6 rounded-2xl hover:bg-blue-900 transition disabled:bg-slate-300 disabled:cursor-not-allowed text-lg"
        >
          {{ sending ? "발송 중..." : "알림 발송" }}
        </button>

        <div
          v-if="result"
          class="p-4 rounded-xl"
          :class="
            result.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          "
        >
          {{ result.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const config = useRuntimeConfig();

const users = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const keyword = ref("");
const page = ref(1);
const totalPages = ref(1);
const loadingUsers = ref(false);
const sendToAll = ref(false);

const form = ref({
  title: "",
  body: "",
  type: "ANNOUNCEMENT",
});

const sending = ref(false);
const result = ref<{ ok: boolean; message: string } | null>(null);

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

const send = async () => {
  sending.value = true;
  result.value = null;
  try {
    const res = await fetch(`${config.public.apiBase}/admin/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.value.title,
        body: form.value.body,
        type: form.value.type,
        all: sendToAll.value,
        userIds: sendToAll.value ? undefined : selectedIds.value,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      result.value = {
        ok: true,
        message: `알림이 ${data.userCount}명에게 발송되었습니다. (푸시 포함)`,
      };
      form.value.title = "";
      form.value.body = "";
      selectedIds.value = [];
      sendToAll.value = false;
    } else {
      result.value = {
        ok: false,
        message: data.message || "발송에 실패했습니다.",
      };
    }
  } catch (e: any) {
    result.value = { ok: false, message: e?.message || "발송에 실패했습니다." };
  } finally {
    sending.value = false;
  }
};

onMounted(() => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    router.push("/");
    return;
  }
  const storedUser = localStorage.getItem("user");
  let isAdmin = false;
  try {
    const user = storedUser ? JSON.parse(storedUser) : null;
    isAdmin = user && ["ADMIN", "SUPER_ADMIN", "REVIEWER"].includes(user.role);
  } catch {}
  if (!isAdmin) {
    router.push("/dashboard");
    return;
  }
  loadUsers();
});
</script>
