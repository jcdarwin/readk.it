/*
** chrome.js
**
** Author: Jason Darwin
**
** Functions to support readk.it user interface customisation.
*/

define([
    'jquery',
    'app/layout'
], function($, layout){

    /* Register handlers. */

    // Font style handlers
    $('.serif').click(function(){
        // Switch stylesheet from sans to serif (i.e. body text)
        // The trick here is to disable both stylsheets first,
        // and then enable the one we want.
        $('link[title=sans]')[0].disabled=true;
        $('link[title=serif]')[0].disabled=true;
        $('link[title=serif]')[0].disabled=false;
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
    });

    $('.sans').click(function(){
        // Switch stylesheet from serif to sans (i.e. body text)
        // The trick here is to disable both stylsheets first,
        // and then enable the one we want.
        $('link[title=serif]')[0].disabled=true;
        $('link[title=sans]')[0].disabled=true;
        $('link[title=sans]')[0].disabled=false;
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
    });

    // Fontsize event handlers
    $('#psize').on('change', function() {
        var elem = $(this).attr('id').split('size')[0];
        var value = $(this).val();
        $('html').css('font-size', value + 'px');
        $(this).next('span.value').text(value);
    });

    $('#psize').on('mouseup touchend', function() {
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
    });

    // Line-height event handlers
    $('#plh').on('change', function() {
        var elem = $(this).attr('id').split('lh')[0];
        var value = parseFloat($(this).val()).toFixed(2); // keeps the range to outputing two decimal places
        $('p,li,h1,h2,h3,h4,h5,button').css('line-height', $(this).val());
        $(this).next('span.value').text(value);
    });

    $('#plh').on('mouseup touchend', function() {
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
    });

    // Initialise online status indicator
    function check_status() {
        var status = navigator.onLine ? 'online' : 'offline';
        if ( status === 'online' ) {
            $('.status').removeClass('offline');
        } else {
            $('.status').removeClass('online');
        }
        $('.status').addClass(status);
    }

    // Determine whether we're running in webapp mode on iOS
    // http://www.bennadel.com/blog/1950-Detecting-iPhone-s-App-Mode-Full-Screen-Mode-For-Web-Applications.htm
    if (
    ("standalone" in window.navigator) &&
    !window.navigator.standalone
    ){
        $('.header').css('top', '20px');
    }

    // Check online status immediately, instead of waiting for the first setInterval
    check_status();

    // Check online status on a regular interval
    setInterval( check_status, 1000);
});