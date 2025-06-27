<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden" @click.self="closeModal">
    <!-- 背景遮罩 -->
    <div 
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="closeModal"
    ></div>
    
    <!-- 弹窗内容 -->
    <div class="relative w-[90vw] max-w-sm mx-4 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 class="text-lg font-semibold text-white flex items-center">
          <i class="ri-fire-line mr-2 text-green-400"></i>
          {{ marketType === 'crypto' ? t('common.popular_tokens') : t('common.popular_stocks') }}
        </h3>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <i class="ri-close-line text-xl"></i>
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="p-4">
        <!-- 热门资产网格 -->
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="asset in currentAssets"
            :key="asset.symbol"
            @click="handleAssetSelect(asset.symbol)"
            :disabled="loading || asset.symbol === currentSymbol"
            class="group relative p-3 rounded-xl border transition-all duration-300 hover:scale-105"
            :class="{
              'bg-blue-500/20 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/20': asset.symbol === currentSymbol,
              'bg-slate-700/40 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:border-slate-500/60': asset.symbol !== currentSymbol && !loading,
              'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed': loading
            }"
          >
            <div class="text-xs font-bold text-center">{{ asset.display }}</div>
            <!-- 选中指示器 -->
            <div
              v-if="asset.symbol === currentSymbol"
              class="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-900"
            ></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()

// Props
interface Props {
  visible: boolean
  marketType: 'crypto' | 'stock' | 'china'
  currentSymbol: string
  loading: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  select: [symbol: string]
}>()

// 热门代币列表
const popularTokens = [
  { symbol: 'BTCUSDT', display: 'BTC' },
  { symbol: 'ETHUSDT', display: 'ETH' },
  { symbol: 'SOLUSDT', display: 'SOL' },
  { symbol: 'BNBUSDT', display: 'BNB' },
  { symbol: 'XRPUSDT', display: 'XRP' },
  { symbol: 'ADAUSDT', display: 'ADA' },
  { symbol: 'DOGEUSDT', display: 'DOGE' },
  { symbol: 'AVAXUSDT', display: 'AVAX' }
]

// 热门股票列表
const popularStocks = [
  { symbol: 'AAPL', display: 'AAPL' },
  { symbol: 'MSFT', display: 'MSFT' },
  { symbol: 'GOOGL', display: 'GOOGL' },
  { symbol: 'AMZN', display: 'AMZN' },
  { symbol: 'TSLA', display: 'TSLA' },
  { symbol: 'META', display: 'META' },
  { symbol: 'NVDA', display: 'NVDA' },
  { symbol: 'NFLX', display: 'NFLX' }
]

// 当前资产列表
const currentAssets = computed(() => {
  if (props.marketType === 'crypto') {
    return popularTokens
  } else if (props.marketType === 'stock') {
    return popularStocks
  }
  return []
})

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 选择资产
const handleAssetSelect = (symbol: string) => {
  emit('select', symbol)
  closeModal()
}

// 监听弹窗显示状态并阻止背景滚动
watch(() => props.visible, (visible) => {
  if (visible) {
    // 保存当前滚动位置
    const scrollY = window.scrollY
    // 阻止背景滚动
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
  } else {
    // 恢复背景滚动
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    // 恢复滚动位置
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* 添加一些动画效果 */
.group:hover .absolute {
  transform: scale(1.1);
}
</style>
