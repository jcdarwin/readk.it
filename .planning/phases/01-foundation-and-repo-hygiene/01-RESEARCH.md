# Phase 1: Foundation & Repo Hygiene — Research

**Researched:** 2026-04-26
**Domain:** Repo bootstrap, Node 22 LTS toolchain, TypeScript 6 + Vite 8 + Lit 3 scaffolding, hygiene gates (Husky 9 + lint-staged 16, pre-commit >1 MB block), legacy-tree destructive cleanup, cross-doc updates (ROADMAP / REQUIREMENTS / CLAUDE / PROJECT).
**Confidence:** HIGH

## Summary

Phase 1 is the project's bootstrap. It produces a reproducible Node-LTS-22 + npm-10 + TypeScript + Vite + Lit skeleton; an empty `<readkit-app>` Lit shell that `npm run dev` serves with HMR; the hygiene gates that prevent regression to the legacy 700 MB-`dist/` working tree (pre-commit >1 MB block, comprehensive `.gitignore`, `engine-strict=true`); a destructive cleanup of the legacy 2013-era tree (preserved by a `legacy-snapshot-2013` git tag); and corrective edits to upstream planning artefacts (ROADMAP / REQUIREMENTS / CLAUDE / PROJECT).

Phase 1 is unusual among GSD phases because it carries **non-code deliverables** the planner must surface as explicit tasks: doc updates per D-25/D-26/D-27/D-28 and destructive deletions per D-06. It also explicitly defers a number of capabilities to later phases (test harness → P2, GitHub Actions → P2/P13, sanitiser → P5, engine-quarantine ESLint rule → P4, `unsafeHTML()` guard → P5, CSP → P5/P12). The research below treats these deferrals as locked decisions and does not re-litigate them.

**Primary recommendation:** Adopt the version pins listed in **Standard Stack** (verified against the npm registry on 2026-04-26), use Vite 8's new `rolldownOptions` (not `rollupOptions`) when the planner writes `vite.config.ts`, follow the Husky-9 `npx husky init` flow rather than the legacy `husky install` pattern, and stage a single `.husky/pre-commit` script that runs (1) the >1 MB block and (2) `lint-staged`. ESLint flat config uses `tseslint.configs.recommendedTypeChecked` with `parserOptions.projectService: true` (the modern, `tsconfigRootDir`-free pattern). The `<readkit-app>` Lit shell uses the static `styles` class field with a `css` tagged template literal, deferring the question of how SCSS feeds into the chrome to Phase 6 — Phase 1 only needs a single `src/styles/main.scss` compiled by Vite via dart-sass to prove the toolchain.

## User Constraints (from CONTEXT.md)

> Locked decisions copied verbatim from `01-CONTEXT.md`. The planner MUST honor these. Where the source CONTEXT.md says "the planner picks", that's a Claude's-Discretion area for the planner.

### Locked Decisions

#### Package Manager & Toolchain
- **D-01:** Package manager is **npm 10**, lockfile `package-lock.json`. The ROADMAP.md success criteria written as `pnpm install` / `pnpm dev` are read as `npm install` / `npm run dev` for the rest of the project. The "or pnpm" alternative in PROJECT.md / CLAUDE.md is closed.
- **D-02:** `package.json` carries an `engines` field requiring Node >=22 LTS and npm >=10, paired with `engine-strict=true` in `.npmrc`, so `npm install` errors out on the wrong Node/npm version with a clear message.
- **D-03:** `.nvmrc` set to `22` (overwrites the legacy `0.11.16`). No Corepack.

#### Repo Structure
- **D-04:** Single flat `src/` tree (no npm workspaces). One `package.json` at root.
- **D-05:** Phase 1 stands up the full target directory skeleton with `.gitkeep` + a README in each, naming the invariant for that directory:
  - `src/engine/` — README: "fflate + fast-xml-parser + DOMPurify quarantined here. No other module may import them."
  - `src/components/` — README: "Lit Web Components. Shadow DOM. No `unsafeHTML()` on EPUB-supplied content."
  - `src/controllers/` — README: "Reactive controllers (PreferencesController, BookmarkController, LocationController, RouterController, DropzoneController). DOM-free, 100% Vitest-testable."
  - `src/stores/` — README: "PersistenceStore is the only writer to IndexedDB / localStorage. No component touches storage directly."
  - `tools/` — README: "Node-side TypeScript tools. Build script lands here in Phase 10."
  - `tests/fixtures/` — README: "EPUB fixtures land in Phase 2."

#### Legacy Tree Cleanup (Phase 1 destructive task)
- **D-06:** Phase 1 deletes from the working tree (after tagging the pre-deletion commit as `legacy-snapshot-2013` for git-recoverability):
  - `readk.it/`, `Gruntfile.js`, legacy root `package.json`, `dist/`, `dist.0.11.16/`, `dist.gianleap/`, `readkit.epub/manifest.maker.py`, `readkit.epub/manifest.json`, `readkit.epub/manifest.json.mobydick.json`, legacy `node_modules/`, legacy `README.md`.
- **D-07:** Phase 1 keeps on disk but adds to `.gitignore`: `readkit.epub/`, `readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/` (and contents). Also gitignored: `*.epub`. Phases 10 and 13 read from these dirs at build time but never rely on their contents being version-controlled.
- **D-08:** Supersedes CLAUDE.md's current "leave legacy tree alive until Phase 12 parity" language.

