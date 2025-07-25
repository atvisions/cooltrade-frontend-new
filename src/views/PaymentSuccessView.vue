<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="goToProfile" class="mr-2">
            <i class="ri-arrow-left-line ri-lg text-white"></i>
          </button>
          <h1 class="text-lg font-semibold text-white">Payment Success</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-32">
      <div class="max-w-[375px] mx-auto px-4">
        <div class="text-center mt-8">
          <!-- 成功图标 -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <i class="ri-check-line text-white text-2xl"></i>
            </div>
          </div>

          <!-- 成功信息 -->
          <div class="mb-4">
            <h3 class="text-xl font-bold text-white mb-1">Payment Successful!</h3>
            <p class="text-gray-400 text-sm">Your membership has been activated</p>
          </div>

          <!-- 会员信息 -->
          <div v-if="currentOrder" class="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-4">
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">Plan</span>
                <span class="text-white font-medium text-sm">{{ currentOrder.plan?.name }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">Amount</span>
                <span class="text-green-400 font-bold text-base">¥{{ currentOrder.amount }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400 text-sm">Bonus Points</span>
                <span class="text-yellow-400 font-bold text-sm">+{{ Math.floor(currentOrder.amount * 10) }} points</span>
              </div>
            </div>
          </div>

          <!-- 倒计时提示 -->
          <div class="bg-gray-800 border border-gray-700 rounded-xl p-3">
            <div class="flex items-center justify-center space-x-2">
              <i class="ri-time-line text-blue-400"></i>
              <span class="text-gray-300 font-medium text-sm">Redirecting in {{ countdown }} seconds</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部固定按钮区域 -->
    <div class="fixed bottom-0 w-full bg-[#0F172A] border-t border-gray-800">
      <div class="max-w-[375px] mx-auto p-4">
        <button
          @click="goToProfile"
          class="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 bg-green-600 text-white hover:bg-green-700"
        >
          Go to Profile
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership } from '@/api'

const { t } = useEnhancedI18n()
const router = useRouter()
const route = useRoute()

// 响应式数据
const currentOrder = ref<any>(null)
const countdown = ref(5)
const countdownInterval = ref<number | null>(null)

// 方法
const goToProfile = () => {
  router.push({ name: 'profile' })
}

const loadOrder = async () => {
  const orderId = route.query.orderId as string
  const orderDataStr = route.query.orderData as string

  console.log('PaymentSuccessView - loadOrder called with orderId:', orderId)
  console.log('PaymentSuccessView - orderData from query:', orderDataStr)

  if (!orderId) {
    console.log('PaymentSuccessView - No orderId provided, redirecting to profile')
    router.push({ name: 'profile' })
    return
  }

  // 优先使用传递的订单数据
  if (orderDataStr) {
    try {
      const orderData = JSON.parse(orderDataStr)
      console.log('PaymentSuccessView - Using passed order data:', orderData)
      currentOrder.value = orderData
      return
    } catch (parseError) {
      console.error('PaymentSuccessView - Failed to parse order data:', parseError)
      // 如果解析失败，继续使用API调用
    }
  }

  // 如果没有传递订单数据或解析失败，尝试API调用
  try {
    console.log('PaymentSuccessView - Fetching order details for orderId:', orderId)
    const response = await membership.getOrder(orderId)
    if (response.status === 'success') {
      console.log('PaymentSuccessView - Order loaded successfully:', response.data)
      currentOrder.value = response.data
    }
  } catch (error) {
    console.error('PaymentSuccessView - Failed to load order:', error)
  }
}

const startCountdown = () => {
  countdownInterval.value = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopCountdown()
      goToProfile()
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
    countdownInterval.value = null
  }
}

// 生命周期
onMounted(() => {
  loadOrder()
  startCountdown()
})

onUnmounted(() => {
  stopCountdown()
})
</script>
