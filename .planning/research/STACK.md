# Stack Research

**Domain:** Browser-only EPUB reader, multi-output (drag-drop / library / solo single-file / EPUB-embedded)
**Researched:** 2026-04-26
**Confidence:** HIGH for build/test/lint toolchain; MEDIUM-HIGH for EPUB engine (epub.js raises a maintenance flag — see Open Question below)

> Locked decisions per `.planning/PROJECT.md` Constraints: TypeScript + Vite + Lit + epub.js + Vitest + Playwright. This document confirms current 2026 versions, identifies one decision that warrants a second look (epub.js), and prescribes versions/imports for everything around the bracket.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **TypeScript** | `^6.0.3` | Source language | TS 6 is the current stable line as of April 2026 (released April 2026). Brings improved decorator support and better ESM-only project ergonomics. Replaces the legacy 2013-era plain-ES5-with-AMD source. |
| **Vite** | `^8.0.10` | Build + dev server | Vite 8 (April 2026) is the standard modern bundler. Native ESM dev server, Rollup-based prod build, built-in HMR, library mode + multi-page-app modes both first-class. Replaces Grunt 0.4 + grunt-contrib-requirejs entirely. |
| **Lit** | `^3.3.2` | Web Component layer for reader/library UI chrome | Released December 2025. Standards-based custom elements, ~5 KB runtime, no virtual DOM, scoped styles via shadow DOM. Right tool for stateful chrome (font/size dropdowns, bookmarks panel, drag-drop overlay, TOC drawer) without pulling in a full framework. |
| **dart-sass** (`sass`) | `^1.99.0` | SCSS compilation | Vite consumes `sass` automatically when SCSS files are imported — no plugin needed. Drops Compass + Ruby SASS entirely. Compass mixins are replaced with PostCSS Autoprefixer + hand-written mixins. |
| **EPUB engine — see "Open Question" below** | — | OPF/NCX parsing, spine, locations, rendering | `epubjs@0.3.93` is the locked choice but its maintenance status is a concern. `@readium/navigator@2.5.0` is the actively maintained alternative. See dedicated section below. |
| **Vitest** | `^4.1.5` | Unit + component tests | Vitest 4 (April 2026) shares Vite's config/transform pipeline, so TS+Lit components transform identically in tests and prod. Native ESM, Jest-compatible API, real-browser mode via `@vitest/browser`. |
| **`@vitest/browser`** | `^4.1.5` | Browser-mode component tests | Pairs with Playwright as the browser provider. Mandatory for any test that touches layout, `getBoundingClientRect`, `ResizeObserver`, computed styles, scroll, or shadow DOM — JSDOM cannot do these. |
| **`@vitest/browser-playwright`** | `^4.1.5` | Provider glue between Vitest browser mode and Playwright | Vitest 4's split-out provider package; configure in `vitest.config.ts`. |
| **Playwright** | `^1.59.1` | E2E tests | The standard for cross-browser E2E in 2026. Drives Chromium, Firefox, WebKit from one API. Required for the cross-browser/desktop-mobile-tablet matrix in `PROJECT.md`. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **fflate** | `^0.8.2` | In-browser EPUB unzip (drag-drop flow) | Use everywhere zip handling is needed. Smaller, faster, and ESM-native compared to JSZip; supports streaming + sync + worker-async paths. fflate's main-thread async actually yields between chunks, so even file:// / solo builds (where Web Workers are unreliable) stay responsive. |
| **fast-xml-parser** | `^5.7.2` | OPF / NCX / container.xml parsing in the Node manifest generator | Pure JS, zero deps, TS types built-in, actively maintained (last published 2026-04-24). Object-shape output is much easier to consume from a TS manifest builder than DOM nodes. Use this for the build-time `manifest.json` generator that replaces `manifest.maker.py`. |
| **Browser DOMParser** | native | Runtime OPF/XHTML parsing inside the reader | Don't ship an XML parser to the client. Use `new DOMParser().parseFromString(xml, 'application/xml')` — it's already in every supported browser. |
| **vite-plugin-singlefile** | `^2.3.3` | Solo single-file HTML build | Inlines all JS + CSS into one `index.html`, deletes the standalone chunks. Maintained, current, the de-facto standard. Pair with raised `build.assetsInlineLimit` to inline images/fonts as data URIs. |
| **`@readium/navigator`** + `@readium/shared` + `@readium/navigator-html-injectables` + `@readium/css` | `^2.5.0` / `^2.2.0` / `^2.4.0` / `^2.0.2` | EPUB engine alternative if epub.js is rejected | See "Open Question" below. Active, BSD-3 licensed, TS-native, used in production by Thorium Web (EDRLab) and NYPL Web Reader. |
| **construct-style-sheets-polyfill** | `^3.1.0` | CSSStyleSheet polyfill for older Safari | Only if Browserslist target inclusion of older Safari demands it; modern Safari (>=16.4) supports adoptedStyleSheets natively. Lit ships its own check; usually unnecessary for "last 2 versions" target. |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **Node** | LTS 22.x (current LTS at April 2026) | Build/test runtime | Pin via `.nvmrc` to `22` (or `lts/*`). Drops the absurd `0.11.16` pin. Vite 8 requires Node 20.19+. |
| **pnpm** | `^9` (or npm 10+ if pnpm not preferred) | Package manager + lockfile | pnpm gives a deterministic, content-addressed lockfile and avoids the missing-lockfile situation in the legacy repo. npm 10 with `package-lock.json` is fine if a single package manager is preferred. |
| **ESLint** | `^10.2.1` | Linting (flat config) | ESLint 10 (April 2026). Use the new `eslint.config.js` flat config — no `.eslintrc` legacy. |
| **typescript-eslint** | `^8.59.0` | TS ESLint plugin + parser umbrella | Use the umbrella `typescript-eslint` package; it pulls in `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`. ESLint 10 compatible. |
| **Prettier** | `^3.8.3` | Formatting | Run via lint-staged on commit; do not let ESLint format. |
| **Husky** | `^9.1.7` | Git hooks | v9 simplified hook installation — `prepare: husky` runs on every install. Plain shell scripts in `.husky/`. |
| **lint-staged** | `^16.4.0` | Run prettier/eslint on staged files only | Standard pre-commit pairing with Husky. |
| **globals** | `^17.5.0` | Browser/Node global definitions for ESLint flat config | Required by ESLint 10 flat configs. |
| **PostCSS Autoprefixer** | latest | Vendor prefix automation | Reads Browserslist; replaces Compass's vendor-prefix mixins. |

