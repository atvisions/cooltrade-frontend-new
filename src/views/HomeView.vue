<template>
  <div class="relative h-[600px] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <!-- 主容器 -->
    <div class="relative max-w-[375px] w-full mx-auto bg-slate-900/95 backdrop-blur-sm h-full shadow-2xl flex flex-col">

      <!-- 新的顶部导航 -->
      <MarketHeader
        v-model="currentMarketType"
        @change="handleMarketTypeChange"
        @search-click="togglePanel('search')"
        :is-search-active="activePanel === 'search'"
      />

      <!-- 主要内容区域 - 固定高度，内容滚动 -->
      <main class="flex-1 pt-16 pb-16 overflow-y-auto max-w-[375px] w-full mx-auto" v-if="currentMarketType !== 'china'">
        <div class="px-4 space-y-4 w-full">

          <!-- 骨架屏 - 在加载过程中显示，但不包括TokenNotFound状态 -->
          <div v-if="(loading || analysisLoading) && !isTokenNotFound">
            <!-- 调试信息 -->
            <div class="mb-4 p-2 bg-blue-500/20 rounded text-xs text-blue-300">
              DEBUG SKELETON: loading={{ loading }}, analysisLoading={{ analysisLoading }}, isTokenNotFound={{ isTokenNotFound }}
            </div>
            <ChartSkeleton loadingText="Loading price data..." />
          </div>

          <!-- Token未找到状态 - 提高优先级 -->
          <div v-else-if="isTokenNotFound">
            <!-- 调试信息 -->
            <div class="mb-4 p-2 bg-red-500/20 rounded text-xs text-red-300">
              DEBUG TOKEN NOT FOUND: isTokenNotFound={{ isTokenNotFound }}, loading={{ loading }}, analysisLoading={{ analysisLoading }}
            </div>
            <TokenNotFoundView
              :symbol="currentSymbol"
              :marketType="currentMarketType"
              @refresh-success="handleRefreshSuccess"
              @refresh-error="handleRefreshError"
            />
          </div>

          <!-- 正常内容 - 有数据时显示 -->
          <div v-else-if="analysisData" class="space-y-6 pb-10">

            <!-- 资产信息卡片 - 现代化设计 -->
            <div class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/40 hover:border-slate-600/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
              <!-- 动态背景光效 -->
              <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div class="relative p-4">
                <!-- 顶部区域：标题和导航 -->
                <div class="flex items-center justify-between mb-3">
                  <!-- 左侧：资产信息 -->
                  <div class="flex items-center space-x-3">
                    <!-- 市场指示器 -->
                    <div class="w-3 h-3 rounded-full"
                         :class="{
                           'bg-gradient-to-r from-orange-400 to-yellow-400': currentMarketType === 'crypto',
                           'bg-gradient-to-r from-green-400 to-emerald-400': currentMarketType === 'stock',
                           'bg-gradient-to-r from-red-400 to-pink-400': (currentMarketType as string) === 'china'
                         }">
                    </div>

                    <!-- 标题 -->
                    <h1 class="text-lg font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                      {{ currentSymbol ? getDisplayTitle() : t('common.loading') }}
                    </h1>

                    <!-- 收藏按钮 -->
                    <FavoriteButton
                      v-if="currentSymbol"
                      :symbol="currentSymbol"
                      :market-type="currentMarketType"
                      @favorite-changed="handleFavoriteChanged"
                      class="scale-110 hover:scale-125 transition-transform duration-300"
                    />
                  </div>

                  <!-- 右侧：导航按钮 -->
                  <div class="flex items-center space-x-2">
                    <button
                      @click="togglePanel('favorites')"
                      class="group/btn relative p-2 rounded-xl border transition-all duration-300 hover:scale-110 hover:rotate-3"
                      :class="{
                        'bg-yellow-500/20 border-yellow-400/60 text-yellow-300 shadow-lg shadow-yellow-500/20': activePanel === 'favorites',
                        'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:border-yellow-400/50': activePanel !== 'favorites'
                      }"
                      :title="t('common.my_favorites')"
                    >
                      <i class="ri-bookmark-line text-sm transition-transform duration-200 group-hover/btn:scale-110"></i>
                    </button>

                    <button
                      v-if="(currentMarketType as string) !== 'china'"
                      @click="togglePanel('popular')"
                      class="group/btn relative p-2 rounded-xl border transition-all duration-300 hover:scale-110 hover:rotate-3"
                      :class="{
                        'bg-green-500/20 border-green-400/60 text-green-300 shadow-lg shadow-green-500/20': activePanel === 'popular',
                        'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400 hover:border-green-400/50': activePanel !== 'popular'
                      }"
                      :title="currentMarketType === 'crypto' ? t('common.popular_tokens') : t('common.popular_stocks')"
                    >
                      <i class="ri-fire-line text-sm transition-transform duration-200 group-hover/btn:scale-110"></i>
                    </button>
                  </div>
                </div>

                <!-- 价格区域 -->
                <div class="mb-3">
                  <!-- 快照标签 -->
                  <div class="flex items-center space-x-2 mb-2">
                    <i class="ri-camera-line text-blue-400 text-sm"></i>
                    <span class="text-blue-300 text-xs font-medium uppercase tracking-wide">{{ t('analysis.snapshot_price') }}</span>
                  </div>

                  <!-- 价格显示 -->
                  <div class="flex items-baseline space-x-3">
                    <span class="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent tracking-tight">
                      {{ formatPrice(analysisData?.current_price) }}
                    </span>
                    <span class="text-sm text-slate-400 uppercase font-medium tracking-wider">{{ currentMarketType === 'crypto' ? 'USD' : 'USD' }}</span>
                  </div>
                </div>

                <!-- 底部操作区域 -->
                <div class="flex items-center justify-between pt-2 border-t border-slate-700/30">
                  <!-- 时间信息 -->
                  <div class="flex items-center text-xs text-slate-400">
                    <i class="ri-time-line mr-2 text-blue-400/60"></i>
                    <span>{{ formatTime(analysisData?.last_update_time) }}</span>
                  </div>

                  <!-- 操作按钮组 -->
                  <div class="flex items-center space-x-2">
                    <!-- 刷新按钮 -->
                    <el-tooltip :content="!canRefreshReport ? t('analysis.refresh_report_too_soon') : t('analysis.refresh_report')" placement="top">
                      <button
                        @click="canRefreshReport && handleRefreshReport()"
                        :disabled="!canRefreshReport || isRefreshing"
                        class="group/refresh relative p-2 rounded-xl transition-all duration-300 hover:scale-110"
                        :class="canRefreshReport
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/40 hover:border-green-400/60 hover:shadow-lg hover:shadow-green-500/20'
                          : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-700/30'"
                      >
                        <i class="ri-refresh-line text-sm transition-transform duration-300 group-hover/refresh:rotate-180" :class="{ 'animate-spin': isRefreshing }"></i>
                      </button>
                    </el-tooltip>

                    <!-- 分享到Twitter -->
                    <el-tooltip :content="t('analysis.share_to_twitter')" placement="top">
                      <button
                        @click="shareToTwitter"
                        class="group/share relative p-2 rounded-xl transition-all duration-300 hover:scale-110 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/40 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/20"
                      >
                        <i class="ri-twitter-fill text-sm transition-transform duration-200 group-hover/share:scale-110"></i>
                      </button>
                    </el-tooltip>

                    <!-- 保存图片 -->
                    <el-tooltip :content="t('analysis.save_image')" placement="top">
                      <button
                        @click="saveChartImage"
                        class="group/save relative p-2 rounded-xl transition-all duration-300 hover:scale-110 bg-slate-600/15 text-slate-400 hover:bg-slate-600/25 border border-slate-600/40 hover:border-slate-500/60 hover:shadow-lg hover:shadow-slate-500/20"
                      >
                        <i class="ri-image-line text-sm transition-transform duration-200 group-hover/save:scale-110"></i>
                      </button>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>



      <!-- A股开发中页面 -->
      <main class="flex-1 pt-16 pb-16 overflow-y-auto max-w-[375px] w-full mx-auto" v-if="(currentMarketType as string) === 'china'">
        <div class="px-4 w-full">
          <div class="flex items-center justify-center h-full">
            <div class="text-center space-y-6">
              <div class="w-20 h-20 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center">
                <i class="ri-tools-line text-3xl text-orange-400"></i>
              </div>
              <div class="space-y-3">
                <h3 class="text-lg font-bold text-white">A股市场</h3>
                <p class="text-slate-400 text-sm leading-relaxed">该功能正在开发中，敬请期待</p>
              </div>
              <div class="inline-flex items-center px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40">
                <i class="ri-time-line mr-2 text-orange-400"></i>
                <span class="text-orange-400 text-sm font-medium">{{ t('common.coming_soon') }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

            <!-- 覆盖面板区域 - 与价格卡片对齐 -->
            <div v-if="activePanel" class="absolute top-0 left-0 right-0 z-50 px-4 pt-12">
              <!-- 搜索面板 -->
              <div v-if="activePanel === 'search'"
                   class="w-full max-w-[375px] mx-auto bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 rounded-3xl border border-blue-500/40 backdrop-blur-xl shadow-2xl shadow-blue-500/10"
                   @click.stop>
                <!-- 搜索表单区域 - 现代化设计 -->
                <div class="p-5">
                  <!-- 搜索输入框 -->
                  <div class="relative mb-4">
                    <div class="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <i class="ri-search-line text-blue-400/60"></i>
                    </div>
                    <input
                      v-model="searchQuery"
                      @input="handleSearch"
                      @click.stop
                      type="text"
                      :placeholder="currentMarketType === 'crypto' ? t('common.search_crypto_placeholder') : t('common.search_stock_placeholder')"
                      class="w-full pl-10 pr-4 py-3 bg-slate-700/30 border border-slate-600/30 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/60 focus:bg-slate-700/50 transition-all duration-300 text-sm backdrop-blur-sm"
                    />
                  </div>

                  <!-- 搜索结果 -->
                  <div v-if="searchLoading" class="flex items-center justify-center py-2 text-slate-400">
                    <i class="ri-loader-4-line animate-spin text-sm mr-2"></i>
                    <span class="text-xs">{{ t('search.searching') }}</span>
                  </div>
                  <div v-else-if="searchQuery && searchResults.length === 0" class="text-center py-2 text-slate-400">
                    <div class="text-xs">{{ t('search.no_results') }}</div>
                  </div>
                  <div v-else-if="searchResults.length > 0" class="max-h-20 overflow-y-auto space-y-1">
                    <button
                      v-for="result in searchResults"
                      :key="result.symbol"
                      @click="handleAssetSwitch(result.symbol)"
                      class="w-full text-left p-2 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg border border-slate-600/30 hover:border-slate-500 transition-all"
                    >
                      <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 rounded flex items-center justify-center"
                             :class="{
                               'bg-blue-500/20 text-blue-400': result.market_type === 'crypto',
                               'bg-green-500/20 text-green-400': result.market_type === 'stock'
                             }">
                          <i :class="{
                               'ri-currency-line': result.market_type === 'crypto',
                               'ri-line-chart-line': result.market_type === 'stock'
                             }" class="text-xs"></i>
                        </div>
                        <div class="flex-1">
                          <div class="font-medium text-white text-xs">{{ result.symbol }}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- 热门搜索区域 -->
                <div v-if="!searchQuery" class="border-t border-slate-700/30 p-5">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium text-slate-300">{{ t('search.popular_searches') }}</span>
                    </div>
                    <i class="ri-fire-line text-sm text-orange-400"></i>
                  </div>
                  <div class="grid grid-cols-4 gap-3">
                    <button
                      v-for="asset in getPopularSearches()"
                      :key="asset.symbol"
                      @click="handleAssetSwitch(asset.symbol)"
                      class="group relative p-3 rounded-2xl bg-gradient-to-br from-slate-700/30 to-slate-800/30 hover:from-slate-600/40 hover:to-slate-700/40 border border-slate-600/30 hover:border-slate-500/60 transition-all duration-300 text-center hover:scale-105 hover:shadow-lg"
                    >
                      <div class="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors duration-200">{{ asset.display }}</div>
                      <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 收藏面板 -->
              <div v-if="activePanel === 'favorites'"
                   class="w-full max-w-[375px] mx-auto bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 rounded-3xl border border-yellow-500/40 backdrop-blur-xl shadow-2xl shadow-yellow-500/10 min-h-[120px]"
                   @click.stop>
                <!-- 基础信息区域 - 现代化设计 -->
                <div class="p-5">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                      <i class="ri-bookmark-fill text-lg text-yellow-400"></i>
                      <h3 class="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{{ t('favorites.title') }}</h3>
                    </div>
                    <div v-if="favoriteAssets.length > 0" class="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                      <span class="text-xs text-yellow-300 font-medium">{{ favoriteAssets.length }} {{ t('common.items') }}</span>
                    </div>
                  </div>

                  <!-- 加载状态 -->
                  <div v-if="favoritesLoading" class="flex items-center justify-center py-4 text-slate-400">
                    <i class="ri-loader-4-line animate-spin text-sm mr-2"></i>
                    <span class="text-xs">{{ t('common.loading') }}</span>
                  </div>

                  <!-- 空状态 -->
                  <div v-else-if="favoriteAssets.length === 0" class="text-center py-4 text-slate-400">
                    <i class="ri-bookmark-line text-lg mb-2 opacity-50"></i>
                    <div class="text-xs">{{ t('favorites.empty') }}</div>
                  </div>

                  <!-- 有收藏数据时显示前几个 -->
                  <div v-else-if="favoriteAssets.length <= 4" class="grid grid-cols-2 gap-2">
                    <div
                      v-for="asset in favoriteAssets"
                      :key="`${asset.symbol}-${asset.market_type}`"
                      class="group relative flex items-center p-2 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg border border-slate-600/30 hover:border-yellow-500/40 transition-all duration-200 cursor-pointer"
                      @click="handleAssetSwitch(asset.symbol)"
                    >
                      <!-- 当前选中指示器 -->
                      <div v-if="asset.symbol === currentSymbol" class="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>

                      <!-- 市场类型图标 -->
                      <div class="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center mr-2"
                           :class="{
                             'bg-blue-500/20 text-blue-400': asset.market_type === 'crypto',
                             'bg-green-500/20 text-green-400': asset.market_type === 'stock'
                           }">
                        <i :class="{
                             'ri-currency-line': asset.market_type === 'crypto',
                             'ri-line-chart-line': asset.market_type === 'stock'
                           }" class="text-xs"></i>
                      </div>

                      <!-- 资产信息 -->
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-white text-xs">{{ formatDisplaySymbol(asset.symbol, asset.market_type) }}</div>
                      </div>

                      <!-- 删除按钮 - 始终可见 -->
                      <button
                        @click.stop="removeFavorite(asset.symbol, asset.market_type)"
                        class="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all duration-200"
                        :title="t('favorites.remove')"
                      >
                        <i class="ri-close-line text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <!-- 收藏数量较多时显示部分 -->
                  <div v-else class="space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                      <div
                        v-for="asset in favoriteAssets.slice(0, 4)"
                        :key="`${asset.symbol}-${asset.market_type}`"
                        class="group relative flex items-center p-2 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg border border-slate-600/30 hover:border-yellow-500/40 transition-all duration-200 cursor-pointer"
                        @click="handleAssetSwitch(asset.symbol)"
                      >
                        <div v-if="asset.symbol === currentSymbol" class="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                        <div class="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center mr-2"
                             :class="{
                               'bg-blue-500/20 text-blue-400': asset.market_type === 'crypto',
                               'bg-green-500/20 text-green-400': asset.market_type === 'stock'
                             }">
                          <i :class="{
                               'ri-currency-line': asset.market_type === 'crypto',
                               'ri-line-chart-line': asset.market_type === 'stock'
                             }" class="text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-white text-xs">{{ formatDisplaySymbol(asset.symbol, asset.market_type) }}</div>
                        </div>
                        <button
                          @click.stop="removeFavorite(asset.symbol, asset.market_type)"
                          class="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all duration-200"
                          :title="t('favorites.remove')"
                        >
                          <i class="ri-close-line text-xs"></i>
                        </button>
                      </div>
                    </div>
                    <div v-if="favoriteAssets.length > 4" class="text-center">
                      <span class="text-xs text-slate-400">+{{ favoriteAssets.length - 4 }} {{ t('common.more') }}</span>
                    </div>
                  </div>
                </div>

                <!-- 扩展区域 - 当收藏数量多时显示 -->
                <div v-if="favoriteAssets.length > 4" class="border-t border-slate-700/50 p-4">
                  <div class="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    <div
                      v-for="asset in favoriteAssets.slice(4)"
                      :key="`${asset.symbol}-${asset.market_type}-extended`"
                      class="group relative flex items-center p-2 bg-slate-700/30 hover:bg-slate-600/40 rounded-lg border border-slate-600/30 hover:border-yellow-500/40 transition-all duration-200 cursor-pointer"
                      @click="handleAssetSwitch(asset.symbol)"
                    >
                      <div v-if="asset.symbol === currentSymbol" class="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                      <div class="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center mr-2"
                           :class="{
                             'bg-blue-500/20 text-blue-400': asset.market_type === 'crypto',
                             'bg-green-500/20 text-green-400': asset.market_type === 'stock'
                           }">
                        <i :class="{
                             'ri-currency-line': asset.market_type === 'crypto',
                             'ri-line-chart-line': asset.market_type === 'stock'
                           }" class="text-xs"></i>
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-white text-xs">{{ formatDisplaySymbol(asset.symbol, asset.market_type) }}</div>
                      </div>
                      <button
                        @click.stop="removeFavorite(asset.symbol, asset.market_type)"
                        class="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 flex items-center justify-center transition-all duration-200"
                        :title="t('favorites.remove')"
                      >
                        <i class="ri-close-line text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 热门资产面板 -->
              <div v-if="activePanel === 'popular'"
                   class="w-full max-w-[375px] mx-auto bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-slate-800/95 rounded-3xl border border-green-500/40 backdrop-blur-xl shadow-2xl shadow-green-500/10 p-5"
                   @click.stop>
                <h3 class="text-base font-semibold text-green-400 mb-4 flex items-center">
                  <i class="ri-fire-line mr-2"></i>
                  {{ currentMarketType === 'crypto' ? t('common.popular_tokens') : t('common.popular_stocks') }}
                </h3>
                <div class="grid grid-cols-4 gap-3">
                  <button
                    v-for="asset in currentPopularAssets"
                    :key="asset.symbol"
                    @click="handleAssetSwitch(asset.symbol)"
                    :disabled="analysisLoading || asset.symbol === currentSymbol"
                    class="group relative p-3 rounded-lg border transition-all duration-300 hover:scale-105"
                    :class="{
                      'bg-blue-500/20 border-blue-400/50 text-blue-300 shadow-lg shadow-blue-500/20': asset.symbol === currentSymbol,
                      'bg-slate-700/40 border-slate-600/50 text-slate-300 hover:bg-slate-600/50 hover:border-slate-500/60': asset.symbol !== currentSymbol && !analysisLoading,
                      'bg-slate-800/30 border-slate-700/30 text-slate-500 cursor-not-allowed': analysisLoading
                    }"
                  >
                    <div class="text-sm font-bold text-center">{{ asset.display }}</div>
                    <div
                      v-if="asset.symbol === currentSymbol"
                      class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full border border-slate-800"
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            <!-- 点击遮罩关闭面板 -->
            <div v-if="activePanel"
                 @click="activePanel = null"
                 class="fixed inset-0 z-40 bg-black/20"></div>

            <!-- 趋势分析卡片 -->
            <div v-if="analysisData?.trend_analysis?.probabilities">
              <h3 class="text-lg font-bold text-white mb-5 flex items-center">
                <div class="w-1 h-6 bg-gradient-to-b from-emerald-400 to-red-400 rounded-full mr-3"></div>
                {{ t('analysis.trend_analysis') }}
              </h3>
              <div class="grid grid-cols-3 gap-4">
                <!-- 上涨趋势 -->
                <div class="group p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 border border-emerald-500/30 hover:border-emerald-400/50 text-center space-y-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20">
                  <div class="w-10 h-10 mx-auto bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <i class="ri-arrow-up-line text-emerald-400 text-lg"></i>
                  </div>
                  <div class="text-2xl font-bold text-emerald-400">{{ formatPercent(analysisData?.trend_analysis?.probabilities?.up) }}</div>
                  <div class="text-sm text-emerald-300 font-medium">{{ t('analysis.uptrend') }}</div>
                </div>

                <!-- 横盘趋势 -->
                <div class="group p-5 rounded-2xl bg-gradient-to-br from-slate-500/15 to-slate-600/10 border border-slate-500/30 hover:border-slate-400/50 text-center space-y-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/20">
                  <div class="w-10 h-10 mx-auto bg-slate-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <i class="ri-subtract-line text-slate-400 text-lg"></i>
                  </div>
                  <div class="text-2xl font-bold text-slate-300">{{ formatPercent(analysisData?.trend_analysis?.probabilities?.sideways) }}</div>
                  <div class="text-sm text-slate-400 font-medium">{{ t('analysis.sideways') }}</div>
                </div>

                <!-- 下跌趋势 -->
                <div class="group p-5 rounded-2xl bg-gradient-to-br from-red-500/15 to-red-600/10 border border-red-500/30 hover:border-red-400/50 text-center space-y-3 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20">
                  <div class="w-10 h-10 mx-auto bg-red-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <i class="ri-arrow-down-line text-red-400 text-lg"></i>
                  </div>
                  <div class="text-2xl font-bold text-red-400">{{ formatPercent(analysisData?.trend_analysis?.probabilities?.down) }}</div>
                  <div class="text-sm text-red-300 font-medium">{{ t('analysis.downtrend') }}</div>
                </div>
              </div>
            </div>

            <!-- 市场趋势分析 -->
            <div v-if="analysisData?.trend_analysis?.summary">
              <h3 class="text-lg font-bold text-white mb-5 flex items-center">
                <div class="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
                {{ t('analysis.market_trend_analysis') }}
              </h3>
              <div class="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <i class="ri-line-chart-line text-blue-400 text-lg"></i>
                  </div>
                  <div class="flex-1">
                    <p class="text-base text-slate-200 leading-relaxed">
                      <span v-if="loadingTranslation" class="text-slate-400">翻译中...</span>
                      <span v-else>{{ translatedSummary }}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 技术指标分析 -->
            <div v-if="analysisData?.indicators_analysis">
              <h3 class="text-lg font-bold text-white mb-5 flex items-center">
                <div class="w-1 h-6 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full mr-3"></div>
                {{ t('analysis.technical_indicators') }}
              </h3>

              <!-- 单参数指标网格 -->
              <div class="grid grid-cols-2 gap-4 mb-6">
                <template v-for="(indicator, key) in analysisData?.indicators_analysis" :key="key">
                  <div v-if="!['MACD','BollingerBands','DMI'].includes(key) && shouldShowIndicator(key)" class="group p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-slate-500/10">
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex items-center space-x-2 flex-1 min-w-0">
                        <span class="text-sm font-semibold text-slate-300 truncate">{{ getIndicatorDisplayName(key) }}</span>
                        <el-tooltip :content="getIndicatorExplanation(key)" placement="top">
                          <i class="ri-question-line text-slate-500 cursor-help text-sm flex-shrink-0 hover:text-slate-400 transition-colors"></i>
                        </el-tooltip>
                      </div>
                      <div
                        class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 group-hover:scale-110 transition-transform duration-200"
                        :class="getIndicatorClass(indicator.support_trend)"
                        :style="`background:${getIndicatorBgColor(indicator.support_trend)}`"
                      >
                        <i :class="getTrendIconClass(indicator.support_trend)" class="text-sm"></i>
                      </div>
                    </div>
                    <div class="text-lg font-bold text-white">
                      {{ typeof indicator.value === 'number' ? indicator.value.toFixed(2) : indicator.value }}
                    </div>
                  </div>
                </template>
              </div>
              <!-- 复杂指标 -->
              <div class="space-y-6">
                <template v-for="key in ['MACD','BollingerBands','DMI']" :key="key">
                  <div v-if="analysisData?.indicators_analysis && (analysisData.indicators_analysis as any)[key]" class="group p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/10">
                    <div class="flex items-center justify-between mb-5">
                      <div class="flex items-center space-x-3">
                        <span class="text-lg font-bold text-white">{{ key }}</span>
                        <el-tooltip :content="getIndicatorExplanation(key)" placement="top">
                          <i class="ri-question-line text-slate-500 cursor-help text-base hover:text-slate-400 transition-colors"></i>
                        </el-tooltip>
                      </div>
                      <div
                        class="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                        :class="getIndicatorClass((analysisData.indicators_analysis as any)[key].support_trend)"
                        :style="`background:${getIndicatorBgColor((analysisData.indicators_analysis as any)[key].support_trend)}`"
                      >
                        <i :class="getTrendIconClass((analysisData.indicators_analysis as any)[key].support_trend)" class="text-base"></i>
                      </div>
                    </div>

                    <div :class="key === 'DMI' && currentMarketType === 'stock' ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-4'">
                      <!-- MACD -->
                      <template v-if="key === 'MACD'">
                        <div class="group/item text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-blue-300 font-semibold mb-2">Histogram</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'histogram' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.histogram === 'number' ? (analysisData.indicators_analysis as any)[key].value.histogram.toFixed(2) : '--' }}</div>
                        </div>
                        <div class="group/item text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-blue-300 font-semibold mb-2">MACD Line</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'line' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.line === 'number' ? (analysisData.indicators_analysis as any)[key].value.line.toFixed(2) : '--' }}</div>
                        </div>
                        <div class="group/item text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-blue-300 font-semibold mb-2">Signal Line</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'signal' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.signal === 'number' ? (analysisData.indicators_analysis as any)[key].value.signal.toFixed(2) : '--' }}</div>
                        </div>
                      </template>
                      <!-- Bollinger Bands -->
                      <template v-else-if="key === 'BollingerBands'">
                        <div class="group/item text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-red-300 font-semibold mb-2">Upper Band</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'upper' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.upper === 'number' ? (analysisData.indicators_analysis as any)[key].value.upper.toFixed(2) : '--' }}</div>
                        </div>
                        <div class="group/item text-center p-4 rounded-xl bg-slate-500/10 border border-slate-500/30 hover:border-slate-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-slate-300 font-semibold mb-2">Middle Band</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'middle' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.middle === 'number' ? (analysisData.indicators_analysis as any)[key].value.middle.toFixed(2) : '--' }}</div>
                        </div>
                        <div class="group/item text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-emerald-300 font-semibold mb-2">Lower Band</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'lower' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.lower === 'number' ? (analysisData.indicators_analysis as any)[key].value.lower.toFixed(2) : '--' }}</div>
                        </div>
                      </template>
                      <!-- DMI -->
                      <template v-else-if="key === 'DMI'">
                        <div class="group/item text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-emerald-300 font-semibold mb-2">+DI</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'plus_di' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.plus_di === 'number' ? (analysisData.indicators_analysis as any)[key].value.plus_di.toFixed(2) : '--' }}</div>
                        </div>
                        <div class="group/item text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-red-300 font-semibold mb-2">-DI</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'minus_di' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.minus_di === 'number' ? (analysisData.indicators_analysis as any)[key].value.minus_di.toFixed(2) : '--' }}</div>
                        </div>
                        <!-- 只在加密货币市场显示ADX -->
                        <div v-if="currentMarketType === 'crypto'" class="group/item text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105">
                          <div class="text-sm text-blue-300 font-semibold mb-2">ADX</div>
                          <div class="text-base font-bold text-white">{{ typeof (analysisData.indicators_analysis as any)[key].value === 'object' && (analysisData.indicators_analysis as any)[key].value && 'adx' in (analysisData.indicators_analysis as any)[key].value && typeof (analysisData.indicators_analysis as any)[key].value.adx === 'number' ? (analysisData.indicators_analysis as any)[key].value.adx.toFixed(2) : '--' }}</div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- 交易建议 -->
            <div v-if="analysisData?.trading_advice">
              <h3 class="text-lg font-bold text-white mb-5 flex items-center">
                <div class="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-400 rounded-full mr-3"></div>
                {{ t('analysis.trading_advice') }}
              </h3>
              <div class="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 space-y-5">

                <!-- 推荐操作 -->
                <div class="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/40 transition-colors duration-200">
                  <div class="text-base font-semibold text-slate-300">{{ t('analysis.recommended_action') }}</div>
                  <div class="px-4 py-2 rounded-xl text-base font-bold transition-all duration-200 hover:scale-105"
                    :class="analysisData.trading_advice.action === '买入' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30' :
                            analysisData.trading_advice.action === '卖出' ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30' :
                            'bg-slate-500/20 text-slate-400 border border-slate-500/40 hover:bg-slate-500/30'">
                    {{ getLocalizedAction(analysisData.trading_advice.action, currentLanguage) }}
                  </div>
                </div>

                <!-- 价格信息 -->
                <div class="grid grid-cols-3 gap-4">
                  <div class="group/price text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:scale-105">
                    <div class="text-sm text-blue-300 font-semibold mb-2">{{ t('analysis.entry_price') }}</div>
                    <div class="text-base font-bold text-white">{{ formatPrice(analysisData.trading_advice.entry_price) }}</div>
                  </div>
                  <div class="group/price text-center p-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 hover:scale-105">
                    <div class="text-sm text-red-300 font-semibold mb-2">{{ t('analysis.stop_loss') }}</div>
                    <div class="text-base font-bold text-red-400">{{ formatPrice(analysisData.trading_advice.stop_loss) }}</div>
                  </div>
                  <div class="group/price text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-200 hover:scale-105">
                    <div class="text-sm text-emerald-300 font-semibold mb-2">{{ t('analysis.take_profit') }}</div>
                    <div class="text-base font-bold text-emerald-400">{{ formatPrice(analysisData.trading_advice.take_profit) }}</div>
                  </div>
                </div>

                <!-- 理由说明 -->
                <div class="p-5 rounded-xl bg-slate-700/20 border border-slate-600/30 hover:border-slate-600/40 transition-colors duration-200">
                  <div class="flex items-start space-x-4">
                    <div class="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <i class="ri-lightbulb-line text-amber-400 text-base"></i>
                    </div>
                    <div class="flex-1">
                      <div class="text-base font-semibold text-slate-300 mb-3">{{ t('analysis.reason') }}</div>
                      <div class="text-base text-slate-200 leading-relaxed">
                        <span v-if="loadingReasonTranslation" class="text-slate-400">翻译中...</span>
                        <span v-else>{{ translatedReason || analysisData.trading_advice.reason }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 风险评估 -->
            <div v-if="analysisData?.risk_assessment">
              <h3 class="text-lg font-bold text-white mb-5 flex items-center">
                <div class="w-1 h-6 bg-gradient-to-b from-red-400 to-orange-400 rounded-full mr-3"></div>
                {{ t('analysis.risk_assessment') }}
              </h3>
              <div class="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 space-y-5">

                <!-- 风险等级 -->
                <div class="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/40 transition-colors duration-200">
                  <div class="text-base font-semibold text-slate-300">{{ t('analysis.risk_level') }}</div>
                  <div class="px-4 py-2 rounded-xl text-base font-bold transition-all duration-200 hover:scale-105"
                    :class="{
                      'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30': analysisData.risk_assessment.level === '高',
                      'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30': analysisData.risk_assessment.level === '中',
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30': analysisData.risk_assessment.level === '低'
                    }">
                    {{ getLocalizedRiskLevel(analysisData.risk_assessment.level, currentLanguage) }}
                  </div>
                </div>

                <!-- 风险评分 -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-base font-semibold text-slate-300">{{ t('analysis.risk_score') }}</span>
                    <span class="text-xl font-bold text-white">{{ analysisData.risk_assessment.score }}%</span>
                  </div>
                  <div class="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden shadow-inner">
                    <div class="h-full rounded-full transition-all duration-700 shadow-lg"
                      :class="{
                        'bg-gradient-to-r from-red-500 to-red-400 shadow-red-500/30': analysisData.risk_assessment.score > 70,
                        'bg-gradient-to-r from-amber-500 to-amber-400 shadow-amber-500/30': analysisData.risk_assessment.score > 30 && analysisData.risk_assessment.score <= 70,
                        'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-emerald-500/30': analysisData.risk_assessment.score <= 30
                      }"
                      :style="{ width: `${analysisData.risk_assessment.score}%` }">
                    </div>
                  </div>
                </div>

                <!-- 风险因素 -->
                <div v-if="analysisData.risk_assessment.details && analysisData.risk_assessment.details.length > 0" class="space-y-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <i class="ri-alert-line text-orange-400 text-base"></i>
                    </div>
                    <span class="text-base font-semibold text-slate-300">{{ t('analysis.risk_factors') }}</span>
                  </div>
                  <div class="pl-11 space-y-3">
                    <div v-if="loadingRiskTranslation" class="text-slate-400 text-base">翻译中...</div>
                    <div v-else class="space-y-3">
                      <div v-for="(detail, index) in (translatedRiskFactors.length > 0 ? translatedRiskFactors : analysisData.risk_assessment.details)"
                           :key="index"
                           class="flex items-start space-x-3 text-base text-slate-200 p-3 rounded-lg bg-slate-700/20 hover:bg-slate-700/30 transition-colors duration-200">
                        <div class="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span class="leading-relaxed">{{ detail }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

        <!-- 错误状态 -->
        <template v-else-if="error && !loading && !analysisLoading">
          <main class="flex-1 pt-16 pb-16 overflow-y-auto max-w-[375px] w-full mx-auto">
            <!-- 错误状态卡片 -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/10 via-pink-600/10 to-rose-600/10 p-6 backdrop-blur-sm border border-red-500/20">
              <div class="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-rose-500/5"></div>
              <div class="relative text-center space-y-4">
                <!-- 图标 -->
                <div class="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                  <i class="ri-error-warning-line text-3xl text-red-400"></i>
                </div>

                <!-- 标题 -->
                <h3 class="text-xl font-bold text-white">出现错误</h3>

                <!-- 错误信息 -->
                <div class="space-y-2">
                  <p class="text-slate-300 text-sm">{{ error }}</p>
                  <p class="text-slate-400 text-xs">{{ t('errors.try_reload_or_later') }}</p>
                </div>
              </div>
            </div>

            <!-- 重试按钮卡片 -->
            <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <button
                @click="() => loadAnalysisData()"
                class="w-full px-6 py-3 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] border border-blue-500/30 flex items-center justify-center space-x-2"
              >
                <i class="ri-refresh-line text-lg"></i>
                <span>{{ t('common.retry') }}</span>
              </button>
            </div>
          </main>
        </template>

        <!-- Token未找到状态 -->
        <template v-else-if="isTokenNotFound && !loading && !analysisLoading">
          <main class="flex-1 pt-16 pb-16 overflow-y-auto max-w-[375px] w-full mx-auto">
            <div class="px-4 w-full">
              <!-- 调试信息 -->
              <div class="mb-4 p-2 bg-red-500/20 rounded text-xs text-red-300">
                DEBUG: isTokenNotFound={{ isTokenNotFound }}, loading={{ loading }}, analysisLoading={{ analysisLoading }}, symbol={{ currentSymbol }}
              </div>
              <TokenNotFoundView
                :symbol="currentSymbol"
                :marketType="currentMarketType"
                @refresh-success="handleRefreshSuccess"
                @refresh-error="handleRefreshError"
              />
            </div>
          </main>
        </template>

        <!-- 空状态 -->
        <template v-else-if="!analysisData && !loading && !analysisLoading && !error">
          <main class="flex-1 pt-16 pb-16 overflow-y-auto max-w-[375px] w-full mx-auto">
            <!-- 空状态卡片 -->
            <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600/10 via-gray-600/10 to-zinc-600/10 p-6 backdrop-blur-sm border border-slate-500/20">
              <div class="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-zinc-500/5"></div>
              <div class="relative text-center space-y-4">
                <!-- 图标 -->
                <div class="w-16 h-16 mx-auto bg-slate-500/20 rounded-full flex items-center justify-center">
                  <i class="ri-database-line text-3xl text-slate-400"></i>
                </div>

                <!-- 标题 -->
                <h3 class="text-xl font-bold text-white">暂无数据</h3>

                <!-- 描述 -->
                <p class="text-slate-300 text-sm">{{ t('common.no_data') }}</p>
              </div>
            </div>

            <!-- 加载数据按钮卡片 -->
            <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <button
                @click="() => loadAnalysisData()"
                class="w-full px-6 py-3 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] border border-blue-500/30 flex items-center justify-center space-x-2"
              >
                <i class="ri-download-line text-lg"></i>
                <span>{{ t('common.load_data') }}</span>
              </button>
            </div>
          </main>
        </template>

        <template v-else>
          <main class="flex-1 pt-16 pb-16 overflow-y-auto max-w-[375px] w-full mx-auto">
            <!-- 正常内容 ... -->
          </main>
        </template>

      <!-- 底部导航栏 -->
      <nav class="fixed bottom-0 w-full z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 max-w-[375px] mx-auto">
        <div class="w-full">
          <div class="grid grid-cols-3 h-16">
            <router-link to="/" class="flex flex-col items-center justify-center text-blue-400 border-t-2 border-blue-400">
              <i class="ri-line-chart-line text-lg"></i>
              <span class="text-xs mt-0.5">{{ t('nav.market') }}</span>
            </router-link>
            <router-link to="/points" class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
              <i class="ri-coin-line text-lg"></i>
              <span class="text-xs mt-0.5">{{ t('nav.points') }}</span>
            </router-link>
            <router-link to="/profile" class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 transition-colors">
              <i class="ri-settings-3-line text-lg"></i>
              <span class="text-xs mt-0.5">{{ t('nav.settings') }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- 刷新加载模态框 -->
      <LoadingModal
        v-if="isRefreshing"
        :visible="isRefreshing"
        type="refresh"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, watch, onBeforeUnmount, computed } from 'vue'
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

