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
    'iscroll',
    'underscore'
], function($, iScroll, _){

    // Global vars
    var page_scrollers = [];
    var page_width = 0;
    var book_scroller = new iScroll('pageWrapper', {
        snap: true,
        snapThreshold:1,
        momentum: false,
        hScrollbar: true,
        vScrollbar: false,
        lockDirection: true,
        onAnimationEnd: function(){
            if (this.options['page_scroller_waiting']) {
                this.options['page_scroller_waiting'].scroller.scrollToElement($('[id="' + this.options['page_scroller_anchor'] + '"]')[0], 0);
                this.options['page_scroller_waiting'] = undefined;
                this.options['page_scroller_anchor'] = undefined;
            }
        }
    });

    // Function to redraw the layout after DOM changes.
    var update = function (page_scroller) {
        var currentPage = 0;

        if (page_width > 0) {
            currentPage = - Math.ceil( $('#pageScroller').position().left / page_width);
        }

        page_width = $('#pageWrapper').width();
        var pages = $('.page').length;
        $('#pageScroller').css('width', page_width * pages);
//        $('.page').css('width', page_width - 40);
        $('.page').css('width', page_width);
        book_scroller.refresh();
        if (page_scroller) {
            page_scroller.refresh();
        }
//        if (scroll && currentPage !== 0) {
//            book_scroller.scrollToPage(currentPage, 0, 0);
//        }
    };

    // Add a page
    var add = function (id, file, html) {
        $('#pageScroller').append('<div class="page" id="' + file + '"><div id="' + id + '" class="wrapper"><div class="scroller">' + html + '</div></div></div>');

        var page_scroller = new iScroll(id, {snap: true, momentum: true, hScrollbar: false, vScrollbar: true, lockDirection: true});
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
            file = $(this).parents('.page').attr('id').replace(/_/, '.');

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
            event.preventDefault();

            // Using window.location causes a few problems:
            // * we end up with the url fragment in the address bar
            // * iScroll doesn't recognise that the horizontal position has changed
            //   and therefore won't let us page back to the beginning.
            //
            //window.location = $(this).attr('href');
            //setTimeout(function () {
            //    update(book_scroller);
            //}, 0);

            var matches = this.href.match(/^.*#((.*?)(?:__.*)?)$/);
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

            // Next, set the options in the book_scroller indicating that there is
            // a page-scroller waiting to be processed.
            book_scroller.options['page_scroller_waiting'] = filtered_page_scrollers[0];
            book_scroller.options['page_scroller_anchor'] = anchor;

            // Call the book_scroller to in case we have to scroll horizontally to the page.
            // Book_scroller will callback to the function in the 'onAnimationEnd' option.
            book_scroller.scrollToElement($('[id="' + page_anchor + '"]')[0], 0);

            // Redraw the page scroller layout, as the click may have resulted in
            // the size of the page changing.
            // We leave this a second to let any animations complete.
            setTimeout(function(){
                update((filtered_page_scrollers[0]).scroller);
            }, 1000);
        });

        update(page_scroller);
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
            $('.header').css({'margin-top': '20px'});
        }
    };

    return {
        update: update,
        add: add,
        page_scrollers: page_scrollers,
        body: body,
        finalise: finalise
    };

});
