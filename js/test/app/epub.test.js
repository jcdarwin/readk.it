define(function (require) {

    require(['./controller', './config', './epub', './layout'], function(controller, config, epub, layout){

        // Refer http://benalman.com/talks/unit-testing-qunit.html for userful pointers

        // Runs once after each assertion.
        QUnit.log = function( result, message){
            console.log((result ? "log" : "error" ) + (message ? message : ''));
        };

        config.epub_dir = config.epub_directory;

        var data = {total_pages: 13};

        module('mansfield', {
            setup: function() {
            }
        });

        test("layout: contains correct number of pages, returns " + data.total_pages, function () {
            expect(1);

            var initialized = function () {
                start();
                equal( $(layout.body()).find('.page').size(), data.total_pages );

                $.each(controller.epub.getEntries(), function(index, value){
                    console.log(value.id);
                });
            };

            // Now we need to wait for the asynchronous callback to initialized
            stop();
            controller.initialize(initialized);

        });

    });

});