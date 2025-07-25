<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="goBack" class="mr-2">
            <i class="ri-arrow-left-line ri-lg text-white"></i>
          </button>
          <h1 class="text-lg font-semibold text-white">Alipay Payment</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-8">
      <div class="max-w-[375px] mx-auto px-4">
        <!-- 订单信息 -->
        <div v-if="currentOrder" class="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-4 mt-6">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <div class="text-center">
                <span class="text-gray-400 text-sm block">Order ID</span>
                <span class="text-white text-base font-mono font-bold">{{ currentOrder.order_id.slice(-8) }}</span>
              </div>
              <div class="text-center">
                <span class="text-gray-400 text-sm block">Amount</span>
                <span class="text-blue-400 text-xl font-bold">¥{{ currentOrder.amount }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 二维码区域 -->
        <div class="text-center">
          <div class="bg-white rounded-2xl p-6 mx-auto inline-block border border-gray-300">
            <div class="w-40 h-40 mx-auto">
              <div v-if="qrCodeLoading" class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                  <p class="text-gray-600 text-sm">Generating...</p>
                </div>
              </div>
              <div v-else-if="qrCodeUrl" class="w-full h-full flex flex-col items-center justify-center">
                <img
                  :src="qrCodeUrl"
                  alt="Alipay QR Code"
                  class="w-full h-full object-contain rounded-lg"
                  @load="console.log('二维码图片加载成功:', qrCodeUrl)"
                  @error="console.error('二维码图片加载失败:', qrCodeUrl, $event)"
                />
              </div>
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="text-center">
                  <i class="ri-error-warning-line text-4xl text-red-400 mb-2"></i>
                  <p class="text-red-400 text-sm">QR code failed to load</p>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-3 font-medium">QR code expires in 10 minutes</p>
          </div>

          <!-- 支付说明 -->
          <div class="mt-4">
            <h4 class="text-lg font-bold text-white mb-1">Use Alipay to scan</h4>
            <p class="text-gray-400 text-sm">Open Alipay and scan the QR code</p>
          </div>
        </div>

        <!-- 支付状态检测 -->
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-3 mt-4">
          <div class="flex items-center">
            <div class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <div>
              <p class="text-white text-sm font-medium">Checking payment status</p>
              <p class="text-gray-400 text-xs">Will auto activate after payment</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership } from '@/api'
import QRCode from 'qrcode'

const { t } = useEnhancedI18n()
const router = useRouter()
const route = useRoute()

// 响应式数据
const currentOrder = ref<any>(null)
const qrCodeUrl = ref<string>('')
const qrCodeLoading = ref(false)
const paymentCheckInterval = ref<number | null>(null)
let paymentSuccessHandled = false

// 方法
const goBack = () => {
  router.go(-1)
}

