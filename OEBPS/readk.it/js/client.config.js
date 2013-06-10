/*
** client.config.js
**
** Author: Jason Darwin
**
** The extra resources from our EPUB that we want to load into require.js.
** These are typically js files, but can be css and other, e.g.:
**
**    paths: {
**        client_css: '../../../css'
**    }
**
**    required: [
**        'css!client_css/normalize.css',
**        'css!client_css/screen.css',
**        'css!client_css/pure/pure-grids.css',
**        'css!client_css/pure/pure-min.css'
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
        'client_js/libs/jquery.fitvids',
        'client_js/script'
    ]
};