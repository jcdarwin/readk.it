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

require(['app/controller', 'app/config'], function(controller, config){
    config.epub_dir = config.epub_directory;
    controller.initialize(initialized);
});