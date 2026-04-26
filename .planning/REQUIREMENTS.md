# Requirements: readk.it (modernised)

**Defined:** 2026-04-26
**Core Value:** Convert any EPUB into a clean, self-contained reading experience that works in any modern browser — desktop, mobile, or tablet — with zero runtime dependencies on a third-party EPUB library, on a build any contributor can reproduce on a current developer machine.

> Each requirement is **atomic, testable, and user- or build-centric**. REQ-IDs follow `[CATEGORY]-[NUMBER]`. Categories: `BUILD` (build pipeline + repo + tooling), `ENGINE` (isomorphic EPUB processor + sanitisation), `READER` (reader chrome + navigation + persistence), `DROP` (drag-and-drop runtime), `LIBRARY` (static library index), `THEME` (themes + typography), `A11Y` (accessibility floor), `TEST` (test infra + CI).

## v1 Requirements

### Build pipeline & tooling

- [ ] **BUILD-01**: A contributor can clone the repo, run `pnpm install` (or `npm install`) on Node LTS 22, and produce all v1 artefacts via `pnpm build` with no Python, no Ruby, and no globally-installed binaries beyond Node and pnpm/npm
- [ ] **BUILD-02**: All runtime source code is TypeScript (strict mode, ES2022 target, ES modules) — no AMD / RequireJS / `define([...])` modules in the new tree
- [ ] **BUILD-03**: All UI chrome is implemented as Lit Web Components — no jQuery, no Lo-Dash, no iScroll, no Modernizr, no Detectizr, no tinytim
- [ ] **BUILD-04**: Running `pnpm build` produces one self-contained HTML file per `.epub` in the input directory (chapter content + reader chrome + assets all baked in), each opening directly in any target browser without a server
- [ ] **BUILD-05**: Running `pnpm build` produces a static library index page (`dist/library/index.html`) listing all built books with cover thumbnails, title, author, and a link to each book's standalone HTML
- [ ] **BUILD-06**: The build emits no AppCache manifests; `<html manifest=…>` references are absent from all output HTML
- [ ] **BUILD-07**: Running the build against the 26 source EPUBs in `readkit.epub/` succeeds for every publication and produces a per-book HTML for each
- [ ] **BUILD-08**: A single committed lockfile (`pnpm-lock.yaml` or `package-lock.json`) makes the install reproducible; `dist/` and `node_modules/` are git-ignored; pre-commit blocks files larger than 1 MB
- [ ] **BUILD-09**: The build supports a developer-mode (`pnpm dev`) that runs Vite's dev server and serves the drag-drop reader entry point with hot-module reload

### EPUB engine

- [ ] **ENGINE-01**: A single isomorphic TypeScript module (`src/engine/epub-processor.ts`) accepts an `ArrayBuffer` (browser) or file path (Node), unzips with `fflate`, parses `META-INF/container.xml`, OPF, and Nav (NCX or EPUB 3 nav doc) using `fast-xml-parser`, and returns a typed `Publication { metadata, spine, toc, assets }` — usable by both the build script and the browser drag-drop entry without code duplication
- [ ] **ENGINE-02**: Every chapter HTML string is passed through DOMPurify with the project's allowlist before insertion into the reader DOM; no code path uses `unsafeHTML()` (or equivalent) on EPUB-supplied content
- [ ] **ENGINE-03**: The processor surfaces visible, recoverable errors when fed a malformed EPUB (truncated zip, invalid OPF, missing nav, etc.) — no silent hangs, no swallowed exceptions; a 30-second timeout fires if processing stalls
- [ ] **ENGINE-04**: The processor detects encrypted EPUBs (`META-INF/encryption.xml`) early and presents a clear "encrypted EPUBs are not supported" message rather than partially rendering
- [ ] **ENGINE-05**: All blob URLs created by the processor are tracked and explicitly revoked when a publication is closed or replaced — no leaked `URL.createObjectURL` references

### Reader chrome & navigation

