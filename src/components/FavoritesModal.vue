<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="$emit('close')"
    ></div>
    
    <!-- 弹窗内容 -->
    <div class="relative w-[90vw] max-w-md mx-4 bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 class="text-lg font-semibold text-white flex items-center">
          <i class="ri-bookmark-line mr-2 text-yellow-400"></i>
          {{ t('common.my_favorites') }}
        </h3>
        <button 
          @click="$emit('close')"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <i class="ri-close-line text-xl"></i>
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="p-4">
        <!-- 加载状态 -->
        <div v-if="loading" class="text-center py-8">
          <i class="ri-loader-4-line text-2xl text-blue-400 animate-spin"></i>
          <p class="text-gray-400 mt-2">{{ t('common.loading') }}</p>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="favoritesList.length === 0" class="text-center py-8">
          <i class="ri-bookmark-line text-4xl text-gray-600 mb-3"></i>
          <p class="text-gray-400">{{ t('favorites.empty') }}</p>
        </div>

        <!-- 收藏列表 -->
        <div v-else class="space-y-2 max-h-80 overflow-y-auto">
          <div
            v-for="favorite in favoritesList"
            :key="`${favorite.symbol}-${favorite.market_type}`"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/70 transition-colors"
          >
            <div 
              class="flex items-center flex-1 cursor-pointer"
              @click="selectFavorite(favorite)"
            >
              <div class="flex items-center space-x-2">
                <i 
                  :class="getMarketIcon(favorite.market_type)" 
                  class="text-gray-400"
                ></i>
                <span class="font-medium text-white">{{ favorite.symbol }}</span>
                <span class="text-xs text-gray-500 px-2 py-1 rounded bg-gray-700/50">
                  {{ getMarketLabel(favorite.market_type) }}
                </span>
              </div>
            </div>
            
            <!-- 取消收藏按钮 -->
            <button
              @click="removeFavorite(favorite)"
              class="ml-3 p-1 text-gray-400 hover:text-red-400 transition-colors"
              :title="t('favorites.remove')"
            >
              <i class="ri-bookmark-fill text-yellow-400 hover:text-gray-400"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { favorites } from '@/api'

const { t } = useI18n()

interface Favorite {
  id: number
  symbol: string
  market_type: 'crypto' | 'stock' | 'china'
  created_at: string
}

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'select', favorite: Favorite): void
  (e: 'favorite-removed', favorite: Favorite): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const favoritesList = ref<Favorite[]>([])

// 获取市场图标
const getMarketIcon = (marketType: string) => {
  switch (marketType) {
    case 'crypto': return 'ri-currency-line'
    case 'stock': return 'ri-line-chart-line'
    case 'china': return 'ri-bank-line'
    default: return 'ri-question-line'
  }
}

// 获取市场标签
const getMarketLabel = (marketType: string) => {
  switch (marketType) {
    case 'crypto': return t('market.crypto')
    case 'stock': return t('market.stock')
    case 'china': return t('market.china')
    default: return marketType
  }
}

// 加载收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    const response = await favorites.getFavorites()
    favoritesList.value = response.data || []
  } catch (error) {
    console.error('Failed to load favorites:', error)
    favoritesList.value = []
  } finally {
    loading.value = false
  }
}

// 选择收藏项
const selectFavorite = (favorite: Favorite) => {
  emit('select', favorite)
  emit('close')
}

// 移除收藏
const removeFavorite = async (favorite: Favorite) => {
  try {
    await favorites.removeFavorite(favorite.symbol, favorite.market_type)
    favoritesList.value = favoritesList.value.filter(f => f.id !== favorite.id)
    emit('favorite-removed', favorite)
  } catch (error) {
    console.error('Failed to remove favorite:', error)
  }
}

// 监听弹窗显示状态，显示时加载数据并阻止背景滚动
watch(() => props.visible, (visible) => {
  if (visible) {
    // 保存当前滚动位置
    const scrollY = window.scrollY
    // 阻止背景滚动
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    loadFavorites()
  } else {
    // 恢复背景滚动
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    // 恢复滚动位置
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(75, 85, 99, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
</style>
