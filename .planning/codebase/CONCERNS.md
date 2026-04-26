# Codebase Concerns

**Analysis Date:** 2026-04-26

## Tech Debt

**Build Toolchain (Grunt + Compass + Ruby SASS):**
- Issue: Build chain is anchored to abandoned/EOL tooling. Grunt 0.4.x (declared in `package.json`), Compass (declared dead by its maintainers in 2018) and Ruby SASS (officially sunset 2019). All `~0.x.x` semver pins in `package.json` predate the npm 5.x lockfile era, and there is no `package-lock.json` or `yarn.lock` in the repo, so installs are non-reproducible.
- Files: `package.json`, `Gruntfile.js`, `readk.it/sass/config.rb`, `readk.it/library/sass/config.rb`
- Impact: New developers cannot reproduce a clean build on modern Node/Ruby; transitive vulnerabilities cannot be patched without first migrating off Grunt-Contrib-Compass; deprecation warnings from Ruby gems on every build (see commit `b78f163` "Changes as a result of a new version of SASS/Compass").
- Fix approach: Migrate SASS compilation to `dart-sass` (drop Compass), and either modernise to Grunt 1.x with current contrib plugins, or replace the entire Grunt pipeline with `esbuild`/`rollup` + `sass` + `postcss`. Generate a lockfile against a known-good install.

**Forked Grunt Plugin Dependencies:**
- Issue: Three private Grunt plugins are pulled directly from a personal GitHub user (`jcdarwin/grunt-readkit-*`) at `master`, with no version pinning.
- Files: `package.json` (lines 15, 16, 21)
- Impact: Repository availability and contents can change at any moment; reproducible builds rely on personal GitHub uptime; supply-chain risk if the author's account is compromised.
- Fix approach: Pin to specific commit SHAs or tags. Long term, consolidate the three custom plugins into local Grunt tasks under `tasks/` to avoid the external dependency entirely.

**Node 0.11.16 Pinned via `.nvmrc`:**
- Issue: `.nvmrc` specifies `0.11.16`, an unstable prerelease of Node from 2014. This is years past EOL and unobtainable on modern macOS/Linux without legacy nvm gymnastics.
- Files: `.nvmrc`, `dist.0.11.16/`
- Impact: The build cannot be run on any modern developer machine; security tooling (e.g. `npm audit`) refuses to operate against this version; the existence of `dist.0.11.16/` and `dist.gianleap/` suggests the team has been side-stepping this constraint by checking in build outputs.
- Fix approach: Audit Gruntfile for Node-version-sensitive APIs, then bump to a current LTS (Node 20.x or 22.x) and refresh `.nvmrc`.

**Python 2 Manifest Generator:**
- Issue: `manifest.maker.py` uses Python 2 `print` statement syntax (`print "["`, `print comma`, `print "]"`) and Python 2 string handling (`title[0].text.encode('utf-8')`).
- Files: `readkit.epub/manifest.maker.py` (lines 26, 66, 101, 102, 104)
- Impact: Will not run under any Python 3 interpreter; Python 2 reached EOL in January 2020. The Gruntfile invokes this directly via `shell:make_manifest_*` on every default build (Gruntfile lines 401, 413, 426), so the entire library-mode build is broken on a default `python` binary today.
- Fix approach: Port to Python 3 (replace `print` statements with `print()`, use `bytes`/`str` correctly, optionally swap `lxml` for `defusedxml` for safer XML parsing). Update the Grunt `shell.command` lines to call `python3` explicitly.

**Bundled, Unpinned Vendor Libraries:**
- Issue: All third-party JS is committed verbatim under `readk.it/js/lib/` with no version metadata file (no `bower.json`, no `vendor.lock`). Versions discovered from file headers are 5+ to 13+ years old:
  - jQuery 2.0.3 (2013) — `readk.it/js/lib/jquery.js`
  - Lo-Dash 1.3.1 (2013) — `readk.it/js/lib/lodash.js`
  - Modernizr 2.6.2 (2012) — `readk.it/js/lib/modernizr.js`
  - RequireJS 2.1.8 (2013) — `readk.it/js/lib/require.js`
  - Detectizr 1.4.4 (2012) — `readk.it/js/lib/detectizr.js` (project itself is unmaintained since ~2018)
  - iScroll 4.1.9 (2011) — `readk.it/js/lib/iscroll.js` (project superseded by iScroll 5)
