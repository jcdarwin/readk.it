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
        client_js: '../../js'
    },
    name: '../main',
    include: [
//        'requireLib',
        'jquery',
        'app/controller',
        'app/config',
        'add-to-homescreen/src/add2home',
        'client_js/script'
    ],
    out: 'dist/js/main.compiled.js',
    shim: {
        // Shim in our jQuery plugins etc, as they aren't AMD modules
        'sly': ['jquery']
    }
})
