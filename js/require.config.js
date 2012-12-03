var require = {
    // specify our dependencies
    shim: {
        'controller' : ['jquery', 'iscroll', 'jquery.ba-urlinternal.min', 'app/epub', 'app/layout', 'app/chrome', 'app/config'],
        'iscroll': {exports: 'iScroll'}
    }
};