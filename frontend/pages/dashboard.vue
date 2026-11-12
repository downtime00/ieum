<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 pt-8 pb-28">
      <!-- 통합 대시보드 패널 -->
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6 mb-6">
      <!-- 날씨 타일 -->
      <div
        class="bg-white/10 rounded-xl p-4 mb-4 flex items-center justify-between gap-3"
      >
        <div>
          <p class="text-[10px] font-bold text-white/60 uppercase">
            {{ $t("weather.title") }}
          </p>
          <p class="text-2xl font-bold text-white leading-tight">
            {{ weather.temp != null ? `${weather.temp}°` : "–" }}
            <span v-if="weather.labelKey" class="text-sm font-semibold text-white/80"
              >{{ $t(weather.labelKey) }}</span
            >
          </p>
        </div>
          <div class="text-right space-y-1">
            <p
              v-for="(f, i) in weather.forecast"
              :key="i"
              class="text-xs text-white/70 whitespace-nowrap"
            >
              {{ $t(`weather.${["lunch", "evening", "tomorrowMorning"][i]}`) }}
              {{ f.temp != null ? `${f.temp}°` : "–" }}
              <span v-if="f.labelKey" class="text-white/50"
                >{{ $t(f.labelKey) }}</span
              >
            </p>
            <p v-if="!weather.forecast.length" class="text-xs text-white/60">
              {{ todayText }}
            </p>
          </div>
      </div>

      <!-- 영역 바로가기 타일 -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <NuxtLink
          to="/medications"
          class="bg-emerald-600 hover:bg-emerald-500 rounded-xl p-4 min-h-[72px] flex flex-col items-center justify-center transition"
        >
          <span class="text-sm font-bold text-white text-center leading-tight">{{
            $t("medications.title")
          }}</span>
        </NuxtLink>
        <NuxtLink
          to="/culture"
          class="bg-sky-600 hover:bg-sky-500 rounded-xl p-4 min-h-[72px] flex flex-col items-center justify-center transition"
        >
          <span class="text-sm font-bold text-white text-center leading-tight">{{
            $t("culture.title")
          }}</span>
        </NuxtLink>
        <NuxtLink
          to="/board"
          class="bg-amber-600 hover:bg-amber-500 rounded-xl p-4 min-h-[72px] flex flex-col items-center justify-center transition"
        >
          <span class="text-sm font-bold text-white text-center leading-tight">{{
            $t("board.title")
          }}</span>
        </NuxtLink>
        <NuxtLink
          to="/operators"
          class="bg-violet-600 hover:bg-violet-500 rounded-xl p-4 min-h-[72px] flex flex-col items-center justify-center transition"
        >
          <span class="text-sm font-bold text-white text-center leading-tight"
            >공연·강의 예약</span
          >
        </NuxtLink>
        <NuxtLink
          to="/bookings"
          class="bg-teal-600 hover:bg-teal-500 rounded-xl p-4 min-h-[72px] flex flex-col items-center justify-center transition"
        >
          <span class="text-sm font-bold text-white text-center leading-tight"
            >내 예약</span
          >
        </NuxtLink>
      </div>

      <!-- 위치 카드: 저장 완료/나중에 하기 상태에서는 숨김 -->
      <section
        v-if="showLocationCard"
        class="bg-white/10 rounded-2xl p-6 mb-6"
      >
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="font-semibold text-white">
                {{ $t("location.title") }}
              </h3>
              <template v-if="geoStatus === 'granted' && geoPosition">
                <p class="text-sm text-white/70">
                  {{ $t("location.savedActive") }}
                </p>
              </template>
              <template v-else-if="geoStatus === 'idle' && !promptDismissed">
                <p class="text-sm text-white/70">
                  {{ $t("location.askingSave") }}
                </p>
              </template>
              <template v-else-if="geoStatus === 'requesting'">
                <p class="text-sm text-white/70">
                  {{ $t("location.requesting") }}
                </p>
              </template>
              <template v-else-if="geoStatus === 'denied'">
                <p class="text-sm text-red-300">{{ $t("location.denied") }}</p>
                <p class="text-xs text-white/60 mt-1 leading-relaxed">
                  {{ $t("location.deniedGuide") }}
                </p>
              </template>
              <template v-else-if="geoStatus === 'unavailable'">
                <p class="text-sm text-white/70">
                  {{ $t("location.unavailable") }}
                </p>
              </template>
              <template v-else-if="geoStatus === 'unsupported'">
                <p class="text-sm text-white/70">
                  {{ $t("location.unsupported") }}
                </p>
              </template>
              <template v-else>
                <p class="text-sm text-white/70">
                  {{ $t("location.notSet") }}
                </p>
              </template>
            </div>
          </div>

          <div class="flex gap-2">
            <template v-if="geoStatus === 'idle' && !promptDismissed">
              <button
                @click="acceptAndSaveLocation"
                class="bg-blue-800 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-900 transition text-sm"
              >
                {{ $t("location.yesSave") }}
              </button>
              <button
                @click="dismissLocationPrompt"
                class="bg-slate-100 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-200 transition text-sm"
              >
                {{ $t("location.later") }}
              </button>
            </template>
            <button
              v-else-if="geoStatus === 'unavailable'"
              @click="requestGeo"
              class="bg-blue-800 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-900 transition text-sm"
            >
              {{ $t("location.retry") }}
            </button>
            <button
              v-else-if="geoStatus === 'granted'"
              @click="clearGeo"
              class="bg-slate-100 text-slate-600 font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-200 transition text-sm"
            >
              {{ $t("location.delete") }}
            </button>
          </div>
        </div>

        <!-- 수동 지역 설정: 위치 권한 없이 동네/주소 검색으로 설정 -->
        <div
          v-if="geoStatus !== 'granted'"
          class="mt-4 pt-4 border-t border-white/10"
        >
          <button
            @click="showManualSearch = !showManualSearch"
            class="text-sm text-sky-300 font-semibold hover:text-sky-200 transition"
          >
            {{
              showManualSearch
                ? $t("location.manualClose")
                : $t("location.manualOpen")
            }}
          </button>
          <div v-if="showManualSearch" class="mt-3">
            <div class="flex gap-2">
              <input
                v-model="manualQuery"
                type="text"
                :placeholder="$t('location.manualPlaceholder')"
                class="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 text-base focus:outline-none focus:border-sky-400"
                @keyup.enter="searchManualLocation"
              />
              <button
                @click="searchManualLocation"
                :disabled="manualLoading || !manualQuery.trim()"
                class="bg-blue-800 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-blue-900 transition text-sm disabled:opacity-40 whitespace-nowrap"
              >
                {{ manualLoading ? "..." : $t("location.search") }}
              </button>
            </div>
            <ul v-if="manualResults.length" class="mt-2 space-y-1">
              <li v-for="r in manualResults" :key="`${r.lat},${r.lng}`">
                <button
                  @click="applyManualLocation(r)"
                  class="w-full text-left bg-white/5 hover:bg-white/15 rounded-xl px-4 py-3 transition"
                >
                  <span class="block text-white font-semibold text-sm">
                    {{ r.name }}
                  </span>
                  <span class="block text-white/50 text-xs mt-0.5 break-all">
                    {{ r.address }}
                  </span>
                </button>
              </li>
            </ul>
            <p
              v-if="manualSearched && !manualResults.length"
              class="text-sm text-white/50 mt-2"
            >
              {{ $t("location.noResult") }}
            </p>
          </div>
        </div>
      </section>

      <!-- 통합 타일 그리드: 알림/문화/약/게시판 구분 없이 나열 -->
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
        <!-- 알림 타일: 누르면 읽음 처리 -->
        <div v-for="n in sortedNotifications" :key="`n-${n.id}`" class="relative">
          <button
            @click="onNotifClick(n)"
            class="worm-tile relative overflow-hidden rounded-xl p-3 flex flex-col justify-between min-h-[72px] text-left transition w-full"
            :class="
              n.isRead
                ? 'bg-white/5 opacity-60'
                : 'bg-white/15 hover:bg-white/25'
            "
          >
            <span class="absolute -bottom-3 -right-2 text-5xl opacity-25 select-none pointer-events-none">🔔</span>
            <span class="relative block pr-5">
              <span class="block text-xs font-semibold text-white line-clamp-2">{{
                n.title
              }}</span>
              <span v-if="n.createdAt" class="block text-[10px] text-white/60 mt-0.5">{{
                fmtDate(n.createdAt)
              }}</span>
            </span>
          </button>
          <button
            v-if="!n._board"
            @click.stop="deleteNotif(n)"
            class="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white text-xs leading-none"
            :aria-label="$t('notifications.deleteAria')"
          >×</button>
        </div>

        <!-- 약·병원 메모 타일: 클릭 시 복용 여부 선택 -->
        <button
          v-for="m in sortedMeds"
          :key="`m-${m.id}`"
          @click="openMedAction(m)"
          class="worm-tile relative overflow-hidden bg-emerald-600/90 hover:bg-emerald-500 rounded-xl p-3 flex flex-col justify-between min-h-[72px] text-left transition"
          :class="{
            'ring-2 ring-emerald-300': medStatus(m) === 'taken',
            'ring-2 ring-red-400': medStatus(m) === 'missed',
          }"
        >
          <span class="absolute -bottom-3 -right-2 text-5xl opacity-25 select-none pointer-events-none">💊</span>
          <span
            v-if="medStatus(m)"
            class="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            :class="
              medStatus(m) === 'taken'
                ? 'bg-emerald-300 text-emerald-900'
                : 'bg-red-400 text-white'
            "
            >{{ medStatus(m) === "taken" ? "✓" : "!" }}</span
          >
          <span class="relative">
            <span class="block text-xs font-semibold text-white line-clamp-2">{{
              m.name
            }}</span>
            <span class="block text-[10px] text-white/70 mt-0.5">{{
              medScheduleText(m)
            }}</span>
          </span>
        </button>

        <!-- 게시판 글 타일 -->
        <NuxtLink
          v-for="p in boardPosts.slice(0, 4)"
          :key="`p-${p.id}`"
          :to="`/board?post=${p.id}`"
          class="relative overflow-hidden bg-amber-600/90 hover:bg-amber-500 rounded-xl p-3 flex flex-col justify-between min-h-[72px] transition"
        >
          <span class="absolute -bottom-3 -right-2 text-5xl opacity-25 select-none pointer-events-none">💬</span>
          <span class="relative">
            <span class="block text-xs font-semibold text-white line-clamp-2">{{
              p.title
            }}</span>
            <span class="block text-[10px] text-white/70 mt-0.5">{{
              [p.authorName, fmtDate(p.createdAt)].filter(Boolean).join(" · ")
            }}</span>
          </span>
        </NuxtLink>

        <!-- 문화 정보 타일 -->
        <NuxtLink
          v-for="c in cultureItems.slice(0, 4)"
          :key="`c-${c.id}`"
          :to="`/culture/${c.id}`"
          class="relative overflow-hidden bg-sky-600/90 hover:bg-sky-500 rounded-xl p-3 flex flex-col justify-between min-h-[72px] transition"
        >
          <span class="absolute -bottom-3 -right-2 text-5xl opacity-25 select-none pointer-events-none">🎭</span>
          <span class="relative">
            <span class="block text-xs font-semibold text-white line-clamp-2">{{
              c.title
            }}</span>
            <span class="block text-[10px] text-white/70 mt-0.5">{{
              [fmtDate(c.eventDate), c.location].filter(Boolean).join(" · ")
            }}</span>
          </span>
        </NuxtLink>
      </div>

      <!-- 관리자 메뉴 -->
      <section
        v-if="isAdmin"
        class="bg-white/10 rounded-2xl p-6"
      >
        <h3 class="font-bold text-white mb-4">
          {{ $t("dashboard.adminMenu") }}
        </h3>
        <div class="flex gap-3 flex-wrap">
          <NuxtLink
            to="/admin/dashboard"
            class="bg-white text-slate-900 font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-200 transition text-sm"
          >
            {{ $t("dashboard.adminDashboard") }}
          </NuxtLink>
          <NuxtLink
            to="/admin/register"
            class="bg-white text-slate-900 font-semibold py-2.5 px-5 rounded-xl hover:bg-slate-200 transition text-sm"
          >
            {{ $t("dashboard.adminRegister") }}
          </NuxtLink>
          <NuxtLink
            to="/admin/logs"
            class="bg-white/15 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-white/25 transition text-sm"
          >
            {{ $t("dashboard.adminLogs") }}
          </NuxtLink>
        </div>
      </section>

      <!-- 인사 + 환경 타일 -->
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
        <div class="col-span-3 sm:col-span-5 bg-white/10 rounded-xl p-4 overflow-hidden">
          <div class="ticker-track">
            <span
              v-for="(item, i) in [...tickerItems, ...tickerItems]"
              :key="i"
              class="ticker-item text-sm text-white/70 whitespace-nowrap"
              :aria-hidden="i >= tickerItems.length"
              >{{ item }}</span
            >
          </div>
        </div>
        <button
          @click="toggleVoice"
          class="rounded-xl p-3 min-h-[64px] flex items-center justify-center transition"
          :class="voiceEnabled ? 'bg-sky-500' : 'bg-white/10 hover:bg-white/20'"
        >
          <span class="text-xs font-semibold text-white text-center leading-tight">{{
            voiceEnabled ? $t("senior.voiceOff") : $t("senior.voiceOn")
          }}</span>
        </button>
        <button
          @click="toggleSenior"
          class="rounded-xl p-3 min-h-[64px] flex items-center justify-center transition"
          :class="seniorEnabled ? 'bg-sky-500' : 'bg-white/10 hover:bg-white/20'"
        >
          <span class="text-xs font-semibold text-white text-center leading-tight">{{
            seniorEnabled ? $t("senior.disable") : $t("senior.enable")
          }}</span>
        </button>
        <button
          @click="showTaxiModal = true"
          class="bg-amber-500 hover:bg-amber-400 rounded-xl p-3 min-h-[64px] flex items-center justify-center transition"
        >
          <span class="text-xs font-semibold text-white text-center leading-tight">{{
            $t("dashboard.callTaxi")
          }}</span>
        </button>
        <button
          @click="showDirModal = true"
          class="bg-indigo-500 hover:bg-indigo-400 rounded-xl p-3 min-h-[64px] flex items-center justify-center transition"
        >
          <span class="text-xs font-semibold text-white text-center leading-tight">{{
            $t("dashboard.directions")
          }}</span>
        </button>
        <NuxtLink
          to="/settings"
          class="bg-white/10 hover:bg-white/20 rounded-xl p-3 min-h-[64px] flex items-center justify-center transition"
        >
          <span class="text-xs font-semibold text-white text-center leading-tight">{{
            $t("settings.title")
          }}</span>
        </NuxtLink>
        <NuxtLink
          v-if="!isLoggedIn"
          to="/"
          class="bg-sky-500 hover:bg-sky-400 rounded-xl p-3 min-h-[64px] flex items-center justify-center transition"
        >
          <span class="text-xs font-semibold text-white text-center leading-tight">{{
            $t("auth.login")
          }}</span>
        </NuxtLink>
      </div>
      </div>
    </div>

    <!-- 약 복용 여부 모달 -->
    <div
      v-if="medActionMed"
      class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      @click.self="medActionMed = null"
    >
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xl font-bold text-slate-800">
            {{ medActionMed.name }}
          </h3>
          <button
            @click="medActionMed = null"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <p class="text-sm text-slate-500 mb-5">
          {{ medScheduleText(medActionMed) || $t("dashboard.medAsk") }}
        </p>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="markMed(medActionMed, 'taken')"
            class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-2xl py-4 transition"
          >
            {{ $t("dashboard.medTaken") }}
          </button>
          <button
            @click="markMed(medActionMed, 'missed')"
            class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-lg rounded-2xl py-4 transition"
          >
            {{ $t("dashboard.medMissed") }}
          </button>
        </div>
        <button
          v-if="isAppointmentToday(medActionMed)"
          @click="goHospitalDirections"
          class="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl py-4 transition"
        >
          🏥 {{ $t("dashboard.medHospitalDirections") }}
        </button>
        <NuxtLink
          to="/medications"
          class="mt-4 block text-center text-sm font-semibold text-sky-600 hover:text-sky-500"
          @click="medActionMed = null"
        >
          {{ $t("dashboard.medDetail") }} →
        </NuxtLink>
      </div>
    </div>

    <!-- 길찾기 모달 -->
    <div
      v-if="showDirModal"
      class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      @click.self="showDirModal = false"
    >
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-slate-800">
            {{ $t("directions.title") }}
          </h3>
          <button
            @click="showDirModal = false"
            class="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <p class="text-sm text-slate-500 mb-4">{{ $t("directions.hint") }}</p>
        <div class="flex gap-2">
          <input
            v-model="dirDest"
            type="text"
            :placeholder="$t('directions.placeholder')"
            class="flex-1 px-4 py-3.5 border border-slate-300 rounded-2xl text-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            @keyup.enter="goDirections"
          />
          <button
            v-if="dirVoice.supported.value"
            type="button"
            @click="dirVoice.toggle"
            class="flex items-center gap-1.5 px-4 py-3 rounded-xl font-semibold text-sm transition shrink-0 border"
            :class="
              dirVoice.listening.value
                ? 'bg-red-500 border-red-500 text-white animate-pulse'
                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            "
            :title="$t('directions.voice')"
            :aria-label="$t('directions.voice')"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            <span>{{
              dirVoice.listening.value
                ? $t("common.listening")
                : $t("common.mic")
            }}</span>
          </button>
        </div>
        <p
          v-if="dirVoice.listening.value"
          class="text-sm text-red-500 mt-2"
        >
          {{ $t("directions.listening") }}
        </p>
        <p v-if="dirError" class="text-sm text-red-500 mt-3">{{ dirError }}</p>
        <button
          @click="goDirections"
          :disabled="dirLoading || !dirDest.trim()"
          class="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-lg rounded-2xl py-4 transition"
        >
          {{ dirLoading ? $t("common.loading") : $t("directions.submit") }}
        </button>
      </div>
    </div>

    <!-- 콜택시 모달 -->
    <div
      v-if="showTaxiModal"
      class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      @click.self="showTaxiModal = false"
    >
      <div class="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-bold text-slate-800">
            {{ $t("taxi.title") }}
          </h3>
          <button
            @click="showTaxiModal = false"
            class="text-slate-400 hover:text-slate-600 text-3xl leading-none px-3"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <p class="text-base text-slate-500 mb-6">{{ $t("taxi.note") }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            v-for="svc in visibleTaxiServices"
            :key="svc.tel"
            :href="`tel:${svc.tel}`"
            class="relative rounded-2xl py-5 px-4 text-center transition"
            :class="[svc.cls, isMyTaxi(svc) && 'ring-4 ring-white/70']"
          >
            <span
              v-if="isMyTaxi(svc)"
              class="absolute -top-2.5 left-1/2 -translate-x-1/2 text-sm font-bold bg-white text-slate-800 px-3 py-1 rounded-full whitespace-nowrap shadow"
              >{{ $t("taxi.myRegion") }}</span
            >
            <span class="block text-white font-bold text-xl leading-tight">{{
              $t(svc.nameKey)
            }}</span>
            <span class="block text-white/95 text-lg font-semibold mt-1.5">{{
              svc.display
            }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const { locale, t } = useI18n();
const { enabled: seniorEnabled, toggle: toggleSenior } = useSeniorMode();
const { enabled: voiceEnabled, toggle: toggleVoice, speak } = useSpeech();
const showTaxiModal = ref(false);

// 지역별 콜택시 대표번호
const taxiServices = [
  { nameKey: "taxi.nationwide", tel: "02114", display: "02-114", cls: "bg-sky-500 hover:bg-sky-400" },
  { nameKey: "taxi.seoul", tel: "15884388", display: "1588-4388", cls: "bg-sky-700 hover:bg-sky-600" },
  { nameKey: "taxi.gyeonggi", tel: "16660420", display: "1666-0420", cls: "bg-emerald-600 hover:bg-emerald-500" },
  { nameKey: "taxi.incheon", tel: "15770320", display: "1577-0320", cls: "bg-amber-500 hover:bg-amber-400" },
  { nameKey: "taxi.gangwon", tel: "15772014", display: "1577-2014", cls: "bg-teal-600 hover:bg-teal-500" },
  { nameKey: "taxi.busan", tel: "15551114", display: "1555-1114", cls: "bg-rose-600 hover:bg-rose-500" },
  { nameKey: "taxi.chungbuk", tel: "15330220", display: "1533-0220", cls: "bg-violet-600 hover:bg-violet-500" },
  { nameKey: "taxi.chungnam", tel: "16445588", display: "1644-5588", cls: "bg-indigo-600 hover:bg-indigo-500" },
  { nameKey: "taxi.daegu", tel: "15776776", display: "1577-6776", cls: "bg-cyan-600 hover:bg-cyan-500" },
  { nameKey: "taxi.jeonbuk", tel: "0632270002", display: "063-227-0002", cls: "bg-orange-600 hover:bg-orange-500" },
  { nameKey: "taxi.jeonnam", tel: "18991110", display: "1899-1110", cls: "bg-lime-600 hover:bg-lime-500" },
  { nameKey: "taxi.daejeon", tel: "0426121050", display: "042-612-1050", cls: "bg-fuchsia-600 hover:bg-fuchsia-500" },
  { nameKey: "taxi.sejong", tel: "18999042", display: "1899-9042", cls: "bg-pink-600 hover:bg-pink-500" },
  { nameKey: "taxi.gyeongbuk", tel: "18997770", display: "1899-7770", cls: "bg-blue-700 hover:bg-blue-600" },
  { nameKey: "taxi.gyeongnam", tel: "15664488", display: "1566-4488", cls: "bg-red-600 hover:bg-red-500" },
  { nameKey: "taxi.gwangju", tel: "16682222", display: "1668-2222", cls: "bg-yellow-600 hover:bg-yellow-500" },
  { nameKey: "taxi.ulsan", tel: "0522928253", display: "052-292-8253", cls: "bg-stone-600 hover:bg-stone-500" },
  { nameKey: "taxi.jeju", tel: "18996888", display: "1899-6888", cls: "bg-slate-700 hover:bg-slate-600" },
];

// 내 위치 기준 지역 콜택시 자동 선택 (역지오코딩)
const taxiRegionKey = ref<string | null>(null);

const normRegion = (s: string) =>
  s
    .replace(/[\s()]/g, "")
    .replace(/(특별자치도|특별자치시|특별시|광역시|도|시)+$/, "");

// API가 구 명칭(전라북도 등)을 반환할 때 대비 별칭
const REGION_ALIASES: Record<string, string[]> = {
  jeonbuk: ["전라북"],
  jeonnam: ["전라남"],
  chungbuk: ["충북"],
  chungnam: ["충남"],
  gyeongbuk: ["경북"],
  gyeongnam: ["경남"],
};

const isMyTaxi = (svc: (typeof taxiServices)[number]) =>
  taxiRegionKey.value != null && svc.nameKey === `taxi.${taxiRegionKey.value}`;

// 전국(114) + 내 지역 2개만 표시
const visibleTaxiServices = computed(() => {
  const nationwide = taxiServices.filter((s) => s.nameKey === "taxi.nationwide");
  const mine = taxiServices.filter(isMyTaxi);
  return [...nationwide, ...mine];
});

const detectTaxiRegion = async () => {
  const pos = geoPosition.value;
  if (!pos || taxiRegionKey.value) return;
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.latitude}&longitude=${pos.longitude}&localityLanguage=ko`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const target = normRegion(String(data.principalSubdivision || data.city || ""));
    if (!target) return;
    for (const svc of taxiServices) {
      const key = svc.nameKey.replace("taxi.", "");
      const names = [normRegion(t(svc.nameKey)), ...(REGION_ALIASES[key] || [])];
      if (names.includes(target)) {
        taxiRegionKey.value = key;
        return;
      }
    }
  } catch {
    /* 위치→지역 변환 실패 시 전체 목록 그대로 */
  }
};

watch(showTaxiModal, (open) => {
  if (open) detectTaxiRegion();
});

// 길찾기: 목적지 입력/음성 → 주소→좌표 변환 → 네이버 지도 길찾기
const showDirModal = ref(false);
const dirDest = ref("");
const dirLoading = ref(false);
const dirError = ref("");
const dirVoice = useVoiceInput(dirDest);

const geocodeAddress = async (
  address: string,
): Promise<{ lat: number; lng: number; name: string } | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ko&q=${encodeURIComponent(address)}`,
    );
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      name: data[0].display_name || address,
    };
  } catch {
    return null;
  }
};