import { getTechnicalAnalysis, getLatestTechnicalAnalysis, favorites } from '@/api'
import { parseSymbolFromUrl } from '@/utils/trading'
import type {
  FormattedTechnicalAnalysisData
} from '@/types/technical-analysis'
import { formatTechnicalAnalysisData } from '@/utils/data-formatter'
import TokenNotFoundView from '@/components/TokenNotFoundView.vue'
import ChartSkeleton from '@/components/ChartSkeleton.vue'
import MarketHeader from '@/components/MarketHeader.vue'
import FavoriteButton from '@/components/FavoriteButton.vue'
import LoadingModal from '@/components/LoadingModal.vue'
// @ts-ignore
import { googleTranslate } from '@/utils/translate'
import BottomTabBar from '@/components/BottomTabBar.vue'

// Asset interface for search
interface Asset {
  symbol: string
  name: string
  market_type: 'crypto' | 'stock' | 'china'
  exchange?: string
  sector?: string
}





const analysisData = ref<FormattedTechnicalAnalysisData | null>(null)
const loading = ref(false) // 整体加载状态
const analysisLoading = ref(false) // 分析数据加载状态
const error = ref<string | null>(null)

// 市场类型和面板相关状态 - 从localStorage恢复状态
const storedMarketType = localStorage.getItem('currentMarketType') as 'crypto' | 'stock' | 'china'
console.log('[INIT] localStorage中的currentMarketType:', storedMarketType)
const currentMarketType = ref<'crypto' | 'stock' | 'china'>(
  storedMarketType || 'crypto'
)
console.log('[INIT] 初始化后的currentMarketType.value:', currentMarketType.value)