#### Hygiene Gates
- **D-09:** Pre-commit blocks files >1 MB. **Working-tree size cap is dropped from Phase 1 scope.** ROADMAP.md Phase 1 success criterion 5 must be rewritten to remove the "CI fails the build if the working tree exceeds an agreed cap" half — only the lockfile half remains.
- **D-10:** Husky 9 pre-commit hook does: (1) the >1 MB block, (2) lint-staged running ESLint + Prettier on changed files only.
- **D-11:** No pre-push hook. Typecheck and full test runs live in CI (Phase 2's workflow).

#### GitHub Actions
- **D-12:** **No `.github/workflows/` files in Phase 1.** `ci.yml` (Phase 2). `deploy.yml` (Phase 13).
- **D-13:** `package.json` `scripts.test` in Phase 1 is `"test": "echo 'tests land in Phase 2' && exit 0"`. `scripts.typecheck`, `scripts.lint`, `scripts.format` are real and runnable.

#### Dev-Server Entry
- **D-14:** `npm run dev` serves an empty `<readkit-app>` Lit Web Component rendering "readk.it — Phase 1 dev shell" on a sass-compiled page. Element name (`readkit-app`), entry file (`src/main.ts`), and `index.html` are stable across phases — Phase 6 replaces the body of `<readkit-app>` rather than re-bootstrapping.
- **D-15:** `vite.config.ts` sets `base: './'` from day one. **Forward implication:** build outputs (P10 per-book HTML, P11 library index) must work under any deployment subpath, including the apex domain `readk.it/` from P13's gh-pages publishing.

#### TypeScript & Build Configs
- **D-16:** Split tsconfig: `tsconfig.json` (browser, strict, ES2022, `moduleResolution: bundler`, used by Vite + the `src/` tree) extends `tsconfig.base.json`. `tsconfig.node.json` (used by `vite.config.ts`, `eslint.config.js`, and future `tools/*.ts`).
- **D-17:** `.browserslistrc` as a separate file with the locked nine-line target set: `last 2 versions` of Chrome / Edge / Firefox / Safari / iOS Safari / Chrome Android / Firefox Android, `not dead`, `not op_mini all`.
- **D-18:** `.editorconfig` ships in Phase 1: utf-8, LF line endings, 2-space indent, trim trailing whitespace, insert final newline.

#### Linting & Formatting
- **D-19:** Prettier config: 2-space indent, single quotes, trailing commas, semicolons, 100-col print width.
- **D-20:** ESLint flat config (`eslint.config.js`): `eslint:recommended` + `typescript-eslint` strict-type-checked + `eslint-plugin-lit`. Type-aware lint runs in CI from Phase 2 onward; runs on staged files locally via lint-staged.

#### CSP
- **D-21:** **No CSP meta tag in Phase 1's dev shell.** Deferred to Phase 5.

#### Engine Quarantine Enforcement
- **D-22:** Phase 1 ships only the engine-quarantine **invariant documentation** (in `src/engine/README.md` per D-05). The ESLint `no-restricted-imports` rule lands in Phase 4. The "no `unsafeHTML()` on EPUB content" rule lands in Phase 5.

#### License & README
- **D-23:** License: MIT. `LICENSE` file at repo root. Copyright line: `Copyright (c) 2026 meBooks Ltd`.
- **D-24:** New `README.md` at repo root: purpose, supported browsers, prerequisites (Node 22 LTS + npm 10), install / dev loop / typecheck / lint / format scripts, repo layout one-liners, forward references to phases 9 / 10 / 11 / 13, GSD note, CLAUDE.md link, license. No separate `CONTRIBUTING.md`.

#### Cross-Phase Documentation Updates Required In Phase 1
- **D-25:** Update ROADMAP.md (Phase 1 success criteria 1/2/3/5 to npm-not-pnpm and dropping the size-cap clause; add Phase 13; drop Phase 12 success criterion 4 and TEST-05; renumber).
- **D-26:** Update REQUIREMENTS.md (pnpm→npm; drop TEST-05; add DEPLOY-01, DEPLOY-02; update Traceability table; new total = 39).
- **D-27:** Update CLAUDE.md (legacy-tree section; pnpm→npm; add Phase 13 reference).
- **D-28:** Update PROJECT.md (Constraints npm-only; legacy-tree note; add gh-pages publishing to Active; add new Key Decisions rows).
- **D-29:** STATE.md is updated automatically by the discuss/plan flow; no manual rows from this discussion.

### Claude's Discretion

- **CI scope for Phase 1:** moot — fully deferred to Phase 2 by D-12.
- **Dependency-update automation (Dependabot / Renovate):** defer to v1.x.
- **CONTRIBUTING.md:** skip — full README covers it.
- **CSP report-only on dev server in P1:** skip — deferred to P5.
- **Engine quarantine ESLint rule wording / enforcement mechanism:** planner picks `no-restricted-imports` vs custom rule when the rule lands in P4. P1 only writes the invariant into `src/engine/README.md`.
- **Exact `.gitignore` line ordering / grouping:** planner's call.
- **Vite plugin selection beyond what's locked (e.g. `vite-plugin-singlefile`):** Phase 10 territory.

### Deferred Ideas (OUT OF SCOPE)

#### Moved to a new phase
- **Phase 13: Deploy to GitHub Pages** — added by this discussion. New REQs `DEPLOY-01`, `DEPLOY-02`. Cross-doc updates from D-25/D-26 carry these.
- **Custom branded `404.html` / `500.html` error pages** — Phase 13 deliverable.

#### Dropped from v1 entirely
- **TEST-05 (memory-budget Playwright test)** — dropped per D-25; Phase 12 success criterion 4 deleted.
- **CI working-tree size cap** — dropped per D-09. Pre-commit >1 MB block is the local defence.

#### Deferred to v1.x or later phases
- Dependabot / Renovate → v1.x.
- CSP enforcement on dev server → P5 (report-only) / P12 (enforce).
- Engine quarantine ESLint rule → P4.
- `unsafeHTML()` ESLint guard → P5.
- `vitest.config.ts` + real `npm test` → P2.
- `.github/workflows/ci.yml` → P2.
- `.github/workflows/deploy.yml` → P13.
- `vite-plugin-singlefile` and `book` build mode → P10.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUILD-01 | Reproducible install on Node LTS 22 with no Python / Ruby / globals beyond Node and npm | `engines` field (D-02) + `engine-strict=true` enforces version floor; lockfile committed; Standard Stack table below pins every dep; legacy Python-2/Ruby/Compass dependencies eliminated by D-06 deletions. **Note:** REQ wording mentions `pnpm build`; D-26 rewrites it to `npm run build`. P1 cannot satisfy "produce all v1 artefacts via `npm run build`" because the build script lands in P10 — **the planner must scope BUILD-01 in Phase 1 to "install + dev server + typecheck + lint reproducible on a clean clone"**, with the "all v1 artefacts" portion remaining traceable to P10. |
| BUILD-02 | All runtime source is TypeScript (strict, ES2022, ESM); no AMD/RequireJS in new tree | `tsconfig.json` strict + `target: ES2022` + `module: ESNext` + `moduleResolution: bundler` (D-16); D-06 deletes the entire legacy AMD tree. ESLint `parser` is `typescript-eslint`, parser options use `projectService: true`. |
| BUILD-03 | All UI chrome implemented as Lit Web Components; no jQuery/Lo-Dash/iScroll/Modernizr/Detectizr in deps | `<readkit-app>` Lit shell (D-14); `package.json` deps contain only Lit 3 + Vite + dart-sass + linting (no legacy libs). D-06 deletes the legacy bundles. |
| BUILD-08 | Single committed lockfile makes install reproducible; `dist/`, `node_modules/` git-ignored; pre-commit blocks >1 MB | `.gitignore` (D-07: `dist*/`, `node_modules/`, `.cache/`, `*.epub`, `readkit.epub*/`); Husky 9 `.husky/pre-commit` (D-10) calls a small POSIX shell helper that scans `git diff --cached --name-only -z` for files >1 MB and aborts. **Note REQ wording:** "pnpm-lock.yaml or package-lock.json" — D-01 closes this to `package-lock.json`. |
| BUILD-09 | Developer-mode (`pnpm dev`) runs Vite dev server with HMR | Vite 8 dev server is HMR-by-default; D-14 confirms `npm run dev` serves the `<readkit-app>` shell. **Note REQ wording:** "drag-drop reader entry point" — D-14 supersedes this for P1 since the drag-drop entry doesn't exist yet (lands P9). The dev server in P1 serves the empty Lit shell, not a drag-drop reader. The planner must reflect this scoping in the task descriptions. |

## Project Constraints (from CLAUDE.md)

> CLAUDE.md directives are treated with the same authority as locked decisions from CONTEXT.md.

- **Sanitise EPUB content.** No `unsafeHTML()` on EPUB-supplied HTML. P1 doesn't render any EPUB content yet, but the invariant must already appear in `src/components/README.md` (per D-05).
- **One engine, two consumers.** No EPUB-processing code outside `src/engine/epub-processor.ts`. P1 creates the empty `src/engine/` directory + `README.md` (per D-05); the engine itself lands in P4.
- **No second renderer.** Build script and drag-drop entry must share engine, sanitiser, and chrome — no path bypasses. P1 doesn't introduce either consumer; the README invariant is what carries forward.
- **Persistence goes through `PersistenceStore`.** No component touches `localStorage` or `IndexedDB` directly. P1 documents this in `src/stores/README.md` (per D-05); the store itself lands in P3.
- **Repo hygiene.** `dist/`, `dist*/`, `node_modules/`, `.cache/`, `*.epub` git-ignored. Files >1 MB blocked by pre-commit. Do not commit build outputs. **This phase OWNS this constraint.**
- **No legacy deps.** No jQuery / Lo-Dash / iScroll / Modernizr / Detectizr / AMD / AppCache / Compass / Python 2. Defended by D-06 deletions and by `package.json` deps audit in Phase 1.
- **Untrusted input boundary.** Doesn't fire in P1 (no EPUB content), but `src/engine/README.md` must name the invariant.
- **Cross-LLM execution.** No TODOs / `// XXX` / `@ts-ignore` / skipped tests. Each plan self-contained.
- **Workflow:** GSD FINE granularity, YOLO mode, research+plan-check+verifier agents enabled.
- **Locked stack:** TypeScript 6 strict / ES2022 / ESM, Vite 8 (MPA), Lit 3, dart-sass 1.99, **npm 10** (D-01 supersedes "or pnpm 9"), Vitest 4, Playwright 1.59. Browsers: last 2 versions of Chrome/Edge/Firefox/Safari/iOS Safari/Chrome Android/Firefox Android. **No IE.**
- **Phase plans must be self-contained:** file paths explicit, dependencies re-stated (not linked), success criteria testable from PLAN.md alone.

## Architectural Responsibility Map

> Phase 1 is a tooling/bootstrap phase. The "tiers" map onto **build/dev artefact ownership**, not runtime tiers. Captured here for the planner to sanity-check task assignments.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Node version pinning | Toolchain (`.nvmrc` + `engines`) | — | `.nvmrc` is consumed by `nvm`/`fnm`/`mise`; `engines` + `engine-strict=true` is enforced by npm at install time. Both layers needed to defend cross-developer reproducibility. |
| Lockfile + dep resolution | npm + `package-lock.json` | — | npm 10 is the canonical PM (D-01); pnpm path is closed. |
| Module resolution & types | TypeScript 6 (`tsconfig.json` strict, ES2022 target, `bundler` resolution) | Vite 8 dev/build | Vite uses TS only for type-stripping; Vitest will use the same `tsconfig.json` with overrides for Node. |
| Linting (style + types) | ESLint 10 flat config + typescript-eslint 8 + eslint-plugin-lit | Prettier 3 (formatting only) | Prettier owns style; ESLint owns code-correctness + Lit-specific rules. `eslint-config-prettier` not strictly required if Prettier defaults align (verify). |
| Formatting | Prettier 3 | `.editorconfig` | Editorconfig is editor-tier; Prettier is the source of truth for committed code. |
| Pre-commit hygiene | Husky 9 + lint-staged 16 | local helper script for >1 MB block | `.husky/pre-commit` is one shell file; lint-staged is invoked from it. |
| Dev server / HMR | Vite 8 dev | — | Vite owns the dev tier exclusively. |
| Stylesheet compilation | dart-sass 1.99 (via Vite) | — | Vite picks up `.scss` imports natively when `sass` is installed; no explicit plugin needed. |
| UI scaffold | Lit 3 (`<readkit-app>`) | — | One element, no Shadow DOM children needed in P1. |
| Repo hygiene gates | `.gitignore` + `.husky/pre-commit` >1 MB block + `engine-strict=true` | (CI gate is OUT — D-09) | Three local layers; CI working-tree size gate is removed from scope. |
| Legacy-tree cleanup | git tag (`legacy-snapshot-2013`) + `git rm -r` | `.gitignore` for `readkit.epub*/` | The tag is recovery; deletion is the action; gitignore is the durable state. |
| Cross-doc updates | Plain markdown edits to ROADMAP / REQUIREMENTS / CLAUDE / PROJECT | — | Pure text edits; no code. Belong in dedicated tasks (one per doc). |

## Standard Stack

> Versions verified against the npm registry on 2026-04-26 (`npm view <pkg> version`). Where a version is `[ASSUMED]`, the planner should re-verify before pinning.

### Core (runtime / build / type-checking)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `typescript` | **6.0.3** | Strict ES2022 type-checking; powers `npm run typecheck`. | Locked in PROJECT.md. `[VERIFIED: npm view typescript version → 6.0.3]` |
| `vite` | **8.0.10** | Dev server (HMR), production build orchestrator (uses Rolldown internally per Vite 8). | Locked in PROJECT.md. `[VERIFIED: npm view vite version → 8.0.10]` |
| `lit` | **3.3.2** | Web Component layer for `<readkit-app>` and downstream chrome. | Locked in PROJECT.md. `[VERIFIED: npm view lit version → 3.3.2]` |
| `sass` (dart-sass) | **1.99.0** | SCSS compilation, replacing Compass+Ruby. | Locked in PROJECT.md. Vite picks up `.scss` imports automatically when `sass` is installed. `[VERIFIED: npm view sass version → 1.99.0]` |

### Linting / formatting / hooks (Phase 1 owns these)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `eslint` | **10.2.1** | Flat config, type-aware linting via plugin. | ESLint 10 is current; flat config is the only supported format. `[VERIFIED: npm view eslint version → 10.2.1]` |
| `typescript-eslint` | **8.59.0** | Single meta-package exposing parser + plugin + recommended/strict configs. Use `tseslint.configs.recommendedTypeChecked` and `parserOptions.projectService: true`. | Locked in PROJECT.md. `[VERIFIED: npm view typescript-eslint version → 8.59.0; CITED: typescript-eslint.io/getting-started/typed-linting (April 2026)]` |
| `eslint-plugin-lit` | **2.2.1** | Lit-specific rules (`lit/no-template-bind`, `lit/no-invalid-html`, etc.). | Per D-20. `[VERIFIED: npm view eslint-plugin-lit version → 2.2.1]` |
| `prettier` | **3.8.3** | Single source of truth for formatting (2-space, single-quote, trailing-comma, semicolons, 100-col per D-19). | `[VERIFIED: npm view prettier version → 3.8.3]` |
| `husky` | **9.1.7** | Pre-commit hook orchestration. Use `npx husky init` (modern flow), not legacy `husky install`. | `[VERIFIED: npm view husky version → 9.1.7; CITED: typicode.github.io/husky/get-started.html (April 2026)]` |
| `lint-staged` | **16.4.0** | Run ESLint + Prettier on staged files only. | `[VERIFIED: npm view lint-staged version → 16.4.0]` |

### Phase 1 placeholders (pinned now, used later)

> These are not strictly required by Phase 1's success criteria but the planner may opt to pin them in `package.json` as `devDependencies` so Phase 2's task surface is "install" not "install + add". If the planner prefers a minimal Phase 1, defer all of these to P2.

| Library | Version | First Used In | Note |
|---------|---------|---------------|------|
| `@playwright/test` | **1.59.1** | Phase 2 | Stays out of P1. `[VERIFIED: npm view @playwright/test version → 1.59.1]` |
| `vitest` | **4.1.5** | Phase 2 | Stays out of P1. `[VERIFIED: npm view vitest version → 4.1.5]` |
| `@vitest/browser` | **4.1.5** | Phase 2 | `[VERIFIED: npm view @vitest/browser version → 4.1.5]` |
| `@vitest/browser-playwright` | **4.1.5** | Phase 2 | Browser provider. `[VERIFIED: npm view @vitest/browser-playwright version → 4.1.5]` |
| `fake-indexeddb` | **6.2.5** | Phase 3 | `[VERIFIED: npm view fake-indexeddb version → 6.2.5]` |
| `fflate` | **0.8.2** | Phase 4 | `[VERIFIED: npm view fflate version → 0.8.2]` |
| `fast-xml-parser` | **5.7.2** | Phase 4 | `[VERIFIED: npm view fast-xml-parser version → 5.7.2]` |
| `dompurify` | **3.4.1** | Phase 5 | `[VERIFIED: npm view dompurify version → 3.4.1]` |
| `vite-plugin-singlefile` | **2.3.3** | Phase 10 | `[VERIFIED: npm view vite-plugin-singlefile version → 2.3.3]` |
| `tsx` | **4.21.0` | Phase 10 (run `tools/build-book.ts` from CLI without compile step) | `[VERIFIED: npm view tsx version → 4.21.0]` |
| `globals` | **17.5.0** | ESLint flat config (browser/node globals lookup) | Often a P1 dep alongside ESLint flat config. `[VERIFIED: npm view globals version → 17.5.0]` |

**Recommendation for Phase 1 minimal install:** `typescript`, `vite`, `lit`, `sass`, `eslint`, `typescript-eslint`, `eslint-plugin-lit`, `prettier`, `husky`, `lint-staged`, `globals`. ~11 devDependencies + 1 runtime dep (`lit`). All Phase 2+ deps pinned in their phases, not P1.

### Alternatives Considered

| Instead of | Could Use | Tradeoff (and why we don't) |
|------------|-----------|-----------------------------|
| npm | pnpm 9 | D-01 closes this. Two canonical PMs is worse than rewriting four success criteria. |
| Husky 9 | `simple-git-hooks` | `simple-git-hooks` has a smaller surface but smaller community; Husky 9 is the de-facto standard and the docs explicitly support `husky init`. |
| `lint-staged` | `nano-staged` | `nano-staged` is faster but lacks a few features. Project doesn't have hot-path performance concerns at install. |
| ESLint flat config | Legacy `.eslintrc.js` | ESLint 10 only ships flat config. No alternative. |
| `eslint-config-prettier` (turn off ESLint stylistic rules that fight Prettier) | Trust Prettier defaults | Prettier 3.8 is conservative enough that most eslint:recommended formatting rules don't conflict. **Planner's call:** include `eslint-config-prettier` if the team wants belt-and-braces, omit otherwise. Current strong recommendation: include it (~5 KB cost, eliminates a class of bug). |
| `editorconfig-checker` (CI verifies editorconfig adherence) | Trust developers + Prettier | EditorConfig in P1 is enough; CI check is a P2 nice-to-have. |
| Browserslist as a separate file | `package.json` `browserslist` field | D-17 chooses the separate file. |

**Installation (Phase 1 minimal, single command):**

```bash
npm install --save-dev typescript vite lit sass eslint typescript-eslint eslint-plugin-lit eslint-config-prettier prettier husky lint-staged globals @types/node
npm install lit
```

(Note: `lit` appears twice — once in dev deps for type-checking convenience and once in deps. In practice `lit` lives in `dependencies` since the runtime ships it.)

**Version verification:** All versions in the table above were captured by `npm view <pkg> version` on 2026-04-26 against the public registry. Re-verify before pinning if planning is deferred more than 30 days.

## Architecture Patterns

### System Architecture Diagram (Phase 1 deliverable surface)

```
┌──────────────────────────────────────────────────────────┐
│  Developer Machine                                       │
│                                                          │
│  ┌──────────────────────────────────────────┐            │
│  │ git clone                                │            │
│  └──────────────┬───────────────────────────┘            │
│                 │                                        │
│                 ▼                                        │
│  ┌──────────────────────────────────────────┐            │
│  │ .nvmrc (22) + engines (Node>=22, npm>=10)│            │
│  │ + .npmrc (engine-strict=true)            │            │
│  └──────────────┬───────────────────────────┘            │
│                 │                                        │
│                 ▼                                        │
│  ┌──────────────────────────────────────────┐            │
│  │ npm install                              │            │
│  │  ├─ resolves package-lock.json           │            │
│  │  └─ runs prepare → husky                 │ ─┐         │
│  └──────────────┬───────────────────────────┘  │         │
│                 │                              │         │
│                 ▼                              ▼         │
│  ┌──────────────────────────┐  ┌────────────────────┐    │
│  │ npm run dev              │  │ .husky/pre-commit  │    │
│  │ ├─ vite                  │  │ ├─ >1 MB block     │    │
│  │ ├─ index.html            │  │ └─ lint-staged     │    │
│  │ ├─ src/main.ts           │  │     ├─ ESLint --fix│    │
│  │ ├─ <readkit-app>         │  │     └─ prettier -w │    │
│  │ ├─ src/styles/main.scss  │  └────────────────────┘    │
│  │ └─ HMR @ localhost:5173  │                            │
│  └──────────────────────────┘                            │
│                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │ npm run typecheck        │  │ npm run lint         │  │
│  │ └─ tsc --noEmit (strict) │  │ └─ eslint . --max-..│  │
│  └──────────────────────────┘  └──────────────────────┘  │
│                                                          │
│  Excluded by .gitignore:                                 │
│  • node_modules/  • dist/  • dist*/  • .cache/           │
│  • *.epub  • readkit.epub/ readkit.epub.giantleap/       │
│  • readkit.epub.mobydick.epub/                           │
└──────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Phase 1 target state)

