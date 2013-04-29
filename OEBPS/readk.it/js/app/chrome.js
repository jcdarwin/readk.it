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

    // Setup our back button
    $('.back').click(function(){
        layout.go_back();
        check_backbutton();
    });

    function check_backbutton() {
        var status = layout.storage('history').length ? 'active' : 'inactive';

        if (status == 'active') {
            $('.back').removeClass('inactive');
        } else {
            $('.back').removeClass('active');
        }
        $('.back').addClass(status);
    }

    layout.notifications('history_changed').subscribe(check_backbutton);

    // Font style handlers
    $('.serif').click(function(){
        // Switch stylesheet from sans to serif (i.e. body text)
        // The trick here is to disable both stylesheets first,
        // and then enable the one we want.
        $.each($('link[href$="sans.css"]'), function(i, link) {
            link.disabled=true;
        });
        $.each($('link[href$="serif.css"]'), function(i, link) {
            link.disabled=true;
        });
        $.each($('link[href$="serif.css"]'), function(i, link) {
            link.disabled=false;
        });
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
        layout.storage('font', 'serif');
    });

    $('.sans').click(function(){
        // Switch stylesheet from serif to sans (i.e. body text)
        // The trick here is to disable both stylesheets first,
        // and then enable the one we want.
        $.each($('link[href$="serif.css"]'), function(i, link) {
            link.disabled=true;
        });
        $.each($('link[href$="sans.css"]'), function(i, link) {
            link.disabled=true;
        });
        $.each($('link[href$="sans.css"]'), function(i, link) {
            link.disabled=false;
        });
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
        layout.storage('font', 'sans');
    });

    // Checked for stored font preference and apply accordingly.
    var font = layout.storage('font');
    if (font == 'serif') {
        $('.serif').click();
    } else if (font == 'sans') {
        $('.sans').click();
    }

    // Fontsize event handlers
    $('#psize').on('change', function() {
        var elem = $(this).attr('id').split('size')[0];
        var value = $(this).val();
        $('html').css('font-size', value + 'px');
        $(this).next('span.value').text(value);
        layout.storage('font-size', value);
    });

    $('#psize').on('mouseup touchend', function() {
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
    });

    // Checked for stored font-size preference and apply accordingly.
    var fontsize = layout.storage('font-size');
    if (fontsize) {
        $('html').css('font-size', fontsize + 'px');
        $('#psize').next('span.value').text(fontsize);
    }

    // Line-height event handlers
    $('#plh').on('change', function() {
        var elem = $(this).attr('id').split('lh')[0];
        var value = parseFloat($(this).val()).toFixed(2); // keeps the range to outputing two decimal places
        $('p,li,h1,h2,h3,h4,h5,button').css('line-height', $(this).val());
        $(this).next('span.value').text(value);
        layout.storage('line-height', value);
    });

    $('#plh').on('mouseup touchend', function() {
        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);
    });

    // Checked for stored line-height preference and apply accordingly.
    var lineheight = layout.storage('line-height');
    if (lineheight) {
        $('p,li,h1,h2,h3,h4,h5,button').css('line-height', lineheight);
        $('#plh').next('span.value').text(lineheight);
    }

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
     window.navigator.standalone
    ){
        $('#pageWrapper').css('top', '60px');
    }

    // Check online status immediately, instead of waiting for the first setInterval
    check_status();

    // Check online status on a regular interval
    setInterval( check_status, 1000);

    // Check the backbutton status
    check_backbutton();
});