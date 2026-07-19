import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Must match your GitHub repo name so assets resolve at
  // https://<username>.github.io/habit-tracker/
  base: '/habit-tracker/',
})