```
.
├── .editorconfig
├── .gitignore
├── .npmrc                          # engine-strict=true
├── .nvmrc                          # 22
├── .browserslistrc                 # nine-line locked target
├── .prettierrc.json
├── .prettierignore
├── .lintstagedrc.json              # OR `lint-staged` key in package.json
├── .husky/
│   └── pre-commit                  # >1 MB block + lint-staged
├── .planning/                      # already exists
├── CLAUDE.md                       # updated per D-27
├── LICENSE                         # MIT, Copyright (c) 2026 meBooks Ltd
├── README.md                       # new per D-24
├── eslint.config.js                # flat config
├── index.html                      # mounts <readkit-app>
├── package.json                    # engines, scripts, deps, lint-staged?
├── package-lock.json               # committed
├── tsconfig.base.json              # shared compilerOptions
├── tsconfig.json                   # browser, strict, ES2022, bundler resolution
├── tsconfig.node.json              # for vite.config.ts, eslint.config.js, tools/
├── vite.config.ts                  # base: './', dev-only entry in P1
├── readkit.epub/                   # gitignored, on-disk only
├── readkit.epub.giantleap/         # gitignored
├── readkit.epub.mobydick.epub/     # gitignored
├── src/
│   ├── main.ts                     # registers <readkit-app>
│   ├── components/
│   │   ├── README.md               # invariant: no unsafeHTML on EPUB
│   │   ├── readkit-app.ts          # the Lit shell
│   │   └── .gitkeep
│   ├── controllers/
│   │   ├── README.md               # invariant: DOM-free
│   │   └── .gitkeep
│   ├── engine/
│   │   ├── README.md               # invariant: fflate/fast-xml-parser quarantined
│   │   └── .gitkeep
│   ├── stores/
│   │   ├── README.md               # invariant: only writer to IDB/localStorage
│   │   └── .gitkeep
│   └── styles/
│       └── main.scss               # one entry; Vite picks up via dart-sass
├── tools/
│   ├── README.md                   # invariant: build script lands in P10
│   └── .gitkeep
└── tests/
    └── fixtures/
        ├── README.md               # invariant: fixtures land in P2
        └── .gitkeep
```

