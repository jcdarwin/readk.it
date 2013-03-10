// Readk.it paths
var paths = {
        app: '../app',
        underscore: 'underscore-min.amd'
};

// Readk.it required modules
var required = ['jquery', 'app/controller', 'app/config'];

// Add client paths to the Readk.it paths
var extend = function(obj, defaults) {
    for (var i in defaults) {
        if (!obj[i]) {
            obj[i] = defaults[i];
        }
    }
};
extend(paths, client.paths);

// Add client required modules to the Readk.it required modules
required = required.concat(client.required);

require.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory.
    paths: paths,
    map: {
      '*': {
        'css': 'require-css/css'
      }
    }
});

var initialized = function () {
    $.event.trigger('kickoff');
    console.log('main.initialized');
};

require(required, function($, Controller, config){

    // jquery plugin to allow us to parse query string arguments
    $.fn.querystring = function (key) {
        var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
        var r=[], m;
        while ((m=re.exec(document.location.search)) !== null) r.push(m[1]);
        return r;
    };

    var book;
    // var path = $().querystring('path');
    var path = window.location.hash.replace(/^#/, '');

    if (path) {
        path = decodeURIComponent(path);
        book = config.epub_directory + path;
    } else {
        var title = {epub_directory: config.epub_directory, "name": "Readk.it Manifesto", "version": "3.0", "identifier": "urn:isbn:9781449328030", "path": "", "total_pages": 3};
        //book = {epub_directory: config.epub_directory, "name": "Accessible EPUB 3", "version": "3.0", "identifier": "urn:isbn:9781449328030", "path": "./thirdparty/30/accessible_epub_3/", "total_pages": 22};
        book = title.epub_directory + title.path;
    }

    controller = new Controller(book, initialized);

    $(document).on('kickedoff', function() {
        controller.publication_finalise();
    });

});