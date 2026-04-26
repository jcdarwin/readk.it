# Technology Stack

**Analysis Date:** 2026-04-26

## Languages

**Primary:**
- JavaScript (ES5) — All runtime application code (`readk.it/js/**/*.js`). No transpiler in use; code is written in browser-targeted ES5.
- SCSS / SASS — Stylesheets compiled via Compass (`readk.it/sass/readkit-screen.scss`, `readk.it/library/sass/styles.scss`).

**Secondary:**
- Python 2 — Build-time helper script for generating EPUB manifests (`readkit.epub/manifest.maker.py`). Uses Python 2 print-statement syntax (`print "[" `).
- HTML — Application shell (`readk.it/index.html`, `readk.it/library/library.html`) plus the EPUB content sources under `readkit.epub/<book>/OEBPS/*.html`.
- Ruby — Required only as host runtime for the Compass SASS toolchain (no `.rb` source code apart from Compass config files).

## Runtime

**Environment:**
- Browser-only at runtime (no Node.js server). Targets "modern browsers, including Internet Explorer 10" per `README.md`.
- Application loaded either by double-clicking `index.html` (file URL) or via any static web server (e.g. `http-server` is suggested in `README.md`).
- HTML5 Application Cache (`readk.it/readkit.appcache`, `readk.it/readkit.dev.appcache`, `readk.it/library/library.appcache`, `readk.it/library/offline.manifest`) for offline support.
- Web Workers used by `zip.js` for EPUB unzip (`readk.it/js/lib/zip/`) — `workerScriptsPath: "js/lib/zip/"` in `readk.it/js/app/config.js`.

**Build-time runtimes:**
- Node.js — Pinned via `.nvmrc` to `0.11.16` (a very old unstable v0.11 line; the toolchain is from ~2013).
- Python 2.x — Required for `readkit.epub/manifest.maker.py`; depends on `lxml` (`pip install lxml`).
- Ruby + Compass — Required to compile SASS (`grunt-contrib-compass` shells out to Compass).

**Package Manager:**
- npm (CommonJS-style `package.json`)
- Lockfile: missing (no `package-lock.json`, no `npm-shrinkwrap.json` at root). A nested `npm-shrinkwrap.json` is referenced in `README.md` for `grunt-readkit-dom-munger` patches.

## Frameworks

**Core (browser, runtime):**
- jQuery 2.0.3 — DOM and event API (`readk.it/js/lib/jquery.js`). v2 chosen explicitly to drop legacy IE support.
- RequireJS 2.1.8 — AMD module loader and main entry-point bootstrap (`readk.it/js/lib/require.js`, `readk.it/js/readkit.js`).
- iScroll 4.1.9 — Touch / momentum scrolling for the reader pane (`readk.it/js/lib/iscroll.js`).
- Modernizr 2.6.2 — Feature detection (`readk.it/js/lib/modernizr.js`).
- Detectizr 1.4.4 — Device / browser classification (`readk.it/js/lib/detectizr.js`).
- Lo-Dash 1.3.1 (custom "modern" build) — Utility library (`readk.it/js/lib/lodash.js`).
- zip.js (Gildas Lormeau, 2013) — Client-side EPUB unzipping with web workers (`readk.it/js/lib/zip/{zip,inflate,deflate,zip-ext,zip-fs,mime-types}.js`).
- Sly 1.1.0 — Library carousel/scroller for the `readkit.library` flavour (`readk.it/library/js/lib/sly.js`).
- Underscore 1.4.3 (AMD minified build) — Used only by the library bundle (`readk.it/library/js/lib/underscore-min.amd.js`).
- QUnit 1.10.0 — Manual test harness (`readk.it/js/test/qunit/qunit.js`).

**RequireJS plugins:**
- `text` 2.0.9 — Text/template loader (`readk.it/js/lib/text.js`).
- `require-css` — CSS loader plugin (`readk.it/js/lib/require-css/css.js`, `normalize.js`).

