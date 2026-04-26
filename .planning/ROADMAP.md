# Roadmap: readk.it (modernised)

## Overview

readk.it is a TypeScript + Vite + Lit greenfield rewrite of a 2013-era EPUB reader. The product has two faces of one isomorphic engine: a Node TypeScript build script that emits a self-contained HTML per book, and a browser drag-drop reader that runs the **same** EPUB processor in the browser and renders into the **same** Lit chrome. This roadmap walks from a reproducible repo skeleton through the test harness, persistence backbone, and isomorphic EPUB processor; lands the sanitisation + chapter-rendering pipeline before any chapter HTML touches the DOM; assembles the reader chrome and reader UX surface; delivers both output paths (drag-drop entry and per-book HTML build script); rebuilds the library index against the 26 source EPUBs; and closes with accessibility, cross-browser hardening, and the memory-budget gate. Granularity is FINE: 12 phases, sized so each phase plan is self-contained enough to be executed by a different LLM working from `PLAN.md` alone.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Repo Hygiene** - Reproducible Node-LTS-22 toolchain, TypeScript+Vite+Lit scaffolding, lockfile, .gitignore, pre-commit size blocker, du-sh CI gate, dev-server entry
- [ ] **Phase 2: Test Harness, Fixtures & CI** - Vitest + Playwright scaffolds, minimal-EPUB + malformed corpus + scripted-payload fixtures, GitHub Actions running unit + E2E on every push
- [ ] **Phase 3: Persistence Backbone** - Schema-versioned IndexedDB `PersistenceStore`, `bookId(metadata)` helper, `localStorage` fallback policy for `file://`, full Vitest coverage against `fake-indexeddb`
- [ ] **Phase 4: Isomorphic EPUB Processor** - `EpubProcessor` accepting `ArrayBuffer`/path, runs identically in Node + browser; encryption refusal, malformed-EPUB error surfacing, blob-URL discipline
- [ ] **Phase 5: Sanitisation + Chapter Rendering Pipeline** - DOMPurify allowlist + `sanitise()` utility, scripted-payload non-execution test, first end-to-end "load EPUB → render chapter into Lit chrome" smoke flow
- [ ] **Phase 6: Reader Chrome Shell** - Lit chrome composition (`<readkit-app>`/`<readkit-reader>`), light/dark/sepia themes with `prefers-color-scheme` + `prefers-reduced-motion`, `file://` and HTTP both work
- [ ] **Phase 7: Reader Navigation & Input Model** - TOC drawer, Pointer Events tap zones (25/50/25), keyboard nav (Left/Right/Home/End/Esc), reading-progress indicator
- [ ] **Phase 8: Reading Position, Bookmarks, Typography** - Per-EPUB resume on reopen, add/list/jump/remove bookmarks, typography menu (font family + size + line-height) persisted per-publication
- [ ] **Phase 9: Drag-Drop Entry** - Browser drop reader using shared `EpubProcessor`, iOS file-picker fallback, processing progress + clear error UI
- [ ] **Phase 10: Build Script — Per-Book HTML Output** - `tools/build-book.ts` produces one self-contained HTML per `.epub`, no AppCache, all 26 source EPUBs rebuild, CI size cap enforced
- [ ] **Phase 11: Library Index Page** - `dist/library/index.html` cover-grid library listing all built books with title/author and client-side search/sort + "continue reading" affordance
- [ ] **Phase 12: Accessibility, Cross-Browser Hardening, CI Matrix** - WCAG 2.x AA + EPUB Accessibility 1.1, ARIA + keyboard reach + 200% reflow, Playwright matrix on Chromium/WebKit/Firefox, memory-budget test, CSP enforcement

## Phase Details

