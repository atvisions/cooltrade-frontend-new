<template>
  <header class="w-full flex flex-col items-center justify-center py-6 bg-gradient-to-r from-[#181c24] to-[#232a3b] relative shadow-md">
    <!-- 返回按钮 -->
    <button
      v-if="showBack"
      @click="$emit('back')"
      class="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all shadow-lg border-none focus:outline-none z-10"
    >
      <i class="ri-arrow-left-line text-white text-3xl"></i>
    </button>
    <!-- 关闭按钮 -->
    <button
      v-if="showClose"
      @click="$emit('close')"
      class="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all shadow-lg border-none focus:outline-none z-10"
    >
      <i class="ri-close-line text-white text-3xl"></i>
    </button>
    <div class="flex flex-col items-center justify-center">
      <h1 class="text-3xl font-extrabold text-white tracking-tight mb-2 text-center">{{ title }}</h1>
      <p v-if="subtitle" class="text-gray-400 text-lg text-center font-medium">{{ subtitle }}</p>
    </div>
  </header>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  title: string
  subtitle?: string
  showBack?: boolean
  showClose?: boolean
}>()
// Emits
const emit = defineEmits<{
  (e: 'back'): void
  (e: 'close'): void
}>()
</script>

<style scoped>
header {
  min-height: 96px;
}
@media (max-width: 640px) {
  header {
    padding-top: 24px;
    padding-bottom: 24px;
  }
  h1 {
    font-size: 1.5rem;
  }
}
</style>
