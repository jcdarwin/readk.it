# Architecture Research

**Domain:** Browser-only EPUB reader (greenfield rewrite of readk.it on TypeScript + Vite + Lit + epub.js)
**Researched:** 2026-04-26
**Confidence:** MEDIUM-HIGH (Lit and Vite patterns are HIGH; epub.js integration patterns are MEDIUM because the upstream is stale and several decisions are extrapolated from issue threads and forks rather than current docs)

This document proposes the architecture for the *new* codebase. It does not analyse the legacy 2013 tree (that lives in `.planning/codebase/ARCHITECTURE.md`). It is written for downstream consumers who will plan and execute the build phase-by-phase, including non-Claude executors who must be able to build a single component without reverse-engineering the surrounding system.

---

## 1. Stack Reality Check (read this first)

The PROJECT.md stack is **locked**: TypeScript + Vite + Lit + epub.js + dart-sass + Vitest + Playwright. The architecture below honours that decision. Two findings worth flagging up front because they shape almost every other recommendation:

- **epub.js is effectively unmaintained.** Last release `0.3.88` is from July 2020; the repo carries 484+ open issues. CVE-2024-39307 (cross-origin iframe leak) was issued in 2024. There is an active TypeScript fork (`likecoin/epub.ts`) and a wholly-different alternative (`johnfactotum/foliate-js`) that *also* exposes a `<foliate-view>` custom element. The architecture below quarantines epub.js behind an `EpubEngine` interface so that swapping the engine later (a likely v2 task) is a single-file change, not an excavation.
- **epub.js renders into an `<iframe>` it owns.** This means the Lit component that hosts the rendition cannot use Shadow DOM for that subtree (the iframe lives in Light DOM under whatever element you hand to `book.renderTo(...)`). The reader chrome can still use Shadow DOM; only the rendition host opts out.

Both findings are reflected in the component model and the data flow below. They should be treated as load-bearing constraints when sequencing the roadmap.

---

## 2. System Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Build orchestration                               │
│  npm scripts → Vite (one config, four `mode`s) + Node manifest generator    │
│                                                                              │
│   build:reader   build:library   build:solo   build:embed   build:all       │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │ produces
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Four deployable flavours                            │
│                                                                              │
│  dist/reader/         dist/library/        dist/solo/         dist/embed/   │
│  index.html           index.html           <id>_<name>.html   reader.html   │
│  + assets             + library.html       (single file,      (single file, │
│  (drag-drop)          + reader/index.html  EPUB inlined)       embedded     │
│                       + manifest.json                          inside each  │
│                       + cover thumbs                           .epub)       │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │ runtime
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Browser runtime (single page)                          │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │  App shell (Lit components, Shadow DOM)                            │    │
│   │                                                                    │    │
│   │   <readkit-library>          <readkit-reader>                      │    │
│   │   (only on library flavour)  (reader/solo/embed flavours)          │    │
│   │      │                          │                                  │    │
│   │      │ navigates via            │ owns:                            │    │
│   │      │ Router service           │   <readkit-toolbar>              │    │
│   │      ▼                          │   <readkit-toc-drawer>           │    │
│   │   <readkit-cover-grid>          │   <readkit-bookmarks>            │    │
│   │   <readkit-cover-card>          │   <readkit-theme-menu>           │    │
│   │                                 │   <readkit-typography-menu>      │    │
│   │                                 │   <readkit-dropzone>             │    │
│   │                                 │   <readkit-rendition> ◄──────────┐  │
│   │                                 │   (Light DOM – owns iframe)      │  │
│   └─────────────────────────────────┴──────────────────────────────────┘  │
│              │                                       │                   │
│              │ context (@lit/context provider)       │                   │
│              ▼                                       ▼                   │
│   ┌─────────────────────────┐        ┌────────────────────────────────┐  │
│   │  Reactive controllers   │        │  EpubEngine (interface)        │  │
│   │  (one per concern)      │        │     ▲                          │  │
│   │   • PreferencesCtrl     │        │     │ implementation today     │  │
│   │   • BookmarkCtrl        │        │     ▼                          │  │
│   │   • LocationCtrl        │        │  EpubJsEngine                  │  │
│   │   • RouterCtrl          │        │  (wraps epub.js Book +         │  │
│   │   • DropzoneCtrl        │        │   Rendition + Locations +      │  │
│   └────────────┬────────────┘        │   Themes; emits domain events) │  │
│                │                     └────────────────────────────────┘  │
│                ▼                                       │                  │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Stores (plain TS modules, framework-agnostic)                  │   │
│   │   • PersistenceStore (IndexedDB, namespaced by EPUB identifier) │   │
│   │   • ManifestStore (the library/manifest.json contents)          │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component responsibilities

| Component | Type | Responsibility | Render mode |
|-----------|------|----------------|-------------|
| `<readkit-app>` | Lit element | Top-level shell. Reads route, picks `<readkit-library>` or `<readkit-reader>`. Provides app-wide context. | Shadow DOM |
| `<readkit-reader>` | Lit element | Reader page composition. Holds the `EpubEngine` instance. Provides reader-scoped context. | Shadow DOM |
| `<readkit-toolbar>` | Lit element | Header controls: back, library link, drag-drop hint, online indicator. | Shadow DOM |
| `<readkit-toc-drawer>` | Lit element | Side drawer listing the spine / nav entries. Emits `nav-select` events with CFI/href. | Shadow DOM |
| `<readkit-bookmarks>` | Lit element | Bookmark list + toggle button. Reads/writes via `BookmarkController`. | Shadow DOM |
| `<readkit-theme-menu>` | Lit element | Light / dark / sepia switcher. Writes through `PreferencesController`. | Shadow DOM |
| `<readkit-typography-menu>` | Lit element | Font family / size / line-height steppers. | Shadow DOM |
| `<readkit-dropzone>` | Lit element | Drag-and-drop overlay; receives `File` and forwards to engine. | Shadow DOM |
| `<readkit-rendition>` | Lit element | Hosts the epub.js iframe. Calls `engine.attach(this.renderRoot)` on `firstUpdated`. | **Light DOM** (`createRenderRoot() { return this; }`) |
| `<readkit-library>` | Lit element | Library page composition. Loads `manifest.json`, supplies it via context. | Shadow DOM |
| `<readkit-cover-grid>` | Lit element | Grid/carousel of `<readkit-cover-card>`. | Shadow DOM |
| `<readkit-cover-card>` | Lit element | Single cover + metadata; emits `book-open` event. | Shadow DOM |
| `EpubEngine` | TS interface | Domain API: `open(input)`, `attach(el, opts)`, `next()`, `prev()`, `gotoCfi(cfi)`, `setTheme(name)`, `setFont(family, size, lineHeight)`, `on(event, cb)`. | non-DOM |
| `EpubJsEngine` | TS class | The single integration with epub.js. The rest of the app must not import `epubjs` directly. | non-DOM |
| `PersistenceStore` | TS module | Async wrapper over IndexedDB (via `idb-keyval` or hand-rolled). Schema-versioned. | non-DOM |
| `ManifestStore` | TS module | Loads/parses `manifest.json`; exposes typed `Publication[]`. | non-DOM |
| Reactive controllers | TS classes | One per concern (`PreferencesController`, `BookmarkController`, `LocationController`, `RouterController`, `DropzoneController`). Hook into Lit's reactive update cycle; own no DOM. | non-DOM |
| Build manifest generator | Node TS | `tools/build-manifest.ts` walks `epubs/*/META-INF/container.xml`, parses each OPF, emits `manifest.json`. Replaces `manifest.maker.py`. | build-time |
| Build EPUB-embedder | Node TS | `tools/embed-into-epub.ts` re-zips each source EPUB with a built copy of the reader injected under `OEBPS/readk.it/`. | build-time |