### Pattern 1: ESLint flat config with type-aware linting

**What:** Single `eslint.config.js` (ESM) configures rules, parser, project service.
**When to use:** Always for P1; ESLint 10 only ships flat config.
**Example:**

```javascript
// Source: typescript-eslint.io/getting-started/typed-linting (April 2026)
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import lit from 'eslint-plugin-lit';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  lit.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
      globals: { ...globals.browser, ...globals.node },
    },
  },
  prettier, // last — turns off rules that conflict with Prettier
  {
    ignores: ['dist/', 'dist*/', 'node_modules/', '.husky/', 'readkit.epub*/', '*.epub'],
  },
);
```

`[CITED: https://typescript-eslint.io/getting-started/typed-linting]` — `parserOptions.projectService: true` replaces the legacy `project: './tsconfig.json'` + `tsconfigRootDir` pattern. Type-aware rules will work on `.ts` files inside `src/` and `tests/` automatically once a `tsconfig.json` is present.

**Note for the planner:** D-20 reads "typescript-eslint strict-type-checked"; the example above uses both `strictTypeChecked` and `stylisticTypeChecked`. The planner can drop the stylistic preset if it produces too many P1 false-positives on the empty Lit shell.

### Pattern 2: Husky 9 setup (modern flow)

**What:** `npx husky init` writes `.husky/pre-commit` and adds `"prepare": "husky"` to `package.json`.
**When to use:** Always; this is the only supported v9 flow.
**Example:**

```bash
# Source: typicode.github.io/husky/get-started.html (April 2026)
npm install --save-dev husky
npx husky init
```

The init command:
1. Creates `.husky/pre-commit` with a placeholder
2. Adds `"prepare": "husky"` to `package.json`
3. Configures git's `core.hooksPath` automatically

**`.husky/pre-commit` for this project (D-10):**

```bash
#!/usr/bin/env sh
# Block files larger than 1 MB
LIMIT=$((1024*1024))
files=$(git diff --cached --name-only --diff-filter=ACMR -z | tr '\0' '\n')
if [ -n "$files" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if [ -f "$f" ]; then
      size=$(wc -c <"$f" | tr -d ' ')
      if [ "$size" -gt "$LIMIT" ]; then
        echo "ERROR: $f is ${size} bytes (>1 MB). Reject." >&2
        exit 1
      fi
    fi
  done <<EOF
$files
EOF
fi

# Run lint-staged
npx lint-staged
```

**Important:** Husky 9 does not require the v8-era shebang/eval shim (`. "$(dirname -- "$0")/_/husky.sh"`) because `core.hooksPath` is set to `.husky/` directly. The hook is just a regular shell script. `[CITED: typicode.github.io/husky/get-started.html]`

**Cross-platform note:** macOS/Linux developers run shell directly. Windows developers run via Git Bash, which the script above is compatible with (POSIX shell). If a Windows-without-Git-Bash contributor is expected, the planner should add a Node-based alternative (`node -e "..."`) — but the project's contributor profile is presumed POSIX (macOS/Linux + WSL).

### Pattern 3: lint-staged 16 config

**What:** `.lintstagedrc.json` (or `lint-staged` key in `package.json`) declares globs → commands.
**When to use:** Always; pairs with Husky.
**Example:**

```json
// Source: github.com/lint-staged/lint-staged (April 2026)
{
  "*.{ts,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md,scss,css,html}": ["prettier --write"]
}
```

`[CITED: lint-staged/lint-staged README]` — array values run sequentially on the same matched files. Multiple top-level globs run in parallel.

### Pattern 4: Vite 8 MPA-friendly config (P1 dev-only)

**What:** Single `vite.config.ts` with `base: './'`. P1 has only one entry (`index.html`); P10 will add a `book` mode and P11 will add a `library` entry.
**When to use:** Now, kept simple, growing with the project.
**Example:**

```typescript
// Source: vite.dev/guide/build (April 2026)
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',                        // D-15: file:// + subpath compatibility
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rolldownOptions: {                // Vite 8: rolldownOptions, NOT rollupOptions
      input: {
        main: 'index.html',
      },
    },
  },
});
```

`[CITED: https://vite.dev/guide/migration.html]` — Vite 8 deprecated `rollupOptions` in favour of `rolldownOptions`. Old config keeps working through a compat layer but the planner should write the new form to avoid future-deprecation churn.

**SCSS pickup:** No plugin needed. `import './styles/main.scss'` from `src/main.ts` works once `sass` is in devDependencies. `[CITED: vite.dev/guide/features#css-pre-processors]`

### Pattern 5: Lit 3 minimal shell

**What:** A single Lit element with `static styles` and `render()`. P6 will replace its body.
**When to use:** Now (P1) for the dev-server proof-of-life; renamed/extended in P6.
**Example:**

