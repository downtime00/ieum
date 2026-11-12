<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">

      <!-- 게스트 안내: 공개 그룹은 로그인 없이 보기 가능 -->
      <div
        v-if="guestMode"
        class="bg-white/10 rounded-2xl p-6 mb-4"
      >
        <p class="text-white/70 mb-4">{{ $t("board.guestNotice") }}</p>
        <div class="flex gap-3 flex-wrap">
          <button
            @click="openGroupSearch"
            class="bg-sky-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-sky-400 transition"
          >
            {{ $t("board.findGroup") }}
          </button>
          <NuxtLink
            to="/"
            class="bg-white/10 text-white border border-white/20 font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition"
          >
            {{ $t("auth.login") }}
          </NuxtLink>
        </div>
      </div>

      <!-- 게스트: 그룹 보기 중 안내 -->
      <div
        v-if="guestMode && currentFamily"
        class="bg-sky-500/20 border border-sky-400/30 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3"
      >
        <p class="text-sm text-sky-200">
          {{ currentFamily.name }} — {{ $t("board.guestViewing") }}
        </p>
        <button
          @click="openGroupSearch"
          class="text-sm font-semibold text-sky-300 hover:text-sky-200 shrink-0"
        >
          {{ $t("board.findGroup") }}
        </button>
      </div>

      <!-- 비회원(로그인 O, 그룹 미가입): 읽기 전용 안내 -->
      <div
        v-if="!guestMode && currentFamily?.role === 'GUEST'"
        class="bg-white/10 rounded-2xl p-4 mb-4 flex items-center justify-between gap-3"
      >
        <p class="text-sm text-white/70">
          {{ currentFamily.name }} — {{ $t("board.guestViewing") }}
        </p>
        <button
          @click="openGroupSearch"
          class="text-sm font-semibold text-sky-300 hover:text-sky-200 shrink-0"
        >
          {{ $t("board.findGroup") }}
        </button>
      </div>

      <!-- 가족/그룹 선택 툴바: 칩 + 글쓰기만 노출, 관리는 별도 패널 -->
      <div
        v-if="!guestMode && (families.length > 0 || currentFamily)"
        class="flex flex-wrap items-center gap-2 mb-4"
      >
        <button
          v-if="families.length > 0"
          @click="selectAll"
          class="px-5 py-2.5 rounded-xl font-semibold text-sm transition border"
          :class="
            viewAll
              ? 'bg-sky-500 text-white border-sky-400'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          "
        >
          {{ $t("board.viewAll") }}
        </button>
        <button
          v-for="f in families"
          :key="f.id"
          @click="selectFamily(f)"
          class="px-5 py-2.5 rounded-xl font-semibold text-sm transition border"
          :class="
            !viewAll && currentFamily?.id === f.id
              ? 'bg-sky-500 text-white border-sky-400'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          "
        >
          {{ f.name }}
          <span v-if="f.role === 'HEAD'" class="ml-1" title="가족장">👑</span>
        </button>
        <span class="flex-1"></span>
        <button
          v-if="!viewAll"
          @click="showManage = !showManage"
          class="font-semibold py-2.5 px-4 rounded-xl transition text-sm border"
          :class="
            showManage
              ? 'bg-white text-slate-900 border-white'
              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
          "
        >
          ⚙ {{ $t("board.manage") }}
        </button>
        <button
          v-if="currentFamily && currentFamily.role !== 'GUEST'"
          @click="openPostForm()"
          class="bg-sky-500 text-white font-semibold py-2.5 px-5 rounded-xl hover:bg-sky-400 transition text-sm"
        >
          + {{ $t("board.writePost") }}
        </button>
      </div>

      <!-- 관리 패널: 자주 안 쓰는 설정은 여기서 -->
      <div
        v-if="showManage && !guestMode"
        class="bg-white/10 rounded-2xl p-4 mb-4"
      >
        <p class="font-semibold text-white/80 text-sm mb-3">
          {{ $t("board.manage") }}
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            @click="openFamilyModal()"
            class="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold py-3 px-4 rounded-xl transition text-sm text-center"
          >
            + {{ $t("board.familyAdd") }}
          </button>
          <button
            @click="openGroupSearch"
            class="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold py-3 px-4 rounded-xl transition text-sm text-center"
          >
            {{ $t("board.findGroup") }}
          </button>
          <button
            v-if="currentFamily && members.length > 0"
            @click="
              showMembers = !showMembers;
              showManage = false;
            "
            class="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold py-3 px-4 rounded-xl transition text-sm text-center"
          >
            {{ $t("board.membersShort") }} ({{ members.length }})
          </button>
          <button
            v-if="currentFamily?.role === 'HEAD'"
            @click="openInviteModal"
            class="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold py-3 px-4 rounded-xl transition text-sm text-center"
          >
            {{ $t("board.inviteShort") }}
          </button>
          <button
            v-if="currentFamily && currentFamily?.role !== 'GUEST'"
            @click="leaveFamily"
            class="bg-red-400/20 hover:bg-red-400/30 border border-red-300/40 text-red-200 font-semibold py-3 px-4 rounded-xl transition text-sm text-center"
          >
            {{ $t("board.leaveShort") }}
          </button>
          <button
            v-if="
              currentFamily &&
              currentFamily.role !== 'GUEST' &&
              (currentFamily.role === 'HEAD' || currentFamily.isPublic)
            "
            @click="toggleComments"
            class="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold py-3 px-4 rounded-xl transition text-sm text-center"
          >
            {{
              currentFamily.commentsEnabled === false
                ? $t("board.commentsEnable")
                : $t("board.commentsDisable")
            }}
          </button>
        </div>
      </div>

      <!-- 가족 없음 (로그인 사용자) -->
      <div
        v-if="!guestMode && !loading && families.length === 0"
        class="bg-white/10 rounded-2xl p-10 text-center mb-4"
      >
        <p class="text-white/60 mb-6">{{ $t("board.noFamily") }}</p>
        <div class="flex justify-center gap-3 flex-wrap">
          <button
            @click="openGroupSearch"
            class="bg-sky-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-sky-400 transition"
          >
            {{ $t("board.findGroup") }}
          </button>
          <button
            @click="openFamilyModal('create')"
            class="bg-sky-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-sky-400 transition"
          >
            {{ $t("board.createFamily") }}
          </button>
          <button
            @click="openFamilyModal('join')"
            class="bg-white/10 text-white border border-white/20 font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition"
          >
            {{ $t("board.joinFamily") }}
          </button>
        </div>
      </div>

      <!-- 가족 구성원 목록 -->
      <div
        v-if="currentFamily && members.length > 0 && showMembers"
        class="bg-white/10 rounded-2xl p-4 mb-4"
      >
        <p class="font-semibold text-white/80 text-sm mb-3">
          {{ $t("board.members") }} ({{ members.length }})
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="m in sortedMembers"
            :key="m.id"
            class="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 text-sm"
            :class="
              m.role === 'HEAD' ? 'border border-amber-400/50' : 'border border-white/15'
            "
          >
            <span class="font-medium text-white/90">{{ m.name }}</span>
            <span v-if="m.relation" class="text-white/40"
              >· {{ m.relation }}</span
            >
            <span v-if="m.isMe" class="text-sky-300 text-xs font-semibold"
              >({{ $t("board.me") }})</span
            >
            <span
              v-if="m.role === 'HEAD'"
              class="text-amber-300 text-sm"
              title="가족장"
              >👑</span
            >
            <button
              v-if="currentFamily?.role === 'HEAD' && !m.isMe"
              @click="kickMember(m)"
              class="text-xs text-red-300 hover:text-red-200"
            >
              {{ $t("board.removeMember") }}
            </button>
          </span>
        </div>
      </div>

      <!-- 게시글 목록 -->
      <div v-if="loading" class="text-center py-16 text-white/50 text-lg">
        {{ $t("board.loading") }}
      </div>
      <div
        v-else-if="viewAll && allPosts.length === 0"
        class="text-center py-16 text-white/50 text-lg"
      >
        {{ $t("board.empty") }}
      </div>

      <div
        v-else-if="viewAll"
        class="flex flex-col gap-3 pt-1"
      >
        <article
          v-for="(p, idx) in allPosts"
          :key="p.id"
          @click="openPost(p)"
          class="bg-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/15 transition"
          :style="{ animationDelay: `${Math.min(idx, 12) * 60}ms` }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  v-if="p.isNotice"
                  class="text-xs font-bold bg-red-400/30 text-red-200 px-2 py-0.5 rounded-full"
                  >{{ $t("board.notice") }}</span
                >
                <span class="text-xs font-semibold bg-white/15 text-white/70 px-2 py-0.5 rounded-full">
                  {{ p.familyName }}
                </span>
                <h3 class="font-semibold text-white">
                  {{ p.title }}
                </h3>
              </div>
              <p class="text-sm text-white/60 line-clamp-3 whitespace-pre-wrap">
                {{ p.content }}
              </p>
            </div>
            <span class="text-white/30 text-xl shrink-0">›</span>
          </div>
          <div class="flex items-center gap-3 mt-3 text-xs text-white/40">
            <span>{{ p.authorName }}</span>
            <span>{{ formatDate(p.createdAt) }}</span>
            <span v-if="p.commentCount > 0"
              >{{ $t("board.comments") }} {{ p.commentCount }}</span
            >
          </div>
        </article>
        <div ref="allSentinel" class="h-8"></div>
        <p
          v-if="allLoadingMore"
          class="text-center text-white/40 text-sm py-2"
        >
          {{ $t("board.loading") }}
        </p>
      </div>

      <div
        v-else-if="currentFamily && posts.length === 0"
        class="text-center py-16 text-white/50 text-lg"
      >
        {{ $t("board.empty") }}
      </div>

      <div
        v-else-if="currentFamily"
        class="flex flex-col gap-3 pt-1"
      >
        <article
          v-for="(p, idx) in sortedPosts"
          :key="p.id"
          @click="openPost(p)"
          class="bg-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/15 transition"
          :style="{ animationDelay: `${Math.min(idx, 12) * 60}ms` }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  v-if="p.isNotice"
                  class="text-xs font-bold bg-red-400/30 text-red-200 px-2 py-0.5 rounded-full"
                  >{{ $t("board.notice") }}</span
                >
                <h3 class="font-semibold text-white">
                  {{ p.title }}
                </h3>
              </div>
              <p class="text-sm text-white/60 line-clamp-3 whitespace-pre-wrap">
                {{ p.content }}
              </p>
            </div>
            <span class="text-white/30 text-xl shrink-0">›</span>
          </div>
          <div class="flex items-center gap-3 mt-3 text-xs text-white/40">
            <span>{{ p.authorName }}</span>
            <span>{{ formatDate(p.createdAt) }}</span>
            <span v-if="p.commentCount > 0"
              >{{ $t("board.comments") }} {{ p.commentCount }}</span
            >
          </div>
        </article>
      </div>
      </div>
    </div>

    <!-- 게시글 상세 모달 -->
    <div
      v-if="selectedPost"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="selectedPost = null"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
      >
        <div
          class="p-6 border-b border-slate-100 flex items-start justify-between gap-3"
        >
          <div>
            <span
              v-if="selectedPost.isNotice"
              class="text-xs font-bold bg-red-400/30 text-red-200 px-2 py-0.5 rounded-full"
              >{{ $t("board.notice") }}</span
            >
            <h2 class="text-xl font-bold text-slate-900 mt-1">
              {{ selectedPost.title }}
            </h2>
            <p class="text-sm text-slate-400 mt-1">
              {{ selectedPost.authorName }} ·
              {{ formatDate(selectedPost.createdAt)
              }}<template v-if="selectedPost.visibleUntil">
                · ~{{ formatDate(selectedPost.visibleUntil) }}</template
              >
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="canDeletePost()"
              @click="deletePost(selectedPost)"
              class="text-xs text-red-300 hover:text-red-200"
            >
              {{ $t("board.delete") }}
            </button>
            <button
              @click="selectedPost = null"
              class="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              :aria-label="$t('common.close')"
            >
              ×
            </button>
          </div>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <p class="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {{ selectedPost.content }}
          </p>

          <h3 class="font-semibold text-slate-800 mt-6 mb-3">
            {{ $t("board.comments") }} ({{ comments.length }})
          </h3>
          <div v-if="comments.length === 0" class="text-sm text-slate-400 py-3">
            {{ $t("board.noComments") }}
          </div>
          <div
            v-for="c in comments"
            :key="c.id"
            class="bg-stone-50 rounded-xl p-3 mb-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-slate-700">{{
                c.authorName
              }}</span>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400">{{
                  formatDate(c.createdAt)
                }}</span>
                <button
                  v-if="canDeleteComment(c)"
                  @click="deleteComment(c)"
                  class="text-xs text-red-300 hover:text-red-200"
                >
                  {{ $t("board.delete") }}
                </button>
              </div>
            </div>
            <p class="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
              {{ c.content }}
            </p>
          </div>
        </div>
        <div
          v-if="guestMode || currentFamily?.role === 'GUEST'"
          class="p-4 border-t border-slate-100 text-center"
        >
          <NuxtLink
            v-if="guestMode"
            to="/"
            class="text-blue-700 font-semibold hover:text-blue-800"
            >{{ $t("board.loginToParticipate") }}</NuxtLink
          >
          <p v-else class="text-sm text-slate-500">
            {{ $t("board.joinToComment") }}
          </p>
        </div>
        <div
          v-else-if="currentFamily?.commentsEnabled === false"
          class="p-4 border-t border-slate-100 text-center"
        >
          <p class="text-sm text-slate-500">
            {{ $t("board.commentsDisabled") }}
          </p>
        </div>
        <div v-else class="p-4 border-t border-slate-100 flex gap-2">
          <input
            v-model="commentInput"
            @keyup.enter="addComment"
            :placeholder="$t('board.commentPlaceholder')"
            class="flex-1 border border-slate-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            v-if="commentVoice.supported"
            type="button"
            @click="commentVoice.toggle"
            :title="$t('board.voiceInput')"
            :aria-label="$t('board.voiceInput')"
            class="shrink-0 flex items-center gap-1.5 px-4 h-11 rounded-xl font-semibold text-sm transition border"
            :class="
              commentVoice.listening
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            "
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            <span>{{
              commentVoice.listening
                ? $t("common.listening")
                : $t("common.mic")
            }}</span>
          </button>
          <button
            @click="addComment"
            :disabled="!commentInput.trim()"
            class="bg-blue-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-blue-900 disabled:opacity-40 transition"
          >
            {{ $t("board.addComment") }}
          </button>
        </div>
      </div>
    </div>

    <!-- 글쓰기 모달 -->
    <div
      v-if="showPostForm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showPostForm = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-xl p-6">
        <h2 class="text-xl font-bold text-slate-900 mb-4">
          {{ $t("board.writePost") }}
        </h2>
        <input
          v-model="postForm.title"
          @focus="dictationField = 'title'"
          :placeholder="$t('board.postTitle')"
          class="w-full border rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-blue-400 transition"
          :class="
            postVoice.listening && dictationField === 'title'
              ? 'border-red-400 ring-2 ring-red-200'
              : 'border-slate-300'
          "
        />
        <textarea
          v-model="postForm.content"
          @focus="dictationField = 'content'"
          :placeholder="$t('board.postContent')"
          rows="6"
          class="w-full border rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-blue-400 transition"
          :class="
            postVoice.listening && dictationField === 'content'
              ? 'border-red-400 ring-2 ring-red-200'
              : 'border-slate-300'
          "
        ></textarea>
        <!-- 공개 그룹: 노출 기간 선택 (필수) -->
        <div
          v-if="currentFamily?.isPublic"
          class="grid grid-cols-2 gap-3 mb-3"
        >
          <label class="block">
            <span class="block text-sm font-semibold text-slate-700 mb-1"
              >{{ $t("board.displayFrom") }}</span
            >
            <input
              v-model="postForm.visibleFrom"
              type="date"
              class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </label>
          <label class="block">
            <span class="block text-sm font-semibold text-slate-700 mb-1"
              >{{ $t("board.displayUntil") }} *</span
            >
            <input
              v-model="postForm.visibleUntil"
              type="date"
              required
              class="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </label>
        </div>
        <p
          v-if="currentFamily?.isPublic"
          class="text-xs text-slate-400 mb-3"
        >
          {{ $t("board.displayPeriodHint") }}
        </p>
        <label
          v-if="currentFamily?.role === 'HEAD'"
          class="flex items-center gap-2 mb-4 text-sm text-slate-600"
        >
          <input type="checkbox" v-model="postForm.isNotice" class="w-4 h-4" />
          {{ $t("board.notice") }}
        </label>
        <div class="flex gap-2 justify-between items-center">
          <button
            v-if="postVoice.supported"
            type="button"
            @click="postVoice.toggle"
            :title="$t('board.voiceInput')"
            :aria-label="$t('board.voiceInput')"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition border"
            :class="
              postVoice.listening
                ? 'bg-red-500 text-white border-red-500 animate-pulse'
                : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
            "
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            {{
              postVoice.listening
                ? $t("common.listening")
                : $t("common.mic")
            }}
          </button>
          <span v-else></span>
          <div class="flex gap-2">
          <button
            @click="showPostForm = false"
            class="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            {{ $t("board.cancel") }}
          </button>
          <button
            @click="submitPost"
            :disabled="
              !postForm.title.trim() ||
              !postForm.content.trim() ||
              (currentFamily?.isPublic && !postForm.visibleUntil)
            "
            class="bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-900 disabled:opacity-40 transition"
          >
            {{ $t("board.submit") }}
          </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 가족 만들기/참가 모달 -->
    <div
      v-if="showFamilyModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showFamilyModal = null"
    >
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 class="text-xl font-bold text-slate-900 mb-4">
          {{ $t("board.familyAdd") }}
        </h2>
        <div class="flex gap-2 mb-4">
          <button
            @click="familyModalMode = 'create'"
            class="flex-1 py-2.5 rounded-xl font-semibold text-sm transition border"
            :class="
              familyModalMode === 'create'
                ? 'bg-blue-800 text-white border-blue-800'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
            "
          >
            {{ $t("board.createFamily") }}
          </button>
          <button
            @click="familyModalMode = 'join'"
            class="flex-1 py-2.5 rounded-xl font-semibold text-sm transition border"
            :class="
              familyModalMode === 'join'
                ? 'bg-blue-800 text-white border-blue-800'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
            "
          >
            {{ $t("board.joinFamily") }}
          </button>
        </div>
        <template v-if="familyModalMode === 'create'">
          <input
            v-model="familyForm.name"
            :placeholder="$t('board.familyName')"
            class="w-full border border-slate-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-blue-400"
          />
        </template>
        <template v-else>
          <input
            v-model="familyForm.code"
            :placeholder="$t('board.inviteCode')"
            class="w-full border border-slate-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-blue-400 uppercase"
          />
        </template>
        <div class="flex gap-2 justify-end">
          <button
            @click="showFamilyModal = null"
            class="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            {{ $t("board.cancel") }}
          </button>
          <button
            @click="submitFamily"
            :disabled="
              familyModalMode === 'create'
                ? !familyForm.name.trim()
                : !familyForm.code.trim()
            "
            class="bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-900 disabled:opacity-40 transition"
          >
            {{
              familyModalMode === "create"
                ? $t("board.create")
                : $t("board.join")
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- 초대 코드 / QR 모달 -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showInviteModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <h2 class="text-xl font-bold text-slate-900 mb-1">
          {{ $t("board.inviteQr") }}
        </h2>
        <p class="text-sm text-slate-500 mb-4">{{ currentFamily?.name }}</p>
        <div v-if="inviteLoading" class="py-10 text-slate-400">
          {{ $t("board.loading") }}
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
                ? $t("board.inviteExpires", {
                    date: formatExpiry(inviteData.expiresAt),
                  })
                : $t("board.inviteUnlimited")
            }}
          </p>
          <div class="flex gap-2 justify-center">
            <button
              @click="copyInviteCode"
              class="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-200 transition"
            >
              {{ copied ? $t("board.copied") : $t("board.copyCode") }}
            </button>
            <button
              @click="regenInviteCode"
              class="bg-white text-blue-700 border border-blue-300 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-50 transition"
            >
              {{ $t("board.regenerate") }}
            </button>
          </div>
        </template>
        <button
          @click="showInviteModal = false"
          class="mt-4 text-slate-500 hover:text-slate-700 text-sm"
        >
          {{ $t("board.close") }}
        </button>
      </div>
    </div>

    <!-- 그룹 찾기 모달 -->
    <div
      v-if="showGroupSearch"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showGroupSearch = false"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div class="p-6 border-b border-slate-100">
          <h2 class="text-xl font-bold text-slate-900">
            {{ $t("board.findGroup") }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">
            {{ $t("board.findGroupDesc") }}
          </p>
          <div class="flex gap-2 mt-4">
            <input
              v-model="groupKeyword"
              @keyup.enter="searchGroups"
              :placeholder="$t('board.groupSearchPlaceholder')"
              class="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <button
              @click="searchGroups"
              class="bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-900 transition"
            >
              {{ $t("board.search") }}
            </button>
          </div>
        </div>
        <div class="overflow-y-auto p-4">
          <div v-if="groupLoading" class="text-center py-8 text-slate-400">
            {{ $t("board.loading") }}
          </div>
          <div
            v-else-if="groupResults.length === 0"
            class="text-center py-8 text-slate-400"
          >
            {{
              groupSearched
                ? $t("board.noGroupResult")
                : $t("board.searchToFind")
            }}
          </div>
          <div
            v-for="g in sortedGroupResults"
            :key="g.id"
            class="border border-slate-200 rounded-xl p-4 mb-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <p class="font-semibold text-slate-800">{{ g.name }}</p>
              <p
                v-if="g.description"
                class="text-sm text-slate-500 mt-0.5 line-clamp-2"
              >
                {{ g.description }}
              </p>
              <p
                v-if="g.address"
                class="text-sm text-slate-500 mt-0.5 flex items-center gap-1"
              >
                <span aria-hidden="true">📍</span>{{ g.address }}
              </p>
              <p class="text-xs text-slate-400 mt-1">
                {{ $t("board.memberCount", { count: g.memberCount }) }}
              </p>
            </div>
            <button
              v-if="guestMode"
              @click="viewGroup(g)"
              class="shrink-0 bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-900 transition"
            >
              {{ $t("board.view") }}
            </button>
            <template v-else>
              <button
                v-if="!g.joined"
                @click="joinGroup(g)"
                :disabled="groupJoining === g.id"
                class="shrink-0 bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-blue-900 disabled:opacity-40 transition"
              >
                {{ $t("board.join") }}
              </button>
              <span
                v-else
                class="shrink-0 text-sm text-slate-400 font-semibold"
                >{{ $t("board.joined") }}</span
              >
            </template>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100 flex justify-end">
          <button
            @click="showGroupSearch = false"
            class="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            {{ $t("board.close") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from "qrcode";

interface Family {
  id: number;
  name: string;
  role: string;
  isPublic?: boolean;
  commentsEnabled?: boolean;
}
interface Post {
  id: string;
  familyId: string;
  authorUserId: string;
  authorName: string;
  title: string;
  content: string;
  isNotice: boolean;
  visibleFrom?: string | null;
  visibleUntil?: string | null;
  createdAt: string;
  commentCount: number;
}

interface AllPost extends Post {
  familyName: string;
}
interface Comment {
  id: string;
  authorUserId: string;
  authorName: string;
  content: string;
  createdAt: string;
}
interface Member {
  id: number;
  name: string;
  relation: string | null;
  role: string;
  birthDate: string | null;
  hasAccount: boolean;
  isMe: boolean;
}

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const userId = ref<number | null>(null);

const families = ref<Family[]>([]);
const currentFamily = ref<Family | null>(null);
const viewAll = ref(false);
const allPosts = ref<AllPost[]>([]);
const allPage = ref(1);
const allHasMore = ref(false);
const allLoadingMore = ref(false);
const allSentinel = ref<HTMLElement | null>(null);
let allObserver: IntersectionObserver | null = null;
const posts = ref<Post[]>([]);
const loading = ref(false);
const members = ref<Member[]>([]);
const showMembers = ref(false);
const showManage = ref(false);

const selectedPost = ref<Post | null>(null);
const comments = ref<Comment[]>([]);
const commentInput = ref("");

const showPostForm = ref(false);
const postForm = reactive({ title: "", content: "", isNotice: false, visibleFrom: "", visibleUntil: "" });
const dictationField = ref<"title" | "content">("content");
const titleRef = toRef(postForm, "title");
const contentRef = toRef(postForm, "content");
const postVoice = useVoiceInput(() =>
  dictationField.value === "title" ? titleRef : contentRef,
);
const commentVoice = useVoiceInput(commentInput);

const showFamilyModal = ref<"create" | "join" | null>(null);
const familyModalMode = ref<"create" | "join">("create");
const familyForm = reactive({ name: "", code: "" });

// 그룹 찾기
interface GroupResult {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  memberCount: number;
  joined: boolean;
}
const showGroupSearch = ref(false);
const groupKeyword = ref("");
const groupResults = ref<GroupResult[]>([]);
const groupLoading = ref(false);
const groupSearched = ref(false);
const groupJoining = ref<number | null>(null);

// 목록 정렬: 공지→최신순 / 구성원은 관리자→본인→이름순 / 그룹은 가입→인원→이름순
const sortedPosts = computed(() =>
  [...posts.value].sort((a, b) => {
    if (a.isNotice !== b.isNotice) return a.isNotice ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }),
);
const sortedMembers = computed(() =>
  [...members.value].sort((a, b) => {
    if (a.role !== b.role) return a.role === "HEAD" ? -1 : 1;
    if (a.isMe !== b.isMe) return a.isMe ? -1 : 1;
    return a.name.localeCompare(b.name, "ko");
  }),
);
const sortedGroupResults = computed(() =>
  [...groupResults.value].sort((a, b) => {
    if (a.joined !== b.joined) return a.joined ? -1 : 1;
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    return a.name.localeCompare(b.name, "ko");
  }),
);

// 초대 코드 / QR
const showInviteModal = ref(false);
const inviteLoading = ref(false);
const inviteData = ref<{ code: string; expiresAt: string | null } | null>(null);
const inviteQr = ref("");
const copied = ref(false);

const api = (path: string) => `${config.public.apiBase}${path}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

const formatExpiry = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const loadFamilies = async () => {
  const res = await fetch(api(`/board/families?userId=${userId.value}`));
  if (res.ok) {
    families.value = await res.json();
    if (families.value.length > 0 && !currentFamily.value && !viewAll.value)
      selectFamily(families.value[0]);
  }
};

const selectAll = async () => {
  viewAll.value = true;
  currentFamily.value = null;
  members.value = [];
  posts.value = [];
  allPosts.value = [];
  allPage.value = 1;
  allHasMore.value = false;
  showMembers.value = false;
  showManage.value = false;
  await loadAllPosts();
};

const loadAllPosts = async (append = false) => {
  if (append) allLoadingMore.value = true;
  else loading.value = true;
  try {
    const page = append ? allPage.value + 1 : 1;
    const res = await fetch(
      api(`/board/posts/all?userId=${userId.value}&page=${page}&limit=20`),
    );
    if (res.ok) {
      const data = await res.json();
      allPosts.value = append
        ? [...allPosts.value, ...data.items]
        : data.items;
      allPage.value = data.page;
      allHasMore.value = data.hasMore;
    } else if (!append) {
      allPosts.value = [];
      allHasMore.value = false;
    }
  } finally {
    loading.value = false;
    allLoadingMore.value = false;
  }
};

// 전체 보기 무한스크롤: sentinel이 화면에 보이면 다음 페이지 로드
const setupAllObserver = () => {
  allObserver?.disconnect();
  if (!allSentinel.value) return;
  allObserver = new IntersectionObserver(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        allHasMore.value &&
        !allLoadingMore.value &&
        !loading.value
      ) {
        loadAllPosts(true);
      }
    },
    { rootMargin: "300px" },
  );
  allObserver.observe(allSentinel.value);
};

watch(viewAll, async (v) => {
  if (v) {
    await nextTick();
    setupAllObserver();
  } else {
    allObserver?.disconnect();
  }
});

const selectFamily = async (f: Family) => {
  viewAll.value = false;
  currentFamily.value = f;
  showMembers.value = false;
  showManage.value = false;
  await Promise.all([loadPosts(), loadMembers()]);
};

const loadMembers = async () => {
  if (!currentFamily.value || guestMode.value) return;
  const res = await fetch(
    api(
      `/board/families/${currentFamily.value.id}/members?userId=${userId.value}`,
    ),
  );
  members.value = res.ok ? await res.json() : [];
};

// 댓글 허용/비허용 토글 (가족장 또는 공개 그룹 멤버)
const toggleComments = async () => {
  if (!currentFamily.value || !userId.value) return;
  const enabled = currentFamily.value.commentsEnabled === false;
  const res = await fetch(
    api(`/board/families/${currentFamily.value.id}/comments-enabled`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.value, enabled }),
    },
  );
  if (res.ok) {
    currentFamily.value.commentsEnabled = enabled;
    const f = families.value.find((x) => x.id === currentFamily.value!.id);
    if (f) f.commentsEnabled = enabled;
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err?.message || "처리에 실패했습니다.");
  }
};

const leaveFamily = async () => {
  if (!currentFamily.value) return;
  if (!confirm("이 가족에서 나가시겠습니까?")) return;
  const res = await fetch(
    api(`/board/families/${currentFamily.value.id}/leave`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.value }),
    },
  );
  if (res.ok) {
    currentFamily.value = null;
    members.value = [];
    posts.value = [];
    await loadFamilies();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err?.message || "처리에 실패했습니다.");
  }
};

const kickMember = async (m: Member) => {
  if (!currentFamily.value) return;
  if (!confirm(`${m.name} 님을 가족에서 내보내시겠습니까?`)) return;
  const res = await fetch(
    api(`/board/families/${currentFamily.value.id}/members/${m.id}/remove`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.value }),
    },
  );
  if (res.ok) {
    await loadMembers();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err?.message || "처리에 실패했습니다.");
  }
};

const loadPosts = async () => {
  if (viewAll.value) {
    await loadAllPosts();
    return;
  }
  if (!currentFamily.value) return;
  loading.value = true;
  try {
    const res = await fetch(
      api(
        `/board/posts?familyId=${currentFamily.value.id}&userId=${userId.value}`,
      ),
    );
    posts.value = res.ok ? await res.json() : [];
    // 대시보드 등에서 ?post=ID 로 들어온 경우 상세 바로 열기
    const pid = Number(route.query.post);
    if (pid && !selectedPost.value) {
      const target = posts.value.find((x) => Number(x.id) === pid);
      if (target) {
        openPost(target);
        const q = { ...route.query };
        delete q.post;
        router.replace({ query: q });
      }
    }
  } finally {
    loading.value = false;
  }
};

const openPost = async (p: Post) => {
  selectedPost.value = p;
  commentInput.value = "";
  const res = await fetch(
    api(`/board/posts/${p.id}/comments?userId=${userId.value}`),
  );
  comments.value = res.ok ? await res.json() : [];
};

const canDeletePost = () =>
  selectedPost.value &&
  (String(selectedPost.value.authorUserId) === String(userId.value) ||
    currentFamily.value?.role === "HEAD");

const canDeleteComment = (c: Comment) =>
  String(c.authorUserId) === String(userId.value) ||
  String(selectedPost.value?.authorUserId) === String(userId.value) ||
  currentFamily.value?.role === "HEAD";

const openPostForm = () => {
  postForm.title = "";
  postForm.content = "";
  postForm.isNotice = false;
  postForm.visibleFrom = "";
  postForm.visibleUntil = "";
  showPostForm.value = true;
};

const submitPost = async () => {
  if (!currentFamily.value) return;
  const res = await fetch(api("/board/posts"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyId: currentFamily.value!.id,
      userId: userId.value,
      title: postForm.title.trim(),
      content: postForm.content.trim(),
      isNotice: postForm.isNotice,
      ...(currentFamily.value?.isPublic
        ? {
            visibleFrom: postForm.visibleFrom || undefined,
            visibleUntil: postForm.visibleUntil || undefined,
          }
        : {}),
    }),
  });
  if (res.ok) {
    showPostForm.value = false;
    await loadPosts();
  } else {
    alert("등록에 실패했습니다.");
  }
};

const addComment = async () => {
  if (!commentInput.value.trim() || !selectedPost.value) return;
  const res = await fetch(api("/board/comments"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postId: Number(selectedPost.value.id),
      userId: userId.value,
      content: commentInput.value.trim(),
    }),
  });
  if (res.ok) {
    commentInput.value = "";
    await openPost(selectedPost.value);
    await loadPosts();
  }
};

const deleteComment = async (c: Comment) => {
  if (!confirm("삭제하시겠습니까?")) return;
  await fetch(api(`/board/comments/${c.id}?userId=${userId.value}`), {
    method: "DELETE",
  });
  if (selectedPost.value) await openPost(selectedPost.value);
  await loadPosts();
};

const deletePost = async (p: Post) => {
  if (!confirm("삭제하시겠습니까?")) return;
  await fetch(api(`/board/posts/${p.id}?userId=${userId.value}`), {
    method: "DELETE",
  });
  selectedPost.value = null;
  await loadPosts();
};

const openFamilyModal = (mode: "create" | "join" = "create") => {
  familyModalMode.value = mode;
  familyForm.name = "";
  familyForm.code = "";
  showFamilyModal.value = mode;
};

const submitFamily = async () => {
  const isCreate = familyModalMode.value === "create";
  const res = await fetch(
    api(isCreate ? "/board/families" : "/board/families/join"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isCreate
          ? { userId: userId.value, name: familyForm.name.trim() }
          : { userId: userId.value, code: familyForm.code.trim() },
      ),
    },
  );
  if (res.ok) {
    showFamilyModal.value = null;
    await loadFamilies();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err?.message || "처리에 실패했습니다.");
  }
};

const openGroupSearch = () => {
  showGroupSearch.value = true;
  groupKeyword.value = "";
  groupResults.value = [];
  groupSearched.value = false;
  searchGroups();
};

const searchGroups = async () => {
  groupLoading.value = true;
  groupSearched.value = true;
  try {
    const params = new URLSearchParams({ userId: String(userId.value) });
    if (groupKeyword.value.trim())
      params.set("keyword", groupKeyword.value.trim());
    const res = await fetch(api(`/board/groups?${params}`));
    groupResults.value = res.ok ? await res.json() : [];
  } finally {
    groupLoading.value = false;
  }
};

// 게스트: 공개 그룹 게시글 읽기 전용으로 보기
const viewGroup = async (g: GroupResult) => {
  viewAll.value = false;
  currentFamily.value = { id: g.id, name: g.name, role: "GUEST", isPublic: true };
  members.value = [];
  posts.value = [];
  showGroupSearch.value = false;
  await loadPosts();
};

const joinGroup = async (g: GroupResult) => {
  if (guestMode.value) {
    router.push("/");
    return;
  }
  groupJoining.value = g.id;
  try {
    const res = await fetch(api(`/board/groups/${g.id}/join`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.value }),
    });
    if (res.ok) {
      g.joined = true;
      await loadFamilies();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.message || "가입에 실패했습니다.");
    }
  } finally {
    groupJoining.value = null;
  }
};

const loadInvite = async (regenerate = false) => {
  if (!currentFamily.value) return;
  inviteLoading.value = true;
  try {
    const res = await fetch(
      api(`/board/families/${currentFamily.value.id}/invite-code`),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.value, regenerate }),
      },
    );
    if (res.ok) {
      const data = await res.json();
      inviteData.value = data;
      const inviteUrl = `${window.location.origin}/board?invite=${data.code}`;
      inviteQr.value = await QRCode.toDataURL(inviteUrl, {
        width: 200,
        margin: 1,
      });
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.message || "초대 코드를 불러오지 못했습니다.");
      showInviteModal.value = false;
    }
  } finally {
    inviteLoading.value = false;
  }
};

const openInviteModal = () => {
  showInviteModal.value = true;
  inviteData.value = null;
  inviteQr.value = "";
  copied.value = false;
  loadInvite();
};

const regenInviteCode = () => loadInvite(true);

const copyInviteCode = async () => {
  if (!inviteData.value) return;
  try {
    await navigator.clipboard.writeText(inviteData.value.code);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {}
};

const guestMode = ref(false);

onMounted(() => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    // 게스트: 공개 그룹 정보/게시글은 읽기 전용으로 이용 가능
    userId.value = getGuestUserId();
    guestMode.value = true;
    loadFamilies();
    return;
  }
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId.value = payload.sub ? Number(payload.sub) : null;
  } catch {}
  if (!userId.value) {
    userId.value = getGuestUserId();
    guestMode.value = true;
    loadFamilies();
    return;
  }
  // QR/링크로 들어온 초대 코드 자동 입력
  const inviteParam = route.query.invite;
  if (typeof inviteParam === "string" && inviteParam.trim()) {
    familyForm.code = inviteParam.trim().toUpperCase();
    openFamilyModal("join");
  }
  loadFamilies();
});
</script>
