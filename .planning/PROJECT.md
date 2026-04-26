# readk.it (modernised)

## What This Is

readk.it converts an EPUB into a self-contained web page that opens in any modern browser, including mobile. The product has two faces of the same engine: a **TypeScript build script** that consumes one or more `.epub` files and emits standalone, self-contained HTML — one per book — and the **same EPUB-processing engine running in the browser** so a user can drag-and-drop their own EPUB onto the page and read it immediately. Both paths feed the same Lit-based reader chrome (chapter / spine navigation, TOC drawer, themes, persistent reading position). This project is a TypeScript + Vite + Lit greenfield rewrite of the original 2013-era AMD/jQuery/Grunt codebase.

## Core Value

Convert any EPUB into a clean, self-contained reading experience that works in any modern browser — desktop, mobile, or tablet — with zero runtime dependencies on a third-party EPUB library, on a build that any contributor can reproduce on a current developer machine.

## Requirements

### Validated

<!-- Capabilities the existing 2013-era codebase already delivers; the modernised reader must not regress these. -->

- ✓ Convert EPUB 2 and EPUB 3 publications into a browser-renderable form (OPF/NCX/Nav parsing, spine, stylesheets, fonts, images) — existing
- ✓ Drag-and-drop EPUB upload + in-browser unzip + parse + render — existing
- ✓ Library carousel of cover images linking to per-book pages — existing
- ✓ Per-publication preferences (font family, font-size, line-height) persisted per-EPUB — existing
- ✓ Bookmarks and reading-position memory per EPUB (page index + per-page scroll position + history) — existing
- ✓ Single self-contained HTML per book (the legacy "solo" build) — existing, becomes the primary deliverable
- ✓ Web-served and `file://` reading modes — existing

### Active

<!-- v1 hypotheses for the modernised release. Each is a hypothesis until shipped and validated. -->

