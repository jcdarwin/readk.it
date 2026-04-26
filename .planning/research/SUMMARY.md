# Project Research Summary

**Project:** readk.it (modernised) — TypeScript + Vite + Lit greenfield rewrite of a 2013-era EPUB reader
**Domain:** Browser-only EPUB reader with a static build pipeline
**Researched:** 2026-04-26
**Confidence:** HIGH

> **Read this first.** This SUMMARY reconciles four parallel research files (`STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`) against the **authoritative project model** in `.planning/PROJECT.md`, which was revised *after* those research files were written. Where research and PROJECT.md disagree, **PROJECT.md wins**. Sections of the research that have been superseded are explicitly flagged here so downstream phase-planning agents (which may be other LLMs) do not pick up stale assumptions. This document is intentionally self-contained.

## Executive Summary

readk.it is a TypeScript + Vite + Lit greenfield rewrite of a 2013-era AMD/jQuery/Grunt EPUB reader. The product has **two faces of the same engine**: (1) a Node TypeScript build script that consumes `.epub` files and emits one self-contained HTML per book — chapter content, CSS, fonts, and images all baked in — and (2) a browser drag-drop reader that accepts a dropped `.epub` and runs the **same isomorphic TypeScript EPUB-processing engine** in the browser, rendering into the **same Lit-based reader chrome**. A static library index page (also produced by the build script) is an optional secondary output. Both outputs are static; there is no backend.

The architectural shape is much simpler than the original research briefs assumed. **There is no third-party EPUB engine** — we own the EPUB processor, an isomorphic TS module built on `fflate` (zip) and `fast-xml-parser` (OPF/Nav). epub.js, Readium navigator, and foliate-js are all explicitly rejected at the constraint level. **There is no iframe boundary**: rendered chapter HTML is sanitised (DOMPurify) and inserted directly into the reader chrome's DOM. The legacy four-flavour build is collapsed to two outputs (per-book HTML + optional library index); the EPUB-embedded flavour is dropped. Reflowable EPUBs only in v1; fixed-layout is deferred. The locked stack is TypeScript 6.0.3 + Vite 8.0.10 (MPA mode) + Lit 3.3.2 + Vitest 4.1.5 (with `@vitest/browser-playwright`) + Playwright 1.59.1 + dart-sass 1.99.0 + fflate 0.8.2 + fast-xml-parser 5.7.2 + vite-plugin-singlefile 2.3.3, on Node LTS 22.

The dominant risks are (a) **untrusted EPUB content as XSS vector** — chapter HTML inserted directly into the reader DOM must be sanitised on every path, with no `unsafeHTML()` shortcut; (b) **solo HTML size limits** — base64-inlined image-heavy EPUBs crash mobile Safari past ~50 MB and need a CI size cap and a packed-zip-with-runtime-decompression fallback; (c) **two-output drift** — Node build path and browser drag-drop share the engine but exercise different runtimes (`file://` vs `https://`, no Web Workers in some) and will silently diverge unless every PR exercises both; (d) **repository hygiene** — the legacy repo carries ~700 MB of committed `dist/` snapshots; the new tree must `.gitignore` `dist*/`, gate working-tree size in CI, and use LFS or a fixtures repo for large EPUBs; and (e) **cross-LLM execution** — phases will be delegated to other LLMs, so each phase plan must be self-contained with explicit preconditions, file paths, and acceptance criteria.

## Key Findings

### Recommended Stack

The stack is **locked** in `PROJECT.md` Constraints. Versions verified against the npm registry on 2026-04-26 (full evidence in `STACK.md`).

**Core technologies:**

- **TypeScript 6.0.3** — strict, ES2022, `moduleResolution: 'bundler'`.
- **Vite 8.0.10 (MPA mode)** — one config, mode-driven; `base: './'` for `file://` compatibility.
- **Lit 3.3.2** — Web Component layer; ~5 KB; Shadow DOM scoping.
- **dart-sass 1.99.0 (`sass`)** — replaces Compass + Ruby SASS.
- **fflate 0.8.2** — isomorphic ZIP unzip (Node + browser); main-thread-async API yields between chunks (the legacy `file://`+Worker problem dissolves).
- **fast-xml-parser 5.7.2** — OPF / NCX / container.xml parsing; XXE-safe by default; isomorphic.
- **DOMPurify (latest)** — sanitises EPUB-supplied chapter HTML before insertion. **Mandatory** on every chapter render path. Allowlist tuned during Reader Core phase.
- **Vitest 4.1.5** + `@vitest/browser` + `@vitest/browser-playwright` — unit + browser-mode tests.
- **Playwright 1.59.1** — multi-browser E2E.
- **vite-plugin-singlefile 2.3.3** — inlines JS+CSS into one HTML for per-book output.