- Impact: Known security advisories exist against jQuery <3.5 (XSS via `$.htmlPrefilter`, CVE-2020-11022/11023) and Lo-Dash <4.17.21 (prototype pollution, CVE-2019-10744 etc.). No upgrade path exists without manual replacement. Many APIs used (jQuery `$.Deferred` chains, `wrapInner`, `parseXML`, `noClickDelay`) require code review before swapping.
- Fix approach: Move vendor libraries out of source control, declare them in `package.json`, and pin to current security-maintained releases. Where APIs have been removed (e.g. lodash now requires `_.fromPairs`, jQuery 3 changed `$.Deferred`), refactor call sites in `readk.it/js/app/`.

**AppCache (deprecated web standard):**
- Issue: Three `.appcache` files and matching `manifest=` markup are still in the tree. AppCache was officially removed from the HTML spec and dropped from Chrome 85 (2020) and Firefox 85.
- Files: `readk.it/readkit.appcache`, `readk.it/readkit.dev.appcache`, `readk.it/library/library.appcache`, `readk.it/library/offline.manifest`
- Impact: No browser shipping today honours these manifests; offline mode is silently broken. Worse, an AppCache manifest can poison browsers that *do* still understand it (AppCache Group hijack issues described in the linked alistapart article in `readkit.appcache` lines 5-6).
- Fix approach: Replace with a Service Worker + Cache Storage API implementation. Delete the `.appcache` files and any `<html manifest=…>` references.

**Browser-Sniffing & Vendor-Prefix Shims:**
- Issue: Codebase uses `Detectizr` for browser detection, `Modernizr` for feature flags, and explicit fallbacks for vendor-prefixed APIs (`window.URL || window.webkitURL`, `blob.slice = blob.slice || blob.webkitSlice`, `webkitCancelAnimationFrame`).
- Files: `readk.it/js/app/utility.js:97,143-167`, `readk.it/js/app/controller.js:164,349`, `readk.it/js/lib/iscroll.js:25-35`, `readk.it/js/lib/jquery.noClickDelay.js`
- Impact: All of these prefixes have been unprefixed for years in every supported browser. The shims add weight, complexity, and dead code paths. `Modernizr.Detectizr.detect` is invoked on every call to `utility.supported()` (`readk.it/js/app/utility.js:142-151`), wasting CPU on each font/UI toggle.
- Fix approach: Delete `Detectizr` entirely; replace any genuine feature checks with native `if ('IntersectionObserver' in window)`-style guards. Drop `noClickDelay` (300 ms tap delay was removed by browsers years ago when `<meta name="viewport">` is present, which `index.html` already sets).

**Custom AMD/RequireJS Loader:**
- Issue: All app code uses RequireJS 2.1.8 with custom shim configurations across `readk.it/js/readkit.js` and `Gruntfile.js`. RequireJS is functionally frozen and predates ES modules.
- Files: `readk.it/js/readkit.js`, `Gruntfile.js:448-512`, every `readk.it/js/app/*.js` (each begins with `define([...])`)
- Impact: New developers must learn an obsolete module system; bundlers/linters/IDEs treat the code as ambiguous globals; no tree-shaking; no native ESM interop.
- Fix approach: Migrate `define([...])` modules to ES module `import`/`export` and bundle via esbuild or rollup. Drop RequireJS.

**Deferreds and Async Patterns Predating Promises:**
- Issue: Code uses jQuery `$.Deferred` and `$.when.apply(this, $.map(...))` to coordinate async file loads.
- Files: `readk.it/js/app/controller.js:103-144,150-205`, `readk.it/js/app/chrome.js:589-639`
- Impact: Hard to reason about errors (no centralised `.catch`); inconsistent with native `Promise`; the empty `try/catch` blocks at `readk.it/js/app/layout.js:221-224,240-243` swallow exceptions silently.
- Fix approach: Migrate to `async`/`await` with native `Promise.all`. Add real error handling on the file-load paths so EPUBs that fail to parse surface a user-visible message rather than dying silently.

