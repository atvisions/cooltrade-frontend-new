<template>
  <div class="space-y-4">
    <!-- 订单信息 -->
    <div class="bg-gray-800 rounded-lg p-4">
      <h4 class="text-white font-medium mb-2">{{ t('membership.order_created') }}</h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">订单号:</span>
          <span class="text-white">{{ orderId }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">金额:</span>
          <span class="text-yellow-400 font-bold">¥{{ amount }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-400">支付方式:</span>
          <span class="text-white">{{ getPaymentMethodName(paymentMethod) }}</span>
        </div>
      </div>
    </div>

    <!-- 支付宝扫码 -->
    <div v-if="paymentMethod === 'alipay'" class="text-center space-y-4">
      <div class="bg-white rounded-lg p-4 inline-block">
        <!-- 模拟二维码 -->
        <div class="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <i class="ri-qr-code-line text-6xl text-gray-500 mb-2"></i>
            <p class="text-gray-600 text-sm">支付宝扫码支付</p>
            <p class="text-gray-500 text-xs">¥{{ amount }}</p>
          </div>
        </div>
      </div>
      <p class="text-gray-400 text-sm">请使用支付宝扫描上方二维码完成支付</p>
      <p class="text-gray-500 text-xs">支付完成后会自动激活会员</p>
    </div>

    <!-- 银行转账 -->
    <div v-else-if="paymentMethod === 'bank_transfer'" class="space-y-4">
      <div class="bg-gray-800 rounded-lg p-4">
        <h5 class="text-white font-medium mb-3">银行转账信息</h5>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">收款银行:</span>
            <span class="text-white">中国工商银行</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">收款账号:</span>
            <span class="text-white">6222 0202 0000 1234 567</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">收款人:</span>
            <span class="text-white">Cooltrade</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">转账金额:</span>
            <span class="text-yellow-400 font-bold">¥{{ amount }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">转账备注:</span>
            <span class="text-white">{{ orderId }}</span>
          </div>
        </div>
      </div>
      <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <p class="text-yellow-400 text-sm">
          <i class="ri-information-line mr-1"></i>
          请在转账时务必填写订单号作为备注，以便我们及时处理您的订单
        </p>
      </div>
    </div>

    <!-- 微信好友 -->
    <div v-else-if="paymentMethod === 'wechat_friend'" class="space-y-4">
      <div class="bg-gray-800 rounded-lg p-4">
        <h5 class="text-white font-medium mb-3">微信好友转账</h5>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">微信号:</span>
            <span class="text-white">cooltrade_official</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">转账金额:</span>
            <span class="text-yellow-400 font-bold">¥{{ amount }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">转账备注:</span>
            <span class="text-white">{{ orderId }}</span>
          </div>
        </div>
      </div>
      <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
        <p class="text-green-400 text-sm">
          <i class="ri-information-line mr-1"></i>
          请添加微信好友后转账，并在转账时备注订单号
        </p>
      </div>
    </div>

    <!-- 其他方式 -->
    <div v-else-if="paymentMethod === 'other'" class="space-y-4">
      <div class="bg-gray-800 rounded-lg p-4">
        <h5 class="text-white font-medium mb-3">其他支付方式</h5>
        <div class="space-y-3 text-sm">
          <div>
            <span class="text-gray-400">联系客服:</span>
            <span class="text-white ml-2">service@cooltrade.xyz</span>
          </div>
          <div>
            <span class="text-gray-400">订单号:</span>
            <span class="text-white ml-2">{{ orderId }}</span>
          </div>
          <div>
            <span class="text-gray-400">金额:</span>
            <span class="text-yellow-400 font-bold ml-2">¥{{ amount }}</span>
          </div>
        </div>
      </div>
      <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p class="text-blue-400 text-sm">
          <i class="ri-information-line mr-1"></i>
          请联系客服获取其他支付方式，并提供订单号
        </p>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex space-x-3">
      <button 
        @click="$emit('back')"
        class="flex-1 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
      >
        {{ t('common.back') }}
      </button>
      <button 
        @click="confirmPayment"
        class="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
      >
        {{ t('membership.payment_success') }}
      </button>
    </div>

    <!-- 支付状态提示 -->
    <div class="bg-gray-800/50 rounded-lg p-3">
      <p class="text-gray-400 text-xs text-center">
        支付完成后，会员权限将在5分钟内自动激活
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()

// Props
const props = defineProps<{
  paymentMethod: string
  amount: string
  orderId: string
}>()

// Emits
const emit = defineEmits<{
  (e: 'payment-completed'): void
  (e: 'back'): void
}>()

// Methods
const getPaymentMethodName = (method: string) => {
  const methodMap: Record<string, string> = {
    alipay: t('membership.alipay'),
    bank_transfer: t('membership.bank_transfer'),
    wechat_friend: t('membership.wechat_friend'),
    other: t('membership.other')
  }
  return methodMap[method] || method
}

const confirmPayment = () => {
  // 这里是模拟支付完成，实际应用中应该有支付状态检查
  emit('payment-completed')
}
</script>
