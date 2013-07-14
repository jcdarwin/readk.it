require.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory.
    paths: {
        app: '../app',
        underscore: 'underscore-min.amd'
    },
    shim: {
        'sly': ['jquery']
    }
});

var initialized = function () {
    console.log('main.initialized');
};

// Add to home screen: http://cubiq.org/add-to-home-screen 
var addToHomeConfig = {
    startDelay: 30000,
    lifespan:10000,
    touchIcon:true,
    message:'Install this app on your %device: tap %icon and then <strong>Add to Home Screen</strong>.'
};

require(['app/controller', 'app/config', 'add-to-homescreen/src/add2home'], function(Controller, config, add2home){
    var options = {manifest: config.manifest};
    controller = new Controller(options, initialized);
});