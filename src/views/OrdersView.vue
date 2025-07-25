<template>
  <div class="min-h-screen bg-gray-50 overflow-y-auto">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div class="flex items-center justify-between p-4 max-w-md mx-auto">
        <button @click="handleBack" class="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <i class="ri-arrow-left-line text-xl text-gray-700"></i>
        </button>
        <h1 class="text-xl font-bold text-gray-900">{{ t('orders.title') }}</h1>
        <div class="w-10"></div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="max-w-md mx-auto p-4 space-y-4 pb-24 overflow-y-auto">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <!-- 调试信息 -->
      <div v-if="orders.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <h3 class="text-blue-800 font-medium text-sm mb-2">🔍 调试信息</h3>
        <div class="text-blue-700 text-xs space-y-1">
          <p>订单总数: {{ orders.length }}</p>
          <p>当前时间: {{ new Date().toLocaleString() }}</p>
          <p v-if="debugMessage" class="text-green-700 font-medium">{{ debugMessage }}</p>
        </div>
      </div>

      <!-- 订单列表 -->
      <div v-if="orders.length > 0" class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.order_id"
          class="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <!-- 订单头部 -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <i class="ri-bill-line text-white text-lg"></i>
              </div>
              <div>
                <span class="text-gray-600 text-sm">{{ t('orders.order_number') }}</span>
                <div class="text-gray-900 text-sm font-mono font-bold">{{ order.order_id.slice(-8) }}</div>
              </div>
            </div>
            <div class="flex flex-col items-end space-y-1">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  getStatusStyle(order.status)
                ]"
              >
                {{ getStatusText(order.status) }}
              </span>
              <!-- 调试：显示过期状态 -->
              <div v-if="order.status === 'pending'" class="text-xs">
                <span v-if="isOrderExpired(order)" class="text-red-600 font-medium">⏰ 已过期</span>
                <span v-else class="text-green-600 font-medium">✅ 有效</span>
              </div>
            </div>
          </div>

          <!-- 订单详情 -->
          <div class="bg-gray-50 rounded-xl p-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600 text-sm">{{ t('orders.plan_name') }}</span>
              <span class="text-gray-900 font-medium">{{ order.plan?.name }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600 text-sm">{{ t('orders.payment_amount') }}</span>
              <span class="text-green-600 font-bold text-lg">¥{{ order.amount }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600 text-sm">{{ t('orders.payment_method') }}</span>
              <span class="text-gray-900 font-medium">{{ getPaymentMethodText(order.payment_method) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-600 text-sm">{{ t('orders.create_time') }}</span>
              <span class="text-gray-700 text-sm">{{ formatDate(order.created_at) }}</span>
            </div>
            <div v-if="order.paid_at" class="flex justify-between items-center">
              <span class="text-gray-600 text-sm">{{ t('orders.payment_time') }}</span>
              <span class="text-gray-700 text-sm">{{ formatDate(order.paid_at) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="order.status === 'pending'" class="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <!-- 检查订单是否过期 -->
            <div v-if="isOrderExpired(order)" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <div class="flex items-center space-x-2">
                <i class="ri-time-line text-red-500"></i>
                <span class="text-red-700 text-sm font-medium">订单已过期</span>
              </div>
              <p class="text-red-600 text-xs mt-1">过期时间: {{ formatDate(order.expires_at) }}</p>
              <button
                @click="cancelOrder(order.order_id)"
                class="w-full mt-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                取消订单
              </button>
            </div>

            <!-- 未过期的订单操作 -->
            <div v-else>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div class="flex items-center space-x-2">
                  <i class="ri-time-line text-blue-500"></i>
                  <span class="text-blue-700 text-sm font-medium">订单有效期</span>
                </div>
                <p class="text-blue-600 text-xs mt-1">过期时间: {{ formatDate(order.expires_at) }}</p>
              </div>

              <button
                @click="checkOrderStatus(order.order_id)"
                :disabled="checkingStatus || repayingOrderId === order.order_id"
                class="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white disabled:text-gray-500 rounded-xl transition-colors font-medium mb-3"
              >
                <span v-if="checkingStatus">检查中...</span>
                <span v-else>检查支付状态</span>
              </button>

              <button
                v-if="order.payment_method === 'alipay'"
                @click="repayOrder(order.order_id)"
                :disabled="checkingStatus || repayingOrderId === order.order_id"
                class="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white disabled:text-gray-500 rounded-xl transition-colors font-medium mb-3"
              >
                <span v-if="repayingOrderId === order.order_id">🔄 处理中...</span>
                <span v-else>🚀 直接跳转到二维码页面</span>
              </button>

              <button
                @click="cancelOrder(order.order_id)"
                class="w-full py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                取消订单
              </button>
            </div>
          </div>

          <!-- 已过期/已取消订单的状态显示 -->
          <div v-else-if="order.status === 'expired' || order.status === 'cancelled'" class="mt-4 pt-4 border-t border-gray-200">
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div class="flex items-center space-x-2">
                <i :class="order.status === 'expired' ? 'ri-time-line text-red-500' : 'ri-close-circle-line text-gray-500'"></i>
                <span :class="order.status === 'expired' ? 'text-red-700' : 'text-gray-700'" class="text-sm font-medium">
                  {{ order.status === 'expired' ? '订单已过期' : '订单已取消' }}
                </span>
              </div>
              <p class="text-gray-600 text-xs mt-1">
                {{ order.status === 'expired' ? '过期时间: ' + formatDate(order.expires_at) : '取消时间: ' + formatDate(order.updated_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-16">
        <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <i class="ri-file-list-3-line text-4xl text-gray-400"></i>
        </div>
        <h3 class="text-gray-900 text-xl font-bold mb-2">{{ t('orders.no_orders') }}</h3>
        <p class="text-gray-600 text-sm mb-8">{{ t('orders.no_orders_desc') }}</p>
        <button
          @click="goToMembership"
          class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-200"
        >
          {{ t('orders.go_membership') }}
        </button>
      </div>
    </div>

    <!-- 重新支付弹窗已移除，现在直接跳转到支付页面 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership } from '@/api'

const { t } = useEnhancedI18n()
const router = useRouter()

// 状态管理
const loading = ref(false)
const checkingStatus = ref(false)
const repayingOrderId = ref<string | null>(null)
const orders = ref<any[]>([])
const debugMessage = ref<string>('')

// 获取订单列表
const fetchOrders = async () => {
  try {
    loading.value = true
    const response = await membership.getOrders()

    if (response.status === 'success' && response.data) {
      orders.value = response.data
      console.log('OrdersView - Fetched orders:', response.data)

      // 调试：检查每个订单的过期状态
      response.data.forEach((order: any, index: number) => {
        console.log(`OrdersView - Order ${index}:`, {
          order_id: order.order_id,
          status: order.status,
          expires_at: order.expires_at,
          isExpired: isOrderExpired(order)
        })
      })
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 检查订单支付状态
const checkOrderStatus = async (orderId: string) => {
  try {
    checkingStatus.value = true
    const response = await membership.checkOrderStatus(orderId)

    if (response.status === 'success') {
      // 刷新订单列表
      await fetchOrders()

      if (response.data.payment_status === 'paid') {
        alert(t('orders.payment_success'))
      }
    }
  } catch (error) {
    console.error('检查订单状态失败:', error)
    alert(t('orders.check_failed'))
  } finally {
    checkingStatus.value = false
  }
}

// 重新支付订单
const repayOrder = async (orderId: string) => {
  try {
    alert(`🚀 开始处理订单: ${orderId.slice(-8)}`)
    repayingOrderId.value = orderId
    debugMessage.value = `🔄 正在处理订单 ${orderId.slice(-8)}...`
    console.log('OrdersView - Repaying order:', orderId)

    const response = await membership.repayOrder(orderId)
    console.log('OrdersView - Repay response:', response)
    debugMessage.value = `📡 API响应: ${response.status}`

    if (response.status === 'success') {
      debugMessage.value = `✅ 订单处理成功，正在跳转到支付页面...`
      console.log('OrdersView - Repay successful, navigating to alipay-payment')

      // 直接跳转到支付宝支付页面，传递订单数据
      await router.push({
        name: 'alipay-payment',
        query: {
          orderId: response.data.order_id,
          orderData: JSON.stringify(response.data)
        }
      })
      debugMessage.value = `🎉 已跳转到支付页面`
    } else {
      debugMessage.value = `❌ API返回失败: ${response.status}`
    }
  } catch (error) {
    console.error('OrdersView - 重新支付失败:', error)
    debugMessage.value = `❌ 支付失败: ${error.message}`
    alert('重新支付失败')
  } finally {
    repayingOrderId.value = null
    // 3秒后清除调试信息
    setTimeout(() => {
      debugMessage.value = ''
    }, 3000)
  }
}

// 移除了弹窗相关的方法，现在直接跳转到支付页面

// 获取状态样式
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-yellow-100 text-yellow-700'
    case 'expired':
      return 'bg-red-100 text-red-700'
    case 'cancelled':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return t('orders.status_paid')
    case 'pending':
      return t('orders.status_pending')
    case 'expired':
      return t('orders.status_expired')
    case 'cancelled':
      return t('orders.status_cancelled')
    default:
      return t('orders.status_unknown')
  }
}

// 获取支付方式文本
const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'alipay':
      return '支付宝'
    case 'bank_transfer':
      return '银行转账'
    case 'wechat_friend':
      return '微信好友'
    case 'other':
      return '其他'
    default:
      return '未知'
  }
}

// 检查订单是否过期
const isOrderExpired = (order: any) => {
  if (!order.expires_at) return false
  const expiresAt = new Date(order.expires_at)
  const now = new Date()
  return now > expiresAt
}

// 取消订单
const cancelOrder = async (orderId: string) => {
  if (!confirm('确定要取消这个订单吗？')) {
    return
  }

  try {
    console.log('OrdersView - Cancelling order:', orderId)
    // 这里需要添加取消订单的API调用
    // const response = await membership.cancelOrder(orderId)

    // 临时实现：直接刷新订单列表
    alert('订单取消功能开发中...')
    // await fetchOrders()
  } catch (error) {
    console.error('OrdersView - 取消订单失败:', error)
    alert('取消订单失败')
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 返回上一页
const handleBack = () => {
  router.back()
}

// 跳转到会员页面
const goToMembership = () => {
  router.push('/profile')
}

// 组件挂载时获取订单列表
onMounted(() => {
  fetchOrders()
})
</script>
