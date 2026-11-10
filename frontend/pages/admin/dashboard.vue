<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <header class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">관리자 화면</h1>
          <p class="text-slate-500 mt-1">{{ $t("app.name") }}</p>
        </div>
        <NuxtLink
          to="/dashboard"
          class="text-sm px-4 py-2 rounded-xl bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition"
        >
          사용자 화면으로
        </NuxtLink>
      </header>

      <div v-if="loading" class="text-center py-12 text-slate-500">
        불러오는 중...
      </div>

      <template v-else>
        <!-- 전체 통계 -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
            <p class="text-sm text-slate-500">전체 사용자</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">
              {{ stats.overview?.totalUsers ?? "-" }}
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
            <p class="text-sm text-slate-500">콘텐츠</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">
              {{ stats.overview?.totalContents ?? "-" }}
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
            <p class="text-sm text-slate-500">이벤트 참여</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">
              {{ stats.overview?.totalParticipations ?? "-" }}
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
            <p class="text-sm text-slate-500">공지사항</p>
            <p class="text-3xl font-bold text-slate-900 mt-1">
              {{ stats.overview?.totalNotices ?? "-" }}
            </p>
          </div>
        </section>

        <!-- 최근 7일 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 mb-6">
          <h2 class="font-semibold text-slate-800 mb-4">최근 7일 신규</h2>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-blue-700">
                {{ daily.newUsers ?? 0 }}
              </p>
              <p class="text-sm text-slate-500">신규 사용자</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-blue-700">
                {{ daily.newContents ?? 0 }}
              </p>
              <p class="text-sm text-slate-500">신규 콘텐츠</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-blue-700">
                {{ daily.newParticipations ?? 0 }}
              </p>
              <p class="text-sm text-slate-500">신규 참여</p>
            </div>
          </div>
        </section>

        <!-- 이벤트 참여 상태 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 mb-6">
          <h2 class="font-semibold text-slate-800 mb-4">이벤트 참여 현황</h2>
          <div class="grid grid-cols-4 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-emerald-600">
                {{ stats.participation?.registered ?? 0 }}
              </p>
              <p class="text-sm text-slate-500">신청</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-blue-700">
                {{ stats.participation?.attended ?? 0 }}
              </p>
              <p class="text-sm text-slate-500">참석</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-500">
                {{ stats.participation?.cancelled ?? 0 }}
              </p>
              <p class="text-sm text-slate-500">취소</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-700">
                {{ stats.participation?.completed ?? 0 }}
              </p>
              <p class="text-sm text-slate-500">완료</p>
            </div>
          </div>
        </section>

        <!-- 인기 콘텐츠 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 mb-6">
          <h2 class="font-semibold text-slate-800 mb-4">인기 콘텐츠 TOP 5</h2>
          <ul class="divide-y divide-slate-100">
            <li
              v-for="(item, i) in popular"
              :key="item.id"
              class="py-3 flex items-center justify-between"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span
                  class="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center shrink-0"
                >
                  {{ i + 1 }}
                </span>
                <span class="text-slate-800 truncate">{{ item.title }}</span>
              </div>
              <span class="text-sm text-slate-500 shrink-0 ml-4"
                >조회 {{ item.views ?? 0 }}</span
              >
            </li>
            <li v-if="popular.length === 0" class="py-3 text-sm text-slate-400">
              데이터 없음
            </li>
          </ul>
        </section>

        <!-- 공개 그룹 등록 -->
        <section class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 mb-6">
          <h2 class="font-semibold text-slate-800 mb-1">공개 그룹 등록</h2>
          <p class="text-sm text-slate-500 mb-4">
            아파트 관리 공지, 동네 모임 등 — 사용자가 그룹 찾기에서 검색/가입할
            수 있습니다.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              v-model="groupForm.name"
              placeholder="그룹 이름 (예: 래미안 아파트)"
              class="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              v-model="groupForm.address"
              placeholder="주소/위치 (선택)"
              class="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              v-model="groupForm.description"
              placeholder="설명 (선택)"
              class="border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="createGroup"
              :disabled="!groupForm.name.trim() || groupSaving"
              class="bg-blue-800 text-white font-semibold py-2.5 px-6 rounded-xl text-sm hover:bg-blue-900 disabled:opacity-40 transition"
            >
              {{ groupSaving ? "등록 중..." : "그룹 등록" }}
            </button>
            <span
              v-if="groupMsg"
              class="text-sm"
              :class="groupMsgOk ? 'text-green-600' : 'text-red-500'"
              >{{ groupMsg }}</span
            >
          </div>

          <!-- 등록된 그룹 목록 -->
          <div
            v-if="groups.length > 0"
            class="mt-5 border-t border-slate-100 pt-4"
          >
            <p class="text-sm font-semibold text-slate-600 mb-2">
              등록된 그룹 ({{ groups.length }})
            </p>
            <div class="space-y-2">
              <div
                v-for="g in groups"
                :key="g.id"
                class="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-2.5"
              >
                <div class="min-w-0">
                  <p class="font-medium text-slate-800 text-sm truncate">
                    {{ g.name }}
                  </p>
                  <p class="text-xs text-slate-400">
                    멤버 {{ g.memberCount }}명 ·
                    {{ g.hasInviteCode ? "초대코드 발급됨" : "초대코드 없음" }}
                  </p>
                </div>
                <button
                  @click="openGroupInvite(g)"
                  class="shrink-0 ml-3 text-xs font-semibold text-blue-700 border border-blue-300 rounded-xl px-3 py-1.5 hover:bg-blue-50 transition"
                >
                  초대코드/QR
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 메뉴 -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            to="/admin/logs"
            class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:border-blue-400 hover:shadow-md transition group"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-slate-800">로그 히스토리</h3>
                <p class="text-sm text-slate-500 mt-0.5">시스템 로그 조회</p>
              </div>
              <span
                class="text-slate-400 group-hover:text-blue-700 text-xl transition"
                >→</span
              >
            </div>
          </NuxtLink>
          <NuxtLink
            to="/admin/register"
            class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:border-blue-400 hover:shadow-md transition group"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-slate-800">관리자 등록</h3>
                <p class="text-sm text-slate-500 mt-0.5">새 관리자 계정 생성</p>
              </div>
              <span
                class="text-slate-400 group-hover:text-blue-700 text-xl transition"
                >→</span
              >
            </div>
          </NuxtLink>
          <NuxtLink
            to="/admin/notify"
            class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:border-blue-400 hover:shadow-md transition group"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-slate-800">알림 보내기</h3>
                <p class="text-sm text-slate-500 mt-0.5">
                  특정인/그룹/전체 푸시 발송
                </p>
              </div>
              <span
                class="text-slate-400 group-hover:text-blue-700 text-xl transition"
                >→</span
              >
            </div>
          </NuxtLink>
          <NuxtLink
            to="/culture"
            class="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 hover:border-blue-400 hover:shadow-md transition group"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-slate-800">문화 정보</h3>
                <p class="text-sm text-slate-500 mt-0.5">
                  사용자 화면 미리보기
                </p>
              </div>
              <span
                class="text-slate-400 group-hover:text-blue-700 text-xl transition"
                >→</span
              >
            </div>
          </NuxtLink>
        </section>
      </template>
    </div>

    <!-- 그룹 초대코드 / QR 모달 -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showInviteModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <h2 class="text-xl font-bold text-slate-900 mb-1">그룹 초대코드</h2>
        <p class="text-sm text-slate-500 mb-4">{{ inviteGroup?.name }}</p>
        <div v-if="inviteLoading" class="py-10 text-slate-400">
          불러오는 중...
        </div>
        <template v-else-if="inviteData">
          <img
            v-if="inviteQr"
            :src="inviteQr"
            alt="QR"
            class="mx-auto rounded-xl border border-slate-200 mb-4"
          />
          <div class="bg-stone-50 border border-slate-200 rounded-xl py-3 mb-2">
            <span class="text-2xl font-bold tracking-[0.3em] text-slate-800">{{
              inviteData.code
            }}</span>
          </div>
          <p class="text-xs text-slate-400 mb-4">
            {{
              inviteData.expiresAt
                ? `유효기간: ${new Date(inviteData.expiresAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}까지 (20분)`
                : "유효기간: 무제한"
            }}
          </p>
          <div class="flex gap-2 justify-center">
            <button
              @click="copyInviteCode"
              class="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-200 transition"
            >
              {{ inviteCopied ? "복사됨" : "코드 복사" }}
            </button>
            <button
              @click="regenGroupInvite"
              class="bg-white text-blue-700 border border-blue-300 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-50 transition"
            >
              새 코드
            </button>
          </div>
        </template>
        <button
          @click="showInviteModal = false"
          class="mt-4 text-slate-500 hover:text-slate-700 text-sm"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from "qrcode";

