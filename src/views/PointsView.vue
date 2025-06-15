<template>
  <div class="relative h-[600px] flex flex-col bg-[#0F172A]">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800/50">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center h-12 px-4">
          <h1 class="text-lg font-semibold">{{ t('points.my_points') }}</h1>
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
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-gray-400 text-sm">{{ t('points.total_points') }}</p>
                <h2 class="text-3xl font-bold text-white">{{ pointsInfo.points || 0 }}</h2>
              </div>
              <div class="text-right">
                <p class="text-gray-400 text-sm">{{ t('points.ranking') }}</p>
                <h3 class="text-xl font-semibold text-yellow-400">#{{ pointsRanking || '--' }}</h3>
              </div>
            </div>
            <div class="flex items-center text-sm text-gray-300">
              <i class="ri-trophy-line mr-2 text-yellow-400"></i>
              <span>{{ t('points.total_invited', { count: pointsInfo.invitation_count || 0 }) }}</span>
            </div>
          </div>
        </div>

        <!-- 邀请好友 - 简约操作卡片 -->
        <div class="rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mr-3">
                <i class="ri-user-add-line text-lg text-white"></i>
              </div>
              <div>
                <h3 class="font-semibold text-white">{{ t('points.invite_friends') }}</h3>
                <p class="text-gray-400 text-sm">+{{ pointsInfo.invitation_points_per_user || 10 }} {{ t('points.points') }}</p>
              </div>
            </div>
          </div>

          <!-- 邀请码区域 -->
          <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
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
        </div>

        <!-- 邀请记录 - 简约列表 -->
        <div class="rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-5">
          <h3 class="text-lg font-semibold text-white mb-4">{{ t('points.invitation_records') }}</h3>

          <div v-if="pointsInfo.invitation_records && pointsInfo.invitation_records.length > 0" class="space-y-3">
            <div
              v-for="record in pointsInfo.invitation_records"
              :key="record.invitee_email"
              class="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 border border-gray-600/20"
            >
              <div class="flex items-center space-x-3">
                <!-- 简约头像 -->
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

          <!-- 空状态 -->
          <div v-else class="text-center py-8">
            <div class="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
              <i class="ri-user-add-line text-2xl text-gray-500"></i>
            </div>
            <p class="text-gray-400 text-sm">{{ t('points.no_invitation_records') }}</p>
            <p class="text-gray-500 text-xs mt-1">{{ t('points.invite_friends_to_earn_points') }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部导航栏 -->
    <nav class="sticky bottom-0 w-full z-20 bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="grid grid-cols-3 h-16">
          <router-link to="/" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-line-chart-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('nav.market') }}</span>
          </router-link>
          <router-link to="/points" class="flex flex-col items-center justify-center text-primary border-t-2 border-primary">
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

    <!-- 复制成功提示 - 现代化样式 -->
    <div v-if="showCopySuccess" class="fixed bottom-24 left-0 right-0 flex justify-center z-30 px-4">
      <div class="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-lg border border-green-400/20 flex items-center space-x-2">
        <i class="ri-check-line text-lg"></i>
        <span class="font-medium">{{ t('points.copy_success') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import api from '@/api'

const { t } = useEnhancedI18n()

// 积分信息
const pointsInfo = ref({
  points: 0,
  invitation_code: '',
  invitation_points_per_user: 10,
  invitation_count: 0,
  invitation_records: [] as { invitee_email: string; invitee_username: string; points_awarded: number; created_at: string }[]
})

// 排名信息
const pointsRanking = ref(null)
const showCopySuccess = ref(false)

// 用于存储 cookie 相关的域名和名称，以便在不同的函数中使用
const cookieNameForCookie = 'temporary_invitation_uuid';

// 根据环境获取主网站域名
const getMainWebsiteDomain = () => {
  const isDevelopment = localStorage.getItem('env') === 'development';
  return isDevelopment ? 'https://www.cooltrade.xyz' : 'https://www.cooltrade.xyz';
};

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
            } else {
            }
        });
    } catch (error) {
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

        // 使用 api 实例发送请求，而不是直接使用 axios
        // 这样可以利用 api 实例中的代理机制和环境配置
        const response = await api.post('/auth/claim-temporary-invitation/', {
            temporary_invitation_uuid: uuid
        });

        if ((response as any).status === 'success') {
            if ((response as any).message === 'Successfully claimed invitation and received reward') {
                fetchPointsInfo();
            }
        } else {
        }
    } catch (error) {
        // 检查是否在 Chrome 扩展环境中运行
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            // 请求出错也考虑让 background script 删除 cookie，避免无效尝试
            const mainWebsiteDomain = getMainWebsiteDomain();
            chrome.runtime.sendMessage({
                type: 'removeCookie',
                data: {
                    url: mainWebsiteDomain,
                    name: cookieNameForCookie
                }
            });
        }
    }
}

