/*
** This build config results in a single file, main.compiled.js, which 
** contains all the js for the project, including require.js.
*/

({
    baseUrl: '../js/lib',
    paths: {
//        requireLib: 'require',
        app: '../app',
        underscore: 'underscore-min.amd',
        client_js: '../../../js'
    },
    name: '../main',
    include: [
//        'requireLib',
        'jquery',
        'app/controller',
        'app/config',
        'add-to-homescreen/src/add2home',
        'client_js/libs/modernizr.min',
        'client_js/libs/jquery.easing.1.3.min',
        'client_js/libs/jquery.fitvids.min',
        'client_js/libs/enquire.min',
        'client_js/libs/screenfull.min',
        'client_js/script',
        'client_js/queries'
    ],
    out: 'dist/main.compiled.js',
    map: {
      '*': {
        'css': 'require-css/css'
      }
    },
    shim: {
        // Shim in our jQuery plugins etc, as they aren't AMD modules
        'jquery.storage': ['jquery'],
        'jquery.ba-urlinternal.min': ['jquery'],
        'jquery.hotkeys': ['jquery'],
        // Make non-AMD modules act like AMD modules
        'iscroll': {exports: 'iScroll'}
    }
})
