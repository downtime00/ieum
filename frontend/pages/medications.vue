<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
      <div class="flex items-center justify-end gap-2 mb-4">
        <NuxtLink
          to="/settings"
          class="bg-white/10 text-white border border-white/20 font-semibold py-2.5 px-5 rounded-xl hover:bg-white/20 transition text-sm"
        >
          {{ $t("settings.title") }}
        </NuxtLink>
        <button
          @click="openForm()"
          class="bg-sky-500 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-sky-400 transition text-sm"
        >
          + {{ $t("medications.addNew") }}
        </button>
      </div>

      <!-- 목록 -->
      <div v-if="loading" class="text-center py-16 text-white/50 text-lg">
        {{ $t("common.loading") }}
      </div>
      <div
        v-else-if="items.length === 0"
        class="text-center py-16 text-white/50 text-lg"
      >
        {{ $t("medications.empty") }}
      </div>

      <div
        v-else
        class="flex gap-4 pt-1 overflow-x-auto snap-x snap-mandatory pb-4"
      >
        <article
          v-for="m in items"
          :key="m.id"
          class="w-[24rem] shrink-0 snap-start bg-white/10 rounded-2xl p-6"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-xl font-bold text-white">{{ m.name }}</h3>
                <span
                  v-if="m.subjectName"
                  class="text-xs font-semibold bg-violet-400/30 text-violet-100 px-2 py-1 rounded-full"
                >
                  {{
                    $t("medications.forFamily", {
                      name: m.subjectName,
                      relation: m.subjectRelation || "",
                    })
                  }}
                </span>
                <span
                  v-if="isExpired(m)"
                  class="text-xs font-semibold bg-white/15 text-white/60 px-2 py-1 rounded-full"
                >
                  {{ $t("medications.expired") }}
                </span>
              </div>
              <p v-if="m.dosage" class="text-white/70 mt-1">{{ m.dosage }}</p>
            </div>
            <div class="flex gap-2 shrink-0 flex-wrap justify-end">
              <button
                @click="openForm(m)"
                class="text-sm text-white border border-white/30 rounded-xl px-4 py-1.5 hover:bg-white/10 transition"
              >
                {{ $t("medications.edit") }}
              </button>
              <button
                @click="remove(m)"
                class="text-sm text-red-300 border border-red-400/40 rounded-xl px-4 py-1.5 hover:bg-red-400/20 transition"
              >
                {{ $t("medications.delete") }}
              </button>
            </div>
          </div>

          <dl class="mt-4 space-y-2 text-sm">
            <div v-if="m.timesPerDay" class="flex gap-3">
              <dt class="w-28 flex-shrink-0 font-semibold text-white/50">
                {{ $t("medications.frequency") }}
              </dt>
              <dd class="text-white/85">
                {{ $t("medications.perDay", { count: m.timesPerDay }) }}
                <span v-if="m.reminderTimes" class="text-slate-500"
                  >({{ m.reminderTimes }})</span
                >
              </dd>
            </div>
            <div v-if="m.startDate || m.endDate" class="flex gap-3">
              <dt class="w-28 flex-shrink-0 font-semibold text-white/50">
                {{ $t("medications.period") }}
              </dt>
              <dd class="text-white/85">
                {{ m.startDate || "-" }} ~
                {{ m.endDate || $t("medications.noEnd") }}
              </dd>
            </div>
            <div v-if="m.precautions" class="flex gap-3">
              <dt class="w-28 flex-shrink-0 font-semibold text-amber-600">
                {{ $t("medications.precautions") }}
              </dt>
              <dd class="text-white/85 whitespace-pre-line">
                {{ m.precautions }}
              </dd>
            </div>
            <div v-if="m.appointmentDate" class="flex gap-3">
              <dt class="w-28 flex-shrink-0 font-semibold text-blue-700">
                {{ $t("medications.nextAppointment") }}
              </dt>
              <dd class="text-white/85">
                {{ formatDate(m.appointmentDate) }}
                <span v-if="m.appointmentNote" class="text-white/50">
                  — {{ m.appointmentNote }}</span
                >
              </dd>
            </div>
            <div v-if="m.memo" class="flex gap-3">
              <dt class="w-28 flex-shrink-0 font-semibold text-white/50">
                {{ $t("medications.memo") }}
              </dt>
              <dd class="text-white/85 whitespace-pre-line">{{ m.memo }}</dd>
            </div>
          </dl>
        </article>
      </div>

      </div>

      <!-- 추가/수정 폼 모달 -->
      <div
        v-if="showForm"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        @click.self="showForm = false"
      >
        <div
          class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <h2 class="text-2xl font-bold text-slate-900 mb-5">
            {{ editingId ? $t("medications.edit") : $t("medications.addNew") }}
          </h2>

          <form @submit.prevent="save" class="space-y-4">
            <!-- 복용 대상 (가족 등록) -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">{{
                $t("medications.subject")
              }}</label>
              <div class="flex gap-2 mb-2">
                <button
                  type="button"
                  @click="form.isFamily = false"
                  :class="
                    !form.isFamily
                      ? 'bg-blue-800 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  "
                  class="flex-1 py-2.5 rounded-xl border font-semibold transition"
                >
                  {{ $t("medications.subjectSelf") }}
                </button>
                <button
                  type="button"
                  @click="form.isFamily = true"
                  :class="
                    form.isFamily
                      ? 'bg-blue-800 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  "
                  class="flex-1 py-2.5 rounded-xl border font-semibold transition"
                >
                  {{ $t("medications.subjectFamily") }}
                </button>
              </div>
              <div v-if="form.isFamily" class="grid grid-cols-2 gap-3">
                <input
                  v-model="form.subjectName"
                  maxlength="100"
                  :placeholder="$t('medications.familyName')"
                  class="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
                <input
                  v-model="form.subjectRelation"
                  maxlength="50"
                  :placeholder="$t('medications.relation')"
                  class="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1"
                >{{ $t("medications.name") }} *</label
              >
              <input
                v-model="form.name"
                required
                maxlength="200"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-sm font-semibold text-slate-700 mb-1"
                  >{{ $t("medications.dosage") }}</label
                >
                <input
                  v-model="form.dosage"
                  maxlength="100"
                  placeholder="예: 500mg 1정"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-semibold text-slate-700 mb-1"
                  >{{ $t("medications.timesPerDay") }}</label
                >
                <input
                  v-model.number="form.timesPerDay"
                  type="number"
                  min="1"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">{{
                $t("medications.reminderTimes")
              }}</label>
              <div class="space-y-2">
                <label
                  v-for="s in reminderSlots"
                  :key="s.key"
                  class="flex items-center gap-3 bg-stone-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    v-model="s.on"
                    class="w-5 h-5 accent-blue-600"
                  />
                  <span class="font-semibold text-slate-700 w-14">{{
                    $t(`medications.${s.key}`)
                  }}</span>
                  <input
                    v-model="s.time"
                    type="time"
                    :disabled="!s.on"
                    class="ml-auto px-3 py-1.5 border border-slate-300 rounded-xl text-sm disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </label>
                <input
                  v-model="customTimes"
                  :placeholder="$t('medications.customTimesPlaceholder')"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-700"
                />
                <p class="text-xs text-slate-400">
                  {{ $t("medications.reminderHint") }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-sm font-semibold text-slate-700 mb-1"
                  >{{ $t("medications.startDate") }}</label
                >
                <input
                  v-model="form.startDate"
                  type="date"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-semibold text-slate-700 mb-1"
                  >{{ $t("medications.endDate") }}</label
                >
                <input
                  v-model="form.endDate"
                  type="date"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-amber-600 mb-1">{{
                $t("medications.precautions")
              }}</label>
              <textarea
                v-model="form.precautions"
                rows="2"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-blue-700 mb-1">{{
                  $t("medications.appointmentDate")
                }}</label>
                <input
                  v-model="form.appointmentDate"
                  type="date"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-semibold text-slate-700 mb-1"
                  >{{ $t("medications.appointmentNote") }}</label
                >
                <input
                  v-model="form.appointmentNote"
                  maxlength="500"
                  placeholder="예: 내과 정기검진"
                  class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">{{
                $t("medications.memo")
              }}</label>
              <textarea
                v-model="form.memo"
                rows="2"
                class="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-700"
              ></textarea>
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
                class="flex-1 bg-slate-100 text-slate-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-slate-200 transition"
              >
                {{ $t("common.cancel") }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 bg-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-blue-900 transition disabled:bg-slate-300"
              >
                {{ saving ? $t("common.saving") : $t("common.save") }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const config = useRuntimeConfig();
const { t } = useI18n();

interface Medication {
  id: string;
  name: string;
  dosage?: string | null;
  timesPerDay?: number;
  reminderTimes?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  precautions?: string | null;
  appointmentDate?: string | null;
  appointmentNote?: string | null;
  memo?: string | null;
  isActive?: boolean;
  userId?: number | string;
  subjectName?: string | null;
  subjectRelation?: string | null;
}

const items = ref<Medication[]>([]);
const loading = ref(false);
const showForm = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const formError = ref("");
const userId = ref<number | null>(null);

const emptyForm = () => ({
  name: "",
  dosage: "",
  timesPerDay: 1,
  reminderTimes: "",
  startDate: "",
  endDate: "",
  precautions: "",
  appointmentDate: "",
  appointmentNote: "",
  memo: "",
  isFamily: false,
  subjectName: "",
  subjectRelation: "",
});
const form = ref(emptyForm());

// 복용 시간 슬롯: 아침/점심/저녁 체크박스 + 시간 선택
const reminderSlots = reactive([
  { key: "morning", time: "07:00", on: false },
  { key: "lunch", time: "12:00", on: false },
  { key: "dinner", time: "17:00", on: false },
]);
const customTimes = ref("");

const resetReminderSlots = (times?: string | null) => {
  reminderSlots.forEach((s) => {
    s.on = false;
  });
  customTimes.value = "";
  if (!times) return;
  const list = times
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const leftovers: string[] = [];
  for (const t of list) {
    const slot = reminderSlots.find((s) => s.time === t);
    if (slot) slot.on = true;
    else leftovers.push(t);
  }
  customTimes.value = leftovers.join(",");
};

const buildReminderTimes = (): string => {
  const times = reminderSlots.filter((s) => s.on && s.time).map((s) => s.time);
  const custom = customTimes.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return [...times, ...custom].join(",");
};

const isExpired = (m: Medication) => {
  if (!m.endDate) return false;
  return new Date(m.endDate) < new Date(new Date().toDateString());
};

const formatDate = (d?: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR");
};

const load = async () => {
  if (!userId.value) return;
  loading.value = true;
  try {
    const res = await fetch(
      `${config.public.apiBase}/medications?userId=${userId.value}`,
    );
    if (res.ok) items.value = await res.json();
  } catch (e) {
    console.error("복약 목록 로딩 실패:", e);
  } finally {
    loading.value = false;
  }
};

const openForm = (m?: Medication) => {
  formError.value = "";
  if (m) {
    editingId.value = m.id;
    form.value = {
      name: m.name,
      dosage: m.dosage || "",
      timesPerDay: m.timesPerDay || 1,
      reminderTimes: m.reminderTimes || "",
      startDate: m.startDate || "",
      endDate: m.endDate || "",
      precautions: m.precautions || "",
      appointmentDate: m.appointmentDate || "",
      appointmentNote: m.appointmentNote || "",
      memo: m.memo || "",
      isFamily: !!m.subjectName,
      subjectName: m.subjectName || "",
      subjectRelation: m.subjectRelation || "",
    };
    resetReminderSlots(m.reminderTimes);
  } else {
    editingId.value = null;
    form.value = emptyForm();
    resetReminderSlots(null);
  }
  showForm.value = true;
};

// 가족 대상 약 메모 → 가족 게시판에 자동 글 등록
const postMedToFamilyBoard = async (
  p: Record<string, any>,
  reminderTimes: string,
) => {
  try {
    const famRes = await fetch(
      `${config.public.apiBase}/board/families?userId=${userId.value}`,
    );
    if (!famRes.ok) return;
    const families = await famRes.json();
    const list = Array.isArray(families) ? families : [];
    // 비공개 가족 게시판 우선, 없으면 첫 번째 그룹
    const fam = list.find((f: any) => !f.isPublic) || list[0];
    if (!fam) return;
    const subject = `${p.subjectName || "가족"}${p.subjectRelation ? `(${p.subjectRelation})` : ""}`;
    const lines = [
      `💊 대상: ${subject}`,
      `약 이름: ${p.name}`,
      p.dosage ? `용량: ${p.dosage}` : null,
      reminderTimes ? `복용 시간: ${reminderTimes}` : null,
      p.startDate ? `시작일: ${p.startDate}` : null,
      p.endDate ? `종료일: ${p.endDate}` : null,
      p.appointmentDate
        ? `병원 예약: ${p.appointmentDate}${p.appointmentNote ? ` ${p.appointmentNote}` : ""}`
        : null,
      p.precautions ? `주의사항: ${p.precautions}` : null,
      p.memo ? `메모: ${p.memo}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    await fetch(`${config.public.apiBase}/board/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyId: fam.id,
        userId: userId.value,
        title: `💊 ${subject} 약 메모 등록`,
        content: lines,
      }),
    });
  } catch (e) {
    console.error("가족 게시판 자동 등록 실패:", e);
  }
};

