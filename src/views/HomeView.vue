<template>
  <div class="relative h-[600px] flex flex-col bg-[#0F172A]">
    <!-- 顶部导航栏 -->
    <header class="absolute top-0 left-0 right-0 z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex justify-start items-center px-4 py-3">
          <h1 class="text-lg font-semibold">{{ currentSymbol ? t('analysis.market_report', { symbol: getBaseSymbol(currentSymbol) }) : t('common.loading') }}</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="absolute inset-0 top-12 bottom-16 overflow-y-auto">


      <!-- 骨架屏 - 没有数据且没有错误时显示 -->
      <div v-if="showSkeleton" class="max-w-[375px] mx-auto px-4 pb-16">
        <ChartSkeleton loadingText="正在加载价格数据..." />
      </div>

      <!-- 正常内容 - 有数据时显示 -->
      <div v-else-if="analysisData" class="max-w-[375px] mx-auto px-4 pb-16">
        <!-- 价格展示卡片 -->
        <div class="mt-6 p-5 rounded-lg bg-gradient-to-b from-gray-800/60 to-gray-900/60 border border-gray-700/50 shadow-lg">
          <h2 class="text-center text-gray-400 mb-1">{{ t('analysis.snapshot_price') }}</h2>
          <div class="text-center text-3xl font-bold mb-2">
            {{ formatPrice(analysisData.snapshot_price) }}
            <span class="text-sm text-gray-400">USD</span>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-center gap-3 mt-4 mb-2">
            <button
              class="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-full transition flex items-center gap-1"
              @click="shareToTwitter"
            >
              <i class="ri-twitter-fill"></i>
              <span class="text-sm">{{ t('analysis.share_to_twitter') }}</span>
            </button>
            <button
              class="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-full transition flex items-center gap-1"
              @click="saveChartImage"
            >
              <i class="ri-image-line"></i>
              <span class="text-sm">{{ t('analysis.save_image') }}</span>
            </button>
          </div>

        </div>

        <!-- Last Update 和刷新按钮 -->
        <div class="mt-4 flex items-center justify-between px-2">
          <div class="flex items-center text-xs text-gray-400">
            <i class="ri-time-line mr-1"></i>
            <span>{{ t('analysis.last_update') }}: {{ formatTime(analysisData?.last_update_time) }}</span>
          </div>
          <button
            @click="handleManualRefresh"
            :disabled="analysisLoading"
            class="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-600/20 text-blue-400 disabled:text-gray-500 rounded-full transition-colors"
            :class="{ 'animate-pulse': analysisLoading }"
          >
            <i class="ri-refresh-line" :class="{ 'animate-spin': analysisLoading }"></i>
            <span>{{ analysisLoading ? t('common.refreshing') : t('common.refresh') }}</span>
          </button>
        </div>

        <!-- 趋势分析卡片 -->
        <div class="mt-6 grid grid-cols-3 gap-3" v-if="analysisData?.trend_analysis?.probabilities">
          <div class="p-3 rounded-lg bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 text-center">
            <div class="text-green-400 text-xl font-bold mb-1">{{ formatPercent(analysisData.trend_analysis.probabilities.up) }}</div>
            <div class="text-xs text-green-300 flex items-center justify-center">
              <i class="ri-arrow-up-line w-4 h-4 flex items-center justify-center"></i>
              <span>{{ t('analysis.uptrend') }}</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/30 text-center">
            <div class="text-gray-300 text-xl font-bold mb-1">{{ formatPercent(analysisData.trend_analysis.probabilities.sideways) }}</div>
            <div class="text-xs text-gray-400 flex items-center justify-center">
              <i class="ri-subtract-line w-4 h-4 flex items-center justify-center"></i>
              <span>{{ t('analysis.sideways') }}</span>
            </div>
          </div>

          <div class="p-3 rounded-lg bg-[rgba(239,68,68,0.12)] border border-red-500/30 text-center">
            <div class="text-red-400 text-xl font-bold mb-1">{{ formatPercent(analysisData.trend_analysis.probabilities.down) }}</div>
            <div class="text-xs text-red-300 flex items-center justify-center">
              <i class="ri-arrow-down-line w-4 h-4 flex items-center justify-center"></i>
              <span>{{ t('analysis.downtrend') }}</span>
            </div>
          </div>
        </div>

        <!-- 市场趋势分析 -->
        <div class="mt-6" v-if="analysisData?.trend_analysis?.summary">
          <h3 class="text-lg font-medium mb-3">{{ t('analysis.market_trend_analysis') }}</h3>
          <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
            <p class="text-gray-300 leading-relaxed">
              {{ analysisData.trend_analysis.summary }}
            </p>
          </div>
        </div>

        <!-- 技术指标分析 -->
        <div class="mt-6" v-if="analysisData?.indicators_analysis">
          <h3 class="text-lg font-medium mb-3">{{ t('analysis.technical_indicators') }}</h3>
          <div class="flex flex-col gap-3">
            <!-- 单参数指标 -->
            <div class="grid grid-cols-2 gap-3">
              <!-- RSI -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  RSI (14)
                  <el-tooltip :content="getIndicatorExplanation('RSI')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.RSI.value }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.RSI.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.RSI.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.RSI.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- BIAS -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  BIAS
                  <el-tooltip :content="getIndicatorExplanation('BIAS')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.BIAS.value }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.BIAS.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.BIAS.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.BIAS.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- PSY -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  PSY
                  <el-tooltip :content="getIndicatorExplanation('PSY')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.PSY.value }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.PSY.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.PSY.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.PSY.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- VWAP -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  VWAP
                  <el-tooltip :content="getIndicatorExplanation('VWAP')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.VWAP.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.VWAP.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.VWAP.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.VWAP.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- Funding Rate -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  Funding Rate
                  <el-tooltip :content="getIndicatorExplanation('FundingRate')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ (analysisData.indicators_analysis.FundingRate.value * 100).toFixed(4) }}%</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.FundingRate.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.FundingRate.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.FundingRate.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- Exchange Netflow -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  Exchange Netflow
                  <el-tooltip :content="getIndicatorExplanation('ExchangeNetflow')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.ExchangeNetflow.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.ExchangeNetflow.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.ExchangeNetflow.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.ExchangeNetflow.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- NUPL -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  NUPL
                  <el-tooltip :content="getIndicatorExplanation('NUPL')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.NUPL.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.NUPL.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.NUPL.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.NUPL.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>

              <!-- Mayer Multiple -->
              <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                <div class="text-sm text-gray-400 mb-1 flex items-center gap-1">
                  Mayer Multiple
                  <el-tooltip :content="getIndicatorExplanation('MayerMultiple')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{{ analysisData.indicators_analysis.MayerMultiple.value.toFixed(2) }}</span>
                  <span :class="getIndicatorClass(analysisData.indicators_analysis.MayerMultiple.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.MayerMultiple.support_trend)}`">
                    <i :class="getTrendIconClass(analysisData.indicators_analysis.MayerMultiple.support_trend)" class="text-base"></i>
                  </span>
                </div>
              </div>
            </div>

            <!-- MACD (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400 flex items-center gap-1">
                  MACD
                  <el-tooltip :content="getIndicatorExplanation('MACD')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.MACD.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.MACD.support_trend)}`">
                  <i :class="getTrendIconClass(analysisData.indicators_analysis.MACD.support_trend)" class="text-base"></i>
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">Histogram</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.histogram.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">MACD Line</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.line.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">Signal Line</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.MACD.value.signal.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- Bollinger Bands (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400 flex items-center gap-1">
                  Bollinger Bands
                  <el-tooltip :content="getIndicatorExplanation('BollingerBands')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.BollingerBands.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.BollingerBands.support_trend)}`">
                  <i :class="getTrendIconClass(analysisData.indicators_analysis.BollingerBands.support_trend)" class="text-base"></i>
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-red-900/20 border border-red-800/30">
                  <div class="text-xs text-gray-400">Upper Band</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.upper.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-gray-700/30 border border-gray-600/30">
                  <div class="text-xs text-gray-400">Middle Band</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.middle.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-green-900/20 border border-green-800/30">
                  <div class="text-xs text-gray-400">Lower Band</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.BollingerBands.value.lower.toFixed(2) }}</div>
                </div>
              </div>
            </div>

            <!-- DMI (独占一行) -->
            <div class="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 mt-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm text-gray-400 flex items-center gap-1">
                  DMI
                  <el-tooltip :content="getIndicatorExplanation('DMI')" placement="top">
                    <i class="ri-question-line cursor-help"></i>
                  </el-tooltip>
                </div>
                <span :class="getIndicatorClass(analysisData.indicators_analysis.DMI.support_trend)" class="text-xs flex items-center justify-center w-5 h-5 rounded-full" :style="`background:${getIndicatorBgColor(analysisData.indicators_analysis.DMI.support_trend)}`">
                  <i :class="getTrendIconClass(analysisData.indicators_analysis.DMI.support_trend)" class="text-base"></i>
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center p-1 rounded bg-green-900/20 border border-green-800/30">
                  <div class="text-xs text-gray-400">+DI</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.DMI.value.plus_di.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-red-900/20 border border-red-800/30">
                  <div class="text-xs text-gray-400">-DI</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.DMI.value.minus_di.toFixed(2) }}</div>
                </div>
                <div class="text-center p-1 rounded bg-blue-900/20 border border-blue-800/30">
                  <div class="text-xs text-gray-400">ADX</div>
                  <div class="text-sm">{{ analysisData.indicators_analysis.DMI.value.adx.toFixed(2) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 支撑阻力位 -->
        <div class="mt-6" v-if="analysisData?.trading_advice">
          <h3 class="text-lg font-medium mb-3">{{ t('analysis.trading_advice') }}</h3>
          <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">{{ t('analysis.recommended_action') }}</div>
              <div class="text-sm" :class="analysisData.trading_advice.action === '买入' ? 'text-green-400' : analysisData.trading_advice.action === '卖出' ? 'text-red-400' : 'text-gray-400'">
                {{ getLocalizedAction(analysisData.trading_advice.action, currentLanguage) }}
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">{{ t('analysis.entry_price') }}</div>
              <div class="text-sm">{{ formatPrice(analysisData.trading_advice.entry_price) }}</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">{{ t('analysis.stop_loss') }}</div>
              <div class="text-sm text-red-400">{{ formatPrice(analysisData.trading_advice.stop_loss) }}</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-400">{{ t('analysis.take_profit') }}</div>
              <div class="text-sm text-green-400">{{ formatPrice(analysisData.trading_advice.take_profit) }}</div>
            </div>
            <div class="pt-2 border-t border-gray-700/50">
              <div class="text-sm text-gray-400 mb-1">{{ t('analysis.reason') }}</div>
              <div class="text-sm text-gray-300">{{ analysisData.trading_advice.reason }}</div>
            </div>
          </div>
        </div>

        <!-- 风险评估 -->
        <div class="mt-6" v-if="analysisData?.risk_assessment">
          <h3 class="text-lg font-medium mb-3">{{ t('analysis.risk_assessment') }}</h3>
          <div class="p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm text-gray-400">{{ t('analysis.risk_level') }}</div>
              <div class="px-2 py-0.5 rounded"
                :class="{
                  'bg-red-900/30 text-red-400': analysisData.risk_assessment.level === '高',
                  'bg-yellow-900/30 text-yellow-400': analysisData.risk_assessment.level === '中',
                  'bg-green-900/30 text-green-400': analysisData.risk_assessment.level === '低'
                }">
                {{ getLocalizedRiskLevel(analysisData.risk_assessment.level, currentLanguage) }}
              </div>
            </div>
            <div class="mb-3">
              <div class="text-sm text-gray-400 mb-1">{{ t('analysis.risk_score') }}</div>
              <div class="w-full bg-gray-700/50 rounded-full h-2">
                <div class="h-2 rounded-full"
                  :class="{
                    'bg-red-500': analysisData.risk_assessment.score > 70,
                    'bg-yellow-500': analysisData.risk_assessment.score > 30 && analysisData.risk_assessment.score <= 70,
                    'bg-green-500': analysisData.risk_assessment.score <= 30
                  }"
                  :style="{ width: `${analysisData.risk_assessment.score}%` }"></div>
              </div>
            </div>
            <div v-if="analysisData.risk_assessment.details && analysisData.risk_assessment.details.length > 0">
              <div class="text-sm text-gray-400 mb-1">{{ t('analysis.risk_factors') }}</div>
              <ul class="text-sm text-gray-300 list-disc pl-5 space-y-1">
                <li v-for="(detail, index) in analysisData.risk_assessment.details" :key="index">
                  {{ detail }}
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      <!-- 代币未找到状态 -->
      <div v-else-if="isTokenNotFound && !loading && !analysisLoading" class="flex items-center justify-center h-full">
        <TokenNotFoundView
          :symbol="currentSymbol"
          @refresh-success="handleRefreshSuccess"
          @refresh-error="handleRefreshError"
          :is-refreshing="showRefreshModal"
        />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error && !loading && !analysisLoading" class="flex items-center justify-center h-full">
        <div class="text-center px-4">
          <i class="ri-error-warning-line text-4xl text-red-500 mb-2"></i>
          <p class="text-gray-300 mb-2">{{ error }}</p>
          <p class="text-gray-400 text-sm mb-4">{{ t('errors.try_reload_or_later') }}</p>
          <div class="flex space-x-3 justify-center">
            <button
              class="px-4 py-2 bg-primary text-white rounded-lg"
              @click="() => loadAnalysisData()"
            >
              {{ t('common.retry') }}
            </button>
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded-lg"
              @click="handleManualRefresh"
              :disabled="isRefreshing"
            >
              {{ isRefreshing ? t('common.refreshing') : t('analysis.force_refresh') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 如果没有数据且不在加载状态，显示空状态 -->
      <div v-else-if="!analysisData && !loading && !analysisLoading && !isTokenNotFound && !error" class="flex items-center justify-center h-full">
        <div class="text-center px-4">
          <i class="ri-database-line text-4xl text-gray-500 mb-2"></i>
          <p class="text-gray-300 mb-2">{{ t('common.no_data') }}</p>
          <button
            class="px-4 py-2 bg-primary text-white rounded-lg"
            @click="() => loadAnalysisData()"
          >
            {{ t('common.load_data') }}
          </button>
        </div>
      </div>


    </main>

    <!-- 底部导航栏 -->
    <nav class="absolute bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="grid grid-cols-3 h-16">
          <router-link to="/" class="flex flex-col items-center justify-center text-primary border-t-2 border-primary">
            <i class="ri-line-chart-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('nav.market') }}</span>
          </router-link>
          <router-link to="/points" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-coin-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('nav.points') }}</span>
          </router-link>
          <router-link to="/profile" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-settings-3-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('nav.settings') }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 加载弹窗 -->
    <LoadingModal
      :visible="showLoadingModal"
      :type="loadingType"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, watch, onBeforeUnmount } from 'vue'