```typescript
// Source: lit.dev/docs/v3/components/styles (April 2026)
// src/components/readkit-app.ts
import { LitElement, html, css, type CSSResultGroup } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('readkit-app')
export class ReadkitApp extends LitElement {
  static styles: CSSResultGroup = css`
    :host {
      display: block;
      min-height: 100dvh;          /* P1 sets the dvh discipline early */
      font-family: system-ui, sans-serif;
      padding: 2rem;
    }
  `;

  render() {
    return html`<h1>readk.it — Phase 1 dev shell</h1>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'readkit-app': ReadkitApp;
  }
}
```

```typescript
// src/main.ts
import './components/readkit-app.js';
import './styles/main.scss';
```

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>readk.it</title>
  </head>
  <body>
    <readkit-app></readkit-app>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`[CITED: lit.dev/docs/v3/components/styles]` — static `styles` field with `css` tagged template is the recommended API for Lit 3 components.

### Anti-Patterns to Avoid

- **Using `husky install` + `.husky/_/husky.sh`:** v8 era. v9 ships the modern `husky init` flow; the legacy shim is gone. Don't copy patterns from pre-2024 blog posts.
- **Configuring ESLint via `.eslintrc.json` or `.eslintrc.js`:** Legacy config; ESLint 10 only loads `eslint.config.js` (flat config).
- **Using `rollupOptions` in `vite.config.ts`:** Deprecated in Vite 8; use `rolldownOptions`. Old form still works but emits a warning.
- **Putting the >1 MB block in `package.json` `scripts.precommit`:** The hook lives in `.husky/pre-commit`. `npm run precommit` is not the git-hook integration; it's just an npm script.
- **Using `husky add .husky/pre-commit "..."`:** v8 command, removed in v9. Edit the file directly after `husky init`.
- **Not setting `engine-strict=true`:** `engines` in `package.json` is advisory by default; without `.npmrc engine-strict=true`, npm only emits a warning. `engine-strict=true` makes it a hard error (D-02 explicitly requires this).
- **Using `script type="module" src="./src/main.ts"` (relative `./`)** when `base: './'` is set: works, but Vite's recommended dev-mode is `/src/main.ts` (absolute) which is rewritten correctly to relative at build.
- **Committing `package-lock.json` alongside `pnpm-lock.yaml` or `yarn.lock`:** Pick one PM; D-01 picks npm. CI / `engine-strict` should reject the others.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pre-commit hook installation | bash `git config core.hooksPath` + symlinks | `husky` 9.1.7 (`npx husky init`) | Ensures hook fires for every contributor, handles core.hooksPath, integrates with prepare script. |
| Running tools on staged files only | bash loops over `git diff --cached` | `lint-staged` 16.4.0 | Concurrency, glob handling, partial-staging support, fail-on-empty-diff handling. |
| Browser-target config for SCSS / esbuild | Hard-code lists in multiple files | `.browserslistrc` | Single source of truth; consumed by Vite, Lightning CSS, future autoprefixer. |
| Code style (semis, quotes, indent, trailing comma) | Bespoke ESLint stylistic rules | `prettier` 3.8.3 + `eslint-config-prettier` | Prettier is opinionated and predictable; ESLint stylistic rules conflict with Prettier and are deprecated upstream. |
| Type-aware lint rules | `tsconfig`-aware custom logic | `typescript-eslint` 8 with `parserOptions.projectService: true` | Modern, no `tsconfigRootDir` needed; covers `no-floating-promises`, `no-misused-promises`, `await-thenable`, etc. |
| Lit-specific lint (template syntax, attribute binding) | Manual review | `eslint-plugin-lit` 2.2.1 | Catches `lit/no-invalid-html`, `lit/no-template-bind`, etc. Phase 1 components are too thin to need this much, but the rule is cheap and ramps with later phases. |
| Multi-page Vite config | Hand-rolled HTML emit + asset routing | Vite 8 MPA via `rolldownOptions.input` | Vite's MPA mode is first-class; lazy + correct. |
| SCSS compilation pipeline | dart-sass CLI as separate npm script | Vite + `sass` devDependency (auto-pickup) | Vite imports `.scss` natively when `sass` is installed; no postcss/scss-loader required. |
| Detecting Node version mismatch | Custom `preinstall` script that calls `process.version` | `engines` field + `engine-strict=true` | Native npm support; standard error message; works pre-install. |
| Rejecting >1 MB files in pre-commit | Bespoke logic | A short shell loop in `.husky/pre-commit` | This one *is* hand-rolled — there's no standard library for "block staged files >N bytes". The shell loop is short (≤20 lines), well-understood, and covers the case. The only alternative (`pre-commit` framework, in Python) is rejected by the no-Python constraint. |

**Key insight:** Phase 1 is unusual in that almost every problem is solved by a tooling library; the only hand-rolled code is the >1 MB block. Resist the temptation to add custom Node scripts when an upstream tool exists.

## Runtime State Inventory

> Phase 1 includes **destructive cleanup of the legacy 2013-era tree** (D-06). This is a rename/refactor/migration-class operation. Inventory follows.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | None — the legacy reader stores per-EPUB state in `localStorage` of any browser that opened it, but those state blobs live in user browsers, not in the repo. The new `PersistenceStore` (P3) won't read them. **No data migration is owed by P1.** | None — `localStorage` carryover is moot (different keys, different runtime, different domain). |
| **Live service config** | `git@github.com:jcdarwin/readk.it.git` — the public GitHub repo. Branches/tags/PRs may carry the old paths in commit history. **The `legacy-snapshot-2013` tag is the deliberate pointer** to pre-cleanup state. No external service (CI, Pages, etc.) is configured yet — Phase 1 doesn't ship any GitHub Actions per D-12, and the `gh-pages` branch doesn't exist yet (Phase 13). | Tag `legacy-snapshot-2013` BEFORE the cleanup commit, push the tag immediately so it's recoverable from any clone. |
| **OS-registered state** | None. The legacy build relied on `grunt-cli` installed globally (`npm install -g grunt-cli`); contributor machines may have it. No machine-level registration of paths in launchd/systemd/Task Scheduler. **No action owed by Phase 1**, but the new README should not document `grunt-cli` install (it's gone). | None. |
| **Secrets / env vars** | None in the repo (`grep -r '\.env'` returns nothing committed). The legacy `Gruntfile.js` has no secrets. CI doesn't exist yet. **No action owed by Phase 1.** | None. |
| **Build artifacts / installed packages** | Local `node_modules/` (legacy), local `dist/` directories (committed: `dist/`, `dist.0.11.16/`, `dist.gianleap/`). Worth ~700 MB. After deletion, contributors who pull will get the deletions; contributors who already have these as local-untracked-but-installed will need to `rm -rf node_modules && npm install` to drop the legacy `grunt`/`compass` deps and pick up the new lockfile. | (1) Delete `node_modules/`, `dist*/` per D-06. (2) Add `node_modules/` + `dist*/` to `.gitignore`. (3) README documents `npm install` as the post-clone step. (4) The 27 untracked `readkit.epub*/` directories are kept on disk + gitignored per D-07; contributors who don't have them get a working repo without the EPUBs (P10/P13 will document where to obtain a curated set). |

**The canonical question — after every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?** Answer: nothing material. The `legacy-snapshot-2013` git tag covers history recovery; no other system carries forward state from the legacy tree. **Confidence: HIGH.**

## Common Pitfalls

### Pitfall 1: Vite 8 `rollupOptions` deprecation surprise
**What goes wrong:** Planner copies `rollupOptions: { input: ... }` from a 2024-era Vite tutorial; Vite 8 emits a warning at install/build but doesn't error, so it's easy to miss. Future Vite versions will break.
**Why it happens:** Vite 8 (released early 2026) replaced Rollup with Rolldown. `[CITED: vite.dev/guide/migration.html]`
**How to avoid:** Use `rolldownOptions` in all new code. Treat any "rollupOptions" mention in a tutorial as pre-Vite-8.
**Warning signs:** `[deprecation]` warnings in `npm run build` output; `rollup`-specific plugin imports (the project shouldn't have any of these in P1).

### Pitfall 2: Husky 9 hook silently doesn't run
**What goes wrong:** Contributor clones, runs `npm install`, but the pre-commit hook doesn't fire on `git commit`.
**Why it happens:** The `prepare` script (`"prepare": "husky"`) runs `husky` which sets `core.hooksPath=.husky`. If `prepare` is omitted from `package.json`, or if `npm install --ignore-scripts` was used, the git config isn't updated and hooks live in the default `.git/hooks/` (which is empty).
**How to avoid:** (a) Keep `"prepare": "husky"` in `package.json`. (b) Document in README that `npm install --ignore-scripts` is unsupported for contributors. (c) Add a one-line README check: `git config core.hooksPath` should output `.husky`.
**Warning signs:** `git commit -m "test 2 MB file"` succeeds when staging a 2 MB file. Test this in CONTEXT-validation tasks.

### Pitfall 3: `engine-strict=true` not honored
**What goes wrong:** Contributor on Node 20 runs `npm install`, gets a warning, the install completes, the build mostly works, mysterious failures appear later.
**Why it happens:** `package.json` `engines` is advisory by default. The user has decided (D-02) that this is unacceptable. `engine-strict=true` in `.npmrc` makes it an install-time hard error.
**How to avoid:** Both `engines` field AND `.npmrc` with `engine-strict=true`. Double-defence.
**Warning signs:** `npm WARN EBADENGINE` in install output. If the output says only `WARN`, `engine-strict=true` is missing.

### Pitfall 4: Vite serves but TypeScript errors are silenced
**What goes wrong:** Contributor runs `npm run dev`, sees the `<readkit-app>` shell, assumes everything is fine — but `npm run typecheck` fails because Vite only strips types, it doesn't type-check.
**Why it happens:** Vite's TypeScript handling is transform-only. Type errors are revealed only by `tsc --noEmit`.
**How to avoid:** `package.json` has both `dev` (vite) and `typecheck` (tsc --noEmit). README documents that `npm run typecheck` must pass before commit. CI in P2 enforces this; P1 can document it but doesn't gate it (no CI yet).
**Warning signs:** Lit decorators (`@customElement`) require `experimentalDecorators` OR ES2022 decorators (the modern path). With `tsconfig.json` `target: ES2022` + `useDefineForClassFields: true` + `experimentalDecorators: false`, Lit 3 works. If the planner accidentally enables `experimentalDecorators: true`, types still work but tooling fragments.

**Lit 3 + TypeScript decorator config (HIGH-CONFIDENCE):**
```json
// tsconfig.json compilerOptions
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "useDefineForClassFields": true,
  "experimentalDecorators": false,
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitOverride": true,
  "exactOptionalPropertyTypes": true,
  "noUncheckedIndexedAccess": true,
  "isolatedModules": true,
  "skipLibCheck": true,
  "lib": ["ES2022", "DOM", "DOM.Iterable"]
}
```
`[CITED: lit.dev/docs/v3/components/decorators]` — Lit 3 supports both legacy and standard decorators; the standard path (`useDefineForClassFields: true`) is the future-proof choice.

### Pitfall 5: `.gitignore` writes too late, repo bloats again
**What goes wrong:** Contributor runs `npm install`, then `npm run dev`, then `git status` shows `node_modules/` because `.gitignore` wasn't committed first.
**Why it happens:** Sequencing of P1 tasks matters. `.gitignore` must land BEFORE `npm install` ever runs — which means the planner's task ordering is "create .gitignore" → "create package.json" → "npm install".
**How to avoid:** First commits in P1 are `.gitignore` + bootstrap config files (`package.json`, `tsconfig.json`, etc.). Only then is `npm install` run.
**Warning signs:** `git status` shows `node_modules/` as untracked.

### Pitfall 6: Pre-commit shell script breaks on filenames with spaces
**What goes wrong:** A staged file `My Document.md` causes the >1 MB scan loop to fail or skip the file silently.
**Why it happens:** Shell word-splitting on whitespace.
**How to avoid:** Use `git diff --cached --name-only --diff-filter=ACMR -z` (NUL-delimited) and a `while IFS= read -r -d '' f` loop. The example in Pattern 2 above uses a tr-based normalization which is *adequate but not bulletproof*; the planner should consider hardening it.
**Warning signs:** None at install — shows up only in failed commits long after P1 ships.

### Pitfall 7: Cross-LLM execution: planner copies CONTEXT.md verbatim, including notes that supersede REQ wording
**What goes wrong:** REQUIREMENTS.md still reads `pnpm install`. A different LLM in a later phase might "correct" Phase 1 plans to use pnpm, or fail Phase 1 verification because P1 used npm.
**Why it happens:** Cross-LLM execution discipline; CLAUDE.md is the entry point but the LLM may not parse the D-25 / D-26 supersedes correctly.
**How to avoid:** P1 plan tasks for D-25/D-26 must be done EARLY in the phase (not at the end), so the canonical artefacts already say "npm" by the time later tasks reference them. Plan-checker agent must verify D-25/D-26 tasks are scheduled before tasks that reference REQUIREMENTS.md or ROADMAP.md success criteria.
**Warning signs:** A Phase 1 plan that has the doc-update tasks at the end of the phase. They should be early/middle.

### Pitfall 8: README references a `pnpm` command in the dev loop
**What goes wrong:** Repository is public; a contributor reads README and runs `pnpm install`, gets a different lockfile, breaks reproducibility.
**Why it happens:** Easy slip when the legacy/draft docs say pnpm.
**How to avoid:** The README task is one of the latest in P1 ordering, AFTER all D-25/D-26/D-27/D-28 doc updates. README defaults must explicitly contradict pnpm: "Requires Node 22 LTS and **npm 10**. Do not use pnpm or yarn — `engine-strict` rejects them."
**Warning signs:** Submitted PRs from contributors show `pnpm-lock.yaml`.

### Pitfall 9: "Empty" Phase 1 still has 25+ files — task explosion
**What goes wrong:** P1 looks small ("just a skeleton") but actually creates 25-30 distinct files. Without grouping, tasks become a long list of "create file X" steps with no logical structure.
**Why it happens:** Too many discrete deliverables without meaningful task batching.
**How to avoid:** The planner should group tasks by *concern*, not by *file*: "Bootstrap toolchain" (`.nvmrc` + `.npmrc` + `package.json` engines + `.editorconfig`), "Configure TypeScript" (3 tsconfigs), "Configure ESLint + Prettier" (2-3 files), "Configure Vite" (1 file), "Configure git hygiene" (`.gitignore` + Husky + lint-staged + LICENSE), "Lit shell" (`index.html` + `src/main.ts` + `src/components/readkit-app.ts` + `src/styles/main.scss`), "Skeleton READMEs" (the D-05 set), "Legacy cleanup" (D-06 deletions, recoverable via tag), "Doc updates" (D-25, D-26, D-27, D-28 — one task each), "New README" (D-24), "License" (D-23). That gives ~10-12 logical tasks rather than 25-30 file-edits.

### Pitfall 10: Repository hygiene regression (the headline pitfall this phase defends)
**What goes wrong:** Despite P1, somebody commits `dist/` because the build was experimentally exercised before the gitignore landed; or commits a 5 MB EPUB because they renamed it `book.zip` so `*.epub` doesn't match.
**Why it happens:** The 700 MB legacy tree is the historical evidence that this team has fallen into this trap repeatedly. `[CITED: .planning/codebase/CONCERNS.md "Large Repository Working Tree"]`
**How to avoid:** (a) `.gitignore` includes `dist*/` (glob — covers `dist/`, `dist.0.11.16/`, `dist.gianleap/`, future `dist.something/`). (b) `*.epub` glob in `.gitignore`. (c) Pre-commit `>1 MB` block (D-09). (d) Document the discipline in CLAUDE.md (already done). (e) The CI working-tree size cap that *would* be belt-and-braces is dropped per D-09; the four local layers are deemed sufficient.
**Warning signs:** Any contributor PR > 5 MB diff.

## Code Examples

### `.gitignore` (P1 recommended set)

```gitignore
# Source: synthesised from D-07, CLAUDE.md, .planning/codebase/CONCERNS.md
# Dependencies
node_modules/

