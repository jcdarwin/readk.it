/*
** client.config.js
**
** Author: Jason Darwin
**
** The extra resources from our EPUB/s that we want require.js to
** load into the page.
** These are typically js files, but can be css and other, e.g.:
**
**    paths: {
**        client_css: '../../../css'
**    }
**
**    required: [
**        'css!client_css/normalize.css'
**    ]
**
*/

var client = {
    // The paths for our EPUB assets
    paths: {
        client_js: '../../../js'
    },
    // The required modules for our EPUB assets
    required: [
        'client_js/libs/modernizr.min',
        'client_js/libs/jquery.easing.1.3.min',
        'client_js/libs/jquery.fitvids.min',
        'client_js/libs/enquire.min',
        'client_js/libs/screenfull.min',
        'client_js/script',
        'client_js/queries'
    ]
};