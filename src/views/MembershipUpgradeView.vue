<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="goBack" class="mr-2">
            <i class="ri-arrow-left-line ri-lg text-white"></i>
          </button>
          <h1 class="text-lg font-semibold text-white">Choose Plan</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-32">
      <div class="max-w-[375px] mx-auto px-4">
        <!-- 页面标题 -->
        <div class="text-center mb-6 mt-6">
          <h2 class="text-xl font-bold text-white mb-2">Select Membership Plan</h2>
          <p class="text-gray-400 text-sm">Unlock exclusive benefits</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="py-8 flex flex-col items-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
          <p class="text-gray-400 text-sm">Loading...</p>
        </div>

        <!-- 套餐列表 -->
        <div v-else-if="plans.length > 0" class="space-y-3 mb-6">
          <div
            v-for="plan in plans"
            :key="plan.id"
            @click="selectPlan(plan)"
            class="relative bg-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-300 border-2"
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
        <div v-if="selectedPlan" class="space-y-3 mb-6">
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
    </main>

    <!-- 底部固定按钮区域 -->
    <div class="fixed bottom-0 w-full bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800">
      <div class="max-w-[375px] mx-auto p-4">
        <!-- 用户协议 -->
        <div v-if="selectedPlan" class="mb-4">
          <div class="flex items-start space-x-3 cursor-pointer" @click="toggleAgreement">
            <div
              class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 mt-0.5 flex-shrink-0"
              :class="agreementAccepted
                ? 'bg-blue-500 border-blue-500'
                : 'border-gray-400 hover:border-blue-400'"
            >
              <i v-if="agreementAccepted" class="ri-check-line text-white text-sm"></i>
            </div>
            <div class="flex-1">
              <p class="text-gray-300 text-sm leading-relaxed">
                I have read and agree to
                <a href="#" class="text-blue-400 hover:text-blue-300 underline font-medium" @click.prevent.stop="showAgreement">
                  Terms of Service
                </a>
                and
                <a href="#" class="text-blue-400 hover:text-blue-300 underline font-medium" @click.prevent.stop="showPrivacyPolicy">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>

        <!-- 继续按钮 -->
        <button
          @click="handleContinueClick"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
import { membership, type MembershipPlan } from '@/api'

const { t } = useEnhancedI18n()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const plans = ref<MembershipPlan[]>([])
const selectedPlan = ref<MembershipPlan | null>(null)
const agreementAccepted = ref(false)

// 计算属性
const canProceedToPayment = computed(() => {
  return selectedPlan.value && agreementAccepted.value
})

// 方法
const goBack = () => {
  router.go(-1)
}

const selectPlan = (plan: MembershipPlan) => {
  console.log('Selecting plan:', plan)
  selectedPlan.value = plan
}

const toggleAgreement = () => {
  console.log('Toggling agreement, current:', agreementAccepted.value)
  agreementAccepted.value = !agreementAccepted.value
  console.log('Agreement now:', agreementAccepted.value)
}

const showAgreement = () => {
  // TODO: 显示用户协议
  console.log('Show agreement')
}

const showPrivacyPolicy = () => {
  // TODO: 显示隐私政策
  console.log('Show privacy policy')
}

const handleContinueClick = () => {
  console.log('Continue button clicked')
  console.log('Selected plan:', selectedPlan.value)
  console.log('Agreement accepted:', agreementAccepted.value)
  console.log('Can proceed:', canProceedToPayment.value)

  if (canProceedToPayment.value) {
    proceedToPayment()
  } else {
    console.log('Cannot proceed - conditions not met')
  }
}

const proceedToPayment = async () => {
  console.log('Proceeding to payment with plan:', selectedPlan.value)

  if (selectedPlan.value) {
    console.log('Navigating to payment page with planId:', selectedPlan.value.id)
    try {
      await router.push({
        name: 'payment',
        query: { planId: selectedPlan.value.id.toString() }
      })
      console.log('Navigation successful')
    } catch (error) {
      console.error('Navigation failed:', error)
      // 如果路由跳转失败，尝试使用路径跳转
      try {
        await router.push(`/payment?planId=${selectedPlan.value.id}`)
        console.log('Fallback navigation successful')
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError)
      }
    }
  } else {
    console.error('No plan selected')
  }
}

const loadPlans = async () => {
  loading.value = true
  try {
    const response = await membership.getPlans()
    if (response.status === 'success') {
      plans.value = response.data
    }
  } catch (error) {
    console.error('Failed to load plans:', error)
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadPlans()
})
</script>
