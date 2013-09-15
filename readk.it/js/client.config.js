/*
** client.config.js
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
        client_js: '../../../js',
        client_js_build: '../../js'
    },
    // The required modules for our EPUB assets.
    // Note that we don't need to specify the following as Readk.it 
    // has them baked in:
    // * jQuery2
    // * Modernizr
    // * Detectizr
    required: [
        /* E.G.
        'client_js/libs/enquire.min',
        'client_js/libs/screenfull.min',
        'client_js/script',
        'client_js/queries'
        */
    ],
    shims: {
        // We need to describe the dependencies of any non-AMD modules here
        // so that require.js loads them in the correct order.
        /* E.G.
        'client_js/queries': ['client_js/libs/enquire.min'],
        'client_js/script': ['client_js/queries']
        */
    }
};