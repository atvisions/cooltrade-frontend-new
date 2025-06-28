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

// 切换收藏状态 - 完全通过API
const toggleFavorite = async () => {
  if (loading.value) return

  loading.value = true

  try {
    // 检查是否在扩展环境
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
    console.log('FavoriteButton: 扩展环境:', isExtension)

    // 检查token是否存在
    const token = localStorage.getItem('token')
    console.log('FavoriteButton: 切换收藏时token状态:', token ? '存在' : '不存在')

    if (!token) {
      console.warn('FavoriteButton: 没有token，无法操作收藏')
      loading.value = false
      return
    }

    // 在扩展环境下，添加额外的调试信息
    if (isExtension) {
      console.log('FavoriteButton: 在Chrome扩展环境中操作收藏')
      console.log('FavoriteButton: Token前缀检查:', token.startsWith('Token ') ? 'Token前缀正确' : 'Token前缀可能有问题')
    }

    const asset: Asset = {
      symbol: props.symbol,
      name: props.name || props.symbol,
      market_type: props.marketType,
      exchange: props.exchange,
      sector: props.sector
    }

    if (favoriteStatus.value) {
      // Remove from favorites
      console.log('FavoriteButton: 移除收藏', props.symbol, props.marketType)
      const response = await favorites.removeFavorite(props.symbol, props.marketType)
      console.log('FavoriteButton: 移除收藏API响应:', response)

      if (response.status === 'success') {
        favoriteStatus.value = false
        emit('favoriteChanged', false)
        console.log('FavoriteButton: 成功移除收藏')
      } else {
        console.error('FavoriteButton: 移除收藏失败，响应状态:', response.status)
        console.error('FavoriteButton: 完整响应:', JSON.stringify(response, null, 2))
      }
    } else {
      // Add to favorites
      console.log('FavoriteButton: 添加收藏', asset)
      const response = await favorites.addFavorite(asset)
      console.log('FavoriteButton: 添加收藏API响应:', response)

      if (response.status === 'success' || response.status === 'info') {
        favoriteStatus.value = true
        emit('favoriteChanged', true)
        console.log('FavoriteButton: 成功添加收藏')
      } else {
        console.error('FavoriteButton: 添加收藏失败，响应状态:', response.status)
        console.error('FavoriteButton: 完整响应:', JSON.stringify(response, null, 2))
      }
    }
  } catch (error: any) {
    console.error('FavoriteButton: API调用失败:', error)
    console.error('FavoriteButton: 错误详情:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    })

    // 在扩展环境下，提供更详细的错误信息
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
    if (isExtension) {
      console.error('FavoriteButton: Chrome扩展环境下的API调用失败')
      if (error?.message && error.message.includes('proxy')) {
        console.error('FavoriteButton: 可能是代理相关问题')
      }
      if (error?.message && error.message.includes('401')) {
        console.error('FavoriteButton: 可能是认证问题，检查token是否正确传递')
      }
    }
  }

  loading.value = false
}



// 检查初始收藏状态 - 完全通过API
const checkFavoriteStatus = async () => {
  try {
    console.log('FavoriteButton: 检查收藏状态', props.symbol, props.marketType)

    // 检查是否在扩展环境
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
    console.log('FavoriteButton: 扩展环境:', isExtension)

    // 检查token是否存在
    const token = localStorage.getItem('token')
    console.log('FavoriteButton: 当前token状态:', token ? '存在' : '不存在')

    if (!token) {
      console.warn('FavoriteButton: 没有token，无法检查收藏状态')
      favoriteStatus.value = false
      return
    }

    // 在扩展环境下，添加额外的调试信息
    if (isExtension) {
      console.log('FavoriteButton: 在Chrome扩展环境中检查收藏状态')
      console.log('FavoriteButton: 准备调用API:', `/crypto/favorites/status/${props.symbol}/`)
      console.log('FavoriteButton: 参数:', { market_type: props.marketType })
    }

    const response = await favorites.checkFavoriteStatus(props.symbol, props.marketType)
    console.log('FavoriteButton: 收藏状态API响应完整数据:', JSON.stringify(response, null, 2))

    if (response && response.status === 'success' && response.data) {
      favoriteStatus.value = response.data.is_favorite
      console.log('FavoriteButton: 收藏状态:', response.data.is_favorite)
    } else {
      favoriteStatus.value = false
      console.log('FavoriteButton: API返回失败或无数据，设置为未收藏')
      console.log('FavoriteButton: 响应状态:', response?.status || 'undefined')
      console.log('FavoriteButton: 响应数据:', response?.data || 'undefined')
    }
  } catch (error: any) {
    console.error('FavoriteButton: 检查收藏状态失败:', error)
    console.error('FavoriteButton: 错误详情:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    })

    // 在扩展环境下，提供更详细的错误信息
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
    if (isExtension) {
      console.error('FavoriteButton: Chrome扩展环境下检查收藏状态失败')
      if (error?.message && error.message.includes('proxy')) {
        console.error('FavoriteButton: 可能是代理相关问题')
      }
      if (error?.message && error.message.includes('401')) {
        console.error('FavoriteButton: 可能是认证问题，检查token是否正确传递')
      }
      if (error?.message && error.message.includes('timeout')) {
        console.error('FavoriteButton: 请求超时，可能是网络问题')
      }
    }

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