**Empty `package.json` Test Script:**
- Issue: `"test": "echo \"Error: no test specified\" && exit 1"`
- Files: `package.json:24`
- Impact: There are QUnit tests on disk (`readk.it/js/test/app/epub.test.js`, `readk.it/js/test/index.html`, `readk.it/js/test/testsuite.js`) but no automated way to run them. CI cannot verify regressions.
- Fix approach: Wire QUnit (or replace with Jest/Vitest) into `npm test`; add a Grunt `qunit` task or a headless runner.

**Auto-Generated Marker File (`content.js`):**
- Issue: `readk.it/js/app/content.js` is described as "A placeholder (replaced during the build process) for content data-URIs." but is committed and silently overwritten.
- Files: `readk.it/js/app/content.js`
- Impact: Build artifacts in source. Easy to introduce merge conflicts, easy to commit a real EPUB's Data URIs by accident.
- Fix approach: Move generated content output to `build/`; have the runtime fall back to `{}` when `content.js` is absent.

## Known Bugs

**Empty `try/catch` Swallows Layout Errors:**
- Symptoms: When iScroll fails to refresh after a click (e.g. unknown element id), the UI silently freezes instead of recovering.
- Files: `readk.it/js/app/layout.js:221-224`, `readk.it/js/app/layout.js:240-243`
- Trigger: Click an internal link whose target id has been mangled by the file-name rewriting at `readk.it/js/app/epub.js:189-197`.
- Workaround: None at runtime; user must reload the page.

**Double-Fire Event Handlers:**
- Symptoms: Author has hand-rolled a 700 ms ignore-window (`readkit_dropdown_size_ready`, `readkit_dropdown_lineheight_ready`, `readkit_dropdown_bookmark_ready`) because the click handler "always fires twice in certain browsers".
- Files: `readk.it/js/app/chrome.js:236-262, 307-?, 440-?`
- Trigger: Tap font-size, line-height, or bookmark icon in Firefox or Safari (per the inline comments).
- Workaround: The 700 ms debounce is the workaround; root cause (likely interaction between iScroll click synthesis and native click) is not addressed.

**Identifier Setter Bug in Font Storage:**
- Symptoms: When toggling to serif font, the wrong arity is passed to `utility.storage()`: four arguments instead of three.
- Files: `readk.it/js/app/chrome.js:230` — `utility.storage(identifier, identifier, 'font', 'serif');`
- Trigger: Switch font to serif and reload — the preference may not persist correctly.
- Workaround: None.

**Hard-Coded Minimum Height Tied to Original iPhone:**
- Symptoms: SVG (cover) images use `var minHeight = 480;` taken from "iPhone2G-4S as the min height".
- Files: `readk.it/js/app/controller.js:300-305`
- Trigger: Modern devices always exceed 480 px so this is mostly inert, but the comment notes "$(window).height() seems broken on Firefox" — meaning whichever bug forced this fallback may resurface.
- Workaround: Hard-coded constant.

**Fragile Path-Stripping for Image URLs:**
- Symptoms: `createURL` only strips a single leading `../` group, so deeper relative paths (e.g. `../../images/x.jpg`) land in the wrong content key.
- Files: `readk.it/js/app/controller.js:342-352` (carries an explicit `// TODO: Make this more robust`)
- Trigger: Open an EPUB whose images live more than one directory level above the chapter file.
- Workaround: None — image fails to render or shows broken-image icon.

**Drag-and-Drop `try/catch` Swallows Decode Failures:**
- Symptoms: When `zip.TextWriter` fails for a file inside a dropped EPUB, the `entry.getData` callback is never invoked; the outer `$.when` deferred therefore never resolves and the upload UI hangs.
- Files: `readk.it/js/app/chrome.js:598-612`
- Trigger: Drop an EPUB containing a malformed UTF-8 text entry.
- Workaround: Refresh the browser.

**iScroll 4 Snap to Page on Resize:**
- Symptoms: After a window resize, the wrong page may be shown (race between `book_scroller.refresh()` and a saved `currentPage`).
- Files: `readk.it/js/app/layout.js:151-165`
- Trigger: Rotate device or resize browser while not on page 0.
- Workaround: Manual scroll to correct page.