const loadOrder = async () => {
  const orderId = route.query.orderId as string
  const orderDataStr = route.query.orderData as string
  console.log('AlipayPaymentView - loadOrder called with orderId:', orderId)
  console.log('AlipayPaymentView - orderData from query:', orderDataStr)

  // 重置支付成功处理标志
  paymentSuccessHandled = false

  if (!orderId) {
    console.log('AlipayPaymentView - No orderId provided, redirecting to membership-upgrade')
    router.push({ name: 'membership-upgrade' })
    return
  }

  // 定义默认的订单数据
  let orderData: any = {
    order_id: orderId,
    amount: '0.00',
    payment_method: 'alipay'
  }

  // 优先使用传递的订单数据
  if (orderDataStr) {
    try {
      orderData = JSON.parse(orderDataStr)
      console.log('AlipayPaymentView - Using passed order data:', orderData)

      currentOrder.value = {
        order_id: orderData.order_id,
        amount: orderData.amount,
        payment_method: orderData.payment_method,
        expires_at: orderData.expires_at,
        paid: false // 新创建的订单默认未支付
      }

      // 使用免费的二维码生成API来生成二维码图片
      if (orderData.qr_code) {
        console.log('AlipayPaymentView - Original QR code URL:', orderData.qr_code)

        try {
          // 使用免费的二维码生成API
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderData.qr_code)}`
          console.log('AlipayPaymentView - Generated QR image URL:', qrImageUrl)
          qrCodeUrl.value = qrImageUrl
        } catch (err) {
          console.error('AlipayPaymentView - Failed to generate QR code image:', err)
          qrCodeUrl.value = ''
        }

        startPaymentCheck()
        return
      } else {
        console.log('AlipayPaymentView - No qr_code in order data, will fetch from API:', orderData)
        // 继续执行API调用来获取完整的订单信息
      }
    } catch (parseError) {
      console.error('AlipayPaymentView - Failed to parse order data:', parseError)
      // 如果解析失败，继续使用API调用
    }
  }

  // 如果没有传递订单数据或解析失败，调用重新支付API获取支付二维码
  try {
    console.log('AlipayPaymentView - Calling repay API for orderId:', orderId)
    const response = await membership.repayOrder(orderId)
    console.log('AlipayPaymentView - repayOrder response:', response)

    // 检查响应格式
    if (response.status === 'success' && response.data) {
      console.log('AlipayPaymentView - Repay order successful:', response.data)
      // 合并订单数据
      currentOrder.value = {
        ...orderData,
        ...response.data
      }
      await generateQRCode()
      startPaymentCheck()
    } else if (response.order_id) {
      // 如果直接返回订单数据（没有包装格式）
      console.log('AlipayPaymentView - Repay order successful (direct format):', response)
      currentOrder.value = {
        ...orderData,
        ...response
      }
      await generateQRCode()
      startPaymentCheck()
    } else {
      console.error('AlipayPaymentView - Failed to repay order:', response)
      router.push({ name: 'membership-upgrade' })
    }
  } catch (error) {
    console.error('AlipayPaymentView - Failed to repay order:', error)
    console.error('AlipayPaymentView - Error details:', error.message, error.stack)

    // 尝试解析错误响应
    if (error.response && error.response.data) {
      console.error('AlipayPaymentView - Server error response:', error.response.data)
    }

    router.push({ name: 'membership-upgrade' })
  }
}

const generateQRCode = async () => {
  if (!currentOrder.value) return

  qrCodeLoading.value = true
  try {
    console.log('AlipayPaymentView - generateQRCode - currentOrder:', currentOrder.value)

    // 首先检查订单数据中是否已经包含QR码
    if (currentOrder.value.qr_code) {
      console.log('AlipayPaymentView - Found qr_code in order data:', currentOrder.value.qr_code)
      try {
        // 使用免费的二维码生成API将支付宝URL转换为图片
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentOrder.value.qr_code)}`
        console.log('AlipayPaymentView - Generated QR image URL from order data:', qrImageUrl)
        qrCodeUrl.value = qrImageUrl
      } catch (err) {
        console.error('AlipayPaymentView - Failed to generate QR code image from order data:', err)
        qrCodeUrl.value = ''
      }
      return
    }

    if (currentOrder.value.payment_info && currentOrder.value.payment_info.qr_code) {
      console.log('AlipayPaymentView - Found qr_code in payment_info:', currentOrder.value.payment_info.qr_code)
      try {
        // 使用免费的二维码生成API将支付宝URL转换为图片
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentOrder.value.payment_info.qr_code)}`
        console.log('AlipayPaymentView - Generated QR image URL from payment_info:', qrImageUrl)
        qrCodeUrl.value = qrImageUrl
      } catch (err) {
        console.error('AlipayPaymentView - Failed to generate QR code image from payment_info:', err)
        qrCodeUrl.value = ''
      }
      return
    }

    // 如果订单数据中没有QR码，则调用API获取
    console.log('AlipayPaymentView - No QR code in order data, calling API')
    const response = await membership.getPaymentQRCode(currentOrder.value.order_id)
    if (response.status === 'success') {
      qrCodeUrl.value = response.data.qr_code_url
    }
  } catch (error) {
    console.error('AlipayPaymentView - Failed to generate QR code:', error)
  } finally {
    qrCodeLoading.value = false
  }
}

const checkPaymentStatus = async () => {
  if (!currentOrder.value) return

  try {
    console.log('AlipayPaymentView - Checking payment status for order:', currentOrder.value.order_id)
    const response = await membership.checkOrderStatus(currentOrder.value.order_id)
    console.log('AlipayPaymentView - Payment status response:', response)

    // 检查响应数据结构
    const paymentStatus = response.payment_status || response.data?.payment_status
    console.log('AlipayPaymentView - Payment status:', paymentStatus)
    console.log('AlipayPaymentView - paymentSuccessHandled:', paymentSuccessHandled)

    if (paymentStatus === 'paid' && !paymentSuccessHandled) {
        // 支付成功 - 立即停止轮询并标记已处理
        paymentSuccessHandled = true
        console.log('AlipayPaymentView - Payment successful! Stopping payment check and navigating to success page')

        stopPaymentCheck()

        try {
          await router.push({
            name: 'payment-success',
            query: {
              orderId: currentOrder.value.order_id,
              orderData: JSON.stringify(currentOrder.value)
            }
          })
          console.log('AlipayPaymentView - Successfully navigated to payment-success page')
        } catch (navError) {
          console.error('AlipayPaymentView - Navigation to payment-success failed:', navError)
        }

        return // 确保不再继续执行
      }
  } catch (error) {
    console.error('AlipayPaymentView - Failed to check payment status:', error)
  }
}

const startPaymentCheck = () => {
  console.log('AlipayPaymentView - Starting payment status check')
  if (paymentCheckInterval.value) {
    console.log('AlipayPaymentView - Clearing existing payment check interval')
    clearInterval(paymentCheckInterval.value)
  }
  paymentCheckInterval.value = window.setInterval(checkPaymentStatus, 3000)
  console.log('AlipayPaymentView - Payment check interval started, checking every 3 seconds')
}

const stopPaymentCheck = () => {
  if (paymentCheckInterval.value) {
    clearInterval(paymentCheckInterval.value)
    paymentCheckInterval.value = null
  }
}

// 生命周期
onMounted(() => {
  loadOrder()
})

onUnmounted(() => {
  stopPaymentCheck()
})
</script>
