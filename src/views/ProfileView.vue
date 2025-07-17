<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-scroll">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center h-12 px-4">
          <h1 class="text-lg font-semibold" v-text="t('nav.settings')"></h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <!-- 未登录状态 -->
        <div v-if="!isLoggedIn" class="bg-gray-800 rounded-lg p-6 mb-6">
          <div class="text-center">
            <div class="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              <i class="ri-user-3-line"></i>
            </div>
            <h2 class="text-lg font-semibold mb-2">{{ t('auth.logout') }}</h2>
            <p class="text-gray-400 text-sm mb-4">{{ t('profile.profile') }}</p>
            <router-link
              to="/login"
              class="inline-block py-2 px-6 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            >
              {{ t('auth.login') }}
            </router-link>
          </div>
        </div>

        <!-- 已登录状态 -->
        <template v-else>
          <!-- 用户信息卡片 -->
          <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <div class="flex items-center space-x-4">
              <!-- 头像 -->
              <div class="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center text-2xl font-bold overflow-hidden">
                {{ userInfo.email?.[0]?.toUpperCase() || 'U' }}
              </div>
              <!-- 用户信息 -->
              <div class="flex-1">
                <h2 class="text-base font-semibold">{{ userInfo.email }}</h2>
                <!-- 根据会员状态显示不同的时间信息 -->
                <p v-if="membershipStatus.is_premium_active" class="text-gray-500 text-xs mt-1">
                  <span v-text="t('membership.expires_at')"></span>: {{ formatDate(userInfo.premium_expires_at) }}
                </p>
                <p v-else class="text-gray-500 text-xs mt-1">
                  <span v-text="t('profile.registration_time')"></span>: {{ formatDate(userInfo.created_at) }}
                </p>
                <!-- 会员状态和操作按钮 -->
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center">
                    <div v-if="membershipStatus.is_premium_active" class="flex items-center">
                      <div class="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                      <span class="text-yellow-400 text-xs font-medium">{{ t('membership.premium_member') }}</span>
                    </div>
                    <div v-else class="flex items-center">
                      <div class="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                      <span class="text-gray-500 text-xs">{{ t('membership.regular_user') }}</span>
                    </div>
                  </div>

                  <!-- 会员操作按钮 -->
                  <button
                    v-if="membershipStatus.is_premium_active"
                    @click="showMembershipModal = true"
                    class="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                  >
                    {{ t('membership.renew') }}
                  </button>
                  <button
                    v-else
                    @click="showMembershipModal = true"
                    class="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
                  >
                    {{ t('membership.upgrade') }}
                  </button>
                </div>
              </div>
            </div>
          </div>



          <!-- 功能列表 -->
          <div class="space-y-4">
            <router-link to="/change-password" class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-lock-password-line mr-3"></i>
              <span v-text="t('auth.change_password')"></span>
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </router-link>

            <!-- 语言设置 - 与其他设置保持一致的样式 -->
            <div
              class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center cursor-pointer"
              @click="showLanguageModal = true"
            >
              <i class="ri-global-line mr-3"></i>
              <span v-text="t('profile.language_settings')"></span>
              <div class="ml-auto flex items-center">
                <span class="text-gray-400 mr-2">{{ getCurrentLanguageName() }}</span>
                <i class="ri-arrow-right-s-line"></i>
              </div>
            </div>

            <!-- 其他功能按钮 -->
            <a
              href="https://www.cooltrade.xyz/privacy-policy/"
              target="_blank"
              class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center"
            >
              <i class="ri-shield-check-line mr-3"></i>
              <span v-text="t('common.privacy_policy')"></span>
              <i class="ri-external-link-line ml-auto"></i>
            </a>
            <button class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-information-line mr-3"></i>
              <span v-text="t('common.about_us')"></span>
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </button>
            <button
              class="w-full py-3 px-4 bg-red-500 text-white rounded-lg font-medium flex items-center"
              @click="handleLogout"
            >
              <i class="ri-logout-box-line mr-3"></i>
              <span v-text="t('auth.logout')"></span>
            </button>
          </div>

          <!-- 语言选择模态框 -->
          <div v-if="showLanguageModal" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div class="bg-gray-900 rounded-lg w-full max-w-sm overflow-hidden">
              <div class="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 class="text-lg font-medium">{{ t('profile.language_settings') }}</h3>
                <button @click="showLanguageModal = false" class="text-gray-400 hover:text-white">
                  <i class="ri-close-line text-xl"></i>
                </button>
              </div>
              <div class="p-4">
                <div class="space-y-2">
                  <button
                    v-for="lang in languages"
                    :key="lang.code"
                    @click="selectLanguage(lang.code)"
                    class="w-full py-3 px-4 rounded-lg flex items-center justify-between transition-colors duration-200"
                    :class="currentLanguage === lang.code ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-white hover:bg-gray-700'"
                  >
                    <div class="flex items-center">
                      <span class="text-lg mr-3">{{ getLangFlag(lang.code) }}</span>
                      <span>{{ lang.name }}</span>
                    </div>
                    <i v-if="currentLanguage === lang.code" class="ri-check-line text-primary"></i>
                  </button>
                </div>
              </div>
              <!-- 移除确认按钮，用户点击语言选项后直接关闭模态框 -->
            </div>
          </div>

          <!-- 会员升级弹窗 -->
          <MembershipUpgradeModal
            :visible="showMembershipModal"
            :is-premium="membershipStatus.is_premium_active"
            @close="showMembershipModal = false"
            @success="handleMembershipSuccess"
          />
        </template>
      </div>
    </main>

    <!-- 底部导航栏 -->
    <BottomTabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api, { membership } from '@/api'
