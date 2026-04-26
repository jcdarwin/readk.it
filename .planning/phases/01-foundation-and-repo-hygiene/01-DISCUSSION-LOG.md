# Phase 1: Foundation & Repo Hygiene - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 01-foundation-and-repo-hygiene
**Areas discussed:** Package manager, Repo structure, Legacy tree, Pre-commit hook scope, Dev-server entry shape, Prettier + ESLint, License, README, GitHub Actions, .editorconfig, CSP in dev shell, Browserslist + tsconfig, Phase 13 error pages, Vitest placeholder

---

## Package Manager

### Q1 — pnpm 9 vs npm 10?

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm 9 | Phase 1 success criteria already use `pnpm install`/`pnpm dev`. True workspaces, faster installs, content-addressable store, stricter dep resolution. | |
| npm 10 | Ships with Node 22; one less install step. Workspaces less ergonomic. Lockfile `package-lock.json`. | ✓ |

**User's choice:** npm 10
**Notes:** ROADMAP.md success criteria need updating from `pnpm install`/`pnpm dev` etc. to `npm install`/`npm run dev`.

### Q2 — Toolchain pinning strictness?

| Option | Description | Selected |
|--------|-------------|----------|
| `engines` + Corepack | Strongest reproducibility; `packageManager` field activates Corepack. | |
| `engines` only, no Corepack | `engine-strict=true` in `.npmrc` errors on wrong version. `.nvmrc` = `22`. | ✓ |
| `.nvmrc` only | Just `.nvmrc` = `22`. Trust contributors to read README. | |

**User's choice:** `engines` only, no Corepack
**Notes:** None.

---

## Repo Structure

### Q1 — Flat `src/` vs npm workspaces?

| Option | Description | Selected |
|--------|-------------|----------|
| Flat `src/` | One package.json, subdirs `src/engine/`, `src/reader/`, etc. Engine quarantine via ESLint, not packages. | ✓ |
| npm workspaces | `packages/engine`, `packages/reader`, `packages/build`. Hard package boundaries. More setup. | |

**User's choice:** Flat `src/`
**Notes:** None.

### Q2 — Stand up full skeleton in Phase 1, or only what BUILD-09 needs?

| Option | Description | Selected |
|--------|-------------|----------|
| Stand up the skeleton now | Empty `src/engine/`, `src/components/`, `src/controllers/`, `src/stores/`, `tools/`, `tests/fixtures/` with .gitkeep + README per dir. | ✓ |
| Only what BUILD-09 needs | Just `src/main.ts` + `index.html`. Each later phase introduces its own dir. | |

**User's choice:** Stand up the skeleton now
**Notes:** Each README names the invariant for that directory (engine README: 'fflate + fast-xml-parser only here').

---

## Legacy Tree Disposition

### Q1 — How to handle the legacy `readk.it/` tree, `Gruntfile.js`, `dist*/`, `readkit.epub*/`?

| Option | Description | Selected |
|--------|-------------|----------|
| Keep at root + ignore via globs | Vite/Vitest/Playwright globs exclude legacy paths. | |
| Move legacy under `legacy/` subdir | Big rename. | |
| git rm legacy now, rely on `legacy-snapshot` tag | Repo gets clean immediately. Contradicts CLAUDE.md "stays alive until Phase 12". | |
| (User free-text) | Remove legacy files; keep EPUB content dirs (gitignored). | ✓ |

**User's choice:** Free-text — "You can remove any legacy files in ~/workspace/readk.it/, except for the (currently unversioned) files in readkit.epub, readkit.epub.giantleap, readkit.epub.giantleap, which are the epub files we want to use with the migrated app. We don't want to version epub files, as we may want to change the epubs we use from time to time"
**Notes:** This supersedes CLAUDE.md's "leave legacy tree alive until Phase 12 parity" language. CLAUDE.md must be updated as part of Phase 1.

