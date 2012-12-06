/*
** layout.js
**
** Author: Jason Darwin
**
** Functions to support readk.it layout and navigation.
**
** Important concepts:
** * page: a scrolling div containing an entire epub html file (i.e. chapter)
*/

define([
    'jquery',
    'iscroll'
], function($, iScroll){

    // Global vars
    var scrollers = [];
    var page_width = 0;
    var iscroll = new iScroll('pageWrapper', {
        snap: true,
        momentum: false,
        hScrollbar: false,
        vScrollbar: false,
        lockDirection: true});

    // Function to redraw the layout after DOM changes.
    var update = function (scroll) {

        var currentPage = 0;

        if (page_width > 0) {
            currentPage = - Math.ceil( $('#pageScroller').position().left / page_width);
        }

        page_width = $('#pageWrapper').width();
        var pages = $('.page').length;
        $('#pageScroller').css('width', page_width * pages);
        $('.page').css('width', page_width - 40);
        iscroll.refresh();
        if (scroll && currentPage !== 0) {
            iscroll.scrollToPage(currentPage, 0, 0);
        }
    };

    // Add a page
    var add = function (id, file, html) {
        $('#pageScroller').append('<div class="page" id="' + file + '"><div id="' + id + '" class="wrapper"><div class="scroller">' + html + '</div></div></div>');

        // Capture clicks on anchors so we can update the scroll position
        // only after the location changes.
        $('#' + id + ' a').on('click', function(event) {
            event.preventDefault();
            window.location = $(this).attr('href');
            update(false);
        });

        scrollers.push( new iScroll(id, {hScrollbar: false, vScrollbar: false, lockDirection: true }) );
        update();
    };

    var body = function() {
        return $('body');
    };

    $(function() {
        $(window).bind("orientationchange", update);
    });

    return {
        update: update,
        add: add,
        scrollers: scrollers,
        body: body
    };

});
