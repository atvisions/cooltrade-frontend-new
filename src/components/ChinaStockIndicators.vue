<template>
  <div class="space-y-4">
    <!-- A股基本面指标标题 -->
    <h3 class="text-base font-bold text-white mb-3 flex items-center">
      <div class="w-0.5 bg-gradient-to-b from-red-400 to-orange-400 rounded-full mr-2" style="height: 20px;"></div>
      {{ t('analysis.china_fundamentals') }}
    </h3>

    <!-- 估值指标 -->
    <div class="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-md hover:shadow-red-500/10">
      <div class="text-sm font-semibold text-slate-300 mb-3">估值指标</div>
      <div class="grid grid-cols-2 gap-3">
        <!-- 市盈率 -->
        <div class="group/item text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-blue-300 font-semibold mb-1">市盈率 (PE)</div>
          <div class="text-sm font-bold text-white">
            {{ formatIndicatorValue(indicators?.PE) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            TTM: {{ formatIndicatorValue(indicators?.PE_TTM) }}
          </div>
        </div>
        
        <!-- 市净率 -->
        <div class="group/item text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-emerald-300 font-semibold mb-1">市净率 (PB)</div>
          <div class="text-sm font-bold text-white">
            {{ formatIndicatorValue(indicators?.PB) }}
          </div>
        </div>
        
        <!-- 市销率 -->
        <div class="group/item text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-purple-300 font-semibold mb-1">市销率 (PS)</div>
          <div class="text-sm font-bold text-white">
            {{ formatIndicatorValue(indicators?.PS) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            TTM: {{ formatIndicatorValue(indicators?.PS_TTM) }}
          </div>
        </div>
        
        <!-- 股息率 -->
        <div class="group/item text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-yellow-300 font-semibold mb-1">股息率 (%)</div>
          <div class="text-sm font-bold text-white">
            {{ formatPercentValue(indicators?.DividendYield) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">
            TTM: {{ formatPercentValue(indicators?.DividendYield_TTM) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 交易活跃度指标 -->
    <div class="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-md hover:shadow-orange-500/10">
      <div class="text-sm font-semibold text-slate-300 mb-3">交易活跃度</div>
      <div class="grid grid-cols-2 gap-3">
        <!-- 换手率 -->
        <div class="group/item text-center p-3 rounded-lg bg-red-500/10 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-red-300 font-semibold mb-1">换手率 (%)</div>
          <div class="text-sm font-bold text-white">
            {{ formatPercentValue(indicators?.TurnoverRate) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">反映股票活跃度</div>
        </div>
        
        <!-- 量比 -->
        <div class="group/item text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-orange-300 font-semibold mb-1">量比</div>
          <div class="text-sm font-bold text-white">
            {{ formatIndicatorValue(indicators?.VolumeRatio) }}
          </div>
          <div class="text-xs text-slate-400 mt-1">成交量倍数</div>
        </div>
      </div>
    </div>

    <!-- 市值与股本 -->
    <div class="p-4 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-md hover:shadow-green-500/10">
      <div class="text-sm font-semibold text-slate-300 mb-3">市值与股本</div>
      <div class="grid grid-cols-2 gap-3">
        <!-- 总市值 -->
        <div class="group/item text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:border-green-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-green-300 font-semibold mb-1">总市值</div>
          <div class="text-sm font-bold text-white">
            {{ formatMarketValue(indicators?.TotalMarketValue) }}
          </div>
        </div>
        
        <!-- 流通市值 -->
        <div class="group/item text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-cyan-300 font-semibold mb-1">流通市值</div>
          <div class="text-sm font-bold text-white">
            {{ formatMarketValue(indicators?.CircMarketValue) }}
          </div>
        </div>
        
        <!-- 总股本 -->
        <div class="group/item text-center p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-indigo-300 font-semibold mb-1">总股本</div>
          <div class="text-sm font-bold text-white">
            {{ formatShareValue(indicators?.TotalShare) }}
          </div>
        </div>
        
        <!-- 流通股本 -->
        <div class="group/item text-center p-3 rounded-lg bg-pink-500/10 border border-pink-500/30 hover:border-pink-400/50 transition-all duration-200 hover:scale-105">
          <div class="text-xs text-pink-300 font-semibold mb-1">流通股本</div>
          <div class="text-sm font-bold text-white">
            {{ formatShareValue(indicators?.FloatShare) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  indicators?: {
    TurnoverRate?: number
    VolumeRatio?: number
    PE?: number
    PE_TTM?: number
    PB?: number
    PS?: number
    PS_TTM?: number
    DividendYield?: number
    DividendYield_TTM?: number
    TotalMarketValue?: number
    CircMarketValue?: number
    TotalShare?: number
    FloatShare?: number
  }
}

const props = defineProps<Props>()

// 格式化指标值
const formatIndicatorValue = (value?: number) => {
  if (value === undefined || value === null || value === 0) return '--'
  if (value < 0.01) return value.toFixed(4)
  if (value < 1) return value.toFixed(3)
  if (value < 10) return value.toFixed(2)
  return value.toFixed(1)
}

// 格式化百分比值
const formatPercentValue = (value?: number) => {
  if (value === undefined || value === null || value === 0) return '--'
  return `${value.toFixed(2)}%`
}

// 格式化市值（万元转换为亿元）
const formatMarketValue = (value?: number) => {
  if (value === undefined || value === null || value === 0) return '--'
  const yiValue = value / 10000 // 万元转亿元
  if (yiValue < 1) return `${(value / 1000).toFixed(1)}千万`
  if (yiValue < 10) return `${yiValue.toFixed(2)}亿`
  if (yiValue < 100) return `${yiValue.toFixed(1)}亿`
  return `${Math.round(yiValue)}亿`
}

// 格式化股本（万股转换为亿股）
const formatShareValue = (value?: number) => {
  if (value === undefined || value === null || value === 0) return '--'
  const yiValue = value / 10000 // 万股转亿股
  if (yiValue < 1) return `${(value / 1000).toFixed(1)}千万股`
  if (yiValue < 10) return `${yiValue.toFixed(2)}亿股`
  if (yiValue < 100) return `${yiValue.toFixed(1)}亿股`
  return `${Math.round(yiValue)}亿股`
}
</script>
