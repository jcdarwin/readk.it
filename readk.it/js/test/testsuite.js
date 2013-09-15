/*global require:false, QUnit: false */
// http://www.jonnyreeves.co.uk/2012/qunit-and-requirejs/
(function () {

    // Defer Qunit so RequireJS can work its magic and resolve all modules.
    QUnit.config.autostart = false;

    // Configure RequireJS so it resolves relative module paths from the `app`
    // folder.
    require.config({
        //By default load any module IDs from js/lib
        baseUrl: '../lib',
        //except, if the module ID starts with "app",
        //load it from the js/app directory.
        paths: {
            app: '../app',
            underscore: 'lodash'
        },
        map: {
          '*': {
            'css': 'require-css/css'
          }
        }
    });

    // A list of all QUnit test Modules.  Make sure you include the `.js`
    // extension so RequireJS resolves them as relative paths rather than using
    // the `baseUrl` value supplied above.
    var testModules = [
        "app/epub.test.js"
    ];

    // Resolve all testModules and then start the Test Runner.
    require(testModules, function() {
        QUnit.start();
    });
}());