# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-26)

**Core value:** Convert any EPUB into a clean, self-contained reading experience that works in any modern browser — desktop, mobile, or tablet — with zero runtime dependencies on a third-party EPUB library, on a build any contributor can reproduce on a current developer machine.
**Current focus:** Phase 1 — Foundation & Repo Hygiene

## Current Position

Phase: 1 of 12 (Foundation & Repo Hygiene)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-04-26 — Roadmap created (12 phases, FINE granularity, 38/38 v1 requirements mapped)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Greenfield rewrite (not incremental in-place modernisation)
- Build our own isomorphic EPUB engine (no epub.js / Readium / foliate-js)
- Two execution paths, one engine (Node build script + browser drag-drop both call the same TS `EpubProcessor`)
- Sanitise EPUB content before DOM insertion (DOMPurify, no `unsafeHTML()` on chapter HTML)
- Adopt Lit for UI chrome
- Drop AppCache; offline via standalone HTML
- Reflowable EPUBs only in v1; defer fixed-layout to v2

### Pending Todos

None yet.

### Blockers/Concerns

- Pitfall 3: Solo HTML size limits silently crash mobile Safari — defended by CI size cap landing in Phase 10
- Pitfall 4: Two-output drift — defended by shared `EpubProcessor` and shared smoke-flow snapshot in Phases 5/9/10
- Pitfall 5: Untrusted EPUB content as XSS vector — defended by sanitisation gate in Phase 5
- Pitfall 7: Cross-book persistence leakage — defended by `bookId()` discipline in Phase 3 and verified end-to-end in Phase 8
- Pitfall 9: Repo hygiene regression to 700 MB working tree — defended by `.gitignore` + pre-commit + CI `du -sh` gate from Phase 1

## Deferred Items

Items acknowledged and carried forward:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-04-26
Stopped at: Roadmap created and traceability table populated; ready to begin Phase 1 planning.
Resume file: None