const getCurrentPosition = (): Promise<{ latitude: number; longitude: number } | null> =>
  new Promise((resolve) => {
    if (!import.meta.client || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 8000 },
    );
  });

const goDirections = async () => {
  const dest = dirDest.value.trim();
  if (!dest || dirLoading.value) return;
  dirLoading.value = true;
  dirError.value = "";
  // 출발지는 항상 현재 GPS 위치 (실패 시 도착지만 지정)
  const geoPromise = geocodeAddress(dest);
  const origin = await getCurrentPosition();
  const geo = await geoPromise;
  if (!geo) {
    // 좌표 변환 실패 시 네이버 지도 검색으로 폴백
    window.open(
      `https://map.naver.com/p/search/${encodeURIComponent(dest)}`,
      "_blank",
      "noopener",
    );
    showDirModal.value = false;
    dirLoading.value = false;
    return;
  }
  const url = origin
    ? `https://map.naver.com/index.nhn?slat=${origin.latitude}&slng=${origin.longitude}&stext=${encodeURIComponent(t("directions.fromHere"))}&elat=${geo.lat}&elng=${geo.lng}&etext=${encodeURIComponent(dest)}&menu=route&pathType=1`
    : `https://map.naver.com/index.nhn?elat=${geo.lat}&elng=${geo.lng}&etext=${encodeURIComponent(dest)}&menu=route&pathType=1`;
  window.open(url, "_blank", "noopener");
  showDirModal.value = false;
  dirLoading.value = false;
};