- [ ] **READER-01**: The reader chrome is implemented as Lit Web Components and replaces the legacy chrome with a modernised look-and-feel (no requirement to mimic the 2013 visual design)
- [ ] **READER-02**: The reader presents a TOC drawer / navigation panel that mirrors the EPUB's hierarchical table of contents; selecting an entry navigates to that location and auto-closes the drawer
- [ ] **READER-03**: Reading position is persisted per-EPUB (keyed by `dc:identifier` with content-hash fallback) using a versioned schema; reopening the same publication resumes at the last-read position
- [ ] **READER-04**: Touch navigation uses Pointer Events; horizontal swipe advances pages; tap zones (left 25% / centre 50% / right 25%) navigate previous / toggle chrome / next
- [ ] **READER-05**: A reading-progress indicator (% or chapter X of Y) is visible to the user and updates as the user moves through the publication
- [ ] **READER-06**: Bookmarks can be added at the current reading location, listed, jumped to, and removed; bookmarks persist per-publication
- [ ] **READER-07**: Keyboard navigation works without a mouse: Left/Right Arrow advance pages, Home/End go to start/end, Esc closes any open drawer; visible focus rings on all interactive elements
- [ ] **READER-08**: The reader operates correctly when served over HTTP(S) AND when opened directly via a `file://` URL (e.g. double-clicking a built per-book HTML)

### Drag-and-drop runtime

- [ ] **DROP-01**: A user dropping a `.epub` file onto the drag-drop entry point (or selecting it via a file-picker fallback) triggers the same `EpubProcessor` used by the build script, and the publication renders into the same Lit reader chrome
- [ ] **DROP-02**: The drag-drop entry presents an `<input type="file" accept=".epub">` fallback for browsers without HTML5 drag-and-drop (e.g. iOS Safari)
- [ ] **DROP-03**: The drag-drop UI shows progress while the EPUB is being processed and a clear error state if processing fails

### Library index

- [ ] **LIBRARY-01**: The library index page presents a cover-grid layout (replacing the legacy carousel) showing every built book with cover thumbnail, title, and author
- [ ] **LIBRARY-02**: The library index supports client-side search and sort (by title / author / last-read) and a "continue reading" affordance per-book that links into the user's last-read position when present in `localStorage` / `IndexedDB`

### Themes & typography

- [ ] **THEME-01**: Light, dark, and sepia themes are available; user choice persists; the reader respects `prefers-color-scheme` on first load if the user has not made a manual choice
- [ ] **THEME-02**: Font family, font size, and line-height are user-adjustable from a typography menu; choices persist per-publication with a global default fallback
- [ ] **THEME-03**: Animations and transitions respect `prefers-reduced-motion`; users with this preference enabled see no decorative animations

### Accessibility

- [ ] **A11Y-01**: The reader chrome and rendered book content meet WCAG 2.x AA conformance and EPUB Accessibility 1.1 conformance for reflowable content
- [ ] **A11Y-02**: All interactive elements have accessible names (ARIA labels or visible text), correct semantic roles, and keyboard reachability
- [ ] **A11Y-03**: Reflow at 200% zoom in the target browsers does not produce horizontal scrollbars or content clipping in the reader chrome

### Tests & CI

- [ ] **TEST-01**: Unit tests (Vitest) cover the EPUB processor (happy paths + malformed-EPUB fixtures), the persistence layer, the sanitisation utility, and pure controllers; coverage is enforced in CI for these modules
- [ ] **TEST-02**: End-to-end tests (Playwright) exercise the drag-drop reader and a built per-book HTML on Chromium, WebKit, and Firefox (desktop and mobile-emulated viewports), covering: open EPUB, navigate spine, open TOC drawer and jump, switch theme, set typography preferences, add and jump to a bookmark, reload and resume position
- [ ] **TEST-03**: A test EPUB containing `<script>` and inline event handlers in chapter HTML is part of the corpus, and an automated test asserts that no script executes when that EPUB is rendered
- [ ] **TEST-04**: CI runs the full unit + E2E suite on every push and on every pull request; a failing test blocks merge
- [ ] **TEST-05**: A memory-budget Playwright test opens 10 different EPUBs in sequence and asserts that the JavaScript heap (`usedJSHeapSize`) does not grow beyond a stated bound

## v2 Requirements

Deferred to a future release. Tracked but not in the v1 roadmap.

### Reader features
- **READER-V2-01**: Continuous-scroll mode toggle (alongside the default paginated mode)
- **READER-V2-02**: In-book full-text search across the spine
- **READER-V2-03**: Annotations / highlights / margin notes with persistence and export
- **READER-V2-04**: Footnote popovers (inline footnote rendering rather than chapter jumps)
- **READER-V2-05**: Image inline-zoom on tap