**jQuery plugins (all bundled, not via npm):**
- `jquery.ba-resize.js` (Cowboy Ben Alman, v1.1) — Resize event polyfill.
- `jquery.ba-urlinternal.js` (Cowboy Ben Alman, v1.0) — Internal/external URL test helper.
- `jquery.hotkeys.js` (John Resig, MIT/GPL) — Keyboard shortcut bindings.
- `jquery.storage.js` 0.0.3 — localStorage/sessionStorage wrapper.
- `jquery.noClickDelay.js` (cubiq.org) — Removes the iOS 300ms tap delay.
- `jquery.ui.totop.js` (UItoTop 1.2 by Matt Varone) — "Back to top" button.
- Add to Homescreen 2.0.7 (Matteo Spinelli) — iOS install prompt (`readk.it/js/lib/add-to-homescreen/`).

**Templating:**
- TinyTim ("Tim lite", Premasagar Rose) — Tiny micro-template engine used inline via `<script type="text/tim">` blocks in `readk.it/index.html` (`readk.it/js/lib/tinytim.js`).

**Styling toolchain:**
- Compass — Imported at the top of `readk.it/sass/readkit-screen.scss` (`@import "compass";`). Configured by `readk.it/sass/config.rb` and `readk.it/library/sass/config.rb`.
- Fontello — Custom icon-font subset (`readk.it/fonts/fontello/`, `readk.it/css/fontello.css`).
- Web fonts: Lora (serif) and Source Sans Pro (sans-serif) under `readk.it/fonts/Lora/` and `readk.it/fonts/SourceSansPro/`.

**Testing:**
- QUnit 1.10.0 (browser harness at `readk.it/js/test/index.html`, suite list in `readk.it/js/test/testsuite.js`, fixture tests under `readk.it/js/test/app/`).
- `grunt-contrib-nodeunit` ~0.2.0 is listed in `package.json` but the `nodeunit` task in `Gruntfile.js` is commented out and the loader call is also commented out (`// grunt.loadNpmTasks('grunt-contrib-nodeunit');`).
- The npm test script is a stub: `"test": "echo \"Error: no test specified\" && exit 1"`.