// 获取积分信息
const fetchPointsInfo = async () => {
  try {

    // 检查认证令牌
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // 确保请求头中包含认证令牌 (headers moved inline)
    // const headers = {
    //   'Content-Type': 'application/json',
    //   'Authorization': token
    // }; // (removed unused variable)



    try {
      // 临时强制使用代理请求
      const responseData = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'PROXY_API_REQUEST',
          data: {
            url: '/auth/invitation-info/',
            method: 'GET',
            headers: {
              'Authorization': localStorage.getItem('token'),
              'Accept': 'application/json'
            }
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '请求失败'));
          }
        });
      });

      // 检查响应格式 - 适配代理请求的响应格式
      console.log('Points API response data:', responseData);

      if (responseData && (responseData as any).success && (responseData as any).data) {
        // 代理请求的响应格式：{ success: true, data: {status: 'success', data: {...}}, status: 200 }
        const apiResponse = (responseData as any).data;

        if (apiResponse.status === 'success' && apiResponse.data) {
          pointsInfo.value = apiResponse.data;

          // 如果排名数据合并到 invitation-info 接口，在这里更新 pointsRanking
          if (apiResponse.data.ranking !== undefined) {
            pointsRanking.value = apiResponse.data.ranking;
          }

          console.log('Points info updated successfully:', pointsInfo.value);
        } else {
          console.log('API response status incorrect:', apiResponse);
        }
      } else {
        console.log('Points info response format incorrect:', responseData);
      }
    } catch (error) {
      console.error('Failed to fetch points info:', error);
    }

    // 获取排名信息 (如果排名接口是独立的)
    try {
      // 临时强制使用代理请求
      const rankingData = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'PROXY_API_REQUEST',
          data: {
            url: '/auth/invitation-info/ranking/',
            method: 'GET',
            headers: {
              'Authorization': localStorage.getItem('token'),
              'Accept': 'application/json'
            }
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '请求失败'));
          }
        });
      });

      // 检查响应格式 - 适配代理请求的响应格式
      console.log('Ranking API response data:', rankingData);

      if (rankingData && (rankingData as any).success && (rankingData as any).data) {
        // 代理请求的响应格式：{ success: true, data: {status: 'success', ranking: 1}, status: 200 }
        const apiResponse = (rankingData as any).data;

        if (apiResponse.status === 'success' && apiResponse.ranking !== undefined) {
          pointsRanking.value = apiResponse.ranking;
          console.log('Ranking info updated successfully:', pointsRanking.value);
        } else {
          console.log('Ranking API response status incorrect:', apiResponse);
        }
      } else {
        console.log('Ranking info response format incorrect:', rankingData);
      }
    } catch (rankingError) {
      console.error('Failed to fetch ranking info:', rankingError);
    }

  } catch (error) {
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

  // 获取主网站域名，而不是使用 window.location.origin（这可能是 chrome-extension://ID）
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
    })
}

// 分享邀请码 (不再需要)
// const shareInvitationCode = async () => {
//   if (!pointsInfo.value.invitation_code) return
//
//   const shareText = t('points.share_invitation_text', {
//     code: pointsInfo.value.invitation_code,
//     points: pointsInfo.value.invitation_points_per_user
//   })
//
//   if (navigator.share) {
//     try {
//       await navigator.share({
//         title: t('points.share_invitation_title'),
//         text: shareText,
//         url: window.location.origin
//       })
//     } catch (error) {
//     }
//   } else {
//     navigator.clipboard.writeText(shareText)
//       .then(() => {
//         showCopySuccess.value = true
//         setTimeout(() => {
//           showCopySuccess.value = false
//         }, 2000)
//       })
//       .catch(err => {
//       })
//   }
// }

onMounted(() => {
  fetchPointsInfo();
  // 在页面挂载并获取基础积分信息后，尝试从 cookie 认领邀请码
  // 确保用户已经认证，fetchPointsInfo 已经检查了 token
  attemptClaimFromCookie();
})
</script>