# Build outputs
dist/
dist*/

# Caches / OS / editor
.cache/
.DS_Store
.idea/
.vscode/
*.swp
*.tmp

# Local env / secrets (none expected; defensive)
.env
.env.local
.env.*.local

# EPUB content (kept on disk, never versioned per D-07)
*.epub
readkit.epub/
readkit.epub.giantleap/
readkit.epub.mobydick.epub/

# Coverage / test outputs (P2+)
coverage/
test-results/
playwright-report/
.nyc_output/

# Logs
*.log
npm-debug.log*
```

### `package.json` skeleton (P1)

```json
{
  "name": "readk.it",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "echo 'tests land in Phase 2' && exit 0",
    "prepare": "husky"
  },
  "dependencies": {
    "lit": "^3.3.2"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "eslint": "^10.2.1",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-lit": "^2.2.1",
    "globals": "^17.5.0",
    "husky": "^9.1.7",
    "lint-staged": "^16.4.0",
    "prettier": "^3.8.3",
    "sass": "^1.99.0",
    "typescript": "^6.0.3",
    "typescript-eslint": "^8.59.0",
    "vite": "^8.0.10"
  },
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.{json,md,scss,css,html}": ["prettier --write"]
  }
}
```

`[VERIFIED versions per npm registry 2026-04-26.]` `[ASSUMED `@types/node` ^22.0.0 — pin against `npm view @types/node version` at planning time.]`

### `tsconfig.base.json` (shared compilerOptions)

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "useDefineForClassFields": true,
    "experimentalDecorators": false,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

### `tsconfig.json` (browser tree, used by Vite)

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": [],
    "noEmit": true,
    "jsx": "preserve"
  },
  "include": ["src/**/*"]
}
```

### `tsconfig.node.json` (vite.config + future tools/)

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "types": ["node"],
    "noEmit": true
  },
  "include": ["vite.config.ts", "eslint.config.js", "tools/**/*"]
}
```

### `.browserslistrc` (D-17)

```
last 2 Chrome versions
last 2 Edge versions
last 2 Firefox versions
last 2 Safari versions
last 2 iOS versions
last 2 ChromeAndroid versions
last 2 FirefoxAndroid versions
not dead
not op_mini all
```

### `.editorconfig` (D-18)

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

### `.prettierrc.json` (D-19)

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100,
  "endOfLine": "lf"
}
```

### `.npmrc` (D-02)

```
engine-strict=true
```

### `LICENSE` (MIT, D-23)

