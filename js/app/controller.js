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
], function($, config, Epub, layout){

    var epub;
    var load_publication_callback;

    var initialize = function (callback) {
        load_publication_callback = callback;
        // Parse the EPUB
        epub = new Epub(config.epub_dir, '/META-INF/container.xml', load_publication);
        console.log(epub);
    };

    var getEpub = function () {
        return epub;
    }
    
    var load_publication = function (entries) {

        // require.js text plugin fires asynchronously, so we'll use
        // deferreds to work out when all texts loaded.
        var deferreds = [];

        $.each(entries, function(index, value){
            var deferred = new $.Deferred();
            deferreds.push(deferred);

            // Use the requirejs/text plugin to load our html resources.
            // https://github.com/requirejs/text
            require(["text!" + value.href + "!strip"],
                function(html) {
                    layout.add(value.id, html);
                    deferred.resolve();
                }
            );
        });

        $.when.apply(null, deferreds).then( function() {
            // All deferreds have been resolved
            load_publication_callback();
        });
    };

    return {
        initialize: initialize,
        getEpub: getEpub,
        load_publication: load_publication
    };

});
