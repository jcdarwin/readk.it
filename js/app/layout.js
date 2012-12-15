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
    'iscroll'
], function($, iScroll){

    // Global vars
    var page_scrollers = [];
    var page_width = 0;
    var book_scroller = new iScroll('pageWrapper', {
        snap: true,
        momentum: false,
        hScrollbar: true,
        vScrollbar: false,
        lockDirection: true
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
        $('.page').css('width', page_width - 40);
        book_scroller.refresh();
        page_scroller.refresh();
//        if (scroll && currentPage !== 0) {
//            book_scroller.scrollToPage(currentPage, 0, 0);
//        }
    };

    // We need to override iScroll.scrollToElement as it doesn't
    // take into account the position of in-page elements
    // relative to the overall layour.
    book_scroller.scrollToElement = function (el, page, time) {
        var that = book_scroller, pos;
        el = el.nodeType ? el : that.scroller.querySelector(el);
        if (!el) return;

        if (el !== page) {
            pos = that._offset(page);
        } else {
            pos = that._offset(el);
        }
        pos.left += that.wrapperOffsetLeft;
        pos.top += that.wrapperOffsetTop;

        pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
        pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
        time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;

        that.scrollTo(pos.left, pos.top, time);
    };

    // Add a page
    var add = function (id, file, html) {
        $('#pageScroller').append('<div class="page" id="' + file + '"><div id="' + id + '" class="wrapper"><div class="scroller">' + html + '</div></div></div>');

        page_scroller = new iScroll(id, {snap: true, momentum: true, hScrollbar: false, vScrollbar: true, lockDirection: true});
        page_scrollers.push(page_scroller);

        // Capture clicks on anchors so we can update the scroll position
        $('#' + id + ' a').on('click', function(event) {
            event.preventDefault();
            //window.location = $(this).attr('href');
            //setTimeout(function () {
            //    update(book_scroller);
            //}, 0);
            var matches = this.href.match(/^.*#((.*?)(?:__.*)?)$/);
            var anchor = matches[1];
            var page_anchor = matches[2];
            book_scroller.scrollToElement($('[id="' + anchor + '"]')[0], $('[id="' + page_anchor + '"]')[0], 1000);
        });

        update(page_scroller);
    };

    var body = function() {
        return $('body');
    };

    $(function() {
        $(window).bind("orientationchange", update);
    });

    var finalise = function() {
    };

    return {
        update: update,
        add: add,
        page_scrollers: page_scrollers,
        body: body,
        finalise: finalise
    };

});
