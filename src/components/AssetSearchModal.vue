<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden" @click.self="closeModal">
    <div class="bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 class="text-lg font-semibold text-white">
          {{ t('search.title') }}
        </h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-white transition-colors"
        >
          <i class="ri-close-line text-xl"></i>
        </button>
      </div>

      <!-- Search Input -->
      <div class="p-4 border-b border-gray-700">
        <div class="relative">
          <i class="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            @input="handleSearch"
            ref="searchInput"
          />
        </div>
      </div>

      <!-- Market Type Filter -->
      <div class="p-4 border-b border-gray-700">
        <MarketTypeSelector v-model="selectedMarketType" @change="handleMarketTypeChange" />
      </div>

      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="loading" class="p-4 text-center">
          <i class="ri-loader-4-line animate-spin text-2xl text-blue-500"></i>
          <p class="text-gray-400 mt-2">{{ t('search.searching') }}</p>
        </div>

        <!-- No Results -->
        <div v-else-if="searchQuery && searchResults.length === 0" class="p-4 text-center">
          <i class="ri-search-line text-3xl text-gray-500 mb-2"></i>
          <p class="text-gray-400">{{ t('search.no_results') }}</p>
        </div>

        <!-- Results List -->
        <div v-else-if="searchResults.length > 0" class="divide-y divide-gray-700">
          <button
            v-for="asset in searchResults"
            :key="`${asset.symbol}-${asset.market_type}`"
            @click="selectAsset(asset)"
            class="w-full p-4 text-left hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <i :class="asset.market_type === 'crypto' ? 'ri-currency-line' : 'ri-line-chart-line'" class="text-white text-sm"></i>
              </div>
              <div>
                <div class="font-medium text-white">{{ asset.symbol }}</div>
                <div class="text-sm text-gray-400">{{ asset.name }}</div>
              </div>
            </div>
            <div class="text-xs text-gray-500 capitalize">
              {{ asset.market_type }}
            </div>
          </button>
        </div>

        <!-- Popular Assets (when no search) -->
        <div v-else class="p-4">
          <h4 class="text-sm font-medium text-gray-300 mb-3">{{ t('search.popular') }}</h4>
          <div class="space-y-2">
            <button
              v-for="asset in popularAssets"
              :key="`${asset.symbol}-${asset.market_type}`"
              @click="selectAsset(asset)"
              class="w-full p-3 text-left hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-between"
            >
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <i :class="asset.market_type === 'crypto' ? 'ri-currency-line' : 'ri-line-chart-line'" class="text-white text-xs"></i>
                </div>
                <div>
                  <div class="font-medium text-white text-sm">{{ asset.symbol }}</div>
                  <div class="text-xs text-gray-400">{{ asset.name }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { search, type Asset as ApiAsset } from '@/api'
import MarketTypeSelector from './MarketTypeSelector.vue'

const { t } = useEnhancedI18n()

export interface Asset {
  symbol: string
  name: string
  market_type: 'crypto' | 'stock'
  exchange?: string
  sector?: string
}

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'select', asset: Asset): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref('')
const selectedMarketType = ref<'crypto' | 'stock'>('crypto')
const searchResults = ref<Asset[]>([])
const loading = ref(false)
const searchInput = ref<HTMLInputElement>()

// Popular assets for each market type
const popularCryptoAssets: Asset[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', market_type: 'crypto' },
  { symbol: 'ETHUSDT', name: 'Ethereum', market_type: 'crypto' },
  { symbol: 'SOLUSDT', name: 'Solana', market_type: 'crypto' },
  { symbol: 'BNBUSDT', name: 'BNB', market_type: 'crypto' },
  { symbol: 'ADAUSDT', name: 'Cardano', market_type: 'crypto' },
  { symbol: 'XRPUSDT', name: 'XRP', market_type: 'crypto' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', market_type: 'crypto' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', market_type: 'crypto' }
]

const popularStockAssets: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', market_type: 'stock', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', market_type: 'stock', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', market_type: 'stock', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', market_type: 'stock', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', name: 'Tesla Inc.', market_type: 'stock', sector: 'Consumer Discretionary' },
  { symbol: 'META', name: 'Meta Platforms Inc.', market_type: 'stock', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', market_type: 'stock', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', market_type: 'stock', sector: 'Communication Services' }
]

const popularAssets = computed(() => {
  return selectedMarketType.value === 'crypto' ? popularCryptoAssets : popularStockAssets
})

const closeModal = () => {
  emit('close')
  searchQuery.value = ''
  searchResults.value = []
}

const selectAsset = (asset: Asset) => {
  emit('select', asset)
  closeModal()
}

const handleMarketTypeChange = (marketType: 'crypto' | 'stock') => {
  selectedMarketType.value = marketType
  if (searchQuery.value) {
    handleSearch()
  }
}

// Debounced search function
let searchTimeout: NodeJS.Timeout
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = []
      return
    }

    loading.value = true
    try {
      await performSearch(searchQuery.value)
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

// Real search function using API
const performSearch = async (query: string) => {
  try {
    const marketType = selectedMarketType.value === 'all' ? undefined : selectedMarketType.value as 'crypto' | 'stock'
    const response = await search.searchAssets(query, marketType, 10)

    if (response.status === 'success') {
      searchResults.value = response.data.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        market_type: asset.market_type,
        exchange: asset.exchange,
        sector: asset.sector
      }))
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  }
}

// Focus search input when modal opens and prevent body scroll
watch(() => props.visible, (visible) => {
  if (visible) {
    // 阻止背景滚动
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      searchInput.value?.focus()
    })
  } else {
    // 恢复背景滚动
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Custom scrollbar for search results */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