**Supporting tools (locked):** Node LTS 22 (`.nvmrc`), pnpm 9 (or npm 10), ESLint 10 (flat config), typescript-eslint 8, Prettier 3.8, Husky 9, lint-staged 16, globals 17, autoprefixer + postcss, `tsx`.

**Browserslist (locked):** `last 2` versions of Chrome, Edge, Firefox, Safari, ios_saf, and_chr, and_ff; `not dead`; `not op_mini all`.

**SUPERSEDED in STACK.md:**

- The "Open Question: epub.js vs @readium/navigator" section is **moot**. PROJECT.md Key Decisions rejects **all** third-party engines. We own the engine.
- "Stack Patterns by Variant → If retaining the locked epub.js decision / If pivoting to `@readium/navigator`" — both branches superseded.
- The four-flavour MPA example is now a **two-output** model: per-book HTML + optional library index. Drag-drop is delivered by the same per-book HTML build artefact (or by the dev server during development).

### Expected Features

Full landscape in `FEATURES.md` (25 table-stakes, 23 differentiators, 17 anti-features). After PROJECT.md was revised, the nine items the researcher had flagged as "missing from scope" have all been folded into Active.

**Must have (v1 table stakes — all in PROJECT.md Active):**

- EPUB 2 + EPUB 3 reflowable rendering (TS-01).
- Persistent reading position via **CFI** (not page index) (TS-02), keyed by EPUB identifier.
- TOC drawer with hierarchical semantics (TS-03).
- Adjustable font family + size + line-height, persisted per-EPUB (TS-04, TS-05, TS-16).
- Light / Dark / Sepia themes; respect `prefers-color-scheme` and `prefers-reduced-motion` (TS-06, DF-19, DF-20).
- Forward/back chrome buttons; **keyboard navigation** (Left/Right, Home/End, Esc) (TS-07, TS-08).
- 2026 touch model: **Pointer Events**, edge tap zones (25%/50%/25%), centre tap toggles chrome (TS-09, TS-10, TS-11).
- Reading-progress indicator (% or chapter X/Y) (TS-12).
- Bookmarks add/list/jump/remove (TS-13).
- Drag-and-drop EPUB upload (TS-14) — first-class browser entry.
- Cover-grid library index with title/author + client-side **search/sort/filter** + **"continue reading"** (TS-15, TS-18, TS-19, DF-10, DF-12, DF-13).
- Visible loading states (TS-20).
- **WCAG 2.x AA + EPUB Accessibility 1.1**: focus states, ARIA, semantic HTML, reflow at 200% (TS-21, TS-22, TS-23). Same-origin and `file://` operation (TS-25).

**Should have (v1.x):**

- **Continuous-scroll mode toggle** (DF-01).
- Extra fonts incl. OpenDyslexic (DF-03); justify, hyphenation, margin/line-length (DF-04, DF-05, DF-06); reading-time estimate (DF-08); progress overlay on covers (DF-11); grid/list toggle (DF-14); onboarding hint (DF-15); image inline-zoom (DF-16).

**Defer (v2+):**

- In-book full-text search (AF-08); annotations (AF-07); fixed-layout pinch-zoom; footnote popovers (DF-17); RTL / vertical writing (DF-18); TTS (DF-22); runtime "save as solo" (DF-21).

**Anti-features (deliberately NOT in any version):**

- Accounts / sync / cloud / DRM / analytics / ads (AF-01–AF-06, AF-13).
- Service Worker / PWA — superseded by the standalone HTML.
- IE / pre-Chromium Edge.
- Legacy `client.config.js` runtime plug-in surface.
- Page-curl / 3D animations.

### Architecture Approach

