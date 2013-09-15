/*
** config.js
**
** Author: Jason Darwin
**
** Main configuration file.
**
*/

/*global define:false */
define({

    // Normally the readk.it folder will live directly in the OEBPS folder,
    // so we'll be serving something like http://localhost:8000/OEBPS/readk.it/
    // The Epub directory is therefore ../../, but if we want Readk.it to 
    // live in a different place, we can specify another directory.
    epub_directory: "../../",

    // We have to poll to determine when elements have resized, such that the 
    // layout needs to be refreshed.
    // Set resize polling to 1 sec (default is 250ms)
    resize_interval: 1000,

    // What is the polling interval for window.resize?
    // This can be significantly smaller than resize_interval.
    window_resize_interval: 100,

    check_status_interval: 5000,

    // When switching fonts and font-sizes, which tags do we want to target?
    tags: 'html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed,  figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video, button',

    // How long do we wait for the DOM to adapt to the CSS changes,
    // such that we then stop polling for resize?
    css_redraw_interval: 5000,

    // Similar to the above, but only for a single page
    css_page_redraw_interval: 1000,

    // How long do we want to animate a scrolling action?
    scroll_duration: 200,

    // We can produce a lite version of Readk.it that is considerably smaller,
    // if we forego:
    // * Drag and drop (not needed for mobile)
    // * Modernizr / Detectizr
    lite: false,

    log: true,

    // What's the path to the web workers?
    workerScriptsPath: "js/lib/zip/",

    // What mode are we in:
    // * publication mode (we live in an EPUB)
    // * solo mode (all content is encoded in content.js using Data URIs)
    // * reader mode (no content)
    mode: "publication",
});