### Phase 1: Foundation & Repo Hygiene
**Goal**: A contributor can clone the repo, run `pnpm install` on Node LTS 22, and produce a runnable dev server with strict TypeScript + Lit scaffolding, while a pre-commit hook + CI working-tree size gate prevent the legacy 700 MB-`dist/` regression.
**Depends on**: Nothing (first phase)
**Requirements**: BUILD-01, BUILD-02, BUILD-03, BUILD-08, BUILD-09
**Success Criteria** (what must be TRUE):
  1. A fresh clone + `pnpm install` on Node LTS 22 succeeds without Python, Ruby, or any globally-installed binary beyond Node and pnpm
  2. `pnpm dev` starts Vite's dev server and serves the drag-drop reader entry point with HMR
  3. `pnpm typecheck` passes against strict TypeScript (ES2022, ES modules) with no AMD/RequireJS in the new tree and no jQuery/Lo-Dash/iScroll/Modernizr/Detectizr in dependencies
  4. A staged file larger than 1 MB is rejected by the pre-commit hook; `dist/`, `dist*/`, `node_modules/`, `.cache/`, `*.epub` are listed in `.gitignore`
  5. CI fails the build if the working tree (excluding `.git`) exceeds an agreed cap; one committed lockfile (`pnpm-lock.yaml`) makes the install reproducible
**Plans**: TBD (estimate 6 plans)
**Notes**: This phase establishes hygiene gates that all later phases depend on. Repo-hygiene CONCERNS (committed dist/, vendored libs, GitHub-pinned forked plugins) must be defended against here, not retrofitted. Cross-LLM execution discipline begins here: every plan output references exact file paths, no TODOs, no `@ts-ignore`. The legacy `readk.it/` tree may be left alive for reference but must be excluded from every Vite/Vitest/Playwright glob.

### Phase 2: Test Harness, Fixtures & CI
**Goal**: Vitest, Playwright, and GitHub Actions are wired so that every push to a branch runs unit + E2E tests against a curated EPUB fixture corpus (minimal-valid + malformed + scripted-payload), and a failing test blocks merge.
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-02, TEST-04
**Success Criteria** (what must be TRUE):
  1. `pnpm test` runs Vitest unit tests; `pnpm test:e2e` runs Playwright E2E tests on Chromium, WebKit, and Firefox
  2. A curated fixture corpus exists under `tests/fixtures/`: at least one minimal-valid EPUB 2, one minimal-valid EPUB 3, a malformed corpus (truncated zip, invalid OPF, missing nav, encrypted, zip bomb), and a scripted-payload EPUB containing `<script>` and inline `on*=` handlers
  3. A GitHub Actions workflow runs unit + E2E on every push and every pull request; a failing test blocks merge
  4. Smoke "Hello readk.it" tests pass in both Vitest and Playwright; fixtures policy (LFS vs fixtures repo vs in-tree) is documented in `.planning/codebase/CONVENTIONS.md`
**Plans**: TBD (estimate 5 plans)
**Notes**: TEST-03 (scripted payload non-execution) is intentionally NOT in this phase — its fixture lands here, but the assertion lands in Phase 5 where the sanitiser pipeline first sees chapter HTML. Coverage enforcement is enabled in CI but tightened later as more code lands. Playwright `--project` matrix is set up here even if only one project runs initially; full multi-browser-on-every-PR is finalised in Phase 12.

### Phase 3: Persistence Backbone
**Goal**: A schema-versioned, async, IndexedDB-backed `PersistenceStore` namespaced by EPUB identifier (with content-hash fallback) is the single source of truth for all per-book persisted data, with a documented `localStorage` fallback for `file://` runtimes that disable IndexedDB.
**Depends on**: Phase 1, Phase 2
**Requirements**: (none — infrastructure phase enabling READER-03, READER-06, THEME-01, THEME-02, LIBRARY-02)
**Success Criteria** (what must be TRUE):
  1. `src/stores/persistence.ts` exports a `PersistenceStore` class with versioned schema and stores for `preferences`, `positions`, `bookmarks`, `history`
  2. `bookId(metadata) → string` derives a stable identifier from `dc:identifier` first, falling back to a content hash; `bookId` is the only key path used by the store
  3. Vitest tests against `fake-indexeddb` cover happy paths, schema migration from a synthetic v0 record, cross-book leakage (book A theme-dark vs book B default), and quota-exceeded handling
  4. The `file://` fallback policy is documented and exercised by a Playwright test that opens a built per-book HTML directly via `file://`
**Plans**: TBD (estimate 4 plans)
**Notes**: This phase has no v1 requirement of its own — it is enabling infrastructure for Phases 6, 8, 11. Pitfall 7 (cross-book leakage) is the primary defence here. **Per-book namespacing discipline must be a non-negotiable invariant** that all later phases inherit. No `localStorage` access elsewhere in the codebase is permitted; if a component thinks it needs `localStorage`, it goes through the store.

