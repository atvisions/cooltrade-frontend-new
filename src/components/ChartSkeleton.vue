<template>
  <div class="max-w-[375px] mx-auto px-4 pb-16">
    <!-- 价格展示卡片骨架 -->
    <div class="mt-6 p-5 rounded-lg bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/50 shadow-lg">
      <div class="text-center text-gray-400 mb-1 h-4 w-24 bg-gray-700/50 rounded animate-pulse mx-auto"></div>
      <div class="text-center text-3xl font-bold mb-2 h-10 w-32 bg-gray-700/50 rounded animate-pulse mx-auto"></div>
      <div class="flex justify-center gap-3 mt-4 mb-2">
        <div class="h-8 w-24 bg-gray-700/50 rounded-full animate-pulse"></div>
        <div class="h-8 w-24 bg-gray-700/50 rounded-full animate-pulse"></div>
      </div>
    </div>

    <!-- 趋势分析卡片骨架 -->
    <div class="mt-6 grid grid-cols-3 gap-3">
      <div class="p-3 rounded-lg bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30">
        <div class="h-6 w-16 bg-gray-700/50 rounded animate-pulse mx-auto mb-1"></div>
        <div class="h-4 w-20 bg-gray-700/50 rounded animate-pulse mx-auto"></div>
      </div>
      <div class="p-3 rounded-lg bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30">
        <div class="h-6 w-16 bg-gray-700/50 rounded animate-pulse mx-auto mb-1"></div>
        <div class="h-4 w-20 bg-gray-700/50 rounded animate-pulse mx-auto"></div>
      </div>
      <div class="p-3 rounded-lg bg-[rgba(239,68,68,0.12)] border border-red-500/30">
        <div class="h-6 w-16 bg-gray-700/50 rounded animate-pulse mx-auto mb-1"></div>
        <div class="h-4 w-20 bg-gray-700/50 rounded animate-pulse mx-auto"></div>
      </div>
    </div>

    <!-- 市场趋势分析骨架 -->
    <div class="mt-6">
      <div class="h-6 w-32 bg-gray-700/50 rounded animate-pulse mb-3"></div>
      <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
        <div class="space-y-2">
          <div class="h-4 w-full bg-gray-700/50 rounded animate-pulse"></div>
          <div class="h-4 w-3/4 bg-gray-700/50 rounded animate-pulse"></div>
          <div class="h-4 w-5/6 bg-gray-700/50 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- 技术指标分析骨架 -->
    <div class="mt-6">
      <div class="h-6 w-32 bg-gray-700/50 rounded animate-pulse mb-3"></div>
      <div class="grid grid-cols-2 gap-3">
        <!-- 重复6次技术指标卡片 -->
        <template v-for="i in 6" :key="i">
          <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
            <div class="h-4 w-20 bg-gray-700/50 rounded animate-pulse mb-2"></div>
            <div class="flex items-center justify-between">
              <div class="h-5 w-12 bg-gray-700/50 rounded animate-pulse"></div>
              <div class="h-5 w-5 bg-gray-700/50 rounded-full animate-pulse"></div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 加载提示 -->
    <div class="mt-4 text-center">
      <div class="loading-dots flex space-x-2 justify-center">
        <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
        <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
        <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
      </div>
      <p class="text-gray-400 text-sm mt-2">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  loadingText: {
    type: String,
    default: '正在加载分析数据...'
  }
})
</script>

<style scoped>
/* 脉冲动画 */
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

/* 弹跳动画 */
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
