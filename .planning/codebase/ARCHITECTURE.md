<!-- refreshed: 2026-04-26 -->
# Architecture

**Analysis Date:** 2026-04-26

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        Browser (HTML page)                              │
│           `readk.it/index.html`  /  `readk.it/library/library.html`     │
│                                                                         │
│   Inline boot scripts:                                                  │
│     <script id="readkit-client" src="js/client.config.js">              │
│     <script id="readkit-entry"  data-main="js/readkit"                  │
│                                 src="js/lib/require.js">                │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │ require.js (AMD) bootstraps
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  Reader entry (RequireJS bootstrap)                     │
│                       `readk.it/js/readkit.js`                          │
│   • Builds the require.config (paths/shims) by mixing in `client`       │
│   • require([...]) the top-level modules below                          │
│   • new Controller(book, content.URIs, () => trigger 'kickoff')         │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌────────────────┐ ┌────────────────────┐
│ app/config   │ │ app/content  │ │ app/controller │ │ add-to-homescreen/ │
│ `…/app/      │ │ `…/app/      │ │ `…/app/        │ │  src/add2home`     │
│  config.js`  │ │  content.js` │ │  controller.js`│ │ (3rd-party prompt) │
│ (settings)   │ │ (data URIs   │ │  Orchestrates  │ └────────────────────┘
│              │ │  for solo    │ │  Epub→Layout→  │
│              │ │  build)      │ │  Chrome        │
└──────────────┘ └──────────────┘ └────┬───────────┘
                                       │ uses
                ┌──────────────┬───────┼──────────────┬──────────────┐
                ▼              ▼       ▼              ▼              ▼
        ┌─────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐
        │ app/epub    │ │ app/layout │ │ app/chrome │ │ app/util │ │ vendor   │
        │ `…/app/     │ │ `…/app/    │ │ `…/app/    │ │ `…/app/  │ │ `js/lib/`│
        │  epub.js`   │ │  layout.js`│ │  chrome.js`│ │  util.js`│ │ jquery,  │
        │ Parses OPF/ │ │ Renders    │ │ UI         │ │ pubsub/  │ │ iScroll, │
        │ NCX, builds │ │ pages,     │ │ controls,  │ │ storage/ │ │ zip.js,  │
        │ spine[],    │ │ iScroll    │ │ font/size, │ │ tinytim, │ │ lodash,  │
        │ css[],      │ │ wrappers,  │ │ bookmarks, │ │ Modernizr│ │ require- │
        │ nav[]       │ │ history    │ │ drag&drop  │ │/Detectizr│ │ css      │
        └─────┬───────┘ └─────┬──────┘ └─────┬──────┘ └──────────┘ └──────────┘
              │ XHR / text!   │ DOM / IScroll│ jQuery DOM events
              ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  EPUB content (served or embedded)                      │
│   `META-INF/container.xml` → `OEBPS/content.opf` → spine .xhtml + .css  │
│   Or, in solo mode: data URIs inlined into `js/app/content.js`          │
│   Or, drag-and-drop: zip.js (`js/lib/zip/`) inflates dropped .epub      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    Library entry (separate page)                        │
│  `readk.it/library/library.html` → `library/js/main.js` →               │
│    `library/js/app/controller.js` → Sly carousel of cover images        │
│    Reads `readkit.epub/manifest.json` (built by `manifest.maker.py`)    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          Build pipeline (Grunt)                         │
│   `Gruntfile.js`                                                        │
│   • shell: `python readkit.epub/manifest.maker.py > manifest.json`      │
│   • compass: SCSS → CSS  (`readk.it/sass/` & `readk.it/library/sass/`)  │
│   • cssmin + concat + imageEmbed → `build/readkit/css/screen.css`       │
│   • requirejs: r.js compile → `build/readkit.js` (single AMD bundle)    │
│   • readkit-dom-munger: rewrite index.html script/link refs             │
│   • readkit-data-uri / image-embed: inline assets for solo flavour      │
│   • bake: inline screen.css + readkit.js into one HTML (solo/reader)    │
│   • copy: fan-out to dist/readkit.{reader,epub,solo,library}/           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Boot HTML | Hosts the reader chrome markup, declares two `<script>` tags (client config + RequireJS entry) | `readk.it/index.html` |
| Library boot HTML | Hosts the carousel chrome and a single RequireJS entry | `readk.it/library/library.html` |
| Reader bootstrap | Builds RequireJS config (mixing in `client.paths/shims/required`), instantiates `Controller`, fires `kickoff` event | `readk.it/js/readkit.js` |
| Client config (default) | Empty stub; per-EPUB overrides live in each book's `OEBPS/readk.it/js/client.config.js` | `readk.it/js/client.config.js` |
| Reader config | Tunable runtime settings (mode, polling intervals, lite flag, tags affected by font/size changes, `epub_directory` path) | `readk.it/js/app/config.js` |
| Reader content | Placeholder AMD module exporting `URIs:{}`; the build replaces it with base-64 data URIs for the solo flavour | `readk.it/js/app/content.js` |
| Controller | Top-level orchestrator: chooses load strategy (XHR, file://, drag-drop, solo URIs), wires up `Epub` → `Layout` → `Chrome`, kicks off `text!`-plugin async loads of HTML/CSS, drives `layout_publication` once deferreds resolve | `readk.it/js/app/controller.js` |
| Epub | Pure parser: fetches `META-INF/container.xml`, then OPF, then NCX/Nav. Populates `spine_entries[]`, `css_entries[]`, `nav_entries[]`, plus DC metadata (title, author, publisher, identifier, version) | `readk.it/js/app/epub.js` |
| Layout | Renders one `.readkit-page` per spine entry, wraps each in an `IScroll` (`page_scrollers[]`) inside a master horizontal `IScroll` (`book_scroller`). Persists position/bookmarks/history into `localStorage` via `utility.storage` | `readk.it/js/app/layout.js` |
| Chrome | All UI controls: back button, font/serif/sans toggle, font-size + line-height steppers, bookmarks (tinytim templates inline in `index.html`), online/offline check, drag-and-drop EPUB upload, hotkeys | `readk.it/js/app/chrome.js` |
| Utility | Cross-cutting helpers: `subscribe/publish/unsubscribe` (jQuery-event pubsub), `storage()` get/set wrapper around `$.localStorage`, `compile()` (tinytim), `decode()` (data URI → Blob), `isTextFile()`, feature gating via Modernizr/Detectizr | `readk.it/js/app/utility.js` |
| Library controller | Loads `manifest.json`, builds a Sly horizontal carousel of cover images, navigates to the chosen `solo/*.html` (solo mode) or `../index.html#library/<path>` (publication mode) | `readk.it/library/js/app/controller.js` |
| Library config | Two switches: `manifest` filename and `solo:true|false` (drives URL strategy above) | `readk.it/library/js/app/config.js` |
| Manifest maker | Walks `readkit.epub/*/META-INF/container.xml`, parses each OPF with lxml, emits a JSON array `{name,version,identifier,path,total_pages,cover,solo}` | `readkit.epub/manifest.maker.py` |
| Build orchestrator | Grunt pipeline that produces the four flavours; reads `manifest.json` and dynamically generates per-EPUB tasks | `Gruntfile.js` |
| SCSS roots | Compass entry for the reader chrome / for the library | `readk.it/sass/readkit-screen.scss`, `readk.it/library/sass/styles.scss` |
| Compass config | Path layout (`http_path`, `css_dir`, `sass_dir`, `fonts_dir`, `images_dir`) | `readk.it/sass/config.rb`, `readk.it/library/sass/config.rb` |

## Pattern Overview

**Overall:** AMD-modular client-side application built around a request-driven Controller that composes three single-instance services (Epub parser, Layout renderer, Chrome controller) over a shared pubsub channel. Build-time the same source is fanned out into four deployment "flavours" by Grunt.

**Key Characteristics:**
- **No backend.** Everything runs in the browser. The "server" is whatever serves static files (the README points at `node http-server`).
- **AMD/RequireJS** is the only module system. Every app file is a `define([...], function(){})` call. There is no ES module syntax, no bundler beyond `r.js`, no transpilation step.
- **jQuery-centric.** jQuery is the DOM API, the AJAX layer (`$.get`, `$.getJSON`), the deferred/promise primitive (`$.Deferred`, `$.when`), the pubsub bus (`$({})` + `on/off/trigger`), and the storage facade (via the `jquery.storage` plugin).
- **Per-EPUB plug-in surface.** Each EPUB carries its own `client.config.js` declaring extra `paths`, `required` modules, and `shims` that get merged into the reader's RequireJS config at boot — letting publications inject their own JS (e.g. `enquire`, `screenfull`, `jquery.easing`) without touching reader source.
- **Four build flavours from one source tree** (see `dist/readkit.{solo,library,epub,reader}/`); the differences are produced entirely by Grunt task composition, not by source-level branching.

## Layers

**Presentation / DOM (HTML + SCSS):**
- Purpose: provides the reader chrome (header bar, drop-zones, page wrapper) and the markup of all UI widgets, including inline `<script type="text/tim">` tinytim templates for the bookmark widget.
- Location: `readk.it/index.html`, `readk.it/library/library.html`, `readk.it/sass/`, `readk.it/css/`
- Contains: HTML scaffolding, SCSS partials, fontello icon font, plain-CSS overlays (`add2home.css`, `drag_and_drop.css`, `ui-totop.css`, `custom.css`)
- Depends on: nothing (it is the bottom of the runtime stack)
- Used by: Chrome (which queries/mutates these elements) and Layout (which appends `.readkit-page` children to `#readkit-pageScroller`)