### Q2 — Confirm exact deletion boundary?

| Option | Description | Selected |
|--------|-------------|----------|
| Delete legacy code + build outputs; keep EPUB dirs gitignored | Comprehensive list. Snapshot tag pre-deletion. Update planning docs. | ✓ |
| Same but keep `manifest.maker.py` and legacy `README.md` | Slight residual debt. | |

**User's choice:** Delete legacy code + build outputs; keep EPUB dirs gitignored.
**Notes:** Tag pre-deletion commit as `legacy-snapshot-2013` for git-recoverability.

### Q3 — Working-tree size cap value?

| Option | Description | Selected |
|--------|-------------|----------|
| 50 MB | Generous ceiling; same as Phase 10 per-book HTML cap. | ✓ (later dropped) |
| 10 MB | Tighter; catches small slip-ups. | |
| 100 MB | Loose; mostly a guard against the 700 MB regression. | |

**User's choice:** 50 MB — but later overridden in the GHA discussion: the user judged the size-cap regression defence not needed. **Final state: no size cap, no CI gate enforcing tree size.** Captured in D-09.

---

## Pre-commit Hook Scope

### Q1 — What runs on every pre-commit?

| Option | Description | Selected |
|--------|-------------|----------|
| Size block + lint-staged | 1 MB block + ESLint/Prettier on changed files. | ✓ |
| Size block + lint-staged + typecheck | Adds `tsc --noEmit`; 5–20s per commit. | |
| Size block only | Lint and typecheck only in CI. | |

**User's choice:** Size block + lint-staged.

### Q2 — Add a pre-push hook for typecheck?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-push runs typecheck | Catches type errors before CI burns minutes. | |
| No pre-push, CI handles it | Push always succeeds locally; CI is source of truth. | ✓ |

**User's choice:** No pre-push, CI handles it.

---

## Dev-Server Entry Shape

### Q1 — What does `npm run dev` serve in Phase 1?

(Reformulated after user clarified that the actual drag-drop UI lands in Phase 9.)

| Option | Description | Selected |
|--------|-------------|----------|
| Empty `<readkit-app>` Lit shell | Renders 'readk.it — Phase 1 dev shell'. Proves TS strict + Vite + HMR + Lit + dart-sass. Phase 6 replaces the body. | ✓ |
| Minimal `<script type='module'>` console.log | Just `index.html` + `console.log`. Doesn't exercise Lit or sass. | |
| No dev server in Phase 1; defer to Phase 6 | Drop BUILD-09 from Phase 1; ship pure tooling. | |

**User's choice:** Empty `<readkit-app>` Lit shell.
**Notes:** Element name (`readkit-app`) and entry file (`src/main.ts`) persist into Phase 6.

---

## Prettier + ESLint

### Q1 — Prettier baseline?

| Option | Description | Selected |
|--------|-------------|----------|
| 2-space, single quotes, trailing commas, semicolons, 100-col | Modern TS/Lit baseline; matches legacy single-quote preference. | ✓ |
| Prettier defaults (2-space, double quotes, 80-col) | Pure out-of-the-box. | |
| 4-space, single quotes (match legacy) | Preserves legacy 4-space indent. Unusual in modern TS/Lit. | |

**User's choice:** 2-space, single quotes, trailing commas, semicolons, 100-col.

### Q2 — ESLint baseline?

| Option | Description | Selected |
|--------|-------------|----------|
| eslint:recommended + typescript-eslint strict-type-checked + lit | Strongest realistic preset. Type-aware. | ✓ |
| eslint:recommended + typescript-eslint recommended-type-checked + lit | Less aggressive type-safety. | |
| eslint:recommended + typescript-eslint recommended (no type info) | Fastest lint; skips many TS-specific checks. | |

**User's choice:** eslint:recommended + typescript-eslint strict-type-checked + eslint-plugin-lit.

---

## License

### Q1 — Which license?

