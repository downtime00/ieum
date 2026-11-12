<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-2xl">
      <div class="bg-slate-800 rounded-3xl p-4 sm:p-6">
        <h1 class="text-2xl font-bold text-white mb-6">개인정보처리방침</h1>

        <div class="space-y-6 text-white/85 leading-relaxed">
          <section>
            <h2 class="text-lg font-bold text-white mb-2">1. 수집하는 개인정보</h2>
            <p>
              이음(이하 "서비스")은 회원가입 시 이메일 주소, 이름을 수집합니다.
              서비스 이용 과정에서 게시글, 댓글, 복약 알림 등 이용자가 직접
              입력한 정보와 디바이스 푸시 구독 정보가 저장됩니다.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-white mb-2">2. 개인정보의 이용 목적</h2>
            <p>
              수집된 정보는 회원 인증, 가족·모임 게시판 서비스 제공, 행사 정보
              추천, 복약·병원 알림 발송, 서비스 개선 목적으로만 이용됩니다.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-white mb-2">3. 위치 정보</h2>
            <p>
              서비스는 이용자가 직접 위치 저장을 허용한 경우에만 위치 정보를
              사용합니다. 브라우저 위치 권한은 언제든 설정에서 변경하거나
              해제할 수 있으며, IP 기반 지역 추정은 서버에서만 처리됩니다.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-white mb-2">4. 개인정보의 보관 및 파기</h2>
            <p>
              회원 탈퇴 또는 서비스 종료 시 개인정보는 지체 없이 파기됩니다.
              게시글·댓글 등 이용자가 공개한 콘텐츠는 탈퇴 후에도 가족·모임
              구성원을 위해 유지될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-white mb-2">5. 제3자 제공</h2>
            <p>
              서비스는 이용자의 개인정보를 제3자에게 판매하거나 제공하지
              않습니다. 문화정보 데이터는 공공데이터포털 문화정보 API를
              통해 제공됩니다.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-white mb-2">6. 이용자의 권리</h2>
            <p>
              이용자는 언제든지 자신의 개인정보를 조회·수정·삭제할 수 있으며,
              서비스 내 설정 또는 고객 문의를 통해 권리를 행사할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 class="text-lg font-bold text-white mb-2">7. 문의처</h2>
            <p>개인정보 관련 문의: downti****@gmail.com</p>
          </section>

          <p class="text-sm text-white/50 pt-4">
            시행일: 2026년 11월 12일
          </p>
        </div>

        <div class="mt-8">
          <button
            @click="router.back()"
            class="bg-white/15 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/25 transition"
          >
            뒤로가기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
</script>
