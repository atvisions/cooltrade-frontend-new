<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- 页面标题 -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold mb-4 text-gray-200">
          关于 CoolTrade
        </h1>
        <p class="text-xl text-gray-400">
          了解我们的项目和技术架构
        </p>
      </div>

      <!-- 项目介绍 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div class="card bg-dark-800 border border-dark-700">
          <h2 class="text-2xl font-semibold mb-4 text-blue-400">
            <i class="ri-information-line mr-2"></i>
            项目简介
          </h2>
          <div class="space-y-4 text-gray-300">
            <p>
              CoolTrade 是一个专业的加密货币分析平台，致力于为用户提供实时、准确的市场分析和交易建议。
            </p>
            <p>
              我们使用最新的前端技术栈构建了这个现代化的 Web 应用，确保用户体验的流畅性和数据的实时性。
            </p>
            <ul class="list-disc list-inside space-y-2 text-sm">
              <li>实时市场数据监控</li>
              <li>专业技术分析工具</li>
              <li>多语言支持</li>
              <li>响应式设计</li>
            </ul>
          </div>
        </div>

        <div class="card bg-dark-800 border border-dark-700">
          <h2 class="text-2xl font-semibold mb-4 text-green-400">
            <i class="ri-code-line mr-2"></i>
            技术架构
          </h2>
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold text-gray-200 mb-2">前端技术</h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="tech in frontendTech" :key="tech" 
                      class="px-3 py-1 bg-primary-600 text-white text-xs rounded-full">
                  {{ tech }}
                </span>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-gray-200 mb-2">开发工具</h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="tool in devTools" :key="tool" 
                      class="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                  {{ tool }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能特性 -->
      <div class="mb-12">
        <h2 class="text-2xl font-bold text-center mb-8 text-gray-200">
          核心功能
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="feature in features" :key="feature.title"
               class="card bg-dark-800 border border-dark-700 hover:border-blue-500 transition-colors">
            <div class="text-center">
              <div class="text-3xl mb-3">{{ feature.icon }}</div>
              <h3 class="text-lg font-semibold mb-2" :class="feature.color">
                {{ feature.title }}
              </h3>
              <p class="text-gray-400 text-sm">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Statistics -->
      <div class="card bg-dark-800 border border-dark-700">
        <h2 class="text-2xl font-semibold mb-6 text-center text-gray-200">
          Project Statistics
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div v-for="stat in stats" :key="stat.label">
            <div class="text-2xl font-bold mb-1" :class="stat.color">
              {{ stat.value }}
            </div>
            <div class="text-sm text-gray-400">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const frontendTech = [
  'Vue 3', 'TypeScript', 'Vite', 'TailwindCSS', 
  'Element Plus', 'Vue Router', 'Pinia'
]

const devTools = [
  'ESLint', 'Prettier', 'PostCSS', 'Autoprefixer', 
  'Terser', 'Vue DevTools'
]

const features = [
  {
    icon: '📊',
    title: '实时数据',
    description: '获取最新的市场数据和价格信息',
    color: 'text-blue-400'
  },
  {
    icon: '📈',
    title: '技术分析',
    description: '专业的技术指标和图表分析',
    color: 'text-green-400'
  },
  {
    icon: '🔔',
    title: '智能提醒',
    description: '价格预警和重要事件通知',
    color: 'text-yellow-400'
  },
  {
    icon: '🌐',
    title: '多语言',
    description: '支持中文、英文、日文、韩文',
    color: 'text-purple-400'
  },
  {
    icon: '📱',
    title: '响应式',
    description: '完美适配桌面端和移动端',
    color: 'text-pink-400'
  },
  {
    icon: '🔒',
    title: '安全性',
    description: '数据加密和隐私保护',
    color: 'text-red-400'
  }
]

const stats = [
  { label: '组件数量', value: '20+', color: 'text-blue-400' },
  { label: '代码行数', value: '5K+', color: 'text-green-400' },
  { label: '依赖包', value: '15+', color: 'text-blue-400' },
  { label: '构建时间', value: '<30s', color: 'text-yellow-400' }
]

onMounted(() => {
  // Component mounted
})
</script>