## Security Considerations

**No Content Security Policy:**
- Risk: Any XSS opportunity (see below) can load external scripts or exfiltrate localStorage.
- Files: `readk.it/index.html`, `readk.it/library/library.html` — no `Content-Security-Policy` meta tag in either entry document.
- Current mitigation: None.
- Recommendations: Add a strict default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; script-src 'self' policy. The reader needs `blob:` for image/CSS Object URLs and `data:` for the solo build's content URIs.

**Untrusted EPUB Content Injected via `.html()` and `wrapInner`:**
- Risk: EPUB content (third-party HTML fragments) is parsed with `$.parseXML(...).find('body').wrapInner('<div/>').html()` and inserted into the page via the templating layer. EPUBs can carry arbitrary `<script>`, event handlers, and SVG `<use>` elements pointing at remote URLs. The reader trusts the EPUB completely.
- Files: `readk.it/js/app/controller.js:121, 320-323, 324`, `readk.it/js/app/chrome.js:432, 652`, `readk.it/js/app/layout.js:181-186, 400-405`
- Current mitigation: None — any uploaded EPUB executes inside the same origin as the reader, with full access to localStorage, the book library manifest, and any other local content.
- Recommendations: Strip `<script>`, `on*=` attributes, and external `xlink:href` references during the `layout_publication` pass before insertion. Consider rendering chapter content inside a sandboxed `<iframe sandbox="allow-same-origin">` to constrain script execution.

**Microdata Fields Set with `.html()` (XSS via EPUB metadata):**
- Risk: EPUB-provided title/author/description/publisher strings are passed through `.html()`, not `.text()`.
- Files: `readk.it/js/app/layout.js:400-405`
- Current mitigation: None.
- Recommendations: Use `.text()` for metadata strings, or escape before injection.

**`escape()` / `unescape()` Used for UTF-8 Decoding:**
- Risk: `decodeURIComponent(escape(data))` is a deprecated UTF-8 decoding trick. `escape()` and `unescape()` were removed from the ECMAScript spec; they currently work as legacy compatibility but their behaviour around surrogate pairs is undefined.
- Files: `readk.it/js/app/utility.js:100, 103`
- Current mitigation: Wrapped in a regex check that the data URI declares UTF-8, but the decoding path itself is brittle.
- Recommendations: Replace with `new TextDecoder('utf-8').decode(...)` against the underlying `Uint8Array`.

**Object URLs Never Revoked:**
- Risk: Every chapter image, font, and stylesheet creates a `URL.createObjectURL(...)` blob URL. None are revoked when the EPUB is closed or replaced.
- Files: `readk.it/js/app/controller.js:165-170, 174-175, 350`
- Current mitigation: None — the URLs persist for the lifetime of the document.
- Recommendations: Track created URLs and call `URL.revokeObjectURL` in `Layout.reset()`.

**Web Workers Disabled on `file://` and "Solo" Builds:**
- Risk: Decompression therefore runs on the main thread, which prevents the UI from responding for the duration of a large EPUB load — masking attacks like decompression bombs.
- Files: `readk.it/js/app/chrome.js:585`
- Current mitigation: None.
- Recommendations: Cap decompressed size per entry, surface progress, abort on suspicious ratios.

**No Subresource Integrity on Vendor Bundles:**
- Risk: Although vendor libs are local, the production "solo" build inlines them as Data URIs without integrity hashes. There is no defence against a tampered bundle being shipped inside an EPUB.
- Files: `readk.it/index.html:154-157`, Gruntfile sections under `requirejs:compile_*`
- Recommendations: Add SRI hashes when emitting `<script>`/`<link>` tags during the build.

**Python `manifest.maker.py` Uses Bare `lxml.etree.fromstring`:**
- Risk: `lxml.etree.fromstring` without `defusedxml` is vulnerable to XML External Entity (XXE) and billion-laughs attacks. The script walks every `container.xml` under the working directory, parsing whatever it finds.
- Files: `readkit.epub/manifest.maker.py:34, 39, 61`
- Current mitigation: None.
- Recommendations: Replace with `defusedxml.lxml.fromstring` or pass an `XMLParser(resolve_entities=False, no_network=True)` instance.

