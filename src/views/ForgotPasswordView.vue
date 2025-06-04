<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="goToLogin()" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">{{ t('auth.forgot_password') }}</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">

        <!-- 一般性错误提示 -->
        <div v-if="generalError" class="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
          {{ generalError }}
        </div>

        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('auth.email') }}</label>
            <input
              type="email"
              v-model="formData.email"
              @input="handleEmailChange"
              required
              ref="emailInput"
              :class="[
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              ]"
              :placeholder="t('auth.email_placeholder')"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-500">{{ errors.email }}</p>
           </div>

          <div class="flex gap-2">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('auth.verification_code') }}</label>
              <input
                type="text"
                v-model="formData.code"
                @input="handleCodeChange"
                required
                ref="codeInput"
                :class="[
                  'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                  errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
                ]"
                :placeholder="t('auth.verification_code_placeholder')"
              />
              <p v-if="errors.code" class="mt-1 text-sm text-red-500">{{ errors.code }}</p>
            </div>
            <button
              type="button"
              @click="handleSendCode"
              :disabled="isSendingCode || countdown > 0"
              class="mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ countdown > 0 ? t('auth.retry_in_seconds', { seconds: countdown }) : (isSendingCode ? t('common.sending') : t('auth.send_code')) }}
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('auth.new_password') }}</label>
            <input
              type="password"
              v-model="formData.new_password"
              @input="handlePasswordChange"
              required
              ref="passwordInput"
              :class="[
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                errors.new_password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              ]"
              :placeholder="t('auth.new_password_placeholder')"
            />
            <p v-if="errors.new_password" class="mt-1 text-sm text-red-500">{{ errors.new_password }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ t('auth.password_requirements') }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">{{ t('auth.confirm_new_password') }}</label>
            <input
              type="password"
              v-model="formData.confirm_password"
              @input="handleConfirmPasswordChange"
              required
              ref="confirmPasswordInput"
              :class="[
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                errors.confirm_password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              ]"
              :placeholder="t('auth.confirm_new_password_placeholder')"
            />
            <p v-if="errors.confirm_password" class="mt-1 text-sm text-red-500">{{ errors.confirm_password }}</p>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            :disabled="loading"
          >
            {{ loading ? t('auth.resetting') : t('auth.reset_password') }}
          </button>
        </form>

        <!-- 重置成功弹窗 -->
        <div v-if="showSuccessModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div class="bg-gray-900 rounded-lg p-6 max-w-xs w-full mx-4">
            <div class="mb-4 flex justify-center">
              <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <i class="ri-check-line ri-2x text-green-500"></i>
              </div>
            </div>
            <h2 class="text-xl font-semibold mb-2 text-center">{{ t('auth.reset_success') }}</h2>
            <p class="text-gray-400 mb-6 text-center">{{ t('auth.reset_success_message') }}</p>
            <button
              @click="handleSuccessModalClose"
              class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            >
              {{ t('auth.back_to_login') }}
            </button>
          </div>
        </div>

        <div class="mt-6 text-center">
          <a href="#" @click.prevent="goToLogin()" class="text-primary hover:underline">
            {{ t('auth.back_to_login') }}
          </a>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 简化版本，暂时不使用 i18n 和 auth
const t = (key: string) => key

// 路由辅助函数
const goToLogin = () => router.push('/login')
const loading = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
const showSuccessModal = ref(false)

// 添加错误提示相关状态
const errors = ref({
  email: '',
  code: '',
  new_password: '',
  confirm_password: ''
})
const generalError = ref('')

// 添加输入框的引用，方便定位错误
const emailInput = ref<HTMLInputElement | null>(null)
const codeInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)
const confirmPasswordInput = ref<HTMLInputElement | null>(null)

const formData = ref({
  email: '',
  code: '',
  new_password: '',
  confirm_password: ''
})

// 清除错误信息
const clearErrors = () => {
  errors.value = {
    email: '',
    code: '',
    new_password: '',
    confirm_password: ''
  }
  generalError.value = ''
}

// 对错误字段进行聚焦
const focusErrorField = (field: 'email' | 'code' | 'new_password' | 'confirm_password') => {
  const inputRefs = {
    email: emailInput,
    code: codeInput,
    new_password: passwordInput,
    confirm_password: confirmPasswordInput
  }

  const targetInput = inputRefs[field]
  if (targetInput.value) {
    setTimeout(() => {
      targetInput.value?.focus()
    }, 100)
  }
}

// 保存表单数据到 localStorage
const saveFormData = () => {
  localStorage.setItem('resetPasswordFormData', JSON.stringify({
    email: formData.value.email,
    code: formData.value.code
  }))
}

// 从 localStorage 恢复表单数据
const restoreFormData = () => {
  const savedData = localStorage.getItem('resetPasswordFormData')
  if (savedData) {
    try {
      const { email, code } = JSON.parse(savedData)
      formData.value.email = email || ''
      formData.value.code = code || ''
    } catch (e) {
    }
  }
}

// 监听输入变化时清除对应字段的错误提示
const handleEmailChange = () => {
  errors.value.email = ''
  generalError.value = ''
  saveFormData()
}

const handleCodeChange = () => {
  errors.value.code = ''
  generalError.value = ''
  saveFormData()
}

const handlePasswordChange = () => {
  errors.value.new_password = ''
  generalError.value = ''
}

const handleConfirmPasswordChange = () => {
  errors.value.confirm_password = ''
  generalError.value = ''
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleSendCode = async () => {
  clearErrors()

  if (!formData.value.email) {
    errors.value.email = 'Email is required'
    focusErrorField('email')
    return
  }

  isSendingCode.value = true
  try {
    // 模拟 API 调用
    console.log('Sending reset code to:', formData.value.email)
    await new Promise(resolve => setTimeout(resolve, 1000))

    startCountdown()
    generalError.value = ''
  } catch (error: any) {
    console.error('Send code error:', error)
    generalError.value = 'Failed to send verification code'
  } finally {
    isSendingCode.value = false
  }
}

const handleResetPassword = async () => {
  clearErrors()

  // 简单表单验证
  let hasError = false

  if (!formData.value.email) {
    errors.value.email = 'Email is required'
    if (!hasError) {
      focusErrorField('email')
      hasError = true
    }
  }

  if (!formData.value.code) {
    errors.value.code = 'Verification code is required'
    if (!hasError) {
      focusErrorField('code')
      hasError = true
    }
  }

  if (!formData.value.new_password) {
    errors.value.new_password = 'Password is required'
    if (!hasError) {
      focusErrorField('new_password')
      hasError = true
    }
  }

  if (!formData.value.confirm_password) {
    errors.value.confirm_password = 'Confirm password is required'
    if (!hasError) {
      focusErrorField('confirm_password')
      hasError = true
    }
  } else if (formData.value.new_password !== formData.value.confirm_password) {
    errors.value.confirm_password = 'Passwords do not match'
    if (!hasError) {
      focusErrorField('confirm_password')
      hasError = true
    }
  }

  if (hasError) return

  loading.value = true
  try {
    // 模拟 API 调用
    console.log('Reset password for:', formData.value.email)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 清除保存的表单数据
    localStorage.removeItem('resetPasswordFormData')
    // 显示成功弹窗
    showSuccessModal.value = true
  } catch (error: any) {
    console.error('Reset password error:', error)
    generalError.value = 'Failed to reset password'
  } finally {
    loading.value = false
  }
}

const handleSuccessModalClose = () => {
  showSuccessModal.value = false
  goToLogin()
}

// 组件挂载时恢复表单数据
onMounted(() => {
  restoreFormData()
})
</script>
