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

// 强制重置语言为英文
const currentLang = localStorage.getItem('language')
if (currentLang === 'zh-CN' || !currentLang) {
  localStorage.setItem('language', 'en-US')
}

const app = createApp(App)

// 安装插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(i18n)
app.use(i18nDirectPlugin)

// 挂载应用
app.mount('#app')

console.log('✅ CoolTrade Frontend Started Successfully!')
