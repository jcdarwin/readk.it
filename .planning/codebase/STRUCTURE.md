# Codebase Structure

**Analysis Date:** 2026-04-26

## Directory Layout

```
readk.it/                                # repo root
├── Gruntfile.js                         # Grunt build pipeline (~1344 lines, the build of record)
├── package.json                         # Node devDependencies (Grunt + plugins) — no runtime deps
├── README.md                            # Project intro, four flavours, build instructions
├── .nvmrc                               # Node version pin: 0.11.16 (very old, see CONCERNS.md)
├── .gitignore
│
├── readk.it/                            # === REAL SOURCE ===
│   ├── index.html                       # Reader entry HTML (loads client.config.js + RequireJS)
│   ├── favicon.ico
│   ├── readkit.appcache                 # HTML5 AppCache manifest (production)
│   ├── readkit.dev.appcache             # HTML5 AppCache manifest (development)
│   ├── css/                             # Reader chrome stylesheets
│   │   ├── readkit-screen.css           # Compass-compiled output of sass/readkit-screen.scss
│   │   ├── add2home.css
│   │   ├── drag_and_drop.css
│   │   ├── fontello.css                 # Icon font CSS
│   │   ├── ui-totop.css
│   │   └── custom.css                   # User-overridable cascade tail
│   ├── sass/                            # SCSS sources for the reader chrome
│   │   ├── readkit-screen.scss          # SCSS root
│   │   ├── config.rb                    # Compass config (paths, output style)
│   │   ├── partials/
│   │   │   ├── _color.scss              # Colour variables
│   │   │   ├── _custom.scss             # Layout variables ($padding, $small/$medium/$large)
│   │   │   ├── _drag_and_drop.scss
│   │   │   └── _font-face.scss
│   │   └── fonts/                       # Empty / referenced from compass config
│   ├── fonts/                           # Web fonts (loaded via @font-face)
│   │   ├── fontello/                    # Icon font (CSS + WOFF/TTF)
│   │   ├── Lora/                        # Serif body font (4 variants)
│   │   └── SourceSansPro/               # Sans-serif body font (4 variants)
│   ├── images/                          # Splash screens, touch icons, spinner
│   ├── js/
│   │   ├── readkit.js                   # RequireJS bootstrap entry (data-main target)
│   │   ├── client.config.js             # Default empty per-publication config
│   │   ├── app/                         # === Application modules (AMD) ===
│   │   │   ├── controller.js            # Top-level orchestrator (355 lines)
│   │   │   ├── epub.js                  # OPF/NCX parser (251 lines)
│   │   │   ├── layout.js                # Page rendering + iScroll wiring (486 lines)
│   │   │   ├── chrome.js                # UI controls + drag-drop + bookmarks (703 lines)
│   │   │   ├── config.js                # Runtime config (mode, intervals, paths)
│   │   │   ├── content.js               # Placeholder for solo data URIs (13 lines)
│   │   │   └── utility.js               # pubsub, storage, decode, templates (183 lines)
│   │   ├── lib/                         # === Vendored third-party libs ===
│   │   │   ├── require.js               # RequireJS (AMD loader)
│   │   │   ├── jquery.js                # jQuery v2
│   │   │   ├── lodash.js                # lodash (loaded as 'lodash')
│   │   │   ├── modernizr.js
│   │   │   ├── detectizr.js
│   │   │   ├── iscroll.js               # iScroll4 (touch scrolling)
│   │   │   ├── tinytim.js               # Micro template engine
│   │   │   ├── text.js                  # require.js text! plugin
│   │   │   ├── jquery.storage.js
│   │   │   ├── jquery.hotkeys.js
│   │   │   ├── jquery.noClickDelay.js
│   │   │   ├── jquery.ba-resize.js
│   │   │   ├── jquery.ba-urlinternal.js
│   │   │   ├── jquery.ui.totop.js
│   │   │   ├── require-css/             # require.js css! plugin
│   │   │   │   ├── css.js
│   │   │   │   └── normalize.js
│   │   │   ├── add-to-homescreen/
│   │   │   │   ├── src/add2home.js
│   │   │   │   └── style/add2home.css
│   │   │   └── zip/                     # zip.js + workers (drag-drop EPUB unzipping)
│   │   │       ├── zip.js
│   │   │       ├── inflate.js
│   │   │       ├── deflate.js
│   │   │       ├── zip-ext.js
│   │   │       ├── zip-fs.js
│   │   │       └── mime-types.js
│   │   ├── stubs/                       # === Lite-build replacements ===
│   │   │   └── lib/
│   │   │       ├── modernizr.js         # No-op stub
│   │   │       ├── detectizr.js         # No-op stub
│   │   │       └── zip/                 # No-op stubs
│   │   └── test/                        # === Test suite ===
│   │       ├── index.html               # QUnit runner
│   │       ├── testsuite.js             # Test bootstrap
│   │       ├── app/
│   │       │   └── epub.test.js
│   │       └── qunit/
│   │           ├── qunit.js
│   │           └── qunit.css
│   └── library/                         # === Library carousel mini-app (separate page) ===
│       ├── library.html                 # Library entry HTML
│       ├── library.appcache
│       ├── offline.manifest
│       ├── README.md
│       ├── css/
│       │   ├── styles.css               # Compiled from library/sass/styles.scss
│       │   └── add2home.css
│       ├── sass/
│       │   ├── styles.scss
│       │   ├── config.rb
│       │   └── partials/
│       │       ├── _color.scss
│       │       ├── _custom.scss
│       │       └── _font-face.scss
│       └── js/
│           ├── main.js                  # RequireJS bootstrap
│           ├── library.client.config.js # Per-publication overrides for library
│           ├── script.js                # Trivial 'kickoff' shim
│           ├── app/
│           │   ├── controller.js        # Carousel + click → navigate
│           │   └── config.js            # {manifest, solo}
│           └── lib/
│               ├── require.js
│               ├── jquery.js
│               ├── sly.js               # Horizontal carousel
│               ├── text.js
│               ├── underscore-min.amd.js
│               └── add-to-homescreen/
│
├── readkit.epub/                        # === Source EPUBs (one per directory) ===
│   ├── manifest.maker.py                # Python (lxml) → emits manifest.json by walking OPFs
│   ├── manifest.json                    # Generated; consumed by Gruntfile and library
│   ├── manifest.json.mobydick.json      # Older/specific manifest variant
│   ├── 01_9781877551789_awa_braunias_civilisation_epub2_readk.it/
│   │   ├── mimetype
│   │   ├── META-INF/container.xml
│   │   └── OEBPS/
│   │       ├── content.opf
│   │       ├── *.xhtml
│   │       ├── css/, fonts/, images/, js/
│   │       └── readk.it/                # Embedded copy of the reader (added by build)
│   │           └── js/client.config.js  # Per-publication require overrides
│   ├── 02_…/                            # Same shape, 26 publications in total (01–26)
│   │   …
│   └── 26_9780473474539_ind_opie_signs_for_the_times_epub3/
│
├── readkit.epub.giantleap/              # === Standalone EPUB (one-off, sibling of readkit.epub) ===
│   └── giant_leap/
│       ├── mimetype
│       ├── META-INF/
│       └── OEBPS/                       # video/, css/, image/, readk.it/
│
├── readkit.epub.mobydick.epub/          # === Standalone EPUB (one-off Moby-Dick build) ===
│   └── moby-dick/
│
├── dist/                                # === Current build output (committed) ===
│   ├── readkit.reader/                  # Single HTML file: drag-drop reader
│   │   └── readkit.reader.html          # ~789 KB (everything inlined)
│   ├── readkit.solo/                    # One self-contained HTML per EPUB
│   │   └── <identifier>_<name>.html + .zip
│   ├── readkit.library/                 # Web-served collection
│   │   ├── index.html
│   │   ├── library/library.html         # Carousel page
│   │   ├── library/manifest.json
│   │   ├── library/<each EPUB unzipped>/
│   │   └── library/solo/<id>.html       # Solo HTMLs reachable from carousel
│   └── readkit.epub/                    # The .epub files (zipped) AND unzipped trees
│       ├── *.epub                       # 26 publications, valid EPUB containers
│       └── <NN>_<slug>/                 # Unzipped variants (web-servable)
│
├── dist.0.11.16/                        # === Snapshot of dist for Node 0.11.16 build ===
│   └── (same structure as dist/)
│
├── dist.gianleap/                       # === Snapshot of dist for the giantleap publication ===
│   └── (same structure as dist/)
│
├── node_modules/                        # === Installed Grunt plugins ===
│
└── .planning/                           # GSD planning artifacts
    └── codebase/                        # ← this directory
```

