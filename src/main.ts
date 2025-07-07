import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import './styles/main.css'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// RemixIcon
import 'remixicon/fonts/remixicon.css'

// i18n
import i18n from './i18n'
import { i18nDirectPlugin } from './i18n/direct-loader'

// 初始化语言设置
const initializeLanguage = async () => {
  const currentLang = localStorage.getItem('language')
  const token = localStorage.getItem('token')

  // 如果用户已登录，尝试从数据库获取语言设置
  if (token) {
    try {
      const userInfo = localStorage.getItem('userInfo')
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo)
        if (parsedUserInfo.language && parsedUserInfo.language !== currentLang) {
          localStorage.setItem('language', parsedUserInfo.language)
          console.log(`[main.ts] 从用户信息恢复语言设置: ${parsedUserInfo.language}`)
        }
      }
    } catch (e) {
      console.warn('[main.ts] 解析用户信息失败:', e)
    }
  }

  // 如果没有语言设置，默认为英文
  if (!localStorage.getItem('language')) {
    localStorage.setItem('language', 'en-US')
  }
}

// 初始化语言
initializeLanguage()

const app = createApp(App)

// 安装插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(i18n)
app.use(i18nDirectPlugin)

// 挂载应用
app.mount('#app')
