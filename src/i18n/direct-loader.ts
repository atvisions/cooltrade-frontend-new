/**
 * Direct language file loading implementation
 * This is a fallback solution for when vue-i18n is not working
 */

import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import koKR from './locales/ko-KR'

// All language data
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR
}

// Current language
let currentLocale = 'en-US'

// Debug mode flag - only enabled in development environment or manually enabled
// const isDebug = false; // Temporarily disable debug mode (removed unused variable)

// 调试工具（简化版本）
// let i18nDebug: any = null; // (removed unused variable)

// 初始化时获取语言
function initLocale() {
  // 尝试从 localStorage 获取
  const storedLang = localStorage.getItem('language')

  // 如果存储的是中文，强制改为英文
  if (storedLang === 'zh-CN') {
    currentLocale = 'en-US'
    localStorage.setItem('language', 'en-US')
    return
  }

  // 如果有其他有效语言设置，使用它
  if (storedLang && ['en-US', 'ja-JP', 'ko-KR'].includes(storedLang)) {
    currentLocale = storedLang
    return
  }

  // 默认使用英文
  currentLocale = 'en-US'
  localStorage.setItem('language', 'en-US')
}

// 初始化
initLocale()

// 翻译函数
export function t(key: string, params?: Record<string, any>): string {
  // 调试功能暂时禁用

  // 每次翻译时重新获取当前语言，以确保使用最新的语言设置
  const storedLang = localStorage.getItem('language');

  // 如果存储的是中文，强制改为英文
  if (storedLang === 'zh-CN') {
    currentLocale = 'en-US';
    localStorage.setItem('language', 'en-US');
  } else if (storedLang && ['en-US', 'ja-JP', 'ko-KR'].includes(storedLang) && storedLang !== currentLocale) {
    currentLocale = storedLang;
  }

  // 分割键，例如 'auth.login' => ['auth', 'login']
  const keys = key.split('.')

  // 获取当前语言的消息对象
  let value: any = messages[currentLocale as keyof typeof messages]

  // 遍历键路径
  for (const k of keys) {
    // 如果路径中的任何一部分不存在，则找不到翻译
    if (value === undefined || value === null) {
      return key;
    }
    value = value[k]
  }

  // 如果找到的值是 undefined 或 null，则找不到翻译
  if (value === undefined || value === null) {
    return key;
  }

  // 如果找到的值是字符串，并且有参数，则替换参数
  if (typeof value === 'string' && params) {
    return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
      return str.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue))
    }, value) // 使用找到的字符串值作为累加器的初始值
  }

  // 根据 vue-i18n 的行为，如果翻译值不是字符串，它通常直接返回该值。
  // 但为了确保函数返回类型是 string，这里强制转换为 string。
  return String(value)
}

// 设置语言
export function setLocale(locale: string) {
  // 禁止设置中文，强制改为英文
  if (locale === 'zh-CN') {
    locale = 'en-US'
  }

  if (['en-US', 'ja-JP', 'ko-KR'].includes(locale)) {
    // 记录旧语言，用于调试
    // const oldLocale = currentLocale // (removed unused variable)

    // 更新当前语言
    currentLocale = locale
    localStorage.setItem('language', locale)

    // 触发自定义事件，通知语言变化
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
  }
}

// 获取当前语言
export function getLocale(): string {
  return currentLocale
}

// 获取所有可用语言
export function getAvailableLocales(): string[] {
  return Object.keys(messages)
}

// 创建一个 Vue 插件
export const i18nDirectPlugin = {
  install(app: any) {
    // 全局属性
    app.config.globalProperties.$td = t
    app.config.globalProperties.$locale = {
      get: getLocale,
      set: setLocale,
      available: getAvailableLocales()
    }

    // 提供一个全局指令
    app.directive('t', {
      mounted(el: HTMLElement, binding: any) {
        el.textContent = t(binding.value)
      },
      updated(el: HTMLElement, binding: any) {
        el.textContent = t(binding.value)
      }
    })
  }
}

// 导出默认对象
export default {
  t,
  setLocale,
  getLocale,
  getAvailableLocales,
  plugin: i18nDirectPlugin
}
