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

const { t } = useEnhancedI18n()

interface Props {
  symbol: string
  marketType: 'crypto' | 'stock'
  name?: string
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

  if (isExtensionEnvironment()) {
    try {
      const asset: Asset = {
        symbol: props.symbol,
        name: props.name || props.symbol,
        market_type: props.marketType,
        exchange: props.exchange,
        sector: props.sector
      }

      if (favoriteStatus.value) {
        // Remove from favorites
        const response = await favorites.removeFavorite(props.symbol, props.marketType)
        if (response.status === 'success') {
          favoriteStatus.value = false
          emit('favoriteChanged', false)
          console.log('Removed from favorites')
        }
      } else {
        // Add to favorites
        const response = await favorites.addFavorite(asset)
        if (response.status === 'success' || response.status === 'info') {
          favoriteStatus.value = true
          emit('favoriteChanged', true)
          console.log('Added to favorites')
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      // Fallback to localStorage
      await mockToggleFavorite(props.symbol, props.marketType, !favoriteStatus.value)
      favoriteStatus.value = !favoriteStatus.value
      emit('favoriteChanged', favoriteStatus.value)
    }
  } else {
    // 直接使用本地存储
    await mockToggleFavorite(props.symbol, props.marketType, !favoriteStatus.value)
    favoriteStatus.value = !favoriteStatus.value
    emit('favoriteChanged', favoriteStatus.value)
  }

  loading.value = false
}

// 模拟API调用 - 替换为实际的API调用
const mockToggleFavorite = async (symbol: string, marketType: 'crypto' | 'stock', isFavorite: boolean) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 模拟API调用
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  const favoriteKey = `${symbol}-${marketType}`
  
  if (isFavorite) {
    if (!favorites.includes(favoriteKey)) {
      favorites.push(favoriteKey)
    }
  } else {
    const index = favorites.indexOf(favoriteKey)
    if (index > -1) {
      favorites.splice(index, 1)
    }
  }
  
  localStorage.setItem('favorites', JSON.stringify(favorites))
}

// 检查是否在Chrome扩展环境中
const isExtensionEnvironment = () => {
  return typeof chrome !== 'undefined' &&
         chrome.runtime &&
         chrome.runtime.sendMessage &&
         chrome.runtime.id // 确保有扩展ID
}

// 检查初始收藏状态
const checkFavoriteStatus = async () => {
  if (isExtensionEnvironment()) {
    try {
      const response = await favorites.checkFavoriteStatus(props.symbol, props.marketType)
      if (response.status === 'success') {
        favoriteStatus.value = response.data.is_favorite
        return
      }
    } catch (error) {
      console.error('Check favorite status error:', error)
    }
  }

  // Fallback to localStorage
  const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  const favoriteKey = `${props.symbol}-${props.marketType}`
  favoriteStatus.value = localFavorites.includes(favoriteKey)
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