// 从localStorage恢复当前资产，根据市场类型设置默认值
const getDefaultSymbol = (marketType: 'crypto' | 'stock' | 'china') => {
  return marketType === 'crypto' ? 'BTCUSDT' : 'AAPL'
}

// 为每个市场分别保存当前选中的资产
const getCurrentSymbolForMarket = (marketType: 'crypto' | 'stock' | 'china') => {
  const storageKey = `currentSymbol_${marketType}`
  return localStorage.getItem(storageKey) || getDefaultSymbol(marketType)
}

const initialSymbol = getCurrentSymbolForMarket(currentMarketType.value)
console.log('[INIT] 为市场类型', currentMarketType.value, '获取的初始symbol:', initialSymbol)
const currentSymbol = ref<string>(initialSymbol)
const isTokenNotFound = ref(false) // 用于标记代币是否未找到（404错误）
const activePanel = ref<'search' | 'favorites' | 'popular' | null>(null)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const favoriteAssets = ref<any[]>([])
const favoritesLoading = ref(false)

// 兼容旧的状态变量
const showSearchModal = ref(false)
const showFavoritesModal = ref(false)

// 热门代币列表
const popularTokens = ref([
  { symbol: 'BTCUSDT', display: 'BTC' },
  { symbol: 'ETHUSDT', display: 'ETH' },
  { symbol: 'SOLUSDT', display: 'SOL' },
  { symbol: 'BNBUSDT', display: 'BNB' },
  { symbol: 'ADAUSDT', display: 'ADA' },
  { symbol: 'XRPUSDT', display: 'XRP' },
  { symbol: 'DOGEUSDT', display: 'DOGE' },
  { symbol: 'AVAXUSDT', display: 'AVAX' }
])

