# Coding Conventions

**Analysis Date:** 2026-04-26

## Naming Patterns

**Files:**
- Lowercase, dot-separated, `.js` extension: `controller.js`, `epub.js`, `chrome.js`, `client.config.js`, `readkit.js`
- Test files use `.test.js` suffix: `epub.test.js` (`readk.it/js/test/app/epub.test.js`)
- Vendor/third-party libraries keep their upstream names verbatim: `jquery.ba-resize.js`, `jquery.ui.totop.js`, `lodash.js`, `iscroll.js`, `modernizr.js`
- SASS partials use the underscore prefix per Compass convention: `_color.scss`, `_custom.scss`, `_drag_and_drop.scss`, `_font-face.scss` (`readk.it/sass/partials/`)
- Python tooling uses dotted lowercase filenames: `manifest.maker.py` (`readkit.epub/manifest.maker.py`)

**Functions:**
- Public/exported functions use `camelCase`: `isTextFile`, `getToc`, `subscribe`, `restore_bookmarks` (mixed — see below)
- Constructors use `PascalCase`: `Controller`, `Epub`, `Layout`, `Chrome` (`readk.it/js/app/controller.js:29`, `readk.it/js/app/epub.js:17`, `readk.it/js/app/layout.js:36`, `readk.it/js/app/chrome.js:30`)
- Private helpers are prefixed with a leading underscore: `_initialise` (`readk.it/js/app/controller.js:52`), `_hasArrayBufferView` (`readk.it/js/app/utility.js:72`)
- **Inconsistency:** the codebase mixes `camelCase` and `snake_case` for function names. Examples of `snake_case`: `load_publication`, `load_html`, `load_css`, `layout_publication`, `trap_anchor`, `restore_bookmarks`, `go_back`, `check_backbutton`, `publication_finalise` (`readk.it/js/app/controller.js`, `readk.it/js/app/layout.js`). When adding new code, prefer matching the surrounding file rather than enforcing a single style.

**Variables:**
- Local variables and parameters: `camelCase` or `snake_case` — both appear (`epub_directory`, `oebps_dir`, `spine_entries`, `currentPage`, `previousPage`, `page_scrollers`)
- Hash/object keys mirror the variable convention of the file they live in
- Boolean/state variables are descriptive nouns or adjectives: `restoring`, `lite`, `ncx_exists`

**Types:**
- No TypeScript or static types in use
- "Types" are expressed as constructor functions returning `this` (classic pre-ES6 constructor pattern)

## Code Style

**Formatting:**
- Indentation: 4 spaces in `readk.it/js/app/*.js` and most application source
- Indentation: 2 spaces in `Gruntfile.js`
- Single quotes for string literals throughout JS (`'jquery'`, `'app/config'`)
- Semicolons mandatory (enforced implicitly by `eqeqeq` + JSHint defaults)
- Trailing commas: present in Gruntfile object literals; not generally used in app code
- Opening braces on the same line (K&R / 1TBS-ish): `function load_html(pub){` and `define(function (require) {`
- No `.editorconfig`, no `.prettierrc`, no `.eslintrc`, and no project-level `.jshintrc` are present at the repo root

**Linting:**
- **Tool:** JSHint via `grunt-contrib-jshint` (`grunt-contrib-jshint ~0.6.0` in `package.json`)
- **Configuration:** inline in `Gruntfile.js:154-188` (no standalone `.jshintrc`)
- **Active rules:**
  - `curly: true` — always require `{}` around control-flow blocks
  - `eqeqeq: true` — strict equality (`===` / `!==`) required
  - `immed: true` — wrap IIFEs in parens
  - `latedef: true` — disallow use before declaration
  - `newcap: true` — constructors must start uppercase
  - `noarg: true` — disallow `arguments.caller` / `arguments.callee`
  - `sub: true` — allow `obj['key']` access
  - `undef: true` — disallow undeclared variables
  - `unused: true` — warn on unused variables
  - `boss: true` — allow assignments inside conditions
  - `eqnull: true` — allow `== null`
  - `browser: true` — assume browser globals
