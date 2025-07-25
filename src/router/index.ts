import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入页面组件
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ProfileView from '@/views/ProfileView.vue'
import PointsView from '@/views/PointsView.vue'
import OrdersView from '@/views/OrdersView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ChangePasswordView from '@/views/ChangePasswordView.vue'
import MembershipUpgradeView from '@/views/MembershipUpgradeView.vue'
import PaymentView from '@/views/PaymentView.vue'
import AlipayPaymentView from '@/views/AlipayPaymentView.vue'
import PaymentSuccessView from '@/views/PaymentSuccessView.vue'
import MyOrdersView from '@/views/MyOrdersView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'CoolTrade - Home',
      requiresAuth: true
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
    path: '/orders',
    name: 'orders',
    component: OrdersView,
    meta: {
      title: 'CoolTrade - Orders',
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
  },
  {
    path: '/membership-upgrade',
    name: 'membership-upgrade',
    component: MembershipUpgradeView,
    meta: {
      title: 'CoolTrade - Membership Upgrade',
      requiresAuth: true
    }
  },
  {
    path: '/payment',
    name: 'payment',
    component: PaymentView,
    meta: {
      title: 'CoolTrade - Payment',
      requiresAuth: true
    }
  },
  {
    path: '/alipay-payment',
    name: 'alipay-payment',
    component: AlipayPaymentView,
    meta: {
      title: 'CoolTrade - Alipay Payment',
      requiresAuth: true
    }
  },
  {
    path: '/payment-success',
    name: 'payment-success',
    component: PaymentSuccessView,
    meta: {
      title: 'CoolTrade - Payment Success',
      requiresAuth: true
    }
  },
  {
    path: '/my-orders',
    name: 'my-orders',
    component: MyOrdersView,
    meta: {
      title: 'CoolTrade - My Orders',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 检查认证状态
  const token = localStorage.getItem('token')
  const userInfo = localStorage.getItem('userInfo')
  
  if (token && userInfo) {
    try {
      const result = JSON.parse(userInfo)
      // 认证检查通过，继续导航
    } catch (error) {
      // 用户信息解析失败，清除无效数据
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }

  // 记录导航
  // 导航逻辑
  if (to.meta.requiresAuth && !token) {
    // 需要认证但未登录，重定向到登录页
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登录用户访问登录页，重定向到首页
    next('/')
  } else {
    // 正常导航
    next()
  }
})

export default router
