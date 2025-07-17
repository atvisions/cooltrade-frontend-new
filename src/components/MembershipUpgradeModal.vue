<template>
  <div v-if="visible" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" @click="handleBackdropClick">
    <div class="bg-gray-900 rounded-lg w-full max-w-md h-[550px] overflow-hidden flex flex-col" @click.stop>
      <!-- 头部 -->
      <div class="p-4 border-b border-gray-800 flex justify-between items-center">
        <h3 class="text-lg font-medium text-white">
          {{ t('membership.upgrade_membership') }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white">
          <i class="ri-close-line text-xl"></i>
        </button>
      </div>

      <!-- 内容 -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- 会员套餐介绍 -->
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="ri-vip-crown-line text-2xl text-white"></i>
          </div>
          <h4 class="text-xl font-bold text-white mb-2">{{ t('membership.premium_benefits') }}</h4>
          <p class="text-gray-400 text-sm">{{ t('membership.premium_description') }}</p>
        </div>



        <!-- 微信购买说明 -->
        <div class="text-center mb-6">
          <div class="w-48 h-48 mx-auto mb-4 bg-white rounded-lg p-4">
            <img
              src="/icons/wechat.png"
              alt="WeChat QR Code"
              class="w-full h-full object-contain"
            />
          </div>
          <h5 class="text-lg font-semibold text-white mb-2">{{ t('membership.scan_to_purchase') }}</h5>
          <p class="text-gray-400 text-sm mb-4">{{ t('membership.wechat_purchase_guide') }}</p>
        </div>

        <!-- 购买须知 -->
        <div class="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h6 class="text-white font-medium mb-3 flex items-center">
            <i class="ri-information-line mr-2 text-blue-400"></i>
            {{ t('membership.purchase_notice') }}
          </h6>
          <div class="space-y-2 text-sm text-gray-400">
            <div class="flex items-start">
              <span class="text-yellow-400 mr-2">•</span>
              <span>{{ t('membership.monthly_price_notice') }}</span>
            </div>
            <div class="flex items-start">
              <span class="text-yellow-400 mr-2">•</span>
              <span>{{ t('membership.yearly_price_notice') }}</span>
            </div>
            <div class="flex items-start">
              <span class="text-yellow-400 mr-2">•</span>
              <span>{{ t('membership.points_reward_notice') }}</span>
            </div>
            <div class="flex items-start">
              <span class="text-yellow-400 mr-2">•</span>
              <span>{{ t('membership.activation_notice') }}</span>
            </div>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()

// Props
defineProps<{
  visible: boolean
  isPremium?: boolean
}>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

// 处理背景点击关闭
const handleBackdropClick = () => {
  emit('close')
}

</script>