- **Suppressed warnings (see `Gruntfile.js:158-161`):**
  - `-W061` (eval can be harmful)
  - `-W083` (don't make functions within a loop)
  - `-W098` (defined but never used)
  - `-W117` (`client` is not defined)
- **Globals declared:** `enquire`, `jQuery`, `Modernizr`, `screenfull`, `document`, `navigator`
- **Files ignored:** everything under `readk.it/js/lib/**`, `readk.it/js/test/qunit/*.js`, `readk.it/library/js/lib/**`
- **Files linted:** `Gruntfile.js` and `readk.it/**/*.js` (excluding the ignores above)
- Tasks `jshint:readkit` are wired into the prod and dev grunt pipelines (`Gruntfile.js:1017`, `Gruntfile.js:1049`)

**Per-file globals declarations:**
- Every application JS file begins with a `/*global ... :false */` comment listing the globals that file is allowed to reference. Examples:
  - `/*global require:false, client:false, controller:false */` (`readk.it/js/client.config.js:1`)
  - `/*global define:false */` (`readk.it/js/app/config.js:10`, `readk.it/js/app/content.js:9`, `readk.it/js/app/epub.js:10`, `readk.it/js/app/layout.js:15`, `readk.it/js/app/chrome.js:9`)
  - `/*global define:false, console:false */` (`readk.it/js/app/utility.js:9`)
  - `/*global define:false, $:false, expect:false, test:false, equal:false, deepEqual:false, console:false, QUnit:false, module:false */` (`readk.it/js/test/app/epub.test.js:6`)
- **Convention for new files:** include a matching `/*global ... :false */` directive listing every external symbol the file uses, so JSHint passes with `undef: true`.

## Module System

**Pattern:** AMD via RequireJS (`readk.it/js/lib/require.js`). There is no CommonJS, no ES modules, no bundler other than `grunt-contrib-requirejs`.

**Module shape:**
```javascript
/*global define:false */
define([
    'jquery',
    'app/utility',
    'app/config',
    'iscroll',
    'lodash',
    'jquery.hotkeys'
], function($, utility, config, IScroll, _, $hotkeys){
    // ...module body...
    return (Layout); // or { foo: foo, bar: bar }
});
```

- Dependencies declared explicitly in the `define([...])` array
- Callback parameter names match the dependency order (positional)
- `define({...})` (without dependency array) is used for pure config objects: `readk.it/js/app/config.js:11`, `readk.it/js/app/content.js:10`
- Modules return either a constructor (e.g. `return (Layout);`) or an object literal with named exports (`return { isTextFile: isTextFile, compile: compile, ... };` in `utility.js:169-182`)

**Path aliases:**
- `baseUrl: 'js/lib'` — third-party libs resolve from here by default
- `paths: { app: '../app' }` — anything starting with `app/` resolves under `readk.it/js/app/`
- `underscore: 'lodash'` — Lodash provides Underscore-compatible API
- `'css'` mapped to `'require-css/css'` so callers can `require(['css!path/to/style.css'], ...)`
- Shims are declared centrally in `readk.it/js/readkit.js:23-37` for non-AMD libs (jQuery plugins, iScroll, Zip)

## Import Organization

**Order in `define([...])` arrays (observed convention):**
1. Core: `jquery` first
2. jQuery plugins (`jquery.storage`, `jquery.ba-urlinternal`, `jquery.hotkeys`, ...)
3. Internal `app/*` modules (`app/config`, `app/utility`, `app/epub`, ...)
4. Heavyweight third-party libs (`iscroll`, `lodash`, `zip/zip`)
5. CSS plugin loaders (`require-css/css`) last

Examples:
- `readk.it/js/app/controller.js:10-19`
- `readk.it/js/app/layout.js:16-22`
- `readk.it/js/app/chrome.js:10-20`

## Error Handling

**Strategy:** mostly silent / best-effort. The code is browser-side and prioritises continued execution over failing loudly.

**Patterns observed:**
- **Silent `try/catch`** around optional features. Example (`readk.it/js/client.config.js:15-20`):
  ```javascript
  try {
      if (client && client.paths) {
          extend(paths, client.paths);
      }
  } catch(e) {
  }
  ```
- **Empty `catch` blocks** to swallow errors from speculative DOM operations: `readk.it/js/app/layout.js:223`, `layout.js:243`
- **`catch (e) { utility.log(e.message); }`** when something is worth logging but should not stop execution: `readk.it/js/app/chrome.js:195`
- **Defensive feature detection** (`if (window.URL || window.webkitURL)`) rather than `try/catch` where possible
- **Async error handling** uses jQuery deferreds: `.done(...)`, `.success(...)`, `.error(function() { console.error("error"); })` (`readk.it/js/test/app/epub.test.js:23-29`)
- **No Promise / async-await** — entirely jQuery `$.Deferred` based (`readk.it/js/app/controller.js:103`, `controller.js:147`)

## Logging

**Framework:** wrappers around `console` defined in `readk.it/js/app/utility.js:117-139`.

**Three log levels:**
```javascript
utility.log(msg);    // console.log, gated by config.log
utility.debug(msg);  // console.debug, gated by config.log
utility.error(msg);  // console.error, gated by config.log
```

**All three are gated by `config.log` (boolean) in `readk.it/js/app/config.js:49`.** When `config.log === false`, no console output is produced.

**Convention for new logging:**
- Always go through `utility.log/debug/error`, not `console.*` directly
- Direct `console.*` calls only appear in `utility.js` itself and as a fallback `console.error("error")` in the test suite
- Recent commit `f1aa3be` ("Remove console.log") shows active discipline against committing raw `console.log` calls

## Comments

**File-level header block (consistent across all `app/*.js`):**
```javascript
/*
** filename.js
**
** Author: Jason Darwin
**
** Brief description of purpose.
*/
```
Examples: `readk.it/js/app/utility.js:1-7`, `readk.it/js/app/epub.js:1-8`, `readk.it/js/app/config.js:1-8`, `readk.it/js/app/chrome.js:1-7`, `readk.it/js/app/layout.js:1-13`.

**Inline comments:**
- Single-line `//` comments are used liberally to explain "why", not "what"
- Frequently link to external references (StackOverflow, blog posts, gists): `readk.it/js/app/controller.js:91`, `controller.js:125`, `readk.it/js/app/utility.js:60`, `utility.js:155`
- Multi-line `/* ... */` for section banners (e.g. `/* Constructor */`, `/* Define the instance methods */` in `readk.it/js/app/controller.js:28,40`)
- TODO/FIXME comments are rare — only one TODO found in the entire app source: `readk.it/js/app/controller.js:345`

**JSDoc / TSDoc:**
- **Not used.** No `@param`, `@returns`, or `@type` annotations exist in the application JS.
- Documentation lives in prose comments above the function

## Function Design

**Size:** functions vary widely. `utility.js` favours short, focused helpers (5-30 lines). `chrome.js` (703 lines) and `layout.js` (486 lines) contain longer event-handler functions, often 30-80 lines each.

**Parameters:** positional, no destructuring (pre-ES6 codebase). Trailing optional parameters are handled with `if (arg !== undefined)` checks (`readk.it/js/app/utility.js:35`).

**Return values:**
- Constructors return `this` explicitly (`readk.it/js/app/epub.js:51`, `readk.it/js/app/controller.js:37`)
- Module factories return either a constructor function or a flat object literal of public methods
- Helper functions return early on failure (`return null;` in `utility.js:55`)

## Module Design

**Exports:**
- Single-export modules return the constructor: `return (Epub);`, `return (Controller);`, `return (Layout);`, `return (Chrome);`
- Multi-export modules return an object literal listing each public name: `utility.js:169-182`
- Config modules use the no-deps form: `define({ key: value, ... });`

**Constructor pattern (no ES6 classes):**
```javascript
function Controller (book, URIs, callback) {
    self = this;
    // ...
    return this;
}

Controller.prototype = {
    initialise: function(book, URIs, files) { /* ... */ },
    getPublication: function(){ return (publication); },
    publication_finalise: function () { }
};
```
Source: `readk.it/js/app/controller.js:29-50`. Use this same pattern when adding new constructor-style modules.

**Private state:** module-level `var` declarations inside the `define` callback closure are the de-facto private fields (e.g. `page_scrollers`, `pages`, `publication` in `readk.it/js/app/layout.js:25-33`). Beware: many of these are effectively singletons per module, not per-instance.

**Pubsub:** the codebase uses an in-process pubsub built on jQuery events (`readk.it/js/app/utility.js:60-70`). Subscribe via `utility.subscribe('event_name', handler)`, publish via `utility.publish('event_name')`. Use this for cross-module signalling rather than wiring callbacks through constructors.

## SASS / CSS Conventions

- SASS (`.scss` syntax) compiled by Compass (`grunt-contrib-compass ~0.2.0`)
- Compass config at `readk.it/sass/config.rb` declares the directory layout (`css_dir`, `sass_dir`, `fonts_dir`, etc.)
- Single entry point `readk.it/sass/readkit-screen.scss` `@import`s `compass` then partials in a fixed order
- Partials live in `readk.it/sass/partials/` and follow the `_name.scss` naming required by SASS
- Library has a parallel `readk.it/library/sass/` tree with its own `config.rb`
- A separate stylesheet `readk.it/css/custom.css` is present (untracked per `git status`) for ad-hoc overrides

## Python Conventions

Only one Python file: `readkit.epub/manifest.maker.py`.
- Python 2 print statements (`print "..."` in `readkit.epub/manifest.maker.py:26,66`)
- 4-space indentation
- Bare `except:` clauses used as catch-alls (`readkit.epub/manifest.maker.py:11,31,37,50`)
- Uses `lxml.etree` for EPUB parsing
- Shebang line: `#! /usr/bin/env python`

## Build Conventions

**Tool:** Grunt 0.4.1 (`Gruntfile.js`, 1344 lines, 2-space indent).

**Entry tasks:**
- `grunt` — production build (default), driven by `shell:make_manifest_prod` (`Gruntfile.js:1342`)
- `grunt dev` — development build (`Gruntfile.js:1343`)

**Pattern:** the Gruntfile dynamically generates per-EPUB tasks at runtime by parsing the manifest. New EPUBs are added by dropping them into `readkit.epub/<id>/` and re-running the manifest generator.

---

*Convention analysis: 2026-04-26*