- [ ] Replace Grunt + Compass + Ruby SASS + Python 2 manifest maker with Vite + dart-sass + a Node TS-based build script
- [ ] Migrate runtime code from AMD/ES5 to TypeScript / native ES modules
- [ ] Adopt Lit for the reader UI chrome (replacing jQuery + tinytim + per-page click binders)
- [ ] Build an isomorphic TypeScript EPUB-processing engine (unzip + OPF/NCX parse + asset resolution) that runs both in Node (build script) and in the browser (drag-drop). Built on `fflate` (zip) and `fast-xml-parser` (OPF/Nav). No epub.js / Readium / foliate-js dependency.
- [ ] Drop jQuery 2, Lo-Dash 1, RequireJS, iScroll 4, Modernizr, Detectizr, the bundled jQuery plugins, and the require text/css plugins
- [ ] Build script: `tools/build-book.ts` (or equivalent) takes one or more `.epub` files and emits one self-contained HTML per book, with the reader chrome + chapter content + assets baked in
- [ ] Build script: produce an optional static **library index page** listing all built books with cover thumbnails, linking to each per-book HTML
- [ ] Runtime drag-and-drop: a browser entry point (the "drop reader") that accepts a dropped `.epub`, runs the same EPUB-processing engine in the browser, and renders into the same Lit chrome
- [ ] Update the reader UI where modernisation makes the existing chrome show its age
- [ ] Update the library index UI where modernisation makes the existing carousel show its age
- [ ] Add a TOC drawer / navigation panel to the reader (current reader only has forward/back + bookmarks)
- [ ] Add light / dark / sepia theme support with persistence (per-book or global), respecting `prefers-color-scheme` and `prefers-reduced-motion`
- [ ] Cross-browser support: current and last 1–2 versions of Chrome, Edge, Firefox, Safari, on desktop, mobile, and tablet
- [ ] Reading-position persistence in `localStorage` (or `IndexedDB`), keyed by EPUB identifier, so reopening a book resumes where the reader left off
- [ ] Touch interaction model fit for 2026: edge / centre tap zones, Pointer Events for swipe, native scroll-snap or equivalent (replacing iScroll's hand-rolled gesture model)
- [ ] Reading-progress indicator (progress %, or chapter X / Y)
- [ ] Library index: client-side search / sort / filter once the catalog passes a useful threshold; "continue reading" affordance per-book
- [ ] Accessibility floor: WCAG 2.x AA + EPUB Accessibility 1.1 conformance for the reader chrome and the rendered book content; keyboard navigation; screen-reader-friendly TOC + nav controls
- [ ] Unit tests with Vitest covering the EPUB processor (OPF/Nav parsing, asset resolution, error paths) and pure logic
- [ ] E2E tests with Playwright covering reader flows (open built HTML, navigate spine, open TOC drawer, switch theme, reopen and resume position) and drag-drop on real browsers (Chromium, WebKit, Firefox)
- [ ] CI runs the full test suite on every push
- [ ] Drop AppCache; standalone HTML files are inherently offline once downloaded
- [ ] Re-build the 26 source EPUBs in `readkit.epub/` against the new build script (legacy per-publication `client.config.js` plug-in surface is not preserved)
- [ ] Reproducible build on a current Node LTS — committed lockfile, no Python 2, no Ruby/Compass, no Node 0.11

### Out of Scope

<!-- Explicit boundaries with rationale. Re-adding requires explicit discussion. -->

- Internet Explorer support — Modernisation premise; IE10 was the 2013 floor and is not relevant in 2026
- Standalone HTML running inside e-reader apps (Apple Books, Calibre) — Output targets browsers only
- Service Worker / PWA / Web App Manifest on the library index — Standalone HTML files are inherently offline; v1 does not need a Service Worker
- In-book full-text search — Deferred to a later milestone
- Annotations / highlights / margin notes — Deferred to a later milestone
- Backwards compatibility with previously deployed solo HTMLs — Source EPUBs are rebuilt against the new build script
- Honouring the legacy per-publication `client.config.js` plug-in API — Rebuilt EPUBs declare their needs through the new pipeline; runtime injection of arbitrary AMD modules is dropped
- Cross-device reading-position sync — Reader stays local-only (`localStorage` / `IndexedDB`)
- Server-side or multi-user features — Reader remains browser-only by design
- Preserving the iScroll-based swipe-sideways/scroll-vertically interaction unchanged — UX is open to redesign where it makes sense
- Third-party runtime EPUB libraries (epub.js, Readium navigator, foliate-js) — Replaced by an isomorphic TS engine we own; no external EPUB-engine dependency at runtime
- "EPUB-embedded" flavour (the legacy fourth flavour where the reader was injected back into each .epub) — Subsumed by the standalone HTML output, which is itself a more useful self-contained artefact
- Fixed-layout EPUB support — Reflowable EPUBs only in v1; ~92% of new EPUB contracts are reflowable, and the 26 source EPUBs are all reflowable

## Context

- The existing codebase is from approximately 2013: AMD modules under `readk.it/js/app/`, vendored libraries under `readk.it/js/lib/`, Grunt build orchestrating four-flavour fan-out.
- Critical legacy versions and their problems (per `.planning/codebase/CONCERNS.md`):
  - jQuery 2.0.3 — CVE-2020-11022/11023 (XSS via `htmlPrefilter`), prototype-pollution risk in `$.extend(true, ...)`
  - Lo-Dash 1.3.1 — CVE-2019-10744 (prototype pollution)
  - RequireJS 2.1.8 + custom shim configuration in `readk.it/js/readkit.js` and `Gruntfile.js`
  - iScroll 4.1.9 — superseded; struggles with modern mobile pointer events
  - Modernizr 2.6.2 / Detectizr 1.4.4 — effectively abandoned, called on every UI toggle
  - AppCache (`readkit.appcache`, `library.appcache`) — removed from the HTML spec, dead in Chrome 85+ / Firefox 85+
  - Node 0.11.16 pin (`.nvmrc`) — unobtainable on modern macOS/Linux without legacy nvm gymnastics
  - Compass + Ruby SASS — sunset 2019; deprecation warnings on every build
  - Python 2 `manifest.maker.py` — `print` statements; will not run under any Python 3 interpreter
  - Three forked Grunt plugins pinned to `master` on a personal GitHub account (`grunt-readkit-dom-munger`, `grunt-readkit-datauris`, `grunt-readkit-data-uri`) — supply-chain and reproducibility risk
- Legacy drag-and-drop flow (canonical reference for the new model):
  - `chrome.js:670–686` binds `dragenter` / `dragover` / `drop` listeners
  - `chrome.js:544–567` shows the upload UI on first `dragenter`
  - `chrome.js:577–644` uses zip.js to inflate every entry, accumulating text-ish entries as strings and binary entries as Blobs into a `files` map keyed by relative filename
  - `controller.js` `_initialise` then routes through the same `Epub` parser + `Layout` rendering path as the web-served flow, just sourcing chapter HTML and CSS from the in-memory `files` map
  - The new architecture preserves this shape: drop → unzip + parse → render — but with a TS engine, `fflate`, `fast-xml-parser`, and a Lit chrome
- 26 source publications live under `readkit.epub/` (e.g. Pride and Prejudice, Vanity Fair, NZ-publisher EPUBs from AWA / VUP / NZCER); two standalone EPUBs sit alongside (`readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/`). All are under the project's control and will be rebuilt against the new build script.
- The repository carries multiple committed `dist/` snapshots (`dist/`, `dist.0.11.16/`, `dist.gianleap/`) totalling ~700 MB of historical build outputs. The new pipeline should not perpetuate this; ignored `dist/` is preferred.
- Codebase was mapped 2026-04-26 (commit `ca1eeb7`) into `.planning/codebase/` — `ARCHITECTURE.md`, `STACK.md`, `STRUCTURE.md`, `CONCERNS.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `TESTING.md` — these are authoritative starting context for planning agents.
- A QUnit test suite exists at `readk.it/js/test/` (`epub.test.js`) but is not wired into `npm test`; it covers only smoke-level EPUB parsing.
- Project research is in `.planning/research/` — `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`. Most findings still apply after the architectural simplification (drop epub.js, build our own engine), but ARCHITECTURE.md was written assuming an epub.js engine and needs to be re-read with the simpler model in mind: the EPUB processor is ours, runs in both Node and browser, and there is no iframe boundary because rendered chapter HTML lives directly in the reader chrome's DOM.

## Constraints

- **Tech stack**: TypeScript + Vite + Lit; `fflate` for zip; `fast-xml-parser` for OPF/Nav — Chosen for minimal dependency surface, modern standards alignment, isomorphic Node-and-browser execution
- **Module system**: ES modules only — AMD / RequireJS / `define([...])` is dropped entirely; the new tree must not require a custom AMD loader
- **Dependencies**: Reduce overall dependency count; prefer native browser APIs (`ResizeObserver`, `MutationObserver`, `IntersectionObserver`, `fetch`, native Promise, native dialog/details, `URL.createObjectURL` paired with `revokeObjectURL`) over shims and polyfills. No runtime EPUB-engine library — we own the engine.
- **Browser targets**: Last 2 versions of Chrome, Edge, Firefox, Safari on desktop + mobile + tablet — Drives the Browserslist config and the Playwright test matrix
- **Build reproducibility**: One `npm install` (or `pnpm install`) on a current Node LTS must produce a working build — No Python 2, no Ruby, no Compass, no Node 0.11, no GitHub-pinned forked plugins
- **No backend**: Reader stays browser-only — Original product principle; static hosting is sufficient
- **Testing**: Vitest (unit, including isomorphic EPUB-processor tests) + Playwright (E2E) gate every push — Modernisation is only safe if regressions are catchable
- **Output preservation**: The build script must produce a self-contained HTML per book (legacy "solo" semantics) and an optional library index. The drag-drop path must remain functional and use the same engine as the build script — No code duplication between Node and browser EPUB processing
- **Untrusted EPUB content**: EPUB content is third-party HTML; it must be sanitised before insertion into the reader chrome's DOM. No `unsafeHTML()` on EPUB-supplied strings.
- **Cross-LLM execution**: Each phase plan must be self-contained — file paths, dependencies, acceptance criteria, and constraints stated explicitly so a different LLM can pick up a phase from PLAN.md alone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Greenfield rewrite (not incremental in-place modernisation) | AMD→ESM, jQuery→Lit, Grunt→Vite are too entangled to bisect incrementally. Fresh source tree keeps the legacy `readk.it/` buildable for reference until parity is reached, then deleted. | — Pending |
| Adopt Lit for UI chrome | Lean (~5 KB) Web-Component layer; standards-based; no virtual DOM; supports the stateful reader chrome (font/size dropdowns, bookmarks, drag-drop overlay, TOC drawer) without pulling in a full framework | — Pending |
| Build our own isomorphic EPUB engine; do NOT adopt epub.js / Readium / foliate-js | (a) The product is fundamentally a build-time conversion of an EPUB into baked HTML; we already have to do this in Node, and the same code runs in the browser for drag-drop. (b) epub.js maintenance is poor (last npm release Sep 2023, last GitHub release Jul 2020); CVE-2024-39307 in 2024. (c) Dropping the engine eliminates the iframe-boundary architectural pitfall and a meaningful chunk of the dependency surface. | — Pending |
| Two execution paths, one engine | The Node build script and the browser drag-drop path both call the same TS EPUB processor (zip → OPF → Nav → chapters → asset map). The downstream rendering path also shared. Avoids duplicate parsers, double maintenance, and behavioural drift between flavours. | — Pending |
| Drop AppCache entirely; offline via standalone HTML | AppCache is removed from the spec; the standalone HTML is inherently offline once saved; v1 does not need Service Worker complexity | — Pending |
| Drop legacy per-publication `client.config.js` plug-in surface | All source EPUBs are under our control and will be rebuilt; runtime injection of arbitrary AMD modules adds attack surface and is incompatible with ES module bundling | — Pending |
| Drop the legacy "EPUB-embedded" fourth flavour | Subsumed by the standalone HTML output, which is a more useful, self-contained artefact. The legacy purpose (a `.epub` that self-hosts its own reader when unzipped/served) is met more cleanly by shipping the standalone HTML alongside the EPUB. | — Pending |
| Outputs: standalone HTML per book, plus optional library index | Two artefacts, both static. Standalone HTML opens directly in any browser; library index is a publisher-curated landing page linking to them. | — Pending |
| Vitest + Playwright as the test stack | Vitest covers the isomorphic EPUB processor + pure logic; Playwright covers reader flows on real browsers; both run in CI on every push | — Pending |
| Browserslist: last 2 modern desktop + mobile/tablet, drop IE | Modernisation premise; IE10 support was a 2013 constraint that no longer applies | — Pending |
| Reflowable-only in v1; defer fixed-layout EPUB support | ~92% of new EPUB contracts are reflowable; all 26 source EPUBs are reflowable; fixed-layout adds a meaningful UX surface (pinch-zoom, spread mode) and accessibility concerns. Defer to v2 if needed. | — Pending |
| Add TOC drawer + themes (light/dark/sepia) + reading-progress + tap-zone navigation as v1 features | Modernisation premise extends past pure tooling: the existing chrome lacks a real TOC, dark mode is now a basic reader expectation, and the iScroll swipe model needs a 2026 replacement (Pointer Events tap zones + native scroll-snap) | — Pending |
| Sanitise EPUB content before DOM insertion | EPUBs are third-party content; unsanitised HTML in the reader chrome is an XSS vector. Use a permissive but defensible HTML sanitiser (e.g. `DOMPurify`) on chapter content, with an allowlist that preserves intended typography. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-26 after architectural clarification (build-script + drag-drop, isomorphic TS engine, no epub.js)*
