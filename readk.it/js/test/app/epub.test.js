/*
** QUnit test file.
** Tests are driven by ../../../library/mainfest.json
*/

/*global define:false, $:false, expect:false, test:false, equal:false, deepEqual:false, console:false, QUnit:false, module:false */
define(function (require) {

    // Refer http://benalman.com/talks/unit-testing-qunit.html for userful pointers
    require(['./controller', './config'], function(Controller, config){

        // Runs once after each assertion.
        QUnit.log = function( result, message){
            //console.log((result ? "log" : "error" ) + (message ? message : ''));
        };

        var counter = 0;
        var data;
        var epub_directory = config.epub_directory;
        $.getJSON(epub_directory + 'library/manifest.json', function(d) {
            data = d;
        })
        .success(function() {
            $.each(data, function(index, book) {
                book.epub_directory = epub_directory;
                perform_tests(book);
            });
        })
        .error(function() { console.error("error"); });


        function perform_tests(book) {

            var initialized = function (publication, layout) {
                // Note that, because of the asynchronous nature of the loading of pages, 
                // the actual order of the publications in terms of calling this callback routine
                // is likely to differ from the order they are listed in the manifest.

                module(publication.title + " (EPUB " + publication.version + ")", {
                    setup: function() {
                    }
                });

                // Retrieve the appropriate publication from the mainfest based on the identifier.
                var pub = $(data).filter(function(index) {
                    return data[index].identifier === publication.identifier;
                })[0];

                test("Number of pages and order correct, returns " + $(publication.spine_entries).size() + " and array", function () {
                    expect(3);
                    equal(
                        pub.total_pages,
                        $(publication.spine_entries).size(),
                        'total number of spine entries in epub = ' + $(publication.spine_entries).size()
                    );
                    equal(
                        $(layout.body()).find('.page').size(),
                        pub.total_pages,
                        'total number of pages added to layout = ' + $(layout.body()).find('.page').size()
                    );
                    deepEqual(
                        $.map(publication.getToc(), function(value){
                            return value.id;
                        }),
                        $.map($(layout.body()).find('.page .wrapper'), function(value){
                            return value.id;
                        }),
                        'order of pages as specified by spine is ' + $.map($(layout.body()).find('.page .wrapper'), function(value){
                            return ' ' + value.id;
                        })
                    );
                });
            };

            // Now we need to wait for the asynchronous callback to function initialized
            var testController = new Controller('../../' + book.epub_directory + book.path, initialized);

        }

    });

});