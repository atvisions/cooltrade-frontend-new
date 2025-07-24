<template>
  <div class="relative h-[600px] flex flex-col bg-[#0F172A]">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800/50">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center h-12 px-4">
          <h1 class="text-lg font-semibold text-white">{{ t('points.my_points') }}</h1>
          <div class="ml-auto flex items-center space-x-2">
            <button
              @click="refreshData"
              :disabled="loading"
              class="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <i class="ri-refresh-line" :class="{ 'animate-spin': loading }"></i>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16 overflow-y-auto">
      <div class="max-w-[375px] mx-auto px-4 space-y-6">

        <!-- 积分概览 - 简约卡片 -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 p-6 backdrop-blur-sm border border-white/10">
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div class="relative">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-gray-400 text-sm mb-1">{{ t('points.total_points') }}</p>
                <h2 class="text-4xl font-bold text-white mb-2">{{ pointsInfo.points || 0 }}</h2>
                <div class="flex items-center text-sm text-gray-300">
                  <i class="ri-trophy-line mr-2 text-yellow-400"></i>
                  <span>{{ t('points.total_invited', { count: pointsInfo.invitation_count || 0 }) }}</span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-gray-400 text-sm mb-1">{{ t('points.ranking') }}</p>
                <h3 class="text-2xl font-bold text-yellow-400">#{{ pointsRanking || '--' }}</h3>
              </div>
            </div>
          </div>
        </div>





        <!-- 邀请好友 -->
        <div class="rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-5">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-3">
              <i class="ri-user-add-line text-lg text-white"></i>
            </div>
            <div>
              <h3 class="font-semibold text-white">{{ t('points.invite_friends') }}</h3>
              <p class="text-gray-400 text-sm">+{{ pointsInfo.invitation_points_per_user || 10 }} {{ t('points.points') }}</p>
            </div>
          </div>

          <!-- 邀请码区域 - 始终显示 -->
          <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30 mb-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-400 text-xs mb-1">{{ t('points.your_invitation_code') }}</p>
                <p class="font-mono text-lg font-semibold text-white">{{ pointsInfo.invitation_code || '...' }}</p>
              </div>
              <button
                @click="copyInvitationCode"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <i class="ri-file-copy-line"></i>
                <span class="text-sm">{{ t('points.share') }}</span>
              </button>
            </div>
          </div>

          <!-- 邀请记录 - 可折叠 -->
          <div v-if="pointsInfo.invitation_records && pointsInfo.invitation_records.length > 0">
            <div
              class="flex items-center justify-between cursor-pointer mb-3"
              @click="showInviteRecords = !showInviteRecords"
            >
              <p class="text-gray-400 text-sm font-medium">{{ t('points.invitation_records') }}</p>
              <i :class="[
                'ri-arrow-down-s-line text-gray-400 transition-transform text-lg',
                showInviteRecords ? 'rotate-180' : ''
              ]"></i>
            </div>

            <!-- 邀请记录列表 -->
            <div v-show="showInviteRecords" class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="record in pointsInfo.invitation_records"
                :key="record.invitee_email"
                class="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-600/20"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                    {{ record.invitee_email ? record.invitee_email.charAt(0).toUpperCase() : '?' }}
                  </div>
                  <div>
                    <p class="font-medium text-white text-sm">{{ record.invitee_email }}</p>
                    <p class="text-gray-400 text-xs">{{ formatDate(record.created_at) }}</p>
                  </div>
                </div>
                <div class="text-green-400 font-semibold text-sm">+{{ record.points_awarded }}</div>
              </div>
            </div>
          </div>

          <!-- 无邀请记录时的提示 -->
          <div v-else class="text-center py-4">
            <div class="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-2">
              <i class="ri-user-add-line text-xl text-gray-500"></i>
            </div>
            <p class="text-gray-400 text-sm">{{ t('points.no_invitation_records') }}</p>
            <p class="text-gray-500 text-xs mt-1">{{ t('points.invite_friends_to_earn_points') }}</p>
          </div>
        </div>

        <!-- 积分交易记录 -->
        <div class="rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white">{{ t('points.transaction_history') }}</h3>
            <div class="flex items-center space-x-2">
              <button
                @click="activeTab = 'all'"
                :class="[
                  'px-3 py-1 rounded-lg text-xs transition-colors',
                  activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                ]"
              >
                {{ t('points.all') }}
              </button>
              <button
                @click="activeTab = 'earn'"
                :class="[
                  'px-3 py-1 rounded-lg text-xs transition-colors',
                  activeTab === 'earn' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                ]"
              >
                {{ t('points.earned') }}
              </button>
              <button
                @click="activeTab = 'spend'"
                :class="[
                  'px-3 py-1 rounded-lg text-xs transition-colors',
                  activeTab === 'spend' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                ]"
              >
                {{ t('points.spent') }}
              </button>
            </div>
          </div>

          <!-- 交易记录列表 -->
          <div v-if="filteredTransactions.length > 0" class="space-y-3 max-h-80 overflow-y-auto">
            <div
              v-for="transaction in filteredTransactions"
              :key="transaction.id"
              class="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 border border-gray-600/20"
            >
              <div class="flex items-center space-x-3">
                <!-- 交易类型图标 -->
                <div :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm',
                  transaction.transaction_type === 'earn'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                ]">
                  <i :class="[
                    'text-white',
                    transaction.transaction_type === 'earn' ? 'ri-add-line' : 'ri-subtract-line'
                  ]"></i>
                </div>
                <div>
                  <p class="font-medium text-white text-sm">{{ getTransactionTitle(transaction) }}</p>
                  <p class="text-gray-400 text-xs">{{ formatDate(transaction.created_at) }}</p>
                </div>
              </div>
              <div :class="[
                'font-semibold text-sm',
                transaction.transaction_type === 'earn' ? 'text-green-400' : 'text-orange-400'
              ]">
                {{ transaction.transaction_type === 'earn' ? '+' : '-' }}{{ transaction.amount }}
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="text-center py-8">
            <div class="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
              <i class="ri-history-line text-2xl text-gray-500"></i>
            </div>
            <p class="text-gray-400 text-sm">{{ t('points.no_transactions') }}</p>
            <p class="text-gray-500 text-xs mt-1">{{ t('points.start_earning_points') }}</p>
          </div>
        </div>



      </div>
    </main>

    <!-- 底部导航栏 -->
    <BottomTabBar />



    <!-- 复制成功提示 - 现代化样式 -->
    <div v-if="showCopySuccess" class="fixed bottom-24 left-0 right-0 flex justify-center z-30 px-4">
      <div class="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-lg border border-green-400/20 flex items-center space-x-2">
        <i class="ri-check-line text-lg"></i>
        <span class="font-medium">{{ t('points.copy_success') }}</span>
      </div>
    </div>

    <!-- 操作结果提示 -->
    <div v-if="showResultMessage" class="fixed bottom-24 left-0 right-0 flex justify-center z-30 px-4">
      <div :class="[
        'backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-lg border flex items-center space-x-2',
        resultMessage.type === 'success' ? 'bg-green-500/90 border-green-400/20' : 'bg-red-500/90 border-red-400/20'
      ]">
        <i :class="[
          'text-lg',
          resultMessage.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'
        ]"></i>
        <span class="font-medium">{{ resultMessage.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { points, pointsApi } from '@/api'
import type { InvitationInfo } from '@/api'
import { getMainWebsiteDomain } from '@/config/constants'
import BottomTabBar from '@/components/BottomTabBar.vue'

const { t } = useEnhancedI18n()

// 积分信息
const pointsInfo = ref<InvitationInfo>({
  points: 0,
  invitation_code: '',
  invitation_points_per_user: 10,
  invitation_count: 0,
  invitation_records: []
})

// 状态管理
const pointsRanking = ref<number | null>(null)
const showCopySuccess = ref(false)
const loading = ref(false)


const activeTab = ref<'all' | 'earn' | 'spend'>('all')
const pointsConfig = ref<any>(null)
const transactions = ref<any[]>([])
const showResultMessage = ref(false)
const resultMessage = ref<{ type: 'success' | 'error', text: string }>({ type: 'success', text: '' })
const showInviteRecords = ref(false)

// 计算属性
const filteredTransactions = computed(() => {
  if (activeTab.value === 'all') return transactions.value
  return transactions.value.filter(t => t.transaction_type === activeTab.value)
})

// 用于存储 cookie 相关的域名和名称，以便在不同的函数中使用
const cookieNameForCookie = 'temporary_invitation_uuid';

// 尝试从 cookie 读取 UUID 并认领
const attemptClaimFromCookie = async () => {
    // 检查是否在 Chrome 扩展环境中运行
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        return;
    }

    try {
        // 获取当前环境的主网站域名
        const mainWebsiteDomain = getMainWebsiteDomain();

        // 通过消息发送请求给 background script 读取 cookie
        chrome.runtime.sendMessage({
            type: 'getCookie',
            data: {
                url: mainWebsiteDomain,
                name: cookieNameForCookie
            }
        }, (response) => {
            // 检查是否有权限错误
            if (chrome.runtime.lastError) {
                // 在开发环境中，localhost cookie访问可能受限，这是正常的
                if (chrome.runtime.lastError.message && chrome.runtime.lastError.message.includes('host permissions')) {
                    // 静默处理权限错误，不影响其他功能
                    return;
                }
                console.warn('Cookie access not available:', chrome.runtime.lastError.message);
                return;
            }

            if (response && response.error) {
                console.warn('Cookie access error:', response.error);
                return;
            }

            if (response && response.cookie) {
                // 如果读取到 UUID，调用认领函数
                claimTemporaryInvitation(response.cookie.value);
                // 读取成功后删除 cookie，避免重复尝试认领
                chrome.runtime.sendMessage({
                    type: 'removeCookie',
                    data: {
                        url: mainWebsiteDomain,
                        name: cookieNameForCookie
                    }
                });
            }
        });
    } catch (error) {
        console.warn('Failed to read cookie:', error);
    }
};

// 认领临时邀请码
const claimTemporaryInvitation = async (uuid: string) => {
    try {
        if (!uuid) {
            return;
        }

        const token = localStorage.getItem('token') || '';
        if (!token) {
            return;
        }

        const response = await points.claimTemporaryInvitation(uuid);
        if (response.status === 'success' && response.message === 'Successfully claimed invitation and received reward') {
            fetchPointsInfo();
        }
    } catch (error) {
        console.error('Failed to claim temporary invitation:', error);
        // 检查是否在 Chrome 扩展环境中运行
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                // 请求出错也考虑让 background script 删除 cookie，避免无效尝试
                const mainWebsiteDomain = getMainWebsiteDomain();
                chrome.runtime.sendMessage({
                    type: 'removeCookie',
                    data: {
                        url: mainWebsiteDomain,
                        name: cookieNameForCookie
                    }
                });
            } catch (cookieError) {
                console.warn('Failed to remove cookie after error:', cookieError);
            }
        }
    }
}

