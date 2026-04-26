# readk.it (modernised)

## What This Is

readk.it is a browser-only EPUB reader that produces four deployment flavours from one source tree: a drag-drop reader, a curated library site, single-file "solo" HTMLs (one per publication, EPUB inlined as data URIs), and an EPUB-embedded reader (a copy of the reader injected into each .epub so it self-hosts when unzipped/served). This project is a TypeScript + Vite + Lit + epub.js greenfield rewrite of the original 2013-era AMD/jQuery/Grunt codebase, intended to remain a no-backend reader serving both publisher-curated content and end users who supply their own EPUBs via drag-and-drop.

## Core Value

Read EPUBs cleanly in any modern browser — the reader must render publications correctly across desktop, mobile, and tablet, on a stable build that any contributor can reproduce on a current developer machine.

## Requirements

### Validated

<!-- Capabilities the existing 2013-era codebase already delivers; the modernised reader must not regress these. -->

- ✓ Render EPUB 2 and EPUB 3 publications (OPF/NCX/Nav parsing, spine, stylesheets) — existing
- ✓ Drag-and-drop EPUB upload (in-browser unzip + parse) — existing
- ✓ Library carousel of cover images linking to publications — existing
- ✓ Four build flavours: drag-drop reader, library site, solo single-file HTMLs, EPUB-embedded reader — existing
- ✓ Per-publication preferences (font family, font-size, line-height) persisted per-EPUB — existing
- ✓ Bookmarks and reading-position memory per EPUB (page index + per-page scroll position + history) — existing
- ✓ Hash-based "library" routing into individual publications — existing
- ✓ Web-served and `file://` reading modes — existing

### Active

<!-- v1 hypotheses for the modernised release. Each is a hypothesis until shipped and validated. -->

- [ ] Replace Grunt + Compass + Ruby SASS + Python 2 manifest maker with Vite + dart-sass + a Node-based manifest generator
- [ ] Migrate runtime code from AMD/ES5 to TypeScript / native ES modules
- [ ] Adopt Lit for the reader and library UI chrome (replacing jQuery + tinytim + per-page click binders)
- [ ] Adopt epub.js as the EPUB parsing/rendering engine (replacing the custom OPF/NCX parser, the require text!/css! load pipeline, and iScroll-based pagination)
- [ ] Drop jQuery 2, Lo-Dash 1, RequireJS, iScroll 4, Modernizr, Detectizr, the bundled jQuery plugins, and the require text/css plugins
- [ ] Reproduce all four build flavours on the new pipeline (drag-drop reader, library site, solo single-file HTMLs, EPUB-embedded reader)
- [ ] Update the reader UI where modernisation makes the existing chrome show its age
- [ ] Update the library UI where modernisation makes the existing carousel show its age
- [ ] Add a TOC drawer / navigation panel to the reader (current reader only has forward/back + bookmarks)
- [ ] Add light / dark / sepia theme support with persistence (per-book or global)
- [ ] Cross-browser support: current and last 1–2 versions of Chrome, Edge, Firefox, Safari, on desktop, mobile, and tablet
- [ ] Drag-and-drop user EPUB upload remains a first-class feature alongside the publisher-curated library
- [ ] Unit tests with Vitest covering parsers, persistence, and pure logic
- [ ] E2E tests with Playwright covering reader flows (open EPUB, navigate, drag-drop, bookmarks, theme switch, TOC drawer) on real browsers
- [ ] CI runs the full test suite on every push
- [ ] Drop AppCache; offline reading delivered solely through the solo single-file HTML build
- [ ] Re-build the 26 source EPUBs in `readkit.epub/` against the new reader (legacy `client.config.js` per-publication plug-in surface is not preserved)
- [ ] Reproducible build on a current Node LTS — committed lockfile, no Python 2, no Ruby/Compass, no Node 0.11

### Out of Scope

<!-- Explicit boundaries with rationale. Re-adding requires explicit discussion. -->

