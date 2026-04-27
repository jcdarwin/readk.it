# readk.it (modernised) — project guide

This file orients an AI assistant (Claude Code or any other capable LLM) picking up work in this repository. **Read it first**, then read the linked planning artefacts.

## What this project is

readk.it is being rewritten from a 2013-era AMD/jQuery/Grunt EPUB reader into a modern TypeScript + Vite + Lit project. Two faces, one engine:

1. **Node TypeScript build script** (`tools/build-book.ts`) — consumes `.epub` files and emits one self-contained HTML per book, with chapter content + reader chrome + assets all baked in.
2. **Browser drag-drop reader** — runs the **same** isomorphic TypeScript EPUB-processing engine in the browser, rendering into the **same** Lit reader chrome.

A static **library index page** (also produced by the build) is an optional secondary output. There is no backend.

## Authoritative planning artefacts (read in this order)

1. [`.planning/PROJECT.md`](.planning/PROJECT.md) — what this is, core value, requirements (validated / active / out-of-scope), constraints, key decisions. **Source of truth for the project model.**
2. [`.planning/REQUIREMENTS.md`](.planning/REQUIREMENTS.md) — 38 v1 requirements with REQ-IDs (BUILD / ENGINE / READER / DROP / LIBRARY / THEME / A11Y / TEST), v2 deferred items, out-of-scope register, and the traceability table mapping each requirement to its phase.
3. [`.planning/ROADMAP.md`](.planning/ROADMAP.md) — 12 phases. Each phase has goal, dependencies, requirements, success criteria, plan-count estimate, and notes flagging cross-LLM execution risks.
4. [`.planning/STATE.md`](.planning/STATE.md) — current phase / plan / progress.
5. [`.planning/research/SUMMARY.md`](.planning/research/SUMMARY.md) — reconciled research summary. **Read this** rather than the four constituent files unless you need depth on stack / features / architecture / pitfalls.
6. [`.planning/codebase/`](.planning/codebase/) — analysis of the **legacy** 2013-era codebase (ARCHITECTURE / STACK / STRUCTURE / CONCERNS / CONVENTIONS / INTEGRATIONS / TESTING). Useful as a reference for behaviour the new system must replicate (e.g. drag-drop unzip → asset map → render). The legacy tree lives at `readk.it/` and the source EPUBs at `readkit.epub/` and `readkit.epub.giantleap/` and `readkit.epub.mobydick.epub/`.

## Cross-LLM execution

This project is set up so phase plans can be executed by **different LLMs / agents**, not always Claude. That has implications:

- **Each phase plan must be self-contained** — file paths stated explicitly, dependencies re-stated (not linked), success criteria testable from the plan alone.
- **No phase ships with TODOs / `// XXX` / `@ts-ignore` / skipped tests.** If a constraint is owed to a later phase, the plan must say so explicitly.
- **Cross-phase invariants** (persistence-store discipline, sanitisation pipeline, no second renderer that bypasses DOMPurify, two-output-no-drift, repository-hygiene gates) live in this file and in `.planning/codebase/CONVENTIONS.md` as those documents grow.
- **Don't assume an executor has read the whole codebase** — they may have a smaller context window than Claude. Reference exact files; don't say "as in the previous phase."

## Locked stack (do not deviate without updating PROJECT.md)

- **Language / build:** TypeScript 6 (strict, ES2022, ESM), Vite 8 (MPA mode), dart-sass 1.99.
- **UI:** Lit 3 Web Components. No jQuery / Lo-Dash / iScroll / Modernizr / Detectizr. No virtual DOM framework.
- **EPUB engine:** *isomorphic, ours.* Built on `fflate` (zip) + `fast-xml-parser` (OPF/Nav). **No epub.js, no Readium navigator, no foliate-js.**
- **Sanitisation:** DOMPurify on every chapter HTML insertion. Allowlist documented in `.planning/codebase/CONVENTIONS.md` (lands in Phase 5).
- **Persistence:** IndexedDB (`PersistenceStore`), `localStorage` only as `file://` fallback. Namespaced by `dc:identifier` with content-hash fallback.
- **Tests:** Vitest 4 (unit + browser mode) + Playwright 1.59 (E2E on Chromium / WebKit / Firefox).
- **Runtime:** Node LTS 22; pnpm 9 or npm 10; lockfile committed.
- **Browsers:** last 2 versions of Chrome / Edge / Firefox / Safari / iOS Safari / Chrome Android / Firefox Android. **No IE.**

## Hard rules (non-negotiable)

- **Sanitise EPUB content.** Never invoke Lit's `unsafeHTML()` (or any equivalent) on EPUB-supplied HTML. The project's `sanitise()` utility is the only path from chapter HTML to the DOM.
- **One engine, two consumers.** No EPUB-processing code may exist outside `src/engine/epub-processor.ts`. `fflate` and `fast-xml-parser` are quarantined to that module.
- **No second renderer.** The build script and the drag-drop entry share the engine, the sanitiser, and the chrome — there must be no path that bypasses any of those.
- **Persistence goes through `PersistenceStore`.** No component touches `localStorage` or `IndexedDB` directly.
- **Repo hygiene.** `dist/`, `dist*/`, `node_modules/`, `.cache/`, `*.epub` are git-ignored. Files larger than 1 MB are blocked by pre-commit. Do not commit build outputs.
- **No legacy deps.** No jQuery, no Lo-Dash, no iScroll, no Modernizr, no Detectizr, no AMD, no AppCache, no Compass, no Python 2.
- **Untrusted input boundary.** EPUB content is third-party HTML. Strip `<base>`, `on*=`, `<script>`, dangerous-protocol URLs.

## Workflow

This repo uses [Get Shit Done (GSD)](https://github.com/jcdarwin/get-shit-done-cc) for planning and execution.

- Granularity: **FINE** (12 phases, 4–7 plans each).
- Mode: **YOLO** (auto-approve through the planning steps; the user manually delegates execution).
- Workflow agents enabled: research, plan-check, verifier.

Common commands:
- `/gsd-progress` — where we are.
- `/gsd-plan-phase N` — produce `.planning/phase-N/PLAN.md` for phase N.
- `/gsd-execute-phase N` — run phase N's plans (or hand the PLAN.md to another LLM).
- `/gsd-verify-work N` — verify phase N satisfies its requirements.

## Legacy tree

The legacy 2013-era codebase remains at `readk.it/` (the *source*) and `Gruntfile.js` (the build). It is left in place during the rewrite for reference; do not modify it. Once the new tree reaches parity (Phase 12), the legacy tree will be deleted in a single commit.

`readkit.epub/` contains the 26 source EPUBs the new build script must consume successfully (BUILD-07).

---
*This file is the entry point for any LLM picking up work in this repo. Keep it accurate.*