---

## Open Question: epub.js vs @readium/navigator

**This is the single most important stack decision in the milestone and warrants explicit founder/maintainer ratification before Phase 1 begins.**

### epub.js (`epubjs@0.3.93`) — current status

| Signal | Value |
|--------|-------|
| Latest **npm** publish | `0.3.93`, **2023-09-26** (~2.5 years stale) |
| Latest GitHub **release** | `v0.3.88`, **2020-07-01** (~5 years stale) |
| Latest GitHub **commit** on master | 2026-03-24 (PR #1414 merge — memory leak fix in `DefaultViewManager`) |
| Maintainer activity | Sporadic; commits happen, releases do not |
| TypeScript types | Yes, but the `@types/epubjs` situation has historically been messy |
| Production users still on it | Many small/medium readers (booklore.app is publicly debating replacement — issue [booklore/booklore#1831](https://github.com/booklore-app/booklore/issues/1831)) |
| Bus factor | One person (Fred Chasen) |

**Verdict on epub.js:** Not abandoned, but on minimal life support. The npm package is two years behind the master branch. There is no version policy; you cannot pin to a tag and get a fix. Adopting it means accepting that you may end up vendoring or forking. **Confidence: HIGH** that this is the situation today.

### @readium/navigator (Readium ts-toolkit) — current status

| Signal | Value |
|--------|-------|
| Latest **npm** publish | `@readium/navigator@2.5.0`, **2026-04-23** (3 days ago) |
| Sibling packages also current | `@readium/shared@2.2.0` (a week ago), `@readium/navigator-html-injectables@2.4.0` (3 days ago), `@readium/css@2.0.2` (a week ago) |
| Repo | [`readium/ts-toolkit`](https://github.com/readium/ts-toolkit) (monorepo, pnpm workspaces) |
| Backers | EDRLab (European Digital Reading Lab — non-profit, the Readium foundation org) — same shop as Thorium |
| Production users | [Thorium Web 1.4.0](https://github.com/edrlab/thorium-web) (released 2026-04-23), [NYPL Web Reader](https://www.npmjs.com/package/@nypl/web-reader) |
| TypeScript types | Native — written in TypeScript |
| License | BSD-3-Clause |
| Format support | EPUB 2 + EPUB 3 (reflowable + fixed-layout), webpub, divina |
| Standards alignment | Implements the Readium Web Publication Manifest model — the reference architecture for modern EPUB tooling |

**Verdict on `@readium/navigator`:** Actively maintained, production-grade, TS-native, standards-aligned, multi-maintainer (3 npm maintainers visible), BSD-3 licensed. Used by the canonical reference web reader (Thorium Web).

### Recommendation

> **Re-open the locked decision** and adopt `@readium/navigator` instead of `epub.js`, unless one of the following hard constraints applies:
>
> 1. The project owner has prior code/integration in epub.js that they want to carry forward.
> 2. The simpler API surface of epub.js is preferred for v1 and the maintenance risk is accepted.
> 3. A spike on `@readium/navigator` reveals it cannot satisfy the EPUB-embedded ("self-hosting unzipped EPUB") flavour without unreasonable effort.
>
> **Why this is not a unilateral pivot in this document:** PROJECT.md lists epub.js as a "locked decision". This research surfaces strong evidence that the locking happened before the maintenance picture was visible; the call belongs to the project owner. Recommend a 1–2 day spike in Phase 1 to validate `@readium/navigator` against the four-flavour requirement before committing.

### What changes if we go Readium

| Area | epub.js path | Readium path |
|------|--------------|--------------|
| Install | `npm i epubjs` | `npm i @readium/navigator @readium/shared @readium/navigator-html-injectables @readium/css` |
| API style | `Book` + `Rendition` objects, jQuery-flavoured event API | TypeScript classes, modern event API, separation of "shared" model from "navigator" view |
| EPUB unzip | Internal (epub.js bundles `jszip`) | You provide a streamer (use `fflate` against the dropped File) and feed publication data in |
| TOC / spine | `book.loaded.navigation`, `book.spine` | `Publication.tableOfContents`, `Publication.readingOrder` |
| Reading position / CFI | epub.js CFI | Readium Locator (richer; CFI-compatible) |
| Chrome customisation | `Rendition.themes`, custom CSS injection | `@readium/css` (a complete CSS layer) + ReadiumCSS preferences API |

---

## Vite Multi-Output Strategy (the four flavours)

This is the pivotal architectural question and the answer is unambiguous: **use Vite's multi-page-app (MPA) mode, not library mode.** All four flavours are HTML entry points, not npm packages.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
  const isSolo = mode === 'solo';
  const isEmbedded = mode === 'embedded';

  return {
    base: './', // critical for file:// + EPUB-embedded loading
    build: {
      outDir: `dist/${mode}`,
      assetsInlineLimit: isSolo ? Number.MAX_SAFE_INTEGER : 4096,
      rollupOptions: {
        input: {
          // MPA entries — one per HTML file
          reader:  resolve(__dirname, 'src/reader/index.html'),
          library: resolve(__dirname, 'src/library/index.html'),
          // solo and embedded use a single entry; selected via mode
        },
      },
    },
    plugins: [
      isSolo ? viteSingleFile() : null,
      // ... lit-css plugin, etc.
    ].filter(Boolean),
  };
});
```

**Why MPA, not library mode:**
- Library mode emits one entry per build with `dist/index.mjs` + `dist/index.cjs`. It expects an npm-package consumer.
- MPA mode emits multiple `*.html` files with their own JS/CSS chunks, sharing common chunks across entries. This is exactly what the four-flavour fan-out wants.
- Library mode does not support multiple entries cleanly (see [Vite issue #12203](https://github.com/vitejs/vite/issues/12203)).

**Run separate builds for solo + embedded** (different `mode` flag) so `vite-plugin-singlefile` runs only for `solo` and the EPUB-embedded build can have its own asset path discipline (relative paths only, no leading `/`).

**Browserslist configuration (in `package.json`):**

```json
"browserslist": [
  "last 2 chrome versions",
  "last 2 edge versions",
  "last 2 firefox versions",
  "last 2 safari versions",
  "last 2 ios_saf versions",
  "last 2 and_chr versions",
  "last 2 and_ff versions",
  "not dead",
  "not op_mini all"
]
```

This is the explicit form. `defaults` (= `> 0.5%, last 2 versions, Firefox ESR, not dead`) is *not* what we want because it includes Firefox ESR (one extra release) and may include long-tail mobile browsers we don't care about. The explicit form gives the test/build matrix exactly the targets PROJECT.md asks for.

---

## Single-File HTML Output (the "solo" flavour)

`vite-plugin-singlefile@2.3.3` is the right plugin. Configuration:

```ts
import { viteSingleFile } from 'vite-plugin-singlefile';

viteSingleFile({
  removeViteModuleLoader: true, // drop the dynamic-import shim — solo never code-splits
  useRecommendedBuildConfig: true, // sets cssCodeSplit: false, inlineDynamicImports: true
  inlinePattern: ['**/*.{css,js,svg,woff2}'], // explicit; no surprises
  deleteInlinedFiles: true,
});
```

**Set `build.assetsInlineLimit` to `Number.MAX_SAFE_INTEGER` for the solo build** so all images/fonts inline as data URIs.

**2026 limitations to know about (verified against the plugin README):**
- SPA history-API routing does not work from `file://` — use hash-based routing (which the legacy reader already does).
- Cookies cannot work from `file://` (no HTTP). Use `localStorage` / `IndexedDB`.
- Source maps are stripped (they're generated before inlining; the inline rewrite invalidates them).
- **Total output size is bounded only by the browser's HTML/JS heap.** Chrome and Firefox will load multi-MB single-file HTMLs without complaint; Safari mobile struggles past ~50 MB. For image-heavy EPUBs, the solo build size is the practical ceiling — the legacy approach hit this for large-image NZ-publisher EPUBs and the new pipeline will too.
- No officially documented data-URI per-asset hard limit in modern Chromium/Firefox/WebKit; old `data:` URL caps (~32 KB in IE9, ~256 KB in pre-2010 Safari) are gone. Practical limit is total HTML document size.

---

## Replacement for `manifest.maker.py` (Node TS-based)

Goal: walk `readkit.epub/*/META-INF/container.xml`, parse the OPF pointed at by each container, emit `manifest.json`.

**Recommended:** `fast-xml-parser@^5.7.2`

```ts
import { XMLParser } from 'fast-xml-parser';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false, // keep titles as strings, not auto-numbers
});

async function buildManifest(epubsRoot: string) {
  // ... walk dirs, find container.xml, resolve OPF, extract dc:title/dc:creator/cover
}
```

**Why fast-xml-parser over alternatives:**

| Library | Verdict | Why |
|---------|---------|-----|
| `fast-xml-parser@5.7.2` | **Recommended** | Pure JS, zero deps, native TS types, actively maintained (published 2026-04-24), ergonomic object output, fast |
| `@xmldom/xmldom@0.9.10` | Use only if you specifically need DOM-API-compat | Implements W3C `DOMParser`. Slower for OPF (which doesn't need DOM). Heavier dep tree. |
| `xmldoc@2.0.3` | OK but smaller community | Minimal. Use only if `fast-xml-parser` proves to have a sharp edge for OPF; not expected. |
| Native `DOMParser` via `@xmldom/xmldom` | Acceptable in build script | Use if you want to share a parser with the runtime client. Otherwise object output is more ergonomic. |

**Security note:** `fast-xml-parser` does not resolve external entities by default — XXE-safe out of the box, unlike the legacy `lxml.etree.fromstring(...)` which was XXE-vulnerable per `CONCERNS.md`.

**Wire it into the build:**

```jsonc
// package.json
{
  "scripts": {
    "build:manifest": "tsx scripts/build-manifest.ts",
    "build:reader":   "vite build --mode reader",
    "build:library":  "npm run build:manifest && vite build --mode library",
    "build:solo":     "vite build --mode solo",
    "build:embedded": "vite build --mode embedded",
    "build":          "npm run build:reader && npm run build:library && npm run build:solo && npm run build:embedded"
  }
}
```

Use `tsx` (or `ts-node` in `--esm` mode) to run the TS build script without a separate compile step.

---

## ZIP Handling for In-Browser EPUB Unzip

| Library | Version | Verdict | Why |
|---------|---------|---------|-----|
| **fflate** | `^0.8.2` | **Recommended** | 11.5 KB gzipped, pure ESM, both sync and worker-async APIs, faster than JSZip's "async" (which actually blocks the main thread). MIT-licensed. The de-facto pick for browser ZIP work in 2026. The fact that v0.8.2 was published in Feb 2024 and there's been no follow-up is fine — the library is feature-complete; it's not abandoned, it's stable. |
| `jszip` | `^3.10.1` | **Avoid** for new code | Larger (~94 KB), older API design, known main-thread blocking even on the async path. Battle-tested but unnecessary in 2026. |
| `unzipit` | `^2.0.1` | OK alternative for read-only EPUB use | Streaming, ESM-first, lightweight. Reasonable second choice if `fflate`'s API doesn't fit. |
| `zip.js` (Gildas Lormeau) | recent | Acceptable but heavier | This is what foliate-js bundles. Larger than fflate; supports random access (matters for streaming chapters from large EPUBs). Use only if you need lazy chapter decompression. |

The legacy reader bundled the 2013-era zip.js (Gildas Lormeau) using a Web Worker that doesn't work from `file://` or solo builds (per `CONCERNS.md`). fflate's main-thread async path solves this — it yields between chunks, so even the worker-less paths stay responsive.

---

## CI: GitHub Actions

**Recommended action versions (April 2026):**

| Action | Version | Notes |
|--------|---------|-------|
| `actions/checkout` | `@v5` | v5 is current. v4 still works. |
| `actions/setup-node` | `@v5` | Pair with `node-version-file: '.nvmrc'` for single-source-of-truth. |
| `actions/cache` | `@v4` | Cache `~/.npm` or `~/.pnpm-store`. |
| `actions/upload-artifact` | `@v4` | For Playwright report + Vitest coverage. |

**Minimal `.github/workflows/ci.yml`:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm' # or 'npm'
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test            # Vitest unit + browser-mode component tests
      - run: pnpm exec playwright install --with-deps chromium firefox webkit
      - run: pnpm test:e2e        # Playwright
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

For a multi-browser matrix on Playwright, prefer `--project=chromium --project=firefox --project=webkit` flags inside one job (Playwright handles parallelism) over a GitHub Actions matrix (cheaper, less queueing).

---

## Installation

```bash
# Core runtime
pnpm add lit @readium/navigator @readium/shared @readium/navigator-html-injectables @readium/css fflate
# (or `epubjs` instead of the four @readium/* if epub.js is kept — see Open Question)

# Build / test / lint dev deps
pnpm add -D \
  typescript@^6 \
  vite@^8 \
  vite-plugin-singlefile@^2 \
  sass@^1.99 \
  vitest@^4 @vitest/browser@^4 @vitest/browser-playwright@^4 \
  playwright@^1.59 @playwright/test@^1.59 \
  fast-xml-parser@^5 \
  tsx \
  eslint@^10 typescript-eslint@^8 \
  prettier@^3 \
  husky@^9 lint-staged@^16 \
  globals@^17 \
  autoprefixer postcss
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Vite 8** | Rollup direct, esbuild standalone, Webpack 5 | Use Rollup direct only for pure library output (we don't have one). Avoid Webpack — slower, more config, no dev-server win. |
| **Lit 3** | Stencil, Solid, Preact | Lit if you want native Web Components and zero virtual-DOM runtime. Stencil if you need to compile to multiple framework wrappers (we don't). Solid/Preact if you'd rather stay in JSX (we wouldn't gain anything for this domain). |
| **`@readium/navigator`** | epub.js, foliate-js | epub.js per locked decision (with the maintenance flag noted). foliate-js (`johnfactotum/foliate-js`) is the engine behind the Foliate desktop reader; it's higher-quality than epub.js but has **no stable release** and the upstream README explicitly says "expect it to break and the API to change at any time. Use it at your own risk." Recommended consumption is git submodule. The `foliate-js@1.0.1` on npm is a third-party fork by an unrelated maintainer (`shmandadi`), not the upstream. **Do not depend on the npm package.** Foliate-js is interesting if you want to vendor its EPUB parser; for v1 the Readium toolkit is the safer bet. |
| **Vitest 4** | Jest, Mocha, Web Test Runner | Vitest is the only test runner that shares Vite's transform pipeline directly. Use Web Test Runner if you commit to a `@web/dev-server` workflow (we don't). Avoid Jest — separate transformer, slower, weaker ESM story. |
| **Playwright** | Cypress, WebDriverIO, Selenium | Playwright wins on multi-browser-from-one-API and on CI ergonomics. Cypress is locked to Chromium-family + Firefox/WebKit experimental, slower, and lacks first-party Safari/WebKit parity. Avoid Selenium for greenfield. |
| **fflate** | JSZip, unzipit, zip.js | See ZIP table above. |
| **fast-xml-parser** | `@xmldom/xmldom`, native DOMParser | See XML table above. |
| **Browserslist explicit form** | `defaults` shortcut | `defaults` includes Firefox ESR and `> 0.5%`, which expands the matrix beyond what PROJECT.md commits to. Be explicit. |
| **dart-sass via `sass` package** | Compass, node-sass, libsass | All three deprecated. Vite's built-in dart-sass loader is the only modern path. |
| **Husky 9 + lint-staged 16** | Lefthook, simple-git-hooks | Husky is the established choice; v9 simplified setup. Lefthook is faster but adds a Go binary dependency. |
| **pnpm 9** | npm 10, yarn 4, bun | Any of these is fine if pinned. pnpm gives the smallest disk footprint and a strict node_modules layout. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Webpack** | Slower dev startup, more config surface, no built-in dev server worth its name vs Vite, weaker first-class TS+ESM story | Vite 8 |
| **Grunt** | Ecosystem in maintenance mode; the legacy 1345-line Gruntfile is what we're escaping | Vite + npm scripts (one `package.json` script per flavour) |
| **Jest** | Slower than Vitest, separate transformer pipeline, weaker ESM, no shared config with Vite | Vitest 4 |
| **JSDOM (for component tests)** | `getComputedStyle` returns empty values, layout returns zeros, no real CSS engine, no shadow DOM accuracy. Will silently pass tests that fail in a real browser. | `@vitest/browser` driving real Chromium/Firefox/WebKit via Playwright provider |
| **Cypress** | Browser matrix is narrower, slower, weaker WebKit support, locked-in test architecture | Playwright |
| **jQuery 2.0.3** (legacy) | CVE-2020-11022 / 11023 (XSS) per `CONCERNS.md`; redundant in 2026 — every API used (DOM walk, events, deferreds) has a native equivalent | Native DOM APIs + `lit-html` for templating |
| **Lo-Dash 1.3.1** (legacy) | CVE-2019-10744 prototype pollution per `CONCERNS.md` | Native `Array`/`Object` methods; the legacy code only uses `_.filter` + `_.isNumber` — both trivially native |
| **RequireJS** (legacy) | Frozen, predates ES modules, no tree-shaking, no IDE intelligence, no bundler interop | Native ESM `import` / `export` + Vite |
| **iScroll 4** (legacy) | Superseded; broken on modern pointer events; touch heuristics are 14 years old | Native CSS scroll-snap + `overflow: auto` + IntersectionObserver-based pagination, OR delegate to `@readium/navigator`'s built-in pagination if Readium is adopted |
| **Modernizr / Detectizr** (legacy) | Effectively abandoned; called on every UI toggle in legacy code; modern features are present everywhere in the target matrix | Inline `if ('IntersectionObserver' in window)` checks; never browser-detect |
| **AppCache** (legacy) | Removed from the HTML spec, dropped by Chrome 85 / Firefox 85 | None for v1 (PWA/Service Worker is out of scope per PROJECT.md). Solo single-file build delivers offline. |
| **Compass + Ruby SASS** (legacy) | EOL since 2018/2019; deprecation warnings on every build per `CONCERNS.md` | dart-sass via the `sass` npm package, consumed automatically by Vite |
| **Python 2 `manifest.maker.py`** (legacy) | EOL since 2020; uses `print` statements; XXE-vulnerable via bare `lxml.etree.fromstring` per `CONCERNS.md` | Node TS script using `fast-xml-parser` (XXE-safe by default) — see "Replacement for manifest.maker.py" above |
| **Forked `grunt-readkit-*` plugins** (legacy) | Pinned to `master` on a personal GitHub account, no version pinning, supply-chain risk | Don't reintroduce. The capabilities (DOM munging, data-URI inlining) are subsumed by Vite + `vite-plugin-singlefile` + a small custom plugin for the EPUB-embedded path |
| **`@types/epubjs` from old DT entry** | Stale, doesn't match runtime `epubjs@0.3.93` | If keeping epub.js: write a thin `epub.d.ts` ambient declaration locally, or use `@nikkohomab/epubjs-types` from DefinitelyTyped (verify version match before depending) |
| **TSC-only build (no bundler)** | Won't handle SCSS, asset URLs, code splitting, or HTML entry points | Vite handles `.ts`, `.scss`, asset URL rewriting in one tool |
| **`tsc --watch` for dev** | No HMR, no SCSS pipeline | `vite dev` |

---

## Stack Patterns by Variant

**If retaining the locked epub.js decision:**
- Pin `epubjs@0.3.93` (current npm) and accept the 2.5-year-stale npm publish; expect to vendor a fix or fork if a critical bug surfaces.
- Add `@types/epubjs` cautiously — verify the type version actually corresponds to 0.3.93 runtime.
- epub.js bundles its own `jszip` — `fflate` is then only needed for the drag-drop path before handing the unzipped epub data to epub.js.
- Keep an eye on the `master` branch for unreleased fixes; consider depending on a git tag rather than the npm artifact if a needed fix lands.

**If pivoting to `@readium/navigator`:**
- Install the four-package set (`@readium/navigator`, `@readium/shared`, `@readium/navigator-html-injectables`, `@readium/css`).
- You become responsible for unzipping and surfacing the publication to Readium — `fflate` does this for the drag-drop flow.
- Use `@readium/css` as the styling layer for chapter content (replaces the legacy custom CSS injection).
- Cross-reference Thorium Web's source ([`edrlab/thorium-web`](https://github.com/edrlab/thorium-web)) for a working integration pattern; it's Next.js-flavoured but the Readium glue is portable.

**If targeting only modern browsers (Chrome/Edge/Firefox/Safari last 2):**
- Set `build.target: 'es2022'` in Vite — supports class fields, `??`, `?.`, top-level await, private class members.
- Drop the `construct-style-sheets-polyfill` — adoptedStyleSheets is supported across the target matrix.
- TypeScript `target: 'ES2022'`, `module: 'ESNext'`, `moduleResolution: 'bundler'`.

**If running on Node LTS 22 in CI:**
- All listed tooling is compatible. Vite 8 requires Node 20.19+; we're on 22 LTS.
- Set `engines.node: ">=22 <23"` in `package.json` to fail-fast on wrong-version installs.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `vite@^8` | `vitest@^4`, `@vitest/browser@^4`, `vite-plugin-singlefile@^2.3` | All on Vite 8's plugin API. |
| `vitest@^4` | `@vitest/browser@^4`, `@vitest/browser-playwright@^4`, `playwright@^1.59` | Same major; `@vitest/browser-playwright` is the new split-out provider in v4. Match minors. |
| `lit@^3.3` | `typescript@^6` | Use `experimentalDecorators: true` and `useDefineForClassFields: false` in `tsconfig.json` for `@customElement` / `@property` decorator support. |
| `eslint@^10` | `typescript-eslint@^8` (the umbrella package), `globals@^17` | Flat config (`eslint.config.js`) only — no `.eslintrc`. |
| `husky@^9` | `lint-staged@^16` | `prepare: husky` script runs on `npm install`. |
| `node@22 LTS` | All of the above | Vite 8 requires Node 20.19+; we're well above. |
| `@readium/navigator@^2.5` | `@readium/shared@^2.2`, `@readium/navigator-html-injectables@^2.4`, `@readium/css@^2.0` | Installed together; all under the `readium/ts-toolkit` monorepo. Treat as a coupled set. |
| `fflate@^0.8` | Browser ESM and Node | Pre-1.0 but stable; the API is unlikely to change. |
| `vite-plugin-singlefile@^2.3` | `vite@^7`/`^8` | Plugin keeps Vite-major compatibility close. |

---

## Summary: Confirmed Versions Table (April 2026)

For copy-paste into `package.json`:

```jsonc
{
  "engines": { "node": ">=22 <23" },
  "dependencies": {
    "lit": "^3.3.2",
    "fflate": "^0.8.2",
    // EPUB engine — pick one:
    "@readium/navigator": "^2.5.0",
    "@readium/shared": "^2.2.0",
    "@readium/navigator-html-injectables": "^2.4.0",
    "@readium/css": "^2.0.2"
    // OR (locked decision):
    // "epubjs": "^0.3.93"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "vite": "^8.0.10",
    "vite-plugin-singlefile": "^2.3.3",
    "sass": "^1.99.0",
    "vitest": "^4.1.5",
    "@vitest/browser": "^4.1.5",
    "@vitest/browser-playwright": "^4.1.5",
    "playwright": "^1.59.1",
    "@playwright/test": "^1.59.1",
    "fast-xml-parser": "^5.7.2",
    "tsx": "^4",
    "eslint": "^10.2.1",
    "typescript-eslint": "^8.59.0",
    "prettier": "^3.8.3",
    "husky": "^9.1.7",
    "lint-staged": "^16.4.0",
    "globals": "^17.5.0",
    "autoprefixer": "^10",
    "postcss": "^8"
  },
  "browserslist": [
    "last 2 chrome versions",
    "last 2 edge versions",
    "last 2 firefox versions",
    "last 2 safari versions",
    "last 2 ios_saf versions",
    "last 2 and_chr versions",
    "last 2 and_ff versions",
    "not dead",
    "not op_mini all"
  ]
}
```

---

## Sources

Verified via npm registry (`npm view <pkg> version time.modified`) on 2026-04-26:

- `typescript@6.0.3` — modified 2026-04-16. **HIGH** confidence.
- `vite@8.0.10` — modified 2026-04-23. **HIGH**.
- `lit@3.3.2` — modified 2025-12-23. **HIGH**.
- `epubjs@0.3.93` — modified 2023-09-26 (npm); GitHub master last commit 2026-03-24; latest GitHub release v0.3.88 from 2020-07-01. **HIGH** confidence on the maintenance picture.
- `vitest@4.1.5`, `@vitest/browser@4.1.5`, `@vitest/browser-playwright@4.1.5` — all modified 2026-04-23. **HIGH**.
- `@playwright/test@1.59.1`, `playwright@1.59.1` — modified 2026-04-25. **HIGH**.
- `sass@1.99.0` — modified 2026-04-02. **HIGH**.
- `fflate@0.8.2` — modified 2024-02-07. Stable, not abandoned. **HIGH**.
- `fast-xml-parser@5.7.2` — modified 2026-04-24. **HIGH**.
- `vite-plugin-singlefile@2.3.3` — modified 2026-04-17. **HIGH**.
- `eslint@10.2.1` — modified 2026-04-17. **HIGH**.
- `typescript-eslint@8.59.0` — modified 2026-04-25. **HIGH**.
- `prettier@3.8.3` — modified 2026-04-15. **HIGH**.
- `husky@9.1.7` — modified 2025-01-11. **HIGH**.
- `lint-staged@16.4.0` — modified 2026-03-14. **HIGH**.
- `globals@17.5.0` — modified 2026-04-12. **HIGH**.
- `@readium/navigator@2.5.0` — modified 2026-04-23. **HIGH**.
- `@readium/shared@2.2.0` — modified 2026-04-14. **HIGH**.
- `@readium/navigator-html-injectables@2.4.0` — modified 2026-04-23. **HIGH**.
- `@readium/css@2.0.2` — modified 2026-04-20. **HIGH**.

Other sources:

- [`futurepress/epub.js` repository](https://github.com/futurepress/epub.js) — release/commit history confirmed via GitHub API. Latest release v0.3.88 (2020-07-01); latest master commit 2026-03-24.
- [`readium/ts-toolkit` repository](https://github.com/readium/ts-toolkit) — package structure, license (BSD-3), monorepo layout.
- [`edrlab/thorium-web` 1.4.0](https://github.com/edrlab/thorium-web) — production-grade EPUB reader on `@readium/navigator`, released 2026-04-23. Validates the alternative is shippable.
- [`booklore-app/booklore` issue #1831](https://github.com/booklore-app/booklore/issues/1831) — independent project actively investigating epub.js replacements; corroborates the maintenance concern.
- [`johnfactotum/foliate-js`](https://github.com/johnfactotum/foliate-js) — README explicitly states "no release yet, library is not stable, expect breaking API changes." Not viable as an npm dependency.
- [vite-plugin-singlefile README](https://github.com/richardtallent/vite-plugin-singlefile) — current plugin options + known limitations.
- [Vite docs — Building for Production](https://vite.dev/guide/build) — MPA mode + library mode confirmed.
- [Vitest Browser Mode docs](https://vitest.dev/guide/browser/) — JSDOM vs real-browser tradeoffs.
- [Browserslist README](https://github.com/browserslist/browserslist) — query syntax for explicit browser families + mobile targets.

---

*Stack research for: browser-only EPUB reader (greenfield rewrite of readk.it)*
*Researched: 2026-04-26*
