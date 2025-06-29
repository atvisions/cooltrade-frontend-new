<template>
  <!-- 紧凑精致的数据未找到卡片 -->
  <div class="w-full max-w-[320px] mx-auto animate-fade-in">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900/60 to-slate-800 backdrop-blur-xl border border-blue-500/20 shadow-xl">
      <!-- 背景光斑 -->
      <div class="absolute -top-8 -left-8 w-24 h-24 bg-blue-500/15 rounded-full blur-xl animate-pulse"></div>
      <div class="absolute -bottom-8 -right-8 w-24 h-24 bg-orange-400/15 rounded-full blur-xl animate-pulse"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 opacity-40"></div>

      <div class="relative flex flex-col items-center justify-center p-5 min-h-[200px]">
        <!-- 图标和标题 -->
        <div class="flex flex-col items-center mb-3">
          <div class="w-12 h-12 bg-gradient-to-br from-orange-400/30 to-yellow-400/30 shadow border border-orange-400/20 rounded-xl flex items-center justify-center mb-2 animate-pop">
            <i class="ri-database-2-line text-2xl text-orange-300 drop-shadow"></i>
          </div>
          <h2 class="text-lg font-bold text-blue-200 drop-shadow mb-1 text-center leading-tight">
            {{ getTranslation('tokenNotFound.title',
               currentLang === 'zh-CN' ? `${formattedSymbol} 数据未找到` :
               currentLang === 'en-US' ? `${formattedSymbol} Data Not Found` :
               currentLang === 'ja-JP' ? `${formattedSymbol} データが見つかりません` :
               currentLang === 'ko-KR' ? `${formattedSymbol} 데이터를 찾을 수 없습니다` :
               `${formattedSymbol} Data Not Found`,
               { symbol: formattedSymbol })
            }}
          </h2>
          <p class="text-sm text-slate-400 mt-1 text-center max-w-[220px] leading-snug">
            {{ getTranslation('tokenNotFound.description',
               currentLang === 'zh-CN' ? '该代币暂未收录，可尝试获取最新行情或返回。' :
               currentLang === 'en-US' ? 'This token is not yet in our database. Try to get the latest data or go back.' :
               currentLang === 'ja-JP' ? 'このトークンはまだデータベースにありません。最新データ取得または戻る。' :
               currentLang === 'ko-KR' ? '이 토큰은 아직 데이터베이스에 없습니다. 최신 데이터 가져오기 또는 뒤로가기.' :
               'This token is not yet in our database. Try to get the latest data or go back.')
            }}
          </p>
        </div>

        <!-- 操作按钮组 -->
        <div class="flex flex-col gap-2 w-full mt-3">
          <button
            class="w-full py-2 text-base rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 shadow hover:shadow-blue-400/30 text-white font-semibold border-0 transition-all duration-200 flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-400"
            @click="handleRefresh"
            :disabled="showRefreshModal"
            :class="{ 'opacity-50 cursor-not-allowed': showRefreshModal }"
          >
            <i class="ri-refresh-line text-lg transition-transform duration-200 group-hover:rotate-180" :class="{ 'animate-spin': showRefreshModal }"></i>
            <span>
              {{ getTranslation('tokenNotFound.refreshButton',
                 currentLang === 'zh-CN' ? '获取最新数据' :
                 currentLang === 'en-US' ? 'Get Latest Market Data' :
                 currentLang === 'ja-JP' ? '最新データを取得' :
                 currentLang === 'ko-KR' ? '최신 데이터 가져오기' :
                 'Get Latest Data')
              }}
            </span>
          </button>
          <button
            class="w-full py-2 text-base rounded-xl bg-slate-800/60 border border-slate-600 hover:border-blue-400 text-slate-200 font-semibold transition-all duration-200 flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-400"
            @click="handleCancel"
            :disabled="showRefreshModal"
          >
            <i class="ri-arrow-go-back-line text-lg"></i>
            <span>
              {{ getTranslation('tokenNotFound.cancelButton',
                 currentLang === 'zh-CN' ? '返回' :
                 currentLang === 'en-US' ? 'Cancel / Back' :
                 currentLang === 'ja-JP' ? '戻る' :
                 currentLang === 'ko-KR' ? '뒤로가기' :
                 'Cancel / Back')
              }}
            </span>
          </button>
        </div>
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
  (e: 'cancel'): void
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

// 取消报告
const handleCancel = () => {
  emit('cancel')
}

// 组件卸载时清理
onUnmounted(() => {
  showRefreshModal.value = false
  isRefreshing.value = false
})
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.5s cubic-bezier(0.4,0,0.2,1);
}
@keyframes pop {
  0% { transform: scale(0.8); opacity: 0.5; }
  80% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-pop {
  animation: pop 0.5s cubic-bezier(0.4,0,0.2,1);
}
</style>