**Bootstrap layer (RequireJS configuration):**
- Purpose: configure AMD paths/shims (mixing in per-publication `client` overrides), then `require()` the top-level modules and instantiate the Controller.
- Location: `readk.it/js/readkit.js`, `readk.it/js/client.config.js`, `readk.it/library/js/main.js`, `readk.it/library/js/library.client.config.js`
- Contains: literal `require.config({ baseUrl, paths, shim, map })` calls and the single `require([...], cb)` that starts the app.
- Depends on: `js/lib/require.js`, the `client` global set by `client.config.js`
- Used by: nothing — this is the entry point

**Application layer (`js/app/`):**
- Purpose: the actual reader. Pure browser JS, no DOM-template fragments — markup lives in `index.html` and is queried by selector.
- Location: `readk.it/js/app/`
- Contains: `controller.js`, `epub.js`, `layout.js`, `chrome.js`, `config.js`, `content.js`, `utility.js`
- Depends on: vendor libs in `js/lib/`
- Used by: only the bootstrap layer (`readk.it/js/readkit.js`)

**Vendor / shim layer (`js/lib/`):**
- Purpose: bundled third-party libraries. None are managed by npm at runtime; they are checked into the source tree.
- Location: `readk.it/js/lib/`
- Contains: `jquery.js`, `iscroll.js`, `lodash.js`, `modernizr.js`, `detectizr.js`, `require.js`, `text.js`, `tinytim.js`, `require-css/`, `zip/`, `add-to-homescreen/`, plus jQuery plugins (`jquery.storage`, `jquery.hotkeys`, `jquery.noClickDelay`, `jquery.ba-resize`, `jquery.ba-urlinternal`, `jquery.ui.totop`)
- Depends on: jQuery (most plugins)
- Used by: app modules via the `shim:` block in `readk.it/js/readkit.js`

