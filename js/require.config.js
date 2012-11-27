var require = {
    // specify our dependencies
    shim: {
        'controller' : ['jquery', 'iscroll', 'app/epub', 'app/layout', 'app/chrome', 'app/config'],
        'iscroll': {exports: 'iScroll'}
    }
};