// 获取积分配置
const fetchPointsConfig = async () => {
  try {
    const response = await pointsApi.getPointsConfig()
    pointsConfig.value = response
  } catch (error) {
    console.error('获取积分配置失败:', error)
    // 使用默认配置
    pointsConfig.value = {
      duration_minutes: 1440,
      duration_text: '24小时',
      duration_text_en: '24 hours',
      required_points: 10
    }
  }
}

// 获取积分交易记录
const fetchTransactions = async () => {
  try {
    const response = await pointsApi.getTransactions()
    console.log('交易记录API响应:', response);

    // 处理不同的响应格式
    if (response && response.status === 'success' && Array.isArray(response.data)) {
      // 标准格式：{status: 'success', data: [...]}
      transactions.value = response.data
      console.log('使用标准格式，交易记录数量:', response.data.length);
    } else if (Array.isArray(response)) {
      // 直接数组格式：[{...}, {...}]
      transactions.value = response
      console.log('使用直接数组格式，交易记录数量:', response.length);
    } else if (response && Array.isArray(response.data)) {
      // 包装格式：{data: [...]}
      transactions.value = response.data
      console.log('使用包装格式，交易记录数量:', response.data.length);
    } else {
      console.warn('交易记录数据格式异常:', response);
      console.warn('响应类型:', typeof response);
      console.warn('响应结构:', Object.keys(response || {}));
      transactions.value = []
    }
  } catch (error) {
    console.error('获取交易记录失败:', error)
    transactions.value = []
  }
}

