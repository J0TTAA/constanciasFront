// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///D:/universidad/constanciasFront/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/universidad/constanciasFront/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueDevTools from "file:///D:/universidad/constanciasFront/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_import_meta_url = "file:///D:/universidad/constanciasFront/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    vueDevTools()
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  // ⚠️ PROXY SOLO PARA DESARROLLO - NO ES LA SOLUCIÓN DEFINITIVA
  // Esto evita CORS en desarrollo, pero en producción el backend DEBE tener CORS configurado
  server: {
    host: "localhost",
    // Usar localhost para consistencia con el backend
    port: 3e3,
    // Cambiado a 3000 para evitar problemas de permisos en Windows
    proxy: {
      // Proxy para el backend de constancias (puerto 3020)
      "/api/v1/constancias": {
        target: "http://localhost:3020",
        changeOrigin: true,
        secure: false,
        // Reescribir la URL para mantener el path completo
        rewrite: (path) => path
      },
      // Proxy para el backend de usuarios (creación de usuarios por admin)
      "/api/v1/usuarios": {
        target: "http://localhost:3020",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx1bml2ZXJzaWRhZFxcXFxjb25zdGFuY2lhc0Zyb250XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx1bml2ZXJzaWRhZFxcXFxjb25zdGFuY2lhc0Zyb250XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi91bml2ZXJzaWRhZC9jb25zdGFuY2lhc0Zyb250L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB2dWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnXG5cbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHZ1ZURldlRvb2xzKCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICB9LFxuICB9LFxuICAvLyBcdTI2QTBcdUZFMEYgUFJPWFkgU09MTyBQQVJBIERFU0FSUk9MTE8gLSBOTyBFUyBMQSBTT0xVQ0lcdTAwRDNOIERFRklOSVRJVkFcbiAgLy8gRXN0byBldml0YSBDT1JTIGVuIGRlc2Fycm9sbG8sIHBlcm8gZW4gcHJvZHVjY2lcdTAwRjNuIGVsIGJhY2tlbmQgREVCRSB0ZW5lciBDT1JTIGNvbmZpZ3VyYWRvXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICdsb2NhbGhvc3QnLCAvLyBVc2FyIGxvY2FsaG9zdCBwYXJhIGNvbnNpc3RlbmNpYSBjb24gZWwgYmFja2VuZFxuICAgIHBvcnQ6IDMwMDAsIC8vIENhbWJpYWRvIGEgMzAwMCBwYXJhIGV2aXRhciBwcm9ibGVtYXMgZGUgcGVybWlzb3MgZW4gV2luZG93c1xuICAgIHByb3h5OiB7XG4gICAgICAvLyBQcm94eSBwYXJhIGVsIGJhY2tlbmQgZGUgY29uc3RhbmNpYXMgKHB1ZXJ0byAzMDIwKVxuICAgICAgJy9hcGkvdjEvY29uc3RhbmNpYXMnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAyMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgLy8gUmVlc2NyaWJpciBsYSBVUkwgcGFyYSBtYW50ZW5lciBlbCBwYXRoIGNvbXBsZXRvXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLFxuICAgICAgfSxcbiAgICAgIC8vIFByb3h5IHBhcmEgZWwgYmFja2VuZCBkZSB1c3VhcmlvcyAoY3JlYWNpXHUwMEYzbiBkZSB1c3VhcmlvcyBwb3IgYWRtaW4pXG4gICAgICAnL2FwaS92MS91c3Vhcmlvcyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDIwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aCxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFSLFNBQVMsZUFBZSxXQUFXO0FBRXhULFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLGlCQUFpQjtBQUptSixJQUFNLDJDQUEyQztBQU81TixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxJQUN0RDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUEsRUFHQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsTUFFTCx1QkFBdUI7QUFBQSxRQUNyQixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUE7QUFBQSxRQUVSLFNBQVMsQ0FBQyxTQUFTO0FBQUEsTUFDckI7QUFBQTtBQUFBLE1BRUEsb0JBQW9CO0FBQUEsUUFDbEIsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxDQUFDLFNBQVM7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
