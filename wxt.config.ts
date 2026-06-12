import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: () => ({
    plugins: [react(), tailwindcss()],
  }),
  manifest: {
    name: "Cronos",
    version: "1.0.0",
    description: "Rastreia o tempo gasto em cada domínio navegado.",
    permissions: ["tabs", "storage", "alarms", "idle"],
  },
  browser: "chrome",
});