// 热门股票列表
const popularStocks = ref([
  { symbol: 'AAPL', display: 'AAPL' },
  { symbol: 'MSFT', display: 'MSFT' },
  { symbol: 'GOOGL', display: 'GOOGL' },
  { symbol: 'AMZN', display: 'AMZN' },
  { symbol: 'TSLA', display: 'TSLA' },
  { symbol: 'META', display: 'META' },
  { symbol: 'NVDA', display: 'NVDA' },
  { symbol: 'NFLX', display: 'NFLX' }
])

// 当前热门资产计算属性
const currentPopularAssets = computed(() => {
  if (currentMarketType.value === 'crypto') {
    return popularTokens.value
  } else if (currentMarketType.value === 'stock') {
    return popularStocks.value
  } else {
    // A股暂时返回空数组
    return []
  }
})

// 获取热门搜索数据
const getPopularSearches = () => {
  if (currentMarketType.value === 'crypto') {
    return popularTokens.value.slice(0, 8) // 取前8个
  } else if (currentMarketType.value === 'stock') {
    return popularStocks.value.slice(0, 8) // 取前8个
  } else {
    return []
  }
}

// 市场类型切换处理函数
const handleMarketTypeChange = (marketType: 'crypto' | 'stock' | 'china') => {
  console.log(`切换市场类型从 ${currentMarketType.value} 到 ${marketType}`)

  // 如果是A股市场，显示开发中提示
  if (marketType === 'china') {
    // 这里可以添加提示信息，暂时不切换
    console.log('A股市场正在开发中')
    return
  }

  currentMarketType.value = marketType
  // 保存市场类型到localStorage
  localStorage.setItem('currentMarketType', marketType)

  // 如果收藏面板正在显示，重新加载收藏数据以显示新市场的收藏
  if (activePanel.value === 'favorites') {
    loadFavorites()
  }

  // 恢复该市场之前选中的资产，如果没有则使用默认资产
  const savedSymbol = getCurrentSymbolForMarket(marketType)
  switchToAsset(savedSymbol, marketType)
}

