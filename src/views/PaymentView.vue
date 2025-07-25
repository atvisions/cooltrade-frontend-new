<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="goBack" class="mr-2">
            <i class="ri-arrow-left-line ri-lg text-white"></i>
          </button>
          <h1 class="text-lg font-semibold text-white">Select Payment Method</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-32">
      <div class="max-w-[375px] mx-auto px-4">
        <!-- 选中的套餐信息 -->
        <div v-if="selectedPlan" class="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6 mt-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <i class="ri-vip-crown-line text-white text-lg"></i>
              </div>
              <div>
                <h3 class="text-white font-bold text-base">
                  {{ selectedPlan.plan_type === 'monthly' ? 'Premium' : 'Premium (Yearly)' }}
                </h3>
                <p class="text-gray-400 text-sm">{{ selectedPlan.duration_days }} days</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xl font-bold text-white">¥{{ selectedPlan.price }}</div>
              <div class="text-gray-400 text-xs">{{ selectedPlan.plan_type === 'monthly' ? '/month' : '/year' }}</div>
            </div>
          </div>
        </div>

        <!-- 支付方式 -->
        <div>
          <h3 class="text-white font-bold text-lg mb-3">Payment Methods</h3>
          <div
            @click="selectPaymentMethod('alipay')"
            class="bg-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-300 border-2"
            :class="selectedPaymentMethod === 'alipay'
              ? 'border-blue-500 bg-gray-750'
              : 'border-gray-700 hover:border-gray-600'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <i class="ri-alipay-line text-white text-lg"></i>
                </div>
                <div>
                  <h4 class="text-white font-bold text-base">Alipay Payment</h4>
                  <p class="text-gray-400 text-sm">Scan QR code with Alipay</p>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">Recommended</span>
                  </div>
                </div>
              </div>

              <!-- 选择圆圈 -->
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                   :class="selectedPaymentMethod === 'alipay'
                     ? 'border-blue-500 bg-blue-500'
                     : 'border-gray-500'">
                <div v-if="selectedPaymentMethod === 'alipay'" class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 底部固定按钮区域 -->
    <div class="fixed bottom-0 w-full bg-[#0F172A] border-t border-gray-800">
      <div class="max-w-[375px] mx-auto p-4">
        <button
          @click="selectedPaymentMethod ? createOrder() : null"
          :disabled="!selectedPaymentMethod || creatingOrder"
          class="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300"
          :class="selectedPaymentMethod && !creatingOrder
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'"
        >
          <div v-if="creatingOrder" class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating order...
          </div>
          <span v-else-if="selectedPaymentMethod">Confirm Payment</span>
          <span v-else>Select payment method</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership, type MembershipPlan } from '@/api'

const { t } = useEnhancedI18n()
const router = useRouter()
const route = useRoute()

// 响应式数据
const selectedPlan = ref<MembershipPlan | null>(null)
const selectedPaymentMethod = ref<string>('')
const creatingOrder = ref(false)

// 方法
const goBack = () => {
  router.go(-1)
}

const selectPaymentMethod = (method: string) => {
  selectedPaymentMethod.value = method
}

const createOrder = async () => {
  console.log('PaymentView - createOrder called')
  console.log('PaymentView - selectedPlan:', selectedPlan.value)
  console.log('PaymentView - selectedPaymentMethod:', selectedPaymentMethod.value)

  if (!selectedPlan.value || !selectedPaymentMethod.value) {
    console.log('PaymentView - Missing plan or payment method, aborting')
    return
  }

  creatingOrder.value = true
  try {
    console.log('PaymentView - Creating order with data:', {
      plan_id: selectedPlan.value.id,
      payment_method: selectedPaymentMethod.value
    })

    const response = await membership.createOrder({
      plan_id: selectedPlan.value.id,
      payment_method: selectedPaymentMethod.value
    })

    console.log('PaymentView - Create order response:', response)
    console.log('PaymentView - Create order response.data:', JSON.stringify(response.data, null, 2))

    if (response.status === 'success') {
      console.log('PaymentView - Order created successfully, navigating to alipay-payment')
      console.log('PaymentView - Order ID:', response.data.order_id)

      // 跳转到支付宝支付页面，传递完整的订单数据
      try {
        await router.push({
          name: 'alipay-payment',
          query: {
            orderId: response.data.order_id,
            orderData: JSON.stringify(response.data)
          }
        })
        console.log('PaymentView - Navigation to alipay-payment successful')
      } catch (navError) {
        console.error('PaymentView - Navigation failed:', navError)
      }
    } else {
      console.error('PaymentView - Create order failed:', response)
    }
  } catch (error) {
    console.error('PaymentView - Failed to create order:', error)
    console.error('PaymentView - Error details:', error.message, error.stack)
  } finally {
    creatingOrder.value = false
    console.log('PaymentView - createOrder finished, creatingOrder set to false')
  }
}

const loadPlan = async () => {
  const planId = route.query.planId as string
  console.log('PaymentView - planId from query:', planId, typeof planId)

  if (!planId) {
    console.log('PaymentView - No planId provided, redirecting to membership-upgrade')
    router.push({ name: 'membership-upgrade' })
    return
  }

  try {
    const response = await membership.getPlans()
    console.log('PaymentView - API response:', response)

    if (response.status === 'success') {
      console.log('PaymentView - Available plans:', response.data)
      // 将planId转换为数字进行比较
      const planIdNumber = parseInt(planId, 10)
      selectedPlan.value = response.data.find(plan => plan.id === planIdNumber) || null

      console.log('PaymentView - Looking for plan with id:', planIdNumber)
      console.log('PaymentView - Found plan:', selectedPlan.value)

      if (!selectedPlan.value) {
        console.log('PaymentView - Plan not found, redirecting to membership-upgrade')
        router.push({ name: 'membership-upgrade' })
      }
    }
  } catch (error) {
    console.error('PaymentView - Failed to load plan:', error)
    router.push({ name: 'membership-upgrade' })
  }
}

// 生命周期
onMounted(() => {
  loadPlan()
})
</script>
