<template>
  <!-- 紧凑的数据未找到卡片 -->
  <div class="w-full max-w-[375px] mx-auto">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-slate-700/40 transition-all duration-300">
      <!-- 背景光效 -->
      <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 opacity-60"></div>

      <div class="relative p-5">
        <!-- 图标和标题 -->
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
            <i class="ri-database-2-line text-2xl text-orange-400"></i>
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">
              {{ getTranslation('tokenNotFound.title',
                 currentLang === 'zh-CN' ? `${formattedSymbol} 数据未找到` :
                 currentLang === 'en-US' ? `${formattedSymbol} Data Not Found` :
                 currentLang === 'ja-JP' ? `${formattedSymbol} データが見つかりません` :
                 currentLang === 'ko-KR' ? `${formattedSymbol} 데이터를 찾을 수 없습니다` :
                 `${formattedSymbol} Data Not Found`,
                 { symbol: formattedSymbol })
              }}
            </h2>
            <p class="text-slate-400 text-xs">
              {{ getTranslation('tokenNotFound.description',
                 currentLang === 'zh-CN' ? '点击下方按钮获取数据' :
                 currentLang === 'en-US' ? 'Click below to get data' :
                 currentLang === 'ja-JP' ? '下のボタンでデータを取得' :
                 currentLang === 'ko-KR' ? '아래 버튼으로 데이터 가져오기' :
                 'Click below to get data')
              }}
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <button
          class="w-full px-4 py-3 bg-gradient-to-r from-blue-500/15 to-blue-600/15 hover:from-blue-500/25 hover:to-blue-600/25 text-blue-400 rounded-xl font-medium transition-all duration-200 border border-blue-500/40 hover:border-blue-400/60 flex items-center justify-center space-x-2 group"
          @click="handleRefresh"
          :disabled="showRefreshModal"
          :class="{ 'opacity-50 cursor-not-allowed': showRefreshModal }"
        >
          <i class="ri-refresh-line text-base transition-transform duration-200 group-hover:rotate-180" :class="{ 'animate-spin': showRefreshModal }"></i>
          <span class="text-sm">
            {{ getTranslation('tokenNotFound.refreshButton',
               currentLang === 'zh-CN' ? '获取最新数据' :
               currentLang === 'en-US' ? 'Get Latest Data' :
               currentLang === 'ja-JP' ? '最新データを取得' :
               currentLang === 'ko-KR' ? '최신 데이터 가져오기' :
               'Get Latest Data')
            }}
          </span>
        </button>
      </div>
    </div>

    <!-- 刷新中模态框 -->
    <LoadingModal
      v-if="showRefreshModal"
      :visible="showRefreshModal"
      type="generate"
      :text="t('tokenNotFound.loading')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted, onMounted } from 'vue'
import { getLatestTechnicalAnalysis } from '@/api'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { useI18n } from 'vue-i18n'
import LoadingModal from '@/components/LoadingModal.vue'

// 使用增强的翻译函数
const { t } = useEnhancedI18n()
// 使用原始的 vue-i18n 翻译函数
const { locale } = useI18n()

// 当前语言
const currentLang = ref(localStorage.getItem('language') || 'en-US')

// 获取翻译文本，如果翻译失败则使用默认值
const getTranslation = (key: string, defaultText: string, params?: Record<string, any>) => {
  const result = t(key, params)
  return result === key ? defaultText : result
}

// 监听语言变化
watch(() => locale.value, (newLocale) => {
  currentLang.value = newLocale
})

// 监听 localStorage 中的语言变化
const setupLanguageChangeListener = () => {
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US'
    console.log(`[TokenNotFoundView] 收到语言变更事件: ${newLang}`)
    currentLang.value = newLang
  })

  window.addEventListener('force-refresh-i18n', () => {
    const newLang = localStorage.getItem('language') || 'en-US'
    console.log(`[TokenNotFoundView] 收到强制刷新事件: ${newLang}`)
    currentLang.value = newLang
  })
}

// 在组件挂载时设置监听器
onMounted(() => {
  // 设置语言变更监听器
  setupLanguageChangeListener()
})

const props = defineProps<{
  symbol: string
  marketType?: 'crypto' | 'stock' | 'china'
  isRefreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh-success'): void
  (e: 'refresh-error', error: any): void
}>()

// 刷新状态和模态框控制
const isRefreshing = ref(false)
const showRefreshModal = ref(false)

// 添加请求防抖变量
let refreshPromise: Promise<any> | null = null;

// 计算属性：格式化显示的交易对符号
const formattedSymbol = computed(() => {
  if (!props.symbol || typeof props.symbol !== 'string') {
    return props.marketType === 'stock' ? 'Unknown' : 'Unknown/USDT'
  }

  // 对于股票市场，不添加USDT后缀
  if (props.marketType === 'stock') {
    return props.symbol
  }

  // 对于加密货币市场，添加USDT后缀（如果还没有的话）
  if (props.symbol.toUpperCase().endsWith('USDT')) {
    return props.symbol
  }
  return `${props.symbol}/USDT`
})

// 刷新报告
const handleRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  showRefreshModal.value = true

  try {
    console.log('TokenNotFoundView: Start refreshing report...')

    // 调用 getLatestTechnicalAnalysis 生成新报告
    console.log('TokenNotFoundView: Calling getLatestTechnicalAnalysis to generate new report')
    const marketType = (props.marketType === 'china' ? 'stock' : props.marketType) || 'crypto'
    console.log(`[DEBUG] TokenNotFoundView - symbol: ${props.symbol}, marketType: ${marketType}`)
    const result = await getLatestTechnicalAnalysis(props.symbol, marketType)

    // 如果返回了有效数据
    if (result && (result as any).status !== 'not_found') {
      console.log('TokenNotFoundView: Successfully got new report data!')
      emit('refresh-success')
      // 延迟关闭弹窗，给父组件时间加载数据
      setTimeout(() => {
        showRefreshModal.value = false
      }, 1000)
    } else {
      // 如果仍然没有找到，抛出错误
      throw new Error('Failed to generate report, please try again later')
    }
  } catch (error) {
    console.error('TokenNotFoundView: Failed to refresh report:', error)
    emit('refresh-error', error)
    showRefreshModal.value = false
  } finally {
    isRefreshing.value = false
  }
}

// 组件卸载时清理
onUnmounted(() => {
  showRefreshModal.value = false
  isRefreshing.value = false
})
</script>