// 资产选择处理函数
const handleAssetSelect = (asset: Asset) => {
  console.log('选择资产:', asset)
  switchToAsset(asset.symbol, asset.market_type)
}

// 统一的资产切换函数
const switchToAsset = async (symbol: string, marketType: 'crypto' | 'stock' | 'china') => {
  if (symbol === currentSymbol.value && marketType === currentMarketType.value) {
    return
  }

  console.log(`切换资产从 ${currentSymbol.value} (${currentMarketType.value}) 到 ${symbol} (${marketType})`)

  // 重置状态
  analysisData.value = null
  error.value = null
  isTokenNotFound.value = false

  // 更新市场类型和资产符号
  currentMarketType.value = marketType
  currentSymbol.value = symbol

  // 保存状态到localStorage
  localStorage.setItem('currentMarketType', marketType)
  // 为每个市场分别保存当前选中的资产
  const storageKey = `currentSymbol_${marketType}`
  localStorage.setItem(storageKey, symbol)

  // 加载新资产的数据
  await loadAnalysisData(true, false)
}

// 切换代币函数 (保持向后兼容)
const switchToToken = async (symbol: string) => {
  switchToAsset(symbol, 'crypto')
}

// 收藏变化处理函数
const handleFavoriteChanged = (isFavorite: boolean) => {
  console.log(`Asset ${currentSymbol.value} favorite status changed to:`, isFavorite)

  // 重新加载收藏列表以反映最新状态
  loadFavorites()

  // 这里可以添加额外的逻辑，比如显示提示消息
}

// 收藏选择处理
const handleFavoriteSelect = (favorite: any) => {
  console.log('选择收藏项:', favorite)
  switchToAsset(favorite.symbol, favorite.market_type)
}

// 收藏移除处理
const handleFavoriteRemoved = (favorite: any) => {
  console.log('移除收藏项:', favorite)
}

