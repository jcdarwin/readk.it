/*
** chrome.js
**
** Author: Jason Darwin
**
** Functions to support Readk.it user interface customisation.
*/

define([
    'jquery',
    'zip/zip'
], function($, zip){

    var controller;
    var layout;
    var tag_names ='html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed,  figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video, button';

    /* Constructor */
    var Chrome = function (caller, surface) {
        controller = caller;
        layout = surface;

        // We wait until the publication is loaded into the layout
        // before activating the chrome.
        controller.subscribe('publication_loaded', initialiser);
    };

    function initialiser() {
        controller.subscribe('history_changed', check_backbutton);

        // Plugin to eliminate click delay on iOS
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
            $('.readkit-icon-serif').click();
        } else if (font == 'sans') {
            $('.readkit-icon-sans').click();
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
        if (_.isNumber(fontsize)) {
            $('#readkit-for-size').addClass('readkit-active');
            $('#readkit-pageWrapper').css('font-size', fontsize + 'px');
            $('.readkit-strength-size[data-size="' + fontsize + '"]')
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
        } else {
            // By default we use the publication styles.
            //$('.readkit-strength-size.readkit-small').removeClass('readkit-inactive').addClass('readkit-active');
        }

        // Check for stored line-height preference and apply accordingly.
        var lineheight = layout.storage('line-height');
        if (_.isNumber(lineheight)) {
            $('#readkit-for-lineheight').addClass('readkit-active');
            $('#readkit-pageWrapper')
                .find(tag_names)
                .css('line-height', lineheight);
            $('.readkit-strength-line-height[data-size="' + lineheight + '"]')
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
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

        // Remove site preloader
        $('#readkit-sitePreloader').delay(200).fadeOut(500, function() {
            /* refresh(); */
            $(this).remove();
        });
    }

    /* Register handlers. */

    // Setup our back button
    $('.readkit-back').click(function(){
        layout.go_back();
        check_backbutton();
    });

    function check_backbutton() {
        var history = layout.storage('history');
        var status = history && history.length ? 'readkit-active' : 'readkit-inactive';

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
    $('.readkit-icon-sans').click(function(){
        var y_percent = layout.location().y / layout.location().height;

        if ( $('.readkit-icon-sans').hasClass('readkit-active') ) {
            $('#readkit-pageWrapper')
                .find(tag_names)
                .removeClass('readkit-sans');
            $('.readkit-icon-sans').removeClass('readkit-active');

            layout.storage('font', []);
        } else {
            $('#readkit-pageWrapper')
                .find(tag_names)
                .addClass('readkit-sans')
                .removeClass('readkit-serif');
            $('.readkit-icon-serif').removeClass('readkit-active');
            $('.readkit-icon-sans').addClass('readkit-active');

            layout.storage('font', 'sans');
        }

        layout.refresh(y_percent, layout.location().page);
    });

    $('.readkit-icon-serif').click(function(){
        var y_percent = layout.location().y / layout.location().height;
        if ( $('.readkit-icon-serif').hasClass('readkit-active') ) {
            $('#readkit-pageWrapper')
                .find(tag_names)
                .removeClass('readkit-serif');
            $('.readkit-icon-serif').removeClass('readkit-active');

            layout.storage('font', []);
        } else {
            $('#readkit-pageWrapper').find(tag_names)
                .addClass('readkit-serif')
                .removeClass('readkit-sans');
            $('.readkit-icon-sans').removeClass('readkit-active');
            $('.readkit-icon-serif').addClass('readkit-active');

            layout.storage('font', 'serif');
        }

        layout.refresh(y_percent, layout.location().page);
    });

    // Fontsize event handlers
    // For some reason this handler always fires twice in certain browsers
    // (Firefox and Safari, but not Chrome) -- deal with it.
    var readkit_dropdown_size_ready = true;
    $('#readkit-for-size').on('click', function(e){
        if (readkit_dropdown_size_ready) {
            readkit_dropdown_size_ready = false;
            if ( $('#readkit-dropdown-size').is(':visible') ) {
                $('#readkit-dropdown-size').slideUp(600);
            } else {
                if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                    $('#readkit-dropdown-lineheight').slideUp();
                }
                if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                    $('#readkit-dropdown-bookmark').slideUp();
                }
                var value = layout.storage('font-size');
                $('.readkit-strength-size[data-size="' + value + '"]')
                    .removeClass('readkit-inactive')
                    .addClass('readkit-active');
                $('#readkit-dropdown-size').slideDown(600);
            }
        }

        setTimeout(function () {
            readkit_dropdown_size_ready = true;
        }, 700);
    });

    $('.readkit-strength-size').on('click', function(e){
        e.stopPropagation();
        var value = [];
        if ( $(this).hasClass('readkit-active') ) {
            $('.readkit-strength-size')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $('#readkit-pageWrapper').css('font-size', '');
            $('#readkit-for-size').removeClass('readkit-active');
        } else {
            $('.readkit-strength-size')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $(this)
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
            value = $(this).data('size');
            $('#readkit-pageWrapper').css('font-size', value + 'px');
            $('#readkit-for-size').addClass('readkit-active');
        }

        var y_percent = layout.location().y / layout.location().height;
        layout.refresh(y_percent, layout.location().page);
        layout.storage('font-size', value);

        setTimeout(function () {
            $('#readkit-dropdown-size').slideUp('slow');
        }, 700);

    });

    // Line-height event handlers
    // For some reason this handler always fires twice in certain browsers
    // (Firefox and Safari, but not Chrome) -- deal with it.
    var readkit_dropdown_lineheight_ready = true;
    $('#readkit-for-lineheight').on('click', function(){
        if (readkit_dropdown_lineheight_ready) {
            readkit_dropdown_lineheight_ready = false;
            if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                $('#readkit-dropdown-lineheight').slideUp(600);
            } else {
                if ( $('#readkit-dropdown-size').is(':visible') ) {
                    $('#readkit-dropdown-size').slideUp();
                }
                if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                    $('#readkit-dropdown-bookmark').slideUp();
                }
                var value = layout.storage('line-height');
                $('.readkit-strength-line-height[data-size="' + value + '"]')
                    .removeClass('readkit-inactive')
                    .addClass('readkit-active');
                $('#readkit-dropdown-lineheight').slideDown(600);
            }
        }

        setTimeout(function () {
            readkit_dropdown_lineheight_ready = true;
        }, 700);
    });

    $('.readkit-strength-line-height').on('click', function(e){
       e.stopPropagation();
       var value = [];
        if ( $(this).hasClass('readkit-active') ) {
            $('.readkit-strength-line-height')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $('#readkit-pageWrapper')
                .find(tag_names)
                .css('line-height', '');
            $('#readkit-for-lineheight').removeClass('readkit-active');
        } else {
            $('.readkit-strength-line-height')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $(this)
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
            value = $(this).data('size');
            $('#readkit-pageWrapper')
                .find(tag_names)
                .css('line-height', value);
            $('#readkit-for-lineheight').addClass('readkit-active');
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

    // For some reason this handler always fires twice in certain browsers
    // (Firefox and Safari, but not Chrome) -- deal with it.
    var readkit_dropdown_bookmark_ready = true;
    $('#readkit-for-bookmark').on('click', function(){
        if (readkit_dropdown_bookmark_ready) {
            readkit_dropdown_bookmark_ready = false;
            if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                $('#readkit-dropdown-bookmark').slideUp(600);
            } else {
                var value = layout.storage('font-bookmark');
                $('.readkit-strength-bookmark[data-size="' + value + '"]').addClass('readkit-active');
                if ( $('#readkit-dropdown-size').is(':visible') ) {
                    $('#readkit-dropdown-size').slideUp();
                }
                if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                    $('#readkit-dropdown-lineheight').slideUp();
                }

                var input = '<div class="readkit-bookmark-input"><input id="readkit-bookmark-input" type="text" data-file="' + layout.location().file + '" value="' + layout.location().title + '"><span class="readkit-bookmark-icon-add readkit-add-bookmark"><i class="icon-plus-circle readkit-bookmark-icon"></i></span></div>';
                var bookmarks = layout.storage('bookmarks') || [];

                if (bookmarks && bookmarks.length) {
                    $('#readkit-for-bookmark').addClass('active');
                }

                var html = '<div id="readkit-bookmark-list">';

                $.each(bookmarks, function(i, bookmark) {
                    html += '<div class="readkit-bookmark-list-item" style="margin-bottom:5px;"><span class="readkit-bookmark-icon-remove readkit-remove-bookmark"><i class="icon-minus-circle readkit-bookmark-icon" data-index="' + i + '"></i></span><p class="readkit-bookmark-title"><a href="#' + bookmark.file + '" data-x="' + bookmark.x + '" data-y="' + bookmark.y + '">' + bookmark.title + '</a></p></div>';
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
                    $('#readkit-dropdown-bookmark').slideUp(600);
                });

                $('#readkit-dropdown-bookmark').slideDown(600, function() {
                    setTimeout(function () {
                        bookmark_scroller.refresh();
                    }, 0);
                });
            }
        }

        setTimeout(function () {
            readkit_dropdown_bookmark_ready = true;
        }, 700);
    });

    $('#readkit-dropdown-bookmark').on('click', '.readkit-remove-bookmark', function(e){
        e.preventDefault();
        var index = $(this).data('index');

        var bookmarks = layout.storage('bookmarks') || [];
        bookmarks.splice(index,1);
        layout.storage('bookmarks', bookmarks);

        $(this).parent().remove();

        if (!(bookmarks && bookmarks.length)) {
            $('#readkit-for-bookmark').removeClass('readkit-active');
        }

    });

    $('#readkit-dropdown-bookmark').on('click', '.readkit-add-bookmark', function(e){
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

        html = '<div class="readkit-bookmark-list-item" style="margin-bottom:5px;"><span class="readkit-bookmark-icon-remove readkit-remove-bookmark"><i class="icon-minus-circle readkit-bookmark-icon" data-index="' + bookmarks.length + '"></i></span><p class="readkit-bookmark-title"><a href="#' + bookmark.file + '">' + bookmark.title + '</a></p></div>';

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

    $('.readkit-cancel_upload').on('click', function(e){
        e.stopPropagation();
        $('.greybox').slideUp('slow');
    });

    // The following more or less pinched from ibis.reader
    // At least some traces live on...
    var upload = {};
    upload.handle_drag_enter = function (e) {
        e.stopPropagation();
        e.preventDefault();
/*        greybox.hide("file-upload-window"); */
        $("#epub-drag-upload-status").text("");
        $("progress").attr("value", '0');
        $("#drag-upload-spinner").removeClass('loading').hide();

        $('.greybox').slideDown("drag-upload-window");
        var epub_drag_upload = $("#epub-drag-upload")[0];
        epub_drag_upload.addEventListener("drop", upload.prep_dropped_files_for_upload, false);
        epub_drag_upload.addEventListener("dragover", function (e) {
            e.stopPropagation();
            e.preventDefault();
        }, false);
    };

    upload.prep_dropped_files_for_upload = function (e) {
        e.stopPropagation();
        e.preventDefault();
        var filelist = e.dataTransfer.files;
        upload.upload_files(e, filelist);
        return false;
    };

    upload.upload_files = function (e, filelist) {
        var files = [];
        filelist = filelist || $("#id_epub")[0].files;
        if (filelist.length) {
            zip.workerScriptsPath = "js/lib/zip/";
                f = filelist[0];
                zip.createReader(new zip.BlobReader(f), function(zipReader){
                    zipReader.getEntries(function(entries){

                        $.when.apply(this, $.map(entries, function(entry) {
                            return $.Deferred(function(deferred_entry){

                                var suffix = entry.filename.lastIndexOf('.') === -1 ? '' : entry.filename.substr(entry.filename.lastIndexOf('.') + 1).toLowerCase();
                                if (['opf', 'xml', 'htm', 'html', 'xhtml', 'css', ''].indexOf(suffix) != -1) {
                                    // This is a text-like file that we need to load directly into the browser
                                    // so store as text.
                                    try {
                                        // There's an issue with zip.TextWriter failing silently in
                                        // Firefox; we have to supply 'utf-8', and also wrap it in
                                        // a try-catch block for good measure.
                                        // https://github.com/gildas-lormeau/zip.js/issues/58
                                        entry.getData(new zip.TextWriter('utf-8'), function(text){
                                            upload.progress(f, entry);
                                            console.log(entry.filename);
                                            deferred_entry.resolve(text);
                                        });
                                    } catch (e) {
                                        console.log('zip.TextWriter failure with ' + entry.filename + ': ' + e);
                                    }
                                } else {
                                    // Retrieve other files as blobs, i.e. don't uncompress them to text
                                    // as in a number of cases we'd simply have to recompress them
                                    // to display them (e.g. jpg) and that would be silly.
                                    entry.getData(new zip.BlobWriter(), function(blob){
                                        upload.progress(f, entry);
                                        console.log(entry.filename);
                                        deferred_entry.resolve(blob);
                                    });
                                }

                            }).done(function(value){
                                filename = entry.filename;
                                files[filename] = value;
                            });
                        })).done(function(){
                            upload.complete(100);
                            setTimeout(function () {
                                $('.greybox').slideUp('slow');
                            }, 0);
                            publication = controller.initialise('', files);
                        });
                    });

                }, upload.failed);
            $("#epub-drag-upload-label").css("opacity", "0.2");
            $("#epub-drag-upload-status").text("Uploading EPUB...");
            $("#drag-upload-spinner").show().addClass("loading");
            return false;
        }
    };

    var progress_total = 0;
    upload.progress = function (f, entry) {
        if (entry.compressedSize) {
            var progress_file = Math.round(entry.compressedSize * 100 / f.size);
            progress_total += progress_file;
            $("progress").attr("value", progress_total.toString());
            if (progress_total <= 99) {
                $("#epub-drag-upload-status").html("Unpacking EPUB...");
            }
        }
    };

    upload.complete = function (a) {
        $("progress").attr("value", a.toString());
        $("#epub-drag-upload-status").text("Opening EPUB...");
        $("#drag-upload-spinner").removeClass('loading').hide();
    };

    upload.failed = function (a) {
        upload.show_error_message(a.toString());
    };

    upload.cancelled = function (e) {
        h.debug("The upload has been canceled by the user or the browser dropped the connection.");
    };
/*    $("#id_epub").bind("change", upload.file_was_selected); */
    $("#epub-upload").bind("submit", upload.upload_files);
/*     if ("FileReader" in window && Modernizr.draganddrop) { */
    if ("FileReader" in window) {
        $("#epub-upload p").show();
        var drag_zone = $("#readkit-pageWrapper")[0];
        drag_zone.addEventListener("dragenter", upload.handle_drag_enter, false);
        var body = $("body")[0];
        body.addEventListener("dragover", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);
        body.addEventListener("drop", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);
    }

    if (
    ("standalone" in window.navigator) &&
    window.navigator.standalone
    ){
        // Account for the status bar on iOS when in stand-alone mode.
        // http://www.bennadel.com/blog/1950-Detecting-iPhone-s-App-Mode-Full-Screen-Mode-For-Web-Applications.htm
        $('.readkit-header').css({'margin-top': '20px'});
        $('#readkit-pageWrapper').css('top', '60px');
    }

    return (Chrome);
});