## Directory Purposes

**`readk.it/`** (note: directory and project share the same name — the source root is `readk.it/readk.it/`):
- Purpose: the actual JavaScript+CSS reader source
- Contains: HTML entry pages, AMD modules under `js/app/`, vendored libraries under `js/lib/`, SCSS in `sass/`, web fonts in `fonts/`
- Key files: `readk.it/index.html`, `readk.it/js/readkit.js`, `readk.it/js/app/controller.js`

**`readk.it/js/app/`:**
- Purpose: the seven application modules — every file is a single AMD `define(…)` call
- Contains: `controller.js`, `epub.js`, `layout.js`, `chrome.js`, `config.js`, `content.js`, `utility.js`
- Key files: `readk.it/js/app/controller.js` (orchestrator), `readk.it/js/app/config.js` (the runtime knobs)

**`readk.it/js/lib/`:**
- Purpose: vendored third-party libraries; no `npm install` step exists for runtime code
- Contains: jQuery, RequireJS, lodash, iScroll, Modernizr, Detectizr, zip.js, tinytim, several jQuery plugins, RequireJS plugins for text and CSS, the add-to-homescreen prompt
- Key files: `readk.it/js/lib/require.js` (AMD loader), `readk.it/js/lib/jquery.js`

**`readk.it/js/stubs/`:**
- Purpose: empty stand-ins for the lite production build (no Modernizr/Detectizr, no zip)
- Contains: stub `modernizr.js`, `detectizr.js`, `zip/`
- Used by: `Gruntfile.js` `copy.readkit_prodlite_to_build` task