import html2canvas from 'html2canvas'
// @ts-ignore
// eslint-disable-next-line
declare module 'qrcode';
import QRCode from 'qrcode'
import { ElTooltip, ElMessage } from 'element-plus'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { useI18n } from 'vue-i18n'

const { t } = useEnhancedI18n()
const { t: i18nT } = useI18n()

import { getTechnicalAnalysis, getLatestTechnicalAnalysis } from '@/api'
import { parseSymbolFromUrl } from '@/utils/trading'
import type {
  FormattedTechnicalAnalysisData
} from '@/types/technical-analysis'
import { formatTechnicalAnalysisData } from '@/utils/data-formatter'
import TokenNotFoundView from '@/components/TokenNotFoundView.vue'
import ChartSkeleton from '@/components/ChartSkeleton.vue'
import LoadingModal from '@/components/LoadingModal.vue'



const isExtensionEnvironment = (): boolean => {
  return typeof chrome !== 'undefined' &&
         typeof chrome.runtime !== 'undefined' &&
         typeof chrome.runtime.getURL === 'function';
}

const analysisData = ref<FormattedTechnicalAnalysisData | null>(null)
const loading = ref(false) // 整体加载状态
const analysisLoading = ref(false) // 分析数据加载状态
const error = ref<string | null>(null)
const currentSymbol = ref<string>('BTCUSDT') // 默认值
const retryCount = ref(0)
const isTokenNotFound = ref(false) // 用于标记代币是否未找到（404错误）
const showRefreshModal = ref(false)
const showLoadingModal = ref(false) // 通用加载弹窗
const loadingType = ref<'refresh' | 'generate'>('refresh') // 加载类型

