<template>
  <div
    v-if="operatorId"
    class="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="ieum-panel rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
      <div class="flex items-center justify-between mb-4">
        <button @click="$emit('close')" class="text-sm text-sky-600 hover:underline">
          ← 닫기
        </button>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 text-2xl leading-none px-2"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      <OperatorDetail :operator-id="operatorId" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ operatorId: string | null }>();
defineEmits<{ close: [] }>();
</script>