**Stub layer (`js/stubs/`):**
- Purpose: empty replacements of `modernizr`, `detectizr`, and `zip/` used by the `prod_lite` Grunt target to ship a smaller bundle without drag-and-drop / feature detection.
- Location: `readk.it/js/stubs/lib/`
- Contains: `modernizr.js`, `detectizr.js`, `zip/` (no-op equivalents)
- Used by: `Gruntfile.js` `copy.readkit_prodlite_to_build` target

**Library page (separate mini-app):**
- Purpose: index-of-publications carousel, totally independent of the reader (different HTML, different RequireJS config, different bundle).
- Location: `readk.it/library/`
- Depends on: `sly` (jQuery carousel), jQuery, underscore. Reads `readkit.epub/manifest.json`.
- Used by: end-users browsing the library; clicking an item navigates to the reader.

**Build/tooling layer:**
- Purpose: produce the four `dist/readkit.*` flavours from `readk.it/` + `readkit.epub/`.
- Location: `Gruntfile.js`, `package.json`, `readkit.epub/manifest.maker.py`, the per-publication `OEBPS/readk.it/js/client.config.js` files
- Contains: Grunt task definitions, dynamic per-EPUB task generation driven by `manifest.json`
- Depends on: Node + Grunt + a long list of plugins, plus Ruby/Compass and Python/lxml.