```
MIT License

Copyright (c) 2026 meBooks Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## State of the Art

| Old Approach (legacy 2013-era) | Current Approach (P1) | When Changed | Impact |
|--------------------------------|-----------------------|--------------|--------|
| Grunt 0.4.x + grunt-* contrib plugins | Vite 8 (with Rolldown internals) | Vite 8 GA (early 2026) | Single config; fast HMR; first-class MPA. |
| RequireJS 2.1.8 + AMD `define([...])` | Native ES Modules + TypeScript 6 | TS 6 GA (post-2025) | No module loader; tree-shake; standard imports. |
| `.eslintrc.js` legacy config | `eslint.config.js` flat config | ESLint 9+ (2024); ESLint 10 ships flat-only | Single-file config; explicit imports; `defineConfig` helper. |
| `parserOptions.project: './tsconfig.json'` + `tsconfigRootDir` | `parserOptions.projectService: true` | typescript-eslint 8 (2024) | No `tsconfigRootDir` plumbing; auto-discovers tsconfigs. |
| `husky install` + `.husky/_/husky.sh` shim | `npx husky init` + plain shell hook | Husky 9 (2024) | No shim; smaller surface; faster startup. |
| `rollupOptions.input` in vite.config | `rolldownOptions.input` | Vite 8 (early 2026) | Same shape, new key; old key warns. |
| Compass + Ruby SASS | dart-sass 1.99 (auto via Vite when `sass` installed) | dart-sass GA (2019); Compass EOL (2018) | Pure JS; no Ruby; faster compile. |
| Python 2 manifest generator | (n/a in P1) → P10 will replace with Node TS in `tools/build-book.ts` | Python 2 EOL (Jan 2020) | No interpreter conflict; types throughout. |
| AppCache (`<html manifest=...>`) | Standalone HTML inherently offline; no Service Worker in v1 (anti-feature) | AppCache removed Chrome 85 (2020) | Simpler model; no manifest poisoning risk. |
| `localStorage` direct use | `PersistenceStore` (P3) wrapping IndexedDB with `localStorage` fallback | P1 documents the invariant; P3 implements | Quota handling; schema versioning; cross-book namespace discipline. |
| jQuery 2.0.3 | Lit 3 Web Components | Lit 3 GA (2023) | ~5 KB; standards-based; no XSS via `htmlPrefilter`. |
| iScroll 4.1.9 | Pointer Events + native CSS scroll-snap | (P7 territory) | No `webkit*` shims; native gesture model. |

**Deprecated/outdated (P1 must NOT introduce these):**
- `husky add` CLI command — use `npx husky init` + edit file directly.
- `husky install` (in `prepare`) — use `husky` with no args (v9).
- `rollupOptions` in vite.config — use `rolldownOptions` (Vite 8).
- ESLint legacy `extends`/`overrides` outside flat config — flat config only.
- `parserOptions.project: './tsconfig.json'` — use `projectService: true`.
- `tslint` — long deprecated.
- `node-sass` / `gulp-sass` / Ruby `sass` — use dart-sass (`sass` npm package).
- `grunt-*` anything — Vite owns the build tier.
- `pnpm` (D-01 closes this) — npm only.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@types/node` ^22.0.0 is current | `package.json` skeleton | Wrong version pin; install error or type mismatch. **Mitigation:** planner verifies with `npm view @types/node version` before pinning. |
| A2 | `eslint-config-prettier` 10.x exists and is the appropriate companion to ESLint 10 + Prettier 3.8 | ESLint flat config example | Wrong version; lint config conflicts. **Mitigation:** planner verifies. (npm view returned 10.1.8 — likely correct, marked LOW-risk.) |
| A3 | Lit 3.3.2 with TypeScript 6 + `useDefineForClassFields: true` + `experimentalDecorators: false` "just works" with `@customElement` decorators (standard decorators path) | Code example for `readkit-app.ts` | Decorators don't compile; `@customElement` errors at type-check. **Mitigation:** the example is per official Lit 3 docs; if the decorator path breaks, fallback is `customElements.define('readkit-app', ReadkitApp)` in the constructor or a side-effect statement. |
| A4 | Vite 8's `rolldownOptions.input` accepts a record `{ main: 'index.html' }` for MPA, identical to the old `rollupOptions.input` API | Pattern 4 | Build fails with cryptic error. **Mitigation:** Vite 8 docs explicitly cite this in the migration guide; verified above. **Risk: LOW.** |
| A5 | The contributor profile is POSIX shells (macOS/Linux/WSL); no need for a `.bat` companion to `.husky/pre-commit` | Husky pattern | Windows-without-Git-Bash contributors can't commit. **Mitigation:** README states the supported development OS list. |
| A6 | `npm view <pkg> version` results captured 2026-04-26 are still valid 30 days out | Standard Stack table | Stale versions. **Mitigation:** the metadata block at the bottom of this doc says "Valid until 2026-05-26"; replan if exceeded. |
| A7 | The "test" placeholder script can be `"test": "echo 'tests land in Phase 2' && exit 0"` and no pre-commit / CI step expects `npm test` to do anything | D-13 | A later phase expects `npm test` to fail meaningfully; P1's exit-0 placeholder hides errors. **Mitigation:** D-13 is explicit; planner restates this in the README. |

**Note:** No claims about compliance / retention / security standards are tagged `[ASSUMED]` because Phase 1 doesn't touch those domains beyond ASVS V14 (which is well-established and cited in the Security Domain section below).

## Open Questions (RESOLVED)

1. **Should Phase 1 add `npm` workspaces / monorepo structure preemptively?**
   - What we know: D-04 says "single flat `src/` tree, no npm workspaces."
   - What's unclear: P10 will add `tools/build-book.ts` which is Node-side; P11 may want a separate `src/library/` entry. Whether `tools/` ever needs its own `package.json` is a P10 decision.
   - Recommendation: **Honour D-04** — single flat tree. Re-evaluate at P10 if `tools/build-book.ts` accumulates Node-only deps that pollute the browser dep tree.
   - RESOLVED: Honour D-04 — single flat `src/` tree; no npm workspaces in P1.

2. **Should the Phase 1 `<readkit-app>` shell render anything dynamic, or just static text?**
   - What we know: D-14 says "an empty `<readkit-app>` rendering 'readk.it — Phase 1 dev shell' on a sass-compiled page". The element name and `src/main.ts` are stable across phases.
   - What's unclear: How much of the SCSS-via-dart-sass pipeline should P1 prove? A single `:host` rule? A multi-file `@import` chain to verify imports work?
   - Recommendation: **Minimal** — one `src/styles/main.scss` with one `@use` of a tiny variable file (e.g. `_tokens.scss` defining a single colour token), to prove dart-sass partial-imports work. Phase 6 will explode this into the real chrome.
   - RESOLVED: Minimal SCSS — one `src/styles/main.scss` + one `_tokens.scss` partial via `@use` to prove dart-sass partial-imports work.

3. **Should ESLint flat config use both `recommendedTypeChecked` and `stylisticTypeChecked`, or just `strictTypeChecked`?**
   - What we know: D-20 says "typescript-eslint strict-type-checked".
   - What's unclear: D-20 doesn't say whether the *stylistic* type-checked preset is included.
   - Recommendation: **Just `strictTypeChecked`** for P1. `stylisticTypeChecked` adds rules that conflict with Prettier-handled style decisions; it's surplus. Re-evaluate at P12 (cross-browser hardening).
   - RESOLVED: Use `strictTypeChecked` only for P1; do NOT add `stylisticTypeChecked` (conflicts with Prettier).

4. **Should Phase 1 commit to a particular Vitest config approach now, or pure-deferral to Phase 2?**
   - What we know: D-13 says `scripts.test` is a placeholder; CONTEXT-D-22 reserves the test infrastructure for Phase 2.
   - What's unclear: Some teams prefer to scaffold an empty `vitest.config.ts` early so the file exists; P1 deliverables don't include it.
   - Recommendation: **Defer entirely** to P2. P1 ships no test config to keep scope tight.
   - RESOLVED: Defer Vitest entirely to Phase 2; P1 ships no test config.

5. **Is there a Phase 1 step that exercises the dev server end-to-end?**
   - What we know: Success criterion (D-14) is "`npm run dev` starts Vite's dev server".
   - What's unclear: How is success verified? Curl `http://localhost:5173/` and check 200? Manual visual check? P2 has Playwright; P1 doesn't.
   - Recommendation: **Manual smoke** — the task description says "run `npm run dev`, visit `http://localhost:5173/`, see 'readk.it — Phase 1 dev shell' rendered". The plan-checker agent can require a screenshot or a `curl -i` snapshot in the plan's verification step.
   - RESOLVED: Manual smoke for the dev server in P1 — `npm run dev`, visit `http://localhost:5173/`, see 'readk.it — Phase 1 dev shell' rendered (Playwright lands in P2).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All P1 deliverables | ✓ | v22.10.0 | — (matches `>=22.0.0` engines requirement) |
| npm | All P1 deliverables | ✓ | 10.9.0 | — (matches `>=10.0.0` engines requirement) |
| git | Repo + Husky hooks | ✓ | 2.39.5 (Apple Git-154) | — |
| POSIX shell | `.husky/pre-commit` | ✓ (macOS Bash 3.x, sufficient for the script) | — | If a contributor uses Windows without Git Bash, they need WSL (documented in README). |
| `npx husky init` | Bootstrap step | ✓ (npx is bundled with npm 10) | — | — |
| Internet access for `npm install` | Initial install | ✓ assumed | — | None — offline install requires a local registry mirror, out of scope. |

**Missing dependencies with no fallback:** None. **All Phase 1 prerequisites are present on the working machine.**

**Missing dependencies with fallback:** None.

**Confidence: HIGH** — verified by direct probe on 2026-04-26.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (Phase 1 ships no test framework — see Wave 0). Vitest 4.1.5 + Playwright 1.59.1 land in Phase 2. |
| Config file | None — `vitest.config.ts` and `playwright.config.ts` are Phase 2 deliverables. |
| Quick run command | `npm run typecheck && npm run lint` (Phase 1 surrogate for tests) |
| Full suite command | Same as above. `npm test` is the placeholder `echo 'tests land in Phase 2' && exit 0` (D-13). |

