# Feature Research

**Domain:** Browser-only EPUB reader (no backend, no accounts) — greenfield rewrite of readk.it
**Researched:** 2026-04-26
**Confidence:** HIGH (cross-referenced against Thorium, Koodo, foliate-js, epub.js, Apple Books, Kobo, Calibre Viewer, EPUB Accessibility 1.1/1.2, WCAG 2.x)

## How to read this document

This document does NOT re-derive readk.it's already-validated capabilities (drag-drop EPUB upload, four-flavour build, per-EPUB persistence of font/size/line-height, bookmarks, hash-based library routing, web + `file://` modes). Those are taken as given from `.planning/PROJECT.md` "Validated".

The job here is to surface what *else* a 2026 user expects from a browser EPUB reader, plus what's a v1+ differentiator and what to deliberately exclude. At the end, a **Cross-reference vs. PROJECT.md** section flags any place where current scope and modern user expectations disagree.

---

## Feature Landscape

### Table Stakes (Users Expect These — Missing = Product Feels Broken)

These are non-negotiable for a 2026 reader. Users don't notice them when present; they bounce when absent.

| # | Feature | Why Expected | Complexity | Notes |
|---|---------|--------------|------------|-------|
| TS-01 | EPUB 2 + EPUB 3 reflowable rendering | The core job of an EPUB reader; both formats coexist in the wild and 92% of new contracts are reflowable | LOW (epub.js handles) | Validated — already in scope |
| TS-02 | Persistent reading position (per book, exact restore) | Users assume closing/reopening a book returns them to the same paragraph, not the same chapter | LOW (epub.js `locations` + CFI) | Already validated; ensure new impl uses CFI not page-index for exact restore across reflows |
| TS-03 | Table of Contents drawer / panel | Industry-universal — Apple Books, Kobo, Thorium, Koodo, Calibre, foliate, every web reader has one | LOW (epub.js `book.navigation.toc`) | Already in Active scope; flatten nested TOC for display, but preserve hierarchy in markup for screen readers |
| TS-04 | Adjustable font size | The single most-used reader control; users with presbyopia or small screens cannot read without it | LOW | Already validated |
| TS-05 | Adjustable line-height | Standard fine-grained typography control alongside font size | LOW | Already validated |
| TS-06 | Light + Dark + Sepia themes (with persistence) | Dark mode is now baseline; sepia is the third option every reader exposes (Apple "Quiet/Bold", Kobo, Thorium, Calibre) | LOW (CSS variables + epub.js `rendition.themes`) | Already in Active scope — confirm sepia, not just light/dark |
| TS-07 | Forward/back page navigation (visible chrome buttons) | Users cannot rely on gestures alone — desktop users with mice need clickable controls | LOW | Already validated |
| TS-08 | Keyboard navigation: Left/Right arrows = page turn, Home/End = first/last, Esc = close menu | WCAG 2.1.1 (keyboard accessible). Universal expectation on desktop | LOW | Existing `jquery.hotkeys` is dropped; replace with native `keydown` listener on the reader root |
| TS-09 | Touch swipe page turn (left/right) | Mobile/tablet baseline; competes with native readers | MEDIUM (epub.js paginated mode + Pointer Events) | Replace iScroll's swipe model; Pointer Events handle mouse + touch + pen uniformly |
| TS-10 | Edge-tap page turn (left edge = back, right edge = forward) | Standard mobile pattern (Kobo, Apple Books, KOReader, PocketBook); ~25% of width per side is the convention | LOW | Center-tap reveals/hides chrome — see TS-11 |
| TS-11 | Center-tap to toggle reader chrome (immersive mode) | Standard pattern across all major readers; lets the page fill the viewport for distraction-free reading | LOW | Tap zones: 25% / 50% / 25% horizontally |
| TS-12 | Reading progress indicator (per-book percent + per-chapter) | Users want to know "how much is left"; expected in every reader's chrome | LOW (epub.js `book.locations.percentageFromCfi`) | Generate `locations` once and cache to localStorage by EPUB identifier (epub.js docs) |
| TS-13 | Bookmarks (add / view list / jump to / remove) | Every modern reader has them; readk.it already does | LOW (already implemented) | Already validated — must preserve |
| TS-14 | Drag-and-drop EPUB upload | readk.it's existing differentiator that became table-stakes for "open my own file" web readers | LOW | Already validated |
| TS-15 | Library / catalog page with cover grid (or carousel + grid toggle) | A list of titles is the entry point for any multi-book product; modern UX leans grid-of-covers, not carousel-only | LOW–MEDIUM | Carousel exists; grid view is the 2026 default. Recommend grid-first with optional carousel for hero/featured row. |
| TS-16 | Persistent per-book preferences (font, size, line-height, theme) | readk.it already does font/size/line-height; theme persistence is the new addition | LOW | Already validated for typography; theme persistence is in Active scope |
| TS-17 | Responsive layout (desktop / tablet / mobile / portrait / landscape) | Single-column on phone, optionally 2-column on wide tablet/desktop, reflow on rotation | MEDIUM (epub.js spread mode) | epub.js supports `spread: 'auto'` — single column under ~800px, double above |
| TS-18 | Cover image rendering in library | Required to identify books at a glance — the universal book-grid affordance | LOW | Existing `manifest.maker.py` already extracts covers; preserve |
| TS-19 | Metadata display (title, author at minimum) on hover/tap of library tile | Without it, the grid is just thumbnails | LOW | Read from OPF Dublin Core; epub.js exposes `book.package.metadata` |
| TS-20 | Visible loading state when opening a book | Large EPUBs take seconds; silent loading feels broken | LOW | Existing reader has `#readkit-sitePreloader`; carry forward |
| TS-21 | Accessible focus states + visible focus ring | WCAG 2.4.7; keyboard users need to see where focus is | LOW | Don't `outline: none` without replacement; use `:focus-visible` |
| TS-22 | Screen-reader-friendly content (semantic HTML + ARIA roles) | EPUB Accessibility 1.1, WCAG 2.x AA, EAA (active in EU since June 2025) | MEDIUM | epub.js renders content into iframe — must preserve semantics from source EPUB; chrome must use `role="navigation"`, `role="main"`, `aria-label` on icon-only buttons |
| TS-23 | Reflow at 200% zoom without horizontal scrolling (WCAG 1.4.10) | Accessibility requirement that's also useful for everyone | LOW | Reflowable EPUBs satisfy by default; only fixed-layout fails — flag fixed-layout as out of scope or "best-effort" |
| TS-24 | Hash-based deep links to a publication | Already the readk.it library→reader handoff | LOW | Already validated |
| TS-25 | Same-origin and `file://` operation | `file://` is how the solo + EPUB-embedded flavours work | LOW | Already validated; epub.js + drag-drop + inline data URIs all keep this property |

