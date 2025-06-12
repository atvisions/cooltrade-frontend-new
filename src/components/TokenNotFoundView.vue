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

    <!-- 加载弹窗 -->
    <LoadingModal
      :visible="showRefreshModal"
      type="generate"
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

// 刷新状态
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



// 简化的刷新处理函数 - 直接调用 getLatestTechnicalAnalysis 获取新报告
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

    console.log('TokenNotFoundView: 开始获取新报告...')

    // 创建新的刷新请求Promise
    refreshPromise = new Promise(async (resolve, reject) => {
      try {
        // 直接调用 getLatestTechnicalAnalysis 获取新报告
        console.log('TokenNotFoundView: 调用 getLatestTechnicalAnalysis 获取新报告')
        const result = await getLatestTechnicalAnalysis(props.symbol, true)

        // 检查是否获取到有效数据
        if (result && (result as any).status !== 'not_found') {
          console.log('TokenNotFoundView: 成功获取到新报告数据!')
          // 发送成功事件
          emit('refresh-success')
          // 延迟关闭弹窗，给HomeView时间加载数据
          handleSuccessClose()
          resolve(result)
          return
        } else {
          // 如果仍然未找到，抛出错误
          throw new Error('生成报告失败，请稍后重试')
        }
      } catch (error) {
        console.error('TokenNotFoundView: 获取新报告失败:', error)
        emit('refresh-error', error)
        reject(error)
        // 只有在错误时才立即关闭弹窗
        showRefreshModal.value = false
      } finally {
        refreshPromise = null
      }
    })

    return refreshPromise
  } catch (error) {
    console.error('TokenNotFoundView: 刷新失败:', error)
    showRefreshModal.value = false
    refreshPromise = null
  }
}

// 监听父组件 isRefreshing 变化，刷新完成后自动关闭弹窗
watch(() => props.isRefreshing, (newVal) => {
  if (showRefreshModal.value && newVal === false) {
    // 父组件刷新完成，延迟关闭弹窗确保数据已经渲染
    setTimeout(() => {
      showRefreshModal.value = false
    }, 1000) // 延迟1秒关闭，确保HomeView已经渲染完成
  }
})

// 添加一个新的监听器，当成功获取数据后延迟关闭弹窗
const handleSuccessClose = () => {
  if (showRefreshModal.value) {
    // 延迟关闭弹窗，给HomeView时间来加载和渲染数据
    // 使用更长的延迟时间，确保报告完全生成和加载
    setTimeout(() => {
      showRefreshModal.value = false
    }, 3000) // 延迟3秒关闭，确保有足够时间加载数据
  }
}



// 组件卸载时清理
onUnmounted(() => {
  refreshPromise = null
})
</script>