// 简化骨架屏逻辑 - 基于数据状态而不是加载状态
const showSkeleton = ref(true) // 默认显示骨架屏

// 监听数据变化，有数据时隐藏骨架屏
watch(analysisData, (newData) => {
  if (newData) {
    showSkeleton.value = false
  }
})

// 监听其他状态变化，确保在特殊状态下隐藏骨架屏
watch([isTokenNotFound, error], ([tokenNotFound, errorState]) => {
  if (tokenNotFound || errorState) {
    showSkeleton.value = false
  }
})

// 获取当前交易对
const getCurrentSymbol = async (): Promise<string> => {
  try {
    console.log('开始获取当前交易对...');

    // 优先通过 content script 获取 symbol
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query && chrome.tabs.sendMessage) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        console.log('当前活动标签页:', tab?.url);

        if (tab && typeof tab.id === 'number') {
          // 先尝试直接获取symbol
          const response = await new Promise<{ symbol?: string }>((resolve) => {
            chrome.tabs.sendMessage(tab.id as number, { type: 'GET_SYMBOL_FROM_CONTENT' }, (resp) => {
              if (chrome.runtime.lastError) {
                console.log('Content script通信错误:', chrome.runtime.lastError.message);
                resolve({});
              } else {
                resolve(resp || {});
              }
            });
          });

          console.log('Content script响应:', response);

          if (response && response.symbol && typeof response.symbol === 'string') {
            console.log('从content script获取到交易对:', response.symbol);
            return response.symbol;
          }

          // 如果没有获取到symbol，尝试直接解析当前标签页的URL
          if (tab.url) {
            const parsedFromTabUrl = parseSymbolFromUrl(tab.url);
            console.log('直接解析标签页URL结果:', parsedFromTabUrl);
            if (parsedFromTabUrl && typeof parsedFromTabUrl === 'string') {
              return parsedFromTabUrl;
            }
          }
        }
      } catch (e) {
        console.log('Content script获取失败:', e);
      }
    }

    // fallback: background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        const response = await new Promise<{ symbol?: string }>((resolve) => {
          chrome.runtime.sendMessage({ type: 'GET_CURRENT_SYMBOL' }, (resp) => {
            if (chrome.runtime.lastError) {
              console.log('Background script通信错误:', chrome.runtime.lastError.message);
              resolve({});
            } else {
              resolve(resp || {});
            }
          });
        });

        console.log('Background script响应:', response);

        if (response && response.symbol && typeof response.symbol === 'string') {
          console.log('从background script获取到交易对:', response.symbol);
          return response.symbol;
        }
      } catch (e) {
        console.log('Background script获取失败:', e);
      }
    }

    // fallback: 直接用 window.location (虽然在popup中通常不会有用)
    const parsedSymbol = parseSymbolFromUrl(window.location.href);
    console.log('解析popup URL结果:', parsedSymbol);
    if (parsedSymbol && typeof parsedSymbol === 'string') {
      return parsedSymbol;
    }

    // 最后 fallback
    console.log('所有方法都失败，使用默认值 BTCUSDT');
    return 'BTCUSDT';
  } catch (error) {
    console.error('获取交易对时发生错误:', error);
    // 确保即使在错误情况下也返回有效的字符串
    return 'BTCUSDT';
  }
}

// 监听交易对更新
const setupSymbolListener = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('设置交易对消息监听器...');

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        console.log('收到消息:', message);

        if (message.type === 'SYMBOL_UPDATED' && message.data && message.data.symbol) {
          console.log('接收到交易对更新:', message.data.symbol);
          const newSymbol = message.data.symbol;
          // 验证新的 symbol 是否为有效字符串
          if (newSymbol && typeof newSymbol === 'string' && newSymbol !== currentSymbol.value) {
            console.log('交易对发生变化，从', currentSymbol.value, '到', newSymbol);
            currentSymbol.value = newSymbol;
            // 不要在这里调用 loadAnalysisData()，让 watch 来处理
          }
        }

        sendResponse({ status: 'success' });
      } catch (error: any) {
        console.error('处理消息时出错:', error);
        sendResponse({ status: 'error', error: error.message });
      }
      return true;
    });
  } else {
    console.log('Chrome 扩展环境不可用，无法设置消息监听器');
  }
}

// 格式化价格显示
const formatPrice = (price?: number | string | null) => {
  // 检查价格是否为undefined或null
  if (price === undefined || price === null) return '--'

  // 如果价格是字符串，尝试转换为数字
  if (typeof price === 'string') {
    // 尝试直接解析数字（包括科学计数法）
    price = parseFloat(price)

    // 如果转换失败，返回原始字符串
    if (isNaN(price)) return price || '--'
  }

  // 确保价格是数字类型
  const numPrice = Number(price)
  if (isNaN(numPrice)) return '--'

  // 处理非常小的数值（科学计数法）
  if (numPrice < 0.0001) {
    // 对于非常小的数值，使用科学计数法或更精确的表示
    if (numPrice < 0.00000001) {
      // 极小值使用科学计数法
      return numPrice.toExponential(8)
    } else {
      // 小值但不是极小值，显示更多小数位
      return numPrice.toFixed(8)
    }
  } else if (numPrice < 1) {
    // 小于1的价格显示6位小数
    return numPrice.toFixed(6)
  } else if (numPrice < 1000) {
    // 普通价格显示2位小数
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } else {
    // 大额价格显示2位小数
    return numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
}

// 格式化时间显示
const formatTime = (timeString?: string): string => {
  if (!timeString) return '--'
  try {
    const date = new Date(timeString)
    if (isNaN(date.getTime())) {
      return t('common.error')
    }
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)

    if (diff < 60) {
      return t('analysis.minute_ago', { n: diff })
    } else if (diff < 24 * 60) {
      return t('analysis.hour_ago', { n: Math.floor(diff / 60) })
    } else {
      return t('analysis.day_ago', { n: Math.floor(diff / (24 * 60)) })
    }
  } catch (e) {
    console.error('时间格式化错误:', e)
    return t('common.error')
  }
}

// 获取基础货币名称
const getBaseSymbol = (symbol: string | null | undefined) => {
  if (!symbol || typeof symbol !== 'string') {
    return 'BTC' // 默认返回 BTC
  }
  return symbol.replace('USDT', '')
}

// 添加请求防抖变量
let loadingPromise: Promise<any> | null = null;

