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

            layout.refresh();
        }

        // Check for stored line-height preference and apply accordingly.
        var lineheight = layout.storage('line-height');
        if (lineheight) {
            $('p,li,h1,h2,h3,h4,h5,button').css('line-height', lineheight);
            $('.strength-line-height[data-size="' + lineheight + '"]').removeClass('inactive').addClass('active');

            layout.refresh();
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

        layout.refresh();
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

        layout.refresh();
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
            if ( $('#dropdown-bookmark').is(':visible') ) {
                $('#dropdown-bookmark').slideUp();
            }
            $('#dropdown-size').slideDown('slow');
        }
    });

    $('.strength-size').on('click', function(){
        $('.strength-size').removeClass('active').addClass('inactive');
        $(this).removeClass('inactive').addClass('active');

        var value = $(this).data('size');
        $('html').css('font-size', value + 'px');

        layout.refresh();
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
            if ( $('#dropdown-bookmark').is(':visible') ) {
                $('#dropdown-bookmark').slideUp();
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

        layout.refresh();
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

            var input = '<div style="margin-bottom:5px;"><input id="bookmark-input" type="text" value="' + layout.location().title + '"><span class="icon bookmark-icon bookmark-icon-add active add-bookmark"><i class="icon-plus active"></i></span></div>';
            var bookmarks = layout.storage('bookmarks') || [];

            if (bookmarks.length) {
                $('#for-bookmark').removeClass('inactive').addClass('active');
            }

            var html = '<div id="bookmark-list">';

            $.each(bookmarks, function(i, bookmark) {
                html += '<div><span class="icon bookmark-icon bookmark-icon-remove active remove-bookmark"><i class="icon-minus active" data-index="' + i + '"></i></span><p class="bookmark-title">' + bookmark.title + '</p></div>';
            });

            html += '</div><hr style="clear:both;" />';
            var nav = '<ul>';
            $.each(layout.nav(), function(i, item) {
                if (item.title) {
                    nav += '<li><a href="#' + item.url + '">' + item.title + '</a></li>';
                }
            });
            nav += '</ul>';
            html += nav;

            html = input + '<div id="bookmark-widget"><div class="scroller">' + html + '</div></div>';

            $('#dropdown-bookmark').html('');
            $('#dropdown-bookmark').append(html);

            var bookmark_scroller = new iScroll('bookmark-widget', {snap: true, momentum: true, hScroll: false, hScrollbar: false, vScrollbar: false, lockDirection: true,
                onAnimationEnd: function(){
                }
            });

            // Capture clicks on anchors so we can update the scroll position.
            $('#bookmark-widget a').on('click', function(event) {
                layout.trap_anchor(this, event);
                $('#dropdown-bookmark').slideUp('slow');
            });

            $('#dropdown-bookmark').slideDown('slow', function() {
                bookmark_scroller.refresh();
            });
        }
    });

    $('.remove-bookmark').live('click', function(){
        var index = $(this).data('index');

        var bookmarks = layout.storage('bookmarks') || [];

        bookmarks.splice(index,1);

        layout.storage('bookmarks', bookmarks);

        $(this).parent().remove();

        if (!bookmarks.length) {
            $('#for-bookmark').removeClass('active').addClass('inactive');
        }

    });

    $('.add-bookmark').live('click', function(){
        $('#for-bookmark').removeClass('inactive').addClass('active');

        var value = $('#bookmark-text').attr('value');
        var bookmarks = layout.storage('bookmarks') || [];

        var bookmark = {
            title: value,
            x: layout.location().x,
            y: layout.location().y
        };

        html = '<div><p>' + bookmark.title + '</p><i class="icon-minus active remove-bookmark" data-index="' + bookmarks.length + '"></i></span></div>';
        $('#bookmark-list').append(html);

        bookmarks.push(bookmark);

        layout.storage('bookmarks', bookmarks);

        setTimeout(function () {
            $('#dropdown-bookmark').slideUp('slow');
        }, 500);
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