<template>
  <!-- 主要内容区域骨架 - 只包含内容部分，不包含导航和主容器 -->
  <div class="space-y-4 w-full">
    <!-- 资产信息卡片骨架 - 完全匹配实际布局 -->
    <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/40">
      <div class="relative p-4">
        <!-- 顶部区域：标题和导航骨架 -->
        <div class="flex items-center justify-between mb-3">
          <!-- 左侧：资产信息骨架 -->
          <div class="flex items-center space-x-3">
            <!-- 市场指示器骨架 -->
            <div class="w-3 h-3 bg-slate-700/50 rounded-full animate-pulse"></div>
            <!-- 标题骨架 -->
            <div class="h-4 w-24 bg-slate-700/50 rounded animate-pulse"></div>
            <!-- 收藏按钮骨架 -->
            <div class="w-6 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
          </div>
          <!-- 右侧：导航按钮骨架 -->
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 bg-slate-700/50 rounded-xl animate-pulse"></div>
            <div class="w-9 h-9 bg-slate-700/50 rounded-xl animate-pulse"></div>
          </div>
        </div>

        <!-- 价格区域骨架 -->
        <div class="mb-3">
          <!-- 快照标签骨架 -->
          <div class="flex items-center space-x-2 mb-2">
            <div class="w-4 h-4 bg-slate-700/50 rounded animate-pulse"></div>
            <div class="h-3 w-20 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
          <!-- 价格显示骨架 - 匹配实际的text-2xl高度 -->
          <div class="flex items-baseline space-x-3">
            <div class="h-8 w-32 bg-slate-700/50 rounded animate-pulse"></div>
            <div class="h-4 w-8 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
        </div>

        <!-- 底部操作区域骨架 -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-700/30">
          <!-- 时间信息骨架 -->
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-slate-700/50 rounded animate-pulse"></div>
            <div class="h-3 w-16 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
          <!-- 操作按钮组骨架 -->
          <div class="flex items-center space-x-2">
            <div class="w-9 h-9 bg-slate-700/50 rounded-xl animate-pulse"></div>
            <div class="w-9 h-9 bg-slate-700/50 rounded-xl animate-pulse"></div>
            <div class="w-9 h-9 bg-slate-700/50 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 趋势分析卡片骨架 -->
    <div class="space-y-4">
      <!-- 趋势分析标题骨架 -->
      <div class="flex items-center space-x-3">
        <div class="w-1 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
        <div class="h-6 w-32 bg-slate-700/50 rounded animate-pulse"></div>
      </div>
      
      <!-- 趋势概率网格骨架 -->
      <div class="grid grid-cols-3 gap-4">
        <!-- 上涨趋势骨架 -->
        <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center space-y-3">
          <div class="w-8 h-8 mx-auto bg-slate-700/50 rounded-xl animate-pulse"></div>
          <div class="h-6 w-12 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
          <div class="h-3 w-10 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
        </div>
        
        <!-- 横盘趋势骨架 -->
        <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center space-y-3">
          <div class="w-8 h-8 mx-auto bg-slate-700/50 rounded-xl animate-pulse"></div>
          <div class="h-6 w-12 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
          <div class="h-3 w-10 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
        </div>
        
        <!-- 下跌趋势骨架 -->
        <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center space-y-3">
          <div class="w-8 h-8 mx-auto bg-slate-700/50 rounded-xl animate-pulse"></div>
          <div class="h-6 w-12 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
          <div class="h-3 w-10 bg-slate-700/50 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
    </div>

    <!-- 市场趋势分析骨架 -->
    <div class="space-y-4">
      <!-- 市场趋势分析标题骨架 -->
      <div class="flex items-center space-x-3">
        <div class="w-1 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
        <div class="h-6 w-40 bg-slate-700/50 rounded animate-pulse"></div>
      </div>
      
      <!-- 市场趋势分析内容骨架 -->
      <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
        <div class="flex items-start space-x-3">
          <div class="w-8 h-8 bg-slate-700/50 rounded-xl animate-pulse flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-full bg-slate-700/50 rounded animate-pulse"></div>
            <div class="h-4 w-3/4 bg-slate-700/50 rounded animate-pulse"></div>
            <div class="h-4 w-1/2 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术指标分析骨架 -->
    <div class="space-y-4">
      <!-- 技术指标标题骨架 -->
      <div class="flex items-center space-x-3">
        <div class="w-1 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
        <div class="h-6 w-32 bg-slate-700/50 rounded animate-pulse"></div>
      </div>

      <!-- 单参数指标网格骨架 -->
      <div class="grid grid-cols-2 gap-3">
        <div v-for="i in 4" :key="i" class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2 flex-1">
              <div class="h-3 w-12 bg-slate-700/50 rounded animate-pulse"></div>
              <div class="w-3 h-3 bg-slate-700/50 rounded animate-pulse"></div>
            </div>
            <div class="w-6 h-6 bg-slate-700/50 rounded-xl animate-pulse ml-2"></div>
          </div>
          <div class="h-5 w-16 bg-slate-700/50 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- 交易建议骨架 -->
    <div class="space-y-4">
      <!-- 交易建议标题骨架 -->
      <div class="flex items-center space-x-3">
        <div class="w-1 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
        <div class="h-6 w-24 bg-slate-700/50 rounded animate-pulse"></div>
      </div>
      
      <!-- 交易建议内容骨架 -->
      <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-4">
        <!-- 推荐操作骨架 -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-700/30">
          <div class="h-4 w-20 bg-slate-700/50 rounded animate-pulse"></div>
          <div class="h-6 w-12 bg-slate-700/50 rounded-xl animate-pulse"></div>
        </div>
        
        <!-- 建议原因骨架 -->
        <div class="space-y-2">
          <div class="h-4 w-16 bg-slate-700/50 rounded animate-pulse"></div>
          <div class="space-y-2">
            <div class="h-3 w-full bg-slate-700/50 rounded animate-pulse"></div>
            <div class="h-3 w-3/4 bg-slate-700/50 rounded animate-pulse"></div>
            <div class="h-3 w-1/2 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  loadingText: {
    type: String,
    default: 'Loading...'
  }
})
</script>

<style scoped>
.loading-dots div {
  animation: bounce 1.4s infinite ease-in-out both;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
