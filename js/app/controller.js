/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

define([
    'jquery',
    'app/config',
    'app/epub',
    'app/layout'
], function($, config, epub, layout){

    var initialize = function () {
        // Parse the EPUB
        epub.parse(config.epub_dir, '/META-INF/container.xml', load_publication);
    };

    var load_publication = function (entries) {
        $.each(entries, function(index, value){
            //console.log(value.href);

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