---

## 3. Recommended Project Structure

```
readk.it/                              # repo root (existing)
├── package.json                       # one package, npm or pnpm
├── pnpm-lock.yaml | package-lock.json # committed
├── .nvmrc                             # current Node LTS
├── tsconfig.json                      # strict, ES2022, moduleResolution:Bundler
├── tsconfig.node.json                 # for vite.config.ts and tools/
├── vite.config.ts                     # ONE config, mode-driven (see §6)
├── playwright.config.ts
├── vitest.config.ts                   # may extend vite.config.ts
├── .browserslistrc
│
├── src/                               # === new source tree ===
│   ├── main.reader.ts                 # entry — drag-drop reader flavour
│   ├── main.library.ts                # entry — library carousel flavour
│   ├── main.solo.ts                   # entry — solo flavour (re-exports reader + auto-loads bundled EPUB)
│   ├── main.embed.ts                  # entry — EPUB-embedded flavour (reads sibling OEBPS)
│   │
│   ├── shell/                         # top-level Lit shells
│   │   ├── readkit-app.ts             # routes between library and reader
│   │   ├── readkit-library.ts
│   │   └── readkit-reader.ts
│   │
│   ├── components/                    # leaf Lit components (Shadow DOM unless noted)
│   │   ├── reader/
│   │   │   ├── readkit-rendition.ts   # Light DOM — hosts epub.js iframe
│   │   │   ├── readkit-toolbar.ts
│   │   │   ├── readkit-toc-drawer.ts
│   │   │   ├── readkit-bookmarks.ts
│   │   │   ├── readkit-theme-menu.ts
│   │   │   ├── readkit-typography-menu.ts
│   │   │   ├── readkit-dropzone.ts
│   │   │   └── readkit-progress.ts
│   │   ├── library/
│   │   │   ├── readkit-cover-grid.ts
│   │   │   └── readkit-cover-card.ts
│   │   └── shared/
│   │       ├── readkit-icon.ts
│   │       └── readkit-button.ts
│   │
│   ├── engine/                        # the only place that imports epubjs
│   │   ├── epub-engine.ts             # interface + domain types
│   │   ├── epubjs-engine.ts           # implementation
│   │   └── epub-events.ts             # typed event names + payloads
│   │
│   ├── controllers/                   # Lit reactive controllers (no DOM)
│   │   ├── preferences-controller.ts
│   │   ├── bookmark-controller.ts
│   │   ├── location-controller.ts
│   │   ├── router-controller.ts
│   │   └── dropzone-controller.ts
│   │
│   ├── stores/                        # framework-agnostic data layer
│   │   ├── persistence.ts             # IndexedDB wrapper, schema migration
│   │   ├── manifest.ts                # loads manifest.json
│   │   └── schema.ts                  # zod or hand-typed shapes
│   │
│   ├── context/                       # @lit/context tokens
│   │   ├── engine-context.ts
│   │   ├── preferences-context.ts
│   │   └── manifest-context.ts
│   │
│   ├── routing/                       # tiny custom router (see §7)
│   │   └── router.ts
│   │
│   ├── styles/                        # SCSS sources (dart-sass)
│   │   ├── tokens/                    # variables only — colours, spacing
│   │   │   ├── _color.scss
│   │   │   ├── _typography.scss
│   │   │   └── _theme-light.scss / _theme-dark.scss / _theme-sepia.scss
│   │   ├── reader.scss                # entry compiled by Vite for reader chrome
│   │   ├── library.scss               # entry compiled by Vite for library
│   │   └── components/                # per-component partials co-located optional
│   │
│   ├── html/                          # entry HTMLs (Vite reads these as MPA inputs)
│   │   ├── reader.html
│   │   ├── library.html
│   │   ├── solo.html
│   │   └── embed.html
│   │
│   └── types/
│       ├── epubjs.d.ts                # local augmentations if upstream types are thin
│       └── env.d.ts
│
├── public/                            # static assets copied verbatim
│   ├── fonts/                         # Lora, Source Sans Pro, fontello (ported from legacy)
│   └── images/                        # spinners, splash, touch icons
│
├── epubs/                             # === source EPUBs (renamed from readkit.epub/) ===
│   ├── 01_…/                          # 26 source publications
│   └── ...
│
├── fixtures/                          # tiny EPUBs used by Vitest + Playwright
│   ├── minimal-epub2.epub
│   ├── minimal-epub3.epub
│   └── README.md
│
├── tools/                             # Node TS build helpers (run with tsx or node --experimental-strip-types)
│   ├── build-manifest.ts              # replaces manifest.maker.py
│   ├── embed-into-epub.ts             # produces dist/embed/<id>.epub with reader injected
│   ├── build-solo.ts                  # post-build: reads dist/reader/* + each EPUB → dist/solo/<id>_<name>.html
│   └── lib/
│       ├── opf-parser.ts              # shared between manifest gen and engine fallback
│       └── zip.ts                     # wraps fflate / @zip.js/zip.js
│
├── tests/
│   ├── unit/                          # Vitest
│   │   ├── stores/
│   │   ├── controllers/
│   │   ├── engine/
│   │   └── tools/
│   └── e2e/                           # Playwright
│       ├── reader.spec.ts
│       ├── library.spec.ts
│       ├── drag-drop.spec.ts
│       ├── bookmarks.spec.ts
│       └── theme.spec.ts
│
├── dist/                              # build output, GITIGNORED (one-way change from legacy)
│   ├── reader/
│   ├── library/
│   ├── solo/
│   └── embed/
│
└── .planning/                         # GSD artefacts (existing)
```

### Structure rationale

- **`src/` is the only runtime source.** No more dual `readk.it/readk.it/` nesting. The four flavour entries co-exist at `src/main.<flavour>.ts` so Vite can find them via `rollupOptions.input` without per-flavour subdirectories.
- **`engine/` is a quarantine.** Nothing else imports `epubjs`. This is the single most important architectural rule — it lets us swap to `epub.ts` (TypeScript fork) or `foliate-js` later without touching components.
- **`controllers/` and `stores/` are DOM-free** so they are 100% Vitest-testable without jsdom theatrics. The Lit components compose them.
- **`tools/` runs in Node, not the browser.** Same TS sources, separate `tsconfig.node.json`. The manifest generator and the EPUB embedder are first-class build artefacts, not shell scripts.
- **`fixtures/` are tiny EPUBs.** They live in the repo so unit tests are deterministic and don't depend on the 26 production EPUBs (which are large).
- **`public/` is verbatim.** Vite copies its contents to `dist/` untouched; this is where fonts and splash art live so the bundler doesn't try to fingerprint them.
- **`html/` holds entry HTML.** Vite resolves `<script type="module" src="../main.reader.ts">` from these files. Putting them under `src/html/` keeps the project root clean.
- **`dist/` is gitignored** — deliberate break from legacy. We do not want to perpetuate the 700 MB committed-dist habit.