// 简化的数据加载函数 - 读取本地已存在的报告数据
const loadAnalysisData = async (showLoading = true) => {
  try {
    // 增强的 symbol 验证
    if (!currentSymbol.value || typeof currentSymbol.value !== 'string') {
      console.error('loadAnalysisData: Invalid currentSymbol.value:', {
        value: currentSymbol.value,
        type: typeof currentSymbol.value
      });
      error.value = '无法获取当前交易对信息'
      return
    }

    // 如果已经有请求在进行中，直接返回该请求的Promise
    if (loadingPromise) {
      return loadingPromise;
    }

    error.value = null
    isTokenNotFound.value = false
    if (showLoading) {
      loading.value = true
      analysisLoading.value = true
    }

    console.log(`loadAnalysisData: 开始加载 ${currentSymbol.value} 的本地报告数据`)

    // 创建新的请求Promise - 直接调用 getTechnicalAnalysis 读取本地数据
    loadingPromise = getTechnicalAnalysis(currentSymbol.value)
      .then(data => {
        if (data && (data as any).status !== 'not_found') {
          const formattedData = formatTechnicalAnalysisData(data)
          analysisData.value = formattedData
          isTokenNotFound.value = false
          console.log(`loadAnalysisData: 成功加载 ${currentSymbol.value} 的报告数据`)
        } else {
          isTokenNotFound.value = true
          console.log(`loadAnalysisData: ${currentSymbol.value} 的报告数据未找到`)
        }
        return data;
      })
      .finally(() => {
        loading.value = false
        analysisLoading.value = false
        loadingPromise = null;
      });

    return loadingPromise;
  } catch (e) {
    console.error(`loadAnalysisData: 加载失败`, e)
    error.value = e instanceof Error ? e.message : '加载数据失败'
    loading.value = false
    analysisLoading.value = false
    loadingPromise = null;
  }
}

// 强制刷新函数 - 先生成新报告，然后读取完整报告数据
async function forceRefreshData() {
  try {
    console.log('forceRefreshData 开始执行')

    // 添加详细的调试信息
    console.log('forceRefreshData: currentSymbol.value =', currentSymbol.value)
    console.log('forceRefreshData: currentSymbol.value 类型 =', typeof currentSymbol.value)
    console.log('forceRefreshData: currentSymbol.value 是否为空 =', !currentSymbol.value)
    console.log('forceRefreshData: currentSymbol.value 长度 =', currentSymbol.value?.length)

    if (!currentSymbol.value || typeof currentSymbol.value !== 'string') {
      const errorMsg = `无法获取当前交易对信息: currentSymbol.value = ${currentSymbol.value}, 类型 = ${typeof currentSymbol.value}`
      console.error(errorMsg)
      error.value = errorMsg
      throw new Error(errorMsg)
    }

    console.log('当前交易对:', currentSymbol.value)
    error.value = null
    isTokenNotFound.value = false
    analysisLoading.value = true

    console.log('步骤1: 调用 getLatestTechnicalAnalysis 生成新报告，参数:', currentSymbol.value)

    // 再次验证 symbol 在调用 API 之前
    if (!currentSymbol.value || typeof currentSymbol.value !== 'string') {
      const errorMsg = `API调用前验证失败: currentSymbol.value = ${currentSymbol.value}, 类型 = ${typeof currentSymbol.value}`
      console.error(errorMsg)
      error.value = errorMsg
      analysisLoading.value = false
      throw new Error(errorMsg)
    }

    // 步骤1: 调用 getLatestTechnicalAnalysis 生成新报告
    const generateResult = await getLatestTechnicalAnalysis(currentSymbol.value, true)
    console.log('forceRefreshData: 报告生成结果:', generateResult)

    // 检查生成是否成功
    if (!generateResult || (generateResult as any).status === 'not_found') {
      isTokenNotFound.value = true
      analysisLoading.value = false
      console.log('forceRefreshData: 报告生成失败')
      return
    }

    console.log('步骤2: 报告生成成功，现在调用 getTechnicalAnalysis 读取完整报告数据')

    // 再次验证 symbol 在第二次 API 调用之前
    if (!currentSymbol.value || typeof currentSymbol.value !== 'string') {
      const errorMsg = `第二次API调用前验证失败: currentSymbol.value = ${currentSymbol.value}, 类型 = ${typeof currentSymbol.value}`
      console.error(errorMsg)
      error.value = errorMsg
      analysisLoading.value = false
      throw new Error(errorMsg)
    }

    // 步骤2: 报告生成成功后，调用 getTechnicalAnalysis 读取完整的报告数据
    const fullReportData = await getTechnicalAnalysis(currentSymbol.value)
    console.log('forceRefreshData: 完整报告数据:', fullReportData)

    // 检查完整报告数据
    if (fullReportData && (fullReportData as any).status !== 'not_found') {
      // 成功获取到完整报告数据
      const formattedData = formatTechnicalAnalysisData(fullReportData)
      analysisData.value = formattedData
      isTokenNotFound.value = false
      console.log('forceRefreshData: 成功获取完整报告数据')
    } else {
      // 完整报告数据未找到
      isTokenNotFound.value = true
      console.log('forceRefreshData: 完整报告数据未找到')
    }

    analysisLoading.value = false
    console.log('forceRefreshData 执行成功')
  } catch (e) {
    console.error('forceRefreshData 执行失败:', e)
    const errorMsg = e instanceof Error ? e.message : '刷新失败'
    error.value = errorMsg
    analysisLoading.value = false
    throw e // 重新抛出错误，让调用者知道失败了
  }
}

// 组件卸载时清理
onUnmounted(() => {
  // 清理所有进行中的请求
  loadingPromise = null;
})

// 监听语言变更事件，重新翻译报告数据
const setupLanguageChangeListener = () => {
  window.addEventListener('language-changed', async (event) => {
    const newLanguage = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US'

    if (currentSymbol.value) {
      await loadAnalysisData(false)
      await nextTick()
    }
  })

  window.addEventListener('force-refresh-i18n', async () => {
    if (analysisData.value && currentSymbol.value) {
      const currentLanguage = localStorage.getItem('language') || 'en-US';
      await loadAnalysisData(false);
      await nextTick();
    }
  })
}

// 主动触发content script重新检测当前页面
const triggerContentScriptDetection = async () => {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query && chrome.tabs.sendMessage) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (tab && typeof tab.id === 'number') {
        console.log('主动触发content script重新检测页面...');

        // 发送PAGE_UPDATED消息，让content script重新初始化
        chrome.tabs.sendMessage(tab.id, { type: 'PAGE_UPDATED' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('触发content script检测失败:', chrome.runtime.lastError.message);
          } else {
            console.log('成功触发content script重新检测:', response);
          }
        });

        // 等待一小段时间让content script处理
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (e) {
    console.log('触发content script检测时出错:', e);
  }
}

// 检查用户登录状态
const checkAuthStatus = () => {
  const token = localStorage.getItem('token')
  const userInfo = localStorage.getItem('userInfo')
  return token && userInfo
}