### Phase 4: Isomorphic EPUB Processor
**Goal**: A single TypeScript module `src/engine/epub-processor.ts` accepts an `ArrayBuffer` (browser) or file path (Node), produces a typed `Publication { metadata, spine, toc, assets }`, surfaces visible errors on malformed EPUBs, refuses encrypted EPUBs early, and tracks every blob URL it creates.
**Depends on**: Phase 2 (fixtures + harness), Phase 3 (typed metadata used to derive `bookId`)
**Requirements**: ENGINE-01, ENGINE-03, ENGINE-04, ENGINE-05
**Success Criteria** (what must be TRUE):
  1. The same `EpubProcessor.open()` call resolves identically in a Vitest Node environment and a Vitest browser environment, against the minimal-valid EPUB 2 + EPUB 3 fixtures, returning the typed `Publication`
  2. Each malformed-corpus fixture (truncated zip, invalid OPF, missing nav, zip bomb) produces a visible, recoverable error with a 30-second timeout fallback; no path silently hangs or swallows exceptions
  3. An EPUB containing `META-INF/encryption.xml` is detected before any chapter is decoded and produces a clear "encrypted EPUBs are not supported" outcome; no partial render
  4. Every `URL.createObjectURL` the processor creates is tracked and revoked on `Publication.close()`; a Vitest test asserts revoke parity with create
