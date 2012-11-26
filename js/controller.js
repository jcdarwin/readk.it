/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

define([
    'jquery',
    'epub',
    'layout'
], function($, epub, layout){

    var epub_dir = "../html/mansfield_at_the_bay";

    var initialize = function () {
        // Parse the EPUB
        epub.parse(epub_dir, '/META-INF/container.xml', load_publication);
    };

    var load_publication = function (entries) {
        $.each(entries, function(index, value){
            console.log(value.href);

            // Use the requirejs/text plugin to load our html resources.
            // https://github.com/requirejs/text
            require(["text!" + value.href + "!strip"],
                function(html) {
                    layout.add(value.id, html);
                }
            );

        });
    };

    return {
        initialize: initialize
    };

});
