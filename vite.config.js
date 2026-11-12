import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/birthday/",
  plugins: [react()],
  build: {
    target: "es2020",
    assetsInlineLimit: 4096,
  },
});