**Build / Dev:**
- Grunt 0.4.1 (installed: 0.4.2) — Top-level build orchestrator (`Gruntfile.js`, 1345 lines).
- `grunt-cli` — Required globally (`npm install -g grunt-cli`, per `README.md`).
- `grunt-contrib-clean` ~0.4.1 — Pre/post build cleanup (`dist/`, `build/`, `.sass-cache/`).
- `grunt-contrib-concat` ~0.3.0 — Concatenates compiled CSS.
- `grunt-contrib-compass` ~0.2.0 — SASS via Compass.
- `grunt-contrib-cssmin` ~0.6.1 — CSS minification.
- `grunt-contrib-jshint` ~0.6.0 — JS lint over `Gruntfile.js` and `readk.it/**/*.js` (libs and tests are ignored).
- `grunt-contrib-copy` ~0.4.1 — Heavy use; the bulk of the build pipeline copies files between `readk.it/`, `readkit.epub/`, `build/`, and `dist/{readkit.epub,readkit.solo,readkit.library,readkit.reader}`.
- `grunt-contrib-requirejs` ~0.4.1 — Bundles AMD modules into `build/readkit.js`.
- `grunt-shell` ~0.3.0 — Shells out for `python manifest.maker.py`, `zip`, `mv`, `dir`.
- `grunt-bake` ~0.2.1 — Inlines `<!--(bake ...)-->` partials when constructing solo HTML.
- `grunt-image-embed` ~0.3.1 — Inlines images into CSS as data URIs.
- `grunt-readkit-dom-munger` (forked from `grunt-dom-munger`, git+https://github.com/jcdarwin/grunt-readkit-dom-munger.git#master) — DOM rewriting on HTML/OPF files. README documents required hand-patches.
- `grunt-readkit-datauris` (git+https://github.com/jcdarwin/grunt-readkit-datauris.git#master) — Data-URI generation for solo flavour.
- `grunt-readkit-data-uri` (git+https://github.com/jcdarwin/grunt-readkit-data-uri.git#master) — Single-file data-URI assembly. Note: separate package from the previous one.

## Key Dependencies

**Critical (runtime):**
- `jquery` 2.0.3 — Hard dependency of nearly every app module.
- `requirejs` 2.1.8 — Module system; `readk.it/js/readkit.js` calls `require.config` and bootstraps the app.
- `iscroll` 4.1.9 — Without it, scrolling/paging UX collapses.
- `zip.js` — Required for the drag-and-drop EPUB upload feature; uses web workers.
- `text` (RequireJS plugin) — Loads EPUB XHTML files at runtime.

**Critical (build):**
- `grunt` 0.4.x — Entire build assumes the legacy 0.4 task API.
- `grunt-readkit-dom-munger` and the two `grunt-readkit-data*` plugins — Held in personal forks on GitHub (`github.com/jcdarwin/...`) with no version pinning beyond `#master`. README documents manual patches that must be re-applied.
- Python 2 + `lxml` — Required to generate `readkit.epub/manifest.json` before any Grunt task runs.
- Ruby + Compass gem — Required for SASS compilation.

**Infrastructure:**
- HTML5 Application Cache (`*.appcache`) — Offline storage strategy.
- Web Workers (zip.js) — Background EPUB decompression.
- Schema.org Book microdata — Embedded in `readk.it/index.html` (`itemprop="name"`, `itemprop="author"`, etc.).

## Configuration

**Environment:**
- No environment variables. No `.env` files exist.
- All runtime configuration lives in source files committed to the repo:
  - `readk.it/js/app/config.js` — App-wide settings: `epub_directory`, `resize_interval`, `window_resize_interval`, `check_status_interval`, `css_redraw_interval`, `css_page_redraw_interval`, `scroll_duration`, `lite` (toggles a smaller "lite" build), `log`, `workerScriptsPath`, `mode` (`publication` | `solo` | `reader`).
  - `readk.it/js/client.config.js` — Per-EPUB extension hook for additional AMD paths/modules/shims (see `README.md` "client.config.js" section).
  - `readk.it/library/js/library.client.config.js` — Library-mode equivalent.
- `Gruntfile.js` mutates `js/app/config.js` between modes during the build via `config_mode_publication`, `config_mode_reader`, `config_mode_solo` tasks (regex replace on the `mode:` field).

**Build:**
- `Gruntfile.js` — Single 1345-line build definition with both static and dynamically-generated tasks (one task set per EPUB found in `readkit.epub/manifest.json`).
- `package.json` — npm dev deps and a stub `test` script.
- `.nvmrc` — Pins Node to `0.11.16`.
- `readk.it/sass/config.rb`, `readk.it/library/sass/config.rb` — Compass project configuration (paths only).
- `readk.it/readkit.appcache`, `readk.it/readkit.dev.appcache`, `readk.it/library/library.appcache`, `readk.it/library/offline.manifest` — App-cache manifests.
- `readk.it/readkit.js` — Runtime RequireJS configuration (paths, shims, required modules).

## Platform Requirements

**Development:**
- Node.js 0.11.16 (per `.nvmrc`) and npm.
- `grunt-cli` installed globally.
- Python 2.x with `lxml` (`pip install lxml`).
- Ruby with Compass (`gem install compass`).
- Standard POSIX shell utilities for `grunt-shell` tasks (`zip`, `mv`, `dir`).

**Production:**
- No production server-side runtime — output is one or more of:
  - `dist/readkit.epub/` — EPUBs containing the reader, valid for any EPUB reader.
  - `dist/readkit.solo/` — Single self-contained HTML files (data URIs).
  - `dist/readkit.library/` — Static library site.
  - `dist/readkit.reader/` — Standalone drag-and-drop reader HTML file.
- Any static web server (e.g. `http-server`, nginx, Apache) is sufficient. The README suggests serving from the EPUB root directory so URLs like `http://localhost:8000/OEBPS/readk.it/` resolve correctly.

---

*Stack analysis: 2026-04-26*
