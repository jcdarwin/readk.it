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
    var tag_names ='html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed,  figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video, button';

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

        //$('.readkit-back').noClickDelay();
        $('.readkit-status').noClickDelay();
        $('.readkit-serif').noClickDelay();
        $('.readkit-sans').noClickDelay();
        $('#readkit-for-size').noClickDelay();
        //$('.readkit-strength-size').noClickDelay();
        $('#readkit-for-lineheight').noClickDelay();
        //$('.readkit-strength-line-height').noClickDelay();
        $('#readkit-for-bookmark').noClickDelay();
        $('#readkit-bookmark-widget a').noClickDelay();
        //$('#readkit-pageWrapper').noClickDelay();

        // Check for stored font preference and apply accordingly.
        var font = layout.storage('font');
        if (font == 'serif') {
            $('.readkit-serif').click();
        } else if (font == 'sans') {
            $('.readkit-sans').click();
        } else {
            // By default we use the publication styles.
            $.each($('link[href$="serif.css"]'), function(i, link) {
                link.disabled=true;
            });
            $.each($('link[href$="sans.css"]'), function(i, link) {
                link.disabled=true;
            });
        }

        // Check for stored font-size preference and apply accordingly.
        var fontsize = layout.storage('font-size');
        if (fontsize.length) {
            $('#readkit-pageWrapper').css('font-size', fontsize + 'px');
            $('.readkit-strength-size[data-size="' + fontsize + '"]').removeClass('readkit-inactive').addClass('readkit-active');
        } else {
            // By default we use the publication styles.
            //$('.readkit-strength-size.readkit-small').removeClass('readkit-inactive').addClass('readkit-active');
        }

        // Check for stored line-height preference and apply accordingly.
        var lineheight = layout.storage('line-height');
        if (lineheight.length) {
            $('#readkit-pageWrapper').find(tag_names).css('line-height', lineheight);
            $('.readkit-strength-line-height[data-size="' + lineheight + '"]').removeClass('readkit-inactive').addClass('readkit-active');
        } else {
            // By default we use the publication styles.
            //$('.readkit-strength-line-height.readkit-small').removeClass('readkit-inactive').addClass('readkit-active');
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
    $('.readkit-back').click(function(){
        layout.go_back();
        check_backbutton();
    });

    function check_backbutton() {
        var history = layout.storage('history');
        var status = history.length ? 'readkit-active' : 'readkit-inactive';

        if (status == 'readkit-active') {
            $('.readkit-back').removeClass('readkit-inactive');
        } else {
            $('.readkit-back').removeClass('readkit-active');
        }
        $('.readkit-back').addClass(status);
    }

    $('.readkit-status').click(function(){
        document.location = $('.readkit-status a').attr('href');
    });

    // Font style handlers
    $('.readkit-sans').click(function(){
        var y_percent = layout.location().y / layout.location().height;

        if ( $('.readkit-sans').hasClass('readkit-active') ) {
            $.each($('link[href$="sans.css"]'), function(i, link) {
                link.disabled=true;
            });

            $('.readkit-sans').removeClass('readkit-active');

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
            $('.readkit-serif').removeClass('readkit-active');
            $('.readkit-sans').addClass('readkit-active');

            layout.storage('font', 'sans');
        }

        layout.refresh(y_percent, layout.location().page);
    });

    $('.readkit-serif').click(function(){
        var y_percent = layout.location().y / layout.location().height;
        if ( $('.readkit-serif').hasClass('readkit-active') ) {
            $.each($('link[href$="serif.css"]'), function(i, link) {
                link.disabled=true;
            });

            $('.readkit-serif').removeClass('readkit-active');

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

            $('.readkit-sans').removeClass('readkit-active');
            $('.readkit-serif').addClass('readkit-active');

            layout.storage('font', 'serif');
        }

        layout.refresh(y_percent, layout.location().page);
    });

    // Fontsize event handlers
    $('#readkit-for-size').on('click', function(){
        if ( $('#readkit-dropdown-size').is(':visible') ) {
            $('#readkit-dropdown-size').slideUp('slow');
        } else {
            var value = layout.storage('font-size');
            $('.readkit-strength-size[data-size="' + value + '"]').removeClass('readkit-inactive').addClass('readkit-active');
            if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                $('#readkit-dropdown-lineheight').slideUp();
            }
            if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                $('#readkit-dropdown-bookmark').slideUp();
            }
            $('#readkit-dropdown-size').slideDown('slow');
        }
    });

    $('.readkit-strength-size').on('click', function(e){
        e.stopPropagation();
        var value = [];
        if ( $(this).hasClass('readkit-active') ) {
            $('.readkit-strength-size').removeClass('readkit-active').addClass('readkit-inactive');
            $('html').css('font-size', '');
        } else {
            $('.readkit-strength-size').removeClass('readkit-active').addClass('readkit-inactive');
            $(this).removeClass('readkit-inactive').addClass('readkit-active');
            value = $(this).data('size');
            $('html').css('font-size', value + 'px');
        }

        var y_percent = layout.location().y / layout.location().height;
        layout.refresh(y_percent, layout.location().page);
        layout.storage('font-size', value);

        setTimeout(function () {
            $('#readkit-dropdown-size').slideUp('slow');
        }, 700);

    });

    // Line-height event handlers
    $('#readkit-for-lineheight').on('click', function(){
        if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
            $('#readkit-dropdown-lineheight').slideUp('slow');
        } else {
            if ( $('#readkit-dropdown-size').is(':visible') ) {
                $('#readkit-dropdown-size').slideUp();
            }
            if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                $('#readkit-dropdown-bookmark').slideUp();
            }
            var value = layout.storage('line-height');
            $('.readkit-strength-line-height[data-size="' + value + '"]').removeClass('readkit-inactive').addClass('readkit-active');
            $('#readkit-dropdown-lineheight').slideDown('slow');
        }
    });

    $('.readkit-strength-line-height').on('click', function(e){
       e.stopPropagation();
       var value = [];
        if ( $(this).hasClass('readkit-active') ) {
            $('.readkit-strength-line-height').removeClass('readkit-active').addClass('readkit-inactive');
            $('#readkit-pageWrapper').find(tag_names).css('line-height', '');
        } else {
            $('.readkit-strength-line-height').removeClass('readkit-active').addClass('readkit-inactive');
            $(this).removeClass('readkit-inactive').addClass('readkit-active');
            value = $(this).data('size');
            $('#readkit-pageWrapper').find(tag_names).css('line-height', value);
        }

        var y_percent = layout.location().y / layout.location().height;
        layout.refresh(y_percent, layout.location().page);
        layout.storage('line-height', value);

        setTimeout(function () {
            $('#readkit-dropdown-lineheight').slideUp('slow');
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
            $('#readkit-for-bookmark').addClass('readkit-active');
        } else {
            $('#readkit-for-bookmark').removeClass('readkit-active');
        }
    }

    $('#readkit-for-bookmark').on('click', function(){
        if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
            $('#readkit-dropdown-bookmark').slideUp('slow');
        } else {
            var value = layout.storage('font-bookmark');
            $('.readkit-strength-bookmark[data-size="' + value + '"]').addClass('readkit-active');
            if ( $('#readkit-dropdown-size').is(':visible') ) {
                $('#readkit-dropdown-size').slideUp();
            }
            if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                $('#readkit-dropdown-lineheight').slideUp();
            }

            var input = '<div class="readkit-bookmark-input"><input id="readkit-bookmark-input" type="text" data-file="' + layout.location().file + '" value="' + layout.location().title + '"><span class="readkit-icon readkit-bookmark-icon readkit-bookmark-icon-add readkit-active readkit-add-bookmark"><i class="icon-plus readkit-active"></i></span></div>';
            var bookmarks = layout.storage('bookmarks') || [];

            if (bookmarks.length) {
                $('#readkit-for-bookmark').addClass('active');
            }

            var html = '<div id="readkit-bookmark-list">';

            $.each(bookmarks, function(i, bookmark) {
                html += '<div class="readkit-bookmark-list-item" style="margin-bottom:5px;"><span class="readkit-icon readkit-bookmark-icon readkit-bookmark-icon-remove readkit-active readkit-remove-bookmark"><i class="icon-minus readkit-active" data-index="' + i + '"></i></span><p class="readkit-bookmark-title"><a href="#' + bookmark.file + '" data-x="' + bookmark.x + '" data-y="' + bookmark.y + '">' + bookmark.title + '</a></p></div>';
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

            html = input + '<div id="readkit-bookmark-widget" class="readkit-wrapper-bookmarks"><div class="readkit-scroller" style="width:280px;">' + html + '</div></div>';

            $('#readkit-dropdown-bookmark').html('');
            $('#readkit-dropdown-bookmark').append(html);

            var bookmark_scroller = new iScroll('readkit-bookmark-widget', {snap: true, momentum: true, hScroll: false, hScrollbar: false, vScrollbar: false, lockDirection: true,
                onAnimationEnd: function(){
                }
            });

            // Capture clicks on anchors so we can update the scroll position.
            $('#readkit-bookmark-widget a').on('click', function(event) {
                layout.trap_anchor(this, event);
                $('#readkit-dropdown-bookmark').slideUp('slow');
            });

            $('#readkit-dropdown-bookmark').slideDown('slow', function() {
                setTimeout(function () {
                    bookmark_scroller.refresh();
                }, 0);
            });
        }
    });

    $('.readkit-remove-bookmark').live('click', function(e){
        e.preventDefault();
        var index = $(this).data('index');

        var bookmarks = layout.storage('bookmarks') || [];
        bookmarks.splice(index,1);
        layout.storage('bookmarks', bookmarks);

        $(this).parent().remove();

        if (!bookmarks.length) {
            $('#readkit-for-bookmark').removeClass('readkit-active');
        }

    });

    $('.readkit-add-bookmark').live('click', function(e){
        e.preventDefault();
        $('#readkit-for-bookmark').addClass('readkit-active');

        var value = $('#readkit-bookmark-input').attr('value');
        var file = $('#readkit-bookmark-input').attr('data-file');
        var bookmarks = layout.storage('bookmarks') || [];

        var bookmark = {
            title: value,
            file: file,
            x: layout.location().x,
            y: layout.location().y
        };

        html = '<div class="readkit-bookmark-list-item" style="margin-bottom:5px;"><span class="readkit-icon readkit-bookmark-icon readkit-bookmark-icon-remove readkit-active readkit-remove-bookmark"><i class="icon-minus readkit-active" data-index="' + bookmarks.length + '"></i></span><p class="readkit-bookmark-title"><a href="#' + bookmark.file + '">' + bookmark.title + '</a></p></div>';

        $('#readkit-bookmark-list').append(html);

        bookmarks.push(bookmark);

        layout.storage('bookmarks', bookmarks);
    });

    // close any open dropdowns if the user clicks elsewhere
    $('#readkit-pageWrapper').on('click', function(){
        $('.readkit-dropdown').slideUp('slow');
    });

    // Initialise online status indicator
    function check_status() {
        var status = navigator.onLine ? 'readkit-online' : 'readkit-offline';
        if ( status === 'readkit-online' ) {
            $('.readkit-status').removeClass('readkit-offline');
        } else {
            $('.readkit-status').removeClass('readkit-online');
        }
        $('.readkit-status').addClass(status);
    }

    // Determine whether we're running in webapp mode on iOS
    // http://www.bennadel.com/blog/1950-Detecting-iPhone-s-App-Mode-Full-Screen-Mode-For-Web-Applications.htm
    if (
    ("standalone" in window.navigator) &&
     window.navigator.standalone){
        $('#readkit-pageWrapper').css('top', '60px');
    }

    return (Chrome);
});