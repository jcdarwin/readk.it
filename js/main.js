requirejs.config({
    // specify our dependencies
    shim: {
        'controller' : ['jquery', 'epub', 'iscroll', 'layout', 'chrome'],
        'iscroll': {exports: 'iScroll'}
    }
});

require(['controller'], function(controller){
    controller.initialize();
});