const isLoggedIn = ref(false);
const userName = ref("");
const userId = ref<number | null>(null);
const isAdmin = ref(false);

const {
  status: geoStatus,
  position: geoPosition,
  errorMessage: geoError,
  loadStoredPosition,
  requestLocation,
  clearLocation,
  setManualPosition,
} = useGeolocation();

// 수동 지역 설정 (권한 없이 동네/주소 검색)
const showManualSearch = ref(false);
const manualQuery = ref("");
const manualResults = ref<
  { name: string; address: string; lat: number | null; lng: number | null }[]
>([]);
const manualLoading = ref(false);
const manualSearched = ref(false);

const searchManualLocation = async () => {
  const q = manualQuery.value.trim();
  if (!q) return;
  manualLoading.value = true;
  manualSearched.value = false;
  try {
    const res = await fetch(
      `${config.public.apiBase}/contents/geocode?query=${encodeURIComponent(q)}`,
    );
    manualResults.value = res.ok ? await res.json() : [];
  } catch {
    manualResults.value = [];
  }
  manualSearched.value = true;
  manualLoading.value = false;
};

const applyManualLocation = (r: {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
}) => {
  if (r.lat == null || r.lng == null) return;
  setManualPosition({
    latitude: r.lat,
    longitude: r.lng,
    accuracy: 0,
    timestamp: Date.now(),
  });
  showManualSearch.value = false;
  manualQuery.value = "";
  manualResults.value = [];
};