## Data Flow

### Primary Request Path (web-served reader, the canonical mode)

1. Browser loads `readk.it/index.html` (`readk.it/index.html:154`)
2. `<script id="readkit-client">` runs `js/client.config.js` and assigns the `client` global with `paths`, `required`, `shims` for this publication (`readk.it/js/client.config.js:12`)
3. `<script id="readkit-entry" data-main="js/readkit" src="js/lib/require.js">` loads RequireJS, which then loads `js/readkit.js` (`readk.it/index.html:157`)
4. `readk.it/js/readkit.js` merges `client.paths/shims/required` into the reader defaults, calls `require.config({...})`, then `require(['jquery','app/controller','app/config','app/content','add-to-homescreen/src/add2home'], cb)` (`readk.it/js/readkit.js:46`, `readk.it/js/readkit.js:80`)
5. Inside the require callback: `book = config.epub_directory + path` (path comes from `window.location.hash`, i.e. library mode); `controller = new Controller(book, content.URIs, () => $.event.trigger('kickoff'))` (`readk.it/js/readkit.js:91`)
6. `Controller` (`readk.it/js/app/controller.js:29`) calls `_initialise(book, URIs, load_publication)`, which branches on `URIs` size, `window.location.protocol`, and `config.mode` to construct `new Epub(book, 'META-INF/container.xml', load_publication)` or one of three variants (`readk.it/js/app/controller.js:52`)
7. `Epub` `$.get`s `container.xml` → parses out the OPF path → `$.get`s OPF → fills `spine_entries[]` from `<itemref>`, `css_entries[]` from `<item media-type="text/css">`, `nav_entries[]` from the NCX or `nav` doc, and DC metadata (`readk.it/js/app/epub.js:67`-`readk.it/js/app/epub.js:251`)
8. `Epub` invokes `load_publication(epub)` (`readk.it/js/app/controller.js:84`), which kicks off two parallel `$.Deferred` chains: `load_html(epub)` (`readk.it/js/app/controller.js:100`) and `load_css(epub)` (`readk.it/js/app/controller.js:146`)
9. `load_html` iterates `pub.spine_entries` and uses `require(["text!" + value.href + "!strip"], …)` (the require.js text plugin) to fetch each XHTML; `load_css` uses `require(["css!" + value.href], …)` (the require-css plugin) for stylesheets
10. When both `$.when(load_html, load_css).done(...)` resolve, `layout_publication(epub, pages, stylesheets)` runs (`readk.it/js/app/controller.js:208`): it `new Layout(self, publication)`s, normalises `<svg:svg>`/`<svg:image>` namespacing, and loops `publication.getToc()` calling `layout.add(id, file, html)` for each page
11. `Layout.add` appends a `<div class="readkit-page">…<div class="readkit-scroller">…` to `#readkit-pageScroller` and constructs a per-page `IScroll`; pushes it into `page_scrollers[]` (`readk.it/js/app/layout.js:180`)
12. After all pages are added, `Layout` resizes the master `book_scroller` (`readk.it/js/app/layout.js:83`) and `utility.publish('publication_loaded')`
13. `Chrome` is subscribed to `publication_loaded` via `utility.subscribe('publication_loaded', initialiser)` (`readk.it/js/app/chrome.js:36`); `initialiser` reads stored preferences from `localStorage` (font, font-size, line-height), wires every UI control, fades out `#readkit-sitePreloader`, and shows the drag-drop overlay if appropriate (`readk.it/js/app/chrome.js:39`)
14. The reader is now interactive. Subsequent input (clicks, hotkeys, drag-drop) flows through Chrome → Layout (page navigation, refresh) → utility.storage (persistence)

