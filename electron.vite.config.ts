import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': path.resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': path.resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@components': path.resolve('src/renderer/src/components'),
        '@': path.resolve('src/renderer/src'),
        '@lib': path.resolve('src/renderer/lib'),
        '@shared': path.resolve('src/shared')
      }
    },
    plugins: [svelte()]
  }
})
