<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
      <div class="flex items-center justify-between p-4">
        <button @click="handleBack" class="text-white hover:text-blue-400 transition-colors">
          <i class="ri-arrow-left-line text-xl"></i>
        </button>
        <h1 class="text-lg font-bold text-white">{{ t('orders.title') }}</h1>
        <div class="w-6"></div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="p-4 space-y-4 pb-24">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <!-- 订单列表 -->
      <div v-else-if="orders.length > 0" class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.order_id"
          class="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4"
        >
          <!-- 订单头部 -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <span class="text-gray-400 text-sm">{{ t('orders.order_number') }}</span>
              <span class="text-white text-sm font-mono">{{ order.order_id.slice(-8) }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  getStatusStyle(order.status)
                ]"
              >
                {{ getStatusText(order.status) }}
              </span>
            </div>
          </div>

          <!-- 订单详情 -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">{{ t('orders.plan_name') }}</span>
              <span class="text-white font-medium">{{ order.plan?.name }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">{{ t('orders.payment_amount') }}</span>
              <span class="text-green-400 font-bold">¥{{ order.amount }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">{{ t('orders.payment_method') }}</span>
              <span class="text-white">{{ getPaymentMethodText(order.payment_method) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">{{ t('orders.create_time') }}</span>
              <span class="text-gray-300 text-sm">{{ formatDate(order.created_at) }}</span>
            </div>
            <div v-if="order.paid_at" class="flex justify-between items-center">
              <span class="text-gray-400 text-sm">{{ t('orders.payment_time') }}</span>
              <span class="text-gray-300 text-sm">{{ formatDate(order.paid_at) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="order.status === 'pending'" class="mt-4 pt-3 border-t border-gray-700 space-y-2">
            <button
              @click="checkOrderStatus(order.order_id)"
              :disabled="checkingStatus || repayingOrderId === order.order_id"
              class="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <span v-if="checkingStatus">{{ t('orders.checking') }}</span>
              <span v-else>{{ t('orders.check_payment_status') }}</span>
            </button>
            <button
              v-if="order.payment_method === 'alipay'"
              @click="repayOrder(order.order_id)"
              :disabled="checkingStatus || repayingOrderId === order.order_id"
              class="w-full py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              <span v-if="repayingOrderId === order.order_id">{{ t('orders.repaying') }}</span>
              <span v-else>{{ t('orders.repay') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-12">
        <div class="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
          <i class="ri-file-list-3-line text-3xl text-gray-500"></i>
        </div>
        <h3 class="text-white text-lg font-medium mb-2">{{ t('orders.no_orders') }}</h3>
        <p class="text-gray-400 text-sm mb-6">{{ t('orders.no_orders_desc') }}</p>
        <button
          @click="goToMembership"
          class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          {{ t('orders.go_membership') }}
        </button>
      </div>
    </div>

    <!-- 重新支付弹窗 -->
    <MembershipUpgradeModal
      :visible="showRepaymentModal"
      :repay-order-data="repaymentOrderData"
      @close="closeRepaymentModal"
      @success="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership } from '@/api'
import MembershipUpgradeModal from '@/components/MembershipUpgradeModal.vue'

const { t } = useEnhancedI18n()
const router = useRouter()

// 状态管理
const loading = ref(false)
const checkingStatus = ref(false)
const repayingOrderId = ref<string | null>(null)
const orders = ref<any[]>([])
const showRepaymentModal = ref(false)
const repaymentOrderData = ref<any>(null)

// 获取订单列表
const fetchOrders = async () => {
  try {
    loading.value = true
    const response = await membership.getOrders()
    
    if (response.status === 'success' && response.data) {
      orders.value = response.data
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
    repayingOrderId.value = orderId
    const response = await membership.repayOrder(orderId)

    if (response.status === 'success') {
      // 显示支付弹窗
      repaymentOrderData.value = response.data
      showRepaymentModal.value = true
    }
  } catch (error) {
    console.error('重新支付失败:', error)
    alert(t('orders.repay_failed'))
  } finally {
    repayingOrderId.value = null
  }
}

// 关闭重新支付弹窗
const closeRepaymentModal = () => {
  showRepaymentModal.value = false
  repaymentOrderData.value = null
}

// 处理支付成功
const handlePaymentSuccess = async () => {
  alert(t('orders.payment_success'))
  await fetchOrders()
}

// 获取状态样式
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-500/20 text-green-400'
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'expired':
      return 'bg-red-500/20 text-red-400'
    case 'cancelled':
      return 'bg-gray-500/20 text-gray-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
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