- Internet Explorer support — Modernisation premise; IE10 was the 2013 floor and is not relevant in 2026
- Solo HTML running inside e-reader apps (Apple Books, Calibre) — Solo runtime targets browsers only
- Service Worker / PWA / Web App Manifest on the library site — Offline reading is delivered by the solo single-file build; v1 does not need a Service Worker
- In-book full-text search — Deferred to a later milestone
- Annotations / highlights / margin notes — Deferred to a later milestone
- Backwards compatibility with previously deployed solo HTMLs — Source EPUBs are rebuilt against the new reader
- Honouring the legacy per-publication `client.config.js` plug-in API — Rebuilt EPUBs declare their needs through the new pipeline; runtime injection of arbitrary AMD modules is dropped
- Cross-device reading-position sync — Reader stays local-only (localStorage / IndexedDB)
- Server-side or multi-user features — Reader remains browser-only by design
- Preserving the iScroll-based swipe-sideways/scroll-vertically interaction unchanged — UX is open to redesign where it makes sense

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
- 26 source publications live under `readkit.epub/` (e.g. Pride and Prejudice, Vanity Fair, NZ-publisher EPUBs from AWA / VUP / NZCER); two standalone EPUBs sit alongside (`readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/`). All are under the project's control and will be rebuilt against the new reader.
- The repository carries multiple committed `dist/` snapshots (`dist/`, `dist.0.11.16/`, `dist.gianleap/`) totalling ~700 MB of historical build outputs. The new pipeline should not perpetuate this; ignored `dist/` is preferred.
- Codebase was mapped 2026-04-26 (commit `ca1eeb7`) into `.planning/codebase/` — `ARCHITECTURE.md`, `STACK.md`, `STRUCTURE.md`, `CONCERNS.md`, `CONVENTIONS.md`, `INTEGRATIONS.md`, `TESTING.md` — these are authoritative starting context for planning agents.
- A QUnit test suite exists at `readk.it/js/test/` (`epub.test.js`) but is not wired into `npm test`; it covers only smoke-level EPUB parsing.

## Constraints

- **Tech stack**: TypeScript + Vite + Lit + epub.js — Chosen for minimal dependency surface, modern standards alignment, and a sustainable maintenance story
- **Module system**: ES modules only — AMD / RequireJS / `define([...])` is dropped entirely; the new tree must not require a custom AMD loader
- **Dependencies**: Reduce overall dependency count; prefer native browser APIs (`ResizeObserver`, `MutationObserver`, `IntersectionObserver`, `fetch`, native Promise, native dialog/details, `URL.createObjectURL` paired with `revokeObjectURL`) over shims and polyfills
- **Browser targets**: Last 2 versions of Chrome, Edge, Firefox, Safari on desktop + mobile + tablet — Drives the Browserslist config and the Playwright test matrix
- **Build reproducibility**: One `npm install` (or `pnpm install`) on a current Node LTS must produce a working build — No Python 2, no Ruby, no Compass, no Node 0.11, no GitHub-pinned forked plugins
- **No backend**: Reader stays browser-only — Original product principle; static hosting is sufficient
- **Testing**: Vitest (unit) + Playwright (E2E) gate every push — Modernisation is only safe if regressions are catchable
- **Behaviour preservation**: All four flavour outputs must continue to function — Drag-drop reader, library site, solo single-file HTMLs, and EPUB-embedded reader; visual UX may change, but each flavour's deployment shape and load model is preserved

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Greenfield rewrite (not incremental in-place modernisation) | AMD→ESM, jQuery→Lit, Grunt→Vite, custom parser→epub.js are too entangled to bisect incrementally. Fresh source tree keeps the legacy `readk.it/` buildable for reference until parity is reached, then deleted. | — Pending |
| Adopt Lit for UI chrome | Lean (~5 KB) Web-Component layer; standards-based; no virtual DOM; supports the stateful reader chrome (font/size dropdowns, bookmarks, drag-drop overlay, TOC drawer) without pulling in a full framework | — Pending |
| Adopt epub.js as the EPUB engine | Mature browser EPUB library handling EPUB 2/3 nav, themes, locations, CFI; replaces the custom OPF/NCX parser, the iScroll pagination model, and the require text!/css! load pipeline in one move | — Pending |
| Drop AppCache entirely; offline via solo flavour only | AppCache is removed from the spec; solo single-file HTML already delivers offline reading; v1 does not need Service Worker complexity | — Pending |
| Drop legacy per-publication `client.config.js` plug-in surface | All source EPUBs are under our control and will be rebuilt; runtime injection of arbitrary AMD modules adds attack surface and is incompatible with ES module bundling | — Pending |
| All four flavours preserved (reader / library / solo / EPUB-embedded) | Each has distinct deployment value: drag-drop tool, curated site, offline single-file, self-hosting EPUB | — Pending |
| Vitest + Playwright as the test stack | Vitest covers parsing/persistence/pure logic; Playwright covers reader flows on real browsers; both run in CI on every push | — Pending |
| Browserslist: last 2 modern desktop + mobile/tablet, drop IE | Modernisation premise; IE10 support was a 2013 constraint that no longer applies | — Pending |
| Solo HTML targets browsers, not e-reader apps | Constrains solo runtime to APIs that work in modern Chromium/Gecko/WebKit; we don't bend solo for Apple Books / Calibre compatibility | — Pending |
| Add TOC drawer + themes (light/dark/sepia) as v1 features | Modernisation premise extends past pure tooling: the existing chrome lacks a real TOC, and dark mode is now a basic reader expectation | — Pending |

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
*Last updated: 2026-04-26 after initialization*
