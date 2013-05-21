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

        var counter = 0;
        var data;
        var epub_directory = config.epub_directory;
        $.getJSON(epub_directory + 'library/manifest.json', function(d) {
            data = d;
        })
        .success(function() {
            $.each(data, function(index, book) {
//                if (! counter++) {
                    book.epub_directory = epub_directory;
                    perform_tests(book);
//               }
            });
        })
        .error(function() { alert("error"); });


        function perform_tests(book) {

            module(book.name + " (EPUB " + book.version + ")", {
                setup: function() {
                }
            });

            var initialized = function (publication) {

                test("epub: number and order of spine entries correct, returns " + $(publication.spine_entries).size() + " and array", function () {
                    expect(3);
                    equal(
                        $(testController.getPublication().getToc()).size(),
                        $(publication.spine_entries).size(),
                        'total number of spine entries in epub = ' + $(publication.spine_entries).size()
                    );
                    equal(
                        $(layout.body()).find('.page').size(),
                        $(testController.getPublication().getToc()).size(),
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

            // Now we need to wait for the asynchronous callback to initialized
            var testController = new Controller(book.epub_directory + '../../' + book.path, initialized);

        }

    });

});