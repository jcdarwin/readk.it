/*
** layout.js
**
** Author: Jason Darwin
**
** Functions to support readk.it layout and navigation.
*/

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
function updateLayout() {

    var currentPage = 0;

    if (page_width > 0) {
        currentPage = - Math.ceil( $('#pageScroller').position().left / page_width);
    }

    page_width = $('#pageWrapper').width();
    var pages =$('.page').length;
    $('#pageScroller').css('width', page_width * pages);
    $('.page').css('width', page_width - 40);
    iscroll.refresh();
    iscroll.scrollToPage(currentPage, 0, 0);
}


$(function() {
    $(window).bind("orientationchange", updateLayout);
});

