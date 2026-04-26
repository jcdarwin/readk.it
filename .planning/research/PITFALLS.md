# Pitfalls Research

**Domain:** Browser-only EPUB reader — TypeScript + Vite + Lit + epub.js, four output flavours
**Researched:** 2026-04-26
**Confidence:** HIGH for upstream-documented epub.js issues, Lit/Shadow-DOM, Vite single-file, mobile-Safari viewport bugs (multiple authoritative sources). MEDIUM for cross-LLM execution traps and four-flavour build coupling (project-specific synthesis informed by `.planning/codebase/CONCERNS.md`).

> **Note on the legacy concerns audit:** the seven traps documented in `.planning/codebase/CONCERNS.md` (object URLs not revoked, empty `try/catch` swallowing decode failures, AppCache, vendored vendor libs, committed `dist/`, Python 2 manifest, etc.) are evidence that *this project's contributors have historically not noticed these classes of failure*. Pitfalls below are framed assuming the new codebase will repeat them unless explicit gates exist.

---

## Critical Pitfalls

### Pitfall 1: epub.js iframe boundary breaks Lit's event model

**What goes wrong:**
epub.js renders each spine item inside an `<iframe>` it creates and manages itself. Events (clicks, keypresses, custom events) dispatched *inside* that iframe **do not bubble to the host document** — they are confined to the iframe's document. Lit components expecting to handle clicks via `@click` on the host (e.g. for footnote popups, internal-link navigation, or analytics) will receive *nothing*. Conversely, Lit components dispatching `composed: true, bubbles: true` events from elsewhere on the page will not reach listeners attached inside the epub.js iframe.

**Why it happens:**
iframes are a separate browsing context. The DOM-event spec stops bubbling at the iframe's `contentWindow` boundary regardless of `composed`. epub.js exposes `rendition.on('click', handler)` and similar hooks precisely because raw DOM events cannot escape. Developers coming from a single-document mental model (or Lit-only background) attach listeners to the host and assume Shadow DOM `composed` semantics will help — they don't, because this is a *frame* boundary, not a *shadow* boundary.

**How to avoid:**
1. **All EPUB-content events go through epub.js's API**: `rendition.on('rendered', ...)`, `rendition.on('selected', ...)`, `rendition.on('relocated', ...)`, `rendition.on('click', ...)`. Document this as the only sanctioned path in `CONVENTIONS.md`.
2. **Use `rendition.hooks.content.register(...)`** to inject post-render scripts/handlers into each rendered chapter document — this is the supported extension point.
3. **For Lit↔iframe communication go via `rendition` events, not `postMessage`** — epub.js already brokers this; rolling your own creates two parallel event systems.
4. **Never** put Lit components *inside* the epub.js iframe — they won't be upgraded (their definitions live in the host document) and the boundary defeats their custom-element registry.

**Warning signs:**
- A click handler "works in dev but not in some books" (the EPUB happens to render in a fresh iframe).
- Stack traces in test runs reference `iframe.contentDocument` returning `null`.
- The phrase "I'll just attach a global window listener" appears in a PR.

**Phase to address:** Reader Core (the phase that first integrates epub.js).

---

### Pitfall 2: epub.js memory leaks survive `book.destroy()`

**What goes wrong:**
Loading an EPUB allocates blob URLs, iframe DOM trees, font references, event listeners on `window` (`unload`, `orientationchange`, `resize`), and per-view DOM caches. `book.destroy()` and `rendition.destroy()` historically did **not** clean all of these up. Memory grows on every drag-and-drop of a new book; on mobile this OOM-crashes the tab after a handful of swaps. This is the same class of bug the legacy reader has (see `CONCERNS.md` — Object URLs Never Revoked) — adopting epub.js does not solve it automatically.

