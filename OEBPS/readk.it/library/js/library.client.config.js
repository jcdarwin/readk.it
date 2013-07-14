/*
** library.client.config.js
**
** Author: Jason Darwin
**
** The extra resources from our EPUB/s that we want require.js to
** load into the Readk.it page.
** This allows us to 'mixin' various javascript libs from our EPUB
** file that are not native to Readk.it.
*/

var client = {
    // The paths for our EPUB assets
    paths: {
        client_js: '../../library/js'
    },
    // The required modules for our EPUB assets
    required: [
        'client_js/script'
    ]
};