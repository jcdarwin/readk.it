/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

/*global define:false, require:false */
define([
    'jquery',
    'jquery.storage',
    'jquery.ba-urlinternal',
    'app/config',
    'app/epub',
    'app/layout',
    'app/chrome',
    'app/utility',
    'require-css/css'
], function($, $storage, $urlinternal, config, Epub, Layout, Chrome, utility, require_css){

    var load_publication_callback;
    var publication;
    var layout;
    var chrome;
    var self;

    /* Constructor */
     function Controller (book, URIs, callback) {
        self = this;

        load_publication_callback = callback;

        // Parse the EPUB
        this.publication = _initialise(book, URIs, load_publication);

        return this;
    }

    /* Define the instance methods */
    Controller.prototype = {
        initialise: function(book, URIs, files) {
            return _initialise(book, URIs, load_publication, files);
        },
        getPublication: function(){
            return (publication);
        },
        publication_finalise: function () {
        }
    };

    var _initialise = function (book, URIs, callback, files) {
        if (config.log) {
            utility.log('_initialise');
        }

        // Parse the EPUB.
        if (Object.getOwnPropertyNames(URIs).length) {
            // We've got the solo version whereby the EPUB content
            // is encoded app/content.js using data URIs.
            return new Epub('', 'META-INF/container.xml', callback, URIs);
        } else if (!files && window.location.protocol === 'file:') {
            // We've been loaded via a file url, so we can't use xhr calls to load assets
            // from the server. In this case we create the EPUB instance, but by calling it
            // without the 'META-INF/container.xml' value, no files will be retrieved.
            // http://stackoverflow.com/questions/4150430/how-to-detect-a-script-load-of-a-file-url-fails-in-firefox
            return new Epub(book, '', callback);
        } else if (config.mode === 'reader' && window.location.protocol !== 'file:') {
            if (files) {
                // We're in reader mode, and have a files array populated via drag and drop.
                return new Epub(book, 'META-INF/container.xml', callback, files);
            } else {
                // We're in reader mode, but have been opened without a files array.
                return new Epub(book, '', callback);
            }
        } else {
            // We've either been web-served, or have a files array populated via drag and drop.
            // If the former, then all the assets can be retrieved via xhr, and if the latter
            // all assets can be retrieved from the files array.
            return new Epub(book, 'META-INF/container.xml', callback, files);
        }
    };

    var load_publication = function (epub) {
        if (config.log) {
            utility.log('load_publication');
        }
        // require.js text plugin fires asynchronously, so we'll use
        // deferreds to work out when all texts have been retrieved.
        // If your brain hurts thinking about deferreds, this example
        // may be useful: https://gist.github.com/sousk/874094
        $.when(load_html(epub), load_css(epub)).done(function(pages, stylesheets){
            // All deferreds have been resolved.
            // We can now load the retrieved pages into our
            // publication according to the order specified.
            layout_publication(epub, pages, stylesheets);
        });
    };

    function load_html(pub){
        // Because our calls to retreive the pages are async,
        // it's possible that we receive the pages back out of order.
        return $.Deferred(function(d){
            var pages = [];

            $.when.apply(this, $.map(pub.spine_entries, function(value) {
                return $.Deferred(function(deferred_page){

                    var filename = '';
                    if (value.href.indexOf('/') === 0) {
                        filename = value.href.substr(1, value.href.length);
                    }

                    if (config.log) {
                        utility.log('load_html: ' + (filename || value.href));
                    }

                    if (filename && pub.content[filename]) {
                        // Our content's already been retrieved, e.g. via drag & drop.
                        // Remove the <body> element to mimic the behaviour of requirejs/text !strip.
                        var html = $($($.parseXML(pub.content[filename])).find('body')).wrapInner('<div />').html();
                        deferred_page.resolve(html);
                    } else {
                        // Use the requirejs/text plugin to load our html resources.
                        // https://github.com/requirejs/text
                        require(["text!" + value.href + "!strip"],
                            function(html) {
                                // !strip removes the <body> element, however this may leave us
                                // without a root element, therefore we need to enclose the
                                // stripped html in a root <div>.
                                deferred_page.resolve('<div>' + html + '</div>');
                            }
                        );
                    }

                }).done(function(html){
                    pages[value.id] = html;
                });
            })).done(function(){
                d.resolve(pages);
            });

        });
    }

    function load_css(pub){
        return $.Deferred(function(d){
            var stylesheets = [];

            $.when.apply(this, $.map(pub.css_entries, function(value) {
                return $.Deferred(function(deferred_stylesheet){

                    var filename = '';
                    if (value.href.indexOf('/') === 0) {
                        filename = value.href.substr(1, value.href.length);
                    }

                    if (filename && pub.content[filename]) {
                        // Our content's already been retrieved, e.g. via drag & drop.
                        var css = pub.content[filename];

                        // Find any font urls and replace with blob urls
                        // e.g. url('../fonts/Lato/Lato-Reg.ttf')
                        var window_url = window.URL || window.webkitURL;
                        css = css.replace(/(url\(['"])(.*?)([^'"\/]*)(['""]\))/g, function(tag, prefix, path, font, suffix) {
                            for (var index in pub.content) {
                                // Check whether our content entry ends with the font name.
                                if ( index.indexOf(font, index.length - font.length) !== -1 ) {
                                    return prefix + window_url.createObjectURL(pub.content[index]) + suffix;
                                }
                            }
                        });

                        var blob = new Blob([css], {type: "text/css"});
                        var url = window_url.createObjectURL(blob);

                        // Use the require-css plugin to indirectly load our stylesheet resources.
                        // This feels like a hack, but it works.
                        require_css.linkLoad(url, function(css) {
                            deferred_stylesheet.resolve(css);
                        });
                    } else {
                        // Avoid double-loading the Readkit stylesheet
                        if (/readkit-styles\.css$/.test(value.href)) {
                            deferred_stylesheet.resolve();
                        } else {
                            // Use the require-css plugin to load our stylesheet resources.
                            require(["css!" + value.href],
                                function(css) {
                                    deferred_stylesheet.resolve(css);
                                }
                            );
                        }
                    }

                }).done(function(css){
                    if (css) {
                        stylesheets[value.id] = css;
                    }
                });
            })).done(function(){
                d.resolve(stylesheets);
            });

        });
    }

    function layout_publication(publication, pages, css) {
        // Create our layout for this publication.
        layout = new Layout(self, publication);

        var url_selectors = $.map($.elemUrlAttr(), function(i, v){
            return v + '[' + i + ']';
        }).join(',');

        $.each(publication.getToc(), function(index, value){

            var filename = '';
            if (value.href.indexOf('/') === 0) {
                filename = value.href.substr(1, value.href.length);
            }

            if (config.log) {
                utility.log('laying out: ' + filename);
            }

            // Strip namespaces from svg elements (i.e. cover images) as these cause rendering problems.
            // <svg:svg viewBox="0 0 525 700">
            pages[value.id] = pages[value.id].replace(/<[^\:<>\s]*?:svg /g, '<svg ');
            // </svg:svg>
            pages[value.id] = pages[value.id].replace(/<\/[^\:<>\s]*?:svg>/g, '</svg>');

            // <svg:image xlink:href="images/cover_front.jpg" transform="translate(0 0)" width="525" height="700" />
            pages[value.id] = pages[value.id].replace(/<[^\:<>\s]*?:image /g, '<image ');
            // </svg:image>
            pages[value.id] = pages[value.id].replace(/<\/[^\:<>\s]*?:image>/g, '</image>');

            if (filename && publication.content[filename]) {
                // Our content's already been retrieved, e.g. via drag & drop.
                // Replace internal images with blob URLs.
                pages[value.id] = pages[value.id].replace(/((?:<[^<>]* (?:src|poster)|<image[^<>]* xlink\:href)=['"])(.*?)(['"'])/g, function(tag, prefix, value, suffix){ return createURL(tag, prefix, value, suffix, publication); } );
            } else {
                // Ensure internal image urls have the correct path prepended.
                // We have to do this here as jQuery will try to resolve the src.
                pages[value.id] = pages[value.id].replace(/((?:<[^<>]* (?:src|poster)|<image[^<>]* xlink\:href)=['"])/g, '$1' + value.path.replace(/[^\/]+/g, '..') + value.href.replace(/[^\/]*?$/, ''));
            }

            var page = $(pages[value.id]);
            // We have to rewrite any internal urls and corresponding ids
            var internal_urls = page.find(url_selectors).filter(':urlInternal');

            $.each(internal_urls, function(i, v){
                if ( typeof $(v).attr('href') !== 'undefined' ) {
                    if ( $(v).attr('rel') !== 'external' ) {
                        if ($(v).attr('href').substr(0,1) === '#') {
                            // We must have something like '#milestone1'; convert to '#chapter1_milestone1'
                            $(v).attr('href', '#' + publication.file + '_' + $(v).attr('href').substr(1));
                        } else {
                            // We must have something like 'text/chapter2.xhtml#milestone1'; convert to '#text_chapter2.xhtml_milestone1'
                            $(v).attr('href', '#' + $(v).attr('href').replace(/\//g, '_').replace(/#/g, '_'));
                        }
                    }
                }
                return $(v);
            });

            // A special case: svg images (typically cover images).
            // <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 795 1200" preserveAspectRatio="none">
            //    <image width="795" height="1200" xlink:href="cover.jpeg"/>
            // </svg>

            // If we didn't strip namespaces from svgs above, then the following is an
            // indication of the sort of hell we'd be going through (and things still wouldn't work!).
            //
            // Find svg elements.
            // As they may be namespaced (and we don't know what the namespace prefix is),
            // we can't simply use "page.find('svg')".
            //var $svgs = page.find('svg');
            //$svgs = $svgs.add(page.find('*').filter(function(i, v) {
            //    var found;
            //    $.each(v.attributes, function(i, attrib){
            //        found = found || (attrib.value == 'http://www.w3.org/2000/svg');
            //    });
            //    return found;
            //}));

            // jQuery's support for namespaced attributes is poor.
            // This left here in case we need it in future.
            //page.find('svg image').filter(function() { return $(this).attr('xlink:href'); }).each(function() {
            //    $(this).attr('xlink:href', 'whatever')
            //});

            $.each(page.find('svg'), function (i, v) {
                // Cover images are important (though the following will probably break someone's styling somewhere).
                // We'll try to force the svg image to be contrained to the viewport.
                // (Necessary for Firefox), but not Chrome.
                // Unfortunately doesn't work in Safari on iOS (seems nothing works in Safari on iOS with respect to SVGs).
                ($(v)[0]).setAttribute('preserveAspectRatio', 'defer xMidYMid meet');

                // Use iPhone2G-4S as the min height, and then substracting some for menu and padding.
                // Note that, because this is SVG, we specify in integers, not pixels.
                // We do this as we can't rely on $(window).height() -- it seems broken on Firefox
                // though this may be to do with iScroll.
                var minHeight = 480;
                ($(v)[0]).setAttribute('height', $(window).height() > minHeight ? $(window).height() -80 : minHeight -80);

                // Ensure the image is centered.
                $(v).parent().css({'width': '100%', 'text-align': 'center', 'padding-top' : '20px'});
            });

            $.each(page.find('[id]'), function(i, v){
                // We want to change something like 'milestone1' to 'chapter1_milestone1'
                $(v).attr('id', value.file + '_' + $(v).attr('id'));
                return $(v);
            });

            // OK, so now we need to get the outerHTML
            // http://stackoverflow.com/questions/2419749/get-selected-elements-outer-html
            var results = '';
            $.each(page.clone().wrap('<div>').parent(), function(i, v){
                results += $(v).html();
            });
            pages[value.id] = results;
            layout.add(value.id, value.file, pages[value.id]);
        });

        if (layout.page_scrollers.length) {
            layout.update(layout.page_scrollers[0].scroller);
            layout.restore_bookmarks();
        }

        // Create our chrome for this layout.
        // Note that our chrome won't actually be initialised
        // until our layout has been finalised.
        chrome = new Chrome(self, layout);

        layout.finalise();

        load_publication_callback(publication, layout);
    }

    function createURL(tag, prefix, value, suffix, pub) {
        // Strip any leading directory steps:
        // "../Images/9780864736772_cover_epub.jpg" => "Images/9780864736772_cover_epub.jpg"
        // TODO: Make this more robust, and able to cope with multiple steps and complicated paths
        var filename = pub.oebps_dir + '/' + value.replace(/^(\.\.\/)+/, '');
        // Note that our content is already in blob form
        // var blob = new Blob([pub.content[filename]], {type: "image/jpeg"});
        var window_url = window.URL || window.webkitURL;
        var url = window_url.createObjectURL(pub.content[filename]);
        return prefix + url + suffix;
    }

    return (Controller);
});