| Option | Description | Selected |
|--------|-------------|----------|
| MIT | Permissive; standard for browser tooling. Compatible with the locked stack. | ✓ |
| Apache 2.0 | Adds patent grant. | |
| AGPL-3.0 | Strong copyleft. Many publishers won't touch AGPL tooling. | |
| UNLICENSED / proprietary | All-rights-reserved. | |

**User's choice:** MIT.

### Q2 — Copyright holder?

| Option | Description | Selected |
|--------|-------------|----------|
| `Copyright (c) 2026 Jason Darwin` | Matches legacy author tag. | |
| `Copyright (c) 2013-2026 Jason Darwin and contributors` | Acknowledges 2013-era origin. | |
| Different copyright holder | (Free text) | ✓ |

**User's choice:** "Copyright 2026 meBooks Ltd" — captured as `Copyright (c) 2026 meBooks Ltd` in the LICENSE file.

---

## README Scope

### Q1 — README scope?

| Option | Description | Selected |
|--------|-------------|----------|
| Full README | Purpose + supported browsers + prereqs + install + dev loop + repo layout + forward refs + GSD note + CLAUDE.md link + license. | ✓ |
| Minimal README | What + prereqs + install/dev only. | |
| README + CONTRIBUTING.md split | Cleaner concerns split; two docs to keep current. | |

**User's choice:** Full README. (No separate CONTRIBUTING.md.)

---

## GitHub Actions

### Initial proposed Q (rejected for clarification)

User asked: "What would a github workflow be needed for with this project? Do we need it to do any build or CI/CD tasks?"

**Claude's answer (summary):** GHA usefully enforces the size-cap regression defence (the 700 MB regression we're defending against), runs the cross-browser Playwright matrix in Phase 12, runs the memory-budget test in Phase 12, and catches typecheck/lint failures from any machine. Optionally publishes to gh-pages once Phase 11 lands. No backend, no Docker, no AWS.

### User's response (free-text, partially overrode prior decisions):

> "We will need to be able publish to gh-pages once the migration is complete -- see ~/workspace/readk.it_pages.
> Regarding the Size-cap regression defence and Memory-budget test, I don't think we need these.
> It will useful to Catch typecheck/lint failures from any machine -- I presume a later phase is going to be responsible for creating a github action to do this?
> When we publish the project to gh-pages, we'll want to build the epub files so they can be served via the library view, and individually -- see ~/workspace/readk.it_pages.
> This will continue to be a public github repo"

**Captured decisions:**
- GHA workflow file (`ci.yml`) deferred to **Phase 2** (which already commits to "GitHub Actions running unit + E2E on every push" — typecheck + lint will fold into the same workflow).
- gh-pages deploy workflow (`deploy.yml`) becomes **Phase 13** (newly added).
- **Working-tree size cap CI gate dropped.** Phase 1 success criterion 5 needs revision — the lockfile half stays, the cap half goes.
- **Phase 12 TEST-05 (memory-budget test) dropped entirely.** Phase 12 success criterion 4 deleted; REQUIREMENTS.md updated to drop TEST-05.
- New Phase 13: gh-pages deploy. New requirements DEPLOY-01, DEPLOY-02. ROADMAP.md updated to add the phase; REQUIREMENTS.md updated to add the requirements; PROJECT.md updated to add the v1 active hypothesis.
- gh-pages content source: curated subset on a separate branch / sister repo (rights-management).

### Q (subsequent) — Where does gh-pages publishing live in the roadmap?

| Option | Description | Selected |
|--------|-------------|----------|
| New Phase 13: Deploy to GitHub Pages | Adds 13th phase. Keeps Phase 12 focused on a11y/hardening. | ✓ |
| Fold into Phase 11 (Library Index) | Phase 11 grows from 4 to ~7 plans. | |
| Defer to v1.x | Not in v1 roadmap. | |

**User's choice:** New Phase 13.

