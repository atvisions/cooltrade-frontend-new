<template>
  <div v-if="visible" class="chrome-extension-modal" style="z-index: 9999;">
    <div class="bg-[#232a36] rounded-xl shadow-lg px-6 py-8 flex flex-col items-center w-80 border-2 border-blue-500">
      <div class="flex items-center justify-center mb-4">
        <svg class="animate-spin h-10 w-10 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      </div>
      <div v-if="type === 'generate'" class="w-full text-center">
        <div class="text-white text-lg font-semibold mb-1">
          {{ generateStages[0].title() }}
        </div>
        <div class="text-gray-400 text-sm">
          {{ generateStages[0].sub() }}
        </div>
      </div>
      <div v-else-if="type === 'refresh'" class="w-full text-center">
        <div class="text-white text-lg font-semibold mb-1">
          {{ currentStageText || 'Loading...' }}
        </div>
        <div class="text-gray-400 text-sm">
          {{ currentSubText || 'Please wait' }}
        </div>
        <!-- 调试信息 -->
        <div class="text-xs text-gray-500 mt-2">
          Debug: type={{ type }}, text={{ currentStageText }}, sub={{ currentSubText }}
        </div>
      </div>
      <slot v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()

interface Props {
  visible: boolean
  type?: 'refresh' | 'generate' | 'custom'
  customStages?: Array<{
    title: string
    sub?: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  type: 'refresh'
})

// 调试：监控visible属性变化
watch(() => props.visible, (newVal) => {
  console.log('LoadingModal visible changed to:', newVal)
}, { immediate: true })

const currentStageText = ref('')
const currentSubText = ref('')
let loadingStageTimer: NodeJS.Timeout | null = null

// 获取当前语言
const getCurrentLang = () => {
  return localStorage.getItem('language') || 'en-US'
}

// 获取翻译文本，如果翻译失败则使用默认值
const getTranslation = (key: string, defaultText: string) => {
  const result = t(key)
  return result === key ? defaultText : result
}

// 刷新类型的加载阶段
const refreshStages = [
  {
    title: () => getTranslation('analysis.calculating_indicators',
      getCurrentLang() === 'zh-CN' ? '正在获取市场数据' :
      getCurrentLang() === 'en-US' ? 'Fetching market data...' :
      getCurrentLang() === 'ja-JP' ? '市場データ取得中...' :
      getCurrentLang() === 'ko-KR' ? '시장 데이터 가져오는 중...' :
      'Fetching market data...'),
    sub: () => getTranslation('analysis.calculating_indicators',
      getCurrentLang() === 'zh-CN' ? '获取最新价格和交易量数据' :
      getCurrentLang() === 'en-US' ? 'Getting latest price and volume data' :
      getCurrentLang() === 'ja-JP' ? '最新の価格と出来高データを取得' :
      getCurrentLang() === 'ko-KR' ? '최신 가격 및 거래량 데이터 가져오기' :
      'Getting latest price and volume data')
  },
  {
    title: () => getTranslation('analysis.analyzing_trends',
      getCurrentLang() === 'zh-CN' ? '正在计算技术指标' :
      getCurrentLang() === 'en-US' ? 'Calculating technical indicators...' :
      getCurrentLang() === 'ja-JP' ? 'テクニカル指標計算中...' :
      getCurrentLang() === 'ko-KR' ? '기술 지표 계산 중...' :
      'Calculating technical indicators...'),
    sub: () => getTranslation('analysis.analyzing_trends',
      getCurrentLang() === 'zh-CN' ? '分析RSI、MACD、布林带等指标' :
      getCurrentLang() === 'en-US' ? 'Analyzing RSI, MACD, Bollinger Bands, etc.' :
      getCurrentLang() === 'ja-JP' ? 'RSI、MACD、ボリンジャーバンドなどを分析' :
      getCurrentLang() === 'ko-KR' ? 'RSI, MACD, 볼린저 밴드 등 분석' :
      'Analyzing RSI, MACD, Bollinger Bands, etc.')
  },
  {
    title: () => getTranslation('analysis.generating_advice',
      getCurrentLang() === 'zh-CN' ? '正在分析市场趋势' :
      getCurrentLang() === 'en-US' ? 'Analyzing market trends...' :
      getCurrentLang() === 'ja-JP' ? '市場トレンド分析中...' :
      getCurrentLang() === 'ko-KR' ? '시장 트렌드 분석 중...' :
      'Analyzing market trends...'),
    sub: () => getTranslation('analysis.generating_advice',
      getCurrentLang() === 'zh-CN' ? '评估上涨、下跌和盘整概率' :
      getCurrentLang() === 'en-US' ? 'Evaluating up, down, and sideways probabilities' :
      getCurrentLang() === 'ja-JP' ? '上昇、下降、横ばいの確率を評価' :
      getCurrentLang() === 'ko-KR' ? '상승, 하락, 횡보 확률 평가' :
      'Evaluating up, down, and sideways probabilities')
  },
  {
    title: () => getTranslation('analysis.finalizing_data',
      getCurrentLang() === 'zh-CN' ? '正在生成交易建议' :
      getCurrentLang() === 'en-US' ? 'Generating trading advice...' :
      getCurrentLang() === 'ja-JP' ? '取引アドバイス生成中...' :
      getCurrentLang() === 'ko-KR' ? '거래 조언 생성 중...' :
      'Generating trading advice...'),
    sub: () => getTranslation('analysis.finalizing_data',
      getCurrentLang() === 'zh-CN' ? '制定入场价、止损价和目标价' :
      getCurrentLang() === 'en-US' ? 'Setting entry, stop loss, and target prices' :
      getCurrentLang() === 'ja-JP' ? 'エントリー、ストップロス、ターゲット価格を設定' :
      getCurrentLang() === 'ko-KR' ? '진입, 손절, 목표 가격 설정' :
      'Setting entry, stop loss, and target prices')
  },
  {
    title: () => getTranslation('analysis.preparing_analysis_report',
      getCurrentLang() === 'zh-CN' ? '正在完成分析报告' :
      getCurrentLang() === 'en-US' ? 'Finalizing analysis report...' :
      getCurrentLang() === 'ja-JP' ? '分析レポート完成中...' :
      getCurrentLang() === 'ko-KR' ? '분석 보고서 완성 중...' :
      'Finalizing analysis report...'),
    sub: () => ''
  }
]