**`readk.it/library/`:**
- Purpose: a separate single-page mini-app that shows a horizontal carousel of EPUB covers and links into the reader
- Contains: its own `library.html`, its own RequireJS bootstrap (`js/main.js`), its own `app/controller.js`, its own SCSS in `library/sass/`
- Key files: `readk.it/library/library.html`, `readk.it/library/js/app/controller.js`

**`readk.it/sass/`** and **`readk.it/library/sass/`:**
- Purpose: Compass/SCSS sources for the reader and library respectively
- Contains: a single root file (`readkit-screen.scss` / `styles.scss`), partial files in `partials/`, and a `config.rb` describing path layout
- Key files: `readk.it/sass/readkit-screen.scss`, `readk.it/sass/partials/_custom.scss` (variables)

**`readkit.epub/`:**
- Purpose: the *source* EPUBs, one per subdirectory, plus the Python manifest maker
- Contains: 26 publication directories named `<NN>_<slug>/` each with `mimetype`, `META-INF/`, and `OEBPS/`; plus `manifest.maker.py` and the generated `manifest.json`
- Key files: `readkit.epub/manifest.maker.py`, `readkit.epub/manifest.json`
- Note: each publication's `OEBPS/readk.it/js/client.config.js` declares its per-publication RequireJS overrides

**`readkit.epub.giantleap/`** and **`readkit.epub.mobydick.epub/`:**
- Purpose: one-off standalone source EPUBs that live outside `readkit.epub/`
- Contains: a single publication subdirectory with the same `META-INF + OEBPS` shape
- Used by: ad-hoc builds (the corresponding `dist.gianleap/` and `readkit.epub.mobydick.epub/`)

**`dist/`** and **`dist.0.11.16/`** and **`dist.gianleap/`:**
- Purpose: build outputs (multiple snapshots are committed for archival/comparison)
- Contains: four flavour subdirectories (`readkit.reader/`, `readkit.solo/`, `readkit.library/`, `readkit.epub/`)
- Generated: Yes (by `grunt`)
- Committed: Yes (intentionally — see README on archival of compiled assets)

**`node_modules/`:**
- Purpose: installed Grunt plugins and their transitive deps
- Generated: Yes (`npm install`)
- Committed: Yes (legacy of the Node 0.11 era — see CONCERNS.md)

**`.planning/codebase/`:**
- Purpose: GSD codebase-mapping artifacts
- Contains: `ARCHITECTURE.md`, `STRUCTURE.md`, etc.

## Key File Locations

**Entry Points:**
- `readk.it/index.html`: reader page; loads `js/client.config.js` then `js/lib/require.js` with `data-main="js/readkit"`
- `readk.it/library/library.html`: library carousel page; loads `js/lib/require.js` with `data-main="js/main"`
- `readk.it/js/test/index.html`: QUnit runner
- `Gruntfile.js`: build entry — `grunt` (prod) / `grunt dev` (unminified)
- `readkit.epub/manifest.maker.py`: stand-alone Python script run by Grunt before each build

