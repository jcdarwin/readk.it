/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

define([
    'jquery',
    'jquery.storage',
    'jquery.ba-urlinternal.min',
    'app/config',
    'app/epub',
    'app/layout',
    'app/chrome'
], function($, $storage, jbum, config, Epub, layout, chrome){

    var pages = [];
    var stylesheets = [];
    var load_publication_callback;
    var publication;
    var item;

    /* Constructor */
    var Controller = function (book, callback) {
        load_publication_callback = callback;
        // Parse the EPUB
        publication = new Epub(book, 'META-INF/container.xml', load_publication);
    };

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

    /* Define the instance methods */
    Controller.prototype = {
        getPublication: function(){
            return (publication);
        },
        publication_finalise: function () {
        }
    };

    var load_publication = function (toc, css) {

        // require.js text plugin fires asynchronously, so we'll use
        // deferreds to work out when all texts have been retrieved.
        var deferreds = [];

        $.each(toc, function(index, value){
            var deferred = new $.Deferred();
            deferreds.push(deferred);

            // Use the requirejs/text plugin to load our html resources.
            // https://github.com/requirejs/text
            require(["text!" + value.href + "!strip"],
                function(html) {
                    // Because our calls to retreive the pages are async,
                    // it's possible that we receive the pages back out of order.
                    pages[value.id] = html;
                    deferred.resolve();
                }
            );
        });

        $.each(css, function(index, value){
            var deferred = new $.Deferred();
            deferreds.push(deferred);

            // Use the requirejs/css plugin to load our stylesheet resources.
            require(["css!" + value.href],
                function(html) {
                    stylesheets[value.id] = html;
                    deferred.resolve();
                }
            );
        });

        $.when.apply(null, deferreds).then( function() {
            // All deferreds have been resolved.
            // We can now load the retrieved pages into our
            // publication according to the order specified.
            $.each(publication.getToc(), function(index, value){

                // Ensure internal image urls have the correct path prepended.
                // We have to do this here as jQuery will try to resolve the src.
                pages[value.id] = pages[value.id].replace(/(<[^<>]* (?:src|poster)=['"])/g, '$1' + value.path.replace(/[^\/]+/g, '..') + value.href.replace(/[^\/]*?$/, ''));

                var page = $(pages[value.id]);
                // We have to rewrite any internal urls and corresponding ids
                var internal_urls = page.find(url_selectors).filter(':urlInternal');

                $.each(internal_urls, function(i, v){
                    if ( typeof $(v).attr('href') !== 'undefined' ) {
                        if ( $(v).attr('rel') != 'external' ) {
                            if ($(v).attr('href').substr(0,1) == '#') {
                                // We must have something like '#milestone1'; convert to '#chapter1_milestone1'
                                $(v).attr('href', '#' + publication.file + '_' + $(v).attr('href').substr(1));
                            } else {
                                // We must have something like 'text/chapter2#milestone1'; convert to '#text_chapter2#milestone1'
                                $(v).attr('href', '#' + $(v).attr('href').replace(/\//g, '_').replace(/#/g, '_'));
                            }
                        }
                    }
                    return $(v);
                });
                $.each(page.find('[id]'), function(i, v){
                    // We want to change something like 'milestone1' to 'chapter1#milestone1'
//                    $(v).attr('id', value.file + '_' + $(v).attr('id'));
                    return $(v);
                });

                // OK, so now we need to get the outerHTML
                // http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html
                var results = '';
                $.each(page.clone().wrap('<div>').parent(), function(i, v){
                    results += $(v).html();
                });
                pages[value.id] = results;
                layout.add(value.id, value.file, pages[value.id], publication);
            });

            $.each(publication.getToc(), function(index, value){
            });
            layout.update(layout.page_scrollers[0].scroller);
            layout.restore_bookmarks();

            layout.finalise();

            load_publication_callback(publication);
        });
    };

    return (Controller);

});