// 알림 이력
const notifications = ref<any[]>([]);
// 최근 24시간 그룹/가족 게시판 새 글 (알림 타일에 함께 표시)
const boardAlertItems = ref<any[]>([]);

// 알림: 안 읽은 것 우선 → 최신순, 최대 4개
const sortedNotifications = computed(() =>
  [...boardAlertItems.value, ...notifications.value]
    .sort(
      (a, b) =>
        Number(a.isRead) - Number(b.isRead) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4),
);

// 약·병원: 다음 복용 시간 가까운 순, 최대 4개
const medNextMinutes = (m: {
  reminderTimes?: string | null;
  timesPerDay?: number;
}): number => {
  if (!m.reminderTimes) return m.timesPerDay ? 9999 : Infinity;
  const now = new Date();
  let best = Infinity;
  for (const raw of m.reminderTimes.split(",")) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
    if (!match) continue;
    const at = new Date(now);
    at.setHours(Number(match[1]), Number(match[2]), 0, 0);
    if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
    best = Math.min(best, (at.getTime() - now.getTime()) / 60000);
  }
  return best;
};
// 24시간 이내 알림 대상 여부: 앞으로 24시간 안의 알림만 표시
const isWithin24h = (m: {
  reminderTimes?: string | null;
  timesPerDay?: number;
  appointmentDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}): boolean => {
  if (m.isActive === false) return false;
  // 복용 기간이 지난 약은 제외
  if (m.endDate && new Date(m.endDate) < new Date(new Date().toDateString()))
    return false;
  // 오늘 남은 복용 시간이 있으면 표시
  if (m.reminderTimes || (m.timesPerDay ?? 0) > 0) {
    const now = new Date();
    for (const raw of (m.reminderTimes || "").split(",")) {
      const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
      if (!match) continue;
      const at = new Date(now);
      at.setHours(Number(match[1]), Number(match[2]), 0, 0);
      if (at.getTime() > now.getTime()) return true;
    }
    // 오늘 남은 복용 시간이 없으면 내일 첫 알림이 24시간 이내인지 확인
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const firstTomorrow = new Date(tomorrow);
    let earliest = Infinity;
    for (const raw of (m.reminderTimes || "").split(",")) {
      const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
      if (!match) continue;
      const at = new Date(tomorrow);
      at.setHours(Number(match[1]), Number(match[2]), 0, 0);
      earliest = Math.min(earliest, at.getTime());
    }
    return earliest !== Infinity && earliest - now.getTime() <= 24 * 60 * 60 * 1000;
  }
  if (m.appointmentDate) {
    const diff = new Date(m.appointmentDate).getTime() - Date.now();
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  }
  return true;
};
const sortedMeds = computed(() =>
  medItems.value
    .filter(isWithin24h)
    .sort((a, b) => medNextMinutes(a) - medNextMinutes(b))
    .slice(0, 4),
);

