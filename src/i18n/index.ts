import { createI18n } from 'vue-i18n'
import { getApiBaseUrl } from '@/config/constants'

// 直接导入语言文件，确保它们被包含在主 JavaScript 文件中
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import koKR from './locales/ko-KR'

// 确保语言文件被正确加载

// 获取浏览器语言 (removed unused function)
// const getBrowserLanguage = (): string => {
//   // 默认使用英文，不再根据浏览器语言自动切换
//   return 'en-US'
// }

// 获取用户设置的语言或默认语言
const getPreferredLanguage = (): string => {
  const storedLang = localStorage.getItem('language')
  if (storedLang && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang)) {
    return storedLang
  }
  // 默认使用英文
  localStorage.setItem('language', 'en-US')
  return 'en-US'
}

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用组合式API
  locale: getPreferredLanguage(),
  fallbackLocale: 'en-US',
  globalInjection: true, // 确保全局注入
  allowComposition: true, // 允许组合式API
  missingWarn: false, // 禁用缺失翻译警告
  fallbackWarn: false, // 禁用回退警告
  silentTranslationWarn: true, // 禁用翻译警告
  silentFallbackWarn: true, // 禁用回退警告
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP,
    'ko-KR': koKR
  },
  // 确保在编译后能够正确加载语言文件
  warnHtmlMessage: false,
  escapeParameter: true,
  runtimeOnly: false
})

// 设置语言的方法
type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

export const setLanguage = (lang: string) => {
  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(lang)) {
    const oldLang = localStorage.getItem('language') || 'en-US';
    if (oldLang === lang) {
      return;
    }
    localStorage.setItem('language', lang);
    i18n.global.locale.value = lang as SupportedLanguage;
    try {
      import('./direct-loader').then(directLoader => {
        directLoader.setLocale(lang);
      });
    } catch (e) {}
    const token = localStorage.getItem('token');
    if (token) {
      updateUserLanguagePreference(lang);
    }
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: lang } }));
    setTimeout(() => {
      window.dispatchEvent(new Event('force-refresh-i18n'));
    }, 100);
  }
}

// 更新用户语言偏好的API调用
const updateUserLanguagePreference = async (lang: string) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    // 检查是否在扩展环境中
    const isExtension = window.location.protocol === 'chrome-extension:';

    if (isExtension) {

      // 在扩展环境中，只更新本地存储
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          userInfo.language = lang
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
        }
      } catch (e) {
      }

      return;
    }

    // 在网页环境中，发送 API 请求
    // 使用相对路径，避免硬编码URL
    const url = getApiBaseUrl() + '/auth/profile/';

    // 使用fetch发送请求
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ language: lang })
    })

    if (!response.ok) {
    } else {

      // 更新本地用户信息
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          userInfo.language = lang
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
        }
      } catch (e) {
      }
    }
  } catch (error) {
  }
}

export default i18n