// 组件挂载时加载数据
onMounted(async () => {
  console.log('HomeView 组件挂载开始...');

  // 检查用户登录状态，如果未登录则直接跳转到登录页
  if (!checkAuthStatus()) {
    console.log('用户未登录，跳转到登录页面');
    window.location.href = '/login';
    return;
  }

  // 设置loading状态
  loading.value = true;

  // 设置语言变更监听器
  setupLanguageChangeListener()

  // 设置交易对监听器
  setupSymbolListener()

  // 主动触发content script重新检测当前页面
  await triggerContentScriptDetection();

  // 每次挂载都主动拉取最新 symbol
  try {
    const symbol = await getCurrentSymbol();
    console.log('获取到的交易对:', symbol);

    // 验证获取到的 symbol 是否为有效字符串
    if (symbol && typeof symbol === 'string' && symbol !== currentSymbol.value) {
      console.log('交易对发生变化，从', currentSymbol.value, '到', symbol);
      currentSymbol.value = symbol;
      await loadAnalysisData();
    } else if (!symbol || typeof symbol !== 'string' || symbol === 'BTCUSDT') {
      // 如果没有获取到symbol或者是默认值，再次尝试获取
      console.log('未获取到有效交易对，等待后重试...');

      // 先用默认值加载，避免长时间显示loading
      currentSymbol.value = 'BTCUSDT';
      await loadAnalysisData();

      // 等待一段时间后重试
      setTimeout(async () => {
        const retrySymbol = await getCurrentSymbol();
        console.log('重试获取到的交易对:', retrySymbol);

        // 验证重试获取的 symbol 是否为有效字符串
        if (retrySymbol && typeof retrySymbol === 'string' && retrySymbol !== currentSymbol.value && retrySymbol !== 'BTCUSDT') {
          console.log('重试成功，更新交易对:', retrySymbol);
          currentSymbol.value = retrySymbol;
          await loadAnalysisData();
        }
      }, 1000);
    } else {
      // 如果获取到了有效的交易对，直接加载
      await loadAnalysisData();
    }

    // 如果 analysisData 为空，主动加载一次（兜底）
    if (!analysisData.value) {
      await loadAnalysisData();
    }
  } catch (e: any) {
    console.error('初始化失败:', e);
    error.value = e instanceof Error ? e.message : '加载数据失败'
    loading.value = false
  }
})

// 监听交易对变化，更新数据
watch(currentSymbol, async (newSymbol, oldSymbol) => {
  console.log('currentSymbol 发生变化:', { oldSymbol, newSymbol, type: typeof newSymbol })

  // 如果新值无效，恢复为默认值
  if (!newSymbol || typeof newSymbol !== 'string') {
    console.warn('检测到无效的 currentSymbol 值，恢复为默认值 BTCUSDT')
    currentSymbol.value = 'BTCUSDT'
    return
  }

  if (newSymbol && typeof newSymbol === 'string') {
    await loadAnalysisData()
  }
})

// 格式化百分比
const formatPercent = (value?: number | string | null) => {
  // 检查值是否为undefined或null
  if (value === undefined || value === null) return '--'

  // 如果值是字符串，尝试转换为数字
  if (typeof value === 'string') {
    // 移除非数字字符（保留小数点）
    const cleanedValue = value.replace(/[^\d.]/g, '')
    value = parseFloat(cleanedValue)

    // 如果转换失败，返回原始字符串
    if (isNaN(value)) return cleanedValue ? `${cleanedValue}%` : '--'
  }

  // 确保值是数字类型
  const numValue = Number(value)
  if (isNaN(numValue)) return '--'

  // 如果值已经是百分比形式（0-100范围），则直接返回
  if (numValue > 1) {
    return `${Math.round(numValue)}%`
  }

  // 如果值是小数形式（0-1范围），则转换为百分比
  return `${Math.round(numValue * 100)}%`
}


// 获取指标趋势样式
const getIndicatorClass = (trend?: string) => {
  if (!trend) return 'text-gray-400'
  if (
    trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势' ||
    trend === 'up'
  ) return 'text-green-400'
  if (
    trend === 'bearish' || trend === '看跌' || trend === '不支持当前趋势' ||
    trend === 'down'
  ) return 'text-red-400'
  if (trend === 'neutral' || trend === '中性') return 'text-yellow-400'
  return 'text-gray-400'
}

// 获取指标趋势图标类名
const getTrendIconClass = (trend?: string) => {
  if (
    trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势' ||
    trend === 'up'
  ) {
    return 'ri-arrow-up-line';
  }
  if (
    trend === 'bearish' || trend === '看跌' || trend === '反对当前趋势' ||
    trend === 'down'
  ) {
    return 'ri-arrow-down-line';
  }
  return 'ri-subtract-line';
}

// 趋势图标渲染函数已移至其他地方使用

// 保存图片时的趋势图标渲染（与页面一致，Remix Icon + 圆形底色，垂直居中，微调）
const getIndicatorIconForImage = (trend?: string) => {
  const baseStyle = "display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;";
  const iconStyle = "font-size:14px;line-height:1;height:14px;vertical-align:middle;display:block;margin-top:-14px;";
  if (trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势') {
    return `<span style="${baseStyle}background:rgba(16,185,129,0.12);">
      <i class='ri-arrow-up-line' style='${iconStyle}color:#22c55e;'></i>
    </span>`;
  }
  if (trend === 'bearish' || trend === '看跌' || trend === '反对当前趋势') {
    return `<span style="${baseStyle}background:rgba(239,68,68,0.12);">
      <i class='ri-arrow-down-line' style='${iconStyle}color:#ef4444;'></i>
    </span>`;
  }
  // 中性
  return `<span style="${baseStyle}background:rgba(156,163,175,0.12);">
    <i class='ri-subtract-line' style='${iconStyle}color:#9ca3af;'></i>
  </span>`;
}

// 测试 URL 解析
const testUrlParsing = async () => {
  try {
    console.log('=== 测试 URL 解析 ===');

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab && tab.url) {
        console.log('当前标签页 URL:', tab.url);
        const parsedSymbol = parseSymbolFromUrl(tab.url);
        console.log('解析结果:', parsedSymbol);

        // 也测试一下 background script 的结果
        const bgSymbol = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'GET_CURRENT_SYMBOL' }, (response) => {
            resolve(response?.symbol || 'NO_RESPONSE');
          });
        });

        alert(`URL: ${tab.url}\n直接解析结果: ${parsedSymbol}\nBackground Script 结果: ${bgSymbol}\n当前显示: ${currentSymbol.value}`);
      }
    }
  } catch (e: unknown) {
    console.error('测试失败:', e);
    if (e && typeof e === 'object' && 'message' in e) {
      alert('测试失败: ' + (e as any).message);
    } else {
      alert('测试失败');
    }
  }
}

// 普通刷新数据 - 重新读取本地报告数据
const refreshData = async () => {
  error.value = null // 清除之前的错误
  isTokenNotFound.value = false // 重置代币未找到状态
  analysisLoading.value = true

  try {
    console.log('refreshData: 开始刷新本地报告数据')

    // 验证 currentSymbol.value
    if (!currentSymbol.value || typeof currentSymbol.value !== 'string') {
      throw new Error('无效的交易对信息')
    }

    // 调用 getTechnicalAnalysis 重新读取本地数据
    const response = await getTechnicalAnalysis(currentSymbol.value)
    console.log('refreshData: 普通刷新数据返回:', response)

    // 检查响应状态，处理新的响应格式
    if (typeof response === 'object' && response !== null && 'status' in response) {
      const apiResponse = response as any;
      if (apiResponse.status === 'not_found' && apiResponse.needs_refresh === true) {
        isTokenNotFound.value = true
        analysisLoading.value = false
        console.log('refreshData: 报告数据未找到，需要生成新报告')
        return
      }
    }

    // 确保数据格式化，填充可能缺失的字段
    const formattedData = formatTechnicalAnalysisData(response)

    // 更新数据
    analysisData.value = formattedData

    // 打印检查数据完整性
    console.log('refreshData: 格式化数据是否包含市场趋势分析:', !!formattedData.trend_analysis)
    console.log('refreshData: 格式化数据是否包含交易建议:', !!formattedData.trading_advice)
    console.log('refreshData: 格式化数据是否包含风险评估:', !!formattedData.risk_assessment)

    // 标记分析数据加载完成
    analysisLoading.value = false

    // 确保视图更新
    await nextTick()
    console.log('refreshData: 刷新完成')

  } catch (err: any) {
    // 重置加载状态
    analysisLoading.value = false

    // 现在 404 错误会被 API 函数处理并返回 {status: 'not_found'} 对象
    // 所以这里只需要处理其他类型的错误
    error.value = err.message || '刷新数据失败'
    console.error('refreshData: 刷新失败:', err)
  }
}

// 防止重复刷新的标志
const isRefreshing = ref(false)