// 다음 복용 시간 라벨 (24시간제 "HH:MM")
const nextDoseLabel = (m: { reminderTimes?: string | null }): string | null => {
  if (!m.reminderTimes) return null;
  const now = new Date();
  let bestTime: string | null = null;
  let bestAt = Infinity;
  for (const raw of m.reminderTimes.split(",")) {
    const time = raw.trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!match) continue;
    const at = new Date(now);
    at.setHours(Number(match[1]), Number(match[2]), 0, 0);
    if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
    if (at.getTime() < bestAt) {
      bestAt = at.getTime();
      bestTime = time;
    }
  }
  if (!bestTime) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(bestTime);
  if (!match) return bestTime;
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
};

// 약 타일 보조 문구: "07:00 복용" / "하루 2회" / "예약 10월 20일 …"
const medScheduleText = (m: {
  reminderTimes?: string | null;
  timesPerDay?: number;
  appointmentDate?: string | null;
  appointmentNote?: string | null;
}): string => {
  const parts: string[] = [];
  const next = nextDoseLabel(m);
  if (next) {
    parts.push(`${next} ${t("dashboard.medTake")}`);
  } else if (m.timesPerDay && m.timesPerDay > 1) {
    parts.push(t("medications.perDay", { count: m.timesPerDay }));
  }
  // 지난 예약일은 표시하지 않음 (오늘 이후만)
  if (m.appointmentDate) {
    const appt = new Date(m.appointmentDate);
    const today = new Date();
    const isPast =
      appt.getFullYear() < today.getFullYear() ||
      (appt.getFullYear() === today.getFullYear() &&
        (appt.getMonth() < today.getMonth() ||
          (appt.getMonth() === today.getMonth() &&
            appt.getDate() < today.getDate())));
    if (!isPast) {
      const d = appt.toLocaleDateString(
        locale.value === "ko" ? "ko-KR" : "en-US",
        { month: "long", day: "numeric" },
      );
      parts.push(`${t("dashboard.medAppt")} ${d}${m.appointmentNote ? ` ${m.appointmentNote}` : ""}`);
    }
  }
  return parts.join(" · ");
};

