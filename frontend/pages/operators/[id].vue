<template>
  <div class="min-h-screen bg-stone-50">
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="ieum-panel rounded-3xl p-4 sm:p-6">
        <div class="mb-4">
          <button @click="goBack" class="text-sm text-sky-300 hover:underline">
            ← 뒤로가기
          </button>
        </div>
        <OperatorDetail :operator-id="String(route.params.id)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const goBack = () => {
  if (window.history.length > 1) window.history.back();
  else router.push("/operators");
};
</script>