**Configuration:**
- `readk.it/js/app/config.js`: runtime config (`mode`, intervals, `epub_directory`, `workerScriptsPath`, `lite`, `log`, `tags`)
- `readk.it/js/client.config.js`: default (empty) per-publication overrides — overridden by each EPUB's own `OEBPS/readk.it/js/client.config.js`
- `readk.it/library/js/app/config.js`: `{manifest, solo}` toggles for the library
- `readk.it/library/js/library.client.config.js`: per-publication overrides for the library page
- `readk.it/sass/config.rb` & `readk.it/library/sass/config.rb`: Compass paths
- `package.json`: build-time devDependencies only
- `.nvmrc`: Node 0.11.16 (legacy — modern toolchains will choke on this)

**Core Logic:**
- `readk.it/js/readkit.js`: bootstraps require.config and instantiates Controller
- `readk.it/js/app/controller.js`: orchestrates Epub → Layout → Chrome
- `readk.it/js/app/epub.js`: parses container.xml + OPF + NCX/Nav
- `readk.it/js/app/layout.js`: builds the iScroll-wrapped horizontal page model
- `readk.it/js/app/chrome.js`: every UI control, drag-drop, bookmarks, hotkeys
- `readk.it/js/app/utility.js`: pubsub bus, localStorage facade, tinytim, decoding

**Build:**
- `Gruntfile.js`: 1344-line dynamic-task pipeline (per-EPUB tasks generated from `manifest.json`)
- `package.json`: lists Grunt + ~12 plugins, three of which are pinned to GitHub branches (`grunt-readkit-dom-munger`, `grunt-readkit-datauris`, `grunt-readkit-data-uri`)

**Testing:**
- `readk.it/js/test/index.html`: QUnit runner (open in browser)
- `readk.it/js/test/testsuite.js`: RequireJS bootstrap for the test suite
- `readk.it/js/test/app/epub.test.js`: the only test file present

## Naming Conventions

**Files:**
- App modules: `lower-case.js` matching the conceptual role (`controller.js`, `layout.js`, `chrome.js`, `epub.js`, `config.js`, `content.js`, `utility.js`)
- Vendor jQuery plugins: `jquery.<plugin>.js` (`jquery.storage.js`, `jquery.hotkeys.js`)
- SCSS partials: leading underscore (`_color.scss`, `_custom.scss`, `_font-face.scss`, `_drag_and_drop.scss`)
- HTML entries: `index.html` for the reader, `library.html` for the library, `<id>_<slug>.html` for built solo files
- Test files: `<module>.test.js`

