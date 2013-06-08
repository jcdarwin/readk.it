/*
** chrome.js
**
** Author: Jason Darwin
**
** Functions to support readk.it user interface customisation.
*/

define([
    'jquery'
], function($){

    var controller;
    var layout;

    /* Constructor */
    var Chrome = function (caller, surface) {
        controller = caller;
        layout = surface;

        // We wait until the publication is loaded into the layout before
        // activating the chrome.
        controller.subscribe('publication_loaded', initialiser);
    };

    function initialiser() {
        controller.subscribe('history_changed', check_backbutton);

        // plugin to eliminate click delay on iOS
        // http://cubiq.org/remove-onclick-delay-on-webkit-for-iphone
        $.fn.noClickDelay = function() {
            var $wrapper = this;
            var $target = this;
            var moved = false;
            $wrapper.bind('touchstart mousedown',function(e) {
                e.preventDefault();
                moved = false;
                $target = $(e.target);
                if($target.nodeType == 3) {
                    $target = $($target.parent());
                }
                $target.addClass('pressed');
                $wrapper.bind('touchmove mousemove',function(e) {
                    moved = true;
                    $target.removeClass('pressed');
                });
                $wrapper.bind('touchend mouseup',function(e) {
                    $wrapper.unbind('mousemove touchmove');
                    $wrapper.unbind('mouseup touchend');
                    if(!moved && $target.length) {
                        $target.removeClass('pressed');
                        $target.trigger('click');
                        $target.focus();
                    }
                });
            });
        };

        //$('.back').noClickDelay();
        $('.status').noClickDelay();
        $('.serif').noClickDelay();
        $('.sans').noClickDelay();
        $('#for-size').noClickDelay();
        $('.strength-size').noClickDelay();
        $('#for-lineheight').noClickDelay();
        $('.strength-line-height').noClickDelay();
        $('#for-bookmark').noClickDelay();
        $('#bookmark-widget a').noClickDelay();
        //$('#pageWrapper').noClickDelay();

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
        } else {
            $('.strength-size.small').removeClass('inactive').addClass('active');
        }

        // Check for stored line-height preference and apply accordingly.
        var lineheight = layout.storage('line-height');
        if (lineheight) {
            $('p,li,h1,h2,h3,h4,h5,button').css('line-height', lineheight);
            $('.strength-line-height[data-size="' + lineheight + '"]').removeClass('inactive').addClass('active');
        } else {
            $('.strength-line-height.small').removeClass('inactive').addClass('active');
        }

        // Check online status immediately, instead of waiting for the first setInterval
        check_status();

        // Check online status on a regular interval
        setInterval( check_status, 5000);

        // Check the backbutton status
        check_backbutton();

        // Check the bookmarks status
        check_bookmarks();
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

    $('.status').click(function(){
        document.location = $('.status a').attr('href');
    });

    // Font style handlers
    $('.sans').click(function(){
        if ( $('.sans').hasClass('active') ) {
            $.each($('link[href$="sans.css"]'), function(i, link) {
                link.disabled=true;
            });

            $('.sans').removeClass('active');

            layout.storage('font', []);
        } else {
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
            $('.serif').removeClass('active');
            $('.sans').addClass('active');

            layout.storage('font', 'sans');
        }

        layout.refresh();
    });

    $('.serif').click(function(){
        if ( $('.serif').hasClass('active') ) {
            $.each($('link[href$="serif.css"]'), function(i, link) {
                link.disabled=true;
            });

            $('.serif').removeClass('active');

            layout.storage('font', []);
        } else {
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

            $('.sans').removeClass('active');
            $('.serif').addClass('active');

            layout.storage('font', 'serif');
        }

        layout.refresh();
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

    var repeat = function(value, times) {
        times = times || 1;
        return (new Array(times + 1)).join(value);
    };

    // Bookmark event handlers
    function check_bookmarks() {
        var bookmarks = layout.storage('bookmarks');

        if (bookmarks && bookmarks.length) {
            $('#for-bookmark').addClass('active');
        } else {
            $('#for-bookmark').removeClass('active');
        }
    }

    $('#for-bookmark').on('click', function(){
        if ( $('#dropdown-bookmark').is(':visible') ) {
            $('#dropdown-bookmark').slideUp('slow');
        } else {
            var value = layout.storage('font-bookmark');
            $('.strength-bookmark[data-size="' + value + '"]').addClass('active');
            if ( $('#dropdown-size').is(':visible') ) {
                $('#dropdown-size').slideUp();
            }
            if ( $('#dropdown-lineheight').is(':visible') ) {
                $('#dropdown-lineheight').slideUp();
            }

            var input = '<div class="bookmark-input"><input id="bookmark-input" type="text" data-file="' + layout.location().file + '" value="' + layout.location().title + '"><span class="icon bookmark-icon bookmark-icon-add active add-bookmark"><i class="icon-plus active"></i></span></div>';
            var bookmarks = layout.storage('bookmarks') || [];

            if (bookmarks.length) {
                $('#for-bookmark').addClass('active');
            }

            var html = '<div id="bookmark-list">';

            $.each(bookmarks, function(i, bookmark) {
                html += '<div class="bookmark-list-item" style="margin-bottom:5px;"><span class="icon bookmark-icon bookmark-icon-remove active remove-bookmark"><i class="icon-minus active" data-index="' + i + '"></i></span><p class="bookmark-title"><a href="#' + bookmark.file + '" data-x="' + bookmark.x + '" data-y="' + bookmark.y + '">' + bookmark.title + '</a></p></div>';
            });

            html += '</div><hr style="clear:both;" />';
            nav = '';
            $.each(layout.nav(), function(i, item) {
                if (item.title) {
                    nav += repeat('<ul style="margin-top:0; margin-bottom:0;">', item.depth + 1);
                    //nav += '<li><a href="#' + item.url.replace(/\./, '_') + '">' + item.title + '</a></li>';
                    nav += '<li><a href="#' + item.url + '">' + item.title + '</a></li>';
                    nav += repeat('</ul>', item.depth + 1);
                }
            });
            html += nav;

            html = input + '<div id="bookmark-widget" class="wrapper-bookmarks"><div class="scroller" style="width:280px;">' + html + '</div></div>';

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
                setTimeout(function () {
                    bookmark_scroller.refresh();
                }, 0);
            });
        }
    });

    $('.remove-bookmark').live('click', function(e){
        e.preventDefault();
        var index = $(this).data('index');

        var bookmarks = layout.storage('bookmarks') || [];
        bookmarks.splice(index,1);
        layout.storage('bookmarks', bookmarks);

        $(this).parent().remove();

        if (!bookmarks.length) {
            $('#for-bookmark').removeClass('active');
        }

    });

    $('.add-bookmark').live('click', function(e){
        e.preventDefault();
        $('#for-bookmark').addClass('active');

        var value = $('#bookmark-input').attr('value');
        var file = $('#bookmark-input').attr('data-file');
        var bookmarks = layout.storage('bookmarks') || [];

        var bookmark = {
            title: value,
            file: file,
            x: layout.location().x,
            y: layout.location().y
        };

        html = '<div class="bookmark-list-item" style="margin-bottom:5px;"><span class="icon bookmark-icon bookmark-icon-remove active remove-bookmark"><i class="icon-minus active" data-index="' + bookmarks.length + '"></i></span><p class="bookmark-title"><a href="#' + bookmark.file + '">' + bookmark.title + '</a></p></div>';

        $('#bookmark-list').append(html);

        bookmarks.push(bookmark);

        layout.storage('bookmarks', bookmarks);
    });

    // close any open dropdowns if the user clicks elsewhere
    $('#pageWrapper').on('click', function(){
        $('.dropdown').slideUp('slow');
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
     window.navigator.standalone){
        $('#pageWrapper').css('top', '60px');
    }

    return (Chrome);
});