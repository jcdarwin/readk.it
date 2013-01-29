require.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory.
    paths: {
        app: '../app',
        underscore: 'underscore-min.amd'
    }
});

var initialized = function () {
    console.log('main.initialized');
};

require(['jquery', 'app/controller', 'app/config'], function($, Controller, config){

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
        //var book = {epub_directory: config.epub_directory, "name": "Accessible EPUB 3", "version": "3.0", "identifier": "urn:isbn:9781449328030", "path": "./thirdparty/30/accessible_epub_3/", "total_pages": 22};
    }

    controller = new Controller(book, initialized);
});