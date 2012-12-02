/*
** QUnit test file.
** Tests are driven by ../../html/mainfest.json
*/

define(function (require) {

    require(['./controller', './config', './epub', './layout'], function(Controller, config, epub, layout){

        // Refer http://benalman.com/talks/unit-testing-qunit.html for userful pointers

        // Runs once after each assertion.
        QUnit.log = function( result, message){
            console.log((result ? "log" : "error" ) + (message ? message : ''));
        };

        var data;
        var epub_directory = config.epub_directory;
        $.getJSON(epub_directory + 'manifest.json', function(d) {
            data = d;
        })
        .success(function() {
            $.each(data, function(index, book) {
                perform_tests(book);
            });
        })
        .error(function() { alert("error"); });


        function perform_tests(book) {

            module(book.name + " (EPUB " + book.version + ")", {
                setup: function() {
                }
            });

            var initialized = function () {

                test("epub: contains correct number of pages, returns " + book.total_pages, function () {
                    expect(1);
                    equal(
                        $(testController.getPublication().getToc()).size(),
                        book.total_pages,
                        'total number of pages = ' + $(testController.getPublication().getToc()).size()
                    );
                });

                test("layout: contains correct number of pages, returns " + $(testController.getPublication().getToc()).size(), function () {
                    expect(1);
                    equal(
                        $(layout.body()).find('.page').size(),
                        $(testController.getPublication().getToc()).size(),
                        'total number of pages = ' + $(layout.body()).find('.page').size()
                    );
                });

                test("layout: contains pages in the order specified by opf file, return toc ids", function () {
                    expect(1);
                    deepEqual(
                        $.map(testController.getPublication().getToc(), function(value){
                            return value.id;
                        }),
                        $.map($(layout.body()).find('.page .wrapper'), function(value){
                            return value.id;
                        }),
                        'order of pages is ' + $.map($(layout.body()).find('.page .wrapper'), function(value){
                            return ' ' + value.id;
                        })
                    );
                });

            };

            // Now we need to wait for the asynchronous callback to initialized
            var testController = new Controller(epub_directory + book.path, initialized);

        }

    });

});