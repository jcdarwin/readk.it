/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

/*global define:false, console:false */
define([
    'jquery',
    'app/config',
    'sly'
], function($, config, sly){

    /* Constructor */
    var Controller = function (options, callback) {

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
                if($target.nodeType === 3) {
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

        $('button').noClickDelay();
        $('.read').noClickDelay();

        $.getJSON(options.manifest, function(data){
            $.each(data, function(index, value){
                console.log(value.name);

                // Load an entry for the publication into the library view
                if (config.solo) {
                    $('.frame .ul').append('<div class="li publication" data-url="solo/' + value.solo + '"><img src="' + value.cover + '" /></div>');
                } else {
                    $('.frame .ul').append('<div class="li publication" data-url="../index.html#' + encodeURIComponent('library/' + value.path) + '"><img src="' + value.cover + '" /></div>');
                }

            });

            /*global Sly */
            $(function ($) {
                'use strict';

                // ==========================================================================
                //   Header 
                // ==========================================================================
                var $library = $('#library');
                var $frame = $library.find('.frame'); window.frr = $frame;
                var sly = new Sly($frame, {
                    horizontal: 1,
                    itemNav: 'forceCentered',
                    activateMiddle: 1,
                    smart: 1,
                    activateOn: 'click',
                    mouseDragging: 1,
                    touchDragging: 1,
                    releaseSwing: 1,
                    startAt: 5,
                    scrollBar: $library.find('.scrollbar'),
                    scrollBy: 1,
                    pagesBar: $library.find('.pages'),
                    activatePageOn: 'click',
                    speed: 300,
                    moveBy: 600,
                    elasticBounds: 1,
                    dragHandle: 1,
                    dynamicHandle: 1,
                    clickBar: 1,

                    // Buttons
                    forward: $library.find('.forward'),
                    backward: $library.find('.backward'),
                    prev: $library.find('.prev'),
                    next: $library.find('.next'),
                    prevPage: $library.find('.prevPage'),
                    nextPage: $library.find('.nextPage')
                }).init();

                // Method calling buttons
                $library.on('click', 'button[data-action]', function () {
                    var action = $(this).data('action');
                    sly[action]();
                });
                $('#library .publication').on('click', function () {
                    $('#library .read .icon-book').hide();
                    $('#library .read .spinner').show();
                    $(this).css('opacity', '0.3');

                    $('#library .backward, #library .forward, #library .frame, #library .controls, #library .scrollbar').animate({opacity: '0'}, 500, function() {
                        var url = $('.active').data('url');
                        window.location = url;
                    });
                });
                $('#library .read').on('click', function () {
                    $('#library .read .icon-book').hide();
                    $('#library .read .spinner').show();
                    $(this).css('opacity', '0.3');

                    $('#library .backward, #library .forward, #library .frame, #library .controls, #library .scrollbar').animate({opacity: '0'}, 500, function() {
                        var url = $('.active').data('url');
                        window.location = url;
                    });
                });

                sly.on('change', function () {
                    var $buttonFirst = $library.find('.first');
                    var $buttonLast  = $library.find('.last');

                    var isStart = this.pos.dest <= this.pos.start;
                    var isEnd = this.pos.dest >= this.pos.end;

                    // Check whether Sly is at the start
                    $buttonFirst.prop('disabled', isStart);

                    // Check whether Sly is at the end
                    $buttonLast.prop('disabled', isEnd);
                });

                // Update our page layout after an orientation change
                $(function() {
                    $(window).bind("orientationchange", update);
                });

                function update () {
                    sly.reload();
                }
            });
         });

        callback();
    };

    return (Controller);
});
