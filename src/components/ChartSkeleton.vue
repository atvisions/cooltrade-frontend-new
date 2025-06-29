<template>
  <!-- 使用图片骨架屏，确保100%视觉一致性 -->
  <div class="space-y-6 pb-10">
    <!-- 骨架屏图片 -->
    <div class="w-full">
      <img 
        src="/ChartSkeleton.png" 
        alt="Loading skeleton" 
        class="w-full h-auto rounded-3xl animate-pulse"
        style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 无需props
</script>

<style scoped>
/* 骨架屏动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
