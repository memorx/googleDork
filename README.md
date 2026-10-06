# GoogleDork

Panel web para explorar, buscar y probar Google Dorks organizados por categoría.

![Tests](https://img.shields.io/badge/tests-16%20unit%20%2B%205%20e2e-brightgreen)

## Características

- ✅ Colección completa de Google Dorks cubriendo todos los operadores principales.
- ✅ Organización por categorías: básicos, sitio/URL, título/texto, archivos, información, local/mapas, redes sociales, avanzados y seguridad.
- ✅ Búsqueda en tiempo real por operador, descripción o ejemplo.
- ✅ Filtros por categoría con conteo.
- ✅ Botón para copiar el ejemplo al portapapeles.
- ✅ Botón para probar el dork directamente en Google.
- ✅ Diseño responsivo (móvil, tablet, desktop).
- ✅ Modo oscuro automático.
- ✅ Tests unitarios y e2e con Vitest + Playwright.

## Tecnologías

- React + TypeScript + Vite
- Tailwind CSS v4
- Vitest + React Testing Library
- Playwright

## Uso local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## Tests

```bash
# Unitarios
npm test

# E2E
npm run test:e2e:ci
```

## Build

```bash
npm run build
npm run preview
```

## Advertencia ética

Los Google Dorks son herramientas legítimas de investigación y auditoría de seguridad. Úsalos únicamente en sistemas que te pertenezcan o con autorización explícita del propietario.

## Licencia

MIT