**Why it happens:**
- epub.js issue [#688](https://github.com/futurepress/epub.js/issues/688) (zipped-EPUB memory not released after `destroy`) sat open for years.
- The most recent commits on `futurepress/epub.js` (March 2026) are PRs [#1414](https://github.com/futurepress/epub.js/pull/1414) and a sibling fix titled *"fix: memory leaks in DefaultViewManager"* and *"fix: memory leaks in ContinuousViewManager"* — proof that leaks existed in the version most projects depend on, and proof that depending on stale `npm` releases will inherit them.
- Drag-drop scenarios stress this far harder than the typical "one book per page load" demo.

**How to avoid:**
1. **Pin to a release that contains the March 2026 ViewManager leak fixes** (or pin to a fork/commit SHA that does). Do not silently accept whatever `^X.Y.Z` resolves to.
2. **Track every `URL.createObjectURL` your own code creates** in a `Set<string>` per book; revoke on book swap. Do not assume epub.js will revoke ones it didn't create.
3. **Wrap book-swap in a strict teardown sequence** in a single utility: `await rendition.destroy(); await book.destroy(); revokeAll(); container.replaceChildren();` — never let a caller perform a partial teardown.
4. **Add a Playwright "memory budget" test**: open 10 different EPUBs sequentially via drag-drop, assert that `performance.memory.usedJSHeapSize` (Chromium) does not grow more than N MB between book 1 and book 10.

**Warning signs:**
- DevTools heap snapshot shows N detached `HTMLIFrameElement` instances after dropping N books.
- `getEventListeners(window)` (Chromium DevTools) shows accumulating `unload` / `orientationchange` listeners.
- `URL.createObjectURL` invocations exceed `URL.revokeObjectURL` invocations in profiling.
- iOS Safari tab silently reloads after the user opens 4–6 books in a row.

**Phase to address:** Reader Core (introduce teardown discipline at the moment epub.js is integrated, not retrofitted later).

---

### Pitfall 3: Solo flavour blows past Safari/iOS limits silently

**What goes wrong:**
The "solo" build inlines the entire EPUB as base64 data URIs into one HTML file. For small EPUBs this works. For image-heavy publications (children's books, cookbooks, art catalogues — exactly the long tail of the project's 26 source EPUBs) the resulting file:
- Exceeds Safari's per-document JS heap limit on iPhone (around 200–500 MB depending on device class).
- Has hundreds of blob URLs created at runtime; while there is no documented hard *count* limit on blob URLs in Safari, there are documented crash patterns when many large blobs are alive simultaneously.
- Takes seconds to *parse* before any code runs (browser parses the entire script before executing it).

The legacy reader already hits this — `CONCERNS.md` notes "Large image-heavy EPUBs become unloadable in mobile browsers". The new build will hit it again unless explicitly defended.

**Why it happens:**
The simplest implementation of "single file" is "concatenate everything as data URIs". `vite-plugin-singlefile` makes this trivially easy. There is no warning when the resulting HTML approaches a problematic size — the build just emits a giant file.

**How to avoid:**
1. **Cap the solo build size in CI**: emit a build error if `dist-solo/<book>.html` exceeds an explicit threshold (start at 50 MB, tune from real EPUB measurements).
2. **Switch from data URIs to embedded zip + runtime decompression** for the solo flavour. Embed the original `.epub` as a single base64 blob, decompress with `fflate` on demand. This is what `CONCERNS.md` calls "switch solo builds to a packed-zip approach" and is cheaper than per-asset data URIs because:
   - One large base64 string parses faster than thousands of small ones.
   - Decompression happens lazily, per chapter visited.
   - Memory stays bounded because only the current chapter's resources are alive.
3. **Do not rely on `assetsInlineLimit`** for this — that controls Vite's *small* asset inlining, not whole-bundle inlining. The relevant tool is `vite-plugin-singlefile` (or a bespoke post-build step), and it does not enforce a size cap.
4. **Test the largest source EPUB on iOS Safari, not just desktop Chrome.** Desktop will quietly handle 100 MB files that crash mobile.

**Warning signs:**
- Solo HTML for a book exceeds 30 MB.
- DevTools shows multi-second "parse HTML" before "evaluate script" begins.
- iOS Safari shows a blank page or "A problem repeatedly occurred" reload prompt.
- Memory tab shows the document JS heap > 200 MB on first load.

**Phase to address:** Build Pipeline (specifically the phase that first produces the solo flavour).

---

### Pitfall 4: Build flavours drift from each other without visible failure

**What goes wrong:**
Four flavours (drag-drop reader, library site, solo HTMLs, EPUB-embedded reader) share the reader source. A change in the reader code will:
- Pass tests against one flavour (usually the dev-server flavour).
- Build and silently produce broken output in another flavour (often the EPUB-embedded one because it is least exercised).
- Get released because nobody noticed the EPUB-embedded build never actually loaded a book.

The legacy build has *exactly this disease* — `CONCERNS.md` notes "the build can complete with a broken `manifest.json` (Python 2 failure) or a missing chapter and the produced `dist/` will look superficially correct."

**Why it happens:**
- Each flavour has subtly different runtime constraints: `file://` vs `https://`, CSP, allowed APIs (Web Workers in some, blocked in others), inline-script restrictions inside an EPUB container, presence vs absence of a fetch-able server.
- Developers iterate on the dev server, where everything works.
- "Build all flavours" is slow, so it gets skipped in pre-commit hooks.
- Only one flavour is exercised by E2E tests.

**How to avoid:**
1. **One Vite config per flavour, all four built by `npm run build`** — failing any one fails the whole script. No conditional skips.
2. **One Playwright project per flavour**, all running in CI on every push. The matrix should multiply browser × flavour, not pick representatives.
3. **Smoke artefact for each flavour**: each build produces a known canonical "ready" signal — e.g. the rendered first paragraph of `04_kafka_the_metamorphosis` matches a snapshot. CI fails if any flavour's signal is missing.
4. **No feature flags that vary per flavour without a test for each branch.** If `if (FLAVOUR === 'solo') { ... }` exists, both branches must be exercised.
5. **A documented "flavour matrix"** in `.planning/codebase/ARCHITECTURE.md` enumerating: scheme (`file://`/`https://`), CSP, available APIs, persistence backend, build entry. New code must be checked against the matrix.

**Warning signs:**
- A PR description says "tested in dev mode" but does not mention `dist/`.
- One flavour's CI job is consistently slower / disabled / `allow-failure`.
- A bug report mentions a flavour that nobody on the team has run locally in a month.

**Phase to address:** Build Pipeline + Test Infrastructure (these phases co-design the flavour gates; both must land before further reader features rely on a multi-flavour build).

---

### Pitfall 5: Untrusted EPUB content is rendered as same-origin

**What goes wrong:**
A drag-and-dropped EPUB can carry arbitrary `<script>`, `on*` event handlers, SVG `<use href="https://attacker">` references, and `<link>` tags. epub.js renders chapters into iframes by default — but if those iframes are **not** sandboxed, EPUB scripts execute with full access to the parent origin's localStorage, IndexedDB, cookies, and the rest of the reader's surface. The same-origin trust path is the one the legacy reader has (see `CONCERNS.md` — Untrusted EPUB Content Injected via `.html()` and `wrapInner`); switching to epub.js does *not* automatically fix this.

**Why it happens:**
- epub.js *can* set `iframe.sandbox`, but historically did not by default. See issue [#1083](https://github.com/futurepress/epub.js/issues/1083) requesting sandbox support.
- EPUB 3 explicitly permits scripting; "render the content as the author wrote it" is the reader's nominal job.
- Most demos load curated content (the project's own 26 EPUBs), so the threat model is invisible until users start dropping random EPUBs from the wild.

**How to avoid:**
1. **Always render EPUB chapters in `<iframe sandbox="allow-same-origin">`** (note: the absence of `allow-scripts` blocks all EPUB-supplied JavaScript; *omit `allow-same-origin`* to even prevent reads of the iframe's own DOM by EPUB scripts via `parent`). Pick the strictest sandbox that still lets epub.js do CFI navigation — confirm against a known-scripted EPUB during phase QA.
2. **Verify which `manager` / `view` epub.js is using** and which iframe attributes it sets. If the chosen manager doesn't sandbox by default, configure it explicitly via `book.renderTo(el, { allowScriptedContent: false, ... })` — modern epub.js exposes this.
3. **Set a strict CSP on the host document**: `default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; frame-src 'self' blob:;`. The CSP cannot reach inside the iframe, but it stops the EPUB from pivoting into the host.
4. **Sanitise EPUB-supplied metadata** (title, author, description) with `.textContent`, never `.innerHTML`. Lit's default templating is safe for interpolation; the trap is calls to `unsafeHTML()` directive, which must not be used on EPUB-supplied strings.
5. **Document in `.planning/codebase/INTEGRATIONS.md`** that any future "let users add highlights/annotations" feature must round-trip through a sanitiser, never through a `.innerHTML` shortcut.

**Warning signs:**
- `unsafeHTML()` appears anywhere with EPUB-derived input.
- An iframe has no `sandbox` attribute in DevTools.
- A test EPUB containing `<script>alert(document.cookie)</script>` actually fires the alert in dev.
- `Content-Security-Policy` is missing or set to `default-src *`.

**Phase to address:** Reader Core (set the iframe sandbox the moment epub.js is wired up; retrofitting is harder than getting it right first time).

---

### Pitfall 6: Drag-and-drop pipeline silently hangs on malformed EPUBs

**What goes wrong:**
A user drops a corrupted, partially-downloaded, or non-EPUB-but-`.epub`-renamed file. The unzip step throws, the parse step rejects, or epub.js's promise pipeline never resolves. The UI sits on the loading state with no feedback, no error, no recovery affordance other than refreshing the page. This is the same fault present in the legacy code (`CONCERNS.md` — Drag-and-Drop `try/catch` Swallows Decode Failures).

**Why it happens:**
- Promise chains that hit an unhandled rejection in a Workers context don't always surface to the host.
- Developers default to "happy path drag-drop demo" with curated EPUBs; the malformed-input path never gets exercised.
- `try/catch` in a callback (rather than `.catch()` on the chain) silently swallows the rejection, leaving the outer `.then()` waiting forever.

**How to avoid:**
1. **Every async path from drop → ready has a single top-level `.catch()`** that surfaces a *visible* error UI. Failure modes to enumerate explicitly: not a zip, no `META-INF/container.xml`, OPF missing, unsupported EPUB version, encrypted resource, image too large, ran out of memory.
2. **A 30-second timeout** on book load. If the promise hasn't resolved, surface "this book took too long to load — it may be corrupted" with a "try a different book" CTA.
3. **Build a `tests/fixtures/malformed/` corpus** of broken EPUBs — truncated zip, invalid OPF, missing nav, encrypted font, bombs (highly compressed payload). Each must be a Playwright test asserting the right error UI appears.
4. **Validate before parsing**: detect zip magic bytes (`PK\x03\x04`); reject early with a message rather than letting the unzip library throw a cryptic error 4 layers deep.
5. **Surface `console.error`-only paths to the user.** The legacy code (`utility.error()` → `console.error()` only — `CONCERNS.md`) is the prototype to actively avoid; an error utility should be required to render to the DOM, not just log.

**Warning signs:**
- The drag-drop UI has no visible error state in any mockup or component.
- An async function `await`s a promise without a `.catch()` and is itself called from an event handler.
- Test corpus includes only valid EPUBs.

**Phase to address:** Drag-and-Drop / Library UI phase.

---

### Pitfall 7: localStorage migration to IndexedDB without per-book namespace discipline

**What goes wrong:**
Reading position, bookmarks, theme, font choice are stored *per EPUB* in localStorage today. `PROJECT.md` flags moving to IndexedDB; the migration easily loses the per-book identifier hygiene because IndexedDB encourages "one big object store" thinking. Books then read each others' bookmarks; or all books re-render at page 0 because the lookup key changed shape.

**Why it happens:**
- localStorage's flat key namespace forces a `<bookId>:<setting>` convention by accident; IndexedDB's record model invites a different (and inconsistent) shape.
- Writing the new persistence layer in isolation, without re-reading the legacy `utility.storage(identifier, ...)` call sites, means the per-book scoping discipline doesn't carry over.
- `PROJECT.md` says all 26 source EPUBs are rebuilt against the new reader, so legacy migration may seem irrelevant — but **dropped user EPUBs** still need stable per-book identifiers, and a user opening the same EPUB across versions of the reader expects continuity.

**How to avoid:**
1. **Define a stable per-book identifier function early**, separately from the persistence layer: `bookId(epubMetadata) -> string`. Use the OPF `dc:identifier` (the EPUB's own canonical id), falling back to a hash of the file bytes. Document this as the canonical key in `.planning/codebase/CONVENTIONS.md`.
2. **One IndexedDB schema doc** under `.planning/codebase/` enumerating object stores, key paths, and indices. Schema changes get versioned with explicit migrations.
3. **Test cross-book leakage explicitly**: open book A, set theme `dark`, open book B, assert theme falls back to default; reopen book A, assert `dark` returns.
4. **Never use the file *name* as a key** — users rename files; identical books from different sources have different filenames; identical filenames may be different books. Always derive the key from EPUB metadata + content hash.
5. **No `localStorage` survives in v1 except as the IndexedDB-feature-detect fallback for `file://` solo builds where IndexedDB can be disabled.** Even then, the same `bookId` function is the key.

**Warning signs:**
- Persistence code reads `book.url` or `file.name` to compute a key.
- IndexedDB has no version migration code (means schema changes will silently lose data).
- A test opens two books in sequence and the second inherits the first's settings.

**Phase to address:** Reader Core (persistence layer is foundational; getting the identifier wrong here cascades into every later feature that reads or writes per-book state).

---

### Pitfall 8: Cross-LLM execution: implicit-context plans fail under smaller-context executors

**What goes wrong:**
Plans authored by a long-context model (Claude Opus, Gemini 1.5 Pro) frequently encode assumptions like "as in the previous phase, the `bookId` utility lives at `src/lib/identity.ts`" or "use the same teardown sequence we established earlier". A smaller-context executor (a coding agent with 32 K context, a junior contributor, a future *you* six months later) cannot recover these references and either:
- Reinvents the utility (now there are two `bookId` functions that produce different ids — a Pitfall 7 regression).
- Solves the wrong problem (drops sanitisation because the plan said "render the chapter" without specifying *sandboxed*).
- Marks the task done when the smoke test passes, missing the gate from a sibling phase (e.g. memory-budget test from Pitfall 2).

**Why it happens:**
- Planning models naturally write in their own dialect; their long context lets them refer back to earlier reasoning that an executor cannot see.
- Phase deliverables described as "implement the chapter renderer" leave the *constraints* (sandbox, teardown, persistence key) implicit.
- "Loose ends" (a TODO in phase 3, an `// XXX` comment, an unreviewed `expect(true)` in a test) compound across phases because each phase's executor assumed the previous phase's executor had the loose end in mind.

**How to avoid:**
1. **Every phase plan includes an explicit "preconditions and invariants" block** that re-states (does not link to) the constraints from prior phases that the executor must uphold. This is the executor's contract, not a diff against history.
2. **Acceptance criteria reference exact file paths and exact test names** (e.g. "`tests/e2e/memory-budget.spec.ts` runs to green"), not narratives.
3. **No phase ships with TODO/XXX/`@ts-ignore`/skipped tests.** A phase with loose ends does not pass review; the next phase's executor cannot reason about half-finished state.
4. **Cross-phase invariants live in `.planning/codebase/CONVENTIONS.md`** as the authoritative reference. Phases read from it; they don't redefine.
5. **A phase plan that mentions "the same approach as the X phase" must inline the approach** or quote the exact section of the prior plan. Smaller-context executors cannot follow the back-reference.

**Warning signs:**
- A phase plan is shorter than the question it answers.
- A phase plan uses pronouns like "this", "that approach", "as before" without a concrete reference.
- Phase N's tests do not exist as files Phase N-1 could have run.
- "It worked in my session" appears in PR review.

**Phase to address:** Project Setup (establish the planning conventions before any executable phase begins) — and re-applied as a checklist at every phase transition.

---

### Pitfall 9: Repository hygiene regresses to a 700 MB working tree

**What goes wrong:**
The legacy repo carries 285 MB `dist/`, 229 MB `dist.0.11.16/`, 151 MB `dist.gianleap/`, 38 MB unzipped EPUBs, 32 MB `node_modules/` (at least one of these has been committed historically). The git status at the start of this session shows 27 untracked unzipped EPUB directories already accumulating. Without explicit discipline, the new repo will accrete the same shape: `dist/` snapshots committed "for safety", EPUB samples committed because "we test against them", node_modules occasionally slipping in.

**Why it happens:**
- The old build has no fast-rebuild story, so a known-good `dist/` is a survival mechanism.
- EPUB fixtures are large and binary; "just commit them" is the least-effort path.
- `.gitignore` is written once, then never re-checked when new directories like `dist.gianleap/` are created.

**How to avoid:**
1. **`dist/`, `dist.*/`, `node_modules/`, `.cache/`, and `*.epub` ignored from day one** in the new tree. Pre-commit hook fails if any matched path is staged.
2. **EPUB fixtures live under `tests/fixtures/epubs/` and are tracked via `git lfs`** (or a separate fixtures repo, or pulled at CI time from a release artefact). Decision documented before the first fixture is added.
3. **CI step `du -sh .` and fail if the working tree exceeds a threshold** (e.g. 50 MB excluding `.git`). Catches accidental commits before they spread.
4. **Reproducible builds eliminate the temptation to commit `dist/`** — one `pnpm install && pnpm build` on a current Node LTS produces the four flavours. If that's true, no one needs the committed snapshots.
5. **At every milestone transition, run `git ls-files | xargs -I{} du -b {} | sort -rn | head -20`** and review the largest tracked files. Catches regressions early.

**Warning signs:**
- A PR adds files larger than 1 MB.
- `.gitignore` does not list `dist*/`.
- A contributor says "I'm committing this `dist/` so other people don't have to rebuild".
- An EPUB file is staged anywhere except `tests/fixtures/`.

**Phase to address:** Project Setup (`.gitignore`, pre-commit, fixtures policy all on day one).

---

### Pitfall 10: Cross-browser rendering quirks surface only in production

**What goes wrong:**
The reader works on the developer's Chrome desktop. Then:
- **iOS Safari**: `100vh` is the *layout* viewport, not the visual viewport; the reader's page-flip controls hide under the address bar, then disappear under the virtual keyboard if the user taps a search field. `position: fixed; bottom: 0` floats above content when the keyboard dismisses.
- **Chrome on Android**: pull-to-refresh fires on a downward swipe gesture, which collides with the reader's vertical scroll and re-loads the entire page (losing the reader state).
- **Firefox**: blob URLs created from arraybuffers behave correctly but `URL.revokeObjectURL` timing differs subtly from Chromium; image loading from a revoked URL fails on Firefox where it might still race-succeed on Chrome.
- **iPad split-screen**: `window.innerWidth` reports half the device, but `matchMedia('(min-width: ...)')` queries can flip mid-session as the user resizes the split. Reader layout that responds only to the initial query gets stuck.

**Why it happens:**
Each browser has its own historical baggage; modern-browser parity is real for *most* APIs but not for viewport-units, gesture interception, or memory-management timing. The legacy reader hits this (`CONCERNS.md` — `iScroll 4 Snap to Page on Resize`); the new reader will hit different versions of the same family of bugs.

**How to avoid:**
1. **Use `dvh` not `vh`** for any reader-chrome height (`100dvh` is the dynamic viewport height, sized correctly in iOS Safari and Chrome Android). Fallback to `vh` only via `@supports (height: 100dvh)` guards.
2. **Set `overscroll-behavior-y: contain` on the reader's scroll container** to disable Chrome Android pull-to-refresh without breaking momentum scroll. This is the supported, performant solution — not `touchstart` listeners.
3. **Playwright matrix runs on Chromium, WebKit, Firefox** for every PR. Mobile emulation (Pixel, iPhone) covered for the drag-drop reader and the solo flavour at minimum.
4. **Real-device smoke test before each release**: actual iOS Safari, actual Chrome Android, actual iPadOS Safari with split-screen. Emulators miss the visual viewport quirks.
5. **No `webkit*` / `moz*` shims.** The legacy code is full of these (`CONCERNS.md`); modern targets don't need them and they hide bugs.

**Warning signs:**
- CSS uses `100vh`.
- Touch handlers attach `preventDefault` on `touchstart` (kills momentum scroll on iOS).
- A `User-Agent` sniff appears anywhere.
- Tests run only on Chromium because "the others are slow in CI".

**Phase to address:** Test Infrastructure (Playwright matrix) + Reader Polish (final cross-browser sweep).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `unsafeHTML()` for EPUB content | "Just renders" without sandbox plumbing | XSS via dropped EPUBs; same-origin compromise | **Never** (EPUB content is hostile by definition) |
| `// TODO: revoke this URL later` | Ships the demo | Memory leak; iOS tab crashes; book-swap reliability | Never on a shared resource path |
| Single Vite config with `import.meta.env.FLAVOUR` branches | One config to maintain | Branches drift, only one tested in CI | Acceptable iff every branch has a CI job |
| `try { ... } catch {}` around drag-drop | Prevents the dev-server crashing on a bad EPUB | UI hangs forever on malformed input | Never — must surface a user-visible error |
| Pin `epubjs` to `^X` (caret range) | Picks up upstream fixes | Picks up upstream regressions on every CI run | Never — pin to a specific version with a lockfile |
| Test only the drag-drop flavour | Fastest CI | EPUB-embedded / solo silently break | Only acceptable for early prototyping; not after first release |
| Use `localStorage` "for now, IndexedDB later" | Faster persistence MVP | Identifier scheme leaks into permanent code | Acceptable for spike branches; never for `master` |
| Commit `dist/` "so reviewers can preview" | Reviewer convenience | Repo size explosion; merge-conflict storms | Never — use a deploy preview |
| EPUB fixtures committed inline | Tests run without setup | 38+ MB per fixture book; LFS bills | Acceptable for ≤1 small fixture; fixtures repo or LFS otherwise |
| Skip a Playwright test that's flaky | CI green | Flake compounds; eventually no one trusts the suite | Never; either fix or delete |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| epub.js `Book` lifecycle | Holding a `book` reference after `destroy()` | After `destroy()`, drop the reference; never call methods on a destroyed book |
| epub.js `Rendition` events | Subscribing in component `connectedCallback` without unsubscribing in `disconnectedCallback` | Track subscriptions and call `rendition.off(...)` symmetrically; Lit's `addController` pattern helps |
| epub.js iframe content | Trying to query inside it from the host with `document.querySelector` | Use `rendition.getContents()` to access each iframe's `contents.document` |
| Lit + epub.js | Putting the epub.js mount point inside Lit shadow DOM | Mount epub.js in a *light DOM* slot or in a dedicated host element outside shadow root — shadow CSS scoping interferes with epub.js's stylesheets |
| Vite asset graph | Importing an EPUB as `import book from './book.epub'` | EPUBs are runtime artefacts, not bundle inputs; `fetch()` them or accept them via `File` from drag-drop |
| `vite-plugin-singlefile` | Assuming it handles all asset types | It inlines JS/CSS only; asset URLs in your runtime code still need `assetsInlineLimit` or `?inline` import suffix |
| IndexedDB | Using it from inside an iframe with a different origin context | Persist from the host document only; epub.js iframe should not own persistence state |
| Web Workers | Spawning a worker from the solo flavour loaded as `file://` | `file://` blocks workers in many browsers; gate worker usage by `location.protocol === 'http:' \|\| 'https:'` and fall back to main-thread |
| Drag-and-drop on iOS Safari | Assuming `dragover`/`drop` fire on iOS | iOS Safari does not implement HTML5 drag-and-drop; provide a file-picker `<input type="file" accept=".epub">` fallback |
| EPUB internal links | Resolving via raw `href` strings | Use epub.js's `book.canonical(href)` / CFI; handcrafted path-stripping is the legacy bug (`CONCERNS.md` — Fragile Path-Stripping) waiting to recur |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous unzip on main thread | UI freeze 1–10 s on book load | Use `fflate` async API (worker-backed) or `unzipit` with `Blob` virtualization | EPUBs > ~10 MB on mobile, immediately |
| Loading entire EPUB before first render | Slow time-to-first-page | Lazy-decompress per chapter; render spine[0] immediately, prefetch [1] in background | Books with > 50 chapters or > 30 MB total |
| Detached iframes accumulating | Heap grows on each book swap; tab killed by OS | Strict `rendition.destroy()` + revoke blob URLs (Pitfall 2) | After 3–5 book swaps on iOS Safari |
| Mounting all spine items into DOM | Memory grows linearly with book size | Use epub.js's `manager: "default"` (paginated), not "continuous" for large books, or recycle off-screen views | Books with > 100 chapters |
| Re-running detection on every UI tick | CPU spike, jank on toggle | Detect once at boot (or use static feature checks); cache | Any high-frequency UI toggle (font, theme) |
| Solo build inlines as data URIs | Multi-second parse before code runs | Embed packed zip + decompress at runtime (Pitfall 3) | Solo builds > 30 MB |
| Lit components re-rendering on every reading-position update | Reader chrome flickers | Move position-tracked state to `@state` not `@property`; use `nothing` returns when nothing changed | High navigation frequency (page-flip held down) |
| Playwright tests waiting on `setTimeout` not events | Flaky tests; long suites | Wait on `rendition.on('rendered', ...)` events surfaced via test hooks | CI parallel runs > 4 |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering EPUB chapters without iframe sandbox | EPUB JS reads localStorage, exfiltrates other books' bookmarks, attempts CSRF against the user's other tabs | `<iframe sandbox>` (Pitfall 5); `allowScriptedContent: false` on the rendition |
| EPUB metadata via `unsafeHTML` | XSS via crafted `dc:title` containing `<img onerror>` | Use Lit's default text interpolation; never `unsafeHTML` on EPUB-supplied strings |
| No CSP on host document | XSS via a single `unsafeHTML` slip pivots to remote script load | `Content-Security-Policy` meta + header; `script-src 'self'`; allow `blob:` for image/font URLs only |
| Client-side decompression of arbitrary user input | Decompression bomb (zip with 1 KB compressed → 10 GB decompressed) crashes the tab | Cap decompressed size per entry; abort if compression ratio exceeds threshold |
| Honouring EPUB-supplied `<base href>` | EPUB redirects all relative URLs to attacker domain | Strip or override `<base>` in the rendition hook |
| Using `escape()` / `unescape()` for UTF-8 (legacy bug) | Brittle decoding; spec-removed APIs | `new TextDecoder('utf-8').decode(uint8)` only |
| Trusting EPUB-internal `META-INF/encryption.xml` blindly | Loading "encrypted" resources without checking they're permitted (Adobe DRM, IDPF font obfuscation) | Detect `encryption.xml` early; for IDPF font obfuscation, implement the deterministic 1040-byte unmangle (per the IDPF spec) — for any other encryption, reject the book with a clear message |
| Rendering EPUBs over `file://` with same-origin assumption | Two `file://` documents have *no* same-origin protection in some browsers | Always test the `file://` solo flavour with the threat model of "another tab on the same origin" |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading indicator during unzip | User sees blank screen, double-clicks the drop zone | Visible progress bar tied to entry-by-entry decompression |
| Errors only in the console | User has no idea why their book didn't load | Visible error UI with the book name and a retry/different-book CTA |
| Page-flip control hidden under iOS address bar | User can't navigate; pinches in frustration | `dvh` units; safe-area insets (`env(safe-area-inset-bottom)`) |
| Pull-to-refresh on Android wipes reading state | User loses position mid-chapter | `overscroll-behavior-y: contain` on the scroll container (Pitfall 10) |
| Drag-and-drop on iOS does nothing | User thinks the app is broken | File-picker fallback; feature-detect drag-and-drop and hide the "drop here" hint when unsupported |
| TOC drawer opens but doesn't close on selection | User taps an entry, lands on the page, has to manually dismiss | Auto-close on selection; preserve close-by-tap-outside |
| Theme toggle without persistence | User re-picks dark mode every visit | Persist per-user (host document), inheritable per-book if explicitly set |
| Book load takes 30 s without explanation | User thinks the page hung | Surface progress; cancel button; timeout with a clear message |
| Bookmark/position shared across books | User opens book B and lands on book A's page 47 | Per-book identifier discipline (Pitfall 7) |
| No keyboard navigation | Power users can't read with arrow keys; accessibility regression | `keydown` handlers on the rendition (`epub.js` exposes these); test with screen reader |

---

## "Looks Done But Isn't" Checklist

- [ ] **Drag-and-drop demo:** Often missing **error UI for malformed EPUBs** — drop a truncated file and verify a visible error appears, not a stalled spinner.
- [ ] **Book swap:** Often missing **resource teardown** — open 5 books in sequence and inspect heap; should not grow proportionally.
- [ ] **Solo flavour:** Often missing **size cap and large-EPUB testing** — build the largest source EPUB; load on iOS Safari (real device, not simulator).
- [ ] **EPUB-embedded flavour:** Often missing **end-to-end test** — produce the .epub, unzip it, serve from a static server, verify reader loads.
- [ ] **Cross-browser:** Often missing **WebKit and Firefox runs in CI** — Playwright matrix must run all three engines on every PR.
- [ ] **Accessibility:** Often missing **keyboard navigation, focus management, screen-reader labels** — run an automated axe scan and a manual NVDA pass before declaring v1 done.
- [ ] **Persistence:** Often missing **cross-book leakage test** — book A theme dark, open book B, assert default; reopen A, assert dark.
- [ ] **CSP:** Often missing — DevTools "Network" tab on the production-built reader must show no CSP violations on a known-malicious test EPUB.
- [ ] **Memory:** Often missing **explicit budget test** — Playwright/Vitest assertion that `usedJSHeapSize` stays bounded across N book opens.
- [ ] **Repository:** Often missing **size watchdog** — CI step that fails if working tree (excl. `.git`) exceeds the agreed cap.
- [ ] **Build flavours:** Often missing **CI gate per flavour** — build script must fail loudly if any flavour fails to produce its smoke artefact.
- [ ] **No legacy AppCache hangovers:** Often missing — `git grep -i 'manifest=\|appcache'` returns zero hits in the new tree.
- [ ] **Fixed-layout EPUBs:** Often missing — at least one fixed-layout fixture in the test corpus, with explicit "supported / unsupported" UX (`epub.js` has [open issues](https://github.com/futurepress/epub.js/issues/1105) here).
- [ ] **Encrypted/obfuscated fonts:** Often missing — at least one IDPF-obfuscated-font fixture; reader either decodes or surfaces a clear "this book uses obfuscated fonts" message.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| 1. Iframe event-model blindness | LOW | Refactor handlers to `rendition.on(...)` API; should be local to the chrome layer |
| 2. Memory leaks | MEDIUM | Bisect to identify the leak owner (epub.js vs your code); upgrade epub.js; instrument teardown; ship a memory-budget Playwright test as the regression gate |
| 3. Solo flavour size | HIGH | Re-architect inlining strategy from data-URIs to embedded-zip + runtime decompression; touches the build pipeline and the runtime loader |
| 4. Flavour drift | MEDIUM | Add per-flavour CI gates; backfill smoke artefacts; ratchet up coverage one flavour at a time |
| 5. Untrusted EPUB content | MEDIUM | Add iframe sandbox + CSP retroactively; audit every `unsafeHTML` and `innerHTML` call; sanitise EPUB metadata |
| 6. Drag-and-drop hangs | LOW | Wrap async chain in single `.catch`, add timeout, build malformed-EPUB fixture corpus |
| 7. Persistence cross-book leak | HIGH | If shipped: forced reset for affected users, schema migration with versioned IndexedDB; document the migration; communicate to users |
| 8. Implicit-context plans | LOW–MEDIUM | Re-author affected phase plans with explicit preconditions; backfill `CONVENTIONS.md` |
| 9. Repo bloat | LOW (early) / HIGH (late) | Early: add `.gitignore` and `git rm --cached`. Late: rewrite history with `git filter-repo`; coordinate with all forks |
| 10. Cross-browser surprise | MEDIUM | Real-device test; CSS `dvh` fix; `overscroll-behavior` fix; backfill Playwright matrix |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Iframe event-model blindness | Reader Core | E2E test: click an internal link inside the EPUB content, assert `rendition.on('linkClicked', ...)` fires; no host-document `click` listener required |
| 2. epub.js memory leaks | Reader Core | Playwright "memory budget" test: open 10 EPUBs in sequence, assert heap growth ≤ N MB |
| 3. Solo blob/data-URI limits | Build Pipeline (Solo flavour) | Build CI step: emit error if any solo HTML > size cap; Playwright iOS-Safari smoke against the largest book |
| 4. Multi-flavour drift | Build Pipeline + Test Infrastructure | Each flavour has CI build job + Playwright smoke; `npm run build` fails if any flavour smoke artefact is missing |
| 5. Untrusted EPUB content | Reader Core | Playwright test: load an EPUB containing `<script>postMessage(...)</script>`, assert no message reaches the host; CSP report-only initially, enforced before v1 |
| 6. Drag-and-drop hangs | Drag-and-Drop / Library UI | Playwright test corpus of malformed EPUBs; each surfaces a visible error within 30 s |
| 7. Persistence identifier discipline | Reader Core | Vitest unit tests on `bookId()`; Playwright cross-book leakage test |
| 8. Cross-LLM execution traps | Project Setup (and at every phase transition) | Phase plans contain explicit preconditions block; pre-merge checklist verifies no TODOs/skipped tests |
| 9. Repository bloat | Project Setup | `.gitignore` reviewed at setup; CI step `du -sh` enforces working-tree cap; pre-commit blocks files > 1 MB |
| 10. Cross-browser quirks | Test Infrastructure (matrix) + Reader Polish | Playwright runs Chromium + WebKit + Firefox on every PR; manual real-device QA before v1 |

---

## Sources

- [futurepress/epub.js — recent commits (memory-leak fixes, March 2026)](https://github.com/futurepress/epub.js/commits/master)
- [epub.js issue #688 — memory leak with zipped epubs](https://github.com/futurepress/epub.js/issues/688)
- [epub.js issue #1083 — iframe should support `sandbox`](https://github.com/futurepress/epub.js/issues/1083)
- [epub.js issue #1105 — fixed-layout `page-spread-*` properties](https://github.com/futurepress/epub.js/issues/1105)
- [epub.js issue #1069 — RTL fixed-layout `rendition.next()` not working](https://github.com/futurepress/epub.js/issues/1069)
- [epub.js issue #923 — failed to decode downloaded font (IDPF obfuscation)](https://github.com/futurepress/epub.js/issues/923)
- [epub.js issue #1194 — `rendition.display(cfi)` location after font-size change](https://github.com/futurepress/epub.js/issues/1194)
- [Lit — Working with Shadow DOM](https://lit.dev/docs/components/shadow-dom/)
- [Lit — Events (composed/bubbles semantics)](https://lit.dev/docs/components/events/)
- [Web Components & Lit — Security Pitfalls (Sachith Dassanayake, Feb 2026)](https://www.sachith.co.uk/web-components-lit-in-mixed-stacks-security-pitfalls-fixes-practical-guide-feb-15-2026/)
- [vite-plugin-singlefile (npm)](https://www.npmjs.com/package/vite-plugin-singlefile)
- [Vite — Static Asset Handling (`assetsInlineLimit`)](https://vite.dev/guide/assets)
- [fflate — high-performance streaming (de)compression](https://github.com/101arrowz/fflate)
- [unzipit — random-access blob-virtualised unzip](https://github.com/greggman/unzipit)
- [MDN — `URL.revokeObjectURL`](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static)
- [Take control of your scroll — `overscroll-behavior` (Chrome for Developers)](https://developer.chrome.com/blog/overscroll-behavior/)
- [Fixing iOS Safari viewport shift with `dvh`](https://medium.com/@krutilin.sergey.ks/fixing-the-safari-mobile-resizing-bug-a-developers-guide-6568f933cde0)
- [Playwright — Locators (Shadow DOM piercing)](https://playwright.dev/docs/locators)
- [Shadow DOM testing that doesn't flake (Playwright)](https://medium.com/@erik.amaral/shadow-dom-testing-that-doesnt-flake-using-playwright-1c9313d086d3)
- [Vitest + Lit + happy-dom — testing setup](https://lit.dev/docs/tools/testing/)
- [Sandboxed iframes (web.dev)](https://web.dev/articles/sandboxed-iframes)
- [IDPF Font Mangling Specification (1040-byte XOR algorithm)](https://idpf.org/epub/20/spec/FontManglingSpec.html)
- [foliate-js — modern alternative EPUB renderer](https://github.com/johnfactotum/foliate-js)
- [`.planning/codebase/CONCERNS.md` — local evidence the team has historically fallen into the object-URL, swallow-error, AppCache, and committed-`dist/` traps]

---
*Pitfalls research for: Browser-only EPUB reader (TS + Vite + Lit + epub.js)*
*Researched: 2026-04-26*
