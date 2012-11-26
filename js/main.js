requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory.
    paths: {
        app: '../app'
    },
    // specify our dependencies
    shim: {
        'controller' : ['jquery', 'iscroll', 'app/epub', 'app/layout', 'app/chrome', 'app/config'],
        'iscroll': {exports: 'iScroll'}
    }
});

require(['app/controller'], function(controller){
    controller.initialize();
});