### Differentiators (Competitive Advantage / Opt-in v1+)

Features that distinguish a thoughtful reader from a generic one. Pick a small subset for v1 — most of these can wait for v1.x.

| # | Feature | Value Proposition | Complexity | Notes |
|---|---------|-------------------|------------|-------|
| DF-01 | Continuous-scroll reading mode (toggle alongside paginated) | A loud minority of users strongly prefer scroll; offering both is now common (Apple Books, Kobo, Calibre, foliate, Koodo, epub.js) | MEDIUM (epub.js `flow: 'scrolled-doc'`) | Existing readk.it is paginated-only; PROJECT.md notes "iScroll-based swipe-sideways/scroll-vertically interaction is open to redesign". Strongly recommend: ship paginated as default + scroll as toggle. |
| DF-02 | Typography presets (Reading / Compact / Comfortable / Custom) | Saves users tweaking 4 sliders; mirrors Apple "Quiet"/"Bold" themes | LOW | Wraps existing font/size/line-height/margin into named presets |
| DF-03 | Font family picker beyond serif/sans toggle (e.g. Bookerly-style serif, Atkinson Hyperlegible, OpenDyslexic) | Existing reader is binary serif/sans; users expect 4–6 named choices in 2026 | LOW–MEDIUM | OpenDyslexic is licence-clean (SIL-OFL); Atkinson Hyperlegible is free (Braille Institute). Bundle a small named set; CSS `font-family` swap |
| DF-04 | Justified vs. ragged-right text toggle | Some users find justified text harder; many prefer ragged-right on narrow screens | LOW | CSS `text-align: justify | left` — single bool toggle |
| DF-05 | Hyphenation toggle (`hyphens: auto`) | Improves justified text quality; off by default avoids language-mismatch issues | LOW | Native CSS in modern browsers; lang attribute from EPUB drives it |
| DF-06 | Configurable margin / max line length | "Page width" / margin slider; some readers prefer narrow, others wide | LOW | CSS max-width on the rendition body |
| DF-07 | Adjustable paragraph spacing | Apple Books exposes this as a separate slider | LOW | CSS `margin-block` on paragraphs |
| DF-08 | Reading time estimate ("12 min left in chapter") | Common in Kindle, Apple Books, Kobo; popular with users who plan reading sessions | LOW | Compute from word-count per CFI range / average WPM (250) |
| DF-09 | Per-book vs. global preferences (with override) | readk.it currently per-book only; users often want a global default with per-book override | LOW | Storage layer split into "default" + "override" keys |
| DF-10 | "Last read" badge / "Continue reading" affordance on library | Re-entry should be one click from the library | LOW | Sort or pin most-recently-read book to top of grid |
| DF-11 | Finished/unread state on library tiles | Visual progress; pairs well with TS-12 | LOW | Read percentage from the same persisted CFI |
| DF-12 | Library search / filter (by title, author, tag) | Once the catalog has >12 items it becomes necessary; readk.it has 26 source EPUBs | LOW | Client-side filter over the existing `manifest.json` |
| DF-13 | Library sort (recent / title / author / added) | Standard list-view affordance | LOW | Same client-side mechanism as DF-12 |
| DF-14 | Library view toggle: grid / list | Grid-first, list-as-fallback for dense catalogs | LOW | CSS grid-vs-flex with a single toggle |
| DF-15 | First-launch onboarding hint ("drag an EPUB or pick from the library") | The drag-drop affordance is invisible until you know it exists | LOW | One-time dismiss, persisted to localStorage |
| DF-16 | Image inline-zoom (tap/click to enlarge to viewport) | Many EPUBs include figures that are unreadable at body size | LOW | Click handler on `img` inside the rendition iframe |
| DF-17 | Footnote popovers (tap a footnote ref → modal) | foliate, Apple Books, and modern EPUB 3 readers do this; jumping to end-of-book and back is jarring | MEDIUM | Detect `epub:type="noteref"` / `role="doc-noteref"` and render the target inline |
| DF-18 | Proper RTL / vertical writing mode (Arabic, Hebrew, Japanese tate-gaki) | foliate-js does this; not common among lightweight readers — a real differentiator if any source EPUBs need it | MEDIUM | epub.js supports `writingMode`; depends on source-EPUB metadata |
| DF-19 | "Reduce motion" respect (`prefers-reduced-motion`) | WCAG 2.3.3; users with vestibular issues need it; cheap to implement | LOW | Disable page-turn animations when matched |
| DF-20 | Theme follows OS (`prefers-color-scheme`) | Modern users expect dark/light to follow system unless overridden | LOW | CSS media query + override-from-localStorage logic |
| DF-21 | "Open in solo" download button (download a single self-contained HTML of the current book) | Aligns with readk.it's existing solo flavour — exposes it as a runtime option, not just a build artifact | MEDIUM | Requires runtime-bundling, may be too costly for v1; defer |
| DF-22 | Text-to-speech (browser SpeechSynthesis API) | Thorium, Koodo, Apple Books, foliate-js all have it; cheap with native browser APIs | MEDIUM | `SpeechSynthesis` is universal; quality varies by OS voice. Read the current page or selection. Defer past v1 if scope-tight. |
| DF-23 | Keyboard shortcut overlay (`?` shows the cheat sheet) | Power-user affordance; trivial cost | LOW | Modal listing all shortcuts |