### Drag-and-drop EPUB Flow

1. User drops a `.epub` onto `#readkit-drag-upload-window` (`readk.it/index.html:124`)
2. `Chrome` (`readk.it/js/app/chrome.js`) handles the drop, hands the File to `zip.js` (`readk.it/js/lib/zip/zip.js`) which inflates entries via the `js/lib/zip/inflate.js` web worker (path set by `config.workerScriptsPath`, `readk.it/js/app/config.js:52`)
3. Each inflated entry is converted to a Blob/data-URI by `utility.decode` (`readk.it/js/app/utility.js:74`), keyed by relative filename, and assembled into a `files` map
4. Chrome calls `controller.initialise(book, URIs, files)` → re-enters `_initialise`, which now picks the `files`-aware branch and constructs `new Epub('', 'META-INF/container.xml', callback, files)` (`readk.it/js/app/controller.js:71`)
5. `Epub` and `Controller.load_html`/`load_css` consult `pub.content[filename]` first (`readk.it/js/app/controller.js:118`, `readk.it/js/app/controller.js:158`) — when an entry is present, HTML is parsed with `$.parseXML` and CSS is wrapped in a `Blob` + `createObjectURL` and injected via `require_css.linkLoad`. The rest of the pipeline is identical to the primary path.

### Solo Flow (single self-contained HTML file)

1. Build-time, `grunt-readkit-data-uri` walks every EPUB asset and writes them as base-64 data URIs into `js/app/content.js` (replacing the empty placeholder `URIs:{}`)
2. The whole compiled `readkit.js` + `screen.css` + `index.html` is baked into one HTML file by `grunt-bake` → `dist/readkit.solo/<id>_<name>.html`
3. At runtime, `Controller._initialise` notices `Object.getOwnPropertyNames(URIs).length > 0` and constructs `new Epub('', 'META-INF/container.xml', callback, URIs)` (`readk.it/js/app/controller.js:58`) — the rest is identical to drag-and-drop, just sourced from `URIs` instead of dropped files.

### Library Flow

1. `library.html` boots `library/js/main.js` which `require([app/controller, app/config])` (`readk.it/library/js/main.js:30`)
2. The library `Controller` (`readk.it/library/js/app/controller.js:17`) `$.getJSON('manifest.json')` and appends one `<div class="li publication" data-url="…">` per entry
3. A `Sly` horizontal carousel is initialised over `.frame`; clicking a publication navigates to either `solo/<id>_<name>.html` (when `config.solo === true`) or `../index.html#library/<path>` (web-served-EPUB mode)

**State Management:**
- All persistent state lives in `localStorage`, namespaced by EPUB `identifier`, accessed via `utility.storage(identifier, key, value?)` (`readk.it/js/app/utility.js:30`).
- Stored keys: `font` ('serif'|'sans'), `font-size` (number), `line-height` (number), `page` (currentPage), `pages` (per-page `{x,y,height}`), `history` (page-number stack), `bookmarks` (array).
- In-memory state: `page_scrollers[]`, `pages[]`, `page_width`, `currentPage`, `previousPage`, `restoring`, `publication`, `controller`, `identifier` are module-level closure vars in `layout.js`. `controller`, `layout`, `upload`, `progress_total`, `identifier` are module-level closure vars in `chrome.js`.
- Inter-module communication: `utility.publish/subscribe` (a single `$({})` jQuery-event channel). Known events: `publication_loaded`, `history_changed`. Document-level events: `kickoff`, `kickedoff`.

## Key Abstractions

**EPUB (parsed publication):**
- Purpose: a typed value object holding everything parsed from the OPF/NCX
- Examples: `readk.it/js/app/epub.js`
- Pattern: classic constructor function with prototype methods (`Epub.prototype.getToc`); fields: `spine_entries[]`, `css_entries[]`, `nav_entries[]`, `version`, `title`, `author`, `description`, `publisher`, `language`, `rights`, `identifier`, `content` (the optional in-memory file map)

