# Lingua Deck

Standalone Vue 3 + Tailwind app gathering the Lingua Libre modules split from
[lingualibre.org](https://gitlab.wikimedia.org/repos/wikimedia-france/lingua-libre/lingualibre.org):
gallery, dictionary, dashboard, transparency, categories, logs.

## Develop

```
cp .env.example .env
npm install
npm run dev        # http://localhost:8080
```

Or with Docker: `docker compose up`.

## Scripts

`build`, `preview`, `test:unit`, `test:e2e`, `lint`, `format`.

## CI / deploy

GitHub Actions: `.github/workflows/ci.yml` (lint, test, build) and
`.github/workflows/pages.yml` (GitHub Pages on `main`; enable Pages with source "GitHub Actions").