// 手动刷新按钮处理函数
const handleManualRefresh = async () => {
  // 防止重复点击
  if (isRefreshing.value) {
    console.log('刷新正在进行中，忽略重复点击')
    return
  }

  try {
    isRefreshing.value = true
    console.log('开始手动刷新，显示加载弹窗')

    // 添加详细的调试信息
    console.log('handleManualRefresh: currentSymbol.value =', currentSymbol.value)
    console.log('handleManualRefresh: currentSymbol.value 类型 =', typeof currentSymbol.value)
    console.log('handleManualRefresh: currentSymbol.value 是否为空 =', !currentSymbol.value)

    // 如果 currentSymbol.value 无效，尝试重新获取
    if (!currentSymbol.value || typeof currentSymbol.value !== 'string') {
      console.warn('handleManualRefresh: 检测到无效的 currentSymbol.value，尝试重新获取')
      try {
        const newSymbol = await getCurrentSymbol()
        if (newSymbol && typeof newSymbol === 'string') {
          currentSymbol.value = newSymbol
          console.log('handleManualRefresh: 成功重新获取 currentSymbol.value =', newSymbol)
        } else {
          currentSymbol.value = 'BTCUSDT'
          console.log('handleManualRefresh: 重新获取失败，使用默认值 BTCUSDT')
        }
      } catch (e) {
        console.error('handleManualRefresh: 重新获取 currentSymbol 失败:', e)
        currentSymbol.value = 'BTCUSDT'
      }
    }

    // 显示加载弹窗
    loadingType.value = 'refresh'
    showLoadingModal.value = true
    console.log('showLoadingModal.value 设置为:', showLoadingModal.value)

    // 使用强制刷新逻辑
    await forceRefreshData()

    // 刷新成功，隐藏加载弹窗
    showLoadingModal.value = false
    console.log('刷新成功，隐藏加载弹窗')

    ElMessage({
      message: t('common.success'),
      type: 'success'
    })
  } catch (error) {
    console.error('手动刷新失败，详细错误:', error)
    console.error('错误类型:', typeof error)
    console.error('错误消息:', error instanceof Error ? error.message : String(error))

    // 隐藏加载弹窗
    showLoadingModal.value = false
    console.log('刷新失败，隐藏加载弹窗')

    // 显示具体的错误信息
    const errorMessage = error instanceof Error ? error.message : t('errors.refresh_failed')
    ElMessage({
      message: errorMessage,
      type: 'error',
      duration: 3000 // 3秒后自动消失
    })
  } finally {
    isRefreshing.value = false
  }
}

// 分享到推特
const shareToTwitter = () => {
  try {
    // 获取当前语言
    const lang = (localStorage.getItem('language') || 'en-US').toLowerCase()
    // 构建分享文本
    const symbol = currentSymbol.value || 'CRYPTO'
    const price = formatPrice(analysisData.value?.current_price || 0)

    // 获取概率值并确保它们是有效的百分比
    let upProb = analysisData.value?.trend_analysis?.probabilities?.up
    let downProb = analysisData.value?.trend_analysis?.probabilities?.down

    upProb = typeof upProb === 'number' && upProb >= 0 && upProb <= 1 ? upProb : 0.33
    downProb = typeof downProb === 'number' && downProb >= 0 && downProb <= 1 ? downProb : 0.33

    // 获取趋势分析摘要
    const trendSummary = analysisData.value?.trend_analysis?.summary || ''
    // 获取交易建议
    const tradingAction = analysisData.value?.trading_advice?.action || ''
    const tradingReason = analysisData.value?.trading_advice?.reason || ''
    const entryPrice = formatPrice(analysisData.value?.trading_advice?.entry_price)
    const stopLoss = formatPrice(analysisData.value?.trading_advice?.stop_loss)
    const takeProfit = formatPrice(analysisData.value?.trading_advice?.take_profit)
    // 获取风险评估
    const riskLevel = analysisData.value?.risk_assessment?.level || ''
    const riskScore = analysisData.value?.risk_assessment?.score || 50
    const riskDetails = analysisData.value?.risk_assessment?.details || []

    // 多语言分享文本
    let shareText = ''
    if (lang === 'zh-cn') {
      shareText = `${symbol}市场分析报告 - 当前价格: ${price} USD\n\n市场趋势:\n${trendSummary.substring(0, 50)}${trendSummary.length > 50 ? '...' : ''}\n\n交易建议:\n操作: ${tradingAction}\n入场价: ${entryPrice}\n止损价: ${stopLoss}\n目标价: ${takeProfit}\n\n风险评估:\n风险等级: ${riskLevel}\n风险评分: ${riskScore}/100\n${riskDetails.length > 0 ? '主要风险因素:\n' + riskDetails.slice(0, 2).map(detail => `- ${detail}`).join('\n') : ''}\n\n#加密货币 #技术分析 #交易建议`
    } else if (lang === 'ja-jp') {
      shareText = `${symbol}市場分析レポート - 現在価格: ${price} USD\n\n市場トレンド:\n${trendSummary.substring(0, 50)}${trendSummary.length > 50 ? '...' : ''}\n\n取引アドバイス:\nアクション: ${tradingAction}\nエントリー価格: ${entryPrice}\nストップロス: ${stopLoss}\n利益確定: ${takeProfit}\n\nリスク評価:\nリスクレベル: ${riskLevel}\nリスクスコア: ${riskScore}/100\n${riskDetails.length > 0 ? '主なリスク要因:\n' + riskDetails.slice(0, 2).map(detail => `- ${detail}`).join('\n') : ''}\n\n#暗号資産 #テクニカル分析 #取引アドバイス`
    } else if (lang === 'ko-kr') {
      shareText = `${symbol} 시장 분석 리포트 - 현재 가격: ${price} USD\n\n시장 트렌드:\n${trendSummary.substring(0, 50)}${trendSummary.length > 50 ? '...' : ''}\n\n거래 조언:\n행동: ${tradingAction}\n진입 가격: ${entryPrice}\n손절가: ${stopLoss}\n이익실현가: ${takeProfit}\n\n위험 평가:\n위험 수준: ${riskLevel}\n위험 점수: ${riskScore}/100\n${riskDetails.length > 0 ? '주요 위험 요소:\n' + riskDetails.slice(0, 2).map(detail => `- ${detail}`).join('\n') : ''}\n\n#암호화폐 #기술분석 #거래조언`
    } else {
      shareText = `${symbol} Market Analysis Report - Current Price: ${price} USD\n\nMarket Trend:\n${trendSummary.substring(0, 50)}${trendSummary.length > 50 ? '...' : ''}\n\nTrading Advice:\nAction: ${tradingAction}\nEntry Price: ${entryPrice}\nStop Loss: ${stopLoss}\nTake Profit: ${takeProfit}\n\nRisk Assessment:\nRisk Level: ${riskLevel}\nRisk Score: ${riskScore}/100\n${riskDetails.length > 0 ? 'Main Risk Factors:\n' + riskDetails.slice(0, 2).map(detail => `- ${detail}`).join('\n') : ''}\n\n#crypto #technicalanalysis #tradingadvice`
    }

    // 检查字符长度，如果超过270个字符，则进行裁剪
    if (shareText.length > 270) {
      shareText = shareText.substring(0, 260) + '...'
    }

    // 构建Twitter分享URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

    // 在新窗口中打开Twitter分享页面
    window.open(twitterUrl, '_blank')
  } catch (error) {
    // 分享失败处理
  }
}

