import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import dotenv from 'dotenv'
// .env 파일 로드
dotenv.config()
// VITE_API_BASE_URL을 변수로 정의
const apiBaseUrl = process.env.VITE_API_BASE_URL
// Vite 설정
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: apiBaseUrl,  // 정의된 변수 사용
        changeOrigin: true, // 필요시 추가
        secure: false, // 필요시 추가
      },
    },
  },
})