## Performance Bottlenecks

**Synchronous Inflation of Dropped EPUBs:**
- Problem: When loaded from `file://` or as a "solo" build, zip inflation runs on the main thread, blocking the UI.
- Files: `readk.it/js/app/chrome.js:585-639`
- Cause: Web Workers are disabled in those modes (CSP/file: scheme limitations).
- Improvement path: Lazy-decompress only the entries needed for the current chapter; switch to streaming inflation (e.g. `fflate`) so even main-thread decompression yields between chunks.

**`Modernizr.Detectizr.detect` Re-runs on Every UI Toggle:**
- Problem: `utility.supported()` calls `Modernizr.Detectizr.detect({...})` every time it is invoked, which is on every font/line-height/bookmark interaction.
- Files: `readk.it/js/app/utility.js:142-167`
- Cause: No memoisation; all detect flags are also enabled (`detectDeviceModel`, `detectScreen`, `detectOS`, `detectBrowser`).
- Improvement path: Detect once at boot, cache the result on a module-level constant, or remove Detectizr entirely.

**Polling-Based Resize Loop:**
- Problem: Two timers (`resize_interval: 1000`, `window_resize_interval: 100`, `css_redraw_interval: 5000`) poll for layout changes.
- Files: `readk.it/js/app/config.js:21-38`, `readk.it/js/app/chrome.js:206-214,259-262`
- Cause: Pre-`ResizeObserver` workaround.
- Improvement path: Replace with `ResizeObserver` and `MutationObserver`. Drop the timers.

**Per-Page jQuery Click Handler Bind Loop:**
- Problem: For every chapter added, three additional click handlers are bound (`#<file>`, `#<file> button`, `#<file> a`) using IDs that may contain CSS-special characters which then need manual escaping.
- Files: `readk.it/js/app/layout.js:209-251`
- Cause: Per-page binding instead of event delegation.
- Improvement path: Single delegated handler at `#readkit-pageScroller`, dispatching by closest matching ancestor.

**Large Repository Working Tree:**
- Problem: Repository contains 285 MB `dist/`, 229 MB `dist.0.11.16/`, 151 MB `dist.gianleap/`, plus 38 MB of `readkit.epub/` sample bundles, plus 32 MB `node_modules/`. Total working tree dwarfs the 32 MB `.git` directory itself.
- Files: `dist/`, `dist.0.11.16/`, `dist.gianleap/`, `readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/`, `readkit.epub/01_*` through `readkit.epub/26_*` (27 directories per `git status`)
- Cause: Build outputs are committed (multiple historical variants); EPUB samples committed verbatim; `node_modules/` previously committed and still present locally.
- Improvement path: Add `dist/`, `dist.*/`, and `node_modules/` to `.gitignore` and `git rm --cached` them; move EPUB samples to a separate fixtures repo or a release artifact.

## Fragile Areas

**EPUB Path/ID Rewriting:**
- Files: `readk.it/js/app/epub.js:138, 145, 181-197, 213-243`, `readk.it/js/app/controller.js:229-265, 342-352`
- Why fragile: Multiple regexes interconvert filesystem paths, URL fragments, and DOM ids using ad-hoc rules (`/`, `#`, `.` substitution). Any non-ASCII filename, multi-level relative path, or encoded URL fragment can break navigation. There is no central canonical-id function.
- Safe modification: Add unit tests covering non-trivial fragments, deep paths, and percent-encoded names before refactoring; centralise path-canonicalisation into a single utility.
- Test coverage: Only `readk.it/js/test/app/epub.test.js` exists for the entire EPUB layer, and it is not wired into `npm test`.

**Layout / iScroll Timing:**
- Files: `readk.it/js/app/layout.js:131-148, 180-254, 256-365`, `readk.it/js/app/chrome.js:206-214, 268-276, 339-347`
- Why fragile: Layout depends on a chain of `setTimeout(..., 0)` and 1 s/5 s redraw windows. Adding/removing pages races against iScroll refreshes.
- Safe modification: Avoid touching iScroll initialisation order. Run the QUnit test suite in a real browser before committing layout changes.
- Test coverage: None for the layout layer.

