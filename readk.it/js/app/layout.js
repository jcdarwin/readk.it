/*
** layout.js
**
** Author: Jason Darwin
**
** Functions to support readk.it layout and navigation.
**
** Important concepts:
** * page: a scrolling div containing an entire epub xhtml file (i.e. chapter)
** * page_scroller: an iScroll container around each page
** * book_scroller: an encompassing iScroll container, within which lives all
**   the pages
*/

 /*global define:false */
define([
    'jquery',
    'app/utility',
    'app/config',
    'iscroll',
    'lodash',
    'jquery.hotkeys'
], function($, utility, config, IScroll, _, $hotkeys){

    var page_scrollers = [];
    var pages = [];
    var page_width = 0;
    var currentPage = 0;
    var previousPage = 0;
    var restoring = true;
    var publication = {};
    var controller;
    var identifier;

    /* Constructor */
    var Layout = function (caller, pub) {
        // Reset our layout, removing any previously
        // laid-out publications.
        reset();

        controller = caller;
        publication = pub;
        identifier = pub.identifier;

        utility.log('Creating layout for: ' + identifier);
//utility.storage(identifier, 'pages', []);
//utility.storage(identifier, 'font-size', []);
        return {
            identifier: pub.identifier,
            refresh: refresh,
            update: update,
            add: add,
            reset: reset,
            trap_anchor: trap_anchor,
            go_back: go_back,
            restore_bookmarks: restore_bookmarks,
            publication: publication,
            page_scrollers: page_scrollers,
            body: body,
            location: location,
            nav: nav,
            finalise: finalise
        };
    };

    // Reset our layout
    var reset = function () {
        page_scrollers = [];
        pages = [];
        var currentPage = 0;
        var previousPage = 0;
        $('#readkit-pageScroller .readkit-page').remove();

        // Unload any stylesheets for the currently-loaded publication
        if (publication.css_entries) {
            $.each(publication.css_entries, function(index, value) {
                $('head link[rel="stylesheet"][href="' + value.href + '"]').remove();
            });
            publication.css_entries = [];
        }
    };

    var book_scroller = new IScroll('readkit-pageWrapper', {
        snap: true,
        snapThreshold: 1,
        momentum: false,
        hScrollbar: true,
        vScrollbar: false,
        lockDirection: true,
        onAnimationEnd: function(){
            // Store details of the page we're on
            if (page_width > 0) {
                previousPage = currentPage;
                currentPage = - Math.ceil( Math.floor($('#readkit-pageScroller').position().left) / page_width);

                // Ensure we align nicely on a page boundary
                if (currentPage !== previousPage) {
                    book_scroller.scrollToPage(currentPage, 0, 0);
                }
            }

            if (this.options['page_scroller_waiting']) {
                this.options['page_scroller_waiting'].scroller.scrollToElement($('[id="' + this.options['page_scroller_anchor'] + '"]')[0], 0);
                this.options['page_scroller_waiting'] = undefined;
                this.options['page_scroller_anchor'] = undefined;

                if (utility.storage(identifier, 'page') !== currentPage) {
                    var history = utility.storage(identifier, 'history') || [];
                    if (history.length) {
                        history.push(utility.storage(identifier, 'page'));
                        utility.storage(identifier, 'history', history);
                    } else {
                        utility.storage(identifier, 'history', [utility.storage(identifier, 'page')]);
                    }
                    // Notify any subscribers that the history has changed.
                    utility.publish('history_changed');
                }
            }

            utility.storage(identifier, 'page', currentPage);

            var pages_previous = utility.storage(identifier, 'pages') || [];
            if (pages_previous[currentPage]) {
                pages_previous[currentPage].x = $(book_scroller)[0].x;
            }
            utility.storage(identifier, 'pages', pages_previous);
        }
    });

    // Redraw the layout after DOM changes.
    var refresh = function (page, y_percent) {
        setTimeout(function () {
            $.each(page_scrollers, function(i) {
                this.scroller.refresh();
                if ( ! (y_percent === undefined && page === undefined) ) {
                    if (i === page) {
                        var y = this.scroller.scrollerH * y_percent;
                        this.scroller.scrollTo(0, y);
                    }
                }
            });

            if (y_percent === undefined && page === undefined) {
                // By now we must have restored our publication if settings
                // had been previously saved.
                restoring = false;
            }
        }, 0);
    };

    var update = function (page_scroller) {
        page_width = $('#readkit-pageWrapper').width();
        var pages = $('.readkit-page').length;
        $('#readkit-pageScroller').css('width', page_width * pages);
        $('.readkit-page').css('width', page_width);
        book_scroller.refresh();
        if (page_scroller) {
            page_scroller.refresh();
        }

        // Ensure we align nicely on a page boundary
        if (scroll && currentPage !== 0) {
            book_scroller.scrollToPage(currentPage, 0, 0);
        }
    };

    // Revisit the last entry in the history.
    var go_back = function () {
        var history = utility.storage(identifier, 'history');
        if (history.length) {
            var page = history.pop();
            if (page !== null) {
                book_scroller.scrollToPage(page, 0, 0);
                utility.storage(identifier, 'history', history);
            }
        }
    };

    // Add a page
    var add = function (id, file, html) {
        $('#readkit-pageScroller').append(utility.compile(
            '<div class="readkit-page" id="<%file%>"><div id="<%id%>" class="readkit-wrapper"><div class="readkit-scroller"><div class="readkit-margins"><%html%></div></div></div></div>',
            {   file: file,
                id:   id,
                html: html}
        ));

        var page_scroller = new IScroll(id, {snap: true, momentum: true, hScrollbar: false, vScrollbar: true, lockDirection: true,
            onAnimationEnd: function(){
                if (!restoring) {
                    // Store details of the current position on the page.
                    if (pages[currentPage]) {
                        pages[currentPage].y = (page_scrollers[currentPage]).scroller.y;
                        pages[currentPage].height = (page_scrollers[currentPage]).scroller.scrollerH;
                        utility.storage(identifier, 'pages', pages);
                    }
                }
            }
        });
        var pages_previous = utility.storage(identifier, 'pages') || [];
        if (!pages_previous[page_scrollers.length]) {
            pages_previous[page_scrollers.length] = {x: 0, y: 0};
        }
        utility.storage(identifier, 'pages', pages_previous);
        page_scrollers.push({file: file, scroller: page_scroller});

        // Capture clicks so we can update the scroll position.
        // jQuery is not too good with selectors containing periods, so esacape them.
        $('#' + file.replace(/\./, '\\.')).on('click', function() {
            file = this.id.replace(/_/, '.');

            // Firstly, find the page scroller from our collection that is keyed to our page.
            var page_scroller = (_.filter(page_scrollers, function(scroller) {
                return scroller.file === file;
            }))[0];

            // Redraw the page scroller layout, as the click may have resulted in
            // the size of the page changing.
            // We leave this a second to let any animations complete.
            setTimeout(function(){
                try {
                    update(page_scroller.scroller);
                } catch (e) {
                }
            }, 1000);
        });

        // Capture clicks on buttons so we can update the scroll position.
        $('#' + file.replace(/\./, '\\.') + ' button').on('click', function() {
            file = $(this).parents('.readkit-page').attr('id').replace(/_/, '.');

            // Firstly, find the page scroller from our collection that is keyed to our page.
            var page_scroller = (_.filter(page_scrollers, function(scroller) {
                return scroller.file === file;
            }))[0];

            // Redraw the page scroller layout, as the click may have resulted in
            // the size of the page changing.
            // We leave this a second to let any animations complete.
            setTimeout(function(){
                try {
                    update(page_scroller.scroller);
                } catch (e) {
                }
            }, 1000);
        });

        // Capture clicks on anchors so we can update the scroll position.
        $('#' + file.replace(/\./, '\\.') + ' a').on('click', function(event) {
            trap_anchor(this, event);
        });

        update(page_scroller);
    };

    var trap_anchor = function(that, event) {
        if ( $(that).attr('rel') === 'external' ) {
            // Let clicks on anchors with rel="external" resolve as normal.
        } else {
            event.preventDefault();

            // Using window.location causes a few problems:
            // * we end up with the url fragment in the address bar
            // * iScroll doesn't recognise that the horizontal position has changed
            //   and therefore won't let us page back to the beginning.
            //
            //window.location = $(that).attr('href');
            //setTimeout(function () {
            //    update(book_scroller);
            //}, 0);

            var matches = that.href.match(/^.*#(.*?(?:__(.*?))?)(\?.*)?$/);
            // http://localhost:8000/#ch04.xhtml => [
            //   "http://localhost:8000/#ch04.xhtml",
            //   "ch04.xhtml",
            //   "ch04.xhtml"
            // ]
            //
            // http://localhost:8000/#ch04.xhtml__epub_3_best_practices_teaser => [
            //   "http://localhost:8000/#ch04.xhtml__epub_3_best_practices_teaser",
            //   "ch04.xhtml__epub_3_best_practices_teaser",
            //   "ch04.xhtml"
            //   "?showVideo=true"
            // ]
            var page_anchor = matches[1];
            var anchor = matches[2];
            var query_String = matches[3];

            // We have to use the book_scroller to scroll horizontally to the page...
            // and then callback to the page scroller to scroll vertically to the desired part of the page.

            // Firstly, find the page scroller from our collection that is keyed to our page.
            var filtered_page_scrollers = _.filter(page_scrollers, function(scroller) {
                // We may have a page_anchor = 'section-0001.html' and a scroller.file = 'Text_section-0001.html'
                // (the prefix being the path to the file as per the content.opf href, with '_' instead of '/'),
                // so, in this case, we want to determine if /section-0001.html/.test("Text_section-0001.html").
                var re = new RegExp(page_anchor + '$');
                return re.test(scroller.file);
            });

            if (filtered_page_scrollers.length === 0) {
                filtered_page_scrollers = _.filter(page_scrollers, function(scroller) {
                    // Find the pagescroller with the page containing the id matching our anchor.
                    return scroller.file === $('[id="' + page_anchor + '"]').parents('.readkit-page').attr('id');
                });
            }

            if (filtered_page_scrollers.length === 0) {
                filtered_page_scrollers = _.filter(page_scrollers, function(scroller) {
                    // Find the pagescroller with the page containing the id matching our anchor.
                    return scroller.file === $('[id="' + page_anchor.replace(/\./, '_') + '"]').parents('.readkit-page').attr('id');
                });
            }

            if (filtered_page_scrollers.length !== 0) {
                var newPage;
                page_scrollers.every(function(page_scroller, i){
                    if (page_scroller.file === filtered_page_scrollers[0].file){
                        newPage = i;
                    }
                    return newPage !== i;
                });

                // Set the options in the book_scroller indicating that there is
                // a page-scroller waiting to be processed.
                book_scroller.options['page_scroller_waiting'] = filtered_page_scrollers[0];
//              book_scroller.options['page_scroller_anchor'] = anchor.replace(/\./, '_');
                book_scroller.options['page_scroller_anchor'] = page_anchor;

                // Call the book_scroller to scroll horizontally to the page.
                // Remember that book_scroller processes the options in the 'onAnimationEnd' callback.
                book_scroller.scrollToPage(newPage, 0, 0);

                var x = $(that).attr('data-x') || 0;
                var y = $(that).attr('data-y') || 0;

                if (y) {
                    (filtered_page_scrollers[0]).scroller.scrollTo(0, y, 0, 0);
                } else {
                    // Redraw the page scroller layout, as the click may have resulted in
                    // the size of the page changing.
                    // We leave this a second to let any animations complete.
                    setTimeout(function(){
                        update((filtered_page_scrollers[0]).scroller);
                    }, config.css_page_redraw_interval);
                }
            }
        }
    };

    // Restore our previous position in the layout
    var restore_bookmarks = function () {
        if (utility.storage(identifier, 'pages')) {
            pages = utility.storage(identifier, 'pages');

            var page = utility.storage(identifier, 'page'),
                y = 0;

            if (page && book_scroller.pagesX.length > page) {
                book_scroller.scrollToPage(page, 0, 0);
            }

            for (var i=0; i < pages.length; i++) {
                y = pages[i] ? (pages[i]).y : 0;
                if (page_scrollers[i] && (page_scrollers[i]).scroller) {
                    (page_scrollers[i]).scroller.scrollTo(0, y, 0, 0);
                }
            }

            if (page && page > 0) {
                y = pages[page] ? (pages[page]).y : 0;
                if (page_scrollers[page] && (page_scrollers[page]).scroller) {
                    (page_scrollers[page]).scroller.scrollTo(0, y, 0, 0);
                }
            }
        }
    };

    var body = function() {
        return $('body');
    };

    // Update our page layout after an orientation change
    $(function() {
        $(window).bind("orientationchange", update);
    });

    // Update our page layout after a window resize
    var resizeTimer;
    $(window).resize(function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(update, config.window_resize_interval);
    });

    var finalise = function() {

        // Add the schema.org microdata: http://schema.org/Book
        $('#readkit-pageScroller').attr('itemscope', '');
        $('#readkit-pageScroller').attr('itemtype', 'http://schema.org/Book');
        $('[itemprop="name"]').html(publication.title);
        $('[itemprop="author"]').html(publication.author);
        $('[itemprop="description"]').html(publication.description);
        $('[itemprop="publisher"]').html(publication.publisher);
        $('[itemprop="inLanguage"]').html(publication.language);
        $('[itemprop="copyrightHolder"]').html(publication.rights);

        // Ensure that we can scroll using keyboard in desktop browsers
        $(document).bind('keydown', 'home', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, 0, config.scroll_duration);
            }
        });

        $(document).bind('keydown', 'end', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.maxScrollY, config.scroll_duration);
            }
        });

        $(document).bind('keydown', 'pageup', function(){
            if (currentPage !== undefined) {
                var y = $((page_scrollers[currentPage]).scroller.wrapper).height();
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y + y, config.scroll_duration);
            }
        });

        $(document).bind('keydown', 'pagedown', function(){
            if (currentPage !== undefined) {
                var y = $((page_scrollers[currentPage]).scroller.wrapper).height();
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y - y, config.scroll_duration);
            }
        });

        $(document).bind('keydown', 'up', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y + 40, config.scroll_duration);
            }
        });

        $(document).bind('keydown', 'down', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y - 40, config.scroll_duration);
            }
        });

        $(document).bind('keydown', 'left', function(){
            var x = page_width;
            book_scroller.scrollTo(book_scroller.x + page_width, book_scroller.y, config.scroll_duration);
        });

        $(document).bind('keydown', 'right', function(){
            var x = page_width;
            book_scroller.scrollTo(book_scroller.x - page_width, book_scroller.y, config.scroll_duration);
        });

        $(document).bind('keydown', 'esc', function(){
            setTimeout(function () {
                $('.readkit-drag-upload-window').slideUp('slow');
                // close any open dropdowns
                $('.readkit-dropdown').slideUp('slow');
            }, 0);
        });

        // Notify any subscribers that the layout has been loaded.
        utility.publish('publication_loaded');
    };

    var location = function() {
        pages = utility.storage(identifier, 'pages');

        return {
            page:   currentPage,
            title:  publication.spine_entries.length && publication.spine_entries[currentPage] && publication.spine_entries[currentPage].title,
            file:   publication.spine_entries.length && publication.spine_entries[currentPage] && publication.spine_entries[currentPage].file,
            height: !pages || !pages.length ? 0 : pages[currentPage] ? pages[currentPage].height : page_scrollers[currentPage] && (page_scrollers[currentPage]).scroller.scrollerH,
            x:      $(book_scroller).length && $(book_scroller)[0].x,
            y:      !pages || !pages.length ? 0 : pages[currentPage] ? pages[currentPage].y : page_scrollers[currentPage] && (page_scrollers[currentPage]).scroller.y
        };
    };

    var nav = function () {
        return publication.nav_entries;
    };

    return (Layout);
});
