<template>
  <header class="fixed top-0 w-full z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800/50">
    <div class="max-w-[375px] mx-auto">
      <div class="flex items-center justify-between h-12 px-4">
        <!-- 左侧：市场名称 + 切换按钮 -->
        <div class="flex items-center space-x-2">
          <h1 class="text-lg font-semibold text-white">{{ getCurrentMarketName() }}</h1>
          <button
            @click="toggleMarketSelector"
            class="p-1 rounded-md hover:bg-gray-700/50 transition-colors duration-200"
            :class="{
              'bg-gray-700/50': showMarketSelector
            }"
          >
            <i class="ri-arrow-down-s-line text-lg text-gray-300 transition-transform duration-200"
               :class="{ 'rotate-180': showMarketSelector }"></i>
          </button>
        </div>

        <!-- 右侧：搜索图标 -->
        <button
          @click="$emit('search-click')"
          class="p-2 rounded-lg transition-all duration-200 hover:scale-105"
          :class="{
            'text-blue-300': isSearchActive,
            'text-blue-400 hover:text-blue-300': !isSearchActive
          }"
        >
          <i class="ri-search-line text-lg"></i>
        </button>
      </div>
    </div>

    <!-- 市场切换弹层 -->
    <div v-if="showMarketSelector" class="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-700 shadow-xl z-[60]">
      <div class="max-w-[375px] mx-auto p-4">
        <div class="space-y-3">
          <button
            v-for="market in marketTypes"
            :key="market.value"
            @click="handleMarketChange(market)"
            :disabled="market.disabled"
            class="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border"
            :class="{
              'bg-blue-600 border-blue-500 shadow-lg text-white': modelValue === market.value && !market.disabled,
              'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600': modelValue !== market.value && !market.disabled,
              'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700': market.disabled
            }"
          >
            <div class="flex items-center space-x-3">
              <i :class="[
                   market.icon,
                   'text-lg',
                   {
                     'text-white': modelValue === market.value && !market.disabled,
                     'text-gray-300': modelValue !== market.value && !market.disabled,
                     'text-gray-500': market.disabled
                   }
                 ]"></i>
              <span class="font-medium"
                    :class="{
                      'text-white': !market.disabled,
                      'text-gray-500': market.disabled
                    }">{{ t(market.label) }}</span>
              <div 
                v-if="market.comingSoon" 
                class="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full"
              >
                {{ t('common.coming_soon') }}
              </div>
            </div>
            <i v-if="modelValue === market.value && !market.disabled"
               class="ri-check-line text-white"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 点击遮罩关闭弹层 -->
    <div v-if="showMarketSelector"
         @click="showMarketSelector = false"
         class="fixed inset-0 z-40 bg-black/20"></div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()

export interface MarketType {
  value: 'crypto' | 'stock' | 'china'
  label: string
  icon: string
  disabled?: boolean
  comingSoon?: boolean
}

interface Props {
  modelValue: 'crypto' | 'stock' | 'china'
  isSearchActive?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: 'crypto' | 'stock' | 'china'): void
  (e: 'change', value: 'crypto' | 'stock' | 'china'): void
  (e: 'search-click'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showMarketSelector = ref(false)

const marketTypes: MarketType[] = [
  {
    value: 'crypto',
    label: 'market.crypto',
    icon: 'ri-currency-line'
  },
  {
    value: 'stock',
    label: 'market.stock',
    icon: 'ri-line-chart-line'
  },
  {
    value: 'china',
    label: 'market.china',
    icon: 'ri-bank-line'
  }
]

const getCurrentMarketName = () => {
  const currentMarket = marketTypes.find(m => m.value === props.modelValue)
  return currentMarket ? t(currentMarket.label) : ''
}

const toggleMarketSelector = () => {
  showMarketSelector.value = !showMarketSelector.value
}

const handleMarketChange = (market: MarketType) => {
  if (market.disabled) return
  
  showMarketSelector.value = false
  emit('update:modelValue', market.value)
  emit('change', market.value)
}
</script>
