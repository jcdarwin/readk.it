require.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory.
    paths: {
        app: '../app'
    }
});

var data = {title: 'mansfield_at_the_bay', total_pages: 13};

var initialized = function () {
    console.log('main.initialized');
};

require(['app/controller', 'app/config'], function(Controller, config){
    controller = new Controller(config.epub_directory + data.title, initialized);
});