define(function (require) {

    require(['./controller', './config', './epub', './layout'], function(controller, config, epub, layout){

        // Refer http://benalman.com/talks/unit-testing-qunit.html for userful pointers

        // Runs once after each assertion.
        QUnit.log = function( result, message){
            console.log((result ? "log" : "error" ) + (message ? message : ''));
        };

        module('mansfield', {
            setup: function() {
            }
        });

        test("layout: contains correct number of pages, returns 13", function () {
            expect(1);

            var initialized = function () {
                start();
                equal( $(layout.body).find('.page').size(), 13 );
            };

            config.epub_dir = config.epub_directory;
            controller.initialize(initialized);
            // Now we need to wait for the asynchronous callback to initialized
            stop();

        });

    });

});