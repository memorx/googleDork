# GoogleDork

Panel web multi-motor para explorar, buscar y probar dorks organizados por motor y categoría.

![Deploy](https://github.com/memorx/googleDork/actions/workflows/deploy.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-91%20unit%20%2B%2016%20e2e-brightgreen)

## Características

- ✅ 267 dorks en 16 motores: Google, Bing, DuckDuckGo, Yandex, Shodan, Censys, GitHub, FOFA, ZoomEye, crt.sh, Wayback Machine, Netlas, GreyNoise, BinaryEdge, PublicWWW y SearXNG.
- ✅ Barra de pestañas por motor con color distintivo y conteo de dorks.
- ✅ Organización por categorías dentro de cada motor (39 categorías).
- ✅ Recetas: combinaciones de dorks explicadas paso a paso, listas para copiar o probar.
- ✅ Búsqueda en tiempo real por operador, descripción o ejemplo (se conserva al cambiar de motor).
- ✅ Filtros por categoría con conteo.
- ✅ Botón para copiar el ejemplo al portapapeles.
- ✅ Botón para probar el dork directamente en su motor (FOFA codifica la consulta en Base64; Wayback y PublicWWW la envían como path).
- ✅ Constructor de dorks, historial de búsquedas y favoritos.
- ✅ Aviso de uso responsable y marcado de categorías sensibles.
- ✅ PWA: instalable y funcional offline tras la primera carga (service worker cache-first).
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

# E2E (requiere un build previo: corre vite preview en :4173)
npm run build
npm run test:e2e:ci
```

## Build

```bash
npm run build
npm run preview
```

## Deploy en GitHub Pages

El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) corre en cada push a `master`: `npm ci`, tests unitarios, build y deploy de `dist/` a GitHub Pages.

- El `base` de Vite pasa a `/googleDork/` solo cuando el build corre en GitHub Actions (`GITHUB_ACTIONS=true`); en local y en los tests e2e sigue siendo `/`.
- Para activarlo: en el repo, **Settings → Pages → Source: GitHub Actions**.
- La app queda en `https://memorx.github.io/googleDork/`.

### Iconos PWA

Los iconos PNG se generan desde el SVG de la lupa con Playwright:

```bash
node scripts/generate-icons.mjs
```

## Advertencia ética

Los dorks son herramientas legítimas de investigación y auditoría de seguridad. Úsalos únicamente en sistemas que te pertenezcan o con autorización explícita del propietario. Acceder a sistemas ajenos sin autorización es un delito (en México, art. 211 bis del Código Penal Federal).

## Licencia

MIT
