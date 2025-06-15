<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/login')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">{{ t('auth.forgot_password') }}</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <!-- Logo和应用名称 -->
        <div class="flex flex-col items-center justify-center mt-8 mb-6">
          <img src="/icons/icon128.png" alt="Cooltrade Logo" class="w-16 h-16 mb-2 rounded-lg shadow-lg" />
          <div class="text-2xl font-bold text-white tracking-wide mb-1">Cooltrade</div>
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
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none transition-colors',
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
                  'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none transition-colors',
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
              class="mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none transition-colors',
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
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none transition-colors',
                errors.confirm_password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              ]"
              :placeholder="t('auth.confirm_new_password_placeholder')"
            />
            <p v-if="errors.confirm_password" class="mt-1 text-sm text-red-500">{{ errors.confirm_password }}</p>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="loading"
          >
            {{ loading ? t('common.submitting') : t('auth.reset_password') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-400">
            {{ t('auth.remember_password') }}
            <a href="#" @click.prevent="goToLogin" class="text-primary hover:underline">{{ t('auth.login_now') }}</a>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/api'
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()
const router = useRouter()
const loading = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)

const formData = ref({
  email: '',
  code: '',
  new_password: '',
  confirm_password: ''
})

const errors = ref({
  email: '',
  code: '',
  new_password: '',
  confirm_password: ''
})

const emailInput = ref<HTMLInputElement | null>(null)
const codeInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)
const confirmPasswordInput = ref<HTMLInputElement | null>(null)

const goToLogin = () => {
  router.push('/login')
}

const handleEmailChange = () => {
  errors.value.email = ''
}

const handleCodeChange = () => {
  errors.value.code = ''
}

const handlePasswordChange = () => {
  errors.value.new_password = ''
}

const handleConfirmPasswordChange = () => {
  errors.value.confirm_password = ''
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
  if (!formData.value.email) {
    errors.value.email = t('errors.email_required')
    emailInput.value?.focus()
    return
  }

  isSendingCode.value = true
  try {
    await auth.sendCode({
      email: formData.value.email.trim()
    })
    startCountdown()
  } catch (err: any) {
    if (err.response?.data?.message) {
      if (typeof err.response.data.message === 'object') {
        const messages = Object.values(err.response.data.message).flat()
        if (messages.length > 0) {
          errors.value.email = messages[0] as string
        }
      } else {
        errors.value.email = err.response.data.message
      }
    }
  } finally {
    isSendingCode.value = false
  }
}

const handleResetPassword = async () => {
  loading.value = true
  Object.keys(errors.value).forEach(key => {
    errors.value[key as keyof typeof errors.value] = ''
  })

  try {
    const response = await auth.resetPasswordWithCode({
      email: formData.value.email.trim(),
      code: formData.value.code.trim(),
      new_password: formData.value.new_password.trim(),
      confirm_password: formData.value.confirm_password.trim()
    })

    if (response.status === 'success') {
      router.push('/login')
    }
  } catch (err: any) {
    if (err.response?.data?.message) {
      if (typeof err.response.data.message === 'object') {
        Object.entries(err.response.data.message).forEach(([key, value]) => {
          if (key in errors.value) {
            errors.value[key as keyof typeof errors.value] = Array.isArray(value) ? value[0] : value
          }
        })
      }
    }
  } finally {
    loading.value = false
  }
}
</script>