ARCHITECTURE.md's Tier 0–4 build order still applies and is the right shape; what changes is the **model the tiers operate on**. The original research assumed an `EpubEngine` interface wrapping epub.js, with a special Light-DOM `<readkit-rendition>` element to host an iframe. After PROJECT.md was revised, the model is simpler: **one isomorphic `EpubProcessor` TypeScript module** that runs in both Node (build script) and the browser (drag-drop), and **chapter HTML is sanitised and inserted directly into the (Shadow-DOM-using) reader chrome's DOM** — there is no iframe and no Light-DOM escape hatch.

**Major components:**

1. **`EpubProcessor`** (`src/engine/epub-processor.ts`) — single isomorphic TS module. Takes `ArrayBuffer` (or path in Node), uses `fflate` to unzip, parses `META-INF/container.xml` → OPF → Nav with `fast-xml-parser`, resolves spine + manifest + asset map, returns a typed `Publication { metadata, spine[], toc[], assets: Map<path, Blob|Uint8Array> }`. **No DOM dependency.** Exhaustive Vitest coverage with happy-path and malformed-EPUB fixtures.
2. **`tools/build-book.ts`** — Node TS build script. Walks input `.epub` paths, calls `EpubProcessor.open(path)`, **rebases asset URLs**, runs DOMPurify on each chapter HTML, inlines all assets, bundles the Lit reader chrome via Vite, writes one self-contained HTML per book. Optionally emits `library/index.html`.
3. **Lit reader chrome** — Shadow-DOM custom elements: `<readkit-app>`, `<readkit-reader>`, `<readkit-toolbar>`, `<readkit-toc-drawer>`, `<readkit-bookmarks>`, `<readkit-theme-menu>`, `<readkit-typography-menu>`, `<readkit-dropzone>`, `<readkit-progress>`. Library: `<readkit-library>`, `<readkit-cover-grid>`, `<readkit-cover-card>`. **No `<readkit-rendition>` Light-DOM element** — the chapter view holds sanitised HTML directly in its Shadow DOM.
4. **Reactive controllers** (`src/controllers/`) — `PreferencesController`, `BookmarkController`, `LocationController` (CFI-based), `RouterController`, `DropzoneController`. DOM-free, 100% Vitest-testable.
5. **`PersistenceStore`** — IndexedDB wrapper, schema-versioned, namespaced by EPUB `dc:identifier` with content-hash fallback. `localStorage` only as `file://` fallback. Stores: `preferences`, `positions` (CFI + updatedAt), `bookmarks`, `history`.
6. **Drag-drop entry point** — runs `EpubProcessor` in the browser; same `Publication` model, same Lit chrome, **same sanitiser path** as the build script.
7. **Tiny custom router** — hash-based for `file://`, History-API for served library; ~40 lines.

**Engine quarantine reframed:** "epub.js leakage" anti-pattern is replaced by **"`fflate` + `fast-xml-parser` calls live only inside `EpubProcessor`."** Components consume the typed `Publication`; they never touch raw zip entries or XML.

**Build orchestration (Vite MPA):** One `vite.config.ts`, mode-driven. Modes: `dev`, `library`, `book`. `dist/` gitignored.

**SUPERSEDED in ARCHITECTURE.md:**

- §1 Stack Reality Check (epub.js maintenance discussion) — moot.
- §5 epub.js Integration Pattern — moot; no iframe, no `<readkit-rendition>` Light-DOM element.
- §11.2 Light-DOM escape hatch — not needed.
- §14 Anti-Pattern 1 (epub.js leakage) and Anti-Pattern 4 (iframe-in-Shadow-DOM) — superseded; replaced by "fflate/fast-xml-parser quarantine" and "always sanitise before DOM insertion."
- §6.5 EPUB-embedded flavour — dropped from scope.
- §17 Open Question 6 (iframe sandbox for CVE-2024-39307) — N/A.

**STILL APPLIES from ARCHITECTURE.md:**

- Tier 0–4 build order (§12) and parallelism boundaries.
- Component model (Lit + reactive controllers + `@lit/context` + custom events) — §4.
- Persistence design (§9) — IndexedDB with versioned schema and `dc:identifier` namespace.
- Vite MPA + mode-driven config (§6.1) — adapted from four flavours to two outputs.
- Anti-Patterns 2 (module singletons), 3 (`localStorage` outside `PersistenceStore`), 5 (jQuery pubsub), 6 (per-publication runtime plug-ins).

