# GoogleDork

Panel web multi-motor para explorar, buscar y probar dorks organizados por motor y categoría.

![Tests](https://img.shields.io/badge/tests-38%20unit%20%2B%2010%20e2e-brightgreen)

## Características

- ✅ 233 dorks en 11 motores: Google, Bing, DuckDuckGo, Yandex, Shodan, Censys, GitHub, FOFA, ZoomEye, crt.sh y Wayback Machine.
- ✅ Barra de pestañas por motor con color distintivo y conteo de dorks.
- ✅ Organización por categorías dentro de cada motor.
- ✅ Búsqueda en tiempo real por operador, descripción o ejemplo (se conserva al cambiar de motor).
- ✅ Filtros por categoría con conteo.
- ✅ Botón para copiar el ejemplo al portapapeles.
- ✅ Botón para probar el dork directamente en su motor (FOFA codifica la consulta en Base64).
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

Los dorks son herramientas legítimas de investigación y auditoría de seguridad. Úsalos únicamente en sistemas que te pertenezcan o con autorización explícita del propietario.

## Licencia

MIT