**Phase 1 has no Vitest/Playwright tests.** Validation is *configurational*: does the toolchain install cleanly, does the dev server start, does typecheck pass, does the pre-commit hook block a >1 MB file? These are validated by **manual smoke + targeted shell-based assertions**, not by a test framework.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUILD-01 | `npm install` succeeds on Node 22 LTS without Python/Ruby/globals | smoke (configurational) | `rm -rf node_modules && npm install --dry-run 2>&1 \| grep -i 'EBADENGINE\|error'` (exit non-zero on hit) | ✅ smoke script can be added to `package.json` as `verify:install` (planner's call) |
| BUILD-02 | Strict TS, no AMD in new tree | typecheck | `npm run typecheck` (must exit 0); `! grep -r 'define(\[' src/` (must produce zero hits) | ✅ typecheck via tsc; AMD check is a one-liner |
| BUILD-03 | Lit-only chrome; no jQuery/Lo-Dash/iScroll/Modernizr/Detectizr in deps | dep audit (manual) | `! grep -E '"jquery"\|"lodash"\|"iscroll"\|"modernizr"\|"detectizr"' package.json` | ✅ grep pattern |
| BUILD-08 | Single lockfile + gitignore + pre-commit >1 MB block | smoke (configurational) | `[ -f package-lock.json ] && [ ! -f pnpm-lock.yaml ] && [ ! -f yarn.lock ] && grep -q '^dist/$\|^dist\*/$' .gitignore` for the gitignore part. For the >1 MB block: `dd if=/dev/zero of=/tmp/big.bin bs=1M count=2 && cp /tmp/big.bin ./big.bin && git add big.bin && git commit -m "should fail" 2>&1 \| grep -i 'error\|reject'` then `git reset && rm big.bin` | ✅ both checks scriptable |
| BUILD-09 | `npm run dev` starts Vite with HMR | smoke (manual) | `npm run dev &` then `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/` should print `200`; HMR proven by editing `src/components/readkit-app.ts` and seeing the browser reload (manual) | ✅ curl check + manual HMR verification |

### Sampling Rate
- **Per task commit:** `npm run typecheck && npm run lint` (Phase 1's full quick-feedback loop)
- **Per wave merge:** Add the smoke checks from the table (install dry-run, dep audit, lockfile check, dev-server curl).
- **Phase gate:** Full set + manual >1 MB block test + manual HMR verification + visual confirmation of `<readkit-app>` rendering.

### Wave 0 Gaps

> Phase 1 has no test framework to install (test infra lands in P2). The "gaps" here are validation-shell-script gaps, not test-framework gaps.

- [ ] `package.json` `scripts.verify:install` — npm install dry-run + check for EBADENGINE warning. *(Optional; planner's call. If included, it's a one-liner.)*
- [ ] `package.json` `scripts.verify:no-legacy-deps` — grep `package.json` for the forbidden-dep list. *(Optional.)*
- [ ] A short `tasks/verify-precommit.sh` (or inline in PLAN.md task description) demonstrating the >1 MB block fires. *(Optional but recommended for the plan-checker agent to find an executable assertion.)*
- [ ] **Framework install:** None — Vitest/Playwright explicitly deferred to P2.

*If no gaps are converted into tasks: validation is "manual smoke + reviewer checklist" and the plan-checker agent must accept that. The user's CONTEXT (D-13) explicitly endorses this posture for P1.*

## Security Domain

> `security_enforcement: true` and `security_asvs_level: 1` per `.planning/config.json`. P1 is a build/tooling phase with no auth, no input handling, no DOM-rendered untrusted content — most ASVS categories don't apply directly. The applicable categories are V14 (Configuration / Build / Deploy) and V10 (Malicious Code / Supply Chain).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V1 Architecture | partial | The architectural quarantines (engine, sanitiser, persistence) are documented now via the D-05 READMEs; they're not yet enforced by tooling (P4/P5/P3). |
| V2 Authentication | no | No auth in this product; reader is local-only. |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | No access control; static content. |
| V5 Input Validation | no | No input handling in P1. EPUB sanitisation lands in P5. |
| V6 Cryptography | no | No crypto in v1; DRM/encrypted EPUBs are refused (ENGINE-04, P4). |
| V7 Error Handling | partial | The "fail loud" discipline is named in P1 only via the Lit shell's render() and the >1 MB block error message. Real error UI lands in P6. |
| V8 Data Protection | no | No PII; no remote data. |
| V9 Communications | no | No outbound network calls in P1. |
| V10 Malicious Code | yes | **`engine-strict` + locked versions + committed lockfile + Husky `prepare` script**. Defends against (a) unintended Node version, (b) drift from committed lockfile (which is the canonical "this is what we audited"), (c) a missing `prepare` script silently disabling local hygiene. |
| V11 Business Logic | no | None in P1. |
| V12 Files & Resources | partial | Pre-commit blocks files >1 MB. Does NOT scan content for secrets in P1 (TruffleHog/git-secrets etc. — defer to a future phase). |
| V13 API & Web Service | no | No API. |
| V14 Configuration / Build / Deploy | yes | **The headline category for P1.** |

### Known Threat Patterns for {npm + Node 22 + git workflow}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply-chain compromise via malicious npm package update | Tampering / EoP | Committed `package-lock.json` (every install resolves to the audited version tree); `npm install` verifies tarball integrity hashes from the lockfile. **Pin every direct dep to a specific minor (`^x.y.z`) and re-audit the lockfile on every dep bump.** Future phase may add `npm audit` to CI. |
| Accidental commit of `node_modules/` (legacy 700 MB regression) | Repudiation / DoS-by-bloat | `.gitignore` includes `node_modules/`; pre-commit `>1 MB` block catches stray inclusions. `[CITED: .planning/codebase/CONCERNS.md]` |
| Accidental commit of secrets in `.env` files | Information Disclosure | `.gitignore` includes `.env*`. P1 does not introduce secrets. No CI exists yet to scan; defer secret-scanner (truffleHog) to v1.x. **Risk acknowledged.** |
| Hostile `prepare` / `postinstall` script in a transitive dep | Tampering / EoP | Locked deps (top of stack). Mitigation surface is the lockfile + minimal direct deps (~12). `npm audit` (manual) before each lockfile change. |
| Wrong Node/npm version creates inconsistent install | DoS (developer time) | `engines` + `engine-strict=true`. **Both layers required (D-02).** |
| Pre-commit hook silently disabled (`HUSKY=0` env var) | Repudiation | Husky 9 honours `HUSKY=0`. README states "do not disable Husky except for diagnostics." This is unenforceable from inside the repo; the social contract is the only defence. *Acceptable risk for P1.* |
| Forked GitHub-pinned dependencies (legacy regression) | Tampering | **Zero `git+https://` deps in new `package.json`.** All deps from the official npm registry, lockfile-locked. Defended by the dep audit in BUILD-03 verification. `[CITED: .planning/codebase/CONCERNS.md "Forked Grunt Plugin Dependencies"]` |

**Out of scope for P1:**
- CSP (P5/P12)
- Secret scanning in CI (v1.x)
- Dependabot/Renovate (v1.x per Claude's Discretion)
- SRI on bundled assets (P10/P12)
- ASVS automated audit (planner's call; not specified)

**Block-on-high posture:** `security_block_on: high`. P1 introduces no high-severity controls beyond the lockfile-and-engines layer. No blocks expected.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-foundation-and-repo-hygiene/01-CONTEXT.md` — 29 user decisions; **the authoritative input for this phase**.
- `.planning/PROJECT.md` (post-revision 2026-04-26) — locked stack and constraints.
- `.planning/REQUIREMENTS.md` — REQ definitions for BUILD-01 / BUILD-02 / BUILD-03 / BUILD-08 / BUILD-09 (note: REQ wording predates D-25/D-26 corrections).
- `.planning/ROADMAP.md` §"Phase 1: Foundation & Repo Hygiene" — phase goal and dependencies (note: D-25 corrections owed to this doc by P1 itself).
- `.planning/research/SUMMARY.md` — version evidence + "Implications for Roadmap → Phase 1: Foundation" subsection.
- `.planning/codebase/CONCERNS.md` — historical evidence of the 700 MB-`dist/` regression that this phase defends against.
- `.planning/codebase/STACK.md` — what we're migrating *from*.
- npm registry — `npm view <pkg> version` results 2026-04-26: typescript 6.0.3, vite 8.0.10, lit 3.3.2, sass 1.99.0, vitest 4.1.5, @vitest/browser 4.1.5, @vitest/browser-playwright 4.1.5, @playwright/test 1.59.1, eslint 10.2.1, typescript-eslint 8.59.0, eslint-plugin-lit 2.2.1, prettier 3.8.3, husky 9.1.7, lint-staged 16.4.0, fflate 0.8.2, fast-xml-parser 5.7.2, dompurify 3.4.1, tsx 4.21.0, globals 17.5.0, eslint-config-prettier 10.1.8, vite-plugin-singlefile 2.3.3, fake-indexeddb 6.2.5, jsdom 29.0.2, @vitest/coverage-v8 4.1.5.
- typicode.github.io/husky/get-started.html — Husky 9 install + hook flow.
- typescript-eslint.io/getting-started/typed-linting — flat config + `projectService: true`.
- vite.dev/guide/migration.html — Vite 8 changes (Rolldown, `rolldownOptions`, browser targets).
- vite.dev/guide/build.html — MPA pattern.
- lit.dev/docs/v3/components/styles — Lit 3 static styles + tagged templates.
- github.com/lint-staged/lint-staged — config schema.

### Secondary (MEDIUM confidence)
- Local environment probe via `node --version`, `npm --version`, `git --version` on 2026-04-26.
- Inferred ASVS V14 / V10 applicability — based on standard ASVS L1 mapping; not directly cited from the OWASP doc (which redirected to a download page).

### Tertiary (LOW confidence)
- The Husky-9 hook script for the >1 MB block is a synthesis of common patterns (POSIX shell + `wc -c` per file), not a citation from a single source. Hardening against filename-with-spaces is documented in Pitfall 6 as an open issue for the planner.

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — every version verified against npm registry on 2026-04-26.
- Architecture: **HIGH** — patterns (Husky 9, ESLint 10 flat, Vite 8 rolldownOptions, Lit 3 styles, typescript-eslint 8 projectService) all from official current docs.
- Pitfalls: **HIGH** for the ten listed; the team's history (CONCERNS.md) provides direct evidence for Pitfall 10.
- Security: **MEDIUM-HIGH** — ASVS L1 mapping is well-understood for build/tooling phases; secret scanning explicitly deferred is the only category-omission.
- Validation architecture: **HIGH** — the validation surface is small and well-bounded by D-13.

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (30 days; stable infrastructure phase). Revalidate version pins if planning is deferred past this date.

---
*Phase: 01-foundation-and-repo-hygiene*
*Researched: 2026-04-26*
