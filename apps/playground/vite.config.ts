import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  optimizeDeps: {
    include: ["@mui/material", "@mui/x-date-pickers"],
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),

      "@mui/material": path.resolve(__dirname, "./node_modules/@mui/material"),
      "@mui/x-date-pickers": path.resolve(__dirname, "./node_modules/@mui/x-date-pickers"),
      "@mui/x-date-pickers-pro": path.resolve(__dirname, "./node_modules/@mui/x-date-pickers-pro"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
