import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@mui/material",
      "@mui/system",
      "@mui/utils",
      "@emotion/react",
      "@emotion/styled",
      "@mui/x-date-pickers",
    ],
  },
  server: {
    port: 5173,
    open: true,
  },
});
