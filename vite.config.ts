import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
// En GitHub Actions el build sale con base /googleDork/ para GitHub Pages;
// en local (dev, build, preview de los tests e2e) la base sigue siendo /.
export default defineConfig(({ command }) => ({
  base: command === 'build' && process.env.GITHUB_ACTIONS === 'true' ? '/googleDork/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'e2e'],
    // Los tests de integración de App renderizan cientos de tarjetas en jsdom;
    // en máquinas lentas el render inicial supera los 5s por defecto.
    testTimeout: 20000,
  },
}))