const save = async () => {
  saving.value = true;
  formError.value = "";
  const reminderTimes = buildReminderTimes();
  const isNew = !editingId.value;
  const timesPerDay = reminderTimes
    ? reminderTimes.split(",").filter(Boolean).length
    : form.value.timesPerDay;
  const payload: any = {
    userId: userId.value,
    name: form.value.name,
    dosage: form.value.dosage || null,
    timesPerDay,
    reminderTimes: reminderTimes || null,
    startDate: form.value.startDate || null,
    endDate: form.value.endDate || null,
    precautions: form.value.precautions || null,
    appointmentDate: form.value.appointmentDate || null,
    appointmentNote: form.value.appointmentNote || null,
    memo: form.value.memo || null,
    subjectName: form.value.isFamily ? form.value.subjectName || null : null,
    subjectRelation: form.value.isFamily
      ? form.value.subjectRelation || null
      : null,
  };
  try {
    const url = editingId.value
      ? `${config.public.apiBase}/medications/${editingId.value}?userId=${userId.value}`
      : `${config.public.apiBase}/medications`;
    const res = await fetch(url, {
      method: editingId.value ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "저장에 실패했습니다.");
    }
    showForm.value = false;
    await load();
    // 새로 등록한 가족 대상 메모는 가족 게시판에 자동 공유
    if (isNew && form.value.isFamily) {
      await postMedToFamilyBoard(payload, reminderTimes);
    }
  } catch (e: any) {
    formError.value = e?.message || "저장에 실패했습니다.";
  } finally {
    saving.value = false;
  }
};

const remove = async (m: Medication) => {
  if (!confirm(t("medications.deleteConfirm", { name: m.name }))) return;
  try {
    await fetch(
      `${config.public.apiBase}/medications/${m.id}?userId=${userId.value}`,
      { method: "DELETE" },
    );
    await load();
  } catch (e) {
    console.error("삭제 실패:", e);
  }
};

onMounted(() => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    // 게스트 모드: 로그인 없이 로컬 ID 사용
    userId.value = getGuestUserId();
    load();
    return;
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId.value = payload.sub ? Number(payload.sub) : null;
  } catch {}
  if (!userId.value) {
    userId.value = getGuestUserId();
  }
  load();
});
</script>
