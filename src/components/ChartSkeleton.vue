<template>
  <div class="space-y-6">
    <!-- 价格展示卡片骨架 - 完全匹配实际布局 -->
    <div class="relative">
      <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 shadow-xl">
        <div class="text-center space-y-4">
          <div class="space-y-1">
            <!-- SNAPSHOT PRICE 标题骨架 -->
            <div class="h-4 w-28 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
            <!-- 价格数字骨架 -->
            <div class="flex items-baseline justify-center space-x-2">
              <div class="h-12 w-48 bg-slate-700/50 rounded animate-pulse"></div>
              <div class="h-6 w-8 bg-slate-700/50 rounded animate-pulse"></div>
            </div>
          </div>

          <!-- 操作按钮骨架 -->
          <div class="flex justify-center gap-3 pt-2">
            <div class="h-10 w-32 bg-slate-700/50 rounded-xl animate-pulse"></div>
            <div class="h-10 w-28 bg-slate-700/50 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Last Update skeleton card -->
    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div class="flex items-center text-xs">
        <div class="w-4 h-4 bg-slate-700/50 rounded-full animate-pulse mr-2"></div>
        <div class="h-3 w-24 bg-slate-700/50 rounded animate-pulse mr-2"></div>
        <div class="h-3 w-20 bg-slate-700/50 rounded animate-pulse"></div>
      </div>
      <div class="w-8 h-8 bg-slate-700/50 rounded-lg animate-pulse"></div>
    </div>

    <!-- Trend Analysis 标题骨架 -->
    <div>
      <div class="h-6 w-32 bg-slate-700/50 rounded animate-pulse mb-4"></div>
    </div>

    <!-- 加载提示 -->
    <div class="text-center py-8">
      <div class="loading-dots flex space-x-2 justify-center mb-3">
        <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
        <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
        <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
      </div>
      <p class="text-slate-400 text-sm">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  loadingText: {
    type: String,
    default: 'Loading analysis data...'
  }
})
</script>

<style scoped>
/* Pulse animation */
@keyframes pulse {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.3;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Bounce animation */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
