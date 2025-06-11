<template>
  <div v-if="visible" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center" style="background-color: rgba(0,0,0,0.8) !important;">
    <div class="bg-gray-900 rounded-xl p-6 w-[320px] shadow-xl border border-gray-800 flex flex-col items-center" style="background-color: #1f2937 !important; border: 2px solid #3b82f6 !important;">
      <i class="ri-loader-4-line text-5xl text-blue-400 animate-spin mb-4"></i>
      <h3 class="text-lg font-medium text-center mb-2">
        {{ currentStageText }}
      </h3>
      <p class="text-sm text-gray-400 text-center min-h-[32px]">{{ currentSubText }}</p>
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
  let stages = refreshStages
  
  if (props.type === 'generate') {
    stages = generateStages
  } else if (props.type === 'custom' && props.customStages) {
    stages = props.customStages.map(stage => ({
      title: () => stage.title,
      sub: () => stage.sub || ''
    }))
  }

  let idx = 0
  currentStageText.value = stages[0].title()
  currentSubText.value = stages[0].sub()
  
  if (loadingStageTimer) clearInterval(loadingStageTimer)

  // 只有刷新类型才进行阶段切换，生成类型保持静态显示
  if (stages.length > 1 && props.type === 'refresh') {
    loadingStageTimer = setInterval(() => {
      idx = (idx + 1) % stages.length
      currentStageText.value = stages[idx].title()
      currentSubText.value = stages[idx].sub()
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