**Drag-and-Drop EPUB Pipeline:**
- Files: `readk.it/js/app/chrome.js:560-695`
- Why fragile: Coordinated via shared module-level `progress_total`, ad-hoc deferred fan-out, and a global `files` array passed back into `controller.initialise(...)`. Any thrown error inside the per-entry callback halts the deferred chain without releasing the upload UI.
- Safe modification: Always exercise drag-and-drop with at least one EPUB 2 and one EPUB 3 sample after touching this file.
- Test coverage: None.

**Build Pipeline Dynamic Tasks:**
- Files: `Gruntfile.js:36-51, 1015-1232+ (registerTask sections)`
- Why fragile: Tasks are generated at runtime from `manifest.json` (which itself depends on the broken Python 2 script). Build configuration is stored across the file in 1300+ lines of fragmentary objects with shared state via the top-level `globals` variable (`Gruntfile.js:28-34`).
- Safe modification: Change one identifier at a time and run `grunt --verbose` to confirm task generation; expect cryptic errors if `manifest.json` is missing.
- Test coverage: None.

## Scaling Limits

**Single-Spine Page Strategy:**
- Current capacity: Each EPUB chapter is rendered into a single `readkit-page` div placed side-by-side in `#readkit-pageScroller`, with width = `page_width * pages` (`readk.it/js/app/layout.js:152-155`).
- Limit: Memory and DOM size grow linearly with chapters. Books with hundreds of chapters or large embedded images will exhaust mobile-browser memory.
- Scaling path: Lazy-mount chapters into the DOM as they enter the viewport; recycle off-screen chapters.

**localStorage as Sole Persistence:**
- Current capacity: Bookmarks, current page, font choice, line-height, and history are all stored under per-EPUB identifier in `localStorage`.
- Limit: Browser localStorage caps (usually 5-10 MB). Large bookmark histories across many books will silently exceed quota with no error path.
- Files: `readk.it/js/app/utility.js:30-58, 113-115`
- Scaling path: Move to IndexedDB; add quota error handling.

**Solo Build Embeds Entire EPUB as Data URIs:**
- Current capacity: All assets concatenated into `content.js`.
- Limit: Single-file size and parse time. Large image-heavy EPUBs become unloadable in mobile browsers (Safari's per-document JS heap limit, Chrome's blob-URL number caps).
- Files: `readk.it/js/app/content.js`, Gruntfile sections invoking `grunt-readkit-data-uri`
- Scaling path: Switch solo builds to a packed-zip approach decompressed at runtime.

## Dependencies at Risk

**`grunt-contrib-compass`:**
- Risk: Wraps the Compass Ruby gem, which has been unmaintained for years. Compass requires Ruby SASS, also EOL.
- Impact: Cannot install on modern Ruby; CSS cannot be rebuilt.
- Migration plan: Drop Compass; rewrite SCSS in terms supported by `dart-sass`; replace any Compass mixins (sprites, vendor prefixes) with PostCSS Autoprefixer + manual mixins.

**`grunt-bake`, `grunt-image-embed`:**
- Risk: Both packages are abandoned (no commits in 5+ years). They underpin the `<!--(bake ...)-->` token replacement in `index.html` (`Gruntfile.js:95-99`) and the inline image embedding for the solo build.
- Impact: No upstream security fixes; cannot be installed on a modern npm without `--legacy-peer-deps`.
- Migration plan: Replace `bake` with a small custom Grunt/esbuild plugin or just `fs.readFileSync` in a build script. Replace image embedding with explicit Base64 conversion in the build script.

**`jQuery 2.0.3`:**
- Risk: Multiple known CVEs (XSS via `htmlPrefilter`, prototype-pollution via `$.extend(true, ...)`).
- Impact: All EPUB DOM manipulation uses jQuery; user-uploaded EPUBs trigger most of the affected code paths.
- Migration plan: Bump to jQuery 3.7+; verify `$.parseXML`, `$.Deferred`, and `$.event.trigger` call sites still behave (3.x dropped some legacy event aliases). Long-term: replace with native DOM APIs.

**`Lo-Dash 1.3.1`:**
- Risk: CVE-2019-10744 (prototype pollution in `defaultsDeep`) and others fixed in 4.17.x.
- Impact: Any EPUB-supplied object pushed through lodash could trigger pollution.
- Migration plan: Bump to lodash 4.17.21+. Verify `_.filter`, `_.isNumber` (the only lodash methods used) still match.

