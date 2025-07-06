<template>
  <div class="market-type-selector">
    <div class="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1">
      <button
        v-for="market in marketTypes"
        :key="market.value"
        :class="[
          'flex-1 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200 relative',
          selectedMarket === market.value && !market.disabled
            ? 'bg-blue-600 text-white shadow-lg'
            : market.disabled
            ? 'text-gray-500 cursor-not-allowed bg-gray-800/30'
            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
        ]"
        :disabled="market.disabled"
        @click="selectMarket(market.value)"
      >
        <div class="flex items-center justify-center">
          <i :class="market.icon" class="mr-1"></i>
          {{ t(market.label) }}
        </div>
        <!-- 开发中标签 -->
        <div
          v-if="market.comingSoon"
          class="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] px-1 rounded-full leading-none"
          style="font-size: 8px; padding: 1px 3px;"
        >
          {{ t('common.coming_soon') }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedMarket = ref<'crypto' | 'stock' | 'china'>(props.modelValue)

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

const selectMarket = (market: 'crypto' | 'stock' | 'china') => {
  if (selectedMarket.value === market) return

  selectedMarket.value = market
  emit('update:modelValue', market)
  emit('change', market)
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  selectedMarket.value = newValue
})
</script>

<style scoped>
.market-type-selector {
  @apply w-full;
}
</style>
