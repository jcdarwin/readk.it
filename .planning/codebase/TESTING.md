# Testing Patterns

**Analysis Date:** 2026-04-26

## Summary

readk.it has a **minimal, mostly-vestigial test suite**. There is exactly one test file in the application source tree (`readk.it/js/test/app/epub.test.js`, 81 lines) wired into a QUnit harness that is run manually in a browser. There is **no `npm test` script**, **no CI integration**, **no headless test runner**, and **no coverage tooling**. The `package.json` `test` script is a placeholder:

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}
```
Source: `package.json:23-25`.

When adding new functionality, treat the absence of automated tests as a finding to surface in plans rather than a license to skip writing them. If a phase introduces tests, expect to also choose and wire up a test runner — none is in place.

## Test Framework

**Runner:** QUnit (vendored, no version metadata)
- Library: `readk.it/js/test/qunit/qunit.js` (51,709 bytes)
- Stylesheet: `readk.it/js/test/qunit/qunit.css`
- Loaded directly via `<script>` tag in `readk.it/js/test/index.html:9`
- Not installed via npm; not pinned in `package.json`

**Module loader for tests:** RequireJS (same as the application). Tests are AMD modules loaded asynchronously, then `QUnit.start()` is called once all modules resolve.

**Assertion API used:** `expect()`, `equal()`, `deepEqual()`, `test()`, `module()` — the classic QUnit 1.x globals (`readk.it/js/test/app/epub.test.js:6` declares them via `/*global ... */`).

**Run command:** there is no CLI runner. To run the tests:
1. Serve the project from a local HTTP server (e.g. `python -m SimpleHTTPServer 8000`)
2. Open `http://localhost:8000/readk.it/js/test/index.html` in a browser
3. Read pass/fail output from the rendered QUnit page

A commented-out nodeunit hook exists in `Gruntfile.js:248-250`:
```javascript
//nodeunit: {
//  files: ['test/**/*_test.js']
//},
```
…but it is disabled and `grunt-contrib-nodeunit ~0.2.0` is declared in `package.json:11` as an unused devDependency.

## Test File Organization

**Location:** separate `test/` tree, not co-located with source.

```
readk.it/js/
├── app/                    # source modules
│   ├── controller.js
│   ├── epub.js
│   └── ...
└── test/
    ├── index.html          # browser harness (HTML page with QUnit divs)
    ├── testsuite.js        # RequireJS bootstrap that lists test modules
    ├── qunit/              # vendored QUnit assets
    │   ├── qunit.js
    │   └── qunit.css
    └── app/                # mirrors source layout
        └── epub.test.js    # the only test
```

**Naming:** `<module>.test.js` (e.g. `epub.test.js` tests `app/epub.js`). New tests should follow this pattern and live in `readk.it/js/test/app/`.

## Test Structure

**Suite organization** (from `readk.it/js/test/app/epub.test.js`):

```javascript
/*global define:false, $:false, expect:false, test:false, equal:false,
         deepEqual:false, console:false, QUnit:false, module:false */
define(function (require) {

    require(['./controller', './config'], function(Controller, config){

        QUnit.log = function( result, message){
            // optional per-assertion hook (currently no-op)
        };

        // Load fixture data (the EPUB library manifest)
        $.getJSON(epub_directory + 'library/manifest.json', function(d) {
            data = d;
        })
        .success(function() {
            $.each(data, function(index, book) {
                book.epub_directory = epub_directory;
                perform_tests(book);
            });
        })
        .error(function() { console.error("error"); });

        function perform_tests(book) {
            var initialized = function (publication, layout) {
                module(publication.title + " (EPUB " + publication.version + ")", {
                    setup: function() { }
                });

                test("Number of pages and order correct, returns " + N + " and array",
                     function () {
                    expect(3);
                    equal(actual, expected, 'message');
                    deepEqual(actualArray, expectedArray, 'message');
                });
            };

            var testController = new Controller('../../' + book.epub_directory + book.path,
                                                initialized);
        }
    });
});
```

**Patterns observed:**
- One `module()` per EPUB publication. Module name embeds the title and EPUB version: `"<title> (EPUB <version>)"`.
- `setup` callback present but empty.
- `expect(N)` declares the planned assertion count up front.
- Test names are dynamically constructed strings that embed the expected value.
- Assertion messages include the actual value for diagnostic readability.
- No `teardown` hook is used.

## Test Bootstrap

**Bootstrap file:** `readk.it/js/test/testsuite.js`

```javascript
(function () {
    QUnit.config.autostart = false;

    require.config({
        baseUrl: '../lib',
        paths: {
            app: '../app',
            underscore: 'lodash'
        },
        map: { '*': { 'css': 'require-css/css' } }
    });

    var testModules = [
        "app/epub.test.js"
    ];

    require(testModules, function() {
        QUnit.start();
    });
}());
```

**To add a new test module:**
1. Create `readk.it/js/test/app/<module>.test.js`
2. Append `"app/<module>.test.js"` to the `testModules` array in `readk.it/js/test/testsuite.js:29-31`
3. Reload `readk.it/js/test/index.html` in a browser

