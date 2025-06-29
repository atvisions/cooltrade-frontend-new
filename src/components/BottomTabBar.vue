<template>
  <nav class="fixed bottom-0 w-full z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 max-w-[375px] mx-auto">
    <div class="w-full">
      <div class="grid grid-cols-3 h-16">
        <router-link
          to="/"
          class="flex flex-col items-center justify-center"
          :class="isActive('/') ? 'text-blue-400 border-t-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'"
        >
          <i class="ri-line-chart-line text-lg"></i>
          <span class="text-xs mt-0.5">{{ t('nav.market') }}</span>
        </router-link>
        <router-link
          to="/points"
          class="flex flex-col items-center justify-center"
          :class="isActive('/points') ? 'text-primary border-t-2 border-primary' : 'text-slate-500 hover:text-slate-300'"
        >
          <i class="ri-coin-line text-lg"></i>
          <span class="text-xs mt-0.5">{{ t('nav.points') }}</span>
        </router-link>
        <router-link
          to="/profile"
          class="flex flex-col items-center justify-center"
          :class="isActive('/profile') ? 'text-primary border-t-2 border-primary' : 'text-slate-500 hover:text-slate-300'"
        >
          <i class="ri-settings-3-line text-lg"></i>
          <span class="text-xs mt-0.5">{{ t('nav.settings') }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'
const route = useRoute()
const { t } = useEnhancedI18n()
const isActive = (path: string) => route.path === path
</script> 