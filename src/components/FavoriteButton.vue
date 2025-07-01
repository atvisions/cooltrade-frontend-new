<template>
  <button
    @click="toggleFavorite"
    :disabled="loading"
    :class="[
      'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
      isFavorite 
        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300',
      loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ]"
    :title="isFavorite ? t('favorites.remove') : t('favorites.add')"
  >
    <i 
      :class="[
        loading ? 'ri-loader-4-line animate-spin' : (isFavorite ? 'ri-star-fill' : 'ri-star-line'),
        'text-sm'
      ]"
    ></i>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { favorites, type Asset } from '@/api'
import { ElMessage } from 'element-plus'

const { t } = useEnhancedI18n()

interface Props {
  symbol: string
  marketType: 'crypto' | 'stock'
  name?: string
  exchange?: string
  sector?: string
}

interface Emits {
  (e: 'favoriteChanged', isFavorite: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const favoriteStatus = ref(false)

// 计算是否为收藏状态
const isFavorite = computed(() => favoriteStatus.value)

// 切换收藏状态
const toggleFavorite = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error(t('errors.not_logged_in'))
      return
    }

    // 检查是否在扩展环境中
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id

    if (isExtension) {
      // 在扩展环境中使用代理请求
      if (isFavorite.value) {
        // 移除收藏
        const response = await favorites.removeFavorite(props.symbol, props.marketType)
        if (response.status === 'success') {
          favoriteStatus.value = false
          ElMessage.success(t('favorites.removed'))
        } else {
          ElMessage.error(response.message || t('favorites.remove_failed'))
        }
      } else {
        // 添加收藏
        const asset = {
          symbol: props.symbol,
          name: props.name || props.symbol,
          market_type: props.marketType,
          exchange: props.exchange,
          sector: props.sector
        }
        const response = await favorites.addFavorite(asset)
        if (response.status === 'success' || response.status === 'info') {
          favoriteStatus.value = true
          ElMessage.success(t('favorites.added'))
        } else {
          ElMessage.error(response.message || t('favorites.add_failed'))
        }
      }
    } else {
      // 在非扩展环境中使用普通请求
      if (isFavorite.value) {
        // 移除收藏
        const response = await favorites.removeFavorite(props.symbol, props.marketType)
        if (response.status === 'success') {
          favoriteStatus.value = false
          ElMessage.success(t('favorites.removed'))
        } else {
          ElMessage.error(response.message || t('favorites.remove_failed'))
        }
      } else {
        // 添加收藏
        const asset = {
          symbol: props.symbol,
          name: props.name || props.symbol,
          market_type: props.marketType,
          exchange: props.exchange,
          sector: props.sector
        }
        const response = await favorites.addFavorite(asset)
        if (response.status === 'success' || response.status === 'info') {
          favoriteStatus.value = true
          ElMessage.success(t('favorites.added'))
        } else {
          ElMessage.error(response.message || t('favorites.add_failed'))
        }
      }
    }

    // 触发收藏变化事件
    emit('favoriteChanged', favoriteStatus.value)
  } catch (error: any) {
    ElMessage.error(error.message || t('favorites.operation_failed'))
  } finally {
    loading.value = false
  }
}

// 检查收藏状态
const checkFavoriteStatus = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      favoriteStatus.value = false
      return
    }

    // 检查是否在扩展环境中
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id

    if (isExtension) {
      // 在扩展环境中使用代理请求
      const response = await favorites.checkFavoriteStatus(props.symbol, props.marketType)
      if (response.status === 'success' && response.data) {
        favoriteStatus.value = response.data.is_favorite
      } else {
        favoriteStatus.value = false
      }
    } else {
      // 在非扩展环境中使用普通请求
      const response = await favorites.checkFavoriteStatus(props.symbol, props.marketType)
      if (response.status === 'success' && response.data) {
        favoriteStatus.value = response.data.is_favorite
      } else {
        favoriteStatus.value = false
      }
    }
  } catch (error: any) {
    favoriteStatus.value = false
  }
}

// 初始化
checkFavoriteStatus()

// 监听props变化，重新检查收藏状态
import { watch } from 'vue'
watch(() => [props.symbol, props.marketType], () => {
  checkFavoriteStatus()
})
</script>

<style scoped>
/* 添加一些动画效果 */
.ri-star-fill {
  animation: starFill 0.3s ease-in-out;
}

@keyframes starFill {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
