// Readk.it paths
var paths = {
        app: '../app',
        underscore: 'underscore-min.amd'
};

// Add client EPUB paths to the Readk.it paths
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
    map: {
      '*': {
        'css': 'require-css/css'
      }
    }
});

// Readk.it required modules
var required = ['jquery', 'app/controller', 'app/config'];

// Add any required client EPUB modules to the Readk.it required modules
required = required.concat(client.required);

require(required, function($, Controller, config){
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