// 오늘 복용 여부 기록 (기기 로컬 저장)
const MED_RECORDS_KEY = "ieum_med_records";
const medRecords = ref<Record<string, "taken" | "missed">>({});
const medActionMed = ref<(typeof medItems.value)[number] | null>(null);

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const medStatus = (m: { id: number }) =>
  medRecords.value[`${m.id}:${todayKey()}`] || "";

const loadMedRecords = () => {
  try {
    medRecords.value = JSON.parse(
      localStorage.getItem(MED_RECORDS_KEY) || "{}",
    );
  } catch {
    medRecords.value = {};
  }
};

const openMedAction = (m: (typeof medItems.value)[number]) => {
  medActionMed.value = m;
};

const markMed = (m: { id: number }, status: "taken" | "missed") => {
  medRecords.value = {
    ...medRecords.value,
    [`${m.id}:${todayKey()}`]: status,
  };
  localStorage.setItem(MED_RECORDS_KEY, JSON.stringify(medRecords.value));
  medActionMed.value = null;
};

// 예약일이 오늘이면 병원 길찾기 유도
const isAppointmentToday = (m: {
  appointmentDate?: string | null;
}): boolean => {
  if (!m.appointmentDate) return false;
  const d = new Date(m.appointmentDate);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
};

const goHospitalDirections = () => {
  const m = medActionMed.value;
  if (!m) return;
  // 예약 메모(병원명/주소)를 목적지로 길찾기 모달 오픈
  dirDest.value = m.appointmentNote || m.name;
  dirError.value = "";
  medActionMed.value = null;
  showDirModal.value = true;
};
const config = useRuntimeConfig();
const NOTIF_LIMIT_KEY = "notificationDisplayCount";
const notificationLimit = ref(2);

const loadNotificationLimit = () => {
  const saved = parseInt(localStorage.getItem(NOTIF_LIMIT_KEY) || "", 10);
  notificationLimit.value = isNaN(saved) ? 2 : Math.min(Math.max(saved, 2), 10);
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString(
      locale.value === "ko" ? "ko-KR" : "en-US",
    );
  } catch {
    return dateString;
  }
};

const loadNotifications = async () => {
  if (!userId.value) return;
  try {
    const listRes = await fetch(
      `${config.public.apiBase}/notifications/user/${userId.value}?limit=${notificationLimit.value}`,
    );
    if (listRes.ok) notifications.value = await listRes.json();
  } catch (e) {
    console.error("알림 로딩 실패:", e);
  }
};

const onNotifClick = (n: any) => {
  if (n._board) {
    router.push(`/board?post=${n._postId}`);
    return;
  }
  if (!n.isRead) markRead(n);
};

const markRead = async (n: any) => {
  try {
    await fetch(`${config.public.apiBase}/notifications/${n.id}/read`, {
      method: "POST",
    });
    n.isRead = true;
  } catch (e) {
    console.error("알림 읽음 처리 실패:", e);
  }
};

