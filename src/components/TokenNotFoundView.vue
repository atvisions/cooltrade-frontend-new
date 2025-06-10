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

    <!-- 刷新旋转loading弹窗 -->
    <div v-if="showRefreshModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-gray-900 rounded-xl p-6 w-[320px] shadow-xl border border-gray-800 flex flex-col items-center">
        <i class="ri-loader-4-line text-5xl text-blue-400 animate-spin mb-4"></i>
        <h3 class="text-lg font-medium text-center mb-2">
          {{ loadingStageText }}
        </h3>
        <p class="text-sm text-gray-400 text-center min-h-[32px]">{{ loadingSubText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted, onMounted } from 'vue'
import { getTechnicalAnalysis } from '@/api'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { useI18n } from 'vue-i18n'

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

// 刷新状态
const showRefreshModal = ref(false)
const loadingStageText = ref('')
const loadingSubText = ref('')
let loadingStageTimer: NodeJS.Timeout | null = null

// 添加请求防抖变量
let refreshPromise: Promise<any> | null = null;

// 计算属性：格式化显示的交易对符号
const formattedSymbol = computed(() => {
  if (props.symbol && typeof props.symbol === 'string' && props.symbol.toUpperCase().endsWith('USDT')) {
    return props.symbol
  }
  return `${props.symbol}/USDT`
})

// 动态切换loading文案
const loadingStages = [
  {
    title: () => getTranslation('analysis.calculating_indicators',
      currentLang.value === 'zh-CN' ? '正在获取市场数据' :
      currentLang.value === 'en-US' ? 'Fetching market data...' :
      currentLang.value === 'ja-JP' ? '市場データ取得中...' :
      currentLang.value === 'ko-KR' ? '시장 데이터 가져오는 중...' :
      'Fetching market data...'),
    sub: () => getTranslation('analysis.calculating_indicators',
      currentLang.value === 'zh-CN' ? '正在进行技术指标计算' :
      currentLang.value === 'en-US' ? 'Calculating technical indicators...' :
      currentLang.value === 'ja-JP' ? 'テクニカル指標計算中...' :
      currentLang.value === 'ko-KR' ? '기술 지표 계산 중...' :
      'Calculating technical indicators...')
  },
  {
    title: () => getTranslation('analysis.analyzing_trends',
      currentLang.value === 'zh-CN' ? '正在分析市场趋势' :
      currentLang.value === 'en-US' ? 'Analyzing market trends...' :
      currentLang.value === 'ja-JP' ? '市場トレンド分析中...' :
      currentLang.value === 'ko-KR' ? '시장 동향 분석 중...' :
      'Analyzing market trends...'),
    sub: () => getTranslation('analysis.generating_advice',
      currentLang.value === 'zh-CN' ? '正在生成交易建议' :
      currentLang.value === 'en-US' ? 'Generating trading advice...' :
      currentLang.value === 'ja-JP' ? '取引アドバイス生成中...' :
      currentLang.value === 'ko-KR' ? '거래 조언 생성 중...' :
      'Generating trading advice...')
  },
  {
    title: () => getTranslation('analysis.risk_assessment',
      currentLang.value === 'zh-CN' ? '正在评估市场风险' :
      currentLang.value === 'en-US' ? 'Assessing market risks...' :
      currentLang.value === 'ja-JP' ? '市場リスク評価中...' :
      currentLang.value === 'ko-KR' ? '시장 위험 평가 중...' :
      'Assessing market risks...'),
    sub: () => getTranslation('analysis.finalizing_data',
      currentLang.value === 'zh-CN' ? '正在完成数据处理' :
      currentLang.value === 'en-US' ? 'Finalizing data...' :
      currentLang.value === 'ja-JP' ? 'データ最終処理中...' :
      currentLang.value === 'ko-KR' ? '데이터 마무리 중...' :
      'Finalizing data...')
  },
  {
    title: () => getTranslation('analysis.preparing_report',
      currentLang.value === 'zh-CN' ? '正在准备分析报告' :
      currentLang.value === 'en-US' ? 'Preparing analysis report...' :
      currentLang.value === 'ja-JP' ? '分析レポート準備中...' :
      currentLang.value === 'ko-KR' ? '분석 보고서 준비 중...' :
      'Preparing analysis report...'),
    sub: () => ''
  }
]

const simulateLoadingStage = () => {
  let idx = 0
  loadingStageText.value = loadingStages[0].title()
  loadingSubText.value = loadingStages[0].sub()
  if (loadingStageTimer) clearInterval(loadingStageTimer)
  loadingStageTimer = setInterval(() => {
    idx = (idx + 1) % loadingStages.length
    loadingStageText.value = loadingStages[idx].title()
    loadingSubText.value = loadingStages[idx].sub()
  }, 5000)
}

const handleRefresh = async () => {
  try {
    if (showRefreshModal.value) {
      return
    }
    showRefreshModal.value = true;

    // 如果已经有刷新请求在进行中，直接返回
    if (refreshPromise) {
      return refreshPromise;
    }

    // 检查是否已有技术数据
    const hasTechnicalData = localStorage.getItem(`technical_data_${props.symbol}`) === 'true'

    // 开始模拟进度
    simulateLoadingStage()

    // 设置一个更长的等待时间，因为生成新报告需要时间
    const maxWaitTime = 60000 // 60秒

    // 创建新的刷新请求Promise
    refreshPromise = new Promise(async (resolve, reject) => {
      try {
        // 使用正确的API端点：先尝试获取现有报告，如果没有则生成新的
        const apiPromise = getTechnicalAnalysis(props.symbol)

        // 使用 Promise.race 来实现超时机制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时，请稍后重试')), maxWaitTime)
        })

        // 等待API响应或超时
        const result = await Promise.race([apiPromise, timeoutPromise])
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        refreshPromise = null
        showRefreshModal.value = false
      }
    })

    return refreshPromise
  } catch (error) {
    console.error('刷新失败:', error)
    showRefreshModal.value = false
    refreshPromise = null
  }
}

// 监听父组件 isRefreshing 变化，刷新完成后自动关闭弹窗
watch(() => props.isRefreshing, (newVal) => {
  if (showRefreshModal.value && newVal === false) {
    // 父组件刷新完成，关闭弹窗
    showRefreshModal.value = false
  }
})

// 组件卸载时清理
onUnmounted(() => {
  refreshPromise = null
})
</script>