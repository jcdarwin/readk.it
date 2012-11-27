/*
** layout.js
**
** Author: Jason Darwin
**
** Functions to support readk.it layout and navigation.
**
** Important concepts:
** * page: a scrolling div containing an entire epub html file
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
    var update = function () {

        var currentPage = 0;

        if (page_width > 0) {
            currentPage = - Math.ceil( $('#pageScroller').position().left / page_width);
        }

        page_width = $('#pageWrapper').width();
        var pages = $('.page').length;
        $('#pageScroller').css('width', page_width * pages);
        $('.page').css('width', page_width - 40);
        iscroll.refresh();
        iscroll.scrollToPage(currentPage, 0, 0);
    };

    // Function to add a page
    var add = function (id, html) {
        $('#pageScroller').append('<div class="page"><div id="' + id + '" class="wrapper"><div class="scroller">' + html + '</div></div></div>');
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