// 保存图表为图片
const saveChartImage = async () => {
  try {
    // 创建一个容器用于生成图片
    const container = document.createElement('div')
    container.style.width = '375px'
    container.style.padding = '20px'
    container.style.backgroundColor = '#0F172A'
    container.style.color = '#fff'
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif'
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.zIndex = '-1'

    // 标题和当前价格卡片
    const titleSection = document.createElement('div')
    titleSection.style.textAlign = 'center'
    titleSection.style.marginBottom = '20px'
    titleSection.style.padding = '20px 0 10px 0'
    titleSection.style.background = 'linear-gradient(to bottom, #1e293b99 60%, #0f172a99 100%)'
    titleSection.style.borderRadius = '16px'
    titleSection.style.boxShadow = '0 2px 8px 0 #0002'
    const safeSymbol = currentSymbol.value || 'BTCUSDT'
    const safeBaseSymbol = getBaseSymbol(safeSymbol)
    titleSection.innerHTML = `
      <h2 style="font-size: 22px; margin-bottom: 10px; font-weight: 600; letter-spacing: 1px;">${safeSymbol} ${t('analysis.market_report', { symbol: safeBaseSymbol }).replace('analysis.market_report', '市场分析报告')}</h2>
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;">
        ${formatPrice(analysisData.value?.current_price)} <span style='font-size:16px;color:#9ca3af'>USD</span>
      </div>
    `
    container.appendChild(titleSection)

    // 市场趋势分析卡片
    if (analysisData.value?.trend_analysis?.summary) {
      const trendSection = document.createElement('div')
      trendSection.style.margin = '20px 0 0 0'
      trendSection.style.padding = '16px'
      trendSection.style.background = 'rgba(31,41,55,0.3)'
      trendSection.style.border = '1px solid #374151'
      trendSection.style.borderRadius = '12px'
      trendSection.style.boxShadow = '0 1px 4px 0 #0001'
      trendSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">${t('analysis.market_trend_analysis').replace('analysis.market_trend_analysis', '市场趋势分析')}</div>
        <div style="font-size: 14px; color: #d1d5db; line-height: 1.6; margin-bottom: 12px;">${analysisData.value.trend_analysis.summary}</div>
        <div style="display: flex; justify-content: center; gap: 8px;">
          <div style="flex:1; text-align:center; background:rgba(16,185,129,0.12); border-radius:8px; padding:8px 0; border:1px solid #10b98133;">
            <div style="color:#4ade80; font-size:18px; font-weight:600;">${formatPercent(analysisData.value.trend_analysis.probabilities.up)}</div>
            <div style="color:#4ade80; font-size:12px;">${t('analysis.uptrend').replace('analysis.uptrend', '上涨')}</div>
          </div>
          <div style="flex:1; text-align:center; background:rgba(156,163,175,0.12); border-radius:8px; padding:8px 0; border:1px solid #9ca3af33;">
            <div style="color:#9ca3af; font-size:18px; font-weight:600;">${formatPercent(analysisData.value.trend_analysis.probabilities.sideways)}</div>
            <div style="color:#9ca3af; font-size:12px;">${t('analysis.sideways').replace('analysis.sideways', '盘整')}</div>
          </div>
          <div style="flex:1; text-align:center; background:rgba(239,68,68,0.12); border-radius:8px; padding:8px 0; border:1px solid #ef444433;">
            <div style="color:#ef4444; font-size:18px; font-weight:600;">${formatPercent(analysisData.value.trend_analysis.probabilities.down)}</div>
            <div style="color:#ef4444; font-size:12px;">${t('analysis.downtrend').replace('analysis.downtrend', '下跌')}</div>
          </div>
        </div>
      `
      container.appendChild(trendSection)
    }

    // 技术指标卡片
    if (analysisData.value?.indicators_analysis) {
      const indicatorsSection = document.createElement('div')
      indicatorsSection.style.margin = '20px 0 0 0'
      indicatorsSection.style.padding = '16px'
      indicatorsSection.style.background = 'rgba(31,41,55,0.3)'
      indicatorsSection.style.border = '1px solid #374151'
      indicatorsSection.style.borderRadius = '12px'
      indicatorsSection.style.boxShadow = '0 1px 4px 0 #0001'
      indicatorsSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">${t('analysis.technical_indicators').replace('analysis.technical_indicators', '技术指标')}</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
          ${Object.entries(analysisData.value.indicators_analysis)
            .filter(([key]) => !['MACD', 'BollingerBands', 'DMI'].includes(key))
            .map(([key, indicator]) => `
              <div style="padding: 10px; background: rgba(17,24,39,0.5); border: 1px solid #334155; border-radius: 8px;">
                <div style="font-size: 12px; color: #9ca3af; margin-bottom: 5px;">${key}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px;">${typeof indicator.value === 'number' ? indicator.value.toFixed(2) : indicator.value}</span>
                  <span style="font-size: 12px;">${getIndicatorIconForImage(indicator.support_trend)}</span>
                </div>
              </div>
            `).join('')}
        </div>
      `
      container.appendChild(indicatorsSection)
    }

    // 交易建议卡片 - 确保始终创建并保留该部分
    if (analysisData.value?.trading_advice) {
      const advice = analysisData.value.trading_advice
      const adviceSection = document.createElement('div')
      adviceSection.style.margin = '20px 0 0 0'
      adviceSection.style.padding = '16px'
      adviceSection.style.background = 'rgba(31,41,55,0.3)'
      adviceSection.style.border = '1px solid #374151'
      adviceSection.style.borderRadius = '12px'
      adviceSection.style.boxShadow = '0 1px 4px 0 #0001'
      adviceSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">Trading Advice</div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
          <div><span style='color:#9ca3af'>Action:</span> <span style='font-weight:500;'>${advice.action}</span></div>
          <div><span style='color:#9ca3af'>Entry Price:</span> ${formatPrice(advice.entry_price)}</div>
          <div><span style='color:#9ca3af'>Stop Loss:</span> <span style='color:#ef4444'>${formatPrice(advice.stop_loss)}</span></div>
          <div><span style='color:#9ca3af'>Take Profit:</span> <span style='color:#4ade80'>${formatPrice(advice.take_profit)}</span></div>
          <div><span style='color:#9ca3af'>Reason:</span> ${advice.reason}</div>
        </div>
      `
      container.appendChild(adviceSection)
    }

    // 风险评估卡片 - 确保始终创建并保留该部分
    if (analysisData.value?.risk_assessment) {
      const risk = analysisData.value.risk_assessment
      const riskSection = document.createElement('div')
      riskSection.style.margin = '20px 0 0 0'
      riskSection.style.padding = '16px'
      riskSection.style.background = 'rgba(31,41,55,0.3)'
      riskSection.style.border = '1px solid #374151'
      riskSection.style.borderRadius = '12px'
      riskSection.style.boxShadow = '0 1px 4px 0 #0001'
      riskSection.innerHTML = `
        <div style="font-size: 16px; font-weight: 500; margin-bottom: 10px;">${t('analysis.risk_assessment').replace('analysis.risk_assessment', '风险评估')}</div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
          <div><span style='color:#9ca3af'>${t('analysis.risk_level').replace('analysis.risk_level', '风险等级')}:</span> <span style='font-weight:500;'>${risk.level}</span></div>
          <div><span style='color:#9ca3af'>${t('analysis.risk_score').replace('analysis.risk_score', '风险分数')}:</span> ${risk.score}/100</div>
          ${risk.details && risk.details.length > 0 ? `<div><span style='color:#9ca3af'>${t('analysis.risk_factors').replace('analysis.risk_factors', '风险因素')}:</span><ul style='margin:0 0 0 18px;padding:0;color:#d1d5db;'>${risk.details.map((d:any) => `<li>${d}</li>`).join('')}</ul></div>` : ''}
        </div>
      `
      container.appendChild(riskSection)
    }

    // 二维码卡片（居中+描述+网址）
    const qrDiv = document.createElement('div')
    qrDiv.style.textAlign = 'center'
    qrDiv.style.margin = '32px 0 0 0'
    qrDiv.style.padding = '16px 0 0 0'
    qrDiv.style.display = 'flex'
    qrDiv.style.flexDirection = 'column'
    qrDiv.style.alignItems = 'center'

    // Get current language, default to English
    const lang = (localStorage.getItem('language') || 'en-US').toLowerCase()
    let appDesc = ''
    switch (lang) {
      case 'ja-jp':
        appDesc = 'スマートな暗号資産分析と取引意思決定プラットフォーム。市場トレンドを効率的に洞察し、科学的な取引戦略をサポートします。'
        break
      case 'ko-kr':
        appDesc = '스마트 암호화폐 분석 및 트레이딩 의사결정 플랫폼, 시장 트렌드를 효율적으로 파악하고 과학적인 전략 수립을 지원합니다.'
        break
      default:
        appDesc = 'Smart crypto market analysis and trading decision platform. Efficiently gain market insights and make scientific trading strategies.'
    }

    qrDiv.innerHTML = `
      <div style="margin-bottom: 8px; font-size: 15px; color: #38bdf8; font-weight: 600;">Cooltrade</div>
      <div style="margin-bottom: 10px; font-size: 13px; color: #9ca3af; max-width: 320px;">
        ${appDesc}
      </div>
    `
    const qrCanvas = document.createElement('canvas')
    qrDiv.appendChild(qrCanvas)
    const urlDiv = document.createElement('div')
    urlDiv.style.marginTop = '10px'
    urlDiv.style.fontSize = '14px'
    urlDiv.style.color = '#60a5fa'
    urlDiv.style.fontWeight = 'bold'
    urlDiv.innerText = 'www.cooltrade.xyz'
    qrDiv.appendChild(urlDiv)
    container.appendChild(qrDiv)

    // 1. 先插入到页面
    document.body.appendChild(container)

    // 2. 生成二维码
    await QRCode.toCanvas(qrCanvas, 'https://www.cooltrade.xyz', { width: 100, margin: 1 })

    // 3. 生成图片
    const canvas = await html2canvas(container, {
      backgroundColor: '#0F172A',
      scale: 2,
      logging: false,
      width: 375,
      height: container.offsetHeight,
      onclone: function(clonedDoc) {
        // 确保克隆文档中的所有内容都已完全渲染
        const clonedContainer = clonedDoc.body.querySelector('div')
        if (clonedContainer) {
          // 强制计算样式和布局
          window.getComputedStyle(clonedContainer).getPropertyValue('height')
        }
      }
    })

    // 4. 移除临时节点
    document.body.removeChild(container)

    // 5. 下载图片
    const link = document.createElement('a')
    const safeSymbolForFilename = currentSymbol.value || 'CRYPTO'
    link.download = `${safeSymbolForFilename}_market_analysis.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('保存图片失败:', error)
    // 显示错误提示
    ElMessage({
      message: '保存图片失败，请重试',
      type: 'error'
    })
  }
}

// 获取图标背景色
const getIndicatorBgColor = (trend?: string) => {
  if (trend === 'bullish' || trend === '看涨' || trend === '支持当前趋势') {
    return 'rgba(16,185,129,0.12)';
  }
  if (trend === 'bearish' || trend === '看跌' || trend === '反对当前趋势') {
    return 'rgba(239,68,68,0.12)';
  }
  return 'rgba(156,163,175,0.12)'; // 中性
}

type ActionType = 'buy' | 'sell' | 'hold' | 'wait' | string;
type RiskLevelType = 'high' | 'medium' | 'low' | string;
type LangType = 'en-US' | 'ja-JP' | 'ko-KR';

const actionMap: Record<LangType, Record<string, string>> = {
  'en-US': { buy: 'Buy', sell: 'Sell', hold: 'Hold', wait: 'Wait' },
  'ja-JP': { buy: '買い', sell: '売り', hold: 'ホールド', wait: '待機' },
  'ko-KR': { buy: '매수', sell: '매도', hold: '보유', wait: '대기' }
}

const riskLevelMap: Record<LangType, Record<string, string>> = {
  'en-US': { high: 'High', medium: 'Medium', low: 'Low' },
  'ja-JP': { high: '高', medium: '中', low: '低' },
  'ko-KR': { high: '높음', medium: '중간', low: '낮음' }
}

const getLocalizedAction = (action: ActionType, lang: LangType): string => {
  if (!action) return '--'
  const map = actionMap[lang] || actionMap['en-US']
  return map[action.toLowerCase()] || map['wait'] || action
}

const getLocalizedRiskLevel = (level: RiskLevelType, lang: LangType): string => {
  if (!level) return '--'
  const map = riskLevelMap[lang] || riskLevelMap['en-US']
  return map[level.toLowerCase()] || map['medium'] || level
}

const currentLanguage: LangType = (localStorage.getItem('language') as LangType) || 'zh-CN';

// 处理 TokenNotFoundView 刷新成功事件
const handleRefreshSuccess = async () => {
  console.log('TokenNotFoundView 刷新成功，重新加载本地报告数据...')
  isTokenNotFound.value = false
  error.value = null

  // 重新加载本地报告数据，因为新报告已经生成
  await loadAnalysisData(true)

  console.log('handleRefreshSuccess: 数据重新加载完成')
}

// 处理 TokenNotFoundView 刷新错误事件
const handleRefreshError = async (error: any) => {
  console.error('TokenNotFoundView 刷新失败:', error)

  // 尝试重新加载一次本地数据，防止报告其实已经生成
  try {
    await loadAnalysisData(true)
    // 如果加载成功，说明报告已经存在
    if (analysisData.value) {
      isTokenNotFound.value = false
      error.value = null
      console.log('handleRefreshError: 虽然刷新报错，但本地数据加载成功')
    } else {
      // 如果仍然没有数据，保持错误状态
      isTokenNotFound.value = true
      console.log('handleRefreshError: 本地数据仍然不存在')
    }
  } catch (loadError) {
    console.error('handleRefreshError: 重新加载数据也失败:', loadError)
    isTokenNotFound.value = true
  }
  // ElMessage.error(error?.message || '刷新失败')
}

const getIndicatorExplanation = (key: string) => {
  // 使用增强的翻译函数
  const result = t(`indicatorExplanations.${key}`)

  // 如果返回的是键名，说明翻译失败，尝试提供默认值
  if (result === `indicatorExplanations.${key}`) {
    // 提供默认的中文说明
    const defaultExplanations: Record<string, string> = {
      RSI: '相对强弱指数（RSI），用于衡量价格动量和超买超卖状态。',
      BIAS: '乖离率，衡量价格偏离均线的程度。',
      PSY: '心理线指标，反映市场参与者的心理变化。',
      VWAP: '成交量加权平均价，反映市场真实交易价值。',
      FundingRate: '资金费率，反映合约市场多空力量对比。',
      ExchangeNetflow: '交易所净流入，反映资金流向。',
      NUPL: '未实现净盈亏比率，反映市场整体盈亏状况。',
      MayerMultiple: '梅耶倍数，当前价格与200日均线的比值。',
      MACD: '移动平均线收敛散度，用于判断趋势强弱和转折点。',
      BollingerBands: '布林带，用于衡量价格波动性和支撑阻力位。',
      DMI: '动向指标，用于判断趋势方向和强度。'
    }
    return defaultExplanations[key] || key
  }

  return result
}

// 监听 SYMBOL_UPDATED 消息，确保 popup 能及时同步 symbol
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYMBOL_UPDATED' && message.data && message.data.symbol) {
      const newSymbol = message.data.symbol;
      // 验证新的 symbol 是否为有效字符串
      if (newSymbol && typeof newSymbol === 'string') {
        currentSymbol.value = newSymbol;
        loadAnalysisData(); // 无论 symbol 是否变化都强制刷新
      }
    }
    return true;
  });
}

</script>

<style scoped>
/* 淡入淡出过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>