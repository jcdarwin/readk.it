// Readk.it paths
var paths = {
    app: '../app',
    underscore: 'underscore-min.amd'
};

// Mixin any client EPUB paths to the Readk.it paths
var extend = function(obj, defaults) {
    for (var i in defaults) {
        if (!obj[i]) {
            obj[i] = defaults[i];
        }
    }
};
extend(paths, client.paths);

require.config({
    // By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    // except, if the module ID starts with "app",
    // load it from the js/app directory.
    paths: paths,
    // Map the require-css library such that consumers only have to specifiy 'css!'
    map: {
      '*': {
        'css': 'require-css/css'
      }
    },
    // shim in our jQuery plugins
    shim: {
        'jquery.storage': ['jquery'],
        'jquery.ba-urlinternal.min': ['jquery'],
        'jquery.hotkeys': ['jquery'],
        'iscroll': {exports: 'iScroll'}
    }
});

// Add to home screen: http://cubiq.org/add-to-home-screen
var addToHomeConfig = {
    startDelay: 30000,
    lifespan:10000,
    touchIcon:true,
    message:'Install this book on your %device: tap %icon and then <strong>Add to Home Screen</strong>.'
};

// Readk.it required modules
var required = ['jquery', 'app/controller', 'app/config', 'add-to-homescreen/src/add2home'];

// Mixin any required client EPUB modules to the Readk.it required modules
required = required.concat(client.required);

require(required, function($, Controller, config, add2home){
    var book;
    var path = window.location.hash.replace(/^#/, '');

    if (path) {
        // We're in library mode
        path = decodeURIComponent(path);
    }

    book = config.epub_directory + path;

    controller = new Controller(book, function() {
        $.event.trigger('kickoff');
    });

    $(document).on('kickedoff', function() {
        controller.publication_finalise();
    });
});