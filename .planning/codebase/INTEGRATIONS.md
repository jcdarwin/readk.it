# External Integrations

**Analysis Date:** 2026-04-26

## Project Posture

readk.it is a **fully client-side, browser-based EPUB reader** with no backend server, no API tier, no user accounts, and no remote services consumed at runtime. The only network activity an end user performs is fetching the static reader assets and EPUB content from whichever static host serves the build output. As a result, this document is intentionally short — most categories below are "None".

## APIs & External Services

**None.**

- No HTTP API clients are configured. There are no `fetch()`, third-party SDK, REST, or GraphQL calls in `readk.it/js/`.
- All XHR-style traffic is local: jQuery `$.ajax` is used inside `readk.it/js/app/epub.js` to load EPUB component files (`url: src` / `url: href`) from the same origin that serves the reader.
- No analytics tags (no Google Analytics, GTM, Segment, Mixpanel, Amplitude). No error reporting (no Sentry, Rollbar, Bugsnag). No payment, auth, or messaging SDKs.
- Search across `readk.it/`, `readkit.epub/` (excluding EPUB prose) for `googleapis`, `googletagmanager`, `google-analytics`, `sentry`, `stripe`, `firebase`, `aws`, `s3.amazonaws` returned zero hits in code/config.

## Data Storage

**Databases:**
- None. No server, no DB, no ORM.

**Client-side storage:**
- HTML5 `localStorage` / `sessionStorage` via `jquery.storage.js` 0.0.3 (`readk.it/js/lib/jquery.storage.js`) — used to persist user preferences (font, size, line height) and bookmarks across sessions.
- HTML5 Application Cache for offline support:
  - `readk.it/readkit.appcache` (production solo).
  - `readk.it/readkit.dev.appcache` (development).
  - `readk.it/library/library.appcache`, `readk.it/library/offline.manifest` (library flavour).

**File Storage:**
- Local filesystem only. EPUB sources live under `readkit.epub/<book>/` in the repo and are copied/zipped into `dist/` at build time. Drag-and-dropped EPUBs are read in-browser via the File API and unzipped client-side with `zip.js` (`readk.it/js/lib/zip/`); they are never uploaded to any server.

**Caching:**
- Browser HTTP cache + HTML5 Application Cache only. No CDN, edge cache, Redis, Memcached, or service-worker cache.

## Authentication & Identity

**None.**

- No login, no sessions, no tokens, no OAuth providers, no SSO. The reader is open and anonymous.

## Monitoring & Observability

**Error Tracking:**
- None. There is no Sentry, Rollbar, Bugsnag, or analogous integration.

**Logs:**
- Client-side `console.log` only, gated by the `log: true` flag in `readk.it/js/app/config.js`. No log shipping.

## CI/CD & Deployment

**Hosting:**
- Not prescribed by the codebase. Output is plain static files in `dist/` (`dist/readkit.epub/`, `dist/readkit.solo/`, `dist/readkit.library/`, `dist/readkit.reader/`) suitable for any static web server (e.g. `http-server`, nginx, GitHub Pages, S3 static hosting).
- The `package.json` `repository.url` points to `git@mebooks.co.nz:/var/lib/git/readk.it` — a private git remote at mebooks.co.nz, not a deployment target.
- The reader project also lives on GitHub at `github.com/jcdarwin` (the patched Grunt plugins listed in `package.json` come from `git+https://github.com/jcdarwin/...`).

**CI Pipeline:**
- None present in the repo. No `.github/workflows/`, no `.gitlab-ci.yml`, no `circle.yml`, no `Jenkinsfile`. Builds are run manually via `grunt` / `grunt dev`.

## Environment Configuration

**Required env vars:**
- None. The project has no `.env`, no `.env.*`, no `process.env.*` reads, and no configuration sourced from environment variables. All configuration is hard-coded in `readk.it/js/app/config.js` and `readk.it/js/client.config.js`.

**Secrets location:**
- No secrets are stored in or required by the project. There are no API keys, tokens, or credentials anywhere in the tree.

## Webhooks & Callbacks

**Incoming:**
- None. There is no server to receive webhooks.

**Outgoing:**
- None. The application makes no outbound HTTP calls beyond same-origin EPUB asset fetches.

## Third-Party Embedded Code

These are bundled into the build (vendored, not network-loaded), so they create no live external dependency, but they are worth noting because they represent code paths owned by third parties:

- jQuery 2.0.3, RequireJS 2.1.8, iScroll 4.1.9, Modernizr 2.6.2, Detectizr 1.4.4, Lo-Dash 1.3.1 (custom build), zip.js (Gildas Lormeau, 2013), Sly 1.1.0, Underscore 1.4.3, QUnit 1.10.0 — all under `readk.it/js/lib/` or `readk.it/library/js/lib/`.
- Add to Homescreen 2.0.7 (Matteo Spinelli) — `readk.it/js/lib/add-to-homescreen/` — produces an in-page "add to home screen" prompt on iOS.
- Web fonts Lora and Source Sans Pro — `readk.it/fonts/Lora/`, `readk.it/fonts/SourceSansPro/` — bundled, not loaded from Google Fonts.
- Fontello icon font subset — `readk.it/fonts/fontello/`.

## Build-time Tooling Dependencies

These are external systems the *build* depends on (at developer-machine time, never at runtime in the user's browser):

- `python` (Python 2 + `lxml`) is shelled out from `Gruntfile.js` via `grunt-shell` to run `readkit.epub/manifest.maker.py`, which walks the EPUB sources and emits `readkit.epub/manifest.json`.
- `compass` (Ruby) is invoked by `grunt-contrib-compass` to compile SASS.
- `zip` and `mv` shell commands are invoked by `grunt-shell` tasks (e.g. `shell:<identifier>_zip`, `shell:<identifier>_mv`) to assemble EPUB outputs in `dist/`.
- Three personal forks on GitHub provide build plugins with no version pinning: `grunt-readkit-dom-munger`, `grunt-readkit-datauris`, `grunt-readkit-data-uri` (all `git+https://github.com/jcdarwin/...#master`). Loss of those repositories or a force-push to their `master` branches would silently change the build.

## EPUB Standard / Specification Touchpoints

While not "integrations" in the API sense, the application reads and writes formats defined by external specifications:

- **EPUB 2 / EPUB 3** (IDPF/W3C) — Parses `META-INF/container.xml`, OPF (`opf:package`, `opf:spine`, `opf:manifest`, `dc:title`, `dc:identifier`), and NCX (`toc.ncx`) documents (`readk.it/js/app/epub.js`, `readkit.epub/manifest.maker.py`).
- **Schema.org `Book`** — Microdata embedded in `readk.it/index.html` (`itemprop="name"`, `"author"`, `"description"`, `"publisher"`, `"inLanguage"`, `"copyrightHolder"`, `bookFormat="http://schema.org/EBook"`).
- **WOFF / TrueType** font specifications — Used for bundled web fonts.

---

*Integration audit: 2026-04-26*