**page_scroller / book_scroller:**
- Purpose: every chapter is a vertical iScroll inside a horizontal master iScroll (snapping, lockDirection); this is the visual model of "swipe sideways to change chapter, scroll vertically to read"
- Examples: `readk.it/js/app/layout.js:83` (book_scroller), `readk.it/js/app/layout.js:188` (page_scroller per chapter)
- Pattern: `IScroll` instances tracked in `page_scrollers[]` (an array of `{file, scroller}`)

**client (per-publication plug-in descriptor):**
- Purpose: lets each EPUB declare additional RequireJS `paths`, `required` modules and `shims` without forking the reader
- Examples: default empty `readk.it/js/client.config.js`; populated `readkit.epub/03_readkit_manifesto/OEBPS/readk.it/js/client.config.js`
- Pattern: a single global `var client = { paths, required, shims }` set by an inline `<script>` before the RequireJS entry; merged in by `extend(paths, client.paths)` etc. in `readk.it/js/readkit.js:8`

**utility.publish / subscribe:**
- Purpose: decouple Layout's "I finished loading" from Chrome's "I'm ready to wire up handlers"
- Examples: `readk.it/js/app/utility.js:60`, `readk.it/js/app/chrome.js:36`
- Pattern: a single closure-scoped `$({})` jQuery object used as an event bus; `subscribe`/`unsubscribe`/`publish` are one-line wrappers over `on`/`off`/`trigger`

**tinytim templates:**
- Purpose: tiny `<%placeholder%>` interpolation for bookmark UI fragments
- Examples: `readk.it/index.html:84-110`, used by `utility.compile` (`readk.it/js/app/utility.js:25`) and `Layout.add` (`readk.it/js/app/layout.js:181`)
- Pattern: templates live as `<script type="text/tim" id="…-tmpl">…</script>` blocks inside the boot HTML

**mode (config-driven branching):**
- Purpose: select which loading strategy the Controller picks
- Examples: `readk.it/js/app/config.js:58`
- Pattern: a single string `mode: 'publication' | 'solo' | 'reader'`; `_initialise` switches on it together with `window.location.protocol` and the presence of `URIs`/`files`

## Entry Points

**Reader page (per-EPUB or drag-drop):**
- Location: `readk.it/index.html`
- Triggers: any user opening the embedded reader (`OEBPS/readk.it/index.html` inside an EPUB, or `dist/readkit.reader/readkit.reader.html`, or the library navigating to it)
- Responsibilities: loads `client.config.js` and `js/lib/require.js` with `data-main=js/readkit`; provides every DOM element the reader will look for (header bar, dropdowns, drag-upload window, `#readkit-pageWrapper`/`#readkit-pageScroller`, schema.org metadata block, tinytim templates)

**Library page:**
- Location: `readk.it/library/library.html`
- Triggers: top-right cloud icon (`<a class="library_link" href="library/library.html">` in `readk.it/index.html:118`) or direct navigation
- Responsibilities: hosts the Sly carousel chrome and a single `<script id="library-entry" data-main="js/main" src="js/lib/require.js">`

**Solo HTML file:**
- Location: built artifact `dist/readkit.solo/<identifier>_<name>.html`
- Triggers: end-user double-clicks the file (or web-serves it)
- Responsibilities: a single self-contained HTML with everything inlined — CSS in a `<style>`, JS in a `<script>`, EPUB content as data URIs in `app/content.js` (which was inlined into the script too)

**Reader-only HTML file:**
- Location: built artifact `dist/readkit.reader/readkit.reader.html`
- Triggers: end-user double-click; expects to receive an EPUB via drag-and-drop
- Responsibilities: same as solo but without bundled EPUB content

**Test runner:**
- Location: `readk.it/js/test/index.html`
- Triggers: opened in a browser
- Responsibilities: bootstraps QUnit + RequireJS via `readk.it/js/test/testsuite.js`, which `require`s `app/epub.test.js`

**Build entry:**
- Location: `Gruntfile.js`
- Triggers: `grunt` (production) or `grunt dev` (unminified)
- Responsibilities: clean, generate `manifest.json`, dispatch dynamic per-EPUB tasks, compile SASS, bundle JS via r.js, fan out to `dist/readkit.{reader,solo,library,epub}/`

