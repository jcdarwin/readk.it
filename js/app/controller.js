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
    'app/layout',
    'app/chrome'
], function($, jbum, config, Epub, layout, chrome){

    var pages = [];
    var load_publication_callback;
    var publication;
    var item;

    // tiny plugin to allow us to modify attribute values
    $.fn.prependAttr = function(attrName, prefix) {
        if (typeof this.attr(attrName) !== 'undefined') {
            this.attr(attrName, function(i, val) {
                return prefix + val;
            });
        }
        return this;
    };

    var url_selectors = $.map($.elemUrlAttr(), function(i, v){
        return v + '[' + i + ']';
    }).join(',');

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

                var page = $(pages[value.id]);
                // We have to rewrite any internal urls and corresponding ids
                $.each(page.find(url_selectors).filter(':urlInternal'), function(index, value){
                    if ( typeof $(value).attr('href') !== 'undefined' ) {
                        if ($(value).attr('href').substr(0,1) == '#') {
                            // We must have something like '#milestone1'; convert to '#chapter1_milestone1'
                            $(value).attr('href', '#' + publication.file + '_' + $(value).attr('href').substr(1));
                        } else {
                            // We must have something like 'text/chapter2#milestone1'; convert to '#text_chapter2#milestone1'
                            $(value).attr('href', '#' + $(value).attr('href').replace(/\//g, '_').replace(/#/g, '_'));
                        }
                    }
                    return $(value);
                });
                $.each(page.find('[id]'), function(i, v){
                    // We want to change something like 'milestone1' to 'chapter1#milestone1'
                    $(v).attr('id', value.file + '_' + $(v).attr('id'));
                    return $(v);
                });
                $.each(page.find(url_selectors).filter(':urlInternal'), function(i, v){
                    return $(v).prependAttr('src', publication.epub_dir + publication.oebps_dir + '/');
                });
                // Do we need to worry about rewriting form action attributes?
                //page.find(url_selectors).filter(':urlInternal').prependAttr('action', publication.epub_dir + publication.oebps_dir + '/');

                // OK, so now we need to get the outerHTML
                // http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html
                var results = '';
                $.each(page.clone().wrap('<div>').parent(), function(i, v){
                    results += $(v).html();
                });
                layout.add(value.id, value.file, results);
            });

            layout.finalise();

            load_publication_callback(item, publication);
        });
    };

    return (Controller);

});