**Plans**: TBD (estimate 6 plans)
**Notes**: This is the load-bearing phase of the project. It must NOT touch the DOM. It is consumed downstream by Phase 9 (drag-drop) and Phase 10 (build script) — both call the same module. The DOMPurify integration is **not** here (it's Phase 5) because chapter HTML doesn't yet meet the DOM in this phase. CFI / locator strategy is also defined here as part of `Publication`'s typed shape, but full CFI implementation can be a useful subset rather than full EPUB CFI 1.1. `fflate` and `fast-xml-parser` are quarantined to this module — no other file may import them.

### Phase 5: Sanitisation + Chapter Rendering Pipeline
**Goal**: Every chapter HTML string passes through DOMPurify with the project's documented allowlist before insertion into the reader chrome's DOM; the scripted-payload fixture is rendered into a Lit chrome and an automated test asserts no script executes.
**Depends on**: Phase 4 (`Publication` + chapter HTML extraction)
**Requirements**: ENGINE-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. `src/engine/sanitise.ts` exports a `sanitise(chapterHtml: string): string` function whose allowlist is documented in `.planning/codebase/CONVENTIONS.md` (preserves `epub:type`, `lang`, ARIA, common typography classes; strips `<script>`, `on*=`, `<base>`, dangerous protocols)
  2. A Vitest test asserts that representative inputs from the scripted-payload fixture have all `<script>`, inline event handlers, and dangerous-protocol URLs removed
  3. A Playwright E2E test loads the scripted-payload EPUB end-to-end and asserts no `<script>` executes (no `alert`, no fetch to attacker, no `postMessage` to host)
  4. A first end-to-end "load EPUB → render chapter into Lit chrome" smoke flow exists: minimal-EPUB renders its first chapter into a sanitised Shadow-DOM container, snapshot of the first paragraph matches expected output
  5. No code path in the repository invokes Lit's `unsafeHTML()` directive (or equivalent) on EPUB-supplied content; an ESLint rule or grep-based CI check enforces this
**Plans**: TBD (estimate 5 plans)
**Notes**: **This is the sanitisation gate**. The moment chapter HTML first touches the DOM is right here. Pitfall 5 (untrusted EPUB content as same-origin XSS vector) is the primary defence. After this phase, every consumer of chapter HTML — reader chrome, drag-drop, build script — relies on this single sanitiser; there must be no second renderer that bypasses it. CSP report-only mode can begin here on the dev server; CSP enforcement lands in Phase 12.

### Phase 6: Reader Chrome Shell
**Goal**: A modernised Lit-based reader chrome composes `<readkit-app>` + `<readkit-reader>` with light/dark/sepia themes (respecting `prefers-color-scheme`) and decorative animations gated by `prefers-reduced-motion`; the chrome operates correctly when served over HTTP(S) and when opened directly via `file://`.
**Depends on**: Phase 3 (PreferencesController writes through PersistenceStore), Phase 5 (chrome embeds the sanitised chapter renderer)
**Requirements**: READER-01, READER-08, THEME-01, THEME-03
**Success Criteria** (what must be TRUE):
  1. The reader chrome is composed entirely of Lit Web Components — no jQuery, no Lo-Dash, no iScroll, no Modernizr/Detectizr — and presents a modernised look-and-feel that does not mimic the 2013 visual design
  2. Light, dark, and sepia themes are switchable from a theme menu; the user's choice persists per-publication with a global default fallback; on first load with no prior choice, the reader follows `prefers-color-scheme`
  3. Decorative animations and transitions in the chrome are suppressed when `prefers-reduced-motion: reduce` is matched; a Playwright test asserts no decorative animation runs under the matched media query
  4. The reader operates correctly via both `https://localhost` and `file:///path/to/built-book.html`; a Playwright test exercises both schemes against a built artefact
  5. A live region surfaces engine errors visibly; no error is `console.error`-only
**Plans**: TBD (estimate 6 plans)
**Notes**: There is **no iframe** between chrome and chapter content (architectural change vs original epub.js plan). The `<readkit-rendition>` Light-DOM escape hatch from the original architecture is removed; chapter content lives in the Shadow DOM of a `<readkit-chapter-view>` (or equivalent) and is sanitised on every insertion. `100dvh` not `100vh`. `overscroll-behavior-y: contain` on the scroll container.

### Phase 7: Reader Navigation & Input Model
**Goal**: Users can navigate a publication via TOC drawer, pointer-event swipe + tap zones (25/50/25), and keyboard (Left/Right/Home/End/Esc), and a reading-progress indicator updates as they move through the publication.
**Depends on**: Phase 6 (chrome shell composition)
**Requirements**: READER-02, READER-04, READER-05, READER-07
**Success Criteria** (what must be TRUE):
  1. The TOC drawer mirrors the EPUB's hierarchical TOC; selecting an entry navigates the reader and auto-closes the drawer; the drawer is reachable and operable via keyboard alone
  2. Pointer Events drive swipe (horizontal advance) and tap zones (left 25% prev, centre 50% chrome toggle, right 25% next); native `Pointer*` only — no `webkit*`/`moz*` shims
  3. Keyboard navigation: Left/Right Arrow advance pages, Home/End jump to start/end, Esc closes any open drawer; all interactive elements show a visible focus ring (`:focus-visible`)
  4. A reading-progress indicator (% or chapter X of Y) is visible to the user and updates as the user navigates; a Playwright test asserts progress monotonicity across 5 page advances
**Plans**: TBD (estimate 5 plans)
**Notes**: Phase 7 is highly parallelisable — TOC, tap zones, keyboard, progress are largely independent. Pitfall 10 (cross-browser viewport / pull-to-refresh / iOS address bar) is the primary defence. iOS-Safari-emulated Playwright runs are mandatory by end of phase. Progress is computed from a useful CFI subset (or chapter-href + element-index fallback); the choice is documented in CONVENTIONS.md.

### Phase 8: Reading Position, Bookmarks, Typography
**Goal**: Per-EPUB reading position is persisted (keyed by `bookId(metadata)`) and restored on reopen; bookmarks can be added, listed, jumped to, and removed per-publication; the typography menu adjusts font family + size + line-height with per-publication persistence and global-default fallback.
**Depends on**: Phase 3 (PersistenceStore), Phase 6 (chrome), Phase 7 (navigation)
**Requirements**: READER-03, READER-06, THEME-02
**Success Criteria** (what must be TRUE):
  1. Closing and reopening the same EPUB resumes at the last-read position; a Playwright test opens a fixture, navigates to chapter 3 page 2, reloads, and asserts the same position
  2. Bookmarks: add at current position, list with timestamps, jump to a saved bookmark, remove a bookmark; bookmarks persist across reloads and are scoped to the publication (a Vitest cross-book test asserts no leakage)
  3. The typography menu adjusts font family (incl. system serif/sans-serif and a documented set), font size, and line-height; choices persist per-publication and a global default applies on first open
  4. Position writes are debounced (≤1 s) so rapid navigation does not thrash IndexedDB
**Plans**: TBD (estimate 5 plans)
**Notes**: This phase is where Pitfall 7 (persistence cross-book leakage) is verified end-to-end with real reader UI, not just `fake-indexeddb` unit tests. Per-book vs global preferences override (DF-09) is implemented here so v1.x extensions are clean. Position serialisation format (CFI subset vs chapter-href + element-index) must match Phase 4's choice.

### Phase 9: Drag-Drop Entry
**Goal**: A user dropping a `.epub` (or selecting it via a file-picker fallback for iOS Safari) on the drag-drop reader triggers the **same** `EpubProcessor` from Phase 4 and renders into the **same** Lit chrome from Phase 6; processing progress is visible and failures surface a clear, recoverable error UI.
**Depends on**: Phase 4 (engine), Phase 5 (sanitiser), Phase 6 (chrome), Phase 7 (navigation), Phase 8 (persistence wired)
**Requirements**: DROP-01, DROP-02, DROP-03
**Success Criteria** (what must be TRUE):
  1. Dropping a fixture EPUB on the drag-drop entry triggers `EpubProcessor.open(arrayBuffer)` and renders the publication into the existing Lit chrome — verified by reading the same `Publication` shape both paths produce
  2. An `<input type="file" accept=".epub">` fallback is always present; a Playwright test in iOS WebKit mode (where HTML5 drag-drop is not implemented) opens an EPUB via the file picker
  3. A visible progress indicator is shown while the EPUB is being processed; a clear error UI surfaces on processing failure (no stalled spinner, no console-only error) — exercised by the malformed-corpus fixtures
  4. A Playwright "memory regression" assertion: after dropping 3 different EPUBs in sequence, no detached `<readkit-chapter-view>` instances accumulate (precursor to the full memory budget test in Phase 12)
**Plans**: TBD (estimate 4 plans)
**Notes**: **No EpubProcessor code duplication is permitted between Phase 9 and Phase 10**. If a path needs differentiation, it lives at the *call-site* in `EpubProcessor`, not in two copies of the module. The "two-output drift" Pitfall 4 is the primary defence; the smoke-flow snapshot from Phase 5 is reused here as a regression gate.

### Phase 10: Build Script — Per-Book HTML Output
**Goal**: `tools/build-book.ts` accepts one or more `.epub` files and emits one self-contained HTML file per book with chapter content + reader chrome + assets baked in, opening directly in any target browser without a server; running against the 26 source EPUBs in `readkit.epub/` succeeds for every publication; no AppCache manifests appear in any output.
**Depends on**: Phase 4 (engine, called from Node), Phase 5 (sanitiser), Phase 6 (chrome bundles into per-book HTML), Phase 8 (persistence works on `file://`), Phase 9 (smoke flow shared)
**Requirements**: BUILD-04, BUILD-06, BUILD-07
**Success Criteria** (what must be TRUE):
  1. `pnpm build` (or equivalent) runs `tools/build-book.ts` and emits one self-contained HTML per `.epub` in the input directory; each opens in Chromium, WebKit, and Firefox without a server (verified by Playwright on `file://`)
  2. Running the build against all 26 source EPUBs in `readkit.epub/` succeeds for every publication; a CI step asserts 26 outputs exist
  3. No output HTML contains `<html manifest=…>` or any `*.appcache` reference; `git grep -i 'manifest=\|appcache'` over `dist/` returns zero hits
  4. A CI size cap (start at 50 MB per per-book HTML; tunable) emits a hard error on exceed; the largest source EPUB is exercised on real iOS Safari before the phase ships
  5. The smoke-flow snapshot from Phase 5 (first paragraph of `04_kafka_the_metamorphosis`) renders identically when produced by the build script and when produced by the drag-drop entry — proving no two-output drift
**Plans**: TBD (estimate 7 plans)
**Notes**: Pitfall 3 (solo HTML size limits) is the primary defence — the size cap must be in place from day one of this phase, not retrofitted. Asset rebase strategy (data URIs vs embedded packed zip + `fflate` runtime decompression) is decided here based on a spike against the largest NZ-publisher EPUBs; the decision is documented as a Key Decision in PROJECT.md. The legacy `client.config.js` plug-in surface is **not** preserved.

### Phase 11: Library Index Page
**Goal**: `pnpm build` additionally emits `dist/library/index.html` — a static cover-grid library listing every built book with cover thumbnail, title, and author, plus client-side search/sort and a "continue reading" affordance reading from the shared `PersistenceStore`.
**Depends on**: Phase 3 (PersistenceStore for "continue reading"), Phase 10 (per-book HTML outputs to link to)
**Requirements**: BUILD-05, LIBRARY-01, LIBRARY-02
**Success Criteria** (what must be TRUE):
  1. Running the build emits `dist/library/index.html` listing all built books; each card shows cover thumbnail, title, and author, and links to the book's standalone per-book HTML
  2. The library uses a cover-grid layout (replacing the legacy carousel); responsive breakpoints render 2 cols on mobile, 4–6 on tablet, 6–10 on desktop
  3. Client-side search filters books by title or author; sort options include title (A–Z), author, and last-read; a "continue reading" affordance highlights the most-recently-read book with a deep link to its last position read from `PersistenceStore`
  4. The library index opens correctly via both `https://` and `file://` and a Playwright test asserts that "continue reading" reflects a position written by the reader (cross-page state through the shared store)
**Plans**: TBD (estimate 4 plans)
**Notes**: The library is a publisher-curated landing page — no Service Worker / PWA in v1 (anti-feature; standalone HTMLs are inherently offline). Cross-page state through `PersistenceStore` requires that the library and the per-book HTMLs share an origin or a `file://` directory; the policy is documented. Cover thumbnails are extracted by the build script from each EPUB's OPF cover reference.

### Phase 12: Accessibility, Cross-Browser Hardening, CI Matrix
**Goal**: The reader chrome and rendered book content meet WCAG 2.x AA + EPUB Accessibility 1.1; the Playwright matrix runs on Chromium + WebKit + Firefox (desktop + mobile-emulated) for both outputs on every PR; a memory-budget Playwright test bounds heap growth across 10 sequential EPUB opens; CSP is enforced.
**Depends on**: All prior phases
**Requirements**: A11Y-01, A11Y-02, A11Y-03, TEST-05
**Success Criteria** (what must be TRUE):
  1. Reader chrome and rendered book content pass an automated axe scan (WCAG 2.x AA) and a manual screen-reader pass (e.g. NVDA or VoiceOver) on a curated walk-through (open library → open book → open TOC → set theme → set typography → bookmark → reload)
  2. Every interactive element has an accessible name (ARIA label or visible text), a correct semantic role, and full keyboard reachability; visible focus rings on all interactive elements
  3. Reflow at 200% zoom in Chromium, WebKit, and Firefox produces no horizontal scrollbars and no clipped content in the reader chrome — verified by Playwright at the matrix viewport sizes
  4. A Playwright memory-budget test opens 10 different EPUBs sequentially via the drag-drop entry and asserts `usedJSHeapSize` does not grow beyond a stated bound (e.g. ≤ 100 MB delta from baseline)
  5. A strict CSP is enforced on every output (host document + per-book HTML); `script-src 'self'`, `frame-src 'none'`, image/font URLs allowed via `blob:` and `data:` only as required; a Playwright test asserts no CSP violation on a known-malicious test EPUB
**Plans**: TBD (estimate 6 plans)
**Notes**: This is the "ships" phase. Real-device smoke (real iOS Safari, real Chrome Android, real iPadOS split-screen) is mandatory before tagging v1. Pitfall 2 (memory leaks on book swap) and Pitfall 10 (cross-browser quirks) close out here. Documentation deliverables: README, supported-browsers note, dev-onboarding, and the "what's still legacy in `readk.it/`" parity audit deciding whether the legacy tree is now deletable.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Repo Hygiene | 0/TBD | Not started | - |
| 2. Test Harness, Fixtures & CI | 0/TBD | Not started | - |
| 3. Persistence Backbone | 0/TBD | Not started | - |
| 4. Isomorphic EPUB Processor | 0/TBD | Not started | - |
| 5. Sanitisation + Chapter Rendering Pipeline | 0/TBD | Not started | - |
| 6. Reader Chrome Shell | 0/TBD | Not started | - |
| 7. Reader Navigation & Input Model | 0/TBD | Not started | - |
| 8. Reading Position, Bookmarks, Typography | 0/TBD | Not started | - |
| 9. Drag-Drop Entry | 0/TBD | Not started | - |
| 10. Build Script — Per-Book HTML Output | 0/TBD | Not started | - |
| 11. Library Index Page | 0/TBD | Not started | - |
| 12. Accessibility, Cross-Browser Hardening, CI Matrix | 0/TBD | Not started | - |
