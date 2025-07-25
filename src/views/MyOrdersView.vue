<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="goBack" class="mr-2">
            <i class="ri-arrow-left-line ri-lg text-white"></i>
          </button>
          <h1 class="text-lg font-semibold text-white">My Orders</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-8">
      <div class="max-w-[375px] mx-auto px-4">
        <!-- 加载状态 -->
        <div v-if="loading" class="py-8 flex flex-col items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
          <p class="text-gray-400 text-sm">Loading orders...</p>
        </div>

        <!-- 订单列表 -->
        <div v-else-if="orders.length > 0" class="space-y-3 mt-6">
          <div
            v-for="order in orders"
            :key="order.order_id"
            class="bg-gray-800 rounded-xl p-4 border border-gray-700"
          >
            <!-- 订单头部 -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <span class="text-gray-400 text-sm">Order #{{ order.order_id.slice(-8) }}</span>
                <div
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getStatusClass(order.status)"
                >
                  {{ getStatusText(order.status) }}
                </div>
              </div>
              <span class="text-gray-400 text-sm">{{ formatDate(order.created_at) }}</span>
            </div>

            <!-- 订单内容 -->
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <i class="ri-vip-crown-line text-white text-lg"></i>
                </div>
                <div>
                  <h3 class="text-white font-bold text-base">{{ order.plan?.name || 'Premium Plan' }}</h3>
                  <p class="text-gray-400 text-sm">{{ order.plan?.duration_days || 30 }} days</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-white">¥{{ order.amount }}</div>
                <div class="text-gray-400 text-xs">{{ order.payment_method || 'Alipay' }}</div>
              </div>
            </div>

            <!-- 订单操作 -->
            <div v-if="order.status === 'pending'" class="mt-3 pt-3 border-t border-gray-700">
              <div class="flex space-x-2">
                <button
                  @click="repayOrder(order)"
                  class="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue Payment
                </button>
                <button
                  @click="cancelOrder(order)"
                  class="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-center py-12">
          <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="ri-shopping-bag-line text-gray-400 text-2xl"></i>
          </div>
          <h3 class="text-white font-bold text-lg mb-2">No Orders Yet</h3>
          <p class="text-gray-400 text-sm mb-6">You haven't made any orders yet</p>
          <button
            @click="goToUpgrade"
            class="py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership } from '@/api'

const { t } = useEnhancedI18n()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const orders = ref<any[]>([])

// 方法
const goBack = () => {
  router.go(-1)
}

const goToUpgrade = () => {
  router.push({ name: 'membership-upgrade' })
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-600 text-white'
    case 'pending':
      return 'bg-yellow-600 text-white'
    case 'cancelled':
      return 'bg-red-600 text-white'
    case 'expired':
      return 'bg-gray-600 text-white'
    default:
      return 'bg-gray-600 text-white'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Paid'
    case 'pending':
      return 'Pending'
    case 'cancelled':
      return 'Cancelled'
    case 'expired':
      return 'Expired'
    default:
      return 'Unknown'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const repayOrder = (order: any) => {
  // 直接跳转到支付页面，传递订单数据
  router.push({
    name: 'alipay-payment',
    query: {
      orderId: order.order_id,
      orderData: JSON.stringify({
        order_id: order.order_id,
        plan: order.plan,
        amount: order.amount,
        payment_method: order.payment_method || 'alipay'
      })
    }
  })
}

const cancelOrder = async (order: any) => {
  try {
    const response = await membership.cancelOrder(order.order_id)
    if (response.status === 'success') {
      // 重新加载订单列表
      loadOrders()
    }
  } catch (error) {
    console.error('Failed to cancel order:', error)
  }
}

const loadOrders = async () => {
  loading.value = true
  try {
    const response = await membership.getOrders()
    if (response.status === 'success') {
      orders.value = response.data
    }
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadOrders()
})
</script>
