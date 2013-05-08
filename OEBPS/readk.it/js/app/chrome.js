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

    // We wait until the publication is loaded into the layout before
    // activating the chrome.
    layout.subscribe('publication_loaded', initialiser);

    function initialiser() {
        layout.subscribe('history_changed', check_backbutton);

        // Check for stored font preference and apply accordingly.
        var font = layout.storage('font');
        if (font == 'serif') {
            $('.serif').click();
        } else if (font == 'sans') {
            $('.sans').click();
        }

        // Check for stored font-size preference and apply accordingly.
        var fontsize = layout.storage('font-size');
        if (fontsize) {
            $('html').css('font-size', fontsize + 'px');
            $('.strength-size[data-size="' + fontsize + '"]').removeClass('inactive').addClass('active');
        }

        // Check for stored line-height preference and apply accordingly.
        var lineheight = layout.storage('line-height');
        if (lineheight) {
            $('p,li,h1,h2,h3,h4,h5,button').css('line-height', lineheight);
            $('.strength-line-height[data-size="' + lineheight + '"]').removeClass('inactive').addClass('active');
        }

        // Check online status immediately, instead of waiting for the first setInterval
        check_status();

        // Check online status on a regular interval
        setInterval( check_status, 5000);

        // Check the backbutton status
        check_backbutton();
    }

    /* Register handlers. */

    // Setup our back button
    $('.back').click(function(){
        layout.go_back();
        check_backbutton();
    });

    function check_backbutton() {
        var history = layout.storage('history');
        var status = history && history.length ? 'active' : 'inactive';

        if (status == 'active') {
            $('.back').removeClass('inactive');
        } else {
            $('.back').removeClass('active');
        }
        $('.back').addClass(status);
    }

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

    // Fontsize event handlers
    $('#for-size').on('click', function(){
        if ( $('#dropdown-size').is(':visible') ) {
            $('#dropdown-size').slideUp('slow');
        } else {
            var value = layout.storage('font-size');
            $('.strength-size[data-size="' + value + '"]').removeClass('inactive').addClass('active');
            if ( $('#dropdown-lineheight').is(':visible') ) {
                $('#dropdown-lineheight').slideUp();
            }
            $('#dropdown-size').slideDown('slow');
        }
    });

    $('.strength-size').on('click', function(){
        $('.strength-size').removeClass('active').addClass('inactive');
        $(this).removeClass('inactive').addClass('active');

        var value = $(this).data('size');
        $('html').css('font-size', value + 'px');

        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);

        layout.storage('font-size', value);

        setTimeout(function () {
            $('#dropdown-size').slideUp('slow');
        }, 700);

    });

    // Line-height event handlers
    $('#for-lineheight').on('click', function(){
        if ( $('#dropdown-lineheight').is(':visible') ) {
            $('#dropdown-lineheight').slideUp('slow');
        } else {
            if ( $('#dropdown-size').is(':visible') ) {
                $('#dropdown-size').slideUp();
            }
            var value = layout.storage('line-height');
            $('.strength-line-height[data-size="' + value + '"]').removeClass('inactive').addClass('active');
            $('#dropdown-lineheight').slideDown('slow');
        }
    });

    $('.strength-line-height').on('click', function(){
        $('.strength-line-height').removeClass('active').addClass('inactive');
        $(this).removeClass('inactive').addClass('active');

        var value = $(this).data('size');
        $('p,li,h1,h2,h3,h4,h5,button').css('line-height', value);

        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);

        layout.storage('line-height', value);

        setTimeout(function () {
            $('#dropdown-lineheight').slideUp('slow');
        }, 700);
    });

    // Bookmark event handlers
    $('#for-bookmark').on('click', function(){
        if ( $('#dropdown-bookmark').is(':visible') ) {
            $('#dropdown-bookmark').slideUp('slow');
        } else {
            var value = layout.storage('font-bookmark');
            $('.strength-bookmark[data-size="' + value + '"]').removeClass('inactive').addClass('active');
            if ( $('#dropdown-size').is(':visible') ) {
                $('#dropdown-size').slideUp();
            }
            if ( $('#dropdown-lineheight').is(':visible') ) {
                $('#dropdown-lineheight').slideUp();
            }
            $('#dropdown-bookmark').html('');
            $('#dropdown-bookmark').append('<p style="width:260px;display:inline-block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">The text-overflow declaration allows you to deal with clipped text: that is, text that does not fit into its box.</p><span class="icon inactive" style="inline-block;width:24px;height:24px;border-radius:12px;margin-top:-20px;padding-top:0;"><i class="icon-plus"></i></span>');
            $('#dropdown-bookmark').slideDown('slow');
        }
    });

    $('.strength-bookmark').on('click', function(){
        $('.strength-bookmark').removeClass('active').addClass('inactive');
        $(this).removeClass('inactive').addClass('active');

        var value = '???';

        setTimeout(function () {
            $.each(layout.page_scrollers, function() {
                this.scroller.refresh();
            });
        }, 0);

        layout.storage('bookmark', value);

        setTimeout(function () {
            $('#dropdown-bookmark').slideUp('slow');
        }, 700);

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
     window.navigator.standalone
    ){
        $('#pageWrapper').css('top', '60px');
    }

});