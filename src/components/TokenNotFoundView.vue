<template>
  <div class="flex flex-col items-center justify-center h-full text-center px-4">
    <div class="mb-6">
      <i class="ri-database-2-line text-5xl text-yellow-500"></i>
    </div>
    <h2 class="text-xl font-semibold text-white mb-2">
      {{ getTranslation('tokenNotFound.title',
         currentLang === 'zh-CN' ? `${formattedSymbol} 数据未找到` :
         currentLang === 'en-US' ? `${formattedSymbol} Data Not Found` :
         currentLang === 'ja-JP' ? `${formattedSymbol} データが見つかりません` :
         currentLang === 'ko-KR' ? `${formattedSymbol} 데이터를 찾을 수 없습니다` :
         `${formattedSymbol} Data Not Found`,
         { symbol: formattedSymbol })
      }}
    </h2>
    <p class="text-gray-300 mb-6">
      {{ getTranslation('tokenNotFound.description',
         currentLang === 'zh-CN' ? '该代币尚未在我们的数据库中，点击下方按钮获取最新数据' :
         currentLang === 'en-US' ? 'This token is not yet in our database. Click the button below to get the latest data.' :
         currentLang === 'ja-JP' ? 'このトークンはまだデータベースにありません。下のボタンをクリックして最新データを取得してください。' :
         currentLang === 'ko-KR' ? '이 토큰은 아직 데이터베이스에 없습니다. 아래 버튼을 클릭하여 최신 데이터를 가져오세요.' :
         'This token is not yet in our database. Click the button below to get the latest data.')
      }}
    </p>

    <button
      class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mb-4 w-full max-w-xs transition-colors duration-200 flex items-center justify-center"
      @click="handleRefresh"
      :disabled="showRefreshModal"
    >
      <span class="flex items-center justify-center">
        <i class="ri-refresh-line mr-2" :class="{ 'animate-spin': showRefreshModal }"></i>
        {{ getTranslation('tokenNotFound.refreshButton',
           currentLang === 'zh-CN' ? '获取最新市场数据' :
           currentLang === 'en-US' ? 'Get Latest Market Data' :
           currentLang === 'ja-JP' ? '最新の市場データを取得' :
           currentLang === 'ko-KR' ? '최신 시장 데이터 가져오기' :
           'Get Latest Market Data')
        }}
      </span>
    </button>

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
    return 'Unknown/USDT'
  }

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
    const result = await getLatestTechnicalAnalysis(props.symbol)

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