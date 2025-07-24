import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './', // 确保生成相对路径，适用于Chrome扩展
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5001,  // 修改为当前使用的端口
    host: true,
    // 移除代理配置，让前端直接使用环境变量中配置的API地址
    // 这样可以通过修改.env文件来控制API调用地址
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Chrome 插件需要特定的文件命名模式
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['element-plus']
        }
      }
    },
    // Chrome 插件特定配置
    target: 'es2015',
    cssCodeSplit: false
  },
  // 确保 public 目录中的文件被正确复制
  publicDir: 'public'
})