// 获取当前交易对
const getCurrentSymbol = async (): Promise<string> => {
  try {
    // 在Chrome扩展环境中，优先检测当前页面的交易对，然后才使用localStorage

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

        if (response && response.symbol && typeof response.symbol === 'string') {
          // 检查返回的symbol是否是默认值，如果是默认值则不使用
          const isDefaultSymbol = response.symbol === 'BTCUSDT' || response.symbol === 'AAPL';

          if (!isDefaultSymbol) {
            return response.symbol;
          }
        }
      } catch (e) {
        console.log('Background script获取失败:', e);
      }
    }

    // fallback: 直接用 window.location (虽然在popup中通常不会有用)
    const parsedSymbol = parseSymbolFromUrl(window.location.href);
    if (parsedSymbol && typeof parsedSymbol === 'string') {
      return parsedSymbol;
    }

    // 最后 fallback - 没有检测到页面交易对，使用localStorage中保存的交易对
    // 直接从localStorage读取市场类型，确保获取正确的保存状态
    const savedMarketType = localStorage.getItem('currentMarketType') as 'crypto' | 'stock' | 'china' || 'crypto';
    const savedSymbol = getCurrentSymbolForMarket(savedMarketType);
    return savedSymbol;
  } catch (error) {
    console.error('获取交易对时发生错误:', error);
    // 确保即使在错误情况下也使用localStorage中保存的交易对
    const savedMarketType = localStorage.getItem('currentMarketType') as 'crypto' | 'stock' | 'china' || 'crypto';
    const savedSymbol = getCurrentSymbolForMarket(savedMarketType);
    console.log('错误情况下使用localStorage中的市场类型和交易对:', { marketType: savedMarketType, symbol: savedSymbol });
    return savedSymbol;
  }
}

// 监听交易对更新
const setupSymbolListener = () => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    console.log('设置交易对消息监听器...');

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        console.log('收到消息:', message);

        if (message.type === 'SYMBOL_UPDATED' && message.data && message.data.symbol) {
          console.log('接收到交易对更新:', message.data.symbol);
          const newSymbol = message.data.symbol;
          // 验证新的 symbol 是否为有效字符串
          if (newSymbol && typeof newSymbol === 'string' && newSymbol !== currentSymbol.value) {
            console.log('收到 SYMBOL_UPDATED 消息，交易对从', currentSymbol.value, '到', newSymbol);
            currentSymbol.value = newSymbol;
            // 不要在这里调用 loadAnalysisData()，让 watch 来处理
          } else {
            console.log('收到 SYMBOL_UPDATED 消息，但交易对未变化:', { current: currentSymbol.value, new: newSymbol });
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
      // 小值但不是极小值，显示更多小数位，去掉末尾的0
      return parseFloat(numPrice.toFixed(8)).toString()
    }
  } else if (numPrice < 1) {
    // 小于1的价格显示6位小数，去掉末尾的0
    return parseFloat(numPrice.toFixed(6)).toString()
  } else if (numPrice < 1000) {
    // 普通价格显示2位小数，去掉末尾的0
    const formatted = numPrice.toFixed(2)
    return parseFloat(formatted).toLocaleString('en-US')
  } else {
    // 大额价格显示2位小数，去掉末尾的0
    const formatted = numPrice.toFixed(2)
    return parseFloat(formatted).toLocaleString('en-US')
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

// 获取显示标题
const getDisplayTitle = () => {
  if (!currentSymbol.value) return t('common.loading')

  if (currentMarketType.value === 'crypto') {
    const baseSymbol = getBaseSymbol(currentSymbol.value)
    return baseSymbol
  } else if (currentMarketType.value === 'stock') {
    return currentSymbol.value
  } else {
    return currentSymbol.value
  }
}

// 面板切换函数
const togglePanel = (panelType: 'search' | 'favorites' | 'popular') => {
  if (activePanel.value === panelType) {
    activePanel.value = null
  } else {
    activePanel.value = panelType

    // 如果打开收藏面板，加载收藏数据
    if (panelType === 'favorites') {
      loadFavorites()
    }
  }
}

// 资产切换处理函数
const handleAssetSwitch = async (symbol: string) => {
  activePanel.value = null // 关闭面板

  // 根据symbol自动检测市场类型
  let targetMarketType = currentMarketType.value

  // 检查是否是加密货币格式
  if (symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH')) {
    targetMarketType = 'crypto'
  }
  // 检查是否在热门股票列表中
  else if (popularStocks.value.some(stock => stock.symbol === symbol)) {
    targetMarketType = 'stock'
  }
  // 检查是否在热门加密货币列表中
  else if (popularTokens.value.some(token => token.symbol === symbol)) {
    targetMarketType = 'crypto'
  }

  console.log(`[handleAssetSwitch] 切换到 ${symbol} (${targetMarketType})`)
  await switchToAsset(symbol, targetMarketType)
}

// 搜索处理函数
let searchTimeout: NodeJS.Timeout
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = []
      return
    }

    searchLoading.value = true
    try {
      // 这里可以添加实际的搜索API调用
      // 模拟搜索延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      // 模拟搜索结果
      const mockResults = [
        { symbol: 'BTCUSDT', name: 'Bitcoin', market_type: 'crypto' },
        { symbol: 'ETHUSDT', name: 'Ethereum', market_type: 'crypto' },
        { symbol: 'SOLUSDT', name: 'Solana', market_type: 'crypto' },
        { symbol: 'BNBUSDT', name: 'BNB', market_type: 'crypto' },
        { symbol: 'AAPL', name: 'Apple Inc.', market_type: 'stock' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', market_type: 'stock' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', market_type: 'stock' },
        { symbol: 'TSLA', name: 'Tesla Inc.', market_type: 'stock' }
      ].filter(item => {
        const query = searchQuery.value.toLowerCase()
        return item.symbol.toLowerCase().includes(query) ||
               item.name.toLowerCase().includes(query)
      }).filter(item => {
        // 根据当前市场类型过滤
        return item.market_type === currentMarketType.value
      }).slice(0, 5) // 限制结果数量

      searchResults.value = mockResults
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 300)
}

// 加载收藏数据 - 完全通过API接口
const loadFavorites = async () => {
  favoritesLoading.value = true
  try {
    console.log('loadFavorites: 开始通过API加载收藏数据')
    console.log('loadFavorites: 当前市场类型:', currentMarketType.value)

    // 检查是否在扩展环境
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
    console.log('loadFavorites: 扩展环境:', isExtension)

    // 检查token
    const token = localStorage.getItem('token')
    console.log('loadFavorites: token状态:', token ? '存在' : '不存在')

    if (!token) {
      console.warn('loadFavorites: 没有token，无法加载收藏数据')
      favoriteAssets.value = []
      return
    }

    // 在扩展环境下，添加额外的调试信息
    if (isExtension) {
      console.log('loadFavorites: 在Chrome扩展环境中加载收藏数据')
      console.log('loadFavorites: Token前缀检查:', token.startsWith('Token ') ? 'Token前缀正确' : 'Token前缀可能有问题')
      console.log('loadFavorites: 准备调用API: /crypto/favorites/')
    }

    // 直接调用API获取收藏数据
    const response = await favorites.getFavorites()
    console.log('loadFavorites: API响应完整数据:', JSON.stringify(response, null, 2))
    console.log('loadFavorites: response.status:', response.status)
    console.log('loadFavorites: response.data:', response.data)
    console.log('loadFavorites: response.data类型:', typeof response.data)
    console.log('loadFavorites: response.data是否为数组:', Array.isArray(response.data))

    if (response.status === 'success' && response.data) {
      // 确保data是数组
      const dataArray = Array.isArray(response.data) ? response.data : []
      console.log('loadFavorites: 数据数组长度:', dataArray.length)

      // 根据当前市场类型过滤收藏数据
      const filteredFavorites = dataArray.filter((asset: any) => {
        console.log('loadFavorites: 检查资产:', asset.symbol, '市场类型:', asset.market_type, '当前市场:', currentMarketType.value)
        return asset.market_type === currentMarketType.value
      })
      console.log('loadFavorites: 过滤后的收藏数据:', filteredFavorites)

      favoriteAssets.value = filteredFavorites
    } else {
      console.log('loadFavorites: API返回无数据或失败，status:', response.status)
      favoriteAssets.value = []
    }

  } catch (error: any) {
    console.error('loadFavorites: API加载收藏数据失败:', error)
    console.error('loadFavorites: 错误详情:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    })

    // 在扩展环境下，提供更详细的错误信息
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
    if (isExtension) {
      console.error('loadFavorites: Chrome扩展环境下加载收藏数据失败')
      if (error?.message && error.message.includes('proxy')) {
        console.error('loadFavorites: 可能是代理相关问题')
      }
      if (error?.message && error.message.includes('401')) {
        console.error('loadFavorites: 可能是认证问题，检查token是否正确传递')
      }
      if (error?.message && error.message.includes('timeout')) {
        console.error('loadFavorites: 请求超时，可能是网络问题')
      }
      if (error?.message && error.message.includes('CORS')) {
        console.error('loadFavorites: CORS问题，检查代理配置')
      }
    }

    favoriteAssets.value = []
  } finally {
    favoritesLoading.value = false
  }
}





// 格式化显示符号，移除USDT后缀
const formatDisplaySymbol = (symbol: string, marketType: string) => {
  if (marketType === 'crypto' && symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '')
  }
  return symbol
}

