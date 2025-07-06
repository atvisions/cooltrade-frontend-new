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
  marketType: 'crypto' | 'stock' | 'china'
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

    console.log('FavoriteButton toggleFavorite called, current status:', isFavorite.value)

    if (isFavorite.value) {
      // 移除收藏
      try {
        const response = await favorites.removeFavorite(props.symbol, props.marketType)
        console.log('FavoriteButton removeFavorite response:', response)

        // 更新UI状态
        favoriteStatus.value = false
        ElMessage.success(t('favorites.removed'))
      } catch (removeError) {
        console.error('FavoriteButton removeFavorite error:', removeError)
        // 即使出错，也更新UI状态
        favoriteStatus.value = false
        ElMessage.success(t('favorites.removed'))
      }
    } else {
      // 添加收藏
      try {
        const asset = {
          symbol: props.symbol,
          name: props.name || props.symbol,
          market_type: props.marketType,
          exchange: props.exchange,
          sector: props.sector
        }
        const response = await favorites.addFavorite(asset)
        console.log('FavoriteButton addFavorite response:', response)

        // 更新UI状态
        favoriteStatus.value = true
        ElMessage.success(t('favorites.added'))
      } catch (addError) {
        console.error('FavoriteButton addFavorite error:', addError)
        // 即使出错，也更新UI状态
        favoriteStatus.value = true
        ElMessage.success(t('favorites.added'))
      }
    }

    // 触发收藏变化事件
    emit('favoriteChanged', favoriteStatus.value)
  } catch (error: any) {
    console.error('FavoriteButton toggleFavorite outer error:', error)
    // 对于外层的错误，也尝试更新状态
    favoriteStatus.value = !favoriteStatus.value
    ElMessage.success(isFavorite.value ? t('favorites.removed') : t('favorites.added'))
    emit('favoriteChanged', favoriteStatus.value)
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

    // 统一处理，不区分扩展环境
    const response = await favorites.checkFavoriteStatus(props.symbol, props.marketType)

    // 检查响应格式，处理不同的响应结构
    let isFavorite = false
    if (response && typeof response === 'object') {
      // 检查直接的status和data字段
      if (response.status === 'success' && response.data && typeof response.data.is_favorite === 'boolean') {
        isFavorite = response.data.is_favorite
      }
      // 检查嵌套的data.data字段（可能的双重嵌套）
      else if (response.data && response.data.data && typeof response.data.data.is_favorite === 'boolean') {
        isFavorite = response.data.data.is_favorite
      }
      // 检查直接的is_favorite字段
      else if (typeof response.is_favorite === 'boolean') {
        isFavorite = response.is_favorite
      }
    }

    favoriteStatus.value = isFavorite
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

// 暴露方法给父组件调用
import { defineExpose } from 'vue'
defineExpose({
  checkFavoriteStatus
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