**`Modernizr 2.6.2` and `Detectizr 1.4.4`:**
- Risk: Both effectively abandoned; Modernizr 3.x is a different API.
- Impact: Mostly inert (used only in `utility.supported()`).
- Migration plan: Delete both; replace with native feature detection at the two call sites that need it.

**`iScroll 4.1.9`:**
- Risk: Project superseded by iScroll 5; touch and pointer-event handling has not kept up with modern mobile browsers.
- Impact: Pinch-zoom, tap, and momentum scrolling rely on this library across the entire reader UI.
- Migration plan: Evaluate native CSS `scroll-snap` + `overflow: auto` for the page-scroller use case; iScroll 5 if a JS solution is still needed.

**`requirejs/text` and `require-css`:**
- Risk: Both tied to the abandoned RequireJS ecosystem.
- Impact: Only relevant if the RequireJS migration listed above is undertaken; will simply fall away when ESM bundling replaces it.
- Migration plan: Use bundler-native string and CSS imports.

## Missing Critical Features

**No Service Worker / PWA Manifest:**
- Problem: The "offline reader" promise is delivered via dead AppCache only. There is no Web App Manifest and no Service Worker.
- Blocks: True offline use on modern browsers; install-to-home-screen on Android; cross-tab cache sharing.

**No Automated Tests in CI:**
- Problem: QUnit suite exists in `readk.it/js/test/` but is unreachable from `npm test`. There is no CI configuration file (`.github/workflows/`, `.gitlab-ci.yml`, etc.).
- Blocks: Safe refactoring; dependency upgrades.

**No Accessibility Audit:**
- Problem: The reader UI uses custom icon spans without `aria-label`, no skip-to-content links, no focus management on dropdown panels.
- Files: `readk.it/index.html:62-121`
- Blocks: Use by screen-reader users; legal accessibility compliance for publishers.

**No Real Error Surfacing:**
- Problem: Failures are routed through `utility.error()` → `console.error()` only (`readk.it/js/app/utility.js:133-139`). Users see a stalled UI with no message.
- Blocks: Diagnosing user reports; bug reporting.

**No Build Output Validation:**
- Problem: The build can complete with a broken `manifest.json` (Python 2 failure) or a missing chapter and the produced `dist/` will look superficially correct.
- Blocks: Confidence in releases.

## Test Coverage Gaps

**Entire Layout/Chrome Layer:**
- What's not tested: All UI behaviour — bookmarks, font/line-height switching, drag-and-drop EPUB upload, navigation history, anchor traps.
- Files: `readk.it/js/app/layout.js`, `readk.it/js/app/chrome.js`, `readk.it/js/app/controller.js`
- Risk: Refactors break user-visible behaviour silently. Browser-quirk regressions reappear.
- Priority: High.

**EPUB Parsing Edge Cases:**
- What's not tested: EPUB 3 nav documents, EPUB without NCX, multi-level NCX hierarchies, files with namespaces, percent-encoded paths, DRM-marked files.
- Files: `readk.it/js/app/epub.js` (only smoke-tested by `readk.it/js/test/app/epub.test.js`)
- Risk: Reader silently mis-orders chapters or omits them.
- Priority: High.

**Persistence Layer:**
- What's not tested: `utility.storage()` getter/setter, history stack, bookmark serialisation.
- Files: `readk.it/js/app/utility.js:30-58`
- Risk: Quota errors, history corruption, cross-book leakage.
- Priority: Medium.

**Build Pipeline:**
- What's not tested: Grunt task graph, manifest generation, solo-build Data URI emission.
- Files: `Gruntfile.js`, `readkit.epub/manifest.maker.py`
- Risk: Releases ship corrupt; manifest changes silently break library mode.
- Priority: Medium.

**Vendor Library Compatibility:**
- What's not tested: No fixtures verifying that an upgraded jQuery/lodash/iScroll still drives the reader correctly.
- Risk: Blocks all dependency upgrades.
- Priority: High (blocking for security upgrades).

---

*Concerns audit: 2026-04-26*