import axios from 'axios'
import { setLanguage } from '@/i18n'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import BottomTabBar from '@/components/BottomTabBar.vue'
import MembershipUpgradeModal from '@/components/MembershipUpgradeModal.vue'


const router = useRouter()
const { t, locale } = useEnhancedI18n()

const userInfo = ref({
  id: 0,
  email: '',
  created_at: '',
  updated_at: '',
  language: 'zh-CN',
  is_premium: false,
  premium_expires_at: null as string | null
})

// 会员状态
const membershipStatus = ref({
  membership_status: 'regular',
  is_premium_active: false,
  points: 0
})

// 控制语言选择模态框的显示
const showLanguageModal = ref(false)

// 控制会员升级弹窗的显示
const showMembershipModal = ref(false)



// 当前语言
const currentLanguage = ref(locale.value)

// 监听语言变化
watch(locale, (newLocale) => {
  currentLanguage.value = newLocale
})

// 获取当前语言的名称
const getCurrentLanguageName = (): string => {
  // 使用 currentLanguage.value 而不是 locale.value
  const langCode = currentLanguage.value
  const lang = languages.find(l => l.code === langCode)
  return lang ? lang.name : 'Unknown'
}

// 支持的语言列表
const languages = [
  { code: 'en-US', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' }
]

// 获取语言对应的国旗表情
const getLangFlag = (langCode: string): string => {
  const flagMap: Record<string, string> = {
    'zh-CN': '🇨🇳',
    'en-US': '🇺🇸',
    'ja-JP': '🇯🇵',
    'ko-KR': '🇰🇷'
  }
  return flagMap[langCode] || '🌐'
}

// 选择语言并关闭模态框
const selectLanguage = (lang: string) => {

  // 检查是否与当前语言相同，如果相同则只关闭模态框
  if (currentLanguage.value === lang) {
    showLanguageModal.value = false;
    return;
  }

  // 关闭模态框（先关闭，避免模态框中的文本更新导致闪烁）
  showLanguageModal.value = false;

  // 立即更新当前组件的语言
  currentLanguage.value = lang;

  // 如果用户已登录，更新用户信息
  if (isLoggedIn.value) {
    updateUserLanguage(lang);
  }

  // 设置新语言（这会触发全局语言变更事件）
  // 注意：setLanguage 函数内部会处理语言变更事件和强制刷新
  setLanguage(lang);

  // 不再需要额外触发事件，避免重复触发
  // 移除以下代码以避免多次触发语言变更事件
  /*
  setTimeout(() => {

    // 强制重新渲染当前组件
    const app = document.getElementById('app');
    if (app) {
      app.classList.add('force-rerender');
      setTimeout(() => {
        app.classList.remove('force-rerender');
      }, 10);
    }

    // 触发自定义事件，通知组件刷新
    window.dispatchEvent(new CustomEvent('profile-language-changed', { detail: { language: lang } }));
  }, 100);
  */
}

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token')
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)

  // 根据当前语言选择区域设置
  let locale = 'en-US';
  const currentLang = localStorage.getItem('language');

  if (currentLang === 'zh-CN') locale = 'zh-CN';
  else if (currentLang === 'ja-JP') locale = 'ja-JP';
  else if (currentLang === 'ko-KR') locale = 'ko-KR';


  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取会员状态
const fetchMembershipStatus = async () => {
  if (!isLoggedIn.value) return;

  try {
    const response = await membership.getStatus();
    if (response.status === 'success' && response.data) {
      membershipStatus.value = {
        membership_status: response.data.membership_status,
        is_premium_active: response.data.is_premium_active,
        points: response.data.points
      };

      // 同时更新userInfo中的会员相关字段
      userInfo.value.is_premium = response.data.is_premium;
      userInfo.value.premium_expires_at = response.data.premium_expires_at;
    }
  } catch (error) {
    console.warn('[fetchMembershipStatus] 获取会员状态失败:', error);
  }
};

// 处理会员升级成功
const handleMembershipSuccess = async () => {
  // 重新获取会员状态
  await fetchMembershipStatus();
  // 可以显示成功提示
  console.log('会员升级成功！');
};

