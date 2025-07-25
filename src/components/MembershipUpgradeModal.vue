<template>
  <div v-if="visible" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
    <div class="h-full flex items-center justify-center p-4">
      <div class="w-full max-w-lg bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <!-- 顶部导航栏 -->
        <div class="relative bg-gray-800 px-6 py-4 border-b border-gray-700">
          <button
            @click="handleBack"
            class="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-600 transition-colors"
          >
            <i class="ri-arrow-left-line text-lg"></i>
          </button>
          <h1 class="text-center text-lg font-semibold text-white">{{ getPageTitle() }}</h1>
        </div>

        <!-- 主要内容区域 -->
        <div class="max-h-[70vh] overflow-y-auto bg-gray-900">
          <!-- 套餐选择 -->
          <div v-if="currentStep === 'plans'" class="p-6">
            <!-- 页面标题 -->
            <div class="text-center mb-6">
              <h2 class="text-xl font-bold text-white mb-2">Select Membership Plan</h2>
              <p class="text-gray-400 text-sm">Unlock exclusive benefits</p>
            </div>

            <div v-if="loading" class="py-8 flex flex-col items-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
              <p class="text-gray-400 text-sm">{{ t('common.loading') }}</p>
            </div>

            <div v-else-if="plans.length > 0" class="space-y-3">
              <div
                v-for="plan in plans"
                :key="plan.id"
                @click="selectPlan(plan)"
                class="relative bg-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-300 border-2 hover:bg-gray-750"
                :class="selectedPlan?.id === plan.id
                  ? 'border-blue-500 bg-gray-750'
                  : 'border-gray-700 hover:border-gray-600'"
              >
                <!-- 推荐标签 -->
                <div v-if="plan.plan_type === 'yearly'" class="absolute -top-2 left-4">
                  <div class="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Recommended
                  </div>
                </div>

              <div class="flex items-center justify-between">
                <!-- 左侧：图标和信息 -->
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                      <i class="ri-vip-crown-line text-white text-lg"></i>
                    </div>
                    <div>
                      <h3 class="text-white font-bold text-base">
                        {{ plan.plan_type === 'monthly' ? 'Premium' : 'Premium (Yearly)' }}
                      </h3>
                      <p class="text-gray-400 text-sm">{{ plan.duration_days }} days</p>
                    </div>
                  </div>

                <!-- 右侧：价格和选择 -->
                  <div class="flex items-center space-x-3">
                    <div class="text-right">
                      <div class="text-xl font-bold text-white">¥{{ plan.price }}</div>
                      <div class="text-gray-400 text-xs">{{ plan.plan_type === 'monthly' ? '/month' : '/year' }}</div>
                      <div v-if="plan.plan_type === 'yearly'" class="text-green-400 text-xs font-medium">
                        Save ¥{{ (20 * 12 - Number(plan.price)).toFixed(0) }}
                      </div>
                    </div>

                    <!-- 选择圆圈 -->
                    <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                         :class="selectedPlan?.id === plan.id
                           ? 'border-blue-500 bg-blue-500'
                           : 'border-gray-500'">
                      <div v-if="selectedPlan?.id === plan.id" class="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
              </div>
            </div>
          </div>

            <!-- 选中套餐后的详细信息 -->
            <div v-if="selectedPlan" class="mt-4 space-y-3">
              <!-- 会员权益 -->
              <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h3 class="text-base font-bold text-white mb-3 flex items-center">
                  <i class="ri-vip-crown-2-line text-blue-400 mr-2"></i>
                  Premium Benefits
                </h3>
                <div class="space-y-2">
                  <div class="flex items-center space-x-2">
                    <i class="ri-check-line text-green-400 text-sm"></i>
                    <span class="text-gray-300 text-sm">Unlimited AI reports</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <i class="ri-check-line text-green-400 text-sm"></i>
                    <span class="text-gray-300 text-sm">Member points reward</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <i class="ri-check-line text-green-400 text-sm"></i>
                    <span class="text-gray-300 text-sm">Unlimited save reports</span>
                  </div>
                </div>
              </div>

              <!-- 订单详情 -->
              <div class="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-sm">Plan</span>
                    <span class="text-white text-sm font-medium">
                      {{ selectedPlan.plan_type === 'monthly' ? 'Premium' : 'Premium (Yearly)' }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-sm">Duration</span>
                    <span class="text-white text-sm">{{ selectedPlan.duration_days }} days</span>
                  </div>
                  <div v-if="selectedPlan.plan_type === 'yearly'" class="flex justify-between items-center">
                    <span class="text-gray-400 text-sm">Discount</span>
                    <span class="text-green-400 text-sm font-medium">-¥{{ (20 * 12 - Number(selectedPlan.price)).toFixed(0) }}</span>
                  </div>
                  <div class="border-t border-gray-600 pt-2 mt-2">
                    <div class="flex justify-between items-center">
                      <span class="text-white font-bold">Total</span>
                      <span class="text-xl font-bold text-blue-400">¥{{ selectedPlan.price }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 支付方式选择 -->
          <div v-else-if="currentStep === 'payment'" class="p-6">
            <!-- 选中的套餐信息 -->
            <div v-if="selectedPlan" class="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-4">
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
          <!-- 支付宝支付页面 -->
          <div v-else-if="currentStep === 'alipay'" class="p-6">
            <!-- 订单信息 -->
            <div v-if="currentOrder" class="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-4">
              <div class="flex justify-between items-center">
                <div class="flex items-center space-x-4">
                  <div class="text-center">
                    <span class="text-gray-400 text-sm block">{{ t('membership.order_id') }}</span>
                    <span class="text-white text-base font-mono font-bold">{{ currentOrder.order_id.slice(-8) }}</span>
                  </div>
                  <div class="text-center">
                    <span class="text-gray-400 text-sm block">{{ t('membership.payment_amount') }}</span>
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
                      <p class="text-gray-600 text-sm">{{ t('membership.generating') }}</p>
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
                      <p class="text-red-400 text-sm">{{ t('membership.qr_code_failed') }}</p>
                    </div>
                  </div>
                </div>
                <p class="text-sm text-gray-500 mt-3 font-medium">{{ t('membership.qr_code_expires') }}</p>
              </div>

              <!-- 支付说明 -->
              <div class="mt-4">
                <h4 class="text-lg font-bold text-white mb-1">{{ t('membership.use_alipay_scan') }}</h4>
                <p class="text-gray-400 text-sm">{{ t('membership.open_alipay_scan') }}</p>
              </div>
            </div>

            <!-- 支付状态检测 -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-3 mt-4">
              <div class="flex items-center">
                <div class="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p class="text-white text-sm font-medium">{{ t('membership.checking_payment_status') }}</p>
                  <p class="text-gray-400 text-xs">{{ t('membership.auto_activate_after_payment') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 支付成功页面 -->
          <div v-else-if="currentStep === 'success'" class="p-6 text-center">
            <!-- 成功图标 -->
            <div class="flex justify-center mb-4">
              <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <i class="ri-check-line text-white text-2xl"></i>
              </div>
            </div>

            <!-- 成功信息 -->
            <div class="mb-4">
              <h3 class="text-xl font-bold text-white mb-1">{{ t('membership.payment_success_title') }}</h3>
              <p class="text-gray-400 text-sm">{{ t('membership.payment_success_message') }}</p>
            </div>

            <!-- 会员信息 -->
            <div v-if="currentOrder" class="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-4">
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-400 text-sm">{{ t('membership.activate_plan') }}</span>
                  <span class="text-white font-medium text-sm">{{ currentOrder.plan?.name }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-400 text-sm">{{ t('membership.payment_amount') }}</span>
                  <span class="text-green-400 font-bold text-base">¥{{ currentOrder.amount }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-400 text-sm">{{ t('membership.bonus_points') }}</span>
                  <span class="text-yellow-400 font-bold text-sm">+{{ Math.floor(currentOrder.amount * 10) }} {{ t('membership.points_unit') }}</span>
                </div>
              </div>
            </div>

            <!-- 倒计时提示 -->
            <div class="bg-gray-800 border border-gray-700 rounded-xl p-3">
              <div class="flex items-center justify-center space-x-2">
                <i class="ri-time-line text-blue-400"></i>
                <span class="text-gray-300 font-medium text-sm">{{ t('membership.countdown_redirect', { seconds: countdown }) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部固定按钮区域 -->
        <div class="p-6 border-t border-gray-700 bg-gray-900">
          <!-- 用户协议 (仅在套餐选择页面显示) -->
          <div v-if="currentStep === 'plans' && selectedPlan" class="mb-4">
            <div class="flex items-start space-x-3">
              <button
                @click="toggleAgreement"
                class="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 mt-0.5 flex-shrink-0"
                :class="agreementAccepted
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-500 hover:border-blue-400'"
              >
                <i v-if="agreementAccepted" class="ri-check-line text-white text-xs"></i>
              </button>
              <div class="flex-1">
                <p class="text-gray-300 text-xs leading-relaxed">
                  {{ t('membership.i_agree') }}
                  <a href="#" class="text-blue-400 hover:text-blue-300 underline font-medium" @click.prevent="showAgreement">
                    {{ t('membership.user_service_agreement') }}
                  </a>
                  {{ t('membership.and') }}
                  <a href="#" class="text-blue-400 hover:text-blue-300 underline font-medium" @click.prevent="showPrivacyPolicy">
                    {{ t('membership.privacy_policy_link') }}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <!-- 套餐选择页面按钮 -->
          <button
            v-if="currentStep === 'plans'"
            @click="canProceedToPayment ? proceedToPayment() : null"
            :disabled="!canProceedToPayment"
            class="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300"
            :class="canProceedToPayment
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'"
          >
            <span v-if="!selectedPlan">Please select a plan</span>
            <span v-else-if="!agreementAccepted">Please agree to terms</span>
            <span v-else>Continue</span>
          </button>

          <!-- 支付方式选择页面按钮 -->
          <button
            v-else-if="currentStep === 'payment'"
            @click="selectedPaymentMethod ? createOrder() : null"
            :disabled="!selectedPaymentMethod || creatingOrder"
            class="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300"
            :class="selectedPaymentMethod && !creatingOrder
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'"
          >
            <div v-if="creatingOrder" class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {{ t('membership.creating_order') }}
            </div>
            <span v-else-if="selectedPaymentMethod">Confirm Payment</span>
            <span v-else>Select payment method</span>
          </button>

          <!-- 支付成功页面按钮 -->
          <button
            v-else-if="currentStep === 'success'"
            @click="goToProfile"
            class="w-full py-3 rounded-xl font-semibold text-base transition-all duration-300 bg-green-600 text-white hover:bg-green-700"
          >
            {{ t('membership.go_to_profile') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership, type MembershipPlan } from '@/api'

const { t } = useEnhancedI18n()

// Props
const props = defineProps<{
  visible: boolean
  isPremium?: boolean
  repayOrderData?: any  // 重新支付的订单数据
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// 状态管理
const currentStep = ref<'plans' | 'payment' | 'alipay' | 'success'>('plans')  // 添加成功页面步骤
const loading = ref(false)
const creatingOrder = ref(false)
const qrCodeLoading = ref(false)

// 成功页面倒计时
const countdown = ref(5)
const countdownTimer = ref<NodeJS.Timeout | null>(null)

// 套餐相关
const plans = ref<MembershipPlan[]>([])
const selectedPlan = ref<MembershipPlan | null>(null)

// 支付相关
const selectedPaymentMethod = ref<string>('')
const currentOrder = ref<any>(null)
const qrCodeUrl = ref<string>('')

// 协议相关
const agreementAccepted = ref<boolean>(false)

// 支付状态检查定时器
let paymentCheckInterval: NodeJS.Timeout | null = null

// 支付成功标志，防止重复处理
let paymentSuccessHandled = false

// 计算属性：是否是重新支付模式
const isRepayMode = computed(() => !!props.repayOrderData)

// 获取会员套餐列表
const fetchPlans = async () => {
  try {
    loading.value = true
    const response = await membership.getPlans()

    if (response.status === 'success') {
      plans.value = response.data
      console.log('成功获取套餐:', plans.value.length, '个')
    } else {
      console.error('套餐API返回错误:', response)
    }
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 选择套餐
const selectPlan = (plan: MembershipPlan) => {
  selectedPlan.value = plan
}

// 计算属性：是否可以进入支付
const canProceedToPayment = computed(() => {
  return selectedPlan.value && agreementAccepted.value
})

// 协议相关函数
const toggleAgreement = () => {
  agreementAccepted.value = !agreementAccepted.value
}

const showAgreement = () => {
  // 打开服务协议页面
  window.open('https://www.cooltrade.xyz/terms-of-service/', '_blank')
}

const showPrivacyPolicy = () => {
  // 打开隐私政策页面
  window.open('https://www.cooltrade.xyz/privacy-policy/', '_blank')
}

// 进入支付页面
const proceedToPayment = () => {
  currentStep.value = 'payment'
}

// 返回套餐选择
const goBackToPlans = () => {
  currentStep.value = 'plans'
  selectedPaymentMethod.value = ''
}

// 返回支付方式选择
const goBackToPayment = () => {
  currentStep.value = 'payment'
  // 清理支付相关状态
  currentOrder.value = null
  qrCodeUrl.value = ''
  if (paymentCheckInterval) {
    clearInterval(paymentCheckInterval)
    paymentCheckInterval = null
  }
}

// 选择支付方式
const selectPaymentMethod = (method: string) => {
  selectedPaymentMethod.value = method
}

// 创建订单
const createOrder = async () => {
  if (!selectedPlan.value || !selectedPaymentMethod.value) return

  try {
    creatingOrder.value = true
    const response = await membership.createOrder(selectedPlan.value.id, selectedPaymentMethod.value)

    if (response.status === 'success') {
      currentOrder.value = response.data
      console.log('=== 订单创建成功 ===')
      console.log('响应数据:', response)
      console.log('订单数据:', response.data)

      if (selectedPaymentMethod.value === 'alipay') {
        currentStep.value = 'alipay'
        await generateAlipayQRCode()
        startPaymentStatusCheck()
      }
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    alert(t('membership.create_order_failed'))
  } finally {
    creatingOrder.value = false
  }
}

// 生成支付宝二维码
const generateAlipayQRCode = async () => {
  if (!currentOrder.value) return

  try {
    qrCodeLoading.value = true

    console.log('=== 调试二维码生成 ===')
    console.log('当前订单数据:', currentOrder.value)
    console.log('payment_info:', currentOrder.value.payment_info)
    console.log('qr_code字段:', currentOrder.value.qr_code)

    // 从订单的payment_info中获取二维码
    if (currentOrder.value.payment_info && currentOrder.value.payment_info.qr_code) {
      console.log('从payment_info获取二维码:', currentOrder.value.payment_info.qr_code)
      qrCodeUrl.value = currentOrder.value.payment_info.qr_code
    } else if (currentOrder.value.qr_code) {
      // 从顶层获取二维码
      console.log('从顶层获取二维码:', currentOrder.value.qr_code)
      qrCodeUrl.value = currentOrder.value.qr_code
    } else {
      // 如果没有二维码信息，显示错误
      console.error('订单中没有支付宝二维码信息')
      console.error('完整订单数据:', JSON.stringify(currentOrder.value, null, 2))
      qrCodeUrl.value = ''
    }

    console.log('最终二维码URL:', qrCodeUrl.value)

    // 如果获取到了二维码URL，生成二维码图片
    if (qrCodeUrl.value) {
      try {
        // 使用免费的二维码生成API
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl.value)}`
        console.log('生成的二维码图片URL:', qrImageUrl)
        qrCodeUrl.value = qrImageUrl
      } catch (err) {
        console.error('生成二维码图片失败:', err)
      }
    }
  } catch (error) {
    console.error('生成支付宝二维码失败:', error)
  } finally {
    qrCodeLoading.value = false
  }
}


// 开始支付状态检查
const startPaymentStatusCheck = () => {
  if (paymentCheckInterval) {
    clearInterval(paymentCheckInterval)
  }

  paymentCheckInterval = setInterval(async () => {
    await checkPaymentStatus()
  }, 3000) // 每3秒检查一次
}

// 检查支付状态
const checkPaymentStatus = async () => {
  if (!currentOrder.value) return

  try {
    // 调用后端API检查订单状态
    const response = await membership.checkOrderStatus(currentOrder.value.order_id)

    if (response.status === 'success') {
      const paymentStatus = response.data.payment_status

      if (paymentStatus === 'paid' && !paymentSuccessHandled) {
        // 支付成功 - 立即停止轮询并标记已处理
        paymentSuccessHandled = true

        if (paymentCheckInterval) {
          clearInterval(paymentCheckInterval)
          paymentCheckInterval = null
        }

        console.log('支付成功，停止状态检查')

        // 跳转到成功页面
        currentStep.value = 'success'

        // 开始倒计时
        startSuccessCountdown()

        return // 确保不再继续执行
      }
    }
  } catch (error) {
    console.error('检查支付状态失败:', error)
  }
}

// 开始成功页面倒计时
const startSuccessCountdown = () => {
  countdown.value = 5

  countdownTimer.value = setInterval(() => {
    countdown.value--

    if (countdown.value <= 0) {
      // 倒计时结束，跳转到用户中心
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
      }

      // 通知父组件支付成功并关闭弹窗
      emit('success')
      emit('close')

      // 跳转到用户中心（ProfileView）
      // 这里可以通过路由跳转或者其他方式
      console.log('跳转到用户中心')
    }
  }, 1000) // 每秒更新一次
}

// 手动跳转到用户中心
const goToProfile = () => {
  // 清除倒计时
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }

  // 通知父组件支付成功并关闭弹窗
  emit('success')
  emit('close')

  console.log('手动跳转到用户中心')
}

// 获取页面标题
const getPageTitle = () => {
  switch (currentStep.value) {
    case 'plans':
      return t('membership.choose_plan')
    case 'payment':
      return t('membership.select_payment_method')
    case 'alipay':
      return t('membership.alipay_payment')
    default:
      return t('membership.upgrade_membership')
  }
}



// 处理返回按钮
const handleBack = () => {
  if (currentStep.value === 'plans') {
    // 第一步直接关闭
    emit('close')
  } else if (currentStep.value === 'payment') {
    // 第二步返回第一步
    goBackToPlans()
  } else if (currentStep.value === 'alipay') {
    // 第三步返回第二步
    goBackToPayment()
  }
}

// 重置状态
const resetState = () => {
  currentStep.value = 'plans'
  selectedPlan.value = null
  selectedPaymentMethod.value = ''
  currentOrder.value = null
  qrCodeUrl.value = ''
  agreementAccepted.value = false
  paymentSuccessHandled = false // 重置支付成功标志
  if (paymentCheckInterval) {
    clearInterval(paymentCheckInterval)
    paymentCheckInterval = null
  }
}

// 监听弹窗显示状态
watch(() => props.visible, async (newVisible) => {
  if (newVisible) {
    if (isRepayMode.value) {
      // 重新支付模式：直接跳转到支付宝支付步骤
      paymentSuccessHandled = false
      if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval)
        paymentCheckInterval = null
      }

      currentStep.value = 'alipay'
      currentOrder.value = props.repayOrderData
      selectedPaymentMethod.value = props.repayOrderData.payment_method
      await generateAlipayQRCode()
      startPaymentStatusCheck()
    } else {
      // 正常模式：从套餐选择开始
      resetState()
      fetchPlans()
    }
  } else {
    if (paymentCheckInterval) {
      clearInterval(paymentCheckInterval)
      paymentCheckInterval = null
    }
  }
})

// 组件挂载时获取套餐列表
onMounted(() => {
  if (props.visible) {
    fetchPlans()
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (paymentCheckInterval) {
    clearInterval(paymentCheckInterval)
    paymentCheckInterval = null
  }

  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
})

</script>

<style scoped>
@media (max-width: 640px) {
  .max-w-xl {
    max-width: 100vw !important;
    border-radius: 0 !important;
    padding: 0 !important;
  }
}
</style>

