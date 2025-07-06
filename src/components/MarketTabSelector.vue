<template>
  <div class="market-tab-selector">
    <div class="flex bg-gray-800/30 rounded-lg p-1 border border-gray-700/50">
      <button
        v-for="market in marketTypes"
        :key="market.value"
        @click="handleMarketChange(market)"
        :disabled="market.disabled"
        class="flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 relative"
        :class="{
          'bg-blue-600 text-white shadow-sm': modelValue === market.value && !market.disabled,
          'text-gray-300 hover:text-white hover:bg-gray-700/50': modelValue !== market.value && !market.disabled,
          'text-gray-500 cursor-not-allowed': market.disabled
        }"
      >
        <i :class="market.icon" class="mr-1.5 text-sm"></i>
        <span>{{ t(market.label) }}</span>
        <div 
          v-if="market.comingSoon" 
          class="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 rounded-full"
          style="font-size: 10px; line-height: 1.2;"
        >
          {{ t('common.coming_soon') }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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
}

interface Emits {
  (e: 'update:modelValue', value: 'crypto' | 'stock' | 'china'): void
  (e: 'change', value: 'crypto' | 'stock' | 'china'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

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

const handleMarketChange = (market: MarketType) => {
  if (market.disabled) return
  
  emit('update:modelValue', market.value)
  emit('change', market.value)
}
</script>

<style scoped>
.market-tab-selector {
  width: 100%;
}
</style>