---

## 4. Component Model & Communication

Three communication mechanisms, each with a clear remit:

### 4.1 Properties (parent → child, ephemeral)

Use Lit reactive properties for *configuration* and *display data* that the parent already has.

```typescript
@customElement('readkit-cover-card')
export class CoverCard extends LitElement {
  @property({ type: Object }) publication!: Publication;
  @property({ type: Boolean }) selected = false;
  // ...
}
```

### 4.2 Custom events (child → parent / sibling, intent)

Use `dispatchEvent(new CustomEvent('book-open', { detail: pub, bubbles: true, composed: true }))` for *intent* (the user wants to open this book / toggle bookmark / select TOC entry). Never use events for state broadcasts.

`composed: true` is required when bubbling out of Shadow DOM. Type events with a typed event map (Lit pattern):

```typescript
declare global {
  interface HTMLElementEventMap {
    'book-open': CustomEvent<Publication>;
    'nav-select': CustomEvent<{ href: string }>;
    'theme-change': CustomEvent<ThemeName>;
  }
}
```

### 4.3 Context (provider → any descendant, app-wide)

Use [`@lit/context`](https://lit.dev/docs/data/context/) for things many descendants need read-only:

- The `EpubEngine` instance (provided by `<readkit-reader>`)
- The current `Preferences` (provided by `<readkit-reader>` via `PreferencesController`)
- The `ManifestStore` (provided by `<readkit-library>`)
- The `Router` (provided by `<readkit-app>`)

Context is preferred over a Redux-style global store because Lit's reactive update cycle already handles propagation, and context plays well with the host-controller pattern.

### 4.4 Reactive controllers (per-concern, behaviour bundles)

A reactive controller hooks into a host element's `connectedCallback` / `disconnectedCallback` / `requestUpdate` cycle. It is the Lit-idiomatic answer to "where does behaviour that isn't a component live?" — the answer is *not* a global service singleton.

```typescript
export class BookmarkController implements ReactiveController {
  bookmarks: Bookmark[] = [];
  constructor(private host: ReactiveControllerHost, private store: PersistenceStore, private bookId: string) {
    host.addController(this);
  }
  hostConnected() { this.load(); }
  async toggle(cfi: string) { /* … */ this.host.requestUpdate(); }
  private async load() { /* … */ this.host.requestUpdate(); }
}
```

A controller is instantiated by the component that needs it (typically `<readkit-reader>`) and either consumed locally or provided down the tree as context.

### 4.5 What does NOT live in components

- **No `localStorage` access in components.** Always go through `PersistenceStore`.
- **No `epubjs` import in components.** Always go through `EpubEngine`.
- **No `window.location` reads in components.** Always go through the router.

These three rules are the primary review criteria for any component PR.

---

## 5. epub.js Integration Pattern (the load-bearing decision)

epub.js wants to own a DOM container. It internally creates an `<iframe>` and renders publication HTML into it. This fights with Lit's Shadow DOM in three ways:
1. Lit's `render()` re-renders templates, which would orphan epub.js's iframe.
2. Shadow DOM scoping isolates the iframe from the page's `document`, breaking some of epub.js's own click/scroll listeners that walk up to the document.
3. `book.renderTo(elementOrId, opts)` accepts a string ID *or* an `HTMLElement` — passing a Shadow DOM element works at the JS level but lookups via `document.getElementById` inside epub.js do not see into shadow trees.

**Recommended pattern: a Light-DOM Lit element that owns the rendition.**

```typescript
@customElement('readkit-rendition')
export class RendionEl extends LitElement {
  @consume({ context: engineContext }) engine!: EpubEngine;

  // Light DOM: epub.js will inject an <iframe> into this element's children.
  // We do not write a render() that returns templates that touch the iframe area.
  protected createRenderRoot() {
    return this;
  }

  protected firstUpdated() {
    // Hand the actual element to the engine — never an ID string.
    this.engine.attach(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.engine.destroy();
  }
}
```

The wrapper element is a **terminal node**: it has no children declared in Lit templates, no `render()` method that mutates its contents. Its only job is to (a) be a stable DOM container and (b) tear down the engine on disconnect. This is the canonical "escape hatch for a third-party DOM library" pattern Lit's docs explicitly call out.

Everything else — toolbar, drawers, menus, bookmarks — uses Shadow DOM normally. Only this one element is Light DOM.

### 5.1 The `EpubEngine` interface

This interface is the abstraction that protects the rest of the codebase from epub.js's age and CVE history:

```typescript
export interface EpubEngine {
  // Lifecycle
  open(input: ArrayBuffer | Blob | string): Promise<BookMetadata>;
  attach(host: HTMLElement, opts?: AttachOptions): Promise<void>;
  destroy(): void;

  // Navigation
  next(): Promise<void>;
  prev(): Promise<void>;
  goToCfi(cfi: string): Promise<void>;
  goToHref(href: string): Promise<void>;

  // Toc / metadata
  getToc(): Promise<TocEntry[]>;
  getMetadata(): BookMetadata;

  // Theme / typography
  setTheme(theme: Theme): void;
  setTypography(t: Typography): void;

  // Locations (for progress indicator)
  generateLocations(charsPerLoc?: number): Promise<void>;
  currentLocation(): EngineLocation;

  // Events
  on<E extends keyof EngineEvents>(event: E, cb: (payload: EngineEvents[E]) => void): () => void;
}

export interface EngineEvents {
  'location-changed': EngineLocation;
  'rendition-ready': void;
  'error': Error;
}
```

The `EpubJsEngine` implementation owns the `Book`, `Rendition`, and `Themes` objects from epub.js and bridges its event names (`relocated`, `rendered`, `displayError`, ...) to the typed `EngineEvents`.

### 5.2 Where the `Book` instance lives

In a single field on the `<readkit-reader>` element, wrapped in `EpubJsEngine`. It is **not** a module-level singleton. This is one of the legacy anti-patterns (`var publication;` in `controller.js`) we are explicitly fixing — module-singleton state means you can never have two readers on one page (e.g. for tests, or for a "compare passages" feature later). The engine's lifetime is tied to the host element's lifetime via `disconnectedCallback`.

### 5.3 Theme application

epub.js's `Themes` API is `themes.register('dark', { body: { color: '#eee', background: '#111' } })` then `themes.select('dark')`. The engine's `setTheme(theme: Theme)` registers the three named themes once at attach time and then `select`s on demand. The reader chrome's own SCSS handles the *outer* chrome theme; epub.js handles the *inside-the-iframe* theme. Both must be kept in sync — that is the `PreferencesController`'s job.

### 5.4 Drag-drop input

`File` → `await file.arrayBuffer()` → `engine.open(buffer)`. epub.js accepts an `ArrayBuffer` directly via `book.open(buffer, 'binary')` (per the API docs). No need for a separate zip layer.

### 5.5 Caveats to flag for the implementer

- **CVE-2024-39307**: serve EPUBs from a sandboxed iframe or a different origin in production. For the solo flavour (everything inlined), this is moot. For the library flavour we should at minimum set the rendition iframe `sandbox` attribute (epub.js issue #1083 is open about formal support; the workaround is to set it on the iframe element after attach via a `MutationObserver` or to fork a tiny patch).
- **Locations are slow on big books.** `book.locations.generate(1024)` walks the spine and can take several seconds on a long novel. Run it lazily after first paint, off the critical path; the progress UI should degrade gracefully (show "loading…" until ready).
- **`renderTo` with a CSS selector string fails inside Shadow DOM.** Always pass the element. Our pattern enforces this because `<readkit-rendition>` is Light DOM and `firstUpdated()` passes `this`.

---

## 6. Vite Build Orchestration

Goal: produce four flavours from one source tree, one config file, one `npm run build`. The pattern below uses **Vite's `mode` mechanism plus conditional `defineConfig`** rather than four separate config files. This is the official Vite-recommended pattern for "conditional based on command/mode" (`defineConfig(({ mode }) => …)`).

### 6.1 The single `vite.config.ts`

```typescript
// vite.config.ts (sketch — illustrative, not final)
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const flavour = mode; // 'reader' | 'library' | 'solo' | 'embed'

  const inputs: Record<string, string> = {
    reader:  resolve(__dirname, 'src/html/reader.html'),
    library: resolve(__dirname, 'src/html/library.html'),
    solo:    resolve(__dirname, 'src/html/solo.html'),
    embed:   resolve(__dirname, 'src/html/embed.html'),
  };

  const isSingleFile = flavour === 'solo' || flavour === 'embed';

  return {
    root: 'src',
    publicDir: '../public',
    build: {
      outDir: `../dist/${flavour}`,
      emptyOutDir: true,
      rollupOptions: {
        input: flavour === 'library'
          ? { library: inputs.library, reader: inputs.reader } // library carries reader.html alongside
          : { [flavour]: inputs[flavour] },
      },
      assetsInlineLimit: isSingleFile ? Number.MAX_SAFE_INTEGER : 4096,
      cssCodeSplit: !isSingleFile,
    },
    plugins: isSingleFile ? [viteSingleFile()] : [],
    css: {
      preprocessorOptions: {
        scss: { /* dart-sass options */ },
      },
    },
  };
});
```

Key points:
- **`mode` carries the flavour name.** `vite build --mode reader`, `vite build --mode library`, etc. Mode also drives which `.env.<mode>` file is loaded (handy for flavour-specific feature flags later).
- **The `library` flavour is multi-page** — Vite supports this natively via `rollupOptions.input` mapping multiple HTML inputs. The library page sits alongside an embedded copy of the reader.
- **The `solo` and `embed` flavours use `vite-plugin-singlefile`** to inline JS+CSS into one HTML.
- **`assetsInlineLimit: Number.MAX_SAFE_INTEGER`** for single-file flavours forces fonts/images to also be inlined as data URIs (the legacy `grunt-readkit-data-uri` step, replaced by Vite's built-in mechanism).

### 6.2 npm scripts (package.json)

```json
{
  "scripts": {
    "build:manifest": "tsx tools/build-manifest.ts",
    "build:reader":   "vite build --mode reader",
    "build:library":  "npm run build:manifest && vite build --mode library",
    "build:solo":     "npm run build:reader && tsx tools/build-solo.ts",
    "build:embed":    "npm run build:reader && tsx tools/embed-into-epub.ts",
    "build":          "npm run build:reader && npm run build:library && npm run build:solo && npm run build:embed",
    "dev":            "vite --mode reader",
    "test":           "vitest run",
    "test:e2e":       "playwright test",
    "lint":           "eslint . --ext .ts"
  }
}
```

### 6.3 Why this multi-config-by-mode approach over per-flavour `vite.config.*.ts`

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **One config, mode-driven** (recommended) | Single source of truth; shared plugins/aliases; small diff between flavours; conditional via `defineConfig(({ mode }) => …)` | Requires one config to be aware of all flavours | ✓ Adopt |
| Per-flavour `vite.config.<flavour>.ts` | Each config is self-contained | Duplication; aliases/plugins drift; needs a wrapper script | Reject — duplication outweighs isolation at this size |
| Vite library mode (`build.lib`) | Designed for shipping libraries; produces ESM+UMD | Wrong shape for app bundles with HTML entries | Reject for reader/library; not needed |
| `tsdown`/Rolldown direct | More control | Loses Vite plugin ecosystem (vite-plugin-singlefile, lit-plugin) | Reject unless we hit a wall |

### 6.4 Solo flavour internals

The solo flavour produces *one HTML file per source EPUB*. Build steps:
1. `npm run build:reader` produces a `dist/reader/index.html` with everything externalised.
2. `tools/build-solo.ts`:
   - Reads `dist/reader/index.html` + JS + CSS → inlines them into a template (or runs a separate `vite build --mode solo` that uses `vite-plugin-singlefile` against an entry that imports the EPUB as a base64 string).
   - For each EPUB: zip the EPUB on disk into a single binary blob, base64-encode it, and inject into the HTML as `window.__READKIT_EPUB__ = '<base64>'` plus a comment marker.
   - The `main.solo.ts` runtime decodes that base64, calls `engine.open(arrayBuffer)`, and the rest of the reader is identical to the drag-drop flavour.

Recommended approach for v1: skip the second `vite build --mode solo` and just use a Node-side string-injection step. The solo runtime entry (`main.solo.ts`) does the base64 decode at boot. This is simpler than configuring vite-plugin-singlefile per-EPUB.

### 6.5 EPUB-embedded flavour internals

For each `.epub` in `epubs/`:
1. Take the built `dist/reader/` tree.
2. Copy it into `OEBPS/readk.it/` inside a copy of the EPUB.
3. Patch the EPUB's `content.opf` `<manifest>` to declare the new files (so EPUB validators don't choke).
4. Re-zip with mimetype-first ordering (EPUB requires the `mimetype` file to be the first entry, uncompressed).
5. Output to `dist/embed/<id>.epub`.

`tools/embed-into-epub.ts` owns this. Use `fflate` or `@zip.js/zip.js` for the zip work; both have first-class TypeScript types and no Node-only deps so the same code can be reused at runtime if we ever add an in-browser embed feature.

### 6.6 Manifest generator (replaces `manifest.maker.py`)

`tools/build-manifest.ts`:
- Walks `epubs/*/META-INF/container.xml`
- For each, locates the OPF, parses with `fast-xml-parser` or `xmldom`
- Extracts `dc:title`, `dc:identifier`, `package@version`, spine length, cover image href
- Emits `dist/library/manifest.json` (or `epubs/manifest.json` for dev)
- Runs as a pre-step in `npm run build:library`

It is a plain Node script, not a Vite plugin, because:
- It runs once per build, not per Vite request → no benefit from being a plugin
- It must run *before* `vite build --mode library` so the manifest is on disk for the library page to fetch (or we could inline it as a virtual module — but a static JSON file is simpler and cacheable)

If we later want it inside Vite (e.g. dev-server hot-reloads when an EPUB is added), promote it to a Vite plugin then. Not v1.

---

## 7. Routing Model

Three options were considered:

| Option | Lib size | Lit-native | History API | Verdict |
|--------|----------|------------|-------------|---------|
| **Custom hash router (≈40 lines)** | 0 KB | n/a | No | ✓ Adopt for v1 |
| `@vaadin/router` | ~7 KB | Compatible | Yes | Defer — overkill for two routes |
| `@lit-labs/router` | ~3 KB | Yes (Labs) | Yes | Defer — Labs status, breaking changes risk |

**Recommendation: a tiny hand-rolled router using the History API**, exposed as a `RouterController`. Why:
- The reader has at most two top-level views (library, reader-with-book) plus optional deep-link state (`#cfi=…`).
- Hash-based routing already worked in legacy. Switching to History API is mostly a quality-of-life upgrade (cleaner URLs); it is *not* required for the four-flavour build to succeed. For the solo and embed flavours we may actually want hash-only because they may be opened via `file://` where History API has no server to fall back on.
- A 40-line `RouterController` removes a dependency and keeps the surface area discoverable.

**Pattern:**
- Library flavour: `/<id>` → opens that book (or `#/<id>` on `file://`)
- Reader flavour: hash-only, `#cfi=epubcfi(/6/4!…)` for deep links to position
- Solo / embed flavours: no routing — they always show one book

The router is a `ReactiveController` provided via context. Components do not read `window.location` directly.

---

## 8. State Management

Lit's reactive properties + `@lit/context` + a small set of reactive controllers cover everything. **No Redux, no MobX, no Zustand.** Justifications:

- **Per-component ephemeral state:** `@property` / `@state`. (e.g. "drawer is open")
- **App-wide read-mostly state:** `@lit/context` provider on `<readkit-reader>` or `<readkit-library>`. (e.g. current preferences, current book metadata, current location)
- **Async/persistent state:** `PersistenceStore` is the source of truth for anything that survives reload. Controllers wrap reads/writes and call `host.requestUpdate()` after mutations.
- **Cross-component intent:** custom events that bubble + composed.

The legacy `utility.publish/subscribe` pubsub bus is *not* re-implemented. Lit's reactive update + custom events + context cover the cases pubsub was used for, without the global $({}) singleton.

---

## 9. Persistence Layer

| Aspect | Legacy | New | Why change |
|--------|--------|-----|------------|
| Backend | `localStorage` (sync, ~5 MB cap) | `IndexedDB` (async, gigabytes available) | Drag-drop EPUBs can be large; bookmarks-with-thumbnails will exceed 5 MB on a heavy reader; sync `localStorage` blocks the main thread. |
| Library | `jquery.storage` plugin | `idb-keyval` (or hand-rolled wrapper, ~50 lines) | One small dep with good TS types, vs. no dep at all. Pick `idb-keyval` for v1; hand-roll only if it costs us nothing more than 30 mins. |
| Namespacing | Per-EPUB by `dc:identifier` | Same — `dc:identifier` is the partition key | Preserve behaviour. |
| Schema versioning | None (silent breakage on schema changes) | `schemaVersion` field per record; migration functions | Modernisation requirement; otherwise we will break existing bookmarks the first time we add a field. |

### 9.1 Schema (initial)

```typescript
type Identifier = string;

interface PreferencesRecord {
  schemaVersion: 1;
  identifier: Identifier;
  font: 'serif' | 'sans-serif';
  fontSize: number;        // px
  lineHeight: number;      // unitless
  theme: 'light' | 'dark' | 'sepia';
}

interface PositionRecord {
  schemaVersion: 1;
  identifier: Identifier;
  cfi: string;             // epub.js CFI (replaces page index + per-page x/y)
  updatedAt: number;       // epoch ms
}

interface BookmarkRecord {
  schemaVersion: 1;
  identifier: Identifier;
  cfi: string;
  label?: string;
  createdAt: number;
}

interface HistoryRecord {
  schemaVersion: 1;
  identifier: Identifier;
  stack: string[];         // array of CFIs, most-recent last
}
```

Stores: `preferences`, `positions`, `bookmarks`, `history`. Migration runs on first read after a `schemaVersion` mismatch. The `LocationController` reads/writes `positions` debounced at ~1s.

### 9.2 PersistenceStore shape

```typescript
export class PersistenceStore {
  constructor(private db: IDBDatabase) {}
  static async open(): Promise<PersistenceStore> { /* idb-keyval / idb open */ }

  async getPreferences(id: Identifier): Promise<PreferencesRecord | null>;
  async putPreferences(p: PreferencesRecord): Promise<void>;
  async getPosition(id: Identifier): Promise<PositionRecord | null>;
  async putPosition(p: PositionRecord): Promise<void>;
  async listBookmarks(id: Identifier): Promise<BookmarkRecord[]>;
  async addBookmark(b: BookmarkRecord): Promise<void>;
  async removeBookmark(id: Identifier, cfi: string): Promise<void>;
  // …
}
```

This is a plain class, no Lit dependencies. 100% Vitest-testable with `fake-indexeddb`.

---

## 10. Data Flow

### 10.1 Boot → first paint (canonical reader flavour)

```
HTML loads
  ↓
main.reader.ts
  ↓
import './shell/readkit-app'
  ↓
<readkit-app> (custom element upgrade)
  ↓ (router decides route)
<readkit-reader> rendered
  ↓ owns
PreferencesController, BookmarkController, LocationController, RouterController
  ↓ provides via context
EpubJsEngine instance (constructed eagerly; not yet opened)
  ↓
<readkit-rendition> rendered (Light DOM, empty)
  ↓ firstUpdated()
engine.attach(this)
  ↓ engine waits for engine.open(...) to have resolved
  ↓
URL parsed → ?book=<path> or hash deep-link
  ↓
engine.open(fetch(book) | dropFile.arrayBuffer() | inlineBase64)
  ↓ resolves → engine emits 'rendition-ready'
LocationController subscribes → reads PersistenceStore.getPosition(id) → engine.goToCfi(saved)
PreferencesController applies stored theme + typography
  ↓
First paint
```

### 10.2 User interaction → persistence

```
User clicks "next" in <readkit-toolbar>
  ↓ dispatchEvent('reader-next')
<readkit-reader> handler → engine.next()
  ↓ epub.js navigates → 'relocated' event
EpubJsEngine emits 'location-changed' → LocationController.onLocation(loc)
  ↓ debounced 1s
PersistenceStore.putPosition({ identifier, cfi, updatedAt: now })
```

### 10.3 Drag-drop flow

```
User drops .epub on <readkit-dropzone>
  ↓ DropzoneController.onDrop(file)
file.arrayBuffer()
  ↓
engine.open(buffer)
  ↓ resolves → metadata.identifier
RouterController.replace(`/`)   // clear deep-link
PreferencesController.load(identifier)
LocationController.load(identifier)  // may resolve with no saved position
  ↓
engine attaches, displays first page
```

### 10.4 Library → reader navigation

```
<readkit-cover-card> click
  ↓ event 'book-open' { detail: publication }
<readkit-library> handler → router.push(`/${publication.id}`)
  ↓ ManifestStore knows the path → builds reader URL
  (in library flavour: navigate to ./reader/index.html?book=<path>)
  (in solo flavour: load from inline base64 — not applicable to library)
```

### 10.5 Theme change

```
<readkit-theme-menu> dispatches 'theme-change' { detail: 'dark' }
  ↓
PreferencesController.setTheme('dark')
  ↓
host.requestUpdate()  // chrome re-paints
engine.setTheme('dark')  // iframe contents re-paint
PersistenceStore.putPreferences(...)  // persisted
```

---

## 11. Architectural Patterns

### 11.1 Engine quarantine

**What:** Exactly one TS file (`epub-engine.ts`) defines the engine interface; exactly one (`epubjs-engine.ts`) implements it; no other file imports `epubjs`.
**When to use:** Whenever you depend on an upstream library that is high-risk (unmaintained, security history, version churn, or just complex).
**Trade-offs:** A small upfront wrapping cost (one extra interface, ~150 LOC of bridge code) buys swap-out optionality. Given epub.js's status, this is a net win.

### 11.2 Light-DOM escape hatch

**What:** Override `createRenderRoot()` to return `this` for the *one* component that hosts a third-party DOM. Every other component uses Shadow DOM.
**When to use:** When integrating a library that expects to own DOM (epub.js, charting libs, Mapbox, CodeMirror).
**Trade-offs:** That one component loses style scoping — its children inherit page styles. Mitigation: keep that element a thin terminal wrapper with no styled descendants of its own.

### 11.3 Reactive controllers per concern

**What:** One controller per cross-cutting behaviour (preferences, bookmarks, location, router, dropzone). Owned by the host element that needs it.
**When to use:** Behaviour that spans multiple lifecycle hooks and may be reused.
**Trade-offs:** More files than a "stuff it all in the component" approach. But each controller is independently unit-testable.

### 11.4 Controllers + context + events triad

**What:** Three communication mechanisms with strict remit (props for config, events for intent, context for app-wide state).
**When to use:** Always — this *is* the Lit way.
**Trade-offs:** Slight upfront discipline cost. The win is that 95% of the codebase is component-local; only context tokens cross boundaries.

### 11.5 Mode-driven Vite config

**What:** One `vite.config.ts` returning a config function that branches on `mode`. Each flavour invoked as `vite build --mode <flavour>`.
**When to use:** When producing several output shapes from one source tree.
**Trade-offs:** The single file does more. Alternative is per-flavour configs which duplicate.

### 11.6 Build-time codegen via Node TS scripts

**What:** Manifest generation, EPUB embedding, solo bundling are all Node TS scripts under `tools/`. Run with `tsx`. They are first-class build artefacts, not shell scripts.
**When to use:** Any build step that needs more than 10 lines of logic.
**Trade-offs:** Same TS toolchain (and types) as the runtime — wins consistency.

---

## 12. Build Order — Dependency Graph for the Roadmapper

This is the most important section for the downstream roadmap. The order below identifies which architectural pillars must be in place before others can be built. Items at the same level can be built in parallel by separate executors.

### Tier 0 — Foundation (no dependencies; can run in parallel)

| Pillar | Output | Enables |
|--------|--------|---------|
| **Repo skeleton** | `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` (reader flavour only), `.browserslistrc`, `.nvmrc`, `eslint`, basic `dist/` gitignore | Everything below |
| **Test harness** | `vitest.config.ts`, `playwright.config.ts`, `fixtures/minimal-epub*.epub`, smoke "hello world" tests passing in CI | Test-driven plans for every other pillar |
| **PersistenceStore** | `src/stores/persistence.ts` + schema types + Vitest tests (against `fake-indexeddb`) | PreferencesController, BookmarkController, LocationController |
| **EpubEngine interface** | `src/engine/epub-engine.ts` (interface + types only, no implementation) + a `MockEngine` for tests | EpubJsEngine, all reader components |

These four are the only "buildable in isolation" pillars. They map to the four columns most plans will need to consume. Roadmap should put them in Phase 1.

### Tier 1 — Engine + chrome (depends on Tier 0)

| Pillar | Depends on | Output |
|--------|------------|--------|
| **EpubJsEngine** | EpubEngine interface | `src/engine/epubjs-engine.ts` + integration tests against fixtures |
| **`<readkit-rendition>`** | EpubJsEngine | Single component that hosts the iframe + Playwright "render fixture EPUB" test |
| **PreferencesController + theme tokens** | PersistenceStore | Controllers + SCSS theme tokens + light/dark/sepia tested by Vitest + Playwright contrast snapshot |
| **Router + shell components** | (nothing — independent) | `<readkit-app>`, RouterController, route table |

Tier 1 plans can be partially parallelised: rendition + engine are one work-stream; preferences/themes are another; shell/router is a third.

### Tier 2 — Reader UI (depends on Tier 1)

| Pillar | Depends on | Output |
|--------|------------|--------|
| **`<readkit-reader>` composition** | rendition, engine, preferences, router | The composed reader page (toolbar + drawer placeholder + rendition) |
| **`<readkit-toolbar>`** | shell | Header bar with back / library / online indicator |
| **`<readkit-toc-drawer>`** | engine.getToc(), reader composition | Side drawer; clicking entry calls engine.goToHref |
| **`<readkit-bookmarks>` + BookmarkController** | persistence, reader composition | Toggle / list bookmarks |
| **`<readkit-typography-menu>` + `<readkit-theme-menu>`** | preferences, theme tokens | Font/size/line-height/theme switchers |
| **`<readkit-dropzone>` + DropzoneController** | engine.open, reader composition | Drag-drop overlay |

These can run highly in parallel — each component is self-contained.

### Tier 3 — Library flavour (depends on Tier 1, partly Tier 2)

| Pillar | Depends on | Output |
|--------|------------|--------|
| **Manifest generator** | (nothing — pure Node TS) | `tools/build-manifest.ts` + Vitest tests |
| **`<readkit-library>` + `<readkit-cover-grid>` + `<readkit-cover-card>`** | shell, manifest generator | Library page renders manifest |
| **Library → reader navigation** | router, library shell | Click cover → opens reader with `?book=<path>` |

### Tier 4 — Multi-flavour build orchestration (depends on Tier 1–3)

| Pillar | Depends on | Output |
|--------|------------|--------|
| **Vite config: library MPA mode** | library shell, reader shell | `vite build --mode library` produces `dist/library/` with both pages |
| **Vite config: solo flavour + `tools/build-solo.ts`** | reader, vite-plugin-singlefile | One HTML per EPUB, bundled |
| **Vite config: embed flavour + `tools/embed-into-epub.ts`** | reader, zip lib | Each `.epub` re-emitted with reader injected |
| **CI pipeline** | all of the above | GitHub Actions runs lint + Vitest + Playwright + all four builds |

### Visualisation

```
Tier 0 (parallel):
  [Repo skeleton]   [Test harness]   [PersistenceStore]   [EpubEngine interface]
        │                 │                  │                       │
        └─────────────────┴──────┬───────────┴───────────────────────┘
                                 ▼
Tier 1 (partial parallel):
  [EpubJsEngine]    [PreferencesCtrl + themes]    [Router + shell]
        │                       │                         │
        └───────────────┬───────┴─────────────────────────┘
                        ▼
Tier 2 (high parallel):  reader + toolbar + toc + bookmarks + menus + dropzone
                        │
                        ▼
Tier 3 (parallel):     [manifest generator]   [library page]   [navigation glue]
                        │
                        ▼
Tier 4 (sequential):   [library MPA]  →  [solo]  →  [embed]  →  [CI]
```

The roadmapper should map each Tier to a phase. Within a phase, plans can be parallelised on the boundaries shown.

---

## 13. Cross-Reference: Architectural Pillars → v1 Active Requirements

Each pillar from §12 is justified by one or more v1 active requirements from PROJECT.md.

| Pillar | v1 requirement(s) enabled |
|--------|---------------------------|
| Repo skeleton + lockfile | "Reproducible build on a current Node LTS"; "Replace Grunt + Compass + Ruby SASS + Python 2…" |
| Test harness (Vitest + Playwright + CI) | "Unit tests with Vitest…"; "E2E tests with Playwright…"; "CI runs the full test suite on every push" |
| PersistenceStore (IndexedDB) | "Per-publication preferences"; "Bookmarks and reading-position memory per EPUB" — modernised storage backing |
| EpubEngine interface | Insulation from `epubjs` v0.3.x risk; protects "Adopt epub.js as the EPUB parsing/rendering engine" against the upstream-stale risk |
| EpubJsEngine | "Render EPUB 2 and EPUB 3 publications"; "Adopt epub.js as the EPUB parsing/rendering engine" |
| `<readkit-rendition>` | "Render EPUB 2 and EPUB 3 publications"; foundation for everything reader-side |
| PreferencesController + theme tokens | "Add light / dark / sepia theme support with persistence"; "Per-publication preferences (font family, font-size, line-height) persisted per-EPUB" |
| Router + shell | "Hash-based 'library' routing into individual publications"; "Drop AppCache; offline reading delivered solely through the solo single-file HTML build" |
| `<readkit-reader>` composition + Lit components | "Adopt Lit for the reader and library UI chrome"; "Update the reader UI where modernisation makes the existing chrome show its age" |
| `<readkit-toc-drawer>` | "Add a TOC drawer / navigation panel to the reader" |
| `<readkit-bookmarks>` + BookmarkController | "Bookmarks and reading-position memory per EPUB" |
| `<readkit-dropzone>` + DropzoneController | "Drag-and-drop user EPUB upload remains a first-class feature" |
| Manifest generator (`tools/build-manifest.ts`) | "Replace Grunt + Compass + Ruby SASS + Python 2 manifest maker with Vite + dart-sass + a Node-based manifest generator" |
| Library shell + cover grid | "Library carousel of cover images linking to publications"; "Update the library UI where modernisation makes the existing carousel show its age" |
| Vite reader build | "Reproduce all four build flavours…" (reader flavour) |
| Vite library MPA build | "…" (library flavour) |
| Solo build (`vite-plugin-singlefile` + `tools/build-solo.ts`) | "…" (solo flavour); "Drop AppCache; offline reading delivered solely through the solo single-file HTML build" |
| Embed build (`tools/embed-into-epub.ts`) | "…" (EPUB-embedded flavour); "Re-build the 26 source EPUBs in `readkit.epub/` against the new reader" |
| CI pipeline | "CI runs the full test suite on every push" |
| Cross-browser test matrix | "Cross-browser support: current and last 1–2 versions of Chrome, Edge, Firefox, Safari, on desktop, mobile, and tablet" |

---

## 14. Anti-Patterns to Avoid

### Anti-Pattern 1: epub.js leakage outside `src/engine/`

**What people do:** `import Book from 'epubjs'` in a component, controller, or test outside `src/engine/`.
**Why it's wrong:** Defeats the engine quarantine. The whole point is that swapping engines later is a one-file change. Direct imports anywhere else create a hidden dependency graph that makes the swap impossible without grep-and-replace archaeology.
**Do this instead:** All epub.js calls go through `EpubEngine`. If you need a method that the interface doesn't expose, *add the method to the interface*, then implement it.

### Anti-Pattern 2: Module-level singleton state for the engine / book / location

**What people do:** Replicate the legacy `var publication, layout, chrome;` pattern as `let engine: EpubEngine` at the top of a module.
**Why it's wrong:** Same bug as legacy — only one publication can ever load on one page. Tests can't run two readers in parallel. Future "compare passages" or "preview" features become impossible.
**Do this instead:** Engine is a field on the host Lit element. Lifetime tied to `connectedCallback` / `disconnectedCallback`.

### Anti-Pattern 3: `localStorage` calls anywhere except `PersistenceStore`

**What people do:** Sprinkle `localStorage.getItem('theme')` in components for "convenience".
**Why it's wrong:** Bypasses schema versioning, namespacing by EPUB identifier, and async batching. Makes the migration to IndexedDB happen in N places, not one.
**Do this instead:** Always go through `PersistenceStore`. If something feels too small to warrant a method, add it to the store anyway — keeping the boundary tight is the point.

### Anti-Pattern 4: Putting epub.js's iframe inside a Shadow DOM

**What people do:** Naïvely make `<readkit-rendition>` use Shadow DOM, then debug for hours why epub.js's `document.getElementById` calls (used internally) can't find anything.
**Why it's wrong:** Shadow DOM is opaque to `document` queries. epub.js was written before web components; it does not honour Shadow boundaries.
**Do this instead:** Override `createRenderRoot()` to return `this` *only* for `<readkit-rendition>`. Every other component keeps its Shadow DOM.

### Anti-Pattern 5: A jQuery-style `pubsub` bus

**What people do:** Recreate the legacy `utility.publish/subscribe` as `EventTarget` singletons under different names.
**Why it's wrong:** Reinvents a pattern Lit already solves with reactive properties + custom events + context. A global bus has no static analysis story (TypeScript can't tell who listens to `'publication_loaded'`).
**Do this instead:** Use `dispatchEvent` for intents (typed via `HTMLElementEventMap`), `@lit/context` for state, reactive controllers for behaviour.

### Anti-Pattern 6: Per-publication runtime plug-ins (legacy `client.config.js`)

**What people do:** Reintroduce a way for individual EPUBs to inject their own JS modules into the reader at runtime.
**Why it's wrong:** PROJECT.md *explicitly* drops this. It is incompatible with ES module bundling, adds attack surface, and was a 2013-era solution to a problem (per-book theming) that we now solve via the engine's own `themes.register` API.
**Do this instead:** All variation lives in the EPUB's own CSS / scripted content (within epub.js's iframe sandbox). The reader is uniform across all books.

