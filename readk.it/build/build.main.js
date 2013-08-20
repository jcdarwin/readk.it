/*
** This build config results in a single file, main.compiled.js, which 
** contains all the js for the project, including require.js.
*/

({
    baseUrl: '../js/lib',
    paths: {
        requireLib: 'require',
        app: '../app',
        underscore: 'underscore-min.amd'
    },
    name: '../readkit',
    include: [
        'requireLib',
        'jquery',
        'text',
        'app/controller',
        'app/config',
        'app/content',
        'add-to-homescreen/src/add2home',
    ],
    out: 'dist/js/readkit.js',
    map: {
      '*': {
        'css': 'require-css/css'
      }
    },
    shim: {
        // Shim in our jQuery plugins etc, as they aren't AMD modules
        'Modernizr': {deps: ['jquery'], exports: 'Modernizr'},
        'Detectizr': {deps: ['jquery', 'Modernizr'], exports: 'Detectizr'},
        'jquery.storage': ['jquery'],
        'jquery.ba-urlinternal.min': ['jquery'],
        'jquery.ba-resize': ['jquery'],
        'jquery.hotkeys': ['jquery'],
        // Make non-AMD modules available globally
        'iscroll': {exports: 'iScroll'},
        'zip/zip': {exports: 'zip'},
        'zip/inflate': {exports: 'inflate'},
    }
})