**Critical detail:** the `.js` extension MUST be included in `testModules` entries — RequireJS treats them as relative paths rather than baseUrl lookups. The bootstrap file comments this explicitly (`testsuite.js:26-28`).

## Mocking

**Framework:** none.

**Approach:** the existing test does **not mock at all**. It exercises `Controller` and `Epub` end-to-end against real EPUB files in `readk.it/library/` and a real `manifest.json`. This is integration-style testing, not unit testing.

**Implications when writing new tests:**
- There is no Sinon, no jest mocks, no test doubles
- If you need to isolate a module, you must hand-roll stub objects and pass them as constructor arguments (the existing constructors accept callbacks, which makes this feasible — see `Epub(d, f, callback, files)` in `readk.it/js/app/epub.js:17`)
- DOM is a real DOM (browser environment). The QUnit harness provides a `<div id="qunit-fixture">` container with `#pageWrapper` and `#pageScroller` for layout tests (`readk.it/js/test/index.html:20-25`)

## Fixtures and Test Data

**Source of test data:** the production EPUB library and its generated manifest.

- `readk.it/library/manifest.json` — generated, lists all bundled EPUBs and their expected metadata (title, version, identifier, total_pages)
- The actual EPUB content lives under `readkit.epub/<id>/` and is referenced via `book.path`
- The Python script `readkit.epub/manifest.maker.py` generates the manifest from EPUB OPF files

**Pattern:** the test iterates every entry in the manifest, instantiates `Controller` against it, and asserts the parsed `Epub`/`Layout` matches the manifest's declared values. Adding a new EPUB to `readkit.epub/` and regenerating the manifest implicitly extends test coverage.

**No dedicated fixtures directory.** There is no `__fixtures__/` or `test/fixtures/` — production data doubles as test data.

## Coverage

**Coverage tooling:** none configured. No Istanbul, no nyc, no `--coverage` flag anywhere.

**Effective coverage:**
- `readk.it/js/app/epub.js` — covered indirectly via the integration test (page count, spine order)
- `readk.it/js/app/controller.js` — instantiated by the test, but only the EPUB-loading happy path is exercised
- `readk.it/js/app/layout.js` — exercised because `Controller` builds a `Layout`, but no direct assertions on layout behaviour
- `readk.it/js/app/utility.js` — **not covered**
- `readk.it/js/app/chrome.js` — **not covered** (700+ lines of UI behaviour, zero tests)
- `readk.it/js/app/config.js` — trivial config object, covered by being imported
- `readk.it/js/app/content.js` — placeholder, build-time replaced
- `readk.it/library/js/app/*` — **not covered**

## Test Types

**Unit tests:** none. The single test file is integration-style.

**Integration tests:** one (`epub.test.js`). Drives `Controller` → `Epub` → `Layout` against real EPUB files and asserts parsed metadata.

**End-to-end tests:** none. No Selenium, Cypress, Playwright, Puppeteer, or equivalent.

**Visual / regression tests:** none.

**Linting as a quality gate:** JSHint is wired into the prod and dev grunt builds (`Gruntfile.js:1017,1049`). This is the closest thing to an automated quality check that runs as part of normal workflow.

## Common Patterns

**Async testing (jQuery-deferred style):**
```javascript
$.getJSON(epub_directory + 'library/manifest.json', function(d) {
    data = d;
})
.success(function() { /* assertions here */ })
.error(function() { console.error("error"); });
```
Source: `readk.it/js/test/app/epub.test.js:20-29`.

**QUnit + RequireJS pattern (defer autostart):**
```javascript
QUnit.config.autostart = false;
require([...testModules], function() {
    QUnit.start();
});
```
Source: `readk.it/js/test/testsuite.js:6,34-36`.

Reference linked in the bootstrap: http://www.jonnyreeves.co.uk/2012/qunit-and-requirejs/

**Callback-driven assertions** (since `Epub` parses asynchronously):
```javascript
var initialized = function (publication, layout) {
    module(publication.title + " (EPUB " + publication.version + ")", { setup: function(){} });
    test("...", function () { /* ... */ });
};
new Controller(book.path, initialized);
```
The `initialized` callback is invoked once per publication after parsing completes, and registers the QUnit module/test inside that callback. This works because `QUnit.start()` is deferred until all modules load.

**Error testing:** none observed. The existing test does not assert on thrown exceptions or error paths.

## Recommendations for New Tests

When a phase requires test coverage:

1. **Decide whether to extend QUnit or replace it.** The current setup is browser-only and manual. For new automated tests, modern alternatives (Vitest, Jest, Mocha + headless Chrome) would be more practical, but introducing one is a non-trivial scope expansion.
2. **If extending QUnit:** follow the file naming (`<module>.test.js` in `readk.it/js/test/app/`), add to `testsuite.js`, and verify by opening `index.html` in a browser.
3. **Add an `npm test` script** so tests are discoverable. The current placeholder script returns exit 1, which makes it trivially "broken".
4. **Document any new mocking convention** — there is no precedent to follow.
5. **Avoid Promises / async-await in tests** if you stay on QUnit 1.x — it predates them. Use `$.Deferred` and explicit callbacks to match the existing style.

---

*Testing analysis: 2026-04-26*