// 生成报告类型的加载阶段
const generateStages = [
  {
    title: () => getTranslation('analysis.generating_new_report',
      getCurrentLang() === 'zh-CN' ? '正在生成新的分析报告' :
      getCurrentLang() === 'en-US' ? 'Generating new analysis report...' :
      getCurrentLang() === 'ja-JP' ? '新しい分析レポートを生成中...' :
      getCurrentLang() === 'ko-KR' ? '새로운 분석 보고서 생성 중...' :
      'Generating new analysis report...'),
    sub: () => getTranslation('analysis.please_wait',
      getCurrentLang() === 'zh-CN' ? '请耐心等待，这可能需要一些时间' :
      getCurrentLang() === 'en-US' ? 'Please wait, this may take some time' :
      getCurrentLang() === 'ja-JP' ? 'お待ちください、時間がかかる場合があります' :
      getCurrentLang() === 'ko-KR' ? '잠시 기다려 주세요, 시간이 걸릴 수 있습니다' :
      'Please wait, this may take some time')
  }
]

// 开始加载动画
const startLoadingAnimation = () => {
  console.log('[LoadingModal] Starting animation, type:', props.type)
  let stages = refreshStages

  if (props.type === 'generate') {
    stages = generateStages
  } else if (props.type === 'custom' && props.customStages) {
    stages = props.customStages.map(stage => ({
      title: () => stage.title,
      sub: () => stage.sub || ''
    }))
  }

  console.log('[LoadingModal] Using stages:', stages.length, 'stages')
  let idx = 0
  currentStageText.value = stages[0].title()
  currentSubText.value = stages[0].sub()
  console.log('[LoadingModal] Initial text:', currentStageText.value, currentSubText.value)

  if (loadingStageTimer) clearInterval(loadingStageTimer)

  // 只有刷新类型才进行阶段切换，生成类型保持静态显示
  if (stages.length > 1 && props.type === 'refresh') {
    console.log('[LoadingModal] Setting up stage timer for refresh type')
    loadingStageTimer = setInterval(() => {
      idx = (idx + 1) % stages.length
      currentStageText.value = stages[idx].title()
      currentSubText.value = stages[idx].sub()
      console.log('[LoadingModal] Stage changed to:', idx, currentStageText.value)
    }, 5000)
  }
}

// 停止加载动画
const stopLoadingAnimation = () => {
  if (loadingStageTimer) {
    clearInterval(loadingStageTimer)
    loadingStageTimer = null
  }
}

// 监听 visible 变化
watch(() => props.visible, (newVal) => {
  console.log('LoadingModal visible 变化:', newVal, 'type:', props.type)
  if (newVal) {
    startLoadingAnimation()
  } else {
    stopLoadingAnimation()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopLoadingAnimation()
})
</script>

<style scoped>
.chrome-extension-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  max-width: 400px; /* Chrome扩展popup的典型宽度 */
  max-height: 600px; /* Chrome扩展popup的典型高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* 确保在Chrome扩展环境中正确显示 */
@media (max-width: 400px) {
  .chrome-extension-modal {
    max-width: 100vw;
    max-height: 100vh;
  }
}
</style>