### Critical Pitfalls

Top defences. Full inventory in `PITFALLS.md`. **Six pitfalls remain critical**; four are superseded by the architectural simplification.

1. **Untrusted EPUB content is rendered as same-origin (Pitfall 5, reframed).** Without an iframe boundary, this is *more* important, not less. Every chapter HTML string from an EPUB must pass through DOMPurify with a strict allowlist *before* being inserted into the reader chrome's Shadow DOM. **`unsafeHTML()` from `lit-html` must never receive an EPUB-supplied string.** Set a strict CSP on the host document. Strip or override `<base href>` from chapter content. Detect `META-INF/encryption.xml` early and refuse encrypted books with a clear message. A test EPUB containing `<script>alert(document.cookie)</script>` must not fire in any output.

2. **Solo HTML size limits silently crash mobile Safari (Pitfall 3).** Base64 data-URI inlining of an image-heavy book exceeds Safari's per-document JS heap (~200–500 MB). **CI must emit a build error if any per-book HTML exceeds an explicit cap** (start at 50 MB; tune from real measurements). v1 strategy is data-URI inlining; v1.x escalation is **embedded packed zip + runtime decompression with `fflate`**. Test the largest source EPUB on a real iOS device.

3. **Two-output drift (Pitfall 4, reframed from "four flavours").** Build-script per-book HTML and browser drag-drop run under different runtimes. One Playwright project per output, both run in CI on every push, both produce a canonical "first paragraph rendered" smoke artefact. `npm run build` fails if either smoke artefact is missing.

4. **Repository hygiene regresses to a 700 MB working tree (Pitfall 9).** Legacy carries 285 MB `dist/`, 229 MB `dist.0.11.16/`, 151 MB `dist.gianleap/`, plus 27 currently-untracked unzipped EPUB directories. **From day one:** `.gitignore` lists `dist*/`, `node_modules/`, `.cache/`, `*.epub`. Pre-commit blocks files > 1 MB. Fixtures via Git LFS or a fixtures repo. CI `du -sh` step fails above an agreed cap.

5. **Cross-LLM execution traps (Pitfall 8).** Phases will be executed by different LLMs / agents / contributors. **Every phase plan must include an explicit "preconditions and invariants" block** that re-states (does not link to) constraints from prior phases. Acceptance criteria reference exact file paths and exact test names. No phase ships with TODOs / `// XXX` / `@ts-ignore` / skipped tests. Cross-phase invariants live in `.planning/codebase/CONVENTIONS.md`.

6. **Mobile / tablet rendering quirks surface only in production (Pitfall 10).** **Use `100dvh`** not `100vh`. **`overscroll-behavior-y: contain`** to disable Chrome Android pull-to-refresh. iOS Safari does not implement HTML5 drag-and-drop — **always provide a `<input type="file" accept=".epub">` fallback**. No `webkit*` / `moz*` shims; no UA sniffing.

**SUPERSEDED in PITFALLS.md:**

- Pitfall 1 (iframe event-model blindness) — N/A; no iframe.
- Pitfall 2 (epub.js memory leaks survive `book.destroy()`) — N/A; no epub.js. *However*, the underlying memory-discipline requirement remains: drag-drop swaps must explicitly `URL.revokeObjectURL` every blob URL the EPUB processor created, in a strict teardown utility. Playwright must include a "open 10 EPUBs in sequence, heap growth ≤ N MB" test.
- "Pin epub.js to a specific commit" — N/A.
- Pitfall 6's "epub.js promise pipeline never resolves" framing — N/A; the equivalent "drag-drop pipeline silently hangs on malformed EPUBs" trap **still applies** to our own `EpubProcessor`. Build a `tests/fixtures/malformed/` corpus, enforce a single top-level `.catch()`, surface visible error UI, 30-second timeout, validate zip magic bytes (`PK\x03\x04`) before unzipping.

## Implications for Roadmap

Five suggested phases, adapting ARCHITECTURE.md's Tier 0–4 ordering to the simpler engine model. Each is sized so an isolated executor (potentially a different LLM) can deliver from PLAN.md alone.

### Phase 1: Foundation