// 移除收藏 - 完全通过API
const removeFavorite = async (symbol: string, marketType: string) => {
  try {
    console.log('removeFavorite: 开始移除收藏', symbol, marketType)

    // 直接调用API移除收藏
    const response = await favorites.removeFavorite(symbol, marketType as 'crypto' | 'stock')
    console.log('removeFavorite: API响应:', response)

    if (response.status === 'success') {
      // 更新本地状态
      favoriteAssets.value = favoriteAssets.value.filter(asset =>
        !(asset.symbol === symbol && asset.market_type === marketType)
      )
      console.log('removeFavorite: 成功移除收藏并更新本地状态')
    } else {
      console.error('removeFavorite: API返回失败状态')
    }
  } catch (error) {
    console.error('removeFavorite: API调用失败:', error)
  }
}

// 全局点击处理函数
const handleGlobalClick = (event: Event) => {
  // 检查点击是否在面板按钮内
  const target = event.target as HTMLElement
  const isButtonClick = target.closest('button')

  // 如果不是按钮点击，关闭面板
  if (!isButtonClick) {
    activePanel.value = null
  }
}

// 添加请求防抖变量
let loadingPromise: Promise<any> | null = null;
let debounceTimer: NodeJS.Timeout | null = null;
let abortController: AbortController | null = null;

// 实际请求逻辑提取为独立函数，防止递归导致重复请求
const doActualLoadAnalysisData = async (showLoading = true, noCache = false) => {
  // 这里复制原本try块里的实际请求逻辑
  // 增强的 symbol 验证
  if (!currentSymbol.value || typeof currentSymbol.value !== 'string' || !currentSymbol.value.trim()) {
    console.error('doActualLoadAnalysisData: Invalid currentSymbol.value:', currentSymbol.value)
    error.value = '无法获取当前交易对信息'
    ElMessage.error('交易对无效，无法加载数据');
    return
  }

  // 如果已经有请求在进行中，取消之前的请求
  if (loadingPromise) {
    console.log('loadAnalysisData: 取消之前的请求，开始新请求')
    if (abortController) {
      abortController.abort()
    }
    loadingPromise = null
  }

  // 创建新的 AbortController
  abortController = new AbortController()

  error.value = null
  isTokenNotFound.value = false
  if (showLoading) {
    loading.value = true
    analysisLoading.value = true
  }

  console.log(`loadAnalysisData: 开始加载 ${currentSymbol.value} 的本地报告数据`)

  // 创建新的请求Promise - 直接调用 getTechnicalAnalysis 读取本地数据
  const marketType = currentMarketType.value === 'china' ? 'stock' : currentMarketType.value as 'crypto' | 'stock'
  loadingPromise = getTechnicalAnalysis(currentSymbol.value, noCache, marketType)
    .then(data => {
      if (data && (data as any).status !== 'not_found') {
        const formattedData = formatTechnicalAnalysisData(data)
        analysisData.value = formattedData
        isTokenNotFound.value = false
        error.value = null // 清除之前的错误
        console.log(`loadAnalysisData: 成功加载 ${currentSymbol.value} 的报告数据`)
      } else {
        analysisData.value = null
        error.value = null // 清除错误，因为这是正常的未找到状态
        console.log(`loadAnalysisData: ${currentSymbol.value} 的报告数据未找到`)
        // 先设置loading状态为false，再设置isTokenNotFound，确保条件能正确匹配
        loading.value = false
        analysisLoading.value = false
        // 使用nextTick确保loading状态更新后再设置isTokenNotFound
        nextTick(() => {
          isTokenNotFound.value = true
          console.log('设置 isTokenNotFound = true, loading =', loading.value, 'analysisLoading =', analysisLoading.value)
        })
      }
      return data;
    })
    .catch(err => {
      console.error(`loadAnalysisData: 请求失败`, err)
      error.value = err instanceof Error ? err.message : '加载数据失败'
      analysisData.value = null
      isTokenNotFound.value = false
      // 错误情况下也要设置loading状态
      loading.value = false
      analysisLoading.value = false
      return null;
    })
    .finally(() => {
      // 只在成功情况下设置loading为false，失败情况已经在then/catch中处理
      if (!isTokenNotFound.value) {
        loading.value = false
        analysisLoading.value = false
      }
      loadingPromise = null;
    });

  return loadingPromise;
}

// 简化的数据加载函数 - 读取本地已存在的报告数据
const loadAnalysisData = async (showLoading = true, debounce = true, noCache = false) => {
  console.log('[loadAnalysisData] called', { showLoading, debounce, noCache, symbol: currentSymbol.value, stack: new Error().stack });
  try {
    // 防抖处理 - 避免快速连续调用
    if (debounce) {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      return new Promise((resolve, reject) => {
        debounceTimer = setTimeout(async () => {
          try {
            // 只执行一次实际请求，不再递归调用自身
            const result = await doActualLoadAnalysisData(showLoading, noCache)
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }, 300)
      })
    }
    // 非防抖时，直接执行实际请求
    return await doActualLoadAnalysisData(showLoading, noCache)
  } catch (e) {
    console.error(`loadAnalysisData: 加载失败`, e)
    error.value = e instanceof Error ? e.message : '加载数据失败'
    loading.value = false
    analysisLoading.value = false
    loadingPromise = null;
  }
}

// 组件卸载时清理
onUnmounted(() => {
  // 清理所有进行中的请求
  loadingPromise = null;

  // 清理防抖定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  // 取消进行中的请求
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
})

// 监听语言变更事件，重新翻译报告数据
const setupLanguageChangeListener = () => {
  window.addEventListener('language-changed', async (event) => {
    const newLanguage = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US'

    // 更新当前语言变量
    currentLanguage.value = newLanguage as LangType

    if (currentSymbol.value) {
      await loadAnalysisData(false)
      await nextTick()
    }
  })

  window.addEventListener('force-refresh-i18n', async () => {
    if (analysisData.value && currentSymbol.value) {
      const newLanguage = localStorage.getItem('language') || 'en-US';
      // 更新当前语言变量
      currentLanguage.value = newLanguage as LangType
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

  // 优先使用localStorage中保存的状态，只有在特定情况下才从外部获取symbol
  try {
    console.log('[MOUNTED] 当前市场类型:', currentMarketType.value);
    console.log('[MOUNTED] 当前资产:', currentSymbol.value);

    // 检查是否有外部传入的symbol（比如从URL或content script）
    const externalSymbol = await getCurrentSymbol();
    console.log('[MOUNTED] 外部获取到的交易对:', externalSymbol);

    // 只有在获取到有效的外部symbol且与当前不同时，才更新
    if (externalSymbol && typeof externalSymbol === 'string' && externalSymbol !== currentSymbol.value) {
      console.log('[MOUNTED] 检测到新的交易对，更新为:', externalSymbol);
      // 优先使用当前市场类型，除非symbol明显属于其他市场
      let targetMarketType = currentMarketType.value;
      console.log('[MOUNTED] 当前市场类型:', targetMarketType);

      // 只有在symbol明显是加密货币格式时才切换到crypto市场
      if (externalSymbol.includes('USDT') || externalSymbol.includes('BTC') || externalSymbol.includes('ETH') || externalSymbol.endsWith('USD')) {
        targetMarketType = 'crypto';
        console.log('[MOUNTED] 检测到加密货币格式，切换到crypto市场');
      }
      // 如果当前在crypto市场但symbol不像加密货币，则切换到stock市场
      else if (currentMarketType.value === 'crypto' && !externalSymbol.includes('USDT') && !externalSymbol.includes('BTC') && !externalSymbol.includes('ETH')) {
        targetMarketType = 'stock';
        console.log('[MOUNTED] 当前在crypto市场但symbol不像加密货币，切换到stock市场');
      }

      console.log('[MOUNTED] 最终目标市场类型:', targetMarketType);
      await switchToAsset(externalSymbol, targetMarketType);
    } else {
      // 使用已经从localStorage恢复的状态，直接加载数据
      await loadAnalysisData(true, false);
    }

  } catch (e: any) {
    console.error('初始化失败:', e);
    error.value = e instanceof Error ? e.message : '加载数据失败'
    loading.value = false
  }

  const summary = analysisData.value?.trend_analysis?.summary
  const lang = currentLanguage.value // 修正为字符串
  if (summary) {
    if (lang === 'en-US') {
      translatedSummary.value = summary
    } else {
      loadingTranslation.value = true
      try {
        translatedSummary.value = await googleTranslate(summary, langMap[lang] || 'zh-CN')
      } catch (e) {
        translatedSummary.value = summary
      }
      loadingTranslation.value = false
    }
  }

  // 添加全局点击监听器，用于关闭下拉菜单
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  // 移除全局点击监听器
  document.removeEventListener('click', handleGlobalClick)
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

  // 只有当交易对真正发生变化时才加载数据
  if (newSymbol && typeof newSymbol === 'string' && newSymbol !== oldSymbol) {
    console.log(`交易对从 ${oldSymbol} 变更为 ${newSymbol}，开始加载数据`)
    await loadAnalysisData(true, true) // 使用防抖
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
        let bgSymbol = 'NOT_IN_EXTENSION_ENV'
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          bgSymbol = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'GET_CURRENT_SYMBOL' }, (response) => {
              resolve(response?.symbol || 'NO_RESPONSE');
            });
          });
        }

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
type LangType = 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR';

const actionMap: Record<LangType, Record<string, string>> = {
  'en-US': { buy: 'Buy', sell: 'Sell', hold: 'Hold', wait: 'Wait' },
  'zh-CN': { buy: '买入', sell: '卖出', hold: '持有', wait: '等待' },
  'ja-JP': { buy: '買い', sell: '売り', hold: 'ホールド', wait: '待機' },
  'ko-KR': { buy: '매수', sell: '매도', hold: '보유', wait: '대기' }
}

const riskLevelMap: Record<LangType, Record<string, string>> = {
  'en-US': { high: 'High', medium: 'Medium', low: 'Low' },
  'zh-CN': { high: '高风险', medium: '中等风险', low: '低风险' },
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

const currentLanguage = ref<LangType>((localStorage.getItem('language') as LangType) || 'zh-CN');

// 处理 TokenNotFoundView 刷新成功事件
const handleRefreshSuccess = async () => {
  console.log('TokenNotFoundView 刷新成功，重新加载本地报告数据...')
  isTokenNotFound.value = false
  error.value = null
  // 只重新加载本地报告数据，不自动请求 get_report
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

// 获取指标显示名称（简写版本）
const getIndicatorDisplayName = (key: string) => {
  const shortNames: Record<string, string> = {
    ExchangeNetflow: 'Exchange Flow',
    MayerMultiple: 'Mayer Multi',
    FundingRate: 'Funding Rate',
    BollingerBands: 'Bollinger',
    // 其他指标保持原名
  }
  return shortNames[key] || key
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

// 判断是否应该显示某个指标（根据市场类型）
const shouldShowIndicator = (key: string) => {
  // 对于股票市场，隐藏不适用的指标
  if (currentMarketType.value === 'stock') {
    const stockHiddenIndicators = ['PSY', 'VWAP', 'FundingRate', 'ExchangeNetflow', 'NUPL']
    return !stockHiddenIndicators.includes(key)
  }

  // 对于加密货币市场，显示所有指标
  return true
}

// 监听 SYMBOL_UPDATED 消息，确保 popup 能及时同步 symbol
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.type === 'SYMBOL_UPDATED' && message.data && message.data.symbol) {
      const newSymbol = message.data.symbol;
      // 验证新的 symbol 是否为有效字符串
      if (newSymbol && typeof newSymbol === 'string') {
        currentSymbol.value = newSymbol;
        // 不要在这里手动调用 loadAnalysisData，交给 watch(currentSymbol) 自动处理
      }
    }
    return true;
  });
}