## Architectural Constraints

- **Browser-only runtime.** All execution happens in a webview/browser; the only "server" is a static file host. There is no Node.js runtime code outside the build.
- **AMD only.** Modules must be `define([...], function(){})`. ES modules / CommonJS are not supported by the bootstrap.
- **jQuery is non-optional.** Every app module declares `'jquery'` as a dep and uses `$` for DOM, AJAX, deferreds, events, and storage. Removing it would require rewriting almost everything.
- **Single-file HTML host.** All UI markup must exist in `readk.it/index.html` (or `library/library.html`) at boot — Chrome and Layout *select* into existing DOM, they do not generate top-level structure.
- **Module-level singleton state.** `controller`, `layout`, `chrome`, `publication`, `page_scrollers`, `currentPage`, `identifier` are file-scoped `var`s in `controller.js`, `layout.js`, and `chrome.js`. Only one publication can be loaded at a time; opening a second EPUB calls `Layout.reset()` to wipe DOM and state.
- **Path coupling between reader and EPUB.** `config.epub_directory: "../../"` (`readk.it/js/app/config.js:17`) assumes the reader lives at `OEBPS/readk.it/`. Embedding it elsewhere requires editing this constant.
- **Hash-based "library" routing.** When the URL hash is non-empty (`window.location.hash`), the reader treats it as a relative path to the EPUB root (`readk.it/js/readkit.js:82`). There is no client-side router beyond this.
- **Web-worker path is config-driven.** `config.workerScriptsPath: "js/lib/zip/"` (`readk.it/js/app/config.js:52`) must be reachable from the page; zip.js will fail silently if it isn't.
- **Same-origin XHR.** When loading EPUBs via `$.get`/`$.getJSON`, the publication assets must be same-origin. The `file://` branch in `_initialise` (`readk.it/js/app/controller.js:62`) explicitly disables XHR loading and falls through to the drag-drop overlay.
- **The build needs three runtimes.** Building (`grunt`) requires Node + Ruby/Compass + Python/lxml on the host. The runtime needs none of these.
- **Dependencies are vendored.** All third-party JS is checked into `readk.it/js/lib/`. `package.json` only lists Grunt plugins. Two of those plugins are pinned to GitHub branches (`grunt-readkit-dom-munger`, `grunt-readkit-datauris`, `grunt-readkit-data-uri`), so reproducible installs depend on those repos remaining available.
- **No transpilation.** Source is ES5; the codebase predates classes, modules, arrow functions in lib code, etc. New code should match.

## Anti-Patterns

### Module-scoped `var self = this` aliasing across method boundaries

**What happens:** `Controller` (`readk.it/js/app/controller.js:30`) writes `self = this` to a *file-scoped* `var self;` declared at the top of the module. Subsequent helper functions `_initialise`, `load_publication`, `layout_publication` all close over this `self`.
**Why it's wrong here:** because `self` is module-scoped (not function-scoped), constructing a second `Controller` would silently overwrite it; combined with the other module-scoped singletons (`publication`, `layout`, `chrome`) only one publication can ever be live in this page.
**Do this instead:** keep a `var self = this` *inside* the constructor, or accept that this codebase intentionally treats Controller as a singleton — but then make it explicit (e.g. `Controller.instance`) and assert it.

### Re-running `require.config()` after the page has booted

**What happens:** the per-publication `client.config.js` script is `<script>`-loaded *before* `readkit.js`, but its values (`paths`, `shims`, `required`) are folded into the *single* `require.config({...})` call at boot. There is no later reconfiguration.
**Why it's wrong if you forget:** developers sometimes try to add a new module path at runtime; RequireJS will silently fail to resolve it. Anything a publication needs must be declared in `client.config.js` *before* the entry script runs.
**Do this instead:** add new modules to the publication's `client.config.js` (`paths` + `required` + `shims`) and rebuild.

### Mixing data fetching strategies inside one function