// 获取积分信息
const fetchPointsInfo = async () => {
  try {
    // 检查认证令牌
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No authentication token found');
      return;
    }

    try {
      // 获取邀请信息
      const response = await points.getInvitationInfo();
      console.log('邀请信息API响应:', response);

      // 处理不同的响应格式
      if (response && response.status === 'success' && response.data) {
        // 标准格式：{status: 'success', data: {...}}
        pointsInfo.value = response.data;
      } else if (response && response.invitation_code) {
        // 直接数据格式：{invitation_code: '...', points: ...}
        pointsInfo.value = response as InvitationInfo;
      } else {
        console.warn('Failed to get invitation info:', response);
      }

      // 获取排名信息
      const rankingResponse = await points.getRanking();
      if (rankingResponse.status === 'success' && rankingResponse.ranking !== undefined) {
        pointsRanking.value = rankingResponse.ranking;
      } else {
        console.warn('Failed to get ranking info:', rankingResponse);
      }
    } catch (error) {
      console.error('API request failed:', error);
      // 如果是认证错误，可能需要重新登录
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('认证')) {
        console.warn('Authentication error detected, user may need to re-login');
      }
    }
  } catch (error) {
    console.error('Failed to fetch points info:', error);
  }
}

// 刷新所有数据
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchPointsInfo(),
      fetchPointsConfig(),
      fetchTransactions()
    ])
  } finally {
    loading.value = false
  }
}