// 刷新状态
const isRefreshing = ref(false)
let refreshPromise: Promise<any> | null = null

// 调试：监控 isRefreshing 状态变化
watch(isRefreshing, (newVal) => {
  console.log('isRefreshing changed to:', newVal)
}, { immediate: true })

// 刷新报告处理函数 - 直接使用生成的报告数据
const handleRefreshReport = async () => {
  try {
    if (isRefreshing.value || !currentSymbol.value || typeof currentSymbol.value !== 'string' || !currentSymbol.value.trim()) return
    console.log('Setting isRefreshing to true')
    isRefreshing.value = true

    if (refreshPromise) return refreshPromise

    console.log('HomeView: Start refreshing report...')

    refreshPromise = new Promise(async (resolve, reject) => {
      try {
        // 1. 调用 getLatestTechnicalAnalysis 生成新报告
        console.log('HomeView: Calling getLatestTechnicalAnalysis to generate new report')
        const marketType = currentMarketType.value === 'china' ? 'stock' : currentMarketType.value as 'crypto' | 'stock'

        await getLatestTechnicalAnalysis(currentSymbol.value, marketType)

        // 2. 等待后端完成报告生成 - 增加重试机制
        console.log('HomeView: Waiting for report generation...')
        let retryCount = 0
        const maxRetries = 5
        const retryInterval = 2000 // 2秒

        while (retryCount < maxRetries) {
          try {
            // 等待一段时间后尝试读取报告
            await new Promise(resolve => setTimeout(resolve, retryInterval))

            // 尝试读取最新报告
            console.log(`HomeView: Attempt ${retryCount + 1} to read latest report...`)
        const marketType = currentMarketType.value === 'china' ? 'stock' : currentMarketType.value as 'crypto' | 'stock'
        const result = await getTechnicalAnalysis(currentSymbol.value, true, marketType)

            // 如果返回了有效数据
        if (result && (result as any).status !== 'not_found') {
          console.log('HomeView: Successfully got new report data!')

          // 格式化并更新数据
          const formattedData = formatTechnicalAnalysisData(result)
          
          // 确保数据有效
          if (formattedData && typeof formattedData === 'object') {
            analysisData.value = formattedData
            console.log('HomeView: Updated UI with new report data')
            console.log('[REFRESH] New report data structure:', {
              hasTrendAnalysis: !!formattedData.trend_analysis,
              hasSummary: !!formattedData.trend_analysis?.summary,
              hasTradingAdvice: !!formattedData.trading_advice,
              hasReason: !!formattedData.trading_advice?.reason,
              summary: formattedData.trend_analysis?.summary,
              reason: formattedData.trading_advice?.reason
            });
            isTokenNotFound.value = false
            error.value = null
            resolve(true)
                return
              }
            }
            
            retryCount++
          } catch (readError) {
            console.log(`HomeView: Attempt ${retryCount + 1} failed:`, readError)
            retryCount++
          }
        }

        // 如果所有重试都失败
          throw new Error('Failed to generate report, please try again later')
      } catch (error) {
        console.error('HomeView: Failed to refresh report:', error)
        // 刷新失败时只弹出错误提示，不清空数据
        const msg = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : '刷新失败'
        ElMessage.error(msg)
        // 不清空 analysisData，不设置 isTokenNotFound
        reject(error)
      } finally {
        isRefreshing.value = false
        refreshPromise = null
      }
    })

    return refreshPromise
  } catch (error) {
    console.error('HomeView: Error in handleRefreshReport:', error)
    isRefreshing.value = false
    refreshPromise = null
    throw error
  }
}

// 组件卸载时清理
onUnmounted(() => {
  refreshPromise = null
})

const canRefreshReport = computed(() => {
  if (!analysisData.value?.last_update_time) return true
  const lastUpdate = new Date(analysisData.value.last_update_time).getTime()
  const now = Date.now()
  // 12小时（12*60*60*1000）
  return now - lastUpdate > 12 * 60 * 60 * 1000
})

const translatedSummary = ref('')
const translatedReason = ref('')
const translatedRiskFactors = ref<string[]>([])
const loadingTranslation = ref(false)
const loadingReasonTranslation = ref(false)
const loadingRiskTranslation = ref(false)
const langMap: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'en-US': 'en',
  'ja-JP': 'ja',
  'ko-KR': 'ko'
}
watch(
  [() => analysisData.value?.trend_analysis?.summary, () => currentLanguage.value],
  async ([summary, lang]) => {
    console.log('[TRANSLATION] Summary watch triggered:', { summary, lang });
    if (!summary) {
      translatedSummary.value = ''
      return
    }
    if (lang === 'en-US') {
      translatedSummary.value = summary
      return
    }
    loadingTranslation.value = true
    try {
      console.log('[TRANSLATION] Translating summary to:', langMap[lang] || 'zh-CN');
      translatedSummary.value = await googleTranslate(summary, langMap[lang] || 'zh-CN')
      console.log('[TRANSLATION] Summary translation completed:', translatedSummary.value);
    } catch (e) {
      console.error('[TRANSLATION] Summary translation failed:', e);
      translatedSummary.value = summary
    }
    loadingTranslation.value = false
  },
  { immediate: true }
)

// 监听Trading Advice Reason的翻译
watch(
  [() => analysisData.value?.trading_advice?.reason, () => currentLanguage.value],
  async ([reason, lang]) => {
    console.log('[TRANSLATION] Reason watch triggered:', { reason, lang });
    if (!reason) {
      translatedReason.value = ''
      return
    }
    if (lang === 'en-US') {
      translatedReason.value = reason
      return
    }
    loadingReasonTranslation.value = true
    try {
      console.log('[TRANSLATION] Translating reason to:', langMap[lang] || 'zh-CN');
      translatedReason.value = await googleTranslate(reason, langMap[lang] || 'zh-CN')
      console.log('[TRANSLATION] Reason translation completed:', translatedReason.value);
    } catch (e) {
      console.error('[TRANSLATION] Reason translation failed:', e);
      translatedReason.value = reason
    }
    loadingReasonTranslation.value = false
  },
  { immediate: true }
)

// 监听Risk Assessment Details的翻译
watch(
  [() => analysisData.value?.risk_assessment?.details, () => currentLanguage.value],
  async ([details, lang]) => {
    if (!details || !Array.isArray(details) || details.length === 0) {
      translatedRiskFactors.value = []
      return
    }
    if (lang === 'en-US') {
      translatedRiskFactors.value = details
      return
    }
    loadingRiskTranslation.value = true
    try {
      const translatedDetails = await Promise.all(
        details.map(detail => googleTranslate(detail, langMap[lang] || 'zh-CN'))
      )
      translatedRiskFactors.value = translatedDetails
    } catch (e) {
      translatedRiskFactors.value = details
    }
    loadingRiskTranslation.value = false
  },
  { immediate: true }
)

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

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.2s;
}

/* 更时尚漂亮的全局字体 */
:global(html),
:global(body),
:global(#app),
:global(.relative) {
  font-family: 'Inter', 'SF Pro Display', 'Roboto', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif !important;
  letter-spacing: 0.01em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>