### Q (subsequent) — How should EPUBs be sourced for CI / gh-pages publishing?

| Option | Description | Selected |
|--------|-------------|----------|
| Curated subset on a separate branch / sister repo | Solves rights-management; keeps `readkit.epub*/` gitignored. | ✓ |
| All 26 source EPUBs via Git LFS | Contradicts the "EPUBs unversioned, swap freely" decision. | |
| Decide in the deploy phase | Note in CONTEXT.md and let Phase 13 planner decide. | |

**User's choice:** Curated subset on a separate branch / sister repo.

---

## .editorconfig

### Q1 — Add `.editorconfig` in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes | Standard 8-line file: utf-8, LF, 2-space, trim trailing whitespace, final newline. | ✓ |
| No | Skip. Prettier handles JS/TS/CSS/MD/JSON/YAML. | |

**User's choice:** Yes.

---

## CSP in Dev Shell

### Q1 — CSP meta tag on Phase 1 dev shell?

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to Phase 5 | Phase 5 introduces report-only when chapter HTML first meets the DOM. | ✓ |
| Add a permissive CSP now in report-only mode | Surfaces violations from day 1. | |

**User's choice:** Defer to Phase 5.

---

## Browserslist + tsconfig

### Q1 — File shape?

| Option | Description | Selected |
|--------|-------------|----------|
| `.browserslistrc` separate file + split tsconfig | Single source for Vite/postcss/autoprefixer/ESLint. Split tsconfig: browser + node. | ✓ |
| `browserslist` in package.json + single tsconfig | One less file each. Will likely need `tsconfig.node.json` later anyway. | |

**User's choice:** `.browserslistrc` separate file + split tsconfig.

---

## Phase 13 Error Pages

### Q1 — Custom 404/500 pages or GitHub Pages defaults?

| Option | Description | Selected |
|--------|-------------|----------|
| Custom branded error pages | Styled as readk.it with back-to-library link. ~30 extra lines. | ✓ |
| GitHub Pages defaults | Generic 404. Zero maintenance. | |

**User's choice:** Custom branded error pages.

---

## Vitest Placeholder

### Q1 — Seed `vitest.config.ts` placeholder in Phase 1, or wait for Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| Wait for Phase 2 | Phase 2 wires the full test harness. Phase 1 `scripts.test` is a placeholder. | ✓ |
| Seed a no-op `vitest.config.ts` now | One trivial passing test; lower delta when Phase 2 lands. | |

**User's choice:** Wait for Phase 2.

---

## Claude's Discretion

The following were not put to the user; Claude picked sensible defaults:

- **CI scope for Phase 1 if GHA had been wired in Phase 1**: moot — GHA fully deferred to Phase 2.
- **Dependency-update automation (Dependabot / Renovate)**: defer to v1.x.
- **CONTRIBUTING.md**: skip — full README covers contributor guidance for v1.
- **Engine quarantine ESLint rule wording**: planner picks `no-restricted-imports` vs custom rule when the rule lands in Phase 4.
- **`.gitignore` line ordering / grouping**: planner's call.

## Deferred Ideas

(See CONTEXT.md `<deferred>` for the canonical list. Summary:)

- Phase 13 — newly added — Deploy to GitHub Pages. Curated EPUB subset, branded error pages.
- TEST-05 (memory-budget test) — dropped from v1 entirely.
- CI working-tree size cap — dropped from v1 entirely.
- Dependency-update automation — defer to v1.x.
- CSP enforcement on dev server — Phase 5 / Phase 12.
- Engine quarantine ESLint rule — Phase 4.
- `unsafeHTML()` ESLint guard — Phase 5.
- Real `vitest.config.ts` and `npm test` — Phase 2.
- `.github/workflows/ci.yml` — Phase 2.
- `.github/workflows/deploy.yml` — Phase 13.
- `vite-plugin-singlefile` and `book` build mode — Phase 10.
