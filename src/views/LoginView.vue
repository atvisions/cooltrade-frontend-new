<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">{{ t('auth.login') }}</h1>
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

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {{ error }}
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.email') }}</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              :placeholder="t('auth.email_placeholder')"
              required
            >
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label for="password" class="block text-sm font-medium text-gray-300">{{ t('auth.password') }}</label>
              <a href="#" @click.prevent="goToForgotPassword" class="text-xs text-primary hover:underline">{{ t('auth.forgot_password') }}</a>
            </div>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              :placeholder="t('auth.password_placeholder')"
              required
            >
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            :disabled="loading"
          >
            {{ loading ? t('common.loading') : t('auth.login') }}
          </button>


        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-400">
            {{ t('auth.no_account') }}
            <a href="#" @click.prevent="goToRegister" class="text-primary hover:underline">{{ t('auth.register_now') }}</a>
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
const error = ref<string | undefined>(undefined)

const formData = ref({
  email: '',
  password: ''
})

const goToRegister = () => {
  router.push('/register')
}

const goToForgotPassword = () => {
  router.push('/forgot-password')
}

const handleLogin = async () => {
  loading.value = true
  error.value = undefined

  try {
    const response = await auth.login({
      email: formData.value.email.trim(),
      password: formData.value.password.trim()
    })

    if (response.status === 'success' && response.data?.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('userInfo', JSON.stringify(response.data.user))
      router.push('/')
    } else {
      error.value = t('errors.login_failed_no_token')
    }
  } catch (err: any) {
    if (err.response?.data?.message) {
      if (typeof err.response.data.message === 'object') {
        const messages = Object.values(err.response.data.message).flat()
        if (messages.length > 0) {
          error.value = messages[0] as string
        } else {
          error.value = t('errors.login_failed_check_input')
        }
      } else {
        error.value = err.response.data.message
      }
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail
    } else if (err.response?.status === 401) {
      error.value = t('errors.email_or_password_incorrect')
    } else if (err.response?.status === 429) {
      error.value = t('errors.too_many_attempts')
    } else if (err.code === 'ECONNABORTED') {
      error.value = t('errors.connection_timeout')
    } else if (err.message.includes('Network Error')) {
      error.value = t('errors.network_error')
    } else {
      error.value = t('errors.login_failed')
    }
  } finally {
    loading.value = false
  }
}

</script>