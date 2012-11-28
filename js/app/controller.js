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

    var load_publication_callback;

    var initialize = function (callback) {
        load_publication_callback = callback;
        // Parse the EPUB
        epub.parse(config.epub_dir, '/META-INF/container.xml', load_publication);
    };

    var load_publication = function (entries) {

        // require.js text plugin fires asynchronously, so we'll use
        // reference counting to work out when all texts loaded.
        // A bit hacky, but it gives us the pseudo-synchronisity that we need.
        var refs = 0;

        $.each(entries, function(index, value){

            // Increment our reference count
            refs+=1;

            // Use the requirejs/text plugin to load our html resources.
            // https://github.com/requirejs/text
            require(["text!" + value.href + "!strip"],
                function(html) {
                    layout.add(value.id, html);
                    refs-=1;
                }
            );

        });

        var timer = setInterval(function(){
            if (refs===0) {
                clearInterval(timer);
                // All texts loaded - fire callback to indicate publication loading is complete.
                load_publication_callback();
            }
        }, 1000);
    };

    return {
        initialize: initialize
    };

});
