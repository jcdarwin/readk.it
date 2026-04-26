---
phase: 1
slug: foundation-and-repo-hygiene
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Phase 1 is configurational — no Vitest/Playwright tests (deferred to Phase 2 per D-13).
> Validation is `npm run typecheck && npm run lint` plus targeted shell-based assertions.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (Phase 1 ships no test framework — Vitest 4.1.5 + Playwright 1.59.1 land in Phase 2) |
| **Config file** | None — `vitest.config.ts` and `playwright.config.ts` are Phase 2 deliverables |
| **Quick run command** | `npm run typecheck && npm run lint` |
| **Full suite command** | `npm run typecheck && npm run lint` (Phase 1 surrogate) |
| **Estimated runtime** | ~10 seconds (typecheck + flat-config lint over a tiny `src/` tree) |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck && npm run lint`
- **After every plan wave:** Run targeted smoke checks (install dry-run, dep audit, lockfile presence, dev-server `curl`, >1 MB pre-commit block smoke)
- **Before `/gsd-verify-work`:** Full set + manual >1 MB block test + manual HMR verification + visual confirmation of `<readkit-app>` rendering
- **Max feedback latency:** 10 seconds for typecheck+lint; ~30 seconds for the wave-level smoke set

---

## Per-Task Verification Map

> Filled in by the planner during plan creation. Each PLAN task with an `<automated>` block contributes a row here. Updated as plans land.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> Phase 1 has no test framework to install (test infra lands in P2). Wave 0 here covers the bootstrap toolchain that downstream waves depend on (lockfile, tsconfig, ESLint flat config, Husky install).

- [ ] `package.json` + committed `package-lock.json` — locked deps so every later wave installs reproducibly
- [ ] `tsconfig.json` (strict, ES2022, ESM) — typecheck script must exist before any task in later waves writes TypeScript
- [ ] `eslint.config.js` (flat config, typescript-eslint 8 + eslint-plugin-lit 2) — lint script must exist before later waves write Lit components
- [ ] `.husky/pre-commit` (>1 MB block + `lint-staged`) — must be active before later waves stage SCSS/TS that lint-staged formats

*Optional (planner's discretion, per D-13):*
- [ ] `package.json` `scripts.verify:install` — `npm install --dry-run` smoke
- [ ] `package.json` `scripts.verify:no-legacy-deps` — grep for the forbidden-dep list
- [ ] `tasks/verify-precommit.sh` — executable assertion that the >1 MB block fires (or inline in PLAN task description)

*If none of the optional items are converted into tasks: validation is "manual smoke + reviewer checklist" and the plan-checker agent must accept that. CONTEXT.md D-13 explicitly endorses this posture for Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm run dev` HMR — editing `src/components/readkit-app.ts` triggers a browser reload without full refresh | BUILD-09 | HMR is observed in the browser; no headless test infrastructure exists in Phase 1 (defer to Playwright in Phase 2) | 1. `npm run dev`. 2. Open `http://localhost:5173/`. 3. Edit the `<h1>` text in `src/components/readkit-app.ts` and save. 4. Browser must update without a full reload (HMR overlay visible briefly). |
| Pre-commit `>1 MB` block fires when staging an oversized file | BUILD-08 | Triggering a real `git commit` on a 2 MB blob is destructive enough that we don't bake it into automated CI for Phase 1 | 1. `dd if=/dev/zero of=big.bin bs=1M count=2`. 2. `git add big.bin`. 3. `git commit -m "should fail"` — must exit non-zero with a message naming `big.bin`. 4. `git reset && rm big.bin`. |
| Visual confirmation that `<readkit-app>` renders in the dev server | BUILD-03 / BUILD-09 | Lit Web Component rendering is browser-state; no E2E framework yet | 1. `npm run dev`. 2. Open `http://localhost:5173/`. 3. Confirm the `<readkit-app>` element renders the expected placeholder text in the DOM (not just an empty custom element). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags in any automated command
- [ ] Feedback latency < 30s for the wave-level smoke set
- [ ] `nyquist_compliant: true` set in frontmatter once the per-task map is complete

**Approval:** pending
