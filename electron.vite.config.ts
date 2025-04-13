import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import alias from "@rollup/plugin-alias";
import path from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@components": path.resolve("src/renderer/src/components"),
        "@lib": path.resolve("src/renderer/lib"),
      },
    },
    plugins: [
      svelte(),
      // {
      //   ...alias({
      //     entries: [
      //       {
      //         find: "@renderer",
      //         replacement: "src/renderer/src",
      //       },
      //     ],
      //   }),
      //   enforce: "pre",
      //   apply: "serve",
      // },
    ],
    // resolve: {
    //   alias: {
    //     $lib: path.resolve("./src/renderer/lib"),
    //   },
    // },
    // build: {
    //   rollupOptions: {
    //     plugins: [

    //     ],
    //   },
    // },
  },
});
