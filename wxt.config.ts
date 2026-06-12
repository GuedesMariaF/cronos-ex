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
    description: "Contabiliza o tempo gasto em cada aba do navegador de forma segura.",
    permissions: ["tabs", "storage", "alarms", "scripting", "idle"],
    host_permissions: ["http://127.0.0.1/*", "https://*/*"],
  },
  browser: "chrome",
});
