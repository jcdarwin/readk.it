/*
** layout.js
**
** Author: Jason Darwin
**
** Functions to support readk.it layout and navigation.
**
** Important concepts:
** * page: a scrolling div containing an entire epub html file (i.e. chapter)
** * book_scroller: an encompassing iScroll container, within which lives all
**   the pages
** * page_scroller: an iScroll container around each page
*/

define([
    'jquery',
    'jquery.storage',
    'iscroll',
    'underscore',
    'jquery.hotkeys'
], function($, $storage, iScroll, _, $hotkeys){

    var page_scrollers = [];
    var pages = [];
    var page_width = 0;
    var currentPage = 0;
    var restoring = true;
    var publication = {};
    var controller;

    /* Constructor */
    var Layout = function (caller, pub) {
        controller = caller;
        publication = pub;
//storage('pages', []);
storage('font-size', []);
        return {
            refresh: refresh,
            update: update,
            add: add,
            trap_anchor: trap_anchor,
            storage: storage,
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

    var book_scroller = new iScroll('readkit-pageWrapper', {
        snap: true,
        snapThreshold:1,
        momentum: false,
        hScrollbar: true,
        vScrollbar: false,
        lockDirection: true,
        onAnimationEnd: function(){
            // Store details of the page we're on
            if (page_width > 0) {
                currentPage = - Math.ceil( $('#readkit-pageScroller').position().left / page_width);
            }

            if (this.options['page_scroller_waiting']) {
                this.options['page_scroller_waiting'].scroller.scrollToElement($('[id="' + this.options['page_scroller_anchor'] + '"]')[0], 0);
                this.options['page_scroller_waiting'] = undefined;
                this.options['page_scroller_anchor'] = undefined;

                if (storage('page') != currentPage) {
                    if (storage('history')) {
                        var history = storage('history');
                        history.push(storage('page'));
                        storage('history', history);
                    } else {
                        storage('history', [storage('page')]);
                    }
                    // Notify any subscribers that the history has changed.
                    controller.publish('history_changed');
                }
            }

            storage('page', currentPage);

            var pages_previous = storage('pages') || [];
            if (pages_previous[currentPage]) {
                pages_previous[currentPage].x = $(book_scroller)[0].x;
            }
            storage('pages', pages_previous);
        }
    });

    // Function to redraw the layout after DOM changes.
    var refresh = function (y_percent, page) {
        setTimeout(function () {
            $.each(page_scrollers, function(i) {
                this.scroller.refresh();
                if ( ! (y_percent === undefined && page === undefined) ) {
                    if (i == page) {
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
//        $('.readkit-page').css('width', page_width - 40);
        $('.readkit-page').css('width', page_width);
        book_scroller.refresh();
        if (page_scroller) {
            page_scroller.refresh();
        }
//        if (scroll && currentPage !== 0) {
//            book_scroller.scrollToPage(currentPage, 0, 0);
//        }
    };

    // Local / session / cookie storage
    var storage = function (key, value) {
        var pub = $.localStorage(publication.identifier) || [];

        if (value) {
            var entry = {};
            entry[key] = value;
            // filter out any existing entries with the supplied key.
            pub = pub.filter(function (item) {
                if (!item[key]) {
                    return true;
                }
            });
            pub.push(entry);
            return $.localStorage(publication.identifier, pub);
        } else {
            pub = pub.filter(function (item) {
                if (item[key]) {
                    return true;
                }
            });
            if (pub.length > 0) {
                return pub[0][key];
            } else {
                return null;
            }
        }
    };

    // Revisit the last entry in the history.
    var go_back = function () {
        var history = storage('history');

        if (history.length) {
            var page = history.pop();

            book_scroller.scrollToPage(page, 0, 0);

            storage('history', history);
        }
    };

    // Add a page
    var add = function (id, file, html) {
        $('#readkit-pageScroller').append('<div class="readkit-page" id="' + file + '"><div id="' + id + '" class="readkit-wrapper"><div class="readkit-scroller"><div class="readkit-margins">' + html + '</div></div></div></div>');

        var page_scroller = new iScroll(id, {snap: true, momentum: true, hScrollbar: false, vScrollbar: true, lockDirection: true,
            onAnimationEnd: function(){
                if (!restoring) {
                    // Store details of the current position on the page.
                    if (pages[currentPage]) {
                        pages[currentPage].y = (page_scrollers[currentPage]).scroller.y;
                        pages[currentPage].height = (page_scrollers[currentPage]).scroller.scrollerH;
                        storage('pages', pages);
                    }
                }
            }
        });
        var pages_previous = storage('pages') || [];
        if (!pages_previous[page_scrollers.length]) {
            pages_previous[page_scrollers.length] = {x: 0, y: 0};
        }
        storage('pages', pages_previous);
        page_scrollers.push({file: file, scroller: page_scroller});

        // Capture clicks so we can update the scroll position.
        $('#' + id).on('click', function(event) {

            file = this.id.replace(/_/, '.');

            // Firstly, find the page scroller from our collection that is keyed to our page.
            var filtered_page_scrollers = _.filter(page_scrollers, function(scroller) {
                return scroller.file == file;
            });

            // Redraw the page scroller layout, as the click may have resulted in
            // the size of the page changing.
            // We leave this a second to let any animations complete.
            setTimeout(function(){
                try {
                    update((filtered_page_scrollers[0]).scroller);
                } catch (e) {
                }
            }, 1000);
        });

        // Capture clicks on buttons so we can update the scroll position.
        $('#' + id + ' button').on('click', function(event) {
            file = $(this).parents('.readkit-page').attr('id').replace(/_/, '.');

            // Firstly, find the page scroller from our collection that is keyed to our page.
            var filtered_page_scrollers = _.filter(page_scrollers, function(scroller) {
                return scroller.file == file;
            });

            // Redraw the page scroller layout, as the click may have resulted in
            // the size of the page changing.
            // We leave this a second to let any animations complete.
            setTimeout(function(){
                update((filtered_page_scrollers[0]).scroller);
            }, 1000);
        });

        // Capture clicks on anchors so we can update the scroll position.
        $('#' + id + ' a').on('click', function(event) {
            trap_anchor(this, event);
        });

        update(page_scroller);
    };

    var trap_anchor = function(that, event) {
        if ( $(that).attr('rel') == 'external' ) {
            // Let clicks on anchors with rel="external" act as normal.
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

            var matches = that.href.match(/^.*#((.*?)(?:__.*)?)$/);
            // http://localhost:8000/#ch04.xhtml                               => ["http://localhost:8000/#ch04.xhtml", "ch04.xhtml", "ch04.xhtml"]
            // http://localhost:8000/#ch04.xhtml__epub_3_best_practices_teaser => ["http://localhost:8000/#ch04.xhtml__epub_3_best_practices_teaser", "ch04.xhtml__epub_3_best_practices_teaser", "ch04.xhtml"]
            var anchor = matches[1];
            var page_anchor = matches[2];

            // We have to use the book_scroller to scroll horizontally to the page...
            // and then callback to the page scroller to scroll vertically to the desired part of the page.

            // Firstly, find the page scroller from our collection that is keyed to our page.
            var filtered_page_scrollers = _.filter(page_scrollers, function(scroller) {
                return scroller.file == page_anchor;
            });

            if (filtered_page_scrollers.length === 0) {
                filtered_page_scrollers = _.filter(page_scrollers, function(scroller) {
                    // Find the pagescroller with the page containing the id matching our anchor.
                    return scroller.file == $('[id="' + page_anchor + '"]').parents('.readkit-page').attr('id');
                });
            }

            var newPage;
            page_scrollers.every(function(page_scroller, i){
                if (page_scroller.file == filtered_page_scrollers[0].file){
                    newPage = i;
                }
                return newPage != i;
            });

            // Set the options in the book_scroller indicating that there is
            // a page-scroller waiting to be processed.
            book_scroller.options['page_scroller_waiting'] = filtered_page_scrollers[0];
            book_scroller.options['page_scroller_anchor'] = anchor;

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
                }, 1000);
            }
        }
    };

    // Restore our previous position in the layout
    var restore_bookmarks = function () {
        if (storage('pages')) {
            pages = storage('pages');

            var page = storage('page'),
                y = 0;

            if (page && book_scroller.pagesX.length > page) {
                book_scroller.scrollToPage(page, 0, 0);
            }

            for (var i=0; i < pages.length; i++) {
                y = pages[i] ? (pages[i]).y : 0;
                if (page_scrollers[i]) {
                    (page_scrollers[i]).scroller.scrollTo(0, y, 0, 0);
                }
            }

            if (page && page > 0) {
                y = pages[page] ? (pages[page]).y : 0;
                (page_scrollers[page]).scroller.scrollTo(0, y, 0, 0);
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
        resizeTimer = setTimeout(update, 100);
    });

    var finalise = function() {
        if (
        ("standalone" in window.navigator) &&
        window.navigator.standalone
        ){
            // Account for the status bar on iOS when in stand-alone mode.
            // http://www.bennadel.com/blog/1950-Detecting-iPhone-s-App-Mode-Full-Screen-Mode-For-Web-Applications.htm
            $('.readkit-header').css({'margin-top': '20px'});
        }

        // Ensure that we can scroll using keyboard in desktop browsers
        $(document).bind('keydown', 'home', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, 0, 200);
            }
        });

        $(document).bind('keydown', 'end', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.maxScrollY, 200);
            }
        });

        $(document).bind('keydown', 'pageup', function(){
            if (currentPage !== undefined) {
                var y = $((page_scrollers[currentPage]).scroller.wrapper).height();
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y + y, 200);
            }
        });

        $(document).bind('keydown', 'pagedown', function(){
            if (currentPage !== undefined) {
                var y = $((page_scrollers[currentPage]).scroller.wrapper).height();
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y - y, 200);
            }
        });

        $(document).bind('keydown', 'up', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y + 40, 200);
            }
        });

        $(document).bind('keydown', 'down', function(){
            if (currentPage !== undefined) {
                (page_scrollers[currentPage]).scroller.scrollTo(0, (page_scrollers[currentPage]).scroller.y - 40, 200);
            }
        });

        $(document).bind('keydown', 'left', function(){
            //if (currentPage > 0) {
                var x = page_width;
                book_scroller.scrollTo(book_scroller.x + page_width, book_scroller.y, 200);
            //}
        });

        $(document).bind('keydown', 'right', function(){
            //if (currentPage < pages.length) {
                var x = page_width;
                book_scroller.scrollTo(book_scroller.x - page_width, book_scroller.y, 200);
            //}
        });

        // Remove site preloader after site is loaded
        $('#readkit-sitePreloader').delay(200).fadeOut(500, function() {
            refresh();
            $(this).remove();
        });

        // Notify any subscribers that the layout has been loaded.
        controller.publish('publication_loaded');
    };

    var location = function() {
        pages = storage('pages');

        return {
            page:   currentPage,
            title:  publication.spine_entries[currentPage].title,
            file:   publication.spine_entries[currentPage].file,
            height: pages[currentPage] ? pages[currentPage].height : (page_scrollers[currentPage]).scroller.scrollerH,
            x:      $(book_scroller)[0].x,
            y:      pages[currentPage] ? pages[currentPage].y : (page_scrollers[currentPage]).scroller.y
        };
    };

    var nav = function () {
        return publication.nav_entries;
    };

    return (Layout);
});
