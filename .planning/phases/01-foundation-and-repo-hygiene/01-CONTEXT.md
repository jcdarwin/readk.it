# Phase 1: Foundation & Repo Hygiene - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 ships the reproducible Node-LTS-22 + TypeScript + Vite + Lit skeleton for the new tree, the hygiene gates that prevent the legacy 700 MB-`dist/` regression, and a runnable dev server that serves a placeholder Lit shell. Phase 1 also performs the **destructive cleanup** of the legacy 2013-era tree (after a recoverable git tag) and the **scope corrections** to ROADMAP.md / REQUIREMENTS.md / CLAUDE.md / PROJECT.md that this discussion produced.

A contributor cloning the repo on Node LTS 22 must be able to: `npm install` (no Python, no Ruby, no global binaries beyond Node + npm), `npm run dev` (Vite dev server with HMR serves the empty `<readkit-app>` Lit shell), `npm run typecheck` (strict TS passes), and stage a >1 MB file (pre-commit rejects it).

Phase 1 explicitly does NOT ship: a working test harness (Phase 2), the `EpubProcessor` (Phase 4), the sanitiser (Phase 5), the real reader chrome (Phase 6), the drag-drop entry (Phase 9), the build script (Phase 10), the library index (Phase 11), the GitHub Actions workflow file (Phase 2), or the gh-pages deploy pipeline (new Phase 13 added by this discussion).

</domain>

<decisions>
## Implementation Decisions

### Package Manager & Toolchain

- **D-01:** Package manager is **npm 10**, lockfile `package-lock.json`. The ROADMAP.md success criteria written as `pnpm install` / `pnpm dev` are read as `npm install` / `npm run dev` for the rest of the project. The "or pnpm" alternative in PROJECT.md / CLAUDE.md is closed.
- **D-02:** `package.json` carries an `engines` field requiring Node >=22 LTS and npm >=10, paired with `engine-strict=true` in `.npmrc`, so `npm install` errors out on the wrong Node/npm version with a clear message.
- **D-03:** `.nvmrc` set to `22` (overwrites the legacy `0.11.16`). No Corepack.

### Repo Structure

- **D-04:** Single flat `src/` tree (no npm workspaces). One `package.json` at root.
- **D-05:** Phase 1 stands up the full target directory skeleton with `.gitkeep` + a README in each, naming the invariant for that directory:
  - `src/engine/` — README: "fflate + fast-xml-parser + DOMPurify quarantined here. No other module may import them."
  - `src/components/` — README: "Lit Web Components. Shadow DOM. No `unsafeHTML()` on EPUB-supplied content."
  - `src/controllers/` — README: "Reactive controllers (PreferencesController, BookmarkController, LocationController, RouterController, DropzoneController). DOM-free, 100% Vitest-testable."
  - `src/stores/` — README: "PersistenceStore is the only writer to IndexedDB / localStorage. No component touches storage directly."
  - `tools/` — README: "Node-side TypeScript tools. Build script lands here in Phase 10."
  - `tests/fixtures/` — README: "EPUB fixtures land in Phase 2."

### Legacy Tree Cleanup (Phase 1 destructive task)

- **D-06:** Phase 1 deletes from the working tree (after tagging the pre-deletion commit as `legacy-snapshot-2013` for git-recoverability):
  - `readk.it/` (entire legacy source tree)
  - `Gruntfile.js`
  - legacy root `package.json` (replaced by the new one)
  - `dist/`, `dist.0.11.16/`, `dist.gianleap/`
  - `readkit.epub/manifest.maker.py`, `readkit.epub/manifest.json`, `readkit.epub/manifest.json.mobydick.json`
  - legacy `node_modules/`
  - legacy `README.md` (replaced by the new one)
- **D-07:** Phase 1 keeps on disk but adds to `.gitignore`: `readkit.epub/`, `readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/` (and contents). Also gitignored: `*.epub`. **Rationale:** the user wants to swap EPUBs freely without versioning them. Phase 10 (build script) and Phase 13 (gh-pages publishing) read from these directories at build time but never rely on their contents being version-controlled.
- **D-08:** This supersedes CLAUDE.md's current "leave legacy tree alive until Phase 12 parity" language. Phase 1 must update CLAUDE.md to remove that section and describe the new state.

### Hygiene Gates