### Reading systems
- **ENGINE-V2-01**: Fixed-layout EPUB support (pinch-zoom, spread mode)
- **ENGINE-V2-02**: RTL / vertical writing mode support

### Tooling
- **BUILD-V2-01**: Embedded packed-zip + runtime decompression for per-book HTML files that exceed the size cap (escalation path beyond data-URI inlining)
- **BUILD-V2-02**: Optional Service Worker / PWA mode for the library index (online catalog with offline cache)

### Differentiators
- **THEME-V2-01**: Additional fonts including OpenDyslexic
- **THEME-V2-02**: Justify, hyphenation, margin/line-length controls
- **READER-V2-06**: Reading-time estimate on the library cover grid
- **READER-V2-07**: Onboarding hint on first launch
- **READER-V2-08**: Per-publication note that drag-drop has occurred (history list)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Internet Explorer / pre-Chromium Edge support | Modernisation premise; IE10 was the 2013 floor |
| Standalone HTML running inside e-reader apps (Apple Books, Calibre) | Output targets browsers only |
| Service Worker / PWA on the library index in v1 | Standalone HTML is inherently offline; no Service Worker complexity for v1 |
| Backwards compatibility with previously deployed solo HTMLs | Source EPUBs are rebuilt against the new build script |
| Honouring the legacy per-publication `client.config.js` plug-in API | Runtime injection of arbitrary AMD modules is incompatible with ES modules and adds attack surface |
| Cross-device reading-position sync | Reader stays local-only |
| Server-side or multi-user features | Reader remains browser-only by design |
| Third-party runtime EPUB libraries (epub.js, Readium navigator, foliate-js) | Replaced by the isomorphic TS engine we own |
| The legacy "EPUB-embedded" fourth flavour | Subsumed by the standalone HTML output |
| Fixed-layout EPUB support in v1 | ~92% of new EPUB contracts are reflowable; all 26 source EPUBs are reflowable; defer to v2 |
| Accounts / sync / cloud storage | Browser-only, no backend |
| DRM / encrypted EPUBs | Refused with a clear error rather than partially rendered |
| Analytics / ads / cross-site tracking | Anti-feature for a private reader |
| Page-curl / 3D animations | Anti-feature; respects `prefers-reduced-motion` |
| TTS (text-to-speech) | Deferred to v2+ |
| In-book full-text search | Deferred to v2 |
| Annotations / highlights / margin notes | Deferred to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUILD-01 | Phase 1 | Pending |
| BUILD-02 | Phase 1 | Pending |
| BUILD-03 | Phase 1 | Pending |
| BUILD-04 | Phase 10 | Pending |
| BUILD-05 | Phase 11 | Pending |
| BUILD-06 | Phase 10 | Pending |
| BUILD-07 | Phase 10 | Pending |
| BUILD-08 | Phase 1 | Pending |
| BUILD-09 | Phase 1 | Pending |
| ENGINE-01 | Phase 4 | Pending |
| ENGINE-02 | Phase 5 | Pending |
| ENGINE-03 | Phase 4 | Pending |
| ENGINE-04 | Phase 4 | Pending |
| ENGINE-05 | Phase 4 | Pending |
| READER-01 | Phase 6 | Pending |
| READER-02 | Phase 7 | Pending |
| READER-03 | Phase 8 | Pending |
| READER-04 | Phase 7 | Pending |
| READER-05 | Phase 7 | Pending |
| READER-06 | Phase 8 | Pending |
| READER-07 | Phase 7 | Pending |
| READER-08 | Phase 6 | Pending |
| DROP-01 | Phase 9 | Pending |
| DROP-02 | Phase 9 | Pending |
| DROP-03 | Phase 9 | Pending |
| LIBRARY-01 | Phase 11 | Pending |
| LIBRARY-02 | Phase 11 | Pending |
| THEME-01 | Phase 6 | Pending |
| THEME-02 | Phase 8 | Pending |
| THEME-03 | Phase 6 | Pending |
| A11Y-01 | Phase 12 | Pending |
| A11Y-02 | Phase 12 | Pending |
| A11Y-03 | Phase 12 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |
| TEST-03 | Phase 5 | Pending |
| TEST-04 | Phase 2 | Pending |
| TEST-05 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 after roadmap creation (12 phases, FINE granularity); all 38 v1 requirements mapped to exactly one phase.*
