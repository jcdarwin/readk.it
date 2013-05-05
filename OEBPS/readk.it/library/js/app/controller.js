/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

define([
    'jquery',
    'app/config',
    'sly.min'
], function($, config, sly){

    /* Constructor */
    var Controller = function (options, callback) {

        $.getJSON(options.manifest, function(data){
            $.each(data, function(index, value){
                console.log(value.name);

                // Load an entry for the publication into the library view
                //$('.frame .ul').append('<div class="li publication"><a href="../index.library.html#' + encodeURIComponent(value.path) + '"><img src="' + value.cover + '" /></a><h2><a href="../index.library.html#' + encodeURIComponent(value.path) + '" title="' + value.identifier + '">' + value.name + '</a></h2></div>');
                $('.frame .ul').append('<div class="li publication" data-url="../index.library.html#' + encodeURIComponent(value.path) + '"><img src="' + value.cover + '" /></div>');

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
                $('#library .read').on('click', function () {
                    var url = $('.active').data('url');
                    window.location = url;
                });
            });
                });

        callback();
    };

    return (Controller);
});