### Anti-Features (Deliberately NOT in This Product)

These are commonly requested or assumed, but conflict with this product's principles (browser-only, no-backend, no-account, no-tracking) or its v1 scope.

| # | Anti-Feature | Why Requested | Why Problematic Here | Alternative |
|---|--------------|---------------|----------------------|-------------|
| AF-01 | User accounts / login | "I want my settings on every device" | Requires backend; violates the no-backend principle; brings password reset, GDPR, deletion flows | localStorage + per-device settings; document the trade-off |
| AF-02 | Cross-device reading-position sync | Users have multiple devices | Requires backend or a third-party sync provider; explicitly out-of-scope per PROJECT.md | Manual export/import of `localStorage` JSON could be a future opt-in |
| AF-03 | Cloud library / "your books on the server" | Users expect a Kindle-like cloud | Same backend issue; conflicts with the publisher-curated static-hosting model | Solo HTML build is the offline answer; EPUB-embedded reader self-hosts |
| AF-04 | Analytics / telemetry | "We need to know what users do" | Conflicts with privacy stance; readk.it has none today; modern privacy-respecting peers (ReadfulReader, Foliate) explicitly advertise none | Honour the existing absence; document explicitly in README |
| AF-05 | Ads / promoted content / store integration | Common monetisation in commercial readers | This is not a commercial product; static-hostable principle dies if a third-party SDK is added | None — keep clean |
| AF-06 | DRM enforcement (Adobe DRM, LCP) | Required for commercial library distribution | All readk.it source EPUBs are publisher-controlled and DRM-free; LCP requires a server-side license issuer | Stay DRM-free; document as out-of-scope |
| AF-07 | Annotations / highlights / margin notes (in v1) | Standard in Kindle/Apple Books | Explicitly deferred per PROJECT.md "Out of Scope"; epub.js supports it via `rendition.annotations` so v2 is feasible | Add in a later milestone; design the storage layer to leave room |
| AF-08 | In-book full-text search (in v1) | Standard in commercial readers | Explicitly deferred per PROJECT.md "Out of Scope"; requires building a per-book index (epub.js does not include one) | Add in a later milestone; foliate-js's standalone search module is a reference impl |
| AF-09 | Service Worker / PWA install (library site) | "Make it installable" | Explicitly out-of-scope per PROJECT.md; offline reading is delivered by the solo single-file build instead | Solo flavour |
| AF-10 | Page-curl / 3D page-flip animations | "It looks like a real book" | Distracting, expensive on low-end mobiles, conflicts with `prefers-reduced-motion` | Subtle slide or instant cut only |
| AF-11 | Built-in dictionary / Wikipedia lookup | Useful but adds external network calls | Network calls violate the offline-capable principle for the solo and EPUB-embedded flavours | Defer to v1.x with a clear "this calls a 3rd-party API" toggle |
| AF-12 | Social sharing ("share quote to Twitter") | Trendy in commercial apps | Adds tracking pixels; offline-incompatible; user can copy text | Native text-selection + clipboard works fine |
| AF-13 | Reading statistics ("you read 47 minutes today") | Quantified-self appeal | Requires persistent tracking, brings privacy concerns; better suited to per-device opt-in v2 | Could be added later as opt-in; localStorage-only |
| AF-14 | Honouring legacy `client.config.js` per-publication AMD plug-ins | Existing 2013 plug-in surface | Explicitly out-of-scope per PROJECT.md; security and bundling concerns | All needs are met by rebuilding EPUBs against the new pipeline |
| AF-15 | Internet Explorer / pre-Chromium Edge support | "Some users still…" | Explicitly out-of-scope; Browserslist drops it; the project's modernisation premise rests on this | Document required browsers in README |
| AF-16 | Book purchasing / library expansion via store | Commercial-reader feature | No backend, no payments; not the product | None — readers bring their own EPUBs (drag-drop) or use the curated library |
| AF-17 | "Login walls" / paywalls / regional gating | Commercial reader patterns | Conflicts with no-account principle; static-host-friendly publishers can't gate at the edge anyway | Static publishing has no gate |

---

## Reading Interaction Model — Recommendation

**Recommendation:** Ship paginated mode as default with continuous scroll as a toggleable alternative.

**Why:**
- Paginated is the dominant model in commercial readers (Apple Books, Kobo, Kindle defaults) and what most users picture when they think "reader."
- Scroll is strongly preferred by a vocal subset (especially long-form non-fiction readers and those who already use Calibre / Koodo / foliate). Not offering it is a recurring complaint in reader reviews.
- epub.js supports both natively (`flow: 'paginated' | 'scrolled-doc'`) — no extra engine work.
- The existing readk.it model (swipe-sideways-between-chapters, scroll-vertically-within-chapter via iScroll) is unusual; PROJECT.md explicitly opens this UX to redesign. Replacing it with a more conventional model is the right call.

