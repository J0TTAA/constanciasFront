<template>
  <footer class="login-footer">
    <div class="footer-content">
      <!-- Sección izquierda con información de contacto -->
      <div class="footer-left">
        <h3 class="footer-title">Contáctanos</h3>
        <div class="contact-info">
          <div class="contact-item">
            <v-icon class="contact-icon" size="20">mdi-phone</v-icon>
            <span>45 2 744240</span>
          </div>
          <div class="contact-item">
            <v-icon class="contact-icon" size="20">mdi-email</v-icon>
            <span>doctoradocrn@ufrontera.cl</span>
          </div>
          <div class="contact-item">
            <v-icon class="contact-icon" size="20">mdi-instagram</v-icon>
            <span>@doctoradorecursosnaturales</span>
          </div>
        </div>
      </div>

      <!-- Separador vertical -->
      <div class="footer-divider"></div>

      <!-- Sección derecha con imágenes -->
      <div class="footer-right">
        <img src="/images/barra-izq.png" alt="Barra izquierda" class="footer-image" />
        <img src="/images/barra-der.png" alt="Barra derecha" class="footer-image" />
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Componente Footer para la página de login
</script>

<style scoped>
.login-footer {
  background: linear-gradient(135deg, #1e5a3d 0%, #123025 100%);
  color: white;
  padding: 32px 24px;
  position: relative;
  overflow: hidden;
  margin-top: 80px;
  width: 100%;
  flex-shrink: 0;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
  position: relative;
  z-index: 2;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.contact-icon {
  color: #d4af37;
  background: rgba(212, 175, 55, 0.2);
  border-radius: 50%;
  padding: 8px;
}

.footer-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.3);
  height: 100%;
  min-height: 200px;
}

.footer-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.footer-image {
  max-width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: contain;
}

/* Responsive */
@media (max-width: 960px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .footer-divider {
    display: none;
  }

  .footer-right {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .footer-image {
    max-height: 150px;
  }
}

@media (max-width: 600px) {
  .login-footer {
    padding: 24px 16px;
  }

  .footer-right {
    flex-direction: column;
    gap: 12px;
  }

  .footer-image {
    max-height: 120px;
  }
}
</style>