**Rationale:** Nothing else builds without these; all four pillars are independent and can be parallelised.
**Delivers:**
- Repo skeleton: `package.json` (locked dep versions), `tsconfig.json` (strict, ES2022, `moduleResolution: 'bundler'`), `tsconfig.node.json`, `.nvmrc` (Node 22 LTS), `.browserslistrc` (explicit nine-line form), `.gitignore` (`dist*/`, `node_modules/`, `.cache/`, `*.epub`), ESLint 10 flat config + Prettier + Husky 9 + lint-staged 16, working `vite.config.ts` (drag-drop reader entry only), single committed lockfile.
- Test harness: `vitest.config.ts`, `playwright.config.ts`, fixtures (`minimal-epub2.epub`, `minimal-epub3.epub`, malformed corpus: truncated zip, invalid OPF, missing nav, encrypted, zip bomb), smoke "Hello readk.it" tests passing.
- `PersistenceStore` with versioned schema (`preferences`, `positions`, `bookmarks`, `history`), `bookId(metadata) → string` from `dc:identifier` with content-hash fallback, full Vitest coverage against `fake-indexeddb`.
- Repo hygiene gate: CI `du -sh`, pre-commit blocks files > 1 MB, fixtures-policy decision documented (LFS vs fixtures repo).

**Addresses:** Build reproducibility, CI gate, persistence backbone, fixtures policy.
**Avoids:** Pitfalls 4 (drift), 8 (cross-LLM), 9 (repo hygiene), 7 (persistence identifier discipline baked in via early `bookId()`).

### Phase 2: Isomorphic EPUB Processor + Reader Chrome Skeleton

**Rationale:** `EpubProcessor` is the single most-shared piece; it gates both build-script and drag-drop. Reader chrome skeleton can be built in parallel because it's independent of processor internals.
**Delivers:**
- `src/engine/epub-processor.ts`: isomorphic TS; `open(input: ArrayBuffer | string): Promise<Publication>`; uses `fflate` + `fast-xml-parser`; full Vitest unit coverage incl. malformed cases; identical behaviour in Node and browser environments.
- DOMPurify allowlist + sanitisation utility (`src/engine/sanitise.ts`); allowlist documented in `CONVENTIONS.md`; test EPUB with `<script>` proven not to fire.
- Lit reader chrome shell: `<readkit-app>`, `<readkit-reader>` composition, `RouterController`, theme tokens (light/dark/sepia SCSS), `PreferencesController` wired to `PersistenceStore`. Drag-drop overlay accepting a `File`, calling `EpubProcessor.open`, sanitising, rendering chapter HTML into Shadow DOM. Playwright E2E: drop fixture EPUB, render first chapter, switch theme, persist, reload, theme persists.

**Uses:** TS 6, Vite 8 dev server, Lit 3, fflate, fast-xml-parser, DOMPurify, IndexedDB.
**Implements:** `EpubProcessor`, `<readkit-reader>`, `<readkit-dropzone>`, `PreferencesController`, theme system.
**Avoids:** Pitfalls 5 (untrusted content), 6 (drag-drop hangs), 7 (persistence leakage).

### Phase 3: Reader UX (Navigation, TOC, Bookmarks, Typography, Tap Zones, Progress)

**Rationale:** With chapter rendering proven, the reader-side feature surface can be built largely in parallel.
**Delivers:**
- `<readkit-toc-drawer>`: hierarchical TOC, accessible (`<nav><ol>`), auto-close on selection, keyboard reachable.
- `<readkit-bookmarks>` + `BookmarkController`: CFI-based add/list/jump/remove, persisted.
- `<readkit-typography-menu>`: font family (incl. OpenDyslexic), size, line-height; per-book persistence with global default fallback.
- **Touch model**: Pointer Events, swipe horizontally for page, tap zones 25/50/25, centre toggles chrome, `overscroll-behavior-y: contain`, `dvh` heights, safe-area-inset padding. iOS file-picker fallback.
- **Keyboard navigation**: Left/Right = page, Home/End, Esc, `:focus-visible`.
- **Reading-progress %** (CFI-based), debounced 1s persistence.
- **Accessibility floor**: ARIA, semantic HTML, reflow at 200% verified by Playwright, `prefers-reduced-motion` respected, `prefers-color-scheme` followed.