---

## 15. Integration Points

### 15.1 External libraries

| Library | Integration | Notes |
|---------|-------------|-------|
| `lit` (Lit 3.x) | All component classes extend `LitElement`; templates via `html\`...\`` | Use `@customElement`, `@property`, `@state`, `@query` decorators. |
| `@lit/context` | Provider on shells, `@consume` on consumers | Strongly typed Symbols. One context per "service" (engine, preferences, manifest). |
| `epubjs` (0.3.88) | Wrapped by `EpubJsEngine` only | Pin version exactly; do NOT auto-upgrade across minor (it's stale anyway). |
| `idb-keyval` (or `idb`) | Used inside `PersistenceStore` only | Consider hand-rolling if it removes a dep. |
| `vite-plugin-singlefile` | `vite.config.ts` for solo + embed flavours | Inlines JS+CSS+assets into one HTML. |
| `fflate` or `@zip.js/zip.js` | Used inside `tools/embed-into-epub.ts`; also potentially inside engine for ArrayBuffer drag-drop (epub.js handles this internally though) | Pick one. fflate is smaller, zip.js has a richer API. |
| `fast-xml-parser` (or `@xmldom/xmldom`) | Used inside `tools/build-manifest.ts` for OPF parsing | fast-xml-parser is the lighter choice. |
| Vitest + `fake-indexeddb` | Unit tests for stores | Drop-in IndexedDB mock. |
| Playwright | E2E tests | Standard browser matrix per `.browserslistrc`. |

### 15.2 Internal boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Component ↔ component | Properties (down), events (up), context (across) | Strict; no shared mutable state. |
| Component ↔ engine | Through `EpubEngine` interface only | Engine never calls into components. |
| Component ↔ persistence | Through controller (which wraps the store) | Components should not import `PersistenceStore` directly; go through a controller. |
| Engine ↔ persistence | None (decoupled) | Persistence is bookmark/preference data; engine is rendition state. They meet only in controllers. |
| Build tools ↔ runtime | One direction: tools produce artefacts (manifest.json, .epub, .html); runtime consumes. | No runtime imports `tools/`. |

---

## 16. Scaling Considerations

This is a static, browser-only reader. "Scaling" mostly means "performance on a single client".

| Scale | Adjustments |
|-------|-------------|
| Single book, < 200 pages | No special handling. Default `book.locations.generate(1024)` runs in < 1 s. |
| Long novel (Vanity Fair, ~900 pages) | Generate locations lazily, off the critical path; show a "calculating progress…" hint. Persist generated locations to IndexedDB so subsequent opens are instant. |
| Very large EPUB (textbook with embedded video) | Drag-drop only, no inlined solo flavour for these. Solo flavour size cap should be enforced by `tools/build-solo.ts` (e.g. warn if > 50 MB). |
| Many bookmarks (>100 per book) | IndexedDB handles this fine. UI: virtual list in `<readkit-bookmarks>` if needed (defer to v2). |
| Many books in library (>100) | Library carousel today displays a few dozen. Beyond ~200, switch from carousel to grid + search. Defer to v2. |

### Scaling priorities (what breaks first)

1. **Locations generation on long books** — first-paint latency. Mitigation: cache generated locations in IndexedDB.
2. **Solo flavour file size on long books with media** — base64 inflates ~33%; a 30 MB EPUB becomes a ~40 MB HTML. Mitigation: warn in `tools/build-solo.ts`; maybe gzip-encode the base64 string at build time.
3. **Cold-start IndexedDB open on first launch** — < 50 ms typically; not a real problem.

---

## 17. Open Architectural Questions (flag for phase research)

These are deliberately *not* decided here; they should be researched within their phase:

1. **`idb-keyval` vs hand-rolled IndexedDB wrapper** — both fine; pick once during the persistence phase.
2. **`fflate` vs `@zip.js/zip.js` for `tools/embed-into-epub.ts`** — pick during the embed-flavour phase.
3. **`fast-xml-parser` vs `@xmldom/xmldom` vs hand-rolled OPF parser** — pick during the manifest-generator phase.
4. **`vite-plugin-singlefile` vs hand-rolled inliner** — almost certainly the plugin, but verify the embed flavour's exact requirements.
5. **CFI deep-link format in URL hash** — `#cfi=epubcfi(/6/4!…)` is verbose; consider compressing or URL-encoding. Decide during the routing phase.
6. **Sandbox attribute on epub.js iframe** — needed for CVE-2024-39307 mitigation in production. Implement via `MutationObserver` on `<readkit-rendition>` or fork. Decide during engine-hardening phase.
7. **EpubEngine swap-out (epub.js → epub.ts fork → foliate-js)** — keep on the radar as a future hardening track; not v1 work, but the interface design must support it.

---

## 18. Sources

Confidence levels indicated. Verified means I cross-checked at least two sources or read primary documentation.

**HIGH confidence (verified):**
- [Lit Working with Shadow DOM (createRenderRoot)](https://lit.dev/docs/components/shadow-dom/) — Light DOM opt-out pattern.
- [Lit Reactive Controllers](https://lit.dev/docs/composition/controllers/) — Controller pattern, host-attachment lifecycle.
- [Lit Context](https://lit.dev/docs/data/context/) — `@lit/context`, ContextProvider, `@consume`.
- [Vite Building for Production](https://vite.dev/guide/build) — `rollupOptions.input` for MPA, build modes.
- [Vite Configuring Vite](https://vite.dev/config/) — `defineConfig(({ command, mode }) => …)` conditional config.
- [Vite Static Asset Handling](https://vite.dev/guide/assets) — `assetsInlineLimit` for inlining.
- [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) — single-HTML inlining.

**MEDIUM confidence (single authoritative source or docs known to be partial):**
- [epub.js GitHub README](https://github.com/futurepress/epub.js/) — last release July 2020; 484 open issues; `book.renderTo`, `Themes`, `Locations` API.
- [epub.js API.md](https://github.com/futurepress/epub.js/blob/master/documentation/md/API.md) — public API summary.
- [foliate-js](https://github.com/johnfactotum/foliate-js) — alternative engine; `<foliate-view>` custom element; "library not stable, expect API to change".
- [epub.ts (TypeScript fork)](https://github.com/likecoin/epub.ts) — typed fork of epub.js v0.3.93.
- [Vaadin Router with Lit](https://vaadin.com/docs/latest/hilla/lit/guides/routing) — Lit-compatible routing option.
- [@lit-labs/router](https://www.npmjs.com/package/@lit-labs/router) — Labs status, breaking-changes risk.
- [LocalStorage vs IndexedDB](https://dev.to/tene/localstorage-vs-indexeddb-javascript-guide-storage-limits-best-practices-fl5) — capacity, sync vs async.
- [epub.js issue #1083 — sandbox attribute](https://github.com/futurepress/epub.js/issues/1083) — CVE mitigation context.

**LOW confidence (single non-authoritative source; flag for verification during the relevant phase):**
- CVE-2024-39307 specifics for epub.js — mentioned in search results; verify against NVD before relying on the specifics. Mitigation pattern (sandbox attribute) is sound regardless.

---

*Architecture research for: browser-only EPUB reader, greenfield rewrite of readk.it on TypeScript + Vite + Lit + epub.js*
*Researched: 2026-04-26*
