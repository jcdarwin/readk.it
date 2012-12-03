require.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory.
    paths: {
        app: '../app'
    }
});

var initialized = function () {
    console.log('main.initialized');
};

require(['app/controller', 'app/config'], function(Controller, config){
    var book = {epub_directory: config.epub_directory, "name": "At the Bay", "version": "2.0", "identifier": "84ba3092-022a-460d-bb4f-fa558a022793", "path": "./mansfield_at_the_bay/", "total_pages": 13};
    controller = new Controller(book, initialized);
});