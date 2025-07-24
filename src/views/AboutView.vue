<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
      <div class="flex items-center justify-between p-4">
        <button @click="handleBack" class="text-white hover:text-blue-400 transition-colors">
          <i class="ri-arrow-left-line text-xl"></i>
        </button>
        <h1 class="text-lg font-bold text-white">关于我们</h1>
        <div class="w-6"></div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="p-4 space-y-6">
      <!-- 应用介绍 -->
      <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <div class="text-center mb-6">
          <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="ri-line-chart-line text-3xl text-white"></i>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">CoolTrade</h2>
          <p class="text-gray-400">专业的加密货币分析工具</p>
        </div>

        <div class="space-y-4 text-gray-300">
          <p class="leading-relaxed">
            CoolTrade 是一款专为加密货币投资者设计的专业分析工具，提供实时市场数据、技术指标分析和智能投资建议。
          </p>
          <p class="leading-relaxed">
            我们致力于为用户提供准确、及时的市场分析，帮助投资者做出更明智的投资决策。
          </p>
        </div>
      </div>

      <!-- 核心功能 -->
      <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
        <h3 class="text-xl font-bold text-white mb-4">核心功能</h3>
        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mt-1">
              <i class="ri-line-chart-line text-blue-400"></i>
            </div>
            <div>
              <h4 class="text-white font-medium">实时技术分析</h4>
              <p class="text-gray-400 text-sm">提供多种技术指标和图表分析工具</p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mt-1">
              <i class="ri-money-dollar-circle-line text-green-400"></i>
            </div>
            <div>
              <h4 class="text-white font-medium">市场数据</h4>
              <p class="text-gray-400 text-sm">实时价格、成交量等关键市场信息</p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mt-1">
              <i class="ri-brain-line text-purple-400"></i>
            </div>
            <div>
              <h4 class="text-white font-medium">智能分析</h4>
              <p class="text-gray-400 text-sm">基于AI的市场趋势预测和投资建议</p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mt-1">
              <i class="ri-vip-crown-line text-orange-400"></i>
            </div>
            <div>
              <h4 class="text-white font-medium">会员服务</h4>
              <p class="text-gray-400 text-sm">高级分析报告和专属投资策略</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一页
const handleBack = () => {
  router.back()
}
</script>