**Tap zones (paginated mode, mobile/tablet):** 25% left = previous, 50% centre = toggle chrome, 25% right = next. Standard across PocketBook, Kobo, Apple Books.

**Mouse zones (paginated mode, desktop):** Click anywhere is too aggressive for desktop. Use chrome buttons + arrow keys + on-page click only inside ~10% edge zones.

**Swipe (paginated mode, touch):** Use Pointer Events (modern, unified) rather than per-platform touch/mouse handlers. epub.js paginated mode supports swipe out of the box. Drop iScroll entirely.

**Animation:** Cross-fade or instant slide. Avoid page-curl. Honour `prefers-reduced-motion`.

---

## Fixed-Layout EPUB Recommendation

**Recommendation:** Reflowable EPUB only in v1; fixed-layout is "renders, but no special FXL pinch-zoom support."

**Why:**
- 92% of new EPUB contracts in 2026 are reflowable; fixed-layout is mostly children's books, comics, and design-heavy publications.
- None of the 26 source EPUBs in `readkit.epub/` need fixed-layout (they are novels and educational publications).
- Proper FXL support requires synthetic-spread logic, pinch-zoom, and viewport-meta interpretation — significant work.
- epub.js can render FXL pages but the interaction model has gaps (pinch-zoom isn't built in).
- The EPUB Accessibility 1.2 spec calls out FXL as inherently accessibility-hostile.

**Defer to v2 unless a source EPUB demands it.** Document in PROJECT.md.

---

## Accessibility Floor (WCAG 2.x AA + EPUB Accessibility 1.1)

The European Accessibility Act has been in force since June 2025. Even though this is an open-source project, conforming to WCAG 2.x AA is the right baseline.

**Must-have for v1:**
- Semantic HTML for all chrome controls (`<button>`, `<nav>`, `<dialog>`)
- Keyboard navigation: all chrome reachable via Tab, all actions triggerable via Enter/Space
- Visible focus states (`:focus-visible`)
- Reflow at 200% zoom without horizontal scrolling (WCAG 1.4.10) — reflowable EPUBs satisfy this
- ARIA labels on icon-only buttons
- Colour contrast in chrome ≥ 4.5:1 for normal text, ≥ 3:1 for UI components
- Respect `prefers-reduced-motion`
- Respect `prefers-color-scheme` (with override)
- Lang attribute propagated from EPUB metadata to the rendition iframe (lets screen readers use correct pronunciation)
- TOC drawer announces hierarchy correctly (use proper `<nav><ol>` not `<div>`s)
- Don't trap focus in the rendition iframe — Tab must exit back to the chrome

**Nice-to-have for v1.x:**
- High-contrast theme (beyond sepia/dark)
- OpenDyslexic font option (DF-03)
- Screen-reader-friendly progress announcements (`aria-live="polite"` on percentage)
- Skip-to-content link

**Out of v1 (with documented reason):**
- Built-in TTS (DF-22) — `SpeechSynthesis` is straightforward but quality is OS-dependent and adds a UI surface; defer

---

## Mobile / Tablet Specifics

| Concern | Recommendation | Rationale |
|---------|----------------|-----------|
| Gesture model | Pointer Events; tap zones 25/50/25; swipe horizontally for page; vertical swipe in scroll mode | Unified across platforms (Pointer Events superseded the touch/mouse split); mirrors user expectation |
| Pinch zoom | Disable on reflowable (zoom = font-size slider); enable on fixed-layout (deferred to v2) | Pinch-zoom on reflowable text creates broken layouts; users want font-size, not zoom |
| Orientation change | Re-flow content on `resize` / `orientationchange`; preserve CFI position | epub.js's `rendition.resize()` handles this if hooked correctly |
| Virtual keyboard | No text input in reading view = not a concern; library search input must use `viewport-fit=cover` and not jump on keyboard open | Library search is the only text input; use `inputmode="search"` |
| Hardware back button (Android) | Browser back exits the book; the library is the previous history entry | Already the readk.it model via hash routing; preserve |
| Safe-area insets (notch, home indicator) | Use `env(safe-area-inset-*)` in chrome padding | iOS Safari default; trivial CSS |
| Tap to toggle chrome (immersive) | Centre tap zone | Apple Books / Kobo standard |
| Long-press | Reserved (selection / future annotations) | Don't bind anything to long-press in v1 |

---

## Library / Catalog Page

| Aspect | Recommendation | Rationale |
|--------|----------------|-----------|
| Default view | Cover grid (responsive: 2 cols mobile, 4–6 cols tablet, 6–10 cols desktop) | Modern UX standard; readk.it's existing carousel feels dated |
| Carousel | Optional "featured" hero row above the grid | Preserves the carousel-feel without making it the only navigation |
| Title/author display | Always-visible under cover (one line each, ellipsis); not hover-only | Mobile users have no hover; accessibility benefit |
| Search | Top-of-page search input, client-side filter on title + author | Catalog is small enough that no server search is needed |
| Sort | Dropdown: Recently read / Title (A–Z) / Author / Date added | Standard set; "recently read" relies on TS-12 progress data |
| "Continue reading" affordance | Pin most-recent book to a hero card above grid (DF-10) | Universal in 2026 reader UX |
| Progress overlay on covers | Subtle bar across bottom of cover when started; checkmark when finished (DF-11) | Lets users distinguish unread / in-progress / done |
| Empty state | Drag-drop hint when library is empty (DF-15) | The drag-drop affordance is otherwise invisible |
| Mobile | Single column at narrow widths, bottom-sheet pattern for sort/filter | Modern mobile filter pattern |

---

## Theme + Typography Recommendation Set

The minimum viable typography set for v1 (beyond what readk.it already has):

| Control | Default | Range | Source |
|---------|---------|-------|--------|
| Theme | Auto (follow OS) | Light / Sepia / Dark / Auto | New |
| Font family | Original (publisher-set) | Original / Serif / Sans / OpenDyslexic | DF-03 |
| Font size | 100% | 80–200% in 10% steps | Existing |
| Line height | 1.5 | 1.2–2.0 in 0.1 steps | Existing |
| Margins | Medium | Narrow / Medium / Wide | DF-06 |
| Justify | Off | On / Off | DF-04 |
| Hyphenation | Off | On / Off | DF-05 |

`<5 controls` is too few for power users; `>10` is overwhelming. The above is the median set across Apple Books, Kobo, foliate, Thorium.

---

## Feature Dependencies

```
[Theme switching]
    └──requires──> [CSS variable architecture in chrome]
    └──requires──> [epub.js rendition.themes API for in-iframe content]

[TOC drawer]
    └──requires──> [epub.js book.navigation parsing] (replaces current readk.it nav_entries[])
    └──enhances──> [Reading position] (jumping via TOC must update CFI persistence)

[Persistent reading position]
    └──requires──> [epub.js book.locations.generate() (one-time per book, cached)]
    └──requires──> [localStorage write on render-change events]
    └──enhances──> [Library "Continue reading"]
    └──enhances──> [Reading progress %]

[Continuous scroll mode (DF-01)]
    └──requires──> [epub.js flow: 'scrolled-doc']
    └──conflicts──> [Tap zones designed for paginated]
        — when in scroll mode, tap zones become tap-anywhere-toggle-chrome only

[Library search/sort/filter]
    └──requires──> [manifest.json with title/author/cover/identifier/path]
    └──enhances──> [Library catalog usability for >12 items]

[Continue reading on library]
    └──requires──> [Reading position persistence per identifier]
    └──requires──> [Library reads localStorage at boot — cross-page state]

[Bookmarks]
    └──requires──> [epub.js CFI generation on add]
    └──requires──> [localStorage list per identifier]
    └──preserved──> [Already validated in current readk.it]

[OpenDyslexic / extra fonts]
    └──requires──> [Font loading at chrome boot, scoped to rendition iframe]
    └──enhances──> [Accessibility]

[Footnote popovers (DF-17)]
    └──requires──> [Detection of epub:type="noteref" / role="doc-noteref"]
    └──requires──> [Modal/popover component]

[TTS (DF-22)]
    └──requires──> [Browser SpeechSynthesis API]
    └──conflicts──> [Drag-drop EPUB upload] — file:// browsers may have voice access issues

[Annotations / highlights] (deferred per PROJECT.md)
    └──requires──> [epub.js rendition.annotations API]
    └──requires──> [Selection model with CFI ranges]
    └──future──> [Storage schema must accommodate annotations[] alongside bookmarks[]]

[In-book search] (deferred per PROJECT.md)
    └──requires──> [Per-book full-text index (built at parse time or lazy)]
    └──enhances──> [foliate-js search module is a reusable reference]
```

### Dependency Notes

- **TOC drawer requires epub.js navigation parsing:** `book.navigation.toc` returns the parsed structure as an array of `{label, href, subitems}`; the drawer is a render of this tree. Replaces current `nav_entries[]`.
- **Reading position requires `book.locations.generate(N)`:** runs once per book to build a CFI grid; expensive (~1–3s for a 100k-word book) so cache the result keyed by EPUB identifier.
- **Continuous scroll conflicts with tap zones:** in scroll mode there's no "next page" — the entire screen should toggle chrome (or use top/bottom edge taps for jump-to-top/bottom).
- **Library "Continue reading" needs cross-page state:** reader page writes localStorage; library page reads it. Use the EPUB identifier as the key (already the readk.it convention).
- **OpenDyslexic enhances accessibility but isn't a panacea:** research is mixed (Rello & Baeza-Yates 2013 found no improvement; Broadbent 2023 found user preference). Offer it as an option, not a default.

---

## MVP Definition

### Launch With (v1)

The minimum to ship a credible 2026 browser EPUB reader without regressing readk.it's existing capabilities. All Active items from PROJECT.md are included; the new items here are the table-stakes-not-yet-on-the-Active-list (calls out below).

**Already in PROJECT.md Active scope:**
- [ ] TS-03: TOC drawer
- [ ] TS-06: Light / Dark / Sepia themes with persistence
- [ ] TS-08: Keyboard navigation (replaces jquery.hotkeys)

**Already validated in readk.it (must not regress):**
- [ ] TS-01, TS-02, TS-04, TS-05, TS-07, TS-13, TS-14, TS-15, TS-16, TS-18, TS-19, TS-20, TS-24, TS-25

**New table-stakes recommended for v1 (not yet explicitly in PROJECT.md):**
- [ ] TS-09: Touch swipe page turn via Pointer Events (replaces iScroll model — PROJECT.md notes UX is open to redesign)
- [ ] TS-10: Edge-tap page turn (left/right zones)
- [ ] TS-11: Centre-tap to toggle chrome (immersive mode)
- [ ] TS-12: Reading progress indicator (per-book percent via epub.js locations)
- [ ] TS-17: Responsive layout including 2-column spread on wide viewports
- [ ] TS-21: Visible focus states (`:focus-visible`)
- [ ] TS-22: ARIA labels + semantic HTML on chrome
- [ ] TS-23: Reflow at 200% zoom (verify in Playwright)

### Add After Validation (v1.x)

Differentiators worth shipping once core is stable:

- [ ] DF-01: Continuous-scroll mode toggle — strong user-demand signal; cheap (epub.js `flow`)
- [ ] DF-03: Extra font choices including OpenDyslexic — accessibility win
- [ ] DF-04: Justify toggle
- [ ] DF-05: Hyphenation toggle
- [ ] DF-06: Margin / line-length control
- [ ] DF-08: Reading time estimate
- [ ] DF-10: "Continue reading" affordance on library
- [ ] DF-11: Progress overlay on library covers
- [ ] DF-12, DF-13, DF-14: Library search / sort / view toggle
- [ ] DF-15: First-launch onboarding hint
- [ ] DF-16: Image inline-zoom
- [ ] DF-19: `prefers-reduced-motion` respect
- [ ] DF-20: `prefers-color-scheme` follow-OS theme

### Future Consideration (v2+)

- [ ] Annotations / highlights (currently Out of Scope)
- [ ] In-book full-text search (currently Out of Scope)
- [ ] DF-17: Footnote popovers
- [ ] DF-18: RTL / vertical writing support
- [ ] DF-22: Text-to-speech
- [ ] DF-21: Runtime "download as solo HTML"
- [ ] Fixed-layout EPUB pinch-zoom support (only if a source EPUB needs it)
- [ ] Reading statistics opt-in (respecting privacy stance)

---

## Feature Prioritization Matrix

| # | Feature | User Value | Implementation Cost | Priority |
|---|---------|------------|---------------------|----------|
| TS-03 | TOC drawer | HIGH | LOW | P1 |
| TS-06 | Themes (light/dark/sepia) | HIGH | LOW | P1 |
| TS-09 | Touch swipe (Pointer Events) | HIGH | MEDIUM | P1 |
| TS-10 | Edge-tap page turn | HIGH | LOW | P1 |
| TS-11 | Centre-tap toggles chrome | HIGH | LOW | P1 |
| TS-12 | Reading progress % | HIGH | LOW | P1 |
| TS-08 | Keyboard nav | MEDIUM | LOW | P1 |
| TS-21 | Focus states | MEDIUM | LOW | P1 |
| TS-22 | ARIA + semantic HTML | MEDIUM | MEDIUM | P1 |
| TS-17 | Responsive 2-col spread | MEDIUM | MEDIUM | P1 |
| DF-01 | Continuous scroll toggle | HIGH | MEDIUM | P2 |
| DF-08 | Reading time estimate | MEDIUM | LOW | P2 |
| DF-10 | "Continue reading" library card | HIGH | LOW | P2 |
| DF-11 | Library cover progress | MEDIUM | LOW | P2 |
| DF-12 | Library search | HIGH | LOW | P2 |
| DF-13 | Library sort | MEDIUM | LOW | P2 |
| DF-14 | Library grid/list toggle | LOW | LOW | P2 |
| DF-03 | Extra fonts incl. OpenDyslexic | MEDIUM | LOW | P2 |
| DF-04 | Justify toggle | LOW | LOW | P2 |
| DF-05 | Hyphenation toggle | LOW | LOW | P2 |
| DF-06 | Margin control | MEDIUM | LOW | P2 |
| DF-19 | prefers-reduced-motion | MEDIUM | LOW | P2 |
| DF-20 | prefers-color-scheme | MEDIUM | LOW | P2 |
| DF-15 | Onboarding hint | LOW | LOW | P2 |
| DF-16 | Image inline-zoom | MEDIUM | LOW | P2 |
| DF-17 | Footnote popovers | MEDIUM | MEDIUM | P3 |
| DF-22 | Text-to-speech | MEDIUM | MEDIUM | P3 |
| DF-18 | RTL / vertical writing | LOW (for current corpus) | MEDIUM | P3 |
| DF-21 | Runtime "save as solo HTML" | LOW | HIGH | P3 |
| DF-23 | Keyboard shortcut overlay | LOW | LOW | P3 |

**Priority key:**
- P1: v1 launch — must have
- P2: v1.x — add once core is stable
- P3: v2+ or scope-permitting

---

## Competitor Feature Analysis

| Feature | epub.js (vanilla) | Thorium (desktop) | Koodo (web) | foliate-js | Apple Books | Kobo Web | readk.it (current) | Our v1 plan |
|---------|------|---------|-------|------------|-------------|----------|--------------------|-------------|
| EPUB 2 + 3 reflowable | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (via epub.js) |
| Fixed layout EPUB | partial | ✓ | partial | ✓ | ✓ | ✓ | ✗ | render-only, defer FXL UX |
| Paginated mode | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (custom iScroll) | ✓ (epub.js paginated) |
| Continuous scroll | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | DF-01 (v1.x) |
| Light/Dark/Sepia | UI-layer | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ (Active scope) |
| TOC drawer | UI-layer | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ (Active scope) |
| Bookmarks | UI-layer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (preserved) |
| Reading position (CFI) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (page-index) | ✓ (upgrade to CFI) |
| Reading progress % | UI-layer | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | TS-12 |
| Highlights / annotations | ✓ (API) | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | DEFERRED (v2) |
| In-book search | UI-layer | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | DEFERRED (v2) |
| Text-to-speech | – | ✓ | ✓ | ✓ | ✓ | partial | ✗ | P3 (v1.x) |
| Built-in dictionary | – | roadmap | ✓ | ✓ | ✓ | ✓ | ✗ | ANTI-FEATURE (offline incompat) |
| Cross-device sync | – | ✗ | ✓ (via cloud) | ✗ | ✓ | ✓ | ✗ | ANTI-FEATURE (no backend) |
| Drag-drop file upload | UI-layer | ✓ | ✓ | ✓ | n/a | n/a | ✓ | ✓ (preserved) |
| OpenDyslexic font | UI-layer | ✓ | – | – | partial | ✓ | ✗ | DF-03 (v1.x) |
| Library / bookshelf UI | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (carousel) | ✓ (grid + carousel) |
| Library search/filter | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | DF-12/13 (v1.x) |
| OPDS catalog support | – | ✓ | – | – | – | – | ✗ | OUT OF SCOPE |
| Privacy / no-tracking | n/a | ✓ | ✓ (local mode) | ✓ | ✗ (Apple ID) | ✗ (Kobo account) | ✓ | ✓ (preserved) |
| Offline / no-server | n/a | ✓ | partial | ✓ | ✓ (downloaded) | ✗ | ✓ | ✓ (preserved) |

---

## Cross-Reference vs. PROJECT.md

This section flags any place where research findings disagree with current PROJECT.md scope.

### Items where research suggests upgrading from "not mentioned" to v1 table-stakes

| Finding | Recommendation | PROJECT.md status |
|---------|----------------|-------------------|
| Reading progress % (TS-12) is universal in 2026 readers | Add to v1 Active | Not mentioned — gap |
| Continuous-scroll mode toggle (DF-01) is now offered by every major reader | Add to v1.x at minimum | Not mentioned; PROJECT.md does open the iScroll UX to redesign |
| Edge-tap / centre-tap zones (TS-10/11) are the universal mobile model | Add to v1 (replaces iScroll swipe) | Implicit in "iScroll-based interaction is open to redesign" — make explicit |
| Touch via Pointer Events (TS-09) replaces iScroll | Add to v1 | Implicit in "drop iScroll" — make explicit |
| WCAG 2.x AA + EPUB Accessibility 1.1 conformance | Add to v1 quality bar | Not explicitly called out — gap; relevant given EAA is in force |
| `prefers-reduced-motion` and `prefers-color-scheme` respect | Add to v1.x | Not mentioned — gap |
| Library search / sort / filter | Add to v1.x (catalog of 26 EPUBs is over the threshold) | Not mentioned — gap |
| "Continue reading" affordance on library | Add to v1.x | Not mentioned — gap |
| CFI-based position (not page-index) | Specify in v1 | Implicit in "adopt epub.js" — make explicit, since current readk.it persists page index |

### Items confirmed as correctly Out of Scope

The following are correctly excluded; research found no reason to revisit:

- AF-01 / AF-02 / AF-03: Accounts, sync, cloud library — confirmed, conflicts with no-backend principle
- AF-07 / AF-08: Annotations and in-book search — correctly deferred; these are real differentiators but expensive
- AF-09: Service Worker / PWA — correctly deferred; the solo flavour replaces it
- AF-15: IE / pre-Chromium Edge — correctly dropped
- DRM (AF-06): All source EPUBs are publisher-controlled; LCP requires a server

### Items where PROJECT.md scope is correct but the rationale could be sharpened

- **Themes scope:** PROJECT.md says "light / dark / sepia theme support with persistence (per-book or global)". Research confirms: per-book + global with override (DF-09) is the right model — Apple/Kobo/Calibre all do this.
- **TOC drawer:** PROJECT.md says "TOC drawer / navigation panel". Research confirms hierarchical TOC with proper semantics; flatten for display, preserve hierarchy for screen readers.
- **Browser targets:** PROJECT.md says "current and last 1–2 versions of Chrome, Edge, Firefox, Safari". Research confirms this is the right set; Pointer Events, CSS variables, `:focus-visible`, `prefers-*` media queries all work uniformly across this set.

### One ambiguity worth resolving early

- **Reading interaction model:** PROJECT.md says "Preserving the iScroll-based swipe-sideways/scroll-vertically interaction unchanged" is *out of scope* (i.e. UX is open to redesign), but does not specify what replaces it. Research strongly recommends: **paginated mode + standard tap zones as default, scroll as a toggle** (TS-09/10/11 + DF-01). Worth a Key Decision entry in PROJECT.md once chosen.

---

## Sources

### Reading systems analysed

- [Thorium Reader (EDRLab)](https://www.edrlab.org/software/thorium-reader/) — features, accessibility, 2025/2026 roadmap
- [Thorium Reader on GitHub](https://github.com/edrlab/thorium-reader)
- [Thorium Reader Quick Start Guide (DAISY Consortium)](https://daisy.org/guidance/info-help/guidance-training/reading-systems/thorium-epub-reader-quick-start-guide/)
- [Koodo Reader (homepage)](https://www.koodoreader.com/en) — formats, layouts, sync, TTS
- [Koodo Reader on GitHub](https://github.com/koodo-reader/koodo-reader)
- [Koodo Reader changelog](https://koodoreader.com/en/changelog)
- [In-Depth Review of Koodo Reader (Oreate AI)](https://www.oreateai.com/blog/indepth-review-of-koodo-reader-a-comprehensive-analysis-of-a-crossplatform-open-source-ebook-reader/7ef3ba5f2a13acde60a05ef296fdb76a)
- [foliate-js on GitHub](https://github.com/johnfactotum/foliate-js) — search module, TTS module, dict module
- [foliate-js README (search/TTS/dict modules)](https://github.com/johnfactotum/foliate-js/blob/main/README.md)
- [Foliate (desktop) on GitHub](https://github.com/johnfactotum/foliate) — RTL, vertical writing, hyphenation, justify
- [epub.js documentation 0.3](http://epubjs.org/documentation/0.3/) — flows, themes, locations, navigation API
- [epub.js on GitHub](https://github.com/futurepress/epub.js/) — features, scripted-content security
- [epub.js pagination example](https://futurepress.github.io/epub.js/examples/swipe.html)
- [Building a universal reader with epub.js (Impelsys, Mar 2026)](https://medium.com/impelsys/building-a-universal-ebook-reader-with-epub-js-1ac32ca6265e)
- [Readium Web (readium.org)](https://readium.org/web/) — toolkit overview
- [Readium Web on GitHub](https://github.com/readium/web)
- [Readium Web (EDRLab)](https://www.edrlab.org/software/readium-web/) — current state, FXL support
- [What is Readium (Kitaboo, 2025)](https://kitaboo.com/understanding-readium/)
- [Calibre E-book Viewer manual](https://manual.calibre-ebook.com/viewer.html) — dark mode, search, viewer customisation
- [Calibre — what's new](https://calibre-ebook.com/whats-new)
- [Apple Books on iPhone (Apple Support)](https://support.apple.com/en-sg/guide/iphone/iphc1af7c57/ios) — Page-turn styles, themes, font customisation
- [Inside Apple Books (AppleInsider)](https://appleinsider.com/inside/ios-18/tips/inside-apple-books----the-best-app-for-book-lovers)
- [Customise Apple Books themes (iGeeksBlog)](https://www.igeeksblog.com/how-to-customize-themes-reading-books-ipad-iphone/)
- [Kobo touch gestures](https://help.kobo.com/hc/en-us/articles/360017639973-Use-gestures-on-the-touch-screen)
- [Kobo gesture controls (Good e-Reader)](https://goodereader.com/blog/kobo-ereader-news/switch-easily-between-different-kobo-books-with-new-gesture-controls)

### Standards and accessibility

- [EPUB Accessibility 1.2 (W3C)](https://www.w3.org/TR/epub-a11y-12/)
- [EPUB Accessibility — Fixed Layout Best Practices (W3C)](https://www.w3.org/TR/epub-fxl-a11y/)
- [EPUB Accessibility Techniques 1.1 (W3C draft)](https://w3c.github.io/epub-specs/epub33/a11y-tech/)
- [EPUB Canonical Fragment Identifiers 1.1](https://idpf.org/epub/linking/cfi/epub-cfi.html)
- [EPUB Locators (W3C draft)](https://w3c.github.io/epub-specs/epub33/locators/)
- [WCAG 2.1 Reflow (W3C)](https://w3c.github.io/wcag21/understanding/21/reflow.html)
- [Accessibility in Digital Publishing 2025 (PublishDrive)](https://publishdrive.com/accessibility-in-digital-publishing-2025-your-complete-guide-to-creating-inclusive-epubs-2.html) — EAA context, June 2025 deadline
- [Best Practices for Accessible Ebooks (A11Y Collective)](https://www.a11y-collective.com/blog/ebook-accessibility/)
- [Reflowable vs Fixed Layout EPUB (Kitaboo, 2026)](https://kitaboo.com/reflowable-or-fixed-layout-epub-which-is-better/) — 92%/82% statistics
- [Reflowable vs Fixed-Layout (ebookpbook, Feb 2026)](https://www.ebookpbook.com/2026/02/23/reflowable-vs-fixed-layout-epub/)

### Typography and dyslexia

- [OpenDyslexic font](https://opendyslexic.org/) — SIL-OFL licence
- [OpenDyslexic on Wikipedia](https://en.wikipedia.org/wiki/OpenDyslexic)
- [The effect of OpenDyslexic on reading rate (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5629233/) — Rello & Baeza-Yates 2013 critique
- [Best font for dyslexia (iubenda)](https://www.iubenda.com/en/help/184227-best-font-for-dyslexia-3/)
- [Use OpenDyslexic on Kobo](https://help.kobo.com/hc/en-us/articles/360020048733-Use-the-OpenDyslexic-font-on-your-Kobo-eReader)
- [How multicolumn layout works (Readium CSS docs)](https://readium.org/css/docs/CSS04-multicolumn_layout.html)

### Privacy / no-backend reader patterns

- [ReadfulReader — private offline EPUB reader](https://www.readful.net/)
- [A Paper-Style Online Reader (DEV)](https://dev.to/techno_kraft_in/a-paper-style-online-reader-no-app-no-login-no-cloud-dkd)
- [Best offline-only ebook reader (HN discussion)](https://news.ycombinator.com/item?id=41423676)

### Mobile interaction / tap zones

- [PocketBook tap zones (MobileRead Wiki)](https://wiki.mobileread.com/wiki/PocketBook)
- [KOReader User Guide](https://koreader.rocks/user_guide/)
- [Kavita epub reader tap pagination discussion](https://github.com/Kareadita/Kavita/issues/3061)

### Library / catalog UI

- [15 Filter UI Patterns That Actually Work in 2026 (Bricx Labs)](https://bricxlabs.com/blogs/universal-search-and-filters-ui)
- [UI Patterns for Displaying Collections (Substack)](https://datautilitarian.substack.com/p/ui-patterns-for-displaying-collections)
- [Mobile Design Pattern Gallery — Search/Sort/Filter (O'Reilly)](https://www.oreilly.com/library/view/mobile-design-pattern/9781449336455/ch04.html)

---

*Feature research for: browser-only EPUB reader (greenfield rewrite of readk.it)*
*Researched: 2026-04-26*
*Confidence: HIGH — multi-source verification across reading systems, W3C standards, and 2026 industry guidance*
