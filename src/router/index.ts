import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入页面组件
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ProfileView from '@/views/ProfileView.vue'
import PointsView from '@/views/PointsView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ChangePasswordView from '@/views/ChangePasswordView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'CoolTrade - Home',
      requiresAuth: false
    }
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: {
      title: 'CoolTrade - About',
      requiresAuth: false
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: 'CoolTrade - Login',
      guest: true
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      title: 'CoolTrade - Register',
      guest: true
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: {
      title: 'CoolTrade - Profile',
      requiresAuth: true
    }
  },
  {
    path: '/points',
    name: 'points',
    component: PointsView,
    meta: {
      title: 'CoolTrade - Points',
      requiresAuth: true
    }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: {
      title: 'CoolTrade - Forgot Password',
      guest: true
    }
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: ChangePasswordView,
    meta: {
      title: 'CoolTrade - Change Password',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 检查登录状态
function isLoggedIn() {
  const token = localStorage.getItem('token')
  const userInfo = localStorage.getItem('userInfo')
  const result = token && userInfo
  console.log(`🔐 Auth check: token=${!!token}, userInfo=${!!userInfo}, result=${result}`)
  return result
}

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }

  console.log(`🧭 Navigating from ${from.path} to ${to.path}`)

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some(record => record.meta.guest)

  if (requiresAuth && !isLoggedIn()) {
    // 需要登录但未登录，重定向到登录页
    console.log('🔒 Redirecting to login - authentication required')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (isGuestRoute && isLoggedIn()) {
    // 已登录用户访问登录/注册页，重定向到首页
    console.log('🏠 Redirecting to home - already logged in')
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