// 获取交易标题
const getTransactionTitle = (transaction: any) => {
  switch (transaction.reason) {
    case 'registration':
      return t('points.registration_reward')
    case 'invitation':
      return t('points.invitation_reward_transaction')
    case 'premium_analysis':
      return t('points.premium_analysis_access')
    case 'save_image':
      return t('points.save_image_access')
    case 'membership':
      return t('points.membership_reward')
    case 'daily_checkin':
      return t('points.daily_checkin')
    default:
      return transaction.description || t('points.unknown_transaction')
  }
}



// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  } catch {
    return dateString
  }
}

// 复制邀请码
const copyInvitationCode = () => {
  if (!pointsInfo.value.invitation_code) return

  // 获取主网站域名
  const mainWebsiteDomain = getMainWebsiteDomain();

  const invitationText = t('points.share_invitation_text', {
    code: pointsInfo.value.invitation_code,
    points: pointsInfo.value.invitation_points_per_user
  }) + `\n${mainWebsiteDomain}/?code=${pointsInfo.value.invitation_code}`;

  navigator.clipboard.writeText(invitationText)
    .then(() => {
      showCopySuccess.value = true
      setTimeout(() => {
        showCopySuccess.value = false
      }, 2000)
    })
    .catch(err => {
      console.error('Failed to copy invitation code:', err);
    })
}


onMounted(() => {
  refreshData();
  // 在页面挂载并获取基础积分信息后，尝试从 cookie 认领邀请码
  // 确保用户已经认证，fetchPointsInfo 已经检查了 token
  attemptClaimFromCookie();
})
</script>