**Directories:**
- EPUB source dirs: `<NN>_<slug>/` where `<NN>` is a two-digit zero-padded sequence and `<slug>` is publisher_author_title (e.g. `03_readkit_manifesto/`, `08_9780864738301_vup_patchett_i_got_his_blood_on_me_epub2_readk.it/`). Note that some have trailing `_readk.it`, some don't — this is historical, not significant.
- EPUB internal dirs: standard EPUB layout — `META-INF/` (container.xml) and `OEBPS/` (everything else)
- Source JS namespaces: `app/` (this project's modules), `lib/` (vendor), `stubs/` (lite replacements), `test/` (QUnit)
- Build outputs: `dist/readkit.<flavour>/` where `<flavour>` ∈ `{reader, solo, library, epub}`; flavour-specific snapshots use `dist.<label>/` (e.g. `dist.gianleap/`, `dist.0.11.16/`)

**JavaScript identifiers:**
- Module-level constructors are PascalCase (`Controller`, `Epub`, `Layout`, `Chrome`)
- Functions and locals are `snake_case` *or* `camelCase` — the codebase mixes both freely. Examples: `load_publication`, `layout_publication`, `check_backbutton`, `restore_bookmarks` (snake) vs `getToc`, `currentPage`, `previousPage` (camel). Match the surrounding file when adding code.
- Module-level closure singletons: bare lower-case (`controller`, `layout`, `chrome`, `publication`, `identifier`)
- Constants in config: snake_case (`epub_directory`, `resize_interval`, `workerScriptsPath` — note the one inconsistency)

**CSS classes:**
- All reader chrome classes are namespaced: `readkit-<thing>` (e.g. `readkit-page`, `readkit-scroller`, `readkit-icon`, `readkit-back`, `readkit-active`, `readkit-inactive`)
- IDs use the same prefix: `#readkit-pageWrapper`, `#readkit-pageScroller`, `#readkit-sitePreloader`, `#readkit-bookmark-widget`
- Icon font classes (from fontello) use `icon-<name>` without the `readkit-` prefix

## Where to Add New Code

**New reader feature touching the UI:**
- Hook into existing UI element in `readk.it/index.html` (add markup if needed, with `readkit-` class prefix)
- Style in a new SCSS partial under `readk.it/sass/partials/_<feature>.scss` and `@import` it from `readk.it/sass/readkit-screen.scss`
- Add behaviour in `readk.it/js/app/chrome.js` (it owns user interactions); subscribe to `publication_loaded` if you need the publication to be ready
- If you need new persistent state, use `utility.storage(identifier, key, value)` — do NOT touch `localStorage` directly

**New module:**
- Place under `readk.it/js/app/<name>.js` as an AMD `define([deps], function(...){ … })`
- Add `'app/<name>'` to the `required` array in `readk.it/js/readkit.js` if it must load at boot, OR `require([...])` it lazily from another app module
- If it needs vendor libs, declare them in the `define` deps; the loader already knows where `js/lib/` is via `baseUrl: 'js/lib'`

**New vendor library:**
- Drop the file into `readk.it/js/lib/<libname>/` (or directly in `js/lib/`)
- If it isn't AMD, add a `shim` entry in `readk.it/js/readkit.js` (`shims = { '<libname>': { deps: [...], exports: '<Global>' } }`)
- Add to the `requirejs.compile_readkit.options.include` list in `Gruntfile.js` if it must be in the production bundle

**New EPUB to ship:**
- Unzip into `readkit.epub/<NN>_<slug>/` (matching the existing numbering)
- Optionally add an `OEBPS/readk.it/js/client.config.js` if the publication needs extra JS libs at runtime
- Run `grunt` — `manifest.maker.py` will pick it up automatically

**New build flavour or build step:**
- Add a `grunt.config('<task>.<target>', { … })` block in `Gruntfile.js`
- Wire it into the appropriate task chain (look near the bottom of `Gruntfile.js` for `grunt.registerTask` definitions)
- For per-EPUB tasks, follow the dynamic pattern around `Gruntfile.js:539` (`generateDynamicTasks`)

**New test:**
- Add `<module>.test.js` under `readk.it/js/test/app/`
- Append the path to the `testModules` array in `readk.it/js/test/testsuite.js`
- Open `readk.it/js/test/index.html` in a browser to run

**New CSS variable / colour / size:**
- Edit `readk.it/sass/partials/_color.scss` (colours) or `readk.it/sass/partials/_custom.scss` (sizes/spacing)
- Re-run `grunt compass:readkit` (or `grunt dev`) to recompile

**Library carousel changes:**
- Mark up in `readk.it/library/library.html`
- Logic in `readk.it/library/js/app/controller.js`
- Styles in `readk.it/library/sass/styles.scss` (and partials)

## Special Directories

**`dist/`, `dist.0.11.16/`, `dist.gianleap/`:**
- Purpose: committed build outputs and historical snapshots
- Generated: Yes
- Committed: Yes (intentionally — README documents these as deliverables)
- Action when editing source: regenerate with `grunt`; commit the regenerated dist alongside source changes

**`readk.it/js/stubs/`:**
- Purpose: drop-in replacements that strip Modernizr/Detectizr/zip from the lite build
- Generated: No (hand-written, mirroring the real lib API surface as no-ops)
- Committed: Yes
- Action: keep these in sync if the corresponding lib's exports change

**`readk.it/sass/.sass-cache/` (gitignored):**
- Purpose: Compass intermediate cache
- Generated: Yes (by Compass)
- Committed: No

**`node_modules/`:**
- Purpose: installed Grunt plugins
- Generated: Yes (`npm install`)
- Committed: Yes (the legacy Node 0.11.16 tree is checked in because reproducing it from npm is now hard — see CONCERNS.md)

**`readkit.epub.giantleap/`, `readkit.epub.mobydick.epub/`:**
- Purpose: one-off EPUB sources for ad-hoc builds outside the main `readkit.epub/` set
- Generated: No
- Committed: Yes
- Action: use the main `readkit.epub/` for new publications unless you specifically need a sibling-tree build

**Each EPUB's `OEBPS/readk.it/`:**
- Purpose: an embedded copy of the reader inside each EPUB; a runtime artifact of the build
- Generated: Yes (by Grunt copy tasks)
- Committed: Yes (so EPUBs in source can be tested by web-serving)
- Action: never edit manually — always edit the canonical `readk.it/` source and rebuild

---

*Structure analysis: 2026-04-26*