const deleteNotif = async (n: any) => {
  try {
    const res = await fetch(
      `${config.public.apiBase}/notifications/${n.id}?userId=${userId.value}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      notifications.value = notifications.value.filter((x) => x.id !== n.id);
    }
  } catch (e) {
    console.error("알림 삭제 실패:", e);
  }
};

const PROMPT_KEY = "locationPromptDismissed";
const promptDismissed = ref(false);

// 한눈에 보는 상태 + 카드 미리보기 데이터
const medItems = ref<{
  id: number;
  name: string;
  timesPerDay?: number;
  reminderTimes?: string | null;
  isActive?: boolean;
  appointmentDate?: string | null;
  appointmentNote?: string | null;
  endDate?: string | null;
}[]>([]);
const cultureItems = ref<{
  id: number;
  title: string;
  eventDate?: string;
  location?: string;
}[]>([]);
const boardPosts = ref<{
  id: number;
  title: string;
  authorName?: string;
  createdAt?: string;
}[]>([]);

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString(
    locale.value === "ko" ? "ko-KR" : "en-US",
    { month: "long", day: "numeric" },
  );
};
const boardLoaded = ref(false);
// SSR(UTC)과 CSR(KST) 시간대 차이로 인사말이 달라지는 것 방지 — 마운트 후에만 계산
const mounted = ref(false);
const greetingKey = computed(() => {
  if (!mounted.value) return "";
  const h = new Date().getHours();
  return h < 12
    ? "dashboard.greetingMorning"
    : h < 18
      ? "dashboard.greetingAfternoon"
      : "dashboard.greetingEvening";
});

// 날씨 (Open-Meteo, 무료·키 불필요)
const weather = ref<{
  temp: number | null;
  labelKey: string;
  code: number | null;
  forecast: { temp: number | null; labelKey: string }[];
}>({
  temp: null,
  labelKey: "",
  code: null,
  forecast: [],
});
const weatherLabelKey = (code: number): string => {
  if (code === 0) return "weather.clear";
  if (code <= 2) return "weather.partly";
  if (code === 3) return "weather.cloudy";
  if (code <= 48) return "weather.fog";
  if (code <= 57) return "weather.drizzle";
  if (code <= 67) return "weather.rain";
  if (code <= 77) return "weather.snow";
  if (code <= 82) return "weather.showers";
  return "weather.storm";
};
const weatherCautionKey = (code: number | null, temp: number | null): string | null => {
  if (code != null) {
    if (code >= 95) return "weather.tipStorm";
    if (code >= 71 && code <= 77) return "weather.tipSnow";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "weather.tipRain";
    if (code >= 45 && code <= 48) return "weather.tipFog";
  }
  if (temp != null) {
    if (temp >= 33) return "weather.tipHeat";
    if (temp >= 28) return "weather.tipHot";
    if (temp <= 0) return "weather.tipFreeze";
    if (temp <= 5) return "weather.tipCold";
  }
  return null;
};
const todayText = computed(() => {
  if (!mounted.value) return "";
  const date = new Date().toLocaleDateString(
    locale.value === "ko" ? "ko-KR" : "en-US",
    { month: "long", day: "numeric", weekday: "long" },
  );
  const caution = weatherCautionKey(weather.value.code, weather.value.temp);
  const msg = caution ? t(caution) : t(greetingKey);
  return `${date} · ${msg}`;
});

// 하단 스크롤 티커: 날짜·날씨 주의·곧 다가오는 약 시간
const tickerItems = computed(() => {
  const items: string[] = [todayText.value];
  const caution = weatherCautionKey(weather.value.code, weather.value.temp);
  if (caution) items.push(`🌦 ${t(caution)}`);

  const now = new Date();
  const medAlerts: { at: number; text: string }[] = [];
  for (const m of medItems.value) {
    if (m.isActive === false || !m.reminderTimes) continue;
    for (const raw of m.reminderTimes.split(",")) {
      const time = raw.trim();
      const match = /^(\d{1,2}):(\d{2})$/.exec(time);
      if (!match) continue;
      const at = new Date(now);
      at.setHours(Number(match[1]), Number(match[2]), 0, 0);
      if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
      const diffMin = (at.getTime() - now.getTime()) / 60000;
      if (diffMin > 180) continue;
      const text =
        diffMin <= 10
          ? t("ticker.medNow", { name: m.name })
          : t("ticker.medSoon", { name: m.name, time });
      medAlerts.push({ at: at.getTime(), text });
    }
  }
  medAlerts
    .sort((a, b) => a.at - b.at)
    .slice(0, 4)
    .forEach((a) => items.push(`💊 ${a.text}`));
  return items.slice(0, 8);
});
const loadWeather = async () => {
  const lat = geoPosition.value?.latitude ?? 37.5665;
  const lng = geoPosition.value?.longitude ?? 126.978;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto`,
    );
    const d = await res.json();
    const c = d?.current;
    const forecast: { temp: number | null; labelKey: string }[] = [];
    const times: string[] = d?.hourly?.time ?? [];
    const hTemps: number[] = d?.hourly?.temperature_2m ?? [];
    const hCodes: number[] = d?.hourly?.weather_code ?? [];
    // 점심(13시)·저녁(19시)·내일 아침(9시) 예보 — 각 목표 시각에 가장 가까운 시간대 선택
    const now = new Date();
    const targets = [
      { day: 0, hour: 13 },
      { day: 0, hour: 19 },
      { day: 1, hour: 9 },
    ];
    for (const target of targets) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + target.day);
      targetDate.setHours(target.hour, 0, 0, 0);
      const targetTime = targetDate.getTime();
      let best = -1;
      let bestDiff = Infinity;
      times.forEach((time, i) => {
        const diff = Math.abs(new Date(time).getTime() - targetTime);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = i;
        }
      });
      forecast.push({
        temp: best >= 0 && hTemps[best] != null ? Math.round(hTemps[best]) : null,
        labelKey: best >= 0 && hCodes[best] != null ? weatherLabelKey(hCodes[best]) : "",
      });
    }
    if (c) {
      weather.value = {
        temp: Math.round(c.temperature_2m),
        labelKey: weatherLabelKey(c.weather_code),
        code: c.weather_code,
        forecast,
      };
    } else {
      weather.value.forecast = forecast;
    }
  } catch {
    /* 날씨 조회 실패 시 – 표시 */
  }
};

const loadMedData = async () => {
  if (!userId.value) return;
  try {
    const res = await fetch(
      `${config.public.apiBase}/medications?userId=${userId.value}`,
    );
    if (res.ok) {
      const list = await res.json();
      medItems.value = Array.isArray(list) ? list.slice(0, 5) : [];
    }
  } catch {
    /* 집계 실패 시 0 표시 */
  }
};

const loadCulturePreview = async () => {
  try {
    const res = await fetch(
      `${config.public.apiBase}/contents?page=1&limit=5`,
    );
    if (res.ok) {
      const data = await res.json();
      cultureItems.value = (data.items || []).slice(0, 5);
    }
  } catch {
    /* 미리보기 실패 시 빈 목록 */
  }
};