**What happens:** `Controller.load_html` (`readk.it/js/app/controller.js:100`) and `load_css` (`readk.it/js/app/controller.js:146`) each contain a top-level `if (filename && pub.content[filename])` branch (use the in-memory map) vs `else` (use the require text/css plugin to fetch via XHR). The two paths diverge in error handling and parsing (e.g. only the in-memory branch uses `$.parseXML`).
**Why it's wrong:** changing the loading model later means editing both branches in two functions in lockstep. It also forces the rest of the pipeline to handle the union of both shapes.
**Do this instead:** extract a `loadOne(href)` strategy that returns a `Deferred<string>` and is selected once at the call site, rather than inline in the loop.

### Storing async-pipeline scratch state on the `options` object passed between iScroll callbacks

**What happens:** `layout.js` stashes `page_scroller_waiting` and `page_scroller_anchor` on `this.options` of the `book_scroller` IScroll instance (`readk.it/js/app/layout.js:102`). Subsequent navigations read it back.
**Why it's wrong here:** the IScroll `options` object is the library's input config, not a state bag. Mutating it conflates configuration and runtime state and makes the flow hard to reason about (which callback owns which key?).
**Do this instead:** keep that state in module-level closures (the codebase already does this for `currentPage`/`previousPage`); reserve `options` for IScroll config.

### Hand-edited inline OPF manifest fragments inside the build

**What happens:** `Gruntfile.js` (`Gruntfile.js:802`-`Gruntfile.js:899`) declares the readk.it asset list as a giant multi-line string wrapped in a `function() { /* … */ }.toString().match(...)` hack to "mixin" `<item>` entries into each EPUB's `content.opf`.
**Why it's wrong:** the asset list is duplicated for prod and dev, hand-maintained, and silently drifts when you add a font/icon. The `function/comment/regex` trick is hard to grep for.
**Do this instead:** generate the manifest fragment by walking `dist/.../readk.it/` after copy completes (the directory layout is already authoritative).

## Error Handling

**Strategy:** Defensive but lenient — code mostly tries an operation and falls back to a `''`/`null` if it fails. Failures are logged via `utility.log` only when `config.log === true`.

**Patterns:**
- **try/catch around the `client` global lookup** (`readk.it/js/readkit.js:15`, `readk.it/js/readkit.js:38`, `readk.it/js/readkit.js:73`) so that the reader still boots when no per-publication overrides exist.
- **Swallowed exceptions during font switching** (`readk.it/js/app/chrome.js:195`): caught and routed through `utility.log`.
- **Namespace-tolerant XML parsing in `epub.js`** (`readk.it/js/app/epub.js:87-120`): for every DC field, try the unprefixed selector first (Safari), then the `dc\\:`-prefixed one (Firefox). If both fail the field is left empty.
- **No global error boundary.** There is no `window.onerror` handler, no error reporting, no toast. Failures degrade silently.

## Cross-Cutting Concerns

**Logging:** `utility.log` (gated by `config.log`); writes to `console.log` only. There is no log levelling beyond on/off. Many call sites log progress strings like `'load_html: ' + filename`, which is useful when developing but noisy in production (and `config.log: true` is the default in `readk.it/js/app/config.js:49`).

**Validation:** None at runtime. The OPF/NCX parser is permissive (returns empty strings for missing fields). User input is limited to drag-drop EPUBs, where validity is delegated to zip.js (which throws if the file isn't a valid zip).

**Authentication:** None. The reader is anonymous and has no concept of identity. Per-publication preferences are namespaced by EPUB `identifier` in `localStorage`.

**Persistence:** `utility.storage(identifier, key, value)` is the *only* storage API. It wraps `$.localStorage(identifier)` (the `jquery.storage` plugin) and stores an array of single-key objects per identifier. There is no schema, migration, or versioning.

**Templating:** tinytim only. Templates live as `<script type="text/tim">` blocks in `readk.it/index.html`; rendering is `utility.compile(template, data)`.

**Persistence of preferences vs. position:** preferences (font, font-size, line-height) are restored by `chrome.js` `initialiser`. Reading position (page index + per-page `{x,y,height}`) is restored by `layout.js`. Both share the same `localStorage` array under the EPUB identifier.

---

*Architecture analysis: 2026-04-26*