const fetchUserInfo = async () => {
  if (!isLoggedIn.value) return;

  try {
    // 先尝试从本地存储获取用户信息
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        const parsedInfo = JSON.parse(savedUserInfo);
        userInfo.value = parsedInfo;
      } catch (e) {
        console.warn('[fetchUserInfo] 解析本地用户信息失败:', e);
      }
    }

    // 检查是否在扩展环境中
    const isExtension = window.location.protocol === 'chrome-extension:';

    let response;
    if (isExtension) {
      // 在扩展环境中，通过代理请求获取用户信息
      try {
        const { proxyRequest } = await import('@/api/proxy');
        response = await proxyRequest({
          url: '/auth/profile/',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('[fetchUserInfo] 扩展环境下获取用户信息成功');
      } catch (proxyError) {
        console.warn('[fetchUserInfo] 扩展环境下获取用户信息失败:', proxyError);
        return; // 使用本地缓存的信息
      }
    } else {
      // 在网页环境中，使用普通API请求
      response = await api.get('/auth/profile/');
    }

    const data = response.data;
    if (data?.status === 'success' && data?.data) {
      userInfo.value = data.data;
      // 更新本地存储
      localStorage.setItem('userInfo', JSON.stringify(data.data));

      // 同步语言设置到localStorage
      if (data.data.language) {
        localStorage.setItem('language', data.data.language);
        console.log(`[fetchUserInfo] 从数据库同步语言设置: ${data.data.language}`);
      }
    }
  } catch (error) {
    console.warn('[fetchUserInfo] 获取用户信息失败，使用本地存储的信息:', error);
  }
}

// 更新用户语言设置
const updateUserLanguage = async (lang: string) => {
  try {
    // 检查是否在扩展环境中
    const isExtension = window.location.protocol === 'chrome-extension:';

    // 更新本地用户信息
    userInfo.value.language = lang;
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value));

    // 同时更新language localStorage项，确保一致性
    localStorage.setItem('language', lang);

    if (!isExtension) {
      // 在网页环境中，发送 API 请求保存到数据库
      await api.put('/auth/profile/', { language: lang });
      console.log(`[updateUserLanguage] 语言设置已保存到数据库: ${lang}`);
    } else {
      // 在扩展环境中，通过代理请求保存到数据库
      try {
        const { proxyRequest } = await import('@/api/proxy');
        await proxyRequest({
          url: '/auth/profile/',
          method: 'PUT',
          data: { language: lang },
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(`[updateUserLanguage] 扩展环境下语言设置已保存到数据库: ${lang}`);
      } catch (proxyError) {
        console.warn(`[updateUserLanguage] 扩展环境下保存语言设置失败:`, proxyError);
        // 即使API请求失败，本地设置已经更新
      }
    }
  } catch (error) {
    console.error(`[updateUserLanguage] 更新语言设置失败:`, error);
    // 即使 API 请求失败，也确保本地存储已更新
    userInfo.value.language = lang;
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
    localStorage.setItem('language', lang);
  }
}

const handleLogout = () => {
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  // 跳转到登录页
  router.push('/login')
}

// 设置语言变更监听器
const setupLanguageChangeListener = () => {
  // 用于防止重复处理的变量
  let lastProcessedLang = localStorage.getItem('language') || 'en-US';
  let lastProcessedTime = Date.now();

  // 监听语言变更事件
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US';

    // 防止短时间内重复处理相同的语言
    const now = Date.now();
    if (newLang === lastProcessedLang && now - lastProcessedTime < 1000) {
      return;
    }

    currentLanguage.value = newLang;
    lastProcessedLang = newLang;
    lastProcessedTime = now;
  });

  // 监听强制刷新事件
  window.addEventListener('force-refresh-i18n', () => {
    const newLang = localStorage.getItem('language') || 'en-US';

    // 防止短时间内重复处理相同的语言
    const now = Date.now();
    if (newLang === lastProcessedLang && now - lastProcessedTime < 1000) {
      return;
    }

    currentLanguage.value = newLang;
    lastProcessedLang = newLang;
    lastProcessedTime = now;
  });
}

onMounted(async () => {
  // 先获取用户信息（包括从数据库获取语言设置）
  await fetchUserInfo();

  // 获取会员状态
  await fetchMembershipStatus();

  // 获取最新的语言设置（fetchUserInfo可能已经更新了localStorage中的language）
  const storedLang = localStorage.getItem('language') || 'en-US';

  // 如果用户已登录，优先使用数据库中的语言设置
  if (isLoggedIn.value && userInfo.value.language) {
    console.log(`[ProfileView] 用户已登录，数据库语言设置: ${userInfo.value.language}, 本地语言设置: ${storedLang}`);

    // 确保数据库中的语言设置与本地设置一致
    if (userInfo.value.language !== storedLang) {
      console.log(`[ProfileView] 应用数据库中的语言设置: ${userInfo.value.language}`);
      setLanguage(userInfo.value.language);
      currentLanguage.value = userInfo.value.language;
    } else {
      // 确保当前组件的语言与数据库设置一致
      currentLanguage.value = userInfo.value.language;
    }
  } else {
    // 用户未登录或没有语言设置，使用本地存储的语言
    console.log(`[ProfileView] 使用本地语言设置: ${storedLang}`);
    currentLanguage.value = storedLang;
  }

  // 设置语言变更监听器
  setupLanguageChangeListener();
})
</script>