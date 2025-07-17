<template>
  <div class="bg-gray-800 rounded-lg p-6 mb-6">
    <h3 class="text-lg font-bold text-white mb-4">会员功能测试面板</h3>
    
    <!-- 当前状态显示 -->
    <div class="bg-gray-700 rounded-lg p-4 mb-4">
      <h4 class="text-white font-medium mb-2">当前状态</h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">会员状态:</span>
          <span :class="membershipStatus.is_premium_active ? 'text-yellow-400' : 'text-gray-300'">
            {{ membershipStatus.is_premium_active ? '高级会员' : '普通用户' }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">积分:</span>
          <span class="text-white">{{ membershipStatus.points }}</span>
        </div>
        <div v-if="membershipStatus.is_premium_active && membershipStatus.premium_expires_at" class="flex justify-between">
          <span class="text-gray-400">到期时间:</span>
          <span class="text-white">{{ formatDate(membershipStatus.premium_expires_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 测试按钮 -->
    <div class="grid grid-cols-2 gap-3">
      <button 
        @click="testGetMembershipStatus"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
      >
        获取会员状态
      </button>
      
      <button 
        @click="testGetPlans"
        class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
      >
        获取套餐列表
      </button>
      
      <button 
        @click="testSpendPoints"
        class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
      >
        消费积分测试
      </button>
      
      <button 
        @click="showUpgradeModal = true"
        class="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
      >
        打开升级弹窗
      </button>
    </div>

    <!-- 测试结果显示 -->
    <div v-if="testResult" class="mt-4 p-3 bg-gray-900 rounded-lg">
      <h5 class="text-white font-medium mb-2">测试结果:</h5>
      <pre class="text-xs text-gray-300 overflow-auto max-h-40">{{ JSON.stringify(testResult, null, 2) }}</pre>
    </div>

    <!-- 套餐列表显示 -->
    <div v-if="plans.length > 0" class="mt-4">
      <h5 class="text-white font-medium mb-2">可用套餐:</h5>
      <div class="space-y-2">
        <div v-for="plan in plans" :key="plan.id" class="bg-gray-700 rounded p-3">
          <div class="flex justify-between items-center">
            <div>
              <span class="text-white font-medium">{{ plan.name }}</span>
              <span class="text-gray-400 text-sm ml-2">({{ plan.plan_type }})</span>
            </div>
            <div class="text-right">
              <div class="text-yellow-400 font-bold">¥{{ plan.price }}</div>
              <div class="text-gray-400 text-xs">{{ plan.duration_days }}天</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 会员升级弹窗 -->
    <MembershipUpgradeModal 
      :visible="showUpgradeModal"
      :is-premium="membershipStatus.is_premium_active"
      @close="showUpgradeModal = false"
      @success="handleUpgradeSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { membership, pointsApi } from '@/api'
import type { MembershipPlan, UserMembershipStatus } from '@/api'
import MembershipUpgradeModal from './MembershipUpgradeModal.vue'

// 状态
const membershipStatus = ref<UserMembershipStatus>({
  id: 0,
  email: '',
  is_premium: false,
  premium_expires_at: undefined,
  membership_status: 'regular',
  is_premium_active: false,
  points: 0
})

const plans = ref<MembershipPlan[]>([])
const testResult = ref<any>(null)
const showUpgradeModal = ref(false)

// 格式化日期
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 测试函数
const testGetMembershipStatus = async () => {
  try {
    const response = await membership.getStatus()
    testResult.value = response
    if (response.status === 'success') {
      membershipStatus.value = response.data
    }
  } catch (error) {
    testResult.value = { error: error.message }
  }
}

const testGetPlans = async () => {
  try {
    const response = await membership.getPlans()
    testResult.value = response
    if (response.status === 'success') {
      plans.value = response.data
    }
  } catch (error) {
    testResult.value = { error: error.message }
  }
}

const testSpendPoints = async () => {
  try {
    const response = await pointsApi.spendPoints()
    testResult.value = response
    if (response.status === 'success') {
      // 更新积分 - 根据后端实际响应结构访问
      membershipStatus.value.points = (response as any).remaining_points
    }
  } catch (error) {
    testResult.value = { error: error.message }
  }
}

const handleUpgradeSuccess = async () => {
  showUpgradeModal.value = false
  await testGetMembershipStatus()
}

// 初始化
onMounted(async () => {
  await testGetMembershipStatus()
  await testGetPlans()
})
</script>