**Implements:** Most P1 + several P2 (DF-19, DF-20, DF-03).
**Avoids:** Pitfall 10 (mobile/tablet quirks); a11y regressions.

### Phase 4: Build Script + Library Index + Per-Book HTML Output

**Rationale:** With reader chrome stable and processor proven, the static-output path can be built. Primary deliverable phase.
**Delivers:**
- `tools/build-book.ts`: Node TS. For each input `.epub`: `EpubProcessor.open(path)` → sanitise chapters → rebase assets → bundle Lit chrome via Vite (`--mode book` + `vite-plugin-singlefile`) → emit `dist/books/<id>_<slug>.html`. **CI size cap** per output (default 50 MB; warn-then-error). Asset-rebase strategy decision documented (data URIs vs embedded packed zip + runtime decompression).
- `tools/build-library.ts` (or Vite plugin): emits `dist/library/manifest.json` + `dist/library/index.html` rendered by `<readkit-library>` + `<readkit-cover-grid>` + `<readkit-cover-card>`, with client-side search / sort / "continue reading" reading shared `PersistenceStore`.
- Both outputs verified by Playwright on `file://` and on a static-served URL; smoke artefact = "first paragraph of `04_kafka_the_metamorphosis` matches snapshot."
- All 26 source EPUBs in `readkit.epub/` rebuild successfully. Legacy `client.config.js` plug-in surface **not** preserved.

**Implements:** PROJECT.md "Build script: `tools/build-book.ts`", "library index page", "Re-build the 26 source EPUBs", "Drop AppCache."
**Avoids:** Pitfalls 3 (solo size), 4 (two-output drift). AF-08 / AF-07 deliberately skipped.

### Phase 5: Cross-Browser Hardening + CI Matrix + v1.x Differentiators

**Rationale:** With both outputs working, the matrix coverage and differentiators that move the product from "renders" to "ships."
**Delivers:**
- Playwright matrix: Chromium + WebKit + Firefox × desktop + mobile-emulated, both outputs, every PR. Real-device smoke (real iOS Safari, real Chrome Android, real iPadOS split-screen) before tagging v1.
- **Memory-budget Playwright test**: open 10 EPUBs sequentially, assert `usedJSHeapSize` growth bounded.
- **CSP hardening**: report-only on dev → enforced before v1.
- **v1.x differentiators** ranked by user-value-per-cost: continuous-scroll toggle (DF-01), reading-time estimate (DF-08), library cover progress (DF-11), grid/list toggle (DF-14), onboarding hint (DF-15), image inline-zoom (DF-16), justify (DF-04), hyphenation (DF-05), margin control (DF-06).
- Documentation: README, CONVENTIONS.md updates, supported-browsers note, dev-onboarding.

**Implements:** PROJECT.md cross-browser commitment + most v1.x differentiators.
**Avoids:** Pitfalls 4 (matrix), 10 (cross-browser surprise), residual 5/9 (CSP enforcement, repo audit at v1).

### Phase Ordering Rationale

- **Foundation (Phase 1) parallelises** internally — skeleton, harness, persistence, hygiene.
- **Phase 2 is the load-bearing pivot.** `EpubProcessor` blocks every other consumer; sanitiser pipeline must be set the moment chapter HTML first touches the DOM. Reader chrome shell parallelisable with the processor (they meet at the typed `Publication` boundary).
- **Phase 3 is highly parallelisable** — TOC, bookmarks, typography, tap zones, keyboard, accessibility are largely independent components.
- **Phase 4 cannot start until Phase 2 is stable** — the build script *is* the EPUB processor in Node.
- **Phase 5 is sequential after Phase 4** — cross-browser testing requires both outputs.

This puts the highest-risk piece (EPUB processor + sanitiser) early, and the highest-leverage parallelism (reader UX components) where executor count scales.

### Research Flags

Phases likely needing deeper research during planning (`/gsd-research-phase`):

