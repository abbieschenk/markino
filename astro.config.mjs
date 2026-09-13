import node from "@astrojs/node";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  integrations: [svelte()],
  output: "server",
  vite: {
    optimizeDeps: {
      include: [],
    },
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname,
      },
    },
  },
});
