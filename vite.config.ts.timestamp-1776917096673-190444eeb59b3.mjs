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
    host: "127.0.0.1",
    // Usar IPv4 explícitamente para evitar problemas con ::1 (IPv6)
    port: 3e3,
    // Cambiado a 3000 para evitar problemas de permisos en Windows
    proxy: {
      // Proxy para todas las rutas de la API (puerto 3020)
      "/api/v1": {
        target: "http://127.0.0.1:3020",
        // Usar IPv4 explícitamente
        changeOrigin: true,
        secure: false,
        // Reescribir la URL para mantener el path completo
        rewrite: (path) => path,
        // Configuración adicional para mejorar la conexión
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.log("\u26A0\uFE0F [Vite Proxy] Error de conexi\xF3n con el backend:", err.message);
            console.log("\u{1F4A1} Aseg\xFArate de que el backend est\xE9 corriendo en http://127.0.0.1:3020");
            if (!res.headersSent) {
              res.writeHead(503, {
                "Content-Type": "application/json"
              });
              res.end(
                JSON.stringify({
                  error: "Backend no disponible",
                  message: "El servidor backend no est\xE1 corriendo. Por favor, inicia el backend en el puerto 3020."
                })
              );
            }
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log(`\u{1F504} [Vite Proxy] ${req.method} ${req.url} \u2192 http://127.0.0.1:3020${req.url}`);
          });
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx1bml2ZXJzaWRhZFxcXFxjb25zdGFuY2lhc0Zyb250XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFx1bml2ZXJzaWRhZFxcXFxjb25zdGFuY2lhc0Zyb250XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi91bml2ZXJzaWRhZC9jb25zdGFuY2lhc0Zyb250L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB2dWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnXG5cbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIHZ1ZURldlRvb2xzKCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICB9LFxuICB9LFxuICAvLyBcdTI2QTBcdUZFMEYgUFJPWFkgU09MTyBQQVJBIERFU0FSUk9MTE8gLSBOTyBFUyBMQSBTT0xVQ0lcdTAwRDNOIERFRklOSVRJVkFcbiAgLy8gRXN0byBldml0YSBDT1JTIGVuIGRlc2Fycm9sbG8sIHBlcm8gZW4gcHJvZHVjY2lcdTAwRjNuIGVsIGJhY2tlbmQgREVCRSB0ZW5lciBDT1JTIGNvbmZpZ3VyYWRvXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6ICcxMjcuMC4wLjEnLCAvLyBVc2FyIElQdjQgZXhwbFx1MDBFRGNpdGFtZW50ZSBwYXJhIGV2aXRhciBwcm9ibGVtYXMgY29uIDo6MSAoSVB2NilcbiAgICBwb3J0OiAzMDAwLCAvLyBDYW1iaWFkbyBhIDMwMDAgcGFyYSBldml0YXIgcHJvYmxlbWFzIGRlIHBlcm1pc29zIGVuIFdpbmRvd3NcbiAgICBwcm94eToge1xuICAgICAgLy8gUHJveHkgcGFyYSB0b2RhcyBsYXMgcnV0YXMgZGUgbGEgQVBJIChwdWVydG8gMzAyMClcbiAgICAgICcvYXBpL3YxJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjMwMjAnLCAvLyBVc2FyIElQdjQgZXhwbFx1MDBFRGNpdGFtZW50ZVxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIC8vIFJlZXNjcmliaXIgbGEgVVJMIHBhcmEgbWFudGVuZXIgZWwgcGF0aCBjb21wbGV0b1xuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aCxcbiAgICAgICAgLy8gQ29uZmlndXJhY2lcdTAwRjNuIGFkaWNpb25hbCBwYXJhIG1lam9yYXIgbGEgY29uZXhpXHUwMEYzblxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcdTI2QTBcdUZFMEYgW1ZpdGUgUHJveHldIEVycm9yIGRlIGNvbmV4aVx1MDBGM24gY29uIGVsIGJhY2tlbmQ6JywgZXJyLm1lc3NhZ2UpXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHVEODNEXHVEQ0ExIEFzZWdcdTAwRkFyYXRlIGRlIHF1ZSBlbCBiYWNrZW5kIGVzdFx1MDBFOSBjb3JyaWVuZG8gZW4gaHR0cDovLzEyNy4wLjAuMTozMDIwJylcbiAgICAgICAgICAgIC8vIE5vIGVudmlhciByZXNwdWVzdGEgc2kgeWEgc2UgZW52aVx1MDBGM1xuICAgICAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDMsIHtcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIGVycm9yOiAnQmFja2VuZCBubyBkaXNwb25pYmxlJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdFbCBzZXJ2aWRvciBiYWNrZW5kIG5vIGVzdFx1MDBFMSBjb3JyaWVuZG8uIFBvciBmYXZvciwgaW5pY2lhIGVsIGJhY2tlbmQgZW4gZWwgcHVlcnRvIDMwMjAuJyxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXEnLCAocHJveHlSZXEsIHJlcSwgX3JlcykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1REQwNCBbVml0ZSBQcm94eV0gJHtyZXEubWV0aG9kfSAke3JlcS51cmx9IFx1MjE5MiBodHRwOi8vMTI3LjAuMC4xOjMwMjAke3JlcS51cmx9YClcbiAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVIsU0FBUyxlQUFlLFdBQVc7QUFFeFQsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8saUJBQWlCO0FBSm1KLElBQU0sMkNBQTJDO0FBTzVOLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxJQUNKLFlBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLElBQ3REO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQSxFQUdBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxNQUVMLFdBQVc7QUFBQSxRQUNULFFBQVE7QUFBQTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBO0FBQUEsUUFFUixTQUFTLENBQUMsU0FBUztBQUFBO0FBQUEsUUFFbkIsV0FBVyxDQUFDLE9BQU8sYUFBYTtBQUM5QixnQkFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLE1BQU0sUUFBUTtBQUNwQyxvQkFBUSxJQUFJLGtFQUFxRCxJQUFJLE9BQU87QUFDNUUsb0JBQVEsSUFBSSxxRkFBd0U7QUFFcEYsZ0JBQUksQ0FBQyxJQUFJLGFBQWE7QUFDcEIsa0JBQUksVUFBVSxLQUFLO0FBQUEsZ0JBQ2pCLGdCQUFnQjtBQUFBLGNBQ2xCLENBQUM7QUFDRCxrQkFBSTtBQUFBLGdCQUNGLEtBQUssVUFBVTtBQUFBLGtCQUNiLE9BQU87QUFBQSxrQkFDUCxTQUFTO0FBQUEsZ0JBQ1gsQ0FBQztBQUFBLGNBQ0g7QUFBQSxZQUNGO0FBQUEsVUFDRixDQUFDO0FBQ0QsZ0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFNBQVM7QUFDNUMsb0JBQVEsSUFBSSwwQkFBbUIsSUFBSSxNQUFNLElBQUksSUFBSSxHQUFHLGdDQUEyQixJQUFJLEdBQUcsRUFBRTtBQUFBLFVBQzFGLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
