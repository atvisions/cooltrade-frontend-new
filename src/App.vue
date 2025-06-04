<template>
  <div id="app" class="min-h-screen bg-dark-900 text-white">
    <!-- 主内容区域 -->
    <main class="min-h-screen">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('🎉 CoolTrade App mounted successfully!')
})
</script>