const router = useRouter();
const config = useRuntimeConfig();

const loading = ref(true);
const stats = ref<any>({});
const daily = ref<any>({});
const popular = ref<any[]>([]);

// 그룹 등록
const groupForm = reactive({ name: "", address: "", description: "" });
const groupSaving = ref(false);
const groupMsg = ref("");
const groupMsgOk = ref(false);
const groups = ref<any[]>([]);

// 그룹 초대코드 / QR
const showInviteModal = ref(false);
const inviteGroup = ref<any | null>(null);
const inviteLoading = ref(false);
const inviteData = ref<{ code: string; expiresAt: string | null } | null>(null);
const inviteQr = ref("");
const inviteCopied = ref(false);

const createGroup = async () => {
  groupSaving.value = true;
  groupMsg.value = "";
  try {
    const res = await fetch(`${config.public.apiBase}/admin/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupForm.name.trim(),
        address: groupForm.address.trim() || null,
        description: groupForm.description.trim() || null,
      }),
    });
    if (!res.ok) throw new Error("등록 실패");
    groupMsg.value = "그룹이 등록되었습니다.";
    groupMsgOk.value = true;
    groupForm.name = "";
    groupForm.address = "";
    groupForm.description = "";
    loadGroups();
  } catch {
    groupMsg.value = "등록에 실패했습니다.";
    groupMsgOk.value = false;
  } finally {
    groupSaving.value = false;
  }
};

const loadGroups = async () => {
  try {
    const res = await fetch(`${config.public.apiBase}/admin/groups`);
    if (res.ok) groups.value = await res.json();
  } catch {}
};

const loadGroupInvite = async (regenerate = false) => {
  if (!inviteGroup.value) return;
  inviteLoading.value = true;
  try {
    const res = await fetch(
      `${config.public.apiBase}/admin/groups/${inviteGroup.value.id}/invite-code`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      },
    );
    if (res.ok) {
      inviteData.value = await res.json();
      const inviteUrl = `${window.location.origin}/board?invite=${inviteData.value.code}`;
      inviteQr.value = await QRCode.toDataURL(inviteUrl, {
        width: 200,
        margin: 1,
      });
      const g = groups.value.find((x) => x.id === inviteGroup.value.id);
      if (g) g.hasInviteCode = true;
    }
  } finally {
    inviteLoading.value = false;
  }
};

const openGroupInvite = (g: any) => {
  inviteGroup.value = g;
  inviteData.value = null;
  inviteQr.value = "";
  inviteCopied.value = false;
  showInviteModal.value = true;
  loadGroupInvite();
};

const regenGroupInvite = () => loadGroupInvite(true);

const copyInviteCode = async () => {
  if (!inviteData.value) return;
  try {
    await navigator.clipboard.writeText(inviteData.value.code);
    inviteCopied.value = true;
    setTimeout(() => (inviteCopied.value = false), 2000);
  } catch {}
};

onMounted(async () => {
  // 관리자 권한 체크
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

  loadGroups();

  try {
    const [statsRes, dailyRes, popularRes] = await Promise.all([
      fetch(`${config.public.apiBase}/admin/dashboard/stats`),
      fetch(`${config.public.apiBase}/admin/dashboard/daily-stats`),
      fetch(
        `${config.public.apiBase}/admin/dashboard/popular-contents?limit=5`,
      ),
    ]);
    if (statsRes.ok) stats.value = await statsRes.json();
    if (dailyRes.ok) daily.value = await dailyRes.json();
    if (popularRes.ok) popular.value = await popularRes.json();
  } catch (e) {
    console.error("관리자 통계 로딩 실패:", e);
  } finally {
    loading.value = false;
  }
});
</script>