- **Phase 2:** **DOMPurify allowlist for EPUB chapter content** — exact tag/attribute allowlist that preserves typography (CSS classes, `epub:type`, `lang`, ARIA), strips JS / `<base>` / event handlers / dangerous protocols, handles SVG safely. Needs a small spike. Also: **CFI implementation** strategy — we need our own CFI generator/parser (no epub.js); decide full grammar vs useful subset.
- **Phase 2:** **`localStorage` vs `IndexedDB` threshold** — IndexedDB preferred but must work across `file://` (some browsers disable it), drag-drop, and per-book HTML output. Decide fallback policy once, document.
- **Phase 4:** **Asset rebase strategy in baked HTML** — data URIs vs embedded packed zip + `fflate` runtime decompression. Spike both on the largest source EPUB. Also: **CFI URL-encoding format** for hash deep links.
- **Phase 4:** **`vite-plugin-singlefile` vs hand-rolled inliner** — almost certainly the plugin, but verify font + image strategy.

Phases with standard patterns (skip research-phase):

- **Phase 1:** Repo setup, test harness, `.gitignore`, CI — well-documented. STACK.md gives all versions.
- **Phase 3:** Lit components, reactive controllers, themes, keyboard navigation, Pointer Events — mainstream.
- **Phase 5:** Playwright matrix and CI hardening — standard once test infra exists.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All versions verified against npm registry on 2026-04-26; PROJECT.md ratifies the stack; the one open research question (epub.js vs Readium) is moot under the "we own the engine" decision. |
| Features | **HIGH** | Cross-referenced against Thorium, Koodo, foliate-js, Apple Books, Kobo, Calibre, EPUB Accessibility 1.1/1.2, WCAG 2.x. PROJECT.md has folded the previously-flagged gaps into Active. |
| Architecture | **HIGH** (after reframing) | The MEDIUM-HIGH was driven by epub.js integration uncertainty; with epub.js out, the residual architecture (Lit + isomorphic TS + sanitisation) is mainstream. |
| Pitfalls | **HIGH** for the six that still apply; iframe-/epub.js-specific pitfalls correctly retired. |

**Overall confidence:** **HIGH** for v1 scope and roadmap shape.

### Gaps to Address

These need a decision during the relevant phase, not before:

- **DOMPurify allowlist for EPUB chapter content** (Phase 2). No canonical allowlist exists; derive from source EPUBs + accessibility + threat model. Include scripted-content sample EPUBs in the test corpus.
- **CFI implementation extent** (Phase 2). Full EPUB CFI 1.1 grammar is large; useful subset (spine-relative, chapter-fragment, character offset) covers v1. Decide what we implement vs fall back to chapter-href + element-index.
- **`localStorage` vs `IndexedDB` policy** across all runtimes (Phase 2), especially for `file://` per-book HTMLs.
- **Asset rebase strategy in baked HTML** (Phase 4). Data URIs vs embedded packed zip with runtime decompression. The 50 MB CI cap forces this decision early on the larger source EPUBs.
- **CFI URL-encoding format** for hash deep links (Phase 4).
- **Asset / font / image inlining policy** for the library index vs per-book HTMLs (Phase 4). Different `assetsInlineLimit` per output.
- **Whether to keep the legacy `readk.it/` tree alive for reference** during the rewrite, then delete at parity (PROJECT.md flags as pending). Decide at Phase 1 close.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` (post-revision, 2026-04-26) — **authoritative model**.
- `.planning/research/STACK.md` — version-verified against npm registry on 2026-04-26.
- `.planning/research/FEATURES.md` — multi-source cross-reference.
- `.planning/research/ARCHITECTURE.md` — Lit + Vite patterns from official docs (HIGH); reframed for the no-iframe model.
- `.planning/research/PITFALLS.md` — upstream issues, mobile-Safari viewport bugs.
- `.planning/codebase/CONCERNS.md` — historical evidence of the trap families this team has fallen into.

### Secondary (MEDIUM confidence)
- DOMPurify allowlist defaults — well-documented but project-specific tuning required.
- Lit `@lit/context` — Lit's docs describe it as stable but the API has shifted historically; pin the version.
- `fflate` 0.8.2 stability — pre-1.0 but feature-complete.

### Tertiary (LOW confidence)
- Exact mobile-Safari heap caps for inlined HTML (~200–500 MB) — anecdotal across community reports; the practical defence is a CI size cap regardless.
- IndexedDB availability on `file://` across all target browsers — known to be inconsistent (Firefox restricts on `file://` historically); verify in Phase 2 with a real-device check.