- **D-09:** Pre-commit blocks files >1 MB. **Working-tree size cap is dropped from Phase 1 scope.** ROADMAP.md Phase 1 success criterion 5 must be rewritten to remove the "CI fails the build if the working tree exceeds an agreed cap" half — only the lockfile half remains.
- **D-10:** Husky 9 pre-commit hook does: (1) the >1 MB block, (2) lint-staged running ESLint + Prettier on changed files only.
- **D-11:** No pre-push hook. Typecheck and full test runs live in CI (Phase 2's workflow).

### GitHub Actions

- **D-12:** **No `.github/workflows/` files in Phase 1.** The `ci.yml` workflow (typecheck + lint + Vitest unit + Playwright E2E) is a Phase 2 deliverable. The `deploy.yml` workflow (gh-pages publish) is a Phase 13 deliverable.
- **D-13:** `package.json` `scripts.test` in Phase 1 is a placeholder: `"test": "echo 'tests land in Phase 2' && exit 0"`. `scripts.typecheck` and `scripts.lint` and `scripts.format` are real and runnable in Phase 1.

### Dev-Server Entry

- **D-14:** `npm run dev` serves an empty `<readkit-app>` Lit Web Component rendering "readk.it — Phase 1 dev shell" on a sass-compiled page. The element name (`readkit-app`) and entry file (`src/main.ts`) and `index.html` are stable across phases — Phase 6 (Reader Chrome Shell) replaces the body of `<readkit-app>` with the real chrome composition rather than re-bootstrapping.
- **D-15:** `vite.config.ts` sets `base: './'` from day one. **Forward implication:** the build outputs (Phase 10 per-book HTML, Phase 11 library index) must work under any deployment subpath, including the apex domain `readk.it/` from Phase 13's gh-pages publishing.

### TypeScript & Build Configs

- **D-16:** Split tsconfig: `tsconfig.json` (browser, strict, ES2022, `moduleResolution: bundler`, used by Vite + the `src/` tree) extends `tsconfig.base.json` (shared compilerOptions). `tsconfig.node.json` (used by `vite.config.ts`, `eslint.config.js`, and future `tools/*.ts`).
- **D-17:** `.browserslistrc` as a separate file with the locked nine-line target set: `last 2 versions` of Chrome / Edge / Firefox / Safari / iOS Safari / Chrome Android / Firefox Android, `not dead`, `not op_mini all`.
- **D-18:** `.editorconfig` ships in Phase 1: utf-8, LF line endings, 2-space indent, trim trailing whitespace, insert final newline.

### Linting & Formatting

- **D-19:** Prettier config: 2-space indent, single quotes, trailing commas, semicolons, 100-col print width.
- **D-20:** ESLint flat config (`eslint.config.js`): `eslint:recommended` + `typescript-eslint` strict-type-checked + `eslint-plugin-lit`. Type-aware lint runs in CI from Phase 2 onward; runs on staged files locally via lint-staged.

### CSP

- **D-21:** **No CSP meta tag in Phase 1's dev shell.** Deferred to Phase 5, where chapter HTML first meets the DOM and CSP report-only first becomes meaningful. Phase 5 planner: introduce CSP report-only on the dev server when the sanitisation gate lands; Phase 12 enforces strict CSP on every output.

### Engine Quarantine Enforcement

- **D-22:** Phase 1 ships only the engine-quarantine **invariant documentation** (in `src/engine/README.md` per D-05). The ESLint `no-restricted-imports` rule that enforces "no module outside `src/engine/epub-processor.ts` may import `fflate` or `fast-xml-parser`" lands in Phase 4 when the engine itself lands. Same for the "no `unsafeHTML()` on EPUB content" rule — lands in Phase 5 with the sanitiser.

### License & README

- **D-23:** License: MIT. `LICENSE` file at repo root. Copyright line: `Copyright (c) 2026 meBooks Ltd`.
- **D-24:** New `README.md` at repo root (full version): purpose (1 paragraph from PROJECT.md core value), supported browsers, prerequisites (Node 22 LTS + npm 10), install (`npm install`), dev loop (`npm run dev` / `npm run typecheck` / `npm run lint` / `npm run format`), repo layout (one-liner per `src/` subdir), forward references to phases 9 (drag-drop) / 10 (build script) / 11 (library index) / 13 (gh-pages deploy), GSD workflow note pointing at `.planning/`, CLAUDE.md link for AI assistants, license. No separate `CONTRIBUTING.md`.

### Cross-Phase Documentation Updates Required In Phase 1

These are mandatory edits the Phase 1 planner must include as tasks. They are corrections to upstream planning artefacts that this discussion produced.

- **D-25:** Update **ROADMAP.md** in Phase 1:
  - Phase 1 success criterion 5: rewrite to drop "CI fails the build if the working tree (excluding `.git`) exceeds an agreed cap" — keep "one committed lockfile (`package-lock.json`) makes the install reproducible".
  - Phase 1 success criterion 1: change `pnpm install` → `npm install`.
  - Phase 1 success criterion 2: change `pnpm dev` → `npm run dev`.
  - Phase 1 success criterion 3: change `pnpm typecheck` → `npm run typecheck`.
  - Phase 1 plan estimate (currently 6) and Notes section: revise to reflect the dropped size-cap CI gate and the added legacy-cleanup + cross-doc-update tasks.
  - Phase 12 success criterion 4 (memory-budget Playwright test): **delete entirely.**
  - Phase 12 success criterion numbering: re-number remaining criteria.
  - Phase 12 Requirements: drop `TEST-05`.
  - Add **Phase 13: Deploy to GitHub Pages** with goal, depends-on, requirements (`DEPLOY-01`, `DEPLOY-02`), success criteria, plan estimate (~3), and notes.
  - Update Progress table at end of ROADMAP.md to add Phase 13.
- **D-26:** Update **REQUIREMENTS.md** in Phase 1:
  - All `pnpm install` / `pnpm build` references → `npm install` / `npm run build`.
  - Drop `TEST-05` from v1 Requirements (memory-budget test). Move to v2 Requirements as `TEST-V2-01` if it should be remembered, or delete outright.
  - Add new section **Deploy** with at least:
    - `DEPLOY-01`: `npm run build` (or a dedicated `npm run build:pages`) produces a publishable `dist/` tree containing `index.html` (library), `books/<id>.html` per book, `404.html`, optional `500.html`, `CNAME` = `readk.it`, `.nojekyll`, suitable for GitHub Pages publication via `actions/deploy-pages`.
    - `DEPLOY-02`: A `.github/workflows/deploy.yml` published from a curated EPUB content source (separate branch or sister repo, not `readkit.epub*/` working dirs which are gitignored) builds and deploys to the `gh-pages` branch on push to `main`.
  - Update Traceability table: drop TEST-05 row, add DEPLOY-01 → Phase 13, DEPLOY-02 → Phase 13.
  - Update coverage counts (currently `38 total / 38 mapped`) — net change: −1 (TEST-05) +2 (DEPLOY-01, DEPLOY-02) = 39 total.
- **D-27:** Update **CLAUDE.md** in Phase 1:
  - "Legacy tree" section: replace the current "left in place during the rewrite for reference; do not modify it" language with a one-line note that the legacy tree was deleted in Phase 1 (tag `legacy-snapshot-2013` recovers it).
  - Stack section: change "pnpm 9 or npm 10" → "npm 10".
  - Add a one-line forward reference to Phase 13 / gh-pages publishing under "Workflow" or a new "Deploy" section.
- **D-28:** Update **PROJECT.md** in Phase 1:
  - Constraints: change "One `npm install` (or `pnpm install`)" → "One `npm install`".
  - Context bullet about `dist/` snapshots: add a note that the legacy tree was removed in Phase 1 (recoverable via `legacy-snapshot-2013` tag).
  - Add to Active: "Publish library + per-book HTMLs to GitHub Pages at `readk.it` (Phase 13)."
  - Add to Out of Scope clarification (or note in Constraints): "Service Worker / PWA on the library index — standalone HTMLs are inherently offline; gh-pages serves static files only" — this sharpens the existing out-of-scope line.
  - Add to Key Decisions table: "Drop memory-budget Playwright test (TEST-05)" with rationale "out of v1 scope per discussion 2026-04-26", and "Add Phase 13: gh-pages deploy" with rationale "v1 ship target is `readk.it` apex domain via GitHub Pages".
- **D-29:** Update **STATE.md** in Phase 1 (covered automatically by the discuss-phase / plan-phase flow, but flagged here for completeness): the deferred-ideas table should not need new rows from this discussion — everything was either folded into the phase plan or moved to a new phase.

### Claude's Discretion

The following were deferred to Claude (or to the planner's standard practice) without the user weighing in:

- **CI scope for Phase 1**: moot now that GHA is fully deferred to Phase 2.
- **Dependency-update automation (Dependabot / Renovate)**: defer to v1.x. Not in any current phase.
- **CONTRIBUTING.md**: skip — full README covers contributor guidance for v1.
- **CSP report-only on dev server in Phase 1**: skip — defer to Phase 5 per D-21.
- **Engine quarantine ESLint rule wording / enforcement mechanism**: planner picks `no-restricted-imports` vs a custom rule when the rule lands in Phase 4. Phase 1 only writes the invariant into `src/engine/README.md`.
- **Exact `.gitignore` line ordering / grouping**: planner's call.
- **Vite plugin selection beyond what's locked (e.g. `vite-plugin-singlefile` is Phase 10 territory)**: not Phase 1's concern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project model and requirements
- `.planning/PROJECT.md` — Authoritative project model (validated requirements, active v1 hypotheses, out-of-scope register, locked stack, key decisions). **Note:** PROJECT.md will be updated in Phase 1 per D-28; the planner reads the pre-update version and then includes the update as a task.
- `.planning/REQUIREMENTS.md` — 38 v1 REQ-IDs and the traceability table. Phase 1 covers `BUILD-01`, `BUILD-02`, `BUILD-03`, `BUILD-08`, `BUILD-09`. **Note:** REQUIREMENTS.md will be updated in Phase 1 per D-26; the new total becomes 39 (TEST-05 dropped, DEPLOY-01/02 added).
- `.planning/ROADMAP.md` §"Phase 1: Foundation & Repo Hygiene" — goal, depends-on (none), requirements, success criteria, notes. **Note:** ROADMAP.md will be updated in Phase 1 per D-25.
- `.planning/STATE.md` — current position (Phase 1 of 12, plan 0 of TBD); accumulated decisions; deferred items; session continuity.

### Cross-phase invariants
- `CLAUDE.md` (repo root) — entry point for any LLM picking up work. "Locked stack", "Hard rules", "Workflow", "Cross-LLM execution" sections constrain every later phase. **Note:** CLAUDE.md will be updated in Phase 1 per D-27.
- `~/workspace/CLAUDE.md` (global) — global notes; not directly relevant to Phase 1 (Docker/Browsershot/UX patterns) but downstream phases that touch UX should reference it.

### Codebase analysis (legacy reference, will be deleted in Phase 1)
- `.planning/codebase/STACK.md` — what the legacy 2013-era stack was. Useful as a "do not regress to" reference. After Phase 1, `readk.it/` is gone but the analysis stays for context.
- `.planning/codebase/CONCERNS.md` — the trap families this team has fallen into. The repo-hygiene concern (committed `dist/`, vendored libs, GitHub-pinned forked plugins, non-reproducible install) is the **primary defensive driver of Phase 1**.
- `.planning/codebase/CONVENTIONS.md` — legacy coding conventions. New tree decides its own (per D-19, D-20). The `lit-html` "no `unsafeHTML()`" invariant lands here as it grows in later phases.
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `INTEGRATIONS.md`, `TESTING.md` — legacy reference; not load-bearing for Phase 1 itself.

### Research (locked stack, validated 2026-04-26)
- `.planning/research/SUMMARY.md` — reconciled research summary. **Read this rather than the four constituent files** unless the constituent depth is specifically needed. Confirms: TS 6.0.3, Vite 8.0.10 (MPA), Lit 3.3.2, dart-sass 1.99.0, Vitest 4.1.5 + `@vitest/browser-playwright`, Playwright 1.59.1, fflate 0.8.2, fast-xml-parser 5.7.2, vite-plugin-singlefile 2.3.3, Node LTS 22, npm 10 (per D-01), ESLint 10 flat config, typescript-eslint 8, Prettier 3.8, Husky 9, lint-staged 16. **The "Phase 1: Foundation" subsection of `Implications for Roadmap` is direct guidance for this phase.**
- `.planning/research/STACK.md` — version evidence per package against the npm registry. Reference if the planner needs to justify a specific version pin.
- `.planning/research/PITFALLS.md` — Pitfall 9 (repo hygiene regression) is the primary defence Phase 1 owes; Pitfalls 4 (two-output drift) and 8 (cross-LLM execution traps) are forward-looking and shape Phase 1's docs/skeleton choices.

### Deploy reference (for Phase 13, captured here so Phase 13 inherits it)
- `~/workspace/readk.it_pages/` — legacy gh-pages reference structure. Notable: `CNAME` = `readk.it`, `.nojekyll`, `dist/readkit.library/index.html`, `dist/readkit.solo/<book>.html`, `404.html`, `500.html`. Phase 13 modernises this structure (now `dist/library/index.html` + `dist/books/<id>.html`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

There is **no reusable code** from the legacy tree for the new TS/Vite/Lit project. The legacy tree (jQuery 2.0.3 / RequireJS 2.1.8 / iScroll 4.1.9 / Modernizr 2.6.2 / Lo-Dash 1.3.1 / Compass / Python 2 / Node 0.11.16) is being deleted in Phase 1 itself per D-06.

### Established Patterns

**Greenfield phase.** No patterns exist in the new tree yet; Phase 1 *establishes* the patterns that every later phase will follow:

- Flat `src/` tree with subdirs by concern (engine / components / controllers / stores) — D-04, D-05.
- Quarantine-by-convention enforced by READMEs in Phase 1, by ESLint rules from Phase 4 onward — D-22.
- All persistence through `PersistenceStore` (Phase 3) — invariant captured in `src/stores/README.md` per D-05.
- All chapter HTML through `sanitise()` (Phase 5) — invariant captured in `src/components/README.md` per D-05.
- Single isomorphic `EpubProcessor` (Phase 4) — invariant captured in `src/engine/README.md` per D-05.

### Integration Points

Phase 1 is the foundation. The integration points that **later** phases plug into are:

- `index.html` + `src/main.ts` + `<readkit-app>` (Phase 1) → Phase 6 replaces the body of `<readkit-app>` with the real chrome.
- `vite.config.ts` (Phase 1, dev-mode only) → Phase 10 adds `book` build mode + `vite-plugin-singlefile`.
- `tsconfig.node.json` (Phase 1) → Phase 10 uses it for `tools/build-book.ts`.
- `package.json` `scripts.test` placeholder (Phase 1) → Phase 2 replaces with the real Vitest invocation.
- `.gitignore` (Phase 1) → Phase 2 may add test-output dirs; otherwise stable.
- `package.json` `scripts` (Phase 1) → every later phase appends as needed.
- No `.github/workflows/` (Phase 1) → Phase 2 creates `ci.yml`; Phase 13 creates `deploy.yml`.

### Files Phase 1 Must Touch (current state → target state)

- `.nvmrc`: `0.11.16` → `22`
- `package.json`: legacy Grunt-era → new (TS deps, scripts, engines, packageManager-equivalent via npm engines)
- `README.md`: legacy → new (per D-24)
- `CLAUDE.md`: stays but updated per D-27 (legacy-tree language + npm-only)
- `.planning/PROJECT.md`: updated per D-28
- `.planning/REQUIREMENTS.md`: updated per D-26
- `.planning/ROADMAP.md`: updated per D-25
- `readk.it/`, `Gruntfile.js`, `dist/`, `dist.0.11.16/`, `dist.gianleap/`, legacy `node_modules/`, `readkit.epub/manifest.maker.py`, `readkit.epub/manifest.json*`: deleted per D-06
- `.gitignore`: created (covers `dist*/`, `node_modules/`, `.cache/`, `*.epub`, `readkit.epub/`, `readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/`)
- `.npmrc`: created (`engine-strict=true`)
- `.editorconfig`: created (per D-18)
- `.browserslistrc`: created (per D-17)
- `tsconfig.base.json`, `tsconfig.json`, `tsconfig.node.json`: created (per D-16)
- `vite.config.ts`: created (per D-15)
- `eslint.config.js`, `.prettierrc.json`, `.prettierignore`: created (per D-19, D-20)
- `package.json` Husky 9 install hook + `.husky/pre-commit`: created (per D-10)
- `lint-staged` config (in package.json or `.lintstagedrc.json`): created (per D-10)
- `LICENSE`: created (MIT, `Copyright (c) 2026 meBooks Ltd`, per D-23)
- `index.html`, `src/main.ts`, `src/components/readkit-app.ts`, `src/styles/main.scss` (or equivalent): created — minimal Lit shell per D-14
- `src/engine/README.md`, `src/components/README.md`, `src/controllers/README.md`, `src/stores/README.md`, `src/engine/.gitkeep`, etc.: created per D-05
- `tools/.gitkeep`, `tools/README.md`: created per D-05
- `tests/fixtures/.gitkeep`, `tests/fixtures/README.md`: created per D-05

</code_context>

<specifics>
## Specific Ideas

### Concrete references the user supplied

- **gh-pages deploy reference:** `~/workspace/readk.it_pages/` — legacy production deploy. Notable elements: `CNAME` = `readk.it` (apex domain, not subdomain), `.nojekyll`, custom `404.html` / `500.html`, output structure `dist/readkit.library/` + `dist/readkit.solo/<book>.html`. The new equivalent (delivered in Phase 13) is `dist/library/index.html` + `dist/books/<id>.html` + `CNAME` + `.nojekyll` + branded error pages (per D-25's Phase 13 addition).
- **EPUB content directories the user wants kept on disk but unversioned:** `readkit.epub/`, `readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/`. The user explicitly does not want EPUBs versioned because they "may want to change the epubs we use from time to time" (per discussion 2026-04-26). Phase 10 (build script) and Phase 13 (deploy) read from these dirs locally; the curated public subset for gh-pages comes from a separate source per D-26's `DEPLOY-02`.
- **Public repo at `git@github.com:jcdarwin/readk.it.git`:** confirmed in this discussion. License (MIT per D-23) and full README (per D-24) reflect that the repo is intended to be public-friendly.

### "I want it like X" decisions

- The `<readkit-app>` element name was chosen for stability across phases — Phase 6's chrome shell replaces its body rather than introducing a new top-level element. This is intentional; later phases should not rename it.
- npm 10 was chosen over pnpm 9 even though Phase 1 success criteria were originally written for pnpm. The cost of rewriting the criteria is small; the cost of two competing canonical PMs is large.

</specifics>

<deferred>
## Deferred Ideas

### Moved to a new phase
- **Phase 13: Deploy to GitHub Pages** — added by this discussion. New requirements `DEPLOY-01`, `DEPLOY-02`. Will be added to ROADMAP.md and REQUIREMENTS.md as part of Phase 1's cross-doc-update tasks (per D-25, D-26). Phase 13 plan-phase will pick up the `~/workspace/readk.it_pages/` reference and the curated-EPUB-content-source decision.
- **Custom branded `404.html` / `500.html` error pages** — Phase 13 deliverable.

### Dropped from v1 entirely
- **TEST-05 (memory-budget Playwright test)** — user judged not needed for v1. Phase 12 success criterion 4 dropped per D-25. Memory discipline is still asserted at the engine level (D-22's quarantine + Phase 4's `URL.revokeObjectURL` discipline + Phase 9's smoke flow); the *automated bound* is what's dropped, not the underlying invariant.
- **CI working-tree size cap** — user judged not needed. The pre-commit >1 MB block remains as the local defence. Phase 1's success criterion 5 rewritten per D-25.

### Deferred to v1.x or later phases
- **Dependency-update automation (Dependabot / Renovate)** — defer to v1.x. Public repo + locked-version stack means security patches matter; not Phase 1 work.
- **CSP enforcement on dev server** — Phase 5 introduces report-only; Phase 12 enforces strict.
- **Engine quarantine ESLint rule** — lands in Phase 4 with the engine itself (per D-22).
- **`unsafeHTML()` ESLint guard** — lands in Phase 5 with the sanitiser.
- **`vitest.config.ts` + `npm test` as a real command** — Phase 2.
- **`.github/workflows/ci.yml`** — Phase 2.
- **`.github/workflows/deploy.yml`** — Phase 13.
- **`vite-plugin-singlefile` and `book` build mode** — Phase 10.

### Discussed but not surfaced as gray areas
- **Service Worker / PWA on the library index** — already explicitly out of scope per PROJECT.md "Out of Scope". Confirmed in this discussion: gh-pages serves static files only.

</deferred>

---

*Phase: 01-foundation-and-repo-hygiene*
*Context gathered: 2026-04-26*
