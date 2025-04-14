import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@components': path.resolve('src/renderer/src/components'),
        '@lib': path.resolve('src/renderer/lib')
      }
    },
    plugins: [svelte()]
  }
})
