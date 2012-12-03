/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

define([
    'jquery',
    'jquery.ba-urlinternal.min',
    'app/config',
    'app/epub',
    'app/layout'
], function($, jbum, config, Epub, layout){

    var pages = [];
    var load_publication_callback;
    var publication;
    var item;

    /* Constructor */
    var Controller = function (book, callback) {
        item = book;
        title = book.epub_directory + book.path;
        load_publication_callback = callback;
        // Parse the EPUB
        publication = new Epub(title, 'META-INF/container.xml', load_publication);
    };

    /* Define the instance methods */
    Controller.prototype = {
        getPublication: function(){
            return (publication);
        }
    };

    var load_publication = function (toc) {

        // require.js text plugin fires asynchronously, so we'll use
        // deferreds to work out when all texts have been retreived.
        var deferreds = [];

        $.each(toc, function(index, value){
            var deferred = new $.Deferred();
            deferreds.push(deferred);

            // Use the requirejs/text plugin to load our html resources.
            // https://github.com/requirejs/text
            require(["text!" + value.href + "!strip"],
                function(html) {
                    // Because our calls to retreive the pages are async,
                    // it's possible that we receive the pages back
                    // out of order.
                    pages[value.id] = html;
                    deferred.resolve();
                }
            );
        });

        $.when.apply(null, deferreds).then( function() {
            // All deferreds have been resolved.
            // We can now load the retrieved pages into our
            // publication according to the order specified.
            $.each(publication.getToc(), function(index, value){

                // We have to rewrite any internal urls
                $.fn.prependAttr = function(attrName, prefix) {
                    this.attr(attrName, function(i, val) {
                        return prefix + val;
                    });
                    return this;
                };

                var url_selectors = $.map($.elemUrlAttr(), function(i, v){
                    return v + '[' + i + ']';
                }).join(',');

                //$(pages[value.id]).find(url_selectors).filter(':urlInternal').preprendAttr('href', publication.epub_dir);
                //$(pages[value.id]).find(url_selectors).filter(':urlInternal').preprendAttr('src', publication.epub_dir);
                //$(pages[value.id]).find(url_selectors).filter(':urlInternal').preprendAttr('action', publication.epub_dir);

                layout.add(value.id, pages[value.id]);
            });
            load_publication_callback(item, publication);
        });
    };

    return (Controller);

});
