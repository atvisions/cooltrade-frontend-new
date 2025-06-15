<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/profile')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">{{ t('auth.change_password') }}</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <div v-if="!isLoggedIn" class="text-center py-8">
          <p class="text-gray-400 mb-4">{{ t('auth.please_login_first') }}</p>
          <router-link
            to="/login"
            class="inline-block py-2 px-6 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
          >
            {{ t('auth.login') }}
          </router-link>
        </div>

        <div v-else>
          <p class="text-gray-400 mb-6">{{ t('auth.enter_current_and_new_password') }}</p>

          <form @submit.prevent="handleChangePassword" class="space-y-6">
            <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {{ error }}
            </div>

            <div v-if="success" class="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {{ success }}
            </div>

            <div>
              <label for="current_password" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.current_password') }}</label>
              <input
                id="current_password"
                v-model="formData.current_password"
                type="password"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                required
              >
            </div>

            <div>
              <label for="new_password" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.new_password') }}</label>
              <input
                id="new_password"
                v-model="formData.new_password"
                type="password"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                required
              >
              <p class="mt-1 text-xs text-gray-500">{{ t('auth.password_requirements') }}</p>
            </div>

            <div>
              <label for="confirm_password" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.confirm_new_password') }}</label>
              <input
                id="confirm_password"
                v-model="formData.confirm_password"
                type="password"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                required
              >
            </div>

            <button
              type="submit"
              class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              :disabled="loading"
            >
              {{ loading ? t('common.submitting') : t('auth.change_password') }}
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/api'
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()
const router = useRouter()
const loading = ref(false)
const error = ref<string | undefined>(undefined)
const success = ref<string | undefined>(undefined)

const formData = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token')
})

const handleChangePassword = async () => {
  loading.value = true
  error.value = undefined
  success.value = undefined

  try {
    const response = await auth.changePassword({
      current_password: formData.value.current_password.trim(),
      new_password: formData.value.new_password.trim(),
      confirm_password: formData.value.confirm_password.trim()
    })

    if (response.status === 'success') {
      success.value = t('auth.password_changed')
      formData.value = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
    }
  } catch (err: any) {
    if (err.response?.data?.message) {
      if (typeof err.response.data.message === 'object') {
        const messages = Object.values(err.response.data.message).flat()
        if (messages.length > 0) {
          error.value = messages[0] as string
        }
      } else {
        error.value = err.response.data.message
      }
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail
    } else if (err.response?.status === 401) {
      error.value = t('errors.unauthorized')
    } else {
      error.value = t('errors.unknown_error')
    }
  } finally {
    loading.value = false
  }
}
</script>