// 최근 24시간 내 그룹/가족 게시판 새 글 → 알림 타일에 합성 표시
const loadBoardAlerts = async () => {
  boardAlertItems.value = [];
  if (!userId.value) return;
  try {
    const famRes = await fetch(
      `${config.public.apiBase}/board/families?userId=${userId.value}`,
    );
    if (!famRes.ok) return;
    const families = await famRes.json();
    if (!Array.isArray(families) || families.length === 0) return;
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const items: any[] = [];
    await Promise.all(
      families.slice(0, 5).map(async (fam: any) => {
        try {
          const res = await fetch(
            `${config.public.apiBase}/board/posts?familyId=${fam.id}&userId=${userId.value}`,
          );
          if (!res.ok) return;
          const posts = await res.json();
          for (const p of Array.isArray(posts) ? posts : []) {
            const t = new Date(p.createdAt).getTime();
            if (t >= since && Number(p.authorUserId) !== Number(userId.value)) {
              items.push({
                id: `bp-${p.id}`,
                _board: true,
                _postId: p.id,
                title: `💬 ${fam.name}: ${p.title}`,
                body: (p.content || "").slice(0, 80),
                createdAt: p.createdAt,
                isRead: true,
              });
            }
          }
        } catch {}
      }),
    );
    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    boardAlertItems.value = items.slice(0, 3);
  } catch {}
};

const loadBoardPreview = async () => {
  if (!userId.value) {
    boardLoaded.value = true;
    return;
  }
  try {
    const famRes = await fetch(
      `${config.public.apiBase}/board/families?userId=${userId.value}`,
    );
    if (!famRes.ok) return;
    const families = await famRes.json();
    const fam = Array.isArray(families) ? families[0] : null;
    if (!fam) {
      boardLoaded.value = true;
      return;
    }
    const postRes = await fetch(
      `${config.public.apiBase}/board/posts?familyId=${fam.id}&userId=${userId.value}`,
    );
    if (postRes.ok) {
      const posts = await postRes.json();
      boardPosts.value = Array.isArray(posts) ? posts.slice(0, 5) : [];
    }
  } catch {
    /* 미리보기 실패 시 빈 목록 */
  } finally {
    boardLoaded.value = true;
  }
};

// 위치 카드: 저장 완료 또는 '나중에' 선택 시 숨김
const showLocationCard = computed(() => geoStatus.value !== "granted");

const acceptAndSaveLocation = async () => {
  await requestLocation();
};

const dismissLocationPrompt = () => {
  promptDismissed.value = true;
  localStorage.setItem(PROMPT_KEY, "true");
};

const requestGeo = async () => {
  await requestLocation();
};

const clearGeo = () => {
  clearLocation();
};

// 음성 안내: 위치 저장 여부 질문이 표시될 때 읽어주기
watch([geoStatus, promptDismissed], () => {
  if (geoStatus.value === "idle" && !promptDismissed.value) {
    speak(t("location.savePrompt"));
  }
});

// 음성 안내: 대시보드 진입 시 날짜·날씨 인사말을 한 번 읽어주기
let greeted = false;
const greetOnce = () => {
  if (greeted || !voiceEnabled.value || !import.meta.client) return;
  greeted = true;
  speak(todayText.value);
};
watch(() => weather.value.temp, (temp) => {
  if (temp != null) greetOnce();
});

onMounted(async () => {
  mounted.value = true;
  loadStoredPosition();
  loadWeather();
  promptDismissed.value = localStorage.getItem(PROMPT_KEY) === "true";
  // 큰 글씨 모드 제거됨 — 이전에 저장된 확대 상태 초기화
  document.documentElement.style.fontSize = "";
  localStorage.removeItem("ieum_font_large");
  loadMedRecords();
  loadNotificationLimit();
  // 날씨 조회 실패 시에도 인사말은 읽어주기
  setTimeout(greetOnce, 4000);

  // 만료된 access token은 refresh token으로 갱신, 실패 시 게스트 모드
  const loggedIn = await ensureSession(config.public.apiBase);
  const token = loggedIn ? getAccessToken() : null;

  if (!token) {
    // 게스트 모드: 로그인 없이 로컬 ID로 이용 (가족 기능 제외)
    userId.value = getGuestUserId();
    loadNotifications();
    loadBoardAlerts();
    loadMedData();
    loadCulturePreview();
    loadBoardPreview();
    return;
  }

  isLoggedIn.value = true;

  // JWT payload에서 사용자 정보 추출
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId.value = payload.sub || null;
  } catch {
    // 토큰 파싱 실패 시 무시
  }

  // TODO: /auth/me 또는 /users/:id API로 사용자 정보 조회
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      userName.value = user.name || "";
      isAdmin.value = ["ADMIN", "SUPER_ADMIN", "REVIEWER"].includes(user.role);
    } catch {
      // 파싱 실패 시 무시
    }
  }

  loadNotifications();
  loadBoardAlerts();
  loadMedData();
  loadCulturePreview();
  loadBoardPreview();
});

</script>

<style scoped>
/* 지렁이 테두리: 밝은 구간이 테두리를 따라 빙글빙글 지나감 */
@property --worm-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
.worm-tile {
  position: relative;
}
.worm-tile::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: conic-gradient(
    from var(--worm-angle),
    transparent 0deg,
    rgba(255, 255, 255, 0.15) 200deg,
    rgba(255, 255, 255, 0.95) 290deg,
    rgba(255, 255, 255, 0.15) 340deg,
    transparent 360deg
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  animation: worm-spin 2.8s linear infinite;
  pointer-events: none;
}
@keyframes worm-spin {
  to {
    --worm-angle: 360deg;
  }
}
@media (prefers-reduced-motion: reduce) {
  .worm-tile::after {
    animation: none;
    opacity: 0.4;
  }
}
.ticker-track {
  display: flex;
  gap: 2.5rem;
  width: max-content;
  animation: ticker-scroll 40s linear infinite;
}
.ticker-item::after {
  content: "·";
  margin-left: 2.5rem;
  color: rgb(255 255 255 / 0.3);
}
.ticker-track:hover {
  animation-play-state: paused;
}
@keyframes ticker-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation: none;
    flex-wrap: wrap;
    width: 100%;
